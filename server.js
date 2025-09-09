require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

// Express setup
const app = express();
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.use(express.json());

// Routes
const authRoutes = require('./routes/authRoutes');
const homeRoutes = require('./routes/homeRoutes');
const searchRoutes = require('./routes/searchRoutes');
const dmRoutes = require('./routes/dmRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const profileRoutes = require('./routes/profileRoutes');
const suggestionRoutes = require('./routes/suggestionRoutes');
const streamRoomRoutes = require('./routes/streamRoomRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/dm', dmRoutes);
app.use('/api/notification', notificationRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/suggestions', suggestionRoutes);
app.use('/api/stream-rooms', streamRoomRoutes);

// Server + Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: 'http://localhost:5173', methods: ['GET', 'POST'] }
});

// Import socket handlers
require('./socket/chat')(io);
require('./socket/stream')(io);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
