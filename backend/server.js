const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const IndexRoute = require("./routes/index")
const morgan = require("morgan")
const therapistRoutes = require('./routes/therapist');
const appointmentRoutes = require('./routes/appointment');
const chatRoutes = require('./routes/chat');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"))

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Socket.IO connection handler for chat
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Join a room for a user-to-therapist chat
    socket.on('joinRoom', ({ roomId }) => {
        socket.join(roomId);
        console.log(`Socket ${socket.id} joined room ${roomId}`);
    });

    // Handle sending a message
    socket.on('chatMessage', (data) => {
        // data: { roomId, senderId, receiverId, message, timestamp }
        io.to(data.roomId).emit('chatMessage', data); // Broadcast to room
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Routes
app.use('/', IndexRoute);
app.use('/therapist', therapistRoutes);
app.use('/appointment', appointmentRoutes);
app.use('/chat', chatRoutes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Handle memory leak warning
server.setMaxListeners(15); // Increase the listener limit