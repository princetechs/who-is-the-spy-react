import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = io(import.meta.env.PROD ? window.location.origin : 'http://localhost:3000', {
      path: '/api/socket',
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    this.listeners = new Map();
  }

  connect(onConnect, onDisconnect) {
    this.socket.on('connect', onConnect);
    this.socket.on('disconnect', onDisconnect);
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      alert(error);
    });
  }

  createGame(hostName) {
    this.socket.emit('createGame', hostName);
  }

  joinGame(gameId, playerName) {
    this.socket.emit('joinGame', { gameId, playerName });
  }

  startGame(gameId, words, gameMode) {
    this.socket.emit('startGame', { gameId, words, gameMode });
  }

  on(event, callback) {
    this.socket.on(event, callback);
    this.listeners.set(event, callback);
  }

  off(event) {
    const callback = this.listeners.get(event);
    if (callback) {
      this.socket.off(event, callback);
      this.listeners.delete(event);
    }
  }

  cleanup() {
    this.listeners.forEach((callback, event) => {
      this.socket.off(event, callback);
    });
    this.listeners.clear();
  }

  get id() {
    return this.socket.id;
  }
}

export default new SocketService();