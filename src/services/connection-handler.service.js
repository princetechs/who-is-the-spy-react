const gameService = require('./game.service');

class ConnectionHandlerService {
  constructor(io, services) {
    this.io = io;
    this.gameService = services.gameService;
  }

  handleConnection(socket) {
    console.log('User connected:', socket.id);
  }

  handleDisconnect(socket) {
    console.log('User disconnected:', socket.id);
    const affectedGames = this.gameService.handlePlayerDisconnect(socket.id);
    
    affectedGames.forEach(({ gameId, game }) => {
      this.io.to(gameId).emit('playerLeft', { game });
    });
  }
}

module.exports = ConnectionHandlerService;