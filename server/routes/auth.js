const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const User = require('../models/User');
const Event = require('../models/Event');


// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', async (req, res) => {
    const { name, email, password, username, age, gender } = req.body;

    try {
        const normalizedEmail = email.toLowerCase().trim();
        let user = await User.findOne({ email: normalizedEmail });

        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        user = new User({
            name,
            email: normalizedEmail,
            password,
            username: username.trim(),
            age,
            gender
        });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: 360000 },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    // Note: Frontend sends 'username' field but it matches 'email' in our simplified schema for now, 
    // or we can treat username as email. Let's stick to email for robustness or adjust.
    // For this request: "name entered" usually implies name, but login is usually email/username.
    // Let's assume login is by Email for now based on Signup form having Email.
    // Wait, previous UI had Username field in Login. Let's support Email for login.

    // ADJUSTMENT: Login UI has "Username" label currently. 
    // To match Signup (Name, Email, Password), we should probably login with Email.
    // I will update the destructured variable to 'email' (mapped from username input) or expect 'email'.
    // Let's check what Frontend sends. Login.jsx sends { username, password }.
    // I will treat 'username' input as 'email' for simplicity or add username field to User model.
    // PROPOSAL: Let's use Email for login as it's in Signup. I'll handle 'username' from request as 'title', 
    // but check against email in DB.


    try {
        // Try to find user by email or username
        let user = await User.findOne({
            $or: [
                { email: email.toLowerCase().trim() },
                { username: email.trim() }
            ]
        });

        if (!user) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }


        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: 360000 },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

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
        profileFields.profilePhoto = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
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
