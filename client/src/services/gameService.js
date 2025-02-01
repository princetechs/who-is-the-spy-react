import socketService from './socketService';

class GameService {
  constructor() {
    this.gameState = {
      connected: false,
      playerName: '',
      gameId: '',
      game: null,
      gameStarted: false,
      playerRole: null,
      word: '',
      selectedCategory: 'fruits',
      gameMode: 'wordlessSpy',
      preGameTimer: 30,
      playerTurnTimer: 60,
      currentTurn: null,
      playerOrder: [],
      turnTimeLeft: 0,
      preGameTimeLeft: 0
    };

    this.listeners = new Set();
    this.timers = {
      preGame: null,
      playerTurn: null
    };
  }

  initialize() {
    this.setupSocketListeners();
    this.loadStoredState();
  }

  setupSocketListeners() {
    socketService.connect(
      () => this.updateState({ connected: true }),
      () => this.updateState({ connected: false })
    );

    socketService.on('gameCreated', ({ gameId, game }) => {
      this.updateState({ gameId, game });
      localStorage.setItem('gameId', gameId);
    });

    socketService.on('playerJoined', ({ game }) => {
      this.updateState({ game });
    });

    socketService.on('gameStarted', ({ isSpy, word, gameMode, playerOrder }) => {
      this.updateState({
        gameStarted: true,
        playerRole: isSpy ? 'Spy' : 'Villager',
        word,
        playerOrder,
        preGameTimeLeft: this.gameState.preGameTimer,
        currentTurn: null
      });
      this.saveGameState(isSpy, word);
      this.startPreGameTimer();
    });

    socketService.on('playerLeft', ({ game }) => {
      this.updateState({ game });
    });

    socketService.on('error', (message) => {
      if (message === 'Game not found') {
        this.clearGameState();
      }
      this.notifyListeners({ type: 'error', message });
    });

    socketService.on('turnStarted', ({ playerId, timeLeft }) => {
      this.updateState({
        currentTurn: playerId,
        turnTimeLeft: timeLeft
      });
      this.startPlayerTurnTimer();
    });

    socketService.on('turnEnded', () => {
      this.clearPlayerTurnTimer();
    });

    socketService.on('timerUpdate', ({ preGameTimeLeft }) => {
      this.updateState({ preGameTimeLeft });
    });
  }

  startPreGameTimer() {
    if (this.timers.preGame) clearInterval(this.timers.preGame);
    
    this.timers.preGame = setInterval(() => {
      const timeLeft = this.gameState.preGameTimeLeft - 1;
      if (timeLeft <= 0) {
        this.clearPreGameTimer();
        socketService.socket.emit('preGameComplete', { gameId: this.gameState.gameId });
      } else {
        this.updateState({ preGameTimeLeft: timeLeft });
      }
    }, 1000);
  }

  startPlayerTurnTimer() {
    if (this.timers.playerTurn) clearInterval(this.timers.playerTurn);

    this.timers.playerTurn = setInterval(() => {
      const timeLeft = this.gameState.turnTimeLeft - 1;
      if (timeLeft <= 0) {
        this.clearPlayerTurnTimer();
        socketService.socket.emit('turnTimeout', { gameId: this.gameState.gameId });
      } else {
        this.updateState({ turnTimeLeft: timeLeft });
      }
    }, 1000);
  }

  clearPreGameTimer() {
    if (this.timers.preGame) {
      clearInterval(this.timers.preGame);
      this.timers.preGame = null;
    }
    this.updateState({ preGameTimeLeft: 0 });
  }

  clearPlayerTurnTimer() {
    if (this.timers.playerTurn) {
      clearInterval(this.timers.playerTurn);
      this.timers.playerTurn = null;
    }
    this.updateState({ turnTimeLeft: 0 });
  }

  setPreGameTimer(seconds) {
    this.updateState({ preGameTimer: seconds });
  }

  setPlayerTurnTimer(seconds) {
    this.updateState({ playerTurnTimer: seconds });
  }

  loadStoredState() {
    const storedPlayerName = localStorage.getItem('playerName');
    const storedGameId = localStorage.getItem('gameId');
    const storedGameStarted = localStorage.getItem('gameStarted') === 'true';
    const storedPlayerRole = localStorage.getItem('playerRole');
    const storedWord = localStorage.getItem('word');

    this.updateState({
      playerName: storedPlayerName || '',
      gameId: storedGameId || '',
      gameStarted: false,
      playerRole: null,
      word: ''
    });

    if (storedGameId && storedPlayerName) {
      setTimeout(() => {
        socketService.joinGame(storedGameId, storedPlayerName);
      }, 500);
    } else {
      this.clearGameState();
    }
  }

  saveGameState(isSpy, word) {
    localStorage.setItem('gameStarted', 'true');
    localStorage.setItem('playerRole', isSpy ? 'Spy' : 'Villager');
    localStorage.setItem('word', word);
  }

  clearGameState() {
    localStorage.removeItem('gameId');
    localStorage.removeItem('gameStarted');
    localStorage.removeItem('playerRole');
    localStorage.removeItem('word');
    
    this.updateState({
      gameId: '',
      gameStarted: false,
      playerRole: null,
      word: '',
      currentTurn: null,
      playerOrder: [],
      turnTimeLeft: 0,
      preGameTimeLeft: 0
    });

    this.clearPreGameTimer();
    this.clearPlayerTurnTimer();
  }

  updateState(newState) {
    this.gameState = { ...this.gameState, ...newState };
    this.notifyListeners({ type: 'stateUpdate', state: this.gameState });
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners(event) {
    this.listeners.forEach(listener => listener(event));
  }

  setPlayerName(name) {
    this.updateState({ playerName: name });
    localStorage.setItem('playerName', name);
  }

  createGame() {
    if (!this.gameState.playerName) {
      this.notifyListeners({ type: 'error', message: 'Please enter your name' });
      return;
    }
    socketService.createGame(this.gameState.playerName);
  }

  joinGame(gameId) {
    if (!this.gameState.playerName || !gameId) {
      this.notifyListeners({ type: 'error', message: 'Please enter your name and game ID' });
      return;
    }
    socketService.joinGame(gameId, this.gameState.playerName);
  }

  startGame(words) {
    socketService.startGame(
      this.gameState.gameId,
      words,
      this.gameState.gameMode
    );
  }

  endGame() {
    this.clearGameState();
  }

  setGameMode(mode) {
    this.updateState({ gameMode: mode });
  }

  setSelectedCategory(category) {
    this.updateState({ selectedCategory: category });
  }

  cleanup() {
    this.clearPreGameTimer();
    this.clearPlayerTurnTimer();
    socketService.cleanup();
    this.listeners.clear();
  }
}

export default new GameService();