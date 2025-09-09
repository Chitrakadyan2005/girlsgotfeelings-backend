const express = require('express');
const router = express.Router();
const { jwtverify } = require('../middlewares/auth');

// In-memory storage for stream rooms (you can replace with database later)
const streamRooms = new Map();

// Create a new stream room
router.post('/', jwtverify, async (req, res) => {
  try {
    const { roomCode, roomName, createdBy } = req.body;
    
    if (!roomCode || !roomName || !createdBy) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if room code already exists
    if (streamRooms.has(roomCode)) {
      return res.status(409).json({ error: 'Room code already exists' });
    }

    const roomData = {
      roomCode,
      roomName,
      createdBy,
      createdAt: new Date(),
      participants: [createdBy],
      isActive: true
    };

    streamRooms.set(roomCode, roomData);

    res.status(201).json({
      message: 'Room created successfully',
      roomCode,
      roomName,
      createdBy
    });
  } catch (error) {
    console.error('Error creating stream room:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get room details by room code
router.get('/:roomCode', jwtverify, async (req, res) => {
  try {
    const { roomCode } = req.params;
    
    const roomData = streamRooms.get(roomCode);
    
    if (!roomData || !roomData.isActive) {
      return res.status(404).json({ error: 'Room not found or inactive' });
    }

    res.json({
      roomCode: roomData.roomCode,
      roomName: roomData.roomName,
      createdBy: roomData.createdBy,
      participantCount: roomData.participants.length,
      createdAt: roomData.createdAt
    });
  } catch (error) {
    console.error('Error fetching room details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Join a room (add participant)
router.post('/:roomCode/join', jwtverify, async (req, res) => {
  try {
    const { roomCode } = req.params;
    const { username } = req.body;
    
    const roomData = streamRooms.get(roomCode);
    
    if (!roomData || !roomData.isActive) {
      return res.status(404).json({ error: 'Room not found or inactive' });
    }

    // Add participant if not already in room
    if (!roomData.participants.includes(username)) {
      roomData.participants.push(username);
    }

    res.json({
      message: 'Joined room successfully',
      participantCount: roomData.participants.length
    });
  } catch (error) {
    console.error('Error joining room:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Leave a room (remove participant)
router.post('/:roomCode/leave', jwtverify, async (req, res) => {
  try {
    const { roomCode } = req.params;
    const { username } = req.body;
    
    const roomData = streamRooms.get(roomCode);
    
    if (!roomData) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Remove participant
    roomData.participants = roomData.participants.filter(p => p !== username);

    // If no participants left, mark room as inactive
    if (roomData.participants.length === 0) {
      roomData.isActive = false;
    }

    res.json({
      message: 'Left room successfully',
      participantCount: roomData.participants.length
    });
  } catch (error) {
    console.error('Error leaving room:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all active rooms (optional - for admin or debugging)
router.get('/', jwtverify, async (req, res) => {
  try {
    const activeRooms = Array.from(streamRooms.values())
      .filter(room => room.isActive)
      .map(room => ({
        roomCode: room.roomCode,
        roomName: room.roomName,
        createdBy: room.createdBy,
        participantCount: room.participants.length,
        createdAt: room.createdAt
      }));

    res.json(activeRooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;