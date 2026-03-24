const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Event = require('../models/Event');
const Message = require('../models/Message');

const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

/**
 * RESET DATABASE SCRIPT
 * This will clear all Users, Events, and Messages to start fresh with Firebase.
 */
const resetDB = async () => {
    try {
        console.log('⏳ Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected.');

        console.log('🗑️ Clearing Users...');
        await User.deleteMany({});
        
        console.log('🗑️ Clearing Events...');
        await Event.deleteMany({});

        console.log('🗑️ Clearing Messages...');
        await Message.deleteMany({});

        console.log('🎉 Database cleared successfully! You can now start with a clean Firebase slate.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error clearing database:', err.message);
        process.exit(1);
    }
};

resetDB();
