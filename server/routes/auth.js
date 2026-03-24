const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
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

    // Email validation strictly required
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        return res.status(400).json({ msg: 'Please enter a valid email address' });
    }

    try {
        const normalizedEmail = email.toLowerCase().trim();
        let user = await User.findOne({ email: normalizedEmail });

        if (user) {
            if (user.isVerified) {
                 return res.status(400).json({ msg: 'User already exists' });
            }
            // User exists but not verified, proceed to update and resend OTP
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

        if (!user) {
            user = new User({
                name,
                email: normalizedEmail,
                password,
                username: username.trim(),
                age,
                gender,
                isVerified: false,
                otp,
                otpExpires
            });

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        } else {
            // Update unverified user details
            user.name = name;
            user.username = username.trim();
            user.age = age;
            user.gender = gender;
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
            user.otp = otp;
            user.otpExpires = otpExpires;
        }

        await user.save();

        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER || 'noreply@sportshare.com',
            to: normalizedEmail,
            subject: 'Verify your SportShare account',
            text: `Your OTP for account verification is: ${otp}`
        };

        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            try {
                await transporter.sendMail(mailOptions);
                res.json({ msg: 'Verification OTP sent to your email', requireOtp: true, email: normalizedEmail });
            } catch (err) {
                console.error('Email sending failed:', err.message);
                // Return exact error to help user debug App Password / Auth issues
                return res.status(500).json({ msg: 'Failed to send email. Check Nodemailer config: ' + err.message });
            }
        } else {
             console.log('--- EMAIL NOT SENT (Missing EMAIL_USER and EMAIL_PASS in .env) ---');
             console.log(`To: ${normalizedEmail}`);
             console.log(`OTP: ${otp}`);
             res.json({ msg: 'Verification OTP sent to console (missing credentials)', requireOtp: true, email: normalizedEmail });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/auth/verify-otp
// @desc    Verify OTP and complete registration
// @access  Public
router.post('/verify-otp', async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ msg: 'Please provide email and OTP' });
    }

    try {
        const user = await User.findOne({ email: email.toLowerCase().trim() });

        if (!user) return res.status(400).json({ msg: 'User not found' });
        if (user.isVerified) return res.status(400).json({ msg: 'User already verified' });

        if (user.otp !== otp) {
            return res.status(400).json({ msg: 'Invalid OTP' });
        }

        if (user.otpExpires < new Date()) {
            return res.status(400).json({ msg: 'OTP has expired' });
        }

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
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

// @route   POST api/auth/resend-otp
// @desc    Resend OTP to unverified user
// @access  Public
router.post('/resend-otp', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ msg: 'Email is required' });

    try {
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) return res.status(400).json({ msg: 'User not found' });
        if (user.isVerified) return res.status(400).json({ msg: 'User already verified' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

        user.otp = otp;
        user.otpExpires = otpExpires;
        await user.save();

        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER || 'noreply@sportshare.com',
            to: user.email,
            subject: 'Verify your SportShare account',
            text: `Your new OTP for account verification is: ${otp}`
        };

        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            try {
                await transporter.sendMail(mailOptions);
                res.json({ msg: 'A new OTP has been sent to your email' });
            } catch (err) {
                console.error('Email resend failed:', err.message);
                return res.status(500).json({ msg: 'Failed to send email. Check Nodemailer config: ' + err.message });
            }
        } else {
             console.log('--- EMAIL NOT SENT (Missing EMAIL_USER and EMAIL_PASS in .env) ---');
             console.log(`To: ${user.email}`);
             console.log(`OTP: ${otp}`);
             res.json({ msg: 'A new OTP has been generated (check console)' });
        }
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

    // Email validation strictly required
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        return res.status(400).json({ msg: 'Please enter a valid email address' });
    }

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

        if (!user.isVerified) {
            return res.status(400).json({ msg: 'Please verify your email first', requireOtp: true, email: user.email });
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

// @route   POST api/auth/forgot-password
// @desc    Generate a new password and send to email
// @access  Public
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ msg: 'Email is required' });

    try {
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) return res.status(400).json({ msg: 'User not found' });

        // Generate a random 8-character password
        const newPassword = Math.random().toString(36).slice(-8);

        // Hash and save the new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER || 'noreply@sportshare.com',
            to: user.email,
            subject: 'SportShare - New Password Generated',
            text: `You requested a password reset. Your new temporary password is: ${newPassword}\nPlease log in and change your password as soon as possible.`
        };

        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            try {
                await transporter.sendMail(mailOptions);
                res.json({ msg: 'A new password has been sent to your email' });
            } catch (err) {
                console.error('Email send failed:', err.message);
                return res.status(500).json({ msg: 'Failed to send email. Check Nodemailer config: ' + err.message });
            }
        } else {
             console.log('--- EMAIL NOT SENT (Missing EMAIL_USER and EMAIL_PASS in .env) ---');
             console.log(`To: ${user.email}`);
             console.log(`New Password: ${newPassword}`);
             res.json({ msg: 'A new password has been generated (check console)' });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
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

// @route   PUT api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', auth, async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ msg: 'Please provide both current and new passwords' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ msg: 'New password must be at least 6 characters' });
    }

    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Incorrect current password' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ msg: 'Password successfully updated' });
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
