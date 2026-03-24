const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
    user: {
        type: String, // Firebase UID
        ref: 'user'
    },
    title: {
        type: String,
        required: true
    },
    sportType: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    maxParticipants: {
        type: Number,
        required: true
    },
    participants: [
        {
            user: {
                type: String,
                ref: 'user'
            }
        }
    ],
    images: [
        {
            url: {
                type: String,
                required: true
            },
            public_id: {
                type: String,
                required: true
            },
            uploadedBy: {
                type: String,
                ref: 'user'
            },
            description: {
                type: String
            },
            uploadedAt: {
                type: Date,
                default: Date.now
            }
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('event', EventSchema);
