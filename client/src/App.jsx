import { useEffect } from 'react';
import './App.css';
import GameLobby from './components/GameLobby';
import socketService from './services/socketService';
import useGameStore from './store/gameStore';
import Timer from './components/Timer';
import PlayerCard from './components/PlayerCard';

function App() {
  const connected = useGameStore(state => state.connected);
  const playerName = useGameStore(state => state.playerName);
  const setPlayerName = useGameStore(state => state.setPlayerName);
  const gameId = useGameStore(state => state.gameId);
  const setGameId = useGameStore(state => state.setGameId);
  const game = useGameStore(state => state.game);
  const gameStarted = useGameStore(state => state.gameStarted);
  const playerRole = useGameStore(state => state.playerRole);
  const word = useGameStore(state => state.word);
  const createGame = useGameStore(state => state.createGame);
  const joinGame = useGameStore(state => state.joinGame);
  const endGame = useGameStore(state => state.endGame);
  const startGame = useGameStore(state => state.startGame);
  const handleConnect = useGameStore(state => state.handleConnect);
  const handleGameCreated = useGameStore(state => state.handleGameCreated);
  const handleGameStarted = useGameStore(state => state.handleGameStarted);
  const handleError = useGameStore(state => state.handleError);
  const setGame = useGameStore(state => state.setGame);

  useEffect(() => {
    const handleDisconnect = () => useGameStore.getState().setConnected(false);
    const handlePlayerJoined = ({ game }) => {
      setGame({
        ...game,
        players: game.players ? (
          Array.isArray(game.players) ? game.players : 
          typeof game.players === 'object' ? Object.entries(game.players).map(([id, data]) => ({...data, id})) : 
          []
        ) : [],
        playerOrder: game.playerOrder && Array.isArray(game.playerOrder) ? game.playerOrder : [],
        preGameTimeLeft: game.preGameTimeLeft || 0,
        turnTimeLeft: game.turnTimeLeft || 0,
        currentTurn: game.currentTurn || null,
        isPreGameTimerActive: game.isPreGameTimerActive || false,
        isPlayerTurnTimerActive: game.isPlayerTurnTimerActive || false,
        host: game.host
      });
    };
    
    const handlePlayerLeft = ({ game }) => {
      setGame(prev => ({
        ...prev,
        ...game,
        players: game.players ? (
          Array.isArray(game.players) ? game.players : 
          typeof game.players === 'object' ? Object.entries(game.players).map(([id, data]) => ({...data, id})) : 
          prev?.players || []
        ) : prev?.players || [],
        playerOrder: game.playerOrder || prev?.playerOrder || [],
        preGameTimeLeft: prev?.preGameTimeLeft || 0,
        turnTimeLeft: prev?.turnTimeLeft || 0,
        currentTurn: prev?.currentTurn || null,
        isPreGameTimerActive: prev?.isPreGameTimerActive || false,
        isPlayerTurnTimerActive: prev?.isPlayerTurnTimerActive || false
      }));
    };
    const handleTurnStarted = ({ playerId, timeLeft }) => {
      setGame(prev => ({
        ...prev,
        currentTurn: playerId,
        turnTimeLeft: timeLeft,
        isPlayerTurnTimerActive: true,
        players: prev.players,
        playerOrder: prev.playerOrder
      }));
    };
    const handleTurnEnded = () => {
      setGame(prev => ({
        ...prev,
        currentTurn: null,
        turnTimeLeft: 0,
        isPlayerTurnTimerActive: false,
        players: prev.players,
        playerOrder: prev.playerOrder
      }));
    };
    const handleTimerUpdate = ({ preGameTimeLeft, turnTimeLeft, currentTurn, playerOrder, gameStatus }) => {
      setGame(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          preGameTimeLeft: preGameTimeLeft !== undefined ? preGameTimeLeft : prev.preGameTimeLeft,
          turnTimeLeft: turnTimeLeft !== undefined ? turnTimeLeft : prev.turnTimeLeft,
          currentTurn: currentTurn !== undefined ? currentTurn : prev.currentTurn,
          playerOrder: playerOrder || prev.playerOrder || [],
          players: prev.players || [],
          isPreGameTimerActive: preGameTimeLeft > 0,
          isPlayerTurnTimerActive: turnTimeLeft > 0,
          gameStatus: gameStatus || prev.gameStatus
        };
      });
    };

    socketService.socket.on('connect', handleConnect);
    socketService.socket.on('disconnect', handleDisconnect);
    socketService.socket.on('gameCreated', handleGameCreated);
    socketService.socket.on('playerJoined', handlePlayerJoined);
    socketService.socket.on('gameStarted', handleGameStarted);
    socketService.socket.on('playerLeft', handlePlayerLeft);
    socketService.socket.on('error', handleError);
    socketService.socket.on('turnStarted', handleTurnStarted);
    socketService.socket.on('turnEnded', handleTurnEnded);
    socketService.socket.on('timerUpdate', handleTimerUpdate);
  
    return () => {
      socketService.socket.off('connect');
      socketService.socket.off('disconnect');
      socketService.socket.off('gameCreated');
      socketService.socket.off('playerJoined');
      socketService.socket.off('gameStarted');
      socketService.socket.off('playerLeft');
      socketService.socket.off('error');
      socketService.socket.off('turnStarted');
      socketService.socket.off('turnEnded');
      socketService.socket.off('timerUpdate');
    };
  }, []);

  // Debug useEffect to help troubleshoot player issues
  useEffect(() => {
    if (game) {
      console.log('Game state updated:', {
        playersType: typeof game.players,
        isArray: Array.isArray(game.players),
        players: game.players,
        playerCount: Array.isArray(game.players) ? game.players.length : 
                    typeof game.players === 'object' ? Object.keys(game.players).length : 0,
        playerOrderLength: game.playerOrder?.length || 0
      });
    }
  }, [game]);

  if (!connected) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Connecting to server...</h2>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    </div>
  );

  if (gameStarted) {
    // Ensure we have a properly initialized game object with players
    const safeGame = {
      ...game,
      players: game?.players || [],
      playerOrder: game?.playerOrder || []
    };
    
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-center text-blue-700 mb-6">Who is the Spy?</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
            {/* Left column - Role and Instructions */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-4 mb-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg border-2 border-blue-100 mb-4">
                  <div className="text-lg font-semibold text-blue-800 mb-1">Your Role:</div>
                  <div className="text-2xl font-bold text-blue-900">{playerRole}</div>
                  
                  <div className="mt-4 text-lg font-semibold text-blue-800 mb-1">Your Word:</div>
                  <div className="text-2xl font-bold text-blue-900">
                    {playerRole === 'Spy' && safeGame?.gameMode === 'wordlessSpy' 
                      ? '(No word as spy)' 
                      : word || '(No word assigned)'}
                  </div>
                </div>
                
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h3 className="font-semibold text-yellow-800 mb-2">How to Play:</h3>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• When it's your turn, describe your word without saying it directly</li>
                    <li>• If you're a villager, try to signal to other villagers you know the word</li>
                    <li>• If you're the spy, try to blend in without being detected</li>
                    <li>• Pay attention to other players' descriptions to identify the spy!</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Center column - Game Status and Timer */}
            <div className="md:col-span-2">
              {/* Timer Section - Highlighted */}
              {safeGame?.phase === 'preGame' ? (
                <div className="bg-white rounded-lg shadow-md p-4 mb-4">
                  <div className="bg-blue-100 border-2 border-blue-300 rounded-lg p-4 text-center">
                    <h2 className="text-xl font-bold text-blue-800 mb-2">Game Starting Soon</h2>
                    <p className="text-blue-700 mb-3">
                      Use this time to think about your strategy!
                    </p>
                    <Timer 
                      timeLeft={safeGame.preGameTimeLeft} 
                      label="Preparation time:" 
                      className="text-blue-900"
                      initialTime={45}
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-md p-4 mb-4">
                  <div className="bg-green-100 border-2 border-green-300 rounded-lg p-4 text-center">
                    <h2 className="text-xl font-bold text-green-800 mb-2">
                      {safeGame?.currentTurn === socketService.id 
                        ? "It's Your Turn!" 
                        : safeGame?.currentTurn && safeGame.players
                          ? `${(Array.isArray(safeGame.players) 
                               ? safeGame.players.find(p => p.id === safeGame.currentTurn)?.name 
                               : typeof safeGame.players === 'object' 
                                 ? safeGame.players[safeGame.currentTurn]?.name 
                                 : null) || 'Player'}'s Turn`
                          : "Waiting for turn assignment..."}
                    </h2>
                    <Timer 
                      timeLeft={safeGame?.turnTimeLeft || 0} 
                      label="Time remaining:" 
                      className="text-green-900"
                      initialTime={60}
                    />
                  </div>
                </div>
              )}

              {/* Players List */}
              <div className="bg-white rounded-lg shadow-md p-4">
                <h3 className="text-lg font-semibold mb-4">
                  Players: {Array.isArray(safeGame?.players) ? safeGame.players.length : 
                            typeof safeGame?.players === 'object' ? Object.keys(safeGame.players).length : 0}
                </h3>
                
                {(!safeGame?.players || 
                  (Array.isArray(safeGame.players) && safeGame.players.length === 0) ||
                  (typeof safeGame.players === 'object' && Object.keys(safeGame.players).length === 0)) ? (
                  <div className="text-center p-4 text-gray-500">No players found</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {safeGame?.playerOrder && safeGame.playerOrder.length > 0 ? (
                      // If we have a player order array
                      safeGame.playerOrder.map((playerId, index) => {
                        // Handle both array and object formats for players
                        const player = Array.isArray(safeGame.players) 
                          ? safeGame.players.find(p => p.id === playerId)
                          : { ...safeGame.players[playerId], id: playerId };
                        
                        if (!player) {
                          console.warn(`Player with ID ${playerId} not found in players list`);
                          return null;
                        }
                        
                        const isCurrentTurn = playerId === safeGame.currentTurn;
                        const isCurrentPlayer = playerId === socketService.id;
                        
                        return (
                          <PlayerCard 
                            key={playerId}
                            player={player}
                            isCurrentTurn={isCurrentTurn}
                            isCurrentPlayer={isCurrentPlayer}
                            turnTimeLeft={isCurrentTurn ? safeGame.turnTimeLeft : null}
                            playerNumber={index + 1}
                            totalPlayers={Array.isArray(safeGame.players) ? safeGame.players.length : Object.keys(safeGame.players).length}
                            game={safeGame}
                          />
                        );
                      }).filter(Boolean)
                    ) : (
                      // If no player order, use the players directly
                      (Array.isArray(safeGame.players) 
                        ? safeGame.players
                        : Object.entries(safeGame.players).map(([id, data]) => ({...data, id}))
                      ).map((player, index) => (
                        <PlayerCard 
                          key={player.id || index}
                          player={player}
                          isCurrentTurn={player.id === safeGame.currentTurn}
                          isCurrentPlayer={player.id === socketService.id}
                          turnTimeLeft={player.id === safeGame.currentTurn ? safeGame.turnTimeLeft : null}
                          playerNumber={index + 1}
                          totalPlayers={Array.isArray(safeGame.players) ? safeGame.players.length : Object.keys(safeGame.players).length}
                          game={safeGame}
                        />
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <button 
            onClick={() => endGame(gameId)}
            className="w-full mt-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-semibold"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  if (game) {
    return <GameLobby gameId={gameId} game={game} onStartGame={startGame} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center text-blue-600 mb-8">Who is the Spy?</h1>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
            <input
              type="text"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <button 
            onClick={createGame} 
            disabled={!playerName}
            className={`w-full py-3 rounded-lg font-semibold transition-colors ${
              playerName ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Create New Game
          </button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or join existing game</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Game ID</label>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Enter game ID"
                value={gameId}
                onChange={(e) => setGameId(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button 
                onClick={() => joinGame(gameId)}
                disabled={!playerName || !gameId}
                className={`px-4 py-2 rounded-md font-semibold ${
                  playerName && gameId ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Join
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
