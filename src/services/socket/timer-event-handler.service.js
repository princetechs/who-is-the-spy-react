const gameService = require('../game');

class TimerEventHandlerService {
  constructor(io) {
    this.io = io;
  }

  setupEventHandlers(socket) {
    socket.on('preGameComplete', (data) => this.handlePreGameComplete(socket, data));
    socket.on('turnTimeout', (data) => this.handleTurnTimeout(socket, data));
  }

  handlePreGameComplete(socket, { gameId }) {
    const game = gameService.getGame(gameId);
    if (!game) return;

    game.phase = 'playing';
    game.currentTurn = game.playerOrder[0];
    
    this.io.to(gameId).emit('gamePhaseChanged', {
      phase: 'playing',
      currentTurn: game.currentTurn,
      turnTimeLeft: game.turnTimeLeft
    });

    this.startTurnTimer(gameId, game);
  }

  handleTurnTimeout(socket, { gameId }) {
    const updatedGame = gameService.moveToNextTurn(gameId);
    if (updatedGame) {
      this.io.to(gameId).emit('turnChanged', {
        currentTurn: updatedGame.currentTurn,
        turnTimeLeft: updatedGame.turnTimeLeft
      });
    }
  }

  startPreGameTimer(gameId, game) {
    const preGameTimer = setInterval(() => {
      game.preGameTimeLeft--;
      
      this.io.to(gameId).emit('timerUpdate', { 
        timeLeft: game.preGameTimeLeft,
        phase: 'preGame'
      });

      if (game.preGameTimeLeft <= 0) {
        clearInterval(preGameTimer);
        this.handlePreGameComplete({ gameId });
      }
    }, 1000);

    gameService.setGameTimer(gameId, 'preGame', preGameTimer);
  }

  startTurnTimer(gameId, game) {
    const turnTimer = setInterval(() => {
      game.turnTimeLeft--;
      
      this.io.to(gameId).emit('timerUpdate', {
        timeLeft: game.turnTimeLeft,
        phase: 'playing',
        currentTurn: game.currentTurn
      });

      if (game.turnTimeLeft <= 0) {
        clearInterval(turnTimer);
        this.handleTurnTimeout(null, { gameId });
      }
    }, 1000);

    gameService.setGameTimer(gameId, 'turn', turnTimer);
  }
}

module.exports = TimerEventHandlerService;