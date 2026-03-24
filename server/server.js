const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

const onlineUsers = new Map();
app.set('onlineUsers', onlineUsers);

app.use((req, res, next) => {
    req.io = io;
    next();
});

io.on('connection', (socket) => {
    socket.on('join', (userId) => {
        onlineUsers.set(userId, socket.id);
    });

    socket.on('disconnect', () => {
        for (let [userId, socketId] of onlineUsers.entries()) {
            if (socketId === socket.id) {
                onlineUsers.delete(userId);
                break;
            }
        }
    });
});

// Database Connection
mongoose.connect(process.env.MONGO_URI, {
    family: 4 // Use IPv4
})
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => {
        console.error('❌ MongoDB Connection Error:');
        console.error(err.message);
    });

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/events', require('./routes/events'));
app.use('/api/messages', require('./routes/messages'));

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
