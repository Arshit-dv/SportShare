const express = require('express');
const router = express.Router();
const admin = require('../config/firebaseAdmin');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const User = require('../models/User');
const Event = require('../models/Event');


// @route   POST api/auth/register
// @desc    Register or Sync user from Firebase
// @access  Public (Expects x-auth-token in header)
router.post('/register', async (req, res) => {
    const { name, username, age, gender } = req.body;
    const token = req.header('x-auth-token');

    if (!token) return res.status(401).json({ msg: 'No token provided' });

    try {
        // Verify the Firebase ID Token
        const decodedToken = await admin.auth().verifyIdToken(token);
        const { uid, email } = decodedToken;

        let user = await User.findById(uid);

        if (user) {
            // Update existing user metadata if needed
            user.name = name || user.name;
            user.username = (username || user.username || '').trim();
            user.age = age || user.age;
            user.gender = gender || user.gender;
        } else {
            // Create new user record with Firebase UID as _id
            user = new User({
                _id: uid,
                name,
                email: email.toLowerCase().trim(),
                username: (username || '').trim(),
                age,
                gender
            });
        }

        await user.save();
        res.json(user);
    } catch (err) {
        console.error('Registration Error:', err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/auth/login
// @desc    Sync or Login user from Firebase
// @access  Public (Expects x-auth-token in header)
router.post('/login', async (req, res) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'No token provided' });

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        const { uid, email, name } = decodedToken; // Destructure name here for potential use in $setOnInsert
        let user = await User.findById(uid);
        if (user) {
            console.log(`👤 Found existing user in MongoDB: ${user.username}`);
        } else {
            console.log(`📡 User NOT found by ID: ${uid}. Creating new record for ${email}...`);
            // ATOMIC SYNC: Only set defaults if INSERTING (new user).
            user = await User.findOneAndUpdate(
                { _id: uid },
                { 
                    $set: { email: email ? email.toLowerCase().trim() : '' },
                    $setOnInsert: {
                        name: name || (email ? email.split('@')[0] : 'New User'),
                        username: email ? email.split('@')[0] + Math.floor(Math.random() * 1000) : 'user_' + uid.substring(0, 5),
                        age: 20, 
                        gender: 'Other'
                    }
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
        }

        res.json(user);
    } catch (err) {
        console.error('Login Error:', err.message);
        // If it still fails, it's because another user has that email. We MUST delete that ghost.
        if (err.message.includes('E11000')) {
             const { email } = await admin.auth().verifyIdToken(token);
             await User.deleteOne({ email: email.toLowerCase().trim() });
             return res.status(409).json({ msg: 'Database sync error. Please try logging in one more time.' });
        }
        res.status(500).send('Server error');
    }
});

// NOTE: Forgot password and internal password changes are now handled directly by Firebase on the frontend.
// These routes are now redundant but kept as skeletons if you need server-side logging.

// @route   GET api/auth/user
// @desc    Get logged in user
// @access  Private
router.get('/user', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select('-password')
            .populate('friends', 'name username profilePhoto')
            .populate('friendRequests', 'name username profilePhoto');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/auth/user/:id
// @desc    Get user by ID (Public info)
// @access  Private (or Public, but let's keep it Private for now as app is closed)
router.get('/user/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password -email')
            .populate('friends', 'name username profilePhoto')
            .populate('friendRequests', 'name username profilePhoto');
        if (!user) return res.status(404).json({ msg: 'User not found' });
        res.json(user);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'User not found' });
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [auth, upload.single('profilePhoto')], async (req, res) => {
    const { description, preferredSports } = req.body;

    // Build profile object
    const profileFields = {};
    if (description) profileFields.description = description;

    // Handle preferredSports - if it comes as a string (from FormData), split it
    if (preferredSports) {
        profileFields.preferredSports = typeof preferredSports === 'string'
            ? preferredSports.split(',').map(s => s.trim()).filter(s => s)
            : preferredSports;
    }

    if (req.file) {
        // With Cloudinary, req.file.path contains the full URL of the uploaded image
        profileFields.profilePhoto = req.file.path;
    } else if (req.body.removePhoto === 'true') {
        // User requested to remove photo - set to default
        profileFields.profilePhoto = 'https://ui-avatars.com/api/?name=User&background=random';
    } else if (req.body.profilePhoto) {
        // Allow updating via URL string if provided
        profileFields.profilePhoto = req.body.profilePhoto;
    }

    try {
        let user = await User.findById(req.user.id);

        if (!user) return res.status(404).json({ msg: 'User not found' });

        user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: profileFields },
            { new: true }
        ).select('-password');

        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/auth/change-password is now handled by Firebase frontend.

// Friend Request Routes

// @route   POST api/auth/friend-request/:id
// @desc    Send a friend request
// @access  Private
router.post('/friend-request/:id', auth, async (req, res) => {
    try {
        const recipient = await User.findById(req.params.id);
        const sender = await User.findById(req.user.id);

        if (!recipient) return res.status(404).json({ msg: 'User not found' });

        // Check if already friends
        if (sender.friends.includes(req.params.id)) {
            return res.status(400).json({ msg: 'Already friends' });
        }

        // Check if request already sent
        if (recipient.friendRequests.includes(req.user.id)) {
            return res.status(400).json({ msg: 'Request already sent' });
        }

        recipient.friendRequests.push(req.user.id);
        await recipient.save();

        res.json({ msg: 'Friend request sent' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/auth/friend-request/accept/:id
// @desc    Accept a friend request
// @access  Private
router.put('/friend-request/accept/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const sender = await User.findById(req.params.id);

        if (!sender) return res.status(404).json({ msg: 'User not found' });

        // Check if request exists
        if (!user.friendRequests.includes(req.params.id)) {
            return res.status(400).json({ msg: 'No pending request found' });
        }

        // Add to both users' friend lists
        user.friends.push(req.params.id);
        sender.friends.push(req.user.id);

        // Remove from friendRequests
        user.friendRequests = user.friendRequests.filter(id => id.toString() !== req.params.id);

        await user.save();
        await sender.save();

        res.json({ msg: 'Friend request accepted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/auth/friend-request/decline/:id
// @desc    Decline a friend request
// @access  Private
router.delete('/friend-request/decline/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        // Remove from friendRequests
        user.friendRequests = user.friendRequests.filter(id => id.toString() !== req.params.id);
        await user.save();

        res.json({ msg: 'Friend request declined' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/auth/friend/:id
// @desc    Add a friend
// @access  Private
router.put('/friend/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const friend = await User.findById(req.params.id);

        if (!friend) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Check if already friends
        if (user.friends.includes(req.params.id)) {
            return res.status(400).json({ msg: 'Already friends' });
        }

        // Add to both users' friend lists
        user.friends.push(req.params.id);
        friend.friends.push(req.user.id);

        await user.save();
        await friend.save();

        res.json(user.friends);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/auth/friend/:id
// @desc    Unfriend a user
// @access  Private
router.delete('/friend/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const friend = await User.findById(req.params.id);

        if (!friend) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Remove from both users' friend lists
        user.friends = user.friends.filter(fId => fId.toString() !== req.params.id);
        friend.friends = friend.friends.filter(fId => fId.toString() !== req.user.id);

        await user.save();
        await friend.save();

        res.json(user.friends);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/auth/account
// @desc    Delete user account and all related data
// @access  Private
router.delete('/account', auth, async (req, res) => {
    try {
        // 1. Delete events hosted by user
        await Event.deleteMany({ user: req.user.id });

        // 2. Remove user from participants list in all events
        await Event.updateMany(
            { 'participants.user': req.user.id },
            { $pull: { participants: { user: req.user.id } } }
        );

        // 3. Remove user from all other users' friend lists
        await User.updateMany(
            { friends: req.user.id },
            { $pull: { friends: req.user.id } }
        );

        // 4. Delete the user
        await User.findByIdAndDelete(req.user.id);

        res.json({ msg: 'Account and all related data deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});




module.exports = router;
