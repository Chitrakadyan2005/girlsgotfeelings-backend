require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

// Express setup
const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL,      // deployed frontend
  "http://localhost:5173"      // local dev
];

app.use(cors({
  origin: function(origin, callback){
    if(!origin) return callback(null, true); // curl/Postman
    if(allowedOrigins.includes(origin)){
      callback(null, true); 
    } else {
      console.log("Blocked CORS request from:", origin);
      callback(null, false);
    }
  },
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));




app.use(express.json());

const authRoutes = require('./routes/authRoutes');
const homeRoutes = require('./routes/homeRoutes');
const searchRoutes = require('./routes/searchRoutes');
const dmRoutes = require('./routes/dmRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const profileRoutes = require('./routes/profileRoutes');
const suggestionRoutes = require('./routes/suggestionRoutes');
const streamRoomRoutes = require('./routes/streamRoomRoutes');
const moderationRoutes = require('./routes/moderationRoutes');
const botRoutes = require('./routes/botRoutes');
const communityRoute = require('./routes/communityRoutes');
const testRouter = require('./routes/test');

app.use('/api/auth', authRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/dm', dmRoutes);
app.use('/api/notification', notificationRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/suggestions', suggestionRoutes);
app.use('/api/stream-rooms', streamRoomRoutes);
app.use('/api/v1', moderationRoutes);
app.use('/api/community', communityRoute);
app.use('/api/bot',botRoutes);
app.use("/api", testRouter);

// Default route
app.get("/", (req, res) => {
  res.send("Backend is running");
});

// Server + Socket.io
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

require('./socket/chat')(io);
require('./socket/stream')(io);
const admin = require("./config/firebase");

console.log("Firebase Admin apps:", admin.apps.length);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
