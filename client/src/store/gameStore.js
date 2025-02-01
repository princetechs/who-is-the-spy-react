import { create } from 'zustand';
import socketService from '../services/socketService';
import wordLists from '../config/wordLists.json';

const useGameStore = create((set, get) => ({
  // Connection state
  connected: false,
  setConnected: (status) => set({ connected: status }),

  // Player state
  playerName: localStorage.getItem('playerName') || '',
  setPlayerName: (name) => {
    localStorage.setItem('playerName', name);
    set({ playerName: name });
  },

  // Game state
  gameId: localStorage.getItem('gameId') || '',
  setGameId: (id) => {
    localStorage.setItem('gameId', id);
    set({ gameId: id });
  },

  game: null,
  setGame: (game) => set({ game }),

  gameStarted: false,
  setGameStarted: (status) => set({ gameStarted: status }),

  playerRole: null,
  setPlayerRole: (role) => set({ playerRole: role }),

  word: '',
  setWord: (word) => set({ word }),

  // Game settings
  selectedCategory: 'fruits',
  setSelectedCategory: (category) => set({ selectedCategory: category }),

  gameMode: 'wordlessSpy',
  setGameMode: (mode) => set({ gameMode: mode }),

  preGameTimer: 10,
  setPreGameTimer: (seconds) => set({ preGameTimer: seconds }),

  playerTurnTimer: 60,
  setPlayerTurnTimer: (seconds) => set({ playerTurnTimer: seconds }),

  // Game actions
  createGame: () => {
    const { playerName } = get();
    if (!playerName) return alert('Please enter your name');
    socketService.socket.emit('createGame', playerName);
  },

  joinGame: (gameId) => {
    const { playerName } = get();
    if (!playerName || !gameId) return alert('Please enter your name and game ID');
    socketService.socket.emit('joinGame', { gameId, playerName });
  },

  startGame: () => {
    const { gameId, selectedCategory, gameMode } = get();
    const words = wordLists[selectedCategory];
    socketService.socket.emit('startGame', { gameId, words, gameMode });
  },

  endGame: () => {
    localStorage.removeItem('gameStarted');
    localStorage.removeItem('playerRole');
    localStorage.removeItem('word');
    set({
      gameStarted: false,
      playerRole: null,
      word: ''
    });
  },

  // Socket event handlers
  handleConnect: () => {
    const store = get();
    store.setConnected(true);
    const storedGameId = localStorage.getItem('gameId');
    const storedPlayerName = localStorage.getItem('playerName');
    if (storedGameId && storedPlayerName) {
      setTimeout(() => {
        socketService.socket.emit('joinGame', { gameId: storedGameId, playerName: storedPlayerName });
      }, 500);
    }
  },

  handleGameCreated: ({ gameId, game }) => {
    const store = get();
    store.setGameId(gameId);
    store.setGame({
      ...game,
      players: Array.isArray(game?.players) ? [...game.players] : [],
      playerOrder: Array.isArray(game?.playerOrder) ? [...game.playerOrder] : [],
      preGameTimeLeft: store.preGameTimer,
      turnTimeLeft: store.playerTurnTimer,
      currentTurn: null,
      isPreGameTimerActive: false,
      isPlayerTurnTimerActive: false,
      gameStatus: 'lobby',
      host: game?.host
    });
  },

  handleGameStarted: ({ isSpy, word, gameMode, playerOrder, game }) => {
    const store = get();
    const displayWord = isSpy ? (gameMode === 'uniqueSpy' ? word : '') : word;
    
    const updatedGame = {
      ...game,
      players: Array.isArray(game?.players) ? [...game.players] : [],
      playerOrder: Array.isArray(playerOrder) ? [...playerOrder] : [],
      preGameTimeLeft: store.preGameTimer,
      turnTimeLeft: store.playerTurnTimer,
      currentTurn: null,
      currentPlayerIndex: 0,
      isPreGameTimerActive: true,
      isPlayerTurnTimerActive: false,
      gameStatus: 'preGame'
    };

    set({
      gameStarted: true,
      playerRole: isSpy ? 'Spy' : 'Villager',
      word: displayWord,
      game: updatedGame
    });

    localStorage.setItem('gameStarted', 'true');
    localStorage.setItem('playerRole', isSpy ? 'Spy' : 'Villager');
    localStorage.setItem('word', displayWord);
  },

  handlePhaseChange: ({ phase, currentTurn, turnTimeLeft }) => {
    set(state => ({
      game: state.game ? {
        ...state.game,
        phase,
        currentTurn,
        turnTimeLeft,
        isPreGameTimerActive: phase === 'preGame',
        isPlayerTurnTimerActive: phase === 'playing'
      } : null
    }));
  },

  handleTimerUpdate: ({ phase, preGameTimeLeft, turnTimeLeft, currentTurn, players, playerOrder }) => {
    set(state => {
      if (!state.game) return state;
      
      return {
        ...state,
        game: {
          ...state.game,
          phase,
          preGameTimeLeft: preGameTimeLeft !== undefined ? preGameTimeLeft : state.game.preGameTimeLeft,
          turnTimeLeft: turnTimeLeft !== undefined ? turnTimeLeft : state.game.turnTimeLeft,
          currentTurn: currentTurn !== undefined ? currentTurn : state.game.currentTurn,
          players: players || state.game.players,
          playerOrder: playerOrder || state.game.playerOrder,
          isPreGameTimerActive: phase === 'preGame',
          isPlayerTurnTimerActive: phase === 'playing'
        }
      };
    });
  },

  handleError: (message) => {
    alert(message);
    if (message === 'Game not found') {
      const store = get();
      localStorage.removeItem('gameId');
      localStorage.removeItem('gameStarted');
      localStorage.removeItem('playerRole');
      localStorage.removeItem('word');
      
      store.setGameId('');
      store.setGameStarted(false);
      store.setPlayerRole(null);
      store.setWord('');
    }
  }
}));

export default useGameStore;