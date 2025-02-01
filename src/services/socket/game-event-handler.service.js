const gameService = require('../game');

class GameEventHandlerService {
  constructor(io) {
    this.io = io;
  }

  setupEventHandlers(socket) {
    socket.on('createGame', (hostName) => this.handleCreateGame(socket, hostName));
    socket.on('joinGame', (data) => this.handleJoinGame(socket, data));
    socket.on('startGame', (data) => this.handleStartGame(socket, data));
  }

  handleCreateGame(socket, hostName) {
    const { gameId, game } = gameService.createGame(socket.id, hostName);
    socket.join(gameId);
    socket.emit('gameCreated', { gameId, game });
  }

  handleJoinGame(socket, { gameId, playerName }) {
    const game = gameService.joinGame(gameId, socket.id, playerName);
    
    if (!game) {
      socket.emit('error', 'Game not found');
      return;
    }
    if (game === 'started') {
      socket.emit('error', 'Game already started');
      return;
    }

    socket.join(gameId);
    this.io.to(gameId).emit('playerJoined', { game });
  }

  handleStartGame(socket, { gameId, words, gameMode }) {
    if (!gameService.isGameHost(gameId, socket.id)) {
      socket.emit('error', 'Only host can start the game');
      return;
    }

    const game = gameService.startGame(gameId, words, gameMode);
    if (!game) return;

    game.players.forEach(player => {
      this.io.to(player.id).emit('gameStarted', {
        isSpy: player.id === game.spy,
        word: player.id === game.spy ? game.words.spyWord : game.words.villagerWord,
        gameMode,
        playerOrder: game.playerOrder,
        players: game.players,
        preGameTimeLeft: game.preGameTimeLeft
      });
    });

    this.startPreGameTimer(gameId, game);
  }


}

module.exports = GameEventHandlerService;