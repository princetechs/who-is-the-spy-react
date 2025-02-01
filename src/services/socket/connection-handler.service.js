const gameService = require('../game');

class ConnectionHandlerService {
  constructor(io) {
    this.io = io;
  }

  handleConnection(socket) {
    console.log('User connected:', socket.id);
    this.setupSocketListeners(socket);
  }

  handleDisconnect(socket) {
    console.log('User disconnected:', socket.id);
    const affectedGames = gameService.handlePlayerDisconnect(socket.id);
    
    affectedGames.forEach(({ gameId, game }) => {
      this.io.to(gameId).emit('playerLeft', { game });
    });
  }

  setupSocketListeners(socket) {
    socket.on('disconnect', () => this.handleDisconnect(socket));
  }
}

module.exports = ConnectionHandlerService;