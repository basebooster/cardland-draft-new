const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Store active drafts and their timers
const activeDrafts = new Map();
const draftTimers = new Map();

// Socket connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join a draft room
  socket.on('join-draft', (draftId) => {
    socket.join(draftId);
    console.log(`User ${socket.id} joined draft ${draftId}`);
    
    // Send current draft state if available
    const draftState = activeDrafts.get(draftId);
    if (draftState) {
      socket.emit('draft-state', draftState);
    }
  });

  // Leave a draft room
  socket.on('leave-draft', (draftId) => {
    socket.leave(draftId);
    console.log(`User ${socket.id} left draft ${draftId}`);
  });

  // Handle pick made
  socket.on('pick-made', (data) => {
    const { draftId, userId, selectionId, userName, selectionName } = data;
    
    // Broadcast the pick to all users in the draft
    io.to(draftId).emit('pick-update', {
      userId,
      selectionId,
      userName,
      selectionName,
      timestamp: new Date().toISOString()
    });

    // Clear any existing timer for this draft
    if (draftTimers.has(draftId)) {
      clearInterval(draftTimers.get(draftId));
      draftTimers.delete(draftId);
    }

    console.log(`Pick made in draft ${draftId}: ${userName} picked ${selectionName}`);
  });

  // Start pick timer
  socket.on('start-timer', (data) => {
    const { draftId, userId, duration } = data;
    
    // Clear existing timer if any
    if (draftTimers.has(draftId)) {
      clearInterval(draftTimers.get(draftId));
    }

    // Start countdown
    let timeLeft = duration;
    const countdown = setInterval(() => {
      timeLeft--;
      io.to(draftId).emit('timer-update', { timeLeft });
      
      if (timeLeft <= 0) {
        clearInterval(countdown);
        // Trigger auto-pick
        io.to(draftId).emit('auto-pick-triggered', { userId });
      }
    }, 1000);

    // Store timer reference
    draftTimers.set(draftId, countdown);
    
    console.log(`Timer started for draft ${draftId}, user ${userId}, duration ${duration}s`);
  });

  // Handle turn change
  socket.on('turn-change', (data) => {
    const { draftId, currentUserId, nextUserId, userName } = data;
    
    io.to(draftId).emit('turn-update', {
      currentUserId: nextUserId,
      currentUserName: userName
    });

    console.log(`Turn changed in draft ${draftId}: now ${userName}'s turn`);
  });

  // Handle draft completion
  socket.on('draft-complete', (draftId) => {
    // Clear any timers
    if (draftTimers.has(draftId)) {
      clearInterval(draftTimers.get(draftId));
      draftTimers.delete(draftId);
    }

    // Remove draft from active drafts
    activeDrafts.delete(draftId);

    // Notify all users
    io.to(draftId).emit('draft-completed');
    
    console.log(`Draft ${draftId} completed`);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start draft endpoint
app.post('/api/draft/:id/start', (req, res) => {
  const { id } = req.params;
  const { participants, selections } = req.body;

  // Store draft state
  activeDrafts.set(id, {
    participants,
    selections,
    currentPickerIndex: 0,
    picks: [],
    status: 'active'
  });

  // Notify all users in the draft room
  io.to(id).emit('draft-started', {
    currentPicker: participants[0],
    selections
  });

  res.json({ success: true });
});

// Auto-pick endpoint
app.post('/api/draft/:id/auto-pick', (req, res) => {
  const { id } = req.params;
  const { userId, selectionId } = req.body;

  // Broadcast auto-pick to all users
  io.to(id).emit('auto-pick-made', {
    userId,
    selectionId,
    timestamp: new Date().toISOString()
  });

  res.json({ success: true });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server, io };