const gameStateService = require('./game-state.service');

class PlayerManagementService {
  joinGame(gameId, playerId, playerName) {
    const game = gameStateService.getGame(gameId);
    if (!game) return null;
    if (game.started) return 'started';
    
    game.players.push({ id: playerId, name: playerName });
    return game;
  }

  handlePlayerDisconnect(playerId) {
    let affectedGames = [];
    const games = gameStateService.games;
    
    games.forEach((game, gameId) => {
      if (game.players.some(p => p.id === playerId)) {
        game.players = game.players.filter(p => p.id !== playerId);
        
        if (game.players.length === 0) {
          gameStateService.deleteGame(gameId);
        } else if (game.host === playerId) {
          game.host = game.players[0].id;
          affectedGames.push({ gameId, game });
        }
      }
    });
    
    return affectedGames;
  }

  isPlayerInGame(gameId, playerId) {
    const game = gameStateService.getGame(gameId);
    return game ? game.players.some(p => p.id === playerId) : false;
  }

  getPlayerById(gameId, playerId) {
    const game = gameStateService.getGame(gameId);
    return game ? game.players.find(p => p.id === playerId) : null;
  }

  isGameHost(gameId, playerId) {
    const game = gameStateService.getGame(gameId);
    return game ? game.host === playerId : false;
  }
}

module.exports = PlayerManagementService;