const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Event = require('./models/Event');

dotenv.config({ path: './.env' });

const resetUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...');

        await User.deleteMany({});
        await Event.deleteMany({});
        console.log('All users and events deleted.');

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

resetUsers();
