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
      gameMode: 'wordlessSpy'
    };

    this.listeners = new Set();
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

    socketService.on('gameStarted', ({ isSpy, word, gameMode }) => {
      this.updateState({
        gameStarted: true,
        playerRole: isSpy ? 'Spy' : 'Villager',
        word
      });
      this.saveGameState(isSpy, word);
    });

    socketService.on('playerLeft', ({ game }) => {
      this.updateState({ game });
    });

    socketService.on('error', (message) => {
      if (message === 'Game not found') {
        this.clearGameState();
      }
      // Emit error to components
      this.notifyListeners({ type: 'error', message });
    });
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
      gameStarted: false, // Reset game started state until confirmed by server
      playerRole: null,
      word: ''
    });

    // Only attempt to rejoin if we have both gameId and playerName
    if (storedGameId && storedPlayerName) {
      // Set a small delay to ensure socket connection is established
      setTimeout(() => {
        socketService.joinGame(storedGameId, storedPlayerName);
      }, 500);
    } else {
      // Clear any partial game state if we don't have complete information
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
      word: ''
    });
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

  // Game Actions
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
    socketService.cleanup();
    this.listeners.clear();
  }
}

export default new GameService();