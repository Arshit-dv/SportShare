const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    sender: {
        type: String, // Firebase UID
        ref: 'user',
        required: true
    },
    receiver: {
        type: String,
        ref: 'user',
        required: false
    },
    recipient: {
        type: String,
        ref: 'user',
        required: false
    },
    text: {
        type: String,
        required: true
    },
    read: {
        type: Boolean,
        default: false
    },
    date: {
        type: Date,
        default: Date.now
    },
    deletedBy: [{
        type: String,
        ref: 'user'
    }]
}, { timestamps: true });

module.exports = mongoose.model('Message', MessageSchema);
