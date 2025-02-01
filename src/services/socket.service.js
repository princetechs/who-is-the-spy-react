class SocketService {
  constructor(io, services) {
    this.io = io;
    this.connectionHandler = new (require('./connection-handler.service'))(io, services);
    this.gameEventHandler = new (require('./game-event-handler.service'))(io, services);
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      this.connectionHandler.handleConnection(socket);
      this.gameEventHandler.setupEventHandlers(socket);
      socket.on('disconnect', () => this.connectionHandler.handleDisconnect(socket));
    });
  }
}

module.exports = SocketService;