import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = io(import.meta.env.PROD ? window.location.origin : 'http://localhost:3000', {
      path: '/api/socket',
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000
    });
    this.listeners = new Map();
  }

  connect(onConnect, onDisconnect) {
    this.socket.on('connect', () => {
      console.log('Socket connected with ID:', this.socket.id);
      if (onConnect) onConnect();
      
      // Try to reconnect to any active game
      const gameId = localStorage.getItem('gameId');
      const playerName = localStorage.getItem('playerName');
      
      if (gameId && playerName) {
        this.reconnectToGame(gameId, playerName);
      }
    });
    
    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      if (onDisconnect) onDisconnect(reason);
    });
    
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      if (typeof error === 'string') {
        alert(error);
      } else {
        alert('An error occurred');
      }
    });
    
    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });
  }

  createGame(hostName) {
    if (!this.socket.connected) {
      console.warn('Socket not connected, attempting to reconnect...');
      this.socket.connect();
      setTimeout(() => this.createGame(hostName), 1000);
      return;
    }
    this.socket.emit('createGame', hostName);
  }

  joinGame(gameId, playerName) {
    if (!this.socket.connected) {
      console.warn('Socket not connected, attempting to reconnect...');
      this.socket.connect();
      setTimeout(() => this.joinGame(gameId, playerName), 1000);
      return;
    }
    this.socket.emit('joinGame', { gameId, playerName });
  }

  reconnectToGame(gameId, playerName) {
    if (!this.socket.connected) {
      console.warn('Socket not connected, attempting to reconnect...');
      this.socket.connect();
      setTimeout(() => this.reconnectToGame(gameId, playerName), 1000);
      return;
    }
    console.log('Attempting to reconnect to game:', gameId);
    this.socket.emit('reconnectToGame', { gameId, playerName });
  }

  startGame(gameId, words, gameMode) {
    if (!this.socket.connected) {
      console.warn('Socket not connected, attempting to reconnect...');
      alert('Lost connection to server. Please try again in a moment.');
      return;
    }
    this.socket.emit('startGame', { gameId, words, gameMode });
  }
  
  endGame(gameId) {
    if (!this.socket.connected) return;
    this.socket.emit('endGame', { gameId });
  }
  
  leaveLobby(gameId) {
    if (!this.socket.connected || !gameId) return;
    console.log('Leaving lobby:', gameId);
    this.socket.emit('leaveLobby', { gameId });
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
  
  get isConnected() {
    return this.socket.connected;
  }
}

export default new SocketService();