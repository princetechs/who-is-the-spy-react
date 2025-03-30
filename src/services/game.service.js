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
      timers: {},
      phase: 'lobby',
      playerOrder: [],
      preGameTimeLeft: 0,
      turnTimeLeft: 0,
      currentTurn: null,
      turnIndex: 0,
      gameStatus: 'lobby',
      createdAt: Date.now()
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
    
    // Check if player already exists in the game
    const existingPlayer = game.players.find(p => p.id === playerId);
    if (existingPlayer) {
      // Update player name if needed
      existingPlayer.name = playerName;
    } else {
      // Add new player
      game.players.push({ id: playerId, name: playerName });
    }
    
    return game;
  }

  removePlayerFromGame(gameId, playerId) {
    const game = this.getGame(gameId);
    if (!game) return null;
    
    // Find player index
    const playerIndex = game.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return null;
    
    // Remove player from the game
    game.players.splice(playerIndex, 1);
    
    // If game is in progress, also remove from player order
    if (game.started && game.playerOrder) {
      const orderIndex = game.playerOrder.indexOf(playerId);
      if (orderIndex !== -1) {
        game.playerOrder.splice(orderIndex, 1);
        
        // Adjust current turn if needed
        if (game.currentTurn === playerId) {
          this._moveToNextPlayerAfterDisconnect(game);
        } else if (orderIndex < game.turnIndex) {
          // Adjust turn index if removed player was before current turn
          game.turnIndex = Math.max(0, game.turnIndex - 1);
        }
      }
    }
    
    // If no players left, delete the game
    if (game.players.length === 0) {
      this._clearGameTimers(game);
      this.games.delete(gameId);
      return null;
    }
    
    // If host left, assign a new host
    if (game.host === playerId && game.players.length > 0) {
      game.host = game.players[0].id;
    }
    
    return game;
  }

  startGame(gameId, words, gameMode) {
    const game = this.getGame(gameId);
    if (!game) return null;

    // Ensure we have enough players (at least 3)
    if (game.players.length < 3) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * words.length);
    const villagerWord = words[randomIndex];
    let spyWord = '';
    
    if (gameMode === 'uniqueSpy') {
      // Make sure spy word is different from villager word
      let spyIndex;
      do {
        spyIndex = Math.floor(Math.random() * words.length);
      } while (spyIndex === randomIndex && words.length > 1);
      
      spyWord = words[spyIndex];
    }
    
    const spyIndex = Math.floor(Math.random() * game.players.length);
    const playerOrder = this._shufflePlayerOrder(game.players.map(p => p.id));

    game.started = true;
    game.words = { villagerWord, spyWord };
    game.spy = game.players[spyIndex].id;
    game.gameMode = gameMode;
    game.playerOrder = playerOrder;
    game.currentTurn = null;
    game.turnTimeLeft = 60;
    
    // Preparation time scales with player count
    const basePreparationTime = 30; // 30 seconds base
    const additionalTimePerPlayer = 5; // 5 seconds per player beyond 3
    const additionalPlayers = Math.max(0, game.players.length - 3);
    game.preGameTimeLeft = basePreparationTime + (additionalTimePerPlayer * additionalPlayers);
    
    game.phase = 'preGame';
    game.turnIndex = 0;
    game.gameStatus = 'preGame';
    game.rounds = []; // Track rounds of play
    game.roundCount = 0;

    return game;
  }

  handlePlayerDisconnect(playerId) {
    let affectedGames = [];
    
    this.games.forEach((game, gameId) => {
      const playerIndex = game.players.findIndex(p => p.id === playerId);
      
      if (playerIndex !== -1) {
        this._clearGameTimers(game);
        
        // Remove player from the game
        game.players.splice(playerIndex, 1);
        
        // If the game is in progress, also remove from player order
        if (game.started && game.playerOrder) {
          const orderIndex = game.playerOrder.indexOf(playerId);
          if (orderIndex !== -1) {
            game.playerOrder.splice(orderIndex, 1);
            
            // Adjust current turn if needed
            if (game.currentTurn === playerId) {
              this._moveToNextPlayerAfterDisconnect(game);
            } else if (orderIndex < game.turnIndex) {
              // Adjust turn index if removed player was before current turn
              game.turnIndex = Math.max(0, game.turnIndex - 1);
            }
          }
        }
        
        // If no players left, delete the game
        if (game.players.length === 0) {
          this.games.delete(gameId);
        } 
        // If host left, assign a new host
        else if (game.host === playerId) {
          game.host = game.players[0].id;
          affectedGames.push({ gameId, game });
        }
        // Otherwise just update the game state
        else {
          affectedGames.push({ gameId, game });
        }
        
        // If active game doesn't have enough players to continue (min 3)
        if (game.started && game.players.length < 3) {
          game.started = false;
          game.phase = 'lobby';
          game.gameStatus = 'lobby';
          game.spy = null;
          game.currentTurn = null;
          game.words = null;
        }
      }
    });
    
    // Cleanup old games
    this._cleanupOldGames();
    
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
    if (!game || !game.playerOrder || game.playerOrder.length === 0) return null;

    // Add current round to history
    if (game.currentTurn) {
      game.rounds.push({
        playerId: game.currentTurn,
        playerName: game.players.find(p => p.id === game.currentTurn)?.name || 'Unknown',
        roundNumber: ++game.roundCount
      });
    }
    
    // Move to next player
    game.turnIndex = (game.turnIndex + 1) % game.playerOrder.length;
    game.currentTurn = game.playerOrder[game.turnIndex];
    
    // Adjust turn time (slightly shorter as the game progresses)
    const baseTurnTime = 60; // 60 seconds base
    const turnTimeAdjustment = Math.max(0, 5 - game.players.length) * 10; // 10 seconds extra per player below 5
    const roundPenalty = Math.min(10, Math.floor(game.rounds.length / game.players.length) * 5); // 5 second reduction per full round
    
    game.turnTimeLeft = Math.max(30, baseTurnTime + turnTimeAdjustment - roundPenalty);

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

  _moveToNextPlayerAfterDisconnect(game) {
    if (!game.playerOrder || game.playerOrder.length === 0) {
      game.currentTurn = null;
      return;
    }
    
    // If we have playerOrder, set to next player in order
    if (game.turnIndex >= game.playerOrder.length) {
      game.turnIndex = 0;
    }
    
    game.currentTurn = game.playerOrder[game.turnIndex];
    game.turnTimeLeft = 60; // Reset timer for the new player
  }

  _shufflePlayerOrder(playerOrder) {
    const shuffled = [...playerOrder];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
  
  _cleanupOldGames() {
    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    this.games.forEach((game, gameId) => {
      // Remove games older than 24 hours that aren't active
      if (!game.started && (now - (game.createdAt || 0) > ONE_DAY)) {
        this._clearGameTimers(game);
        this.games.delete(gameId);
      }
    });
  }
}

module.exports = GameService;