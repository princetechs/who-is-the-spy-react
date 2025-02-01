const { v4: uuidv4 } = require('uuid');

class GameStateService {
  constructor() {
    this.games = new Map();
  }

  createGame(hostId, hostName) {
    const gameId = uuidv4();
    const game = {
      id: gameId,
      host: hostId,
      hostName,
      players: [{ id: hostId, name: hostName }],
      started: false,
      words: null,
      spy: null,
      gameMode: null,
      timers: {},
      phase: 'waiting',
      turnIndex: 0,
      playerOrder: [],
      currentTurn: null,
      turnTimeLeft: 60,
      preGameTimeLeft: 30
    };
    this.games.set(gameId, game);
    return { gameId, game };
  }

  getGame(gameId) {
    return this.games.get(gameId);
  }

  deleteGame(gameId) {
    return this.games.delete(gameId);
  }

  updateGameState(gameId, updates) {
    const game = this.getGame(gameId);
    if (!game) return null;

    Object.assign(game, updates);
    return game;
  }

  startGame(gameId, words, gameMode) {
    const game = this.getGame(gameId);
    if (!game) return null;

    const randomIndex = Math.floor(Math.random() * words.length);
    const villagerWord = words[randomIndex];
    const spyWord = gameMode === 'uniqueSpy' ? words[Math.floor(Math.random() * words.length)] : '';
    const spyIndex = Math.floor(Math.random() * game.players.length);
    const playerOrder = this._shufflePlayerOrder(game.players.map(p => p.id));

    const updates = {
      started: true,
      words: { villagerWord, spyWord },
      spy: game.players[spyIndex].id,
      gameMode,
      playerOrder,
      currentTurn: null,
      turnTimeLeft: 60,
      preGameTimeLeft: 30,
      phase: 'preGame',
      turnIndex: 0
    };

    return this.updateGameState(gameId, updates);
  }

  _shufflePlayerOrder(playerOrder) {
    for (let i = playerOrder.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [playerOrder[i], playerOrder[j]] = [playerOrder[j], playerOrder[i]];
    }
    return playerOrder;
  }
}

module.exports = GameStateService;