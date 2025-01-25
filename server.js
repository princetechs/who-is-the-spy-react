const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
const server = http.createServer(app);

const isDev = process.env.NODE_ENV !== 'production';
const clientUrl = isDev ? 'http://localhost:5173' : process.env.CLIENT_URL || 'https://your-domain.vercel.app';

const io = new Server(server, {
  cors: {
    origin: clientUrl,
    methods: ["GET", "POST"]
  },
  path: '/api/socket',
  addTrailingSlash: false
});

const games = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('createGame', (hostName) => {
    const gameId = uuidv4();
    games.set(gameId, {
      id: gameId,
      host: socket.id,
      hostName,
      players: [{ id: socket.id, name: hostName }],
      started: false,
      words: null,
      spy: null,
      gameMode: null
    });
    socket.join(gameId);
    socket.emit('gameCreated', { gameId, game: games.get(gameId) });
  });

  socket.on('joinGame', ({ gameId, playerName }) => {
    const game = games.get(gameId);
    if (!game) {
      socket.emit('error', 'Game not found');
      return;
    }
    if (game.started) {
      socket.emit('error', 'Game already started');
      return;
    }
    
    game.players.push({ id: socket.id, name: playerName });
    socket.join(gameId);
    io.to(gameId).emit('playerJoined', { game });
  });

  socket.on('startGame', ({ gameId, words, gameMode }) => {
    const game = games.get(gameId);
    if (!game || game.host !== socket.id) return;

    // Randomly select words based on game mode
    const randomIndex = Math.floor(Math.random() * words.length);
    const villagerWord = words[randomIndex];
    const spyWord = gameMode === 'uniqueSpy' ? words[Math.floor(Math.random() * words.length)] : '';

    // Randomly select spy from players
    const spyIndex = Math.floor(Math.random() * game.players.length);
    game.started = true;
    game.words = { villagerWord, spyWord };
    game.spy = game.players[spyIndex].id;
    game.gameMode = gameMode;

    game.players.forEach(player => {
      io.to(player.id).emit('gameStarted', {
        isSpy: player.id === game.spy,
        word: player.id === game.spy ? spyWord : villagerWord,
        gameMode
      });
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    games.forEach((game, gameId) => {
      if (game.players.some(p => p.id === socket.id)) {
        game.players = game.players.filter(p => p.id !== socket.id);
        if (game.players.length === 0) {
          games.delete(gameId);
        } else {
          if (game.host === socket.id) {
            game.host = game.players[0].id;
          }
          io.to(gameId).emit('playerLeft', { game });
        }
      }
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Client URL: ${clientUrl}`);
});