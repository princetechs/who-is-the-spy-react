const gameStateService = require('./game-state.service');
const playerManagementService = require('./player-management.service');
const timerManagementService = require('./timer-management.service');

class GameService {
  createGame(hostId, hostName) {
    return gameStateService.createGame(hostId, hostName);
  }

  getGame(gameId) {
    return gameStateService.getGame(gameId);
  }

  joinGame(gameId, playerId, playerName) {
    return playerManagementService.joinGame(gameId, playerId, playerName);
  }

  startGame(gameId, words, gameMode) {
    return gameStateService.startGame(gameId, words, gameMode);
  }

  handlePlayerDisconnect(playerId) {
    const affectedGames = playerManagementService.handlePlayerDisconnect(playerId);
    affectedGames.forEach(({ gameId }) => {
      timerManagementService.clearAllGameTimers(gameId);
    });
    return affectedGames;
  }

  updateGameTimer(gameId, type, timeLeft) {
    return timerManagementService.updateGameTimer(gameId, type, timeLeft);
  }

  moveToNextTurn(gameId) {
    return timerManagementService.moveToNextTurn(gameId);
  }

  setGameTimer(gameId, timerType, timer) {
    timerManagementService.setGameTimer(gameId, timerType, timer);
  }

  clearGameTimer(gameId, timerType) {
    timerManagementService.clearGameTimer(gameId, timerType);
  }

  isGameHost(gameId, playerId) {
    return playerManagementService.isGameHost(gameId, playerId);
  }
}

module.exports = new GameService();