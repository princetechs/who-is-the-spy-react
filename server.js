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

const io = new Server(server, {
  path: '/api/socket',
  cors: {
    origin: process.env.NODE_ENV === 'production' ? undefined : 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

const services = {
  gameService: new GameService(),
  timerManagementService: new TimerManagementService(),
  playerManagementService: new GameService()
};

const socketService = new SocketService(io, services);
socketService.setupEventHandlers();

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});