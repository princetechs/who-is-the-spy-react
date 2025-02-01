const gameStateService = require('./game-state.service');

class TimerManagementService {
  constructor() {
    this.timers = new Map();
  }

  setGameTimer(gameId, timerType, timer) {
    if (!this.timers.has(gameId)) {
      this.timers.set(gameId, {});
    }
    const gameTimers = this.timers.get(gameId);
    gameTimers[timerType] = timer;
  }

  clearGameTimer(gameId, timerType) {
    const gameTimers = this.timers.get(gameId);
    if (gameTimers && gameTimers[timerType]) {
      clearInterval(gameTimers[timerType]);
      delete gameTimers[timerType];
    }
  }

  clearAllGameTimers(gameId) {
    const gameTimers = this.timers.get(gameId);
    if (gameTimers) {
      Object.values(gameTimers).forEach(timer => {
        if (timer) clearInterval(timer);
      });
      this.timers.delete(gameId);
    }
  }

  updateGameTimer(gameId, type, timeLeft) {
    const game = gameStateService.getGame(gameId);
    if (!game) return null;

    const updates = {};
    if (type === 'preGame') {
      updates.preGameTimeLeft = timeLeft;
    } else if (type === 'turn') {
      updates.turnTimeLeft = timeLeft;
    }

    return gameStateService.updateGameState(gameId, updates);
  }

  moveToNextTurn(gameId) {
    const game = gameStateService.getGame(gameId);
    if (!game) return null;

    const updates = {
      turnIndex: (game.turnIndex + 1) % game.playerOrder.length,
      turnTimeLeft: 60
    };
    updates.currentTurn = game.playerOrder[updates.turnIndex];

    return gameStateService.updateGameState(gameId, updates);
  }
}

module.exports = new TimerManagementService();