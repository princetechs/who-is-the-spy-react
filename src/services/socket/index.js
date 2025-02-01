const ConnectionHandlerService = require('./connection-handler.service');
const GameEventHandlerService = require('./game-event-handler.service');

class SocketService {
  constructor(io) {
    this.io = io;
    this.connectionHandler = new ConnectionHandlerService(io);
    this.gameEventHandler = new GameEventHandlerService(io);
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      this.connectionHandler.handleConnection(socket);
      this.gameEventHandler.setupEventHandlers(socket);
    });
  }
}

module.exports = SocketService;