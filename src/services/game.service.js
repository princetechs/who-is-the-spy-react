const { v4: uuidv4 } = require('uuid');

class GameService {
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
      timers: {}
    };
    this.games.set(gameId, game);
    return { gameId, game };
  }

  getGame(gameId) {
    return this.games.get(gameId);
  }

  joinGame(gameId, playerId, playerName) {
    const game = this.getGame(gameId);
    if (!game) return null;
    if (game.started) return 'started';
    
    game.players.push({ id: playerId, name: playerName });
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

    game.started = true;
    game.words = { villagerWord, spyWord };
    game.spy = game.players[spyIndex].id;
    game.gameMode = gameMode;
    game.playerOrder = playerOrder;
    game.currentTurn = null;
    game.turnTimeLeft = 60;
    game.preGameTimeLeft = 30;
    game.phase = 'preGame';
    game.turnIndex = 0;

    return game;
  }

  handlePlayerDisconnect(playerId) {
    let affectedGames = [];
    this.games.forEach((game, gameId) => {
      if (game.players.some(p => p.id === playerId)) {
        this._clearGameTimers(game);
        game.players = game.players.filter(p => p.id !== playerId);
        
        if (game.players.length === 0) {
          this.games.delete(gameId);
        } else if (game.host === playerId) {
          game.host = game.players[0].id;
          affectedGames.push({ gameId, game });
        }
      }
    });
    return affectedGames;
  }

  updateGameTimer(gameId, type, timeLeft) {
    const game = this.getGame(gameId);
    if (!game) return null;

    if (type === 'preGame') {
      game.preGameTimeLeft = timeLeft;
    } else if (type === 'turn') {
      game.turnTimeLeft = timeLeft;
    }
    return game;
  }

  moveToNextTurn(gameId) {
    const game = this.getGame(gameId);
    if (!game) return null;

    game.turnIndex = (game.turnIndex + 1) % game.playerOrder.length;
    game.currentTurn = game.playerOrder[game.turnIndex];
    game.turnTimeLeft = 60;

    return game;
  }

  setGameTimer(gameId, timerType, timer) {
    const game = this.getGame(gameId);
    if (!game) return;
    
    if (!game.timers) game.timers = {};
    game.timers[timerType] = timer;
  }

  _clearGameTimers(game) {
    if (game.timers) {
      Object.values(game.timers).forEach(timer => {
        if (timer) clearInterval(timer);
      });
    }
  }

  _shufflePlayerOrder(playerOrder) {
    for (let i = playerOrder.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [playerOrder[i], playerOrder[j]] = [playerOrder[j], playerOrder[i]];
    }
    return playerOrder;
  }
}

module.exports = GameService;