const gameService = require('./game.service');

class GameEventHandlerService {
  constructor(io, services) {
    this.io = io;
    this.gameService = services.gameService;
    this.playerManagementService = services.playerManagementService;
    this.timerManagementService = services.timerManagementService;
  }

  setupEventHandlers(socket) {
    socket.on('createGame', (hostName) => this.handleCreateGame(socket, hostName));
    socket.on('joinGame', (data) => this.handleJoinGame(socket, data));
    socket.on('startGame', (data) => this.handleStartGame(socket, data));
    socket.on('preGameComplete', (data) => this.handlePreGameComplete(socket, data));
    socket.on('turnTimeout', (data) => this.handleTurnTimeout(socket, data));
  }

  handleCreateGame(socket, hostName) {
    const { gameId, game } = this.gameService.createGame(socket.id, hostName);
    socket.join(gameId);
    socket.emit('gameCreated', { gameId, game });
  }

  handleJoinGame(socket, { gameId, playerName }) {
    const game = this.gameService.joinGame(gameId, socket.id, playerName);
    
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
    const game = this.gameService.getGame(gameId);
    if (!game) {
      socket.emit('error', 'Game not found');
      return;
    }
    if (game.host !== socket.id) {
      socket.emit('error', 'Only host can start the game');
      return;
    }

    const updatedGame = this.gameService.startGame(gameId, words, gameMode);
    if (!updatedGame) return;

    updatedGame.players.forEach(player => {
      this.io.to(player.id).emit('gameStarted', {
        isSpy: player.id === updatedGame.spy,
        word: player.id === updatedGame.spy ? updatedGame.words.spyWord : updatedGame.words.villagerWord,
        gameMode,
        playerOrder: updatedGame.playerOrder,
        players: updatedGame.players,
        preGameTimeLeft: updatedGame.preGameTimeLeft
      });
    });

    this.startPreGameTimer(gameId, updatedGame);
  }

  handlePreGameComplete(socket, { gameId }) {
    const game = this.gameService.getGame(gameId);
    if (!game) return;

    this.timerManagementService.clearGameTimer(gameId, 'preGame');
    this.startGamePhase(gameId, game);
  }

  handleTurnTimeout(socket, { gameId }) {
    const game = this.gameService.getGame(gameId);
    if (!game) return;

    this.timerManagementService.clearGameTimer(gameId, 'turn');
    const updatedGame = this.gameService.moveToNextTurn(gameId);
    if (updatedGame) {
      this.io.to(gameId).emit('turnChanged', {
        currentTurn: updatedGame.currentTurn,
        turnTimeLeft: updatedGame.turnTimeLeft
      });
      this.startTurnTimer(gameId, updatedGame);
    }
  }

  startPreGameTimer(gameId, game) {
    const timer = setInterval(() => {
      if (!this.gameService.getGame(gameId)) {
        clearInterval(timer);
        return;
      }

      game.preGameTimeLeft--;
      
      this.io.to(gameId).emit('timerUpdate', { 
        timeLeft: game.preGameTimeLeft,
        phase: 'preGame'
      });

      if (game.preGameTimeLeft <= 0) {
        clearInterval(timer);
        this.startGamePhase(gameId, game);
      }
    }, 1000);

    this.timerManagementService.setGameTimer(gameId, 'preGame', timer);
  }

  startGamePhase(gameId, game) {
    game.phase = 'playing';
    game.currentTurn = game.playerOrder[0];
    game.turnTimeLeft = 60;

    this.io.to(gameId).emit('gamePhaseChanged', {
      phase: 'playing',
      currentTurn: game.currentTurn,
      turnTimeLeft: game.turnTimeLeft
    });

    this.startTurnTimer(gameId, game);
  }

  startTurnTimer(gameId, game) {
    const timer = setInterval(() => {
      if (!this.gameService.getGame(gameId)) {
        clearInterval(timer);
        return;
      }

      game.turnTimeLeft--;
      
      this.io.to(gameId).emit('timerUpdate', {
        timeLeft: game.turnTimeLeft,
        phase: 'playing',
        currentTurn: game.currentTurn
      });

      if (game.turnTimeLeft <= 0) {
        clearInterval(timer);
        this.handleTurnTimeout({ gameId });
      }
    }, 1000);

    this.timerManagementService.setGameTimer(gameId, 'turn', timer);
  }
}

module.exports = GameEventHandlerService;