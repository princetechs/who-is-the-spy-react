import { useEffect } from 'react';
import gameService from '../services/gameService';
import PlayerList from './PlayerList';
import GameSettings from './GameSettings';

function GameLobby({ gameId, game }) {
  useEffect(() => {
    return () => gameService.cleanup();
  }, []);

  return (
    <div className="game-container">
      <h2>Game Lobby</h2>
      <p>Game ID: {gameId}</p>
      <PlayerList players={game.players} />
      {game.host === gameService.socketId && (
        <GameSettings onStartGame={gameService.startGame} />
      )}
    </div>
  );
}

export default GameLobby;