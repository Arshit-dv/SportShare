const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
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
    password: {
        type: String,
        required: true
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
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    }],
    friendRequests: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    }],
    date: {
        type: Date,
        default: Date.now
    }
});



module.exports = mongoose.model('user', UserSchema);
