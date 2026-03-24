const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    _id: {
        type: String, // We use Firebase UID as the _id
        required: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        unique: true
    },
    age: {
        type: Number
    },
    gender: {
        type: String
    },
    profilePhoto: {
        type: String,
        default: 'https://ui-avatars.com/api/?name=User&background=random'
    },
    preferredSports: {
        type: [String],
        default: []
    },
    description: {
        type: String,
        default: ''
    },
    friends: [{
        type: String,
        ref: 'user'
    }],
    friendRequests: [{
        type: String,
        ref: 'user'
    }],
    blockedUsers: [{
        type: String,
        ref: 'user'
    }],
    mutedUsers: [{
        type: String,
        ref: 'user'
    }],
    date: {
        type: Date,
        default: Date.now
    }
});



module.exports = mongoose.model('user', UserSchema);
