import { useEffect, useState } from 'react';
import gameService from '../services/gameService';
import socketService from '../services/socketService';
import PlayerList from './PlayerList';
import GameSettings from './GameSettings';

function GameLobby({ gameId, game, onStartGame }) {
  const [copied, setCopied] = useState(false);
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    // Check if the current socket ID matches the host ID
    const checkHost = () => {
      const currentId = socketService.socket.id;
      const isHostUser = currentId === game.host;
      console.log('Host check:', {
        currentId,
        gameHost: game.host,
        isHost: isHostUser,
        socketConnected: socketService.socket.connected
      });
      setIsHost(isHostUser);
    };
    
    // Initial host check
    if (game.host && socketService.socket.connected) {
      checkHost();
    }

    // Create event listeners for both connect and reconnect events
    const handleConnection = () => {
      console.log('Socket connected/reconnected, rechecking host status');
      if (game.host) {
        setTimeout(checkHost, 100); // Small delay to ensure socket ID is updated
      }
    };
    
    socketService.socket.on('connect', handleConnection);
    socketService.socket.on('reconnect', handleConnection);
    
    // Cleanup function
    return () => {
      socketService.socket.off('connect', handleConnection);
      socketService.socket.off('reconnect', handleConnection);
    };
  }, [game.host]);

  const handleCopyGameId = async () => {
    try {
      await navigator.clipboard.writeText(gameId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy game ID:', err);
    }
  };

  const handleLeaveLobby = () => {
    gameService.endGame(); // Use endGame instead of clearGameState to properly cleanup
  };

  return (
    <div className="game-container max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-4">Game Lobby</h2>
        <div className="flex items-center justify-center space-x-2 bg-gray-100 p-3 rounded-lg max-w-md mx-auto">
          <span className="font-mono">{gameId}</span>
          <button
            onClick={handleCopyGameId}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            {copied ? 'Copied!' : 'Copy ID'}
          </button>
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-3 lg:gap-8 space-y-6 lg:space-y-0">
        <div className="lg:col-span-1">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Players</h3>
            <PlayerList players={game?.players || []} />
            <button
              onClick={handleLeaveLobby}
              className="w-full mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              Leave Lobby
            </button>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Game Settings</h3>
            {isHost ? (
              <GameSettings onStartGame={onStartGame} />
            ) : (
              <p className="text-gray-600">Waiting for host to start the game...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default GameLobby;