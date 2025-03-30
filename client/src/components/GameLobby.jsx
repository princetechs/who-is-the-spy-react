import { useEffect, useState } from 'react';
import socketService from '../services/socketService';
import PlayerList from './PlayerList';
import GameSettings from './GameSettings';
import wordLists from '../config/wordLists.json';
import useGameStore from '../store/gameStore';

function GameLobby({ gameId, game, onStartGame }) {
  const [copied, setCopied] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const selectedCategory = useGameStore(state => state.selectedCategory);
  const gameMode = useGameStore(state => state.gameMode);
  const endGame = useGameStore(state => state.endGame);

  useEffect(() => {
    // Check if the current socket ID matches the host ID
    const checkHost = () => {
      const currentId = socketService.socket.id;
      const isHostUser = currentId === game.host;
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
    // Pass the gameId to the endGame function
    endGame(gameId);
  };

  const handleStartGame = () => {
    const words = wordLists[selectedCategory];
    onStartGame();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-blue-600 mb-4">Game Lobby</h2>
          
          <div className="bg-white rounded-lg shadow-md p-4 max-w-md mx-auto flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500 mb-1">Game ID:</div>
              <div className="font-mono text-lg">{gameId}</div>
            </div>
            <button
              onClick={handleCopyGameId}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              {copied ? 'Copied!' : 'Copy ID'}
            </button>
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-3 lg:gap-8 space-y-6 lg:space-y-0">
          <div className="lg:col-span-1">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Players ({game?.players?.length || 0})</h3>
                {game?.players?.length < 3 && (
                  <div className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                    Need {3 - (game?.players?.length || 0)} more
                  </div>
                )}
              </div>
              <PlayerList players={game?.players || []} hostId={game?.host} />
              
              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Game Info:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>
                      <span className="font-medium">Category:</span> {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
                    </li>
                    <li>
                      <span className="font-medium">Mode:</span> {gameMode === 'wordlessSpy' ? 'Wordless Spy' : 'Unique Spy'}
                    </li>
                    <li>
                      <span className="font-medium">Host:</span> {game?.players?.find(p => p.id === game.host)?.name || 'Unknown'}
                    </li>
                  </ul>
                </div>
              
                <button
                  onClick={handleLeaveLobby}
                  className="w-full mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                >
                  Leave Lobby
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-4">Game Settings</h3>
              {isHost ? (
                <>
                  <GameSettings onStartGame={handleStartGame} />
                  {game?.players?.length < 3 && (
                    <div className="mt-4 p-3 bg-yellow-50 text-yellow-700 rounded-md">
                      <p className="font-medium">Waiting for players...</p>
                      <p className="text-sm">Share the game ID with friends to join. You need at least 3 players to start.</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="animate-pulse">
                    <p className="text-gray-600 mb-2">Waiting for host to start the game...</p>
                    <div className="w-8 h-8 mx-auto bg-blue-200 rounded-full"></div>
                  </div>
                  
                  <div className="mt-6 bg-gray-50 p-4 rounded-md max-w-md mx-auto text-left">
                    <h4 className="font-medium text-gray-700 mb-2">Game Rules:</h4>
                    <ul className="text-sm text-gray-600 space-y-1 list-disc pl-5">
                      <li>All villagers receive the same word</li>
                      <li>The spy may receive no word or a different word</li>
                      <li>Players take turns describing their word without saying it</li>
                      <li>Try to identify who is the spy without giving away the word!</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GameLobby;