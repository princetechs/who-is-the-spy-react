const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');

const GameService = require('./src/services/game.service');
const TimerManagementService = require('./src/services/timer-management.service');
const SocketService = require('./src/services/socket.service');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client/dist')));

// Serve client for any route (SPA handling)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

// Configure Socket.io
const io = new Server(server, {
  path: '/api/socket',
  cors: {
    origin: process.env.NODE_ENV === 'production' ? undefined : 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Create shared service instances
const gameService = new GameService();
const timerManagementService = new TimerManagementService();

const services = {
  gameService,
  timerManagementService,
  playerManagementService: gameService
};

// Initialize socket service
const socketService = new SocketService(io, services);
socketService.setupEventHandlers();

// Error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});