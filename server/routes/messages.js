const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Message = require('../models/Message');
const User = require('../models/User');

// @route   POST api/messages
// @desc    Send a message
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        const { receiverId, text } = req.body;
        
        const senderUser = await User.findById(req.user.id);
        const receiverUser = await User.findById(receiverId);

        if (senderUser.blockedUsers && senderUser.blockedUsers.includes(receiverId)) {
            return res.status(403).json({ msg: 'You have blocked this user' });
        }
        if (receiverUser.blockedUsers && receiverUser.blockedUsers.includes(req.user.id)) {
            return res.status(403).json({ msg: 'You are blocked by this user' });
        }

        const newMessage = new Message({
            sender: req.user.id,
            receiver: receiverId,
            recipient: receiverId, // handle legacy schemas for robust functionality
            text
        });

        const savedMessage = await newMessage.save();

        const onlineUsers = req.app.get('onlineUsers');
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
            req.io.to(receiverSocketId).emit('receiveMessage', savedMessage);
        }

        res.json(savedMessage);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/messages/conversations
// @desc    Get all conversations for a user
// @access  Private
router.get('/conversations', auth, async (req, res) => {
    try {
        const messages = await Message.find({
            $and: [
                { $or: [{ sender: req.user.id }, { receiver: req.user.id }, { recipient: req.user.id }] },
                { deletedBy: { $ne: req.user.id } }
            ]
        });

        const myUser = await User.findById(req.user.id);
        const mutedSet = new Set(myUser.mutedUsers ? myUser.mutedUsers.map(id => id.toString()) : []);
        const blockedSet = new Set(myUser.blockedUsers ? myUser.blockedUsers.map(id => id.toString()) : []);

        const conversationsMap = new Map();
        
        messages.forEach(msg => {
            const isSender = msg.sender.toString() === req.user.id;
            const receiverKey = msg.receiver ? msg.receiver.toString() : (msg.recipient ? msg.recipient.toString() : null);
            if (!receiverKey && !isSender) return;

            const partnerId = isSender ? receiverKey : msg.sender.toString();
            if (!partnerId) return;

            const msgDate = msg.createdAt ? new Date(msg.createdAt) : (msg.date ? new Date(msg.date) : new Date(0));
            
            if (!conversationsMap.has(partnerId)) {
                conversationsMap.set(partnerId, {
                    partnerId,
                    lastMessage: msg.text,
                    createdAt: msgDate,
                    unreadCount: 0,
                    isSender
                });
            } else {
                // Keep the latest message
                const existing = conversationsMap.get(partnerId);
                if (msgDate > existing.createdAt) {
                    existing.lastMessage = msg.text;
                    existing.createdAt = msgDate;
                    existing.isSender = isSender;
                }
            }
            
            // Count unread messages received by the user
            const isReceived = !isSender;
            if (isReceived && !msg.read) {
                // do not count unread messages from muted users
                if (!mutedSet.has(partnerId)) {
                    conversationsMap.get(partnerId).unreadCount += 1;
                }
            }
        });

        let conversationPartners = Array.from(conversationsMap.values());
        
        // Sort by date descending
        conversationPartners.sort((a, b) => b.createdAt - a.createdAt);

        // Fetch user info for partners
        for (let conv of conversationPartners) {
            conv.isMuted = mutedSet.has(conv.partnerId);
            conv.isBlocked = blockedSet.has(conv.partnerId);

            const user = await User.findById(conv.partnerId).select('name username profilePhoto');
            if (user) {
                conv.user = user;
            }
        }

        res.json(conversationPartners.filter(conv => conv.user));
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/messages/search/users
// @desc    Search users for new conversation
// @access  Private
router.get('/search/users', auth, async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) return res.json([]);
        const users = await User.find({
            $and: [
                { _id: { $ne: req.user.id } },
                { 
                    $or: [
                        { name: { $regex: query, $options: 'i' } },
                        { username: { $regex: query, $options: 'i' } }
                    ]
                }
            ]
        }).select('name username profilePhoto').limit(10);
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/messages/unread
// @desc    Get total unread messages count
// @access  Private
router.get('/unread', auth, async (req, res) => {
    try {
        const myUser = await User.findById(req.user.id);
        const count = await Message.countDocuments({
            $or: [{ receiver: req.user.id }, { recipient: req.user.id }],
            sender: { $nin: myUser.mutedUsers || [] }, // exclude muted senders
            read: false,
            deletedBy: { $ne: req.user.id }
        });
        res.json({ count });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/messages/:userId
// @desc    Get conversation and mark messages as read
// @access  Private
router.get('/:userId', auth, async (req, res) => {
    try {
        const messages = await Message.find({
            $and: [
                {
                    $or: [
                        { sender: req.user.id, receiver: req.params.userId },
                        { sender: req.params.userId, receiver: req.user.id },
                        { sender: req.user.id, recipient: req.params.userId },
                        { sender: req.params.userId, recipient: req.user.id }
                    ]
                },
                { deletedBy: { $ne: req.user.id } }
            ]
        });

        // sort in javascript by handling both text dates and DB dates
        messages.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt) : (a.date ? new Date(a.date) : 0);
            const dateB = b.createdAt ? new Date(b.createdAt) : (b.date ? new Date(b.date) : 0);
            return dateA - dateB; // ascending
        });

        // Mark unread messages as read (recipient handling)
        const unreadIds = [];
        messages.forEach(m => {
            const isReceived = m.receiver ? m.receiver.toString() === req.user.id : (m.recipient && m.recipient.toString() === req.user.id);
            if (isReceived && !m.read) {
                unreadIds.push(m._id);
            }
        });

        if (unreadIds.length > 0) {
            await Message.updateMany(
                { _id: { $in: unreadIds } },
                { $set: { read: true } }
            );
        }

        res.json(messages);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/messages/:userId
// @desc    Delete entire conversation with a user
// @access  Private
router.delete('/:userId', auth, async (req, res) => {
    try {
        await Message.updateMany({
            $or: [
                { sender: req.user.id, receiver: req.params.userId },
                { sender: req.params.userId, receiver: req.user.id },
                { sender: req.user.id, recipient: req.params.userId },
                { sender: req.params.userId, recipient: req.user.id }
            ]
        }, { $addToSet: { deletedBy: req.user.id } });

        // Clean up messages deleted by both users (array size >= 2)
        await Message.deleteMany({ "deletedBy.1": { $exists: true } });
        res.json({ msg: 'Conversation deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/messages/mute/:userId
// @desc    Toggle mute for a user
// @access  Private
router.post('/mute/:userId', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const targetId = req.params.userId;
        const isMuted = user.mutedUsers && user.mutedUsers.includes(targetId);
        
        if (isMuted) {
            user.mutedUsers = user.mutedUsers.filter(id => id.toString() !== targetId);
        } else {
            user.mutedUsers.push(targetId);
        }
        await user.save();
        res.json({ msg: isMuted ? 'User unmuted' : 'User muted', isMuted: !isMuted });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/messages/block/:userId
// @desc    Toggle block for a user
// @access  Private
router.post('/block/:userId', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const targetId = req.params.userId;
        const isBlocked = user.blockedUsers && user.blockedUsers.includes(targetId);
        
        if (isBlocked) {
            user.blockedUsers = user.blockedUsers.filter(id => id.toString() !== targetId);
        } else {
            user.blockedUsers.push(targetId);
        }
        await user.save();
        res.json({ msg: isBlocked ? 'User unblocked' : 'User blocked', isBlocked: !isBlocked });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
