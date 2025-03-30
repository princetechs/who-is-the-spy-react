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
    socket.on('endGame', (data) => this.handleEndGame(socket, data));
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
    
    // Check if there are enough players (minimum 3)
    if (game.players.length < 3) {
      socket.emit('error', 'At least 3 players are required to start the game');
      return;
    }

    const updatedGame = this.gameService.startGame(gameId, words, gameMode);
    if (!updatedGame) return;

    // Set the preparation time based on player count (more players = more prep time)
    const basePreparationTime = 30; // base 30 seconds
    const additionalTimePerPlayer = 5; // 5 seconds per player beyond 3
    const additionalPlayers = Math.max(0, updatedGame.players.length - 3);
    const preparationTime = basePreparationTime + (additionalTimePerPlayer * additionalPlayers);
    
    updatedGame.preGameTimeLeft = preparationTime;

    // Notify all players about game start with their specific roles
    updatedGame.players.forEach(player => {
      this.io.to(player.id).emit('gameStarted', {
        isSpy: player.id === updatedGame.spy,
        word: player.id === updatedGame.spy ? updatedGame.words.spyWord : updatedGame.words.villagerWord,
        gameMode,
        playerOrder: updatedGame.playerOrder,
        players: updatedGame.players,
        preGameTimeLeft: preparationTime,
        phase: 'preGame'
      });
    });

    // Start the preparation timer
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
        turnTimeLeft: updatedGame.turnTimeLeft,
        playerOrder: updatedGame.playerOrder
      });
      this.startTurnTimer(gameId, updatedGame);
    }
  }
  
  handleEndGame(socket, { gameId }) {
    const game = this.gameService.getGame(gameId);
    if (!game) return;
    
    // Clear all timers associated with this game
    this.timerManagementService.clearGameTimer(gameId, 'preGame');
    this.timerManagementService.clearGameTimer(gameId, 'turn');
    
    // Reset game to lobby state
    game.started = false;
    game.phase = 'lobby';
    game.spy = null;
    game.words = null;
    game.playerOrder = [];
    game.currentTurn = null;
    
    // Notify all players
    this.io.to(gameId).emit('gameEnded');
  }

  startPreGameTimer(gameId, game) {
    const timer = setInterval(() => {
      const currentGame = this.gameService.getGame(gameId);
      if (!currentGame) {
        clearInterval(timer);
        return;
      }

      currentGame.preGameTimeLeft--;
      
      // Broadcast timer update to all players
      this.io.to(gameId).emit('timerUpdate', { 
        preGameTimeLeft: currentGame.preGameTimeLeft,
        turnTimeLeft: currentGame.turnTimeLeft,
        currentTurn: currentGame.currentTurn,
        phase: 'preGame',
        playerOrder: currentGame.playerOrder,
        gameStatus: 'preGame'
      });

      if (currentGame.preGameTimeLeft <= 0) {
        clearInterval(timer);
        this.startGamePhase(gameId, currentGame);
      }
    }, 1000);

    this.timerManagementService.setGameTimer(gameId, 'preGame', timer);
  }

  startGamePhase(gameId, game) {
    game.phase = 'playing';
    game.currentTurn = game.playerOrder[0];
    
    // Set turn time based on player count (fewer players = more time per turn)
    const baseTurnTime = 60; // 60 seconds base
    const turnTimeAdjustment = Math.max(0, 5 - game.players.length) * 10; // 10 seconds extra per player below 5
    game.turnTimeLeft = baseTurnTime + turnTimeAdjustment;

    // Notify all players about game phase change
    this.io.to(gameId).emit('gamePhaseChanged', {
      phase: 'playing',
      currentTurn: game.currentTurn,
      turnTimeLeft: game.turnTimeLeft,
      playerOrder: game.playerOrder
    });

    // Start the first player's turn timer
    this.startTurnTimer(gameId, game);
  }

  startTurnTimer(gameId, game) {
    const timer = setInterval(() => {
      const currentGame = this.gameService.getGame(gameId);
      if (!currentGame) {
        clearInterval(timer);
        return;
      }

      currentGame.turnTimeLeft--;
      
      // Broadcast timer update to all players
      this.io.to(gameId).emit('timerUpdate', {
        preGameTimeLeft: currentGame.preGameTimeLeft,
        turnTimeLeft: currentGame.turnTimeLeft,
        currentTurn: currentGame.currentTurn,
        phase: 'playing',
        playerOrder: currentGame.playerOrder,
        gameStatus: 'playing'
      });

      if (currentGame.turnTimeLeft <= 0) {
        clearInterval(timer);
        this.handleTurnTimeout({ id: 'system' }, { gameId });
      }
    }, 1000);

    this.timerManagementService.setGameTimer(gameId, 'turn', timer);
  }
}

module.exports = GameEventHandlerService;