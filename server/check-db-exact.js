const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const checkPranav = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({ email: /pranav@gmail.com/i });
        if (user) {
            console.log('User found:');
            console.log('Email:', `"${user.email}"`);
            console.log('Username:', user.username);
        } else {
            console.log('User not found with regex');
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkPranav();
