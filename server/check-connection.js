const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

console.log('--- Connection Test ---');
console.log('URI from .env:', process.env.MONGO_URI.replace(/:([^@]+)@/, ':****@')); // Hide password

mongoose.connect(process.env.MONGO_URI, { family: 4 })
    .then(() => {
        console.log('✅ Success! MongoDB Connected.');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Failed!');
        console.error(err);
        process.exit(1);
    });
