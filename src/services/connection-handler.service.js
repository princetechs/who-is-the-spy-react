const gameService = require('./game.service');

class ConnectionHandlerService {
  constructor(io, services) {
    this.io = io;
    this.gameService = services.gameService;
    this.timerManagementService = services.timerManagementService;
  }

  handleConnection(socket) {
    console.log('User connected:', socket.id);
    
    // Handle reconnection attempts
    socket.on('reconnectToGame', ({ gameId, playerName }) => {
      if (!gameId || !playerName) return;
      
      const game = this.gameService.getGame(gameId);
      if (!game) {
        socket.emit('error', 'Game not found');
        return;
      }
      
      // Check if player was in this game before
      const existingPlayerIndex = game.players.findIndex(p => p.name === playerName);
      
      if (existingPlayerIndex >= 0) {
        // Update the player's socket ID
        game.players[existingPlayerIndex].id = socket.id;
        
        // Join the socket to the game room
        socket.join(gameId);
        
        // If the game has started, send the game state
        if (game.started) {
          const isSpy = game.spy === socket.id || game.players[existingPlayerIndex].name === game.spy;
          
          if (isSpy) {
            game.spy = socket.id; // Update spy ID
          }
          
          socket.emit('gameStarted', {
            isSpy,
            word: isSpy ? game.words.spyWord : game.words.villagerWord,
            gameMode: game.gameMode,
            playerOrder: game.playerOrder,
            players: game.players,
            preGameTimeLeft: game.preGameTimeLeft,
            phase: game.phase
          });
        }
        
        // Notify all players about the reconnection
        this.io.to(gameId).emit('playerJoined', { game });
      } else {
        // New player joining
        const updatedGame = this.gameService.joinGame(gameId, socket.id, playerName);
        if (updatedGame === 'started') {
          socket.emit('error', 'Game already started');
          return;
        }
        
        if (updatedGame) {
          socket.join(gameId);
          this.io.to(gameId).emit('playerJoined', { game: updatedGame });
        }
      }
    });

    // Handle explicit leave lobby request
    socket.on('leaveLobby', ({ gameId }) => {
      if (!gameId) return;
      
      const game = this.gameService.getGame(gameId);
      if (!game) return;
      
      // Remove player from game
      this.gameService.removePlayerFromGame(gameId, socket.id);
      
      // Leave the socket room
      socket.leave(gameId);
      
      // Notify remaining players
      this.io.to(gameId).emit('playerLeft', { game });
      
      // Confirmation to the client
      socket.emit('leftLobby');
    });
  }

  handleDisconnect(socket) {
    console.log('User disconnected:', socket.id);
    const affectedGames = this.gameService.handlePlayerDisconnect(socket.id);
    
    affectedGames.forEach(({ gameId, game }) => {
      // Notify all players about the player leaving
      this.io.to(gameId).emit('playerLeft', { game });
      
      // If game is in progress and there's a turn change needed
      if (game.started && game.phase === 'playing') {
        this.io.to(gameId).emit('turnChanged', {
          currentTurn: game.currentTurn,
          turnTimeLeft: game.turnTimeLeft,
          playerOrder: game.playerOrder
        });
      }
      
      // If not enough players left to continue (less than 3)
      if (game.started && game.players.length < 3) {
        // End the game
        this.timerManagementService.clearGameTimer(gameId, 'preGame');
        this.timerManagementService.clearGameTimer(gameId, 'turn');
        this.io.to(gameId).emit('gameEnded', { reason: 'Not enough players' });
        
        // Reset the game state
        game.started = false;
        game.phase = 'lobby';
        game.spy = null;
        game.words = null;
        game.gameMode = null;
        game.playerOrder = [];
        game.currentTurn = null;
      }
    });
  }
}

module.exports = ConnectionHandlerService;