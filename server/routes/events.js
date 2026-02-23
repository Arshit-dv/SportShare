const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Event = require('../models/Event');
const User = require('../models/User');

// @route   POST api/events
// @desc    Create an event
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');

        const newEvent = new Event({
            title: req.body.title,
            sportType: req.body.sportType,
            description: req.body.description,
            location: req.body.location,
            date: req.body.date,
            maxParticipants: req.body.maxParticipants,
            user: req.user.id
        });

        const event = await newEvent.save();

        // Populate user details to return immediately
        await event.populate('user', 'name');

        res.json(event);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/events
// @desc    Get all events
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        // Sort by date (nearest first)
        const events = await Event.find().sort({ date: 1 }).populate('user', 'name');
        res.json(events);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/events/:id
// @desc    Delete an event
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ msg: 'Event not found' });
        }

        // Check user
        if (event.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        await event.deleteOne();

        res.json({ msg: 'Event removed' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Event not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/events/:id
// @desc    Update an event
// @access  Private
router.put('/:id', auth, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ msg: 'Event not found' });
        }

        // Check user
        if (event.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        // Check if event has ended
        if (new Date(event.date) < new Date()) {
            return res.status(400).json({ msg: 'Cannot edit past events' });
        }

        // Update fields
        const { title, sportType, description, location, date, maxParticipants } = req.body;

        if (title) event.title = title;
        if (sportType) event.sportType = sportType;
        if (description) event.description = description;
        if (location) event.location = location;
        if (date) event.date = date;
        if (maxParticipants) event.maxParticipants = maxParticipants;

        await event.save();

        // Populate user for consistency
        await event.populate('user', 'name');

        res.json(event);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/events/join/:id
// @desc    Join or Leave an event
// @access  Private
router.put('/join/:id', auth, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ msg: 'Event not found' });
        }

        // Check if event has ended
        if (new Date(event.date) < new Date()) {
            return res.status(400).json({ msg: 'Event has already ended' });
        }

        // Check if already joined
        if (event.participants.some(participant => participant.user.toString() === req.user.id)) {
            // Remove user (Leave)
            event.participants = event.participants.filter(
                ({ user }) => user.toString() !== req.user.id
            );
        } else {
            // Check max participants
            if (event.participants.length >= event.maxParticipants) {
                return res.status(400).json({ msg: 'Event is full' });
            }
            // Add user (Join)
            event.participants.unshift({ user: req.user.id });
        }

        await event.save();
        res.json(event.participants);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
