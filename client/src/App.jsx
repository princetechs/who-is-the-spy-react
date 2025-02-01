import { useEffect } from 'react';
import './App.css';
import GameLobby from './components/GameLobby';
import socketService from './services/socketService';
import useGameStore from './store/gameStore';
import Timer from './components/Timer';

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
        players: Array.isArray(game.players) ? game.players : [],
        playerOrder: Array.isArray(game.playerOrder) ? game.playerOrder : [],
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
        players: game.players || prev?.players || [],
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
          playerOrder: playerOrder || prev.playerOrder,
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

  if (!connected) return <div className="flex items-center justify-center min-h-screen">Connecting to server...</div>;

  if (gameStarted) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Game Started!</h2>
          <div className="bg-white rounded-lg shadow-lg p-6">
            {/* Timer Section */}
            {game?.phase === 'preGame' && (
              <Timer 
                timeLeft={game.preGameTimeLeft} 
                label="Game starts in:" 
                className="text-blue-600 mb-8"
              />
            )}
            {game?.phase === 'playing' && (
              <Timer 
                timeLeft={game.turnTimeLeft} 
                label={`${game.players?.find(p => p.id === game.currentTurn)?.name}'s turn:`}
                className="text-green-600 mb-8"
              />
            )}

            {/* Role and Word Section */}
            <div className="text-center mb-8 p-4 bg-gray-50 rounded-lg">
              <p className="text-xl mb-2">Role: <span className="font-bold">{playerRole}</span></p>
              <p className="text-xl">Word: <span className="font-bold">{word}</span></p>
            </div>

            {/* Players List */}
            {game?.playerOrder?.length > 0 && (
              <div className="mt-8">
                <h3 className="text-xl font-bold mb-4">Players:</h3>
                <div className="space-y-3">
                  {game.playerOrder.map((playerId, index) => {
                    const player = game.players?.find(p => p.id === playerId);
                    const isCurrentTurn = playerId === game.currentTurn;
                    
                    return player && (
                      <div 
                        key={playerId}
                        className={`p-4 rounded-lg flex items-center justify-between
                          ${isCurrentTurn ? 'bg-blue-50 border-2 border-blue-400' : 'bg-gray-50'}`}
                      >
                        <div className="flex items-center space-x-4">
                          <span className="w-8 h-8 flex items-center justify-center bg-blue-500 text-white rounded-full">
                            {index + 1}
                          </span>
                          <span className="font-medium">{player.name}</span>
                        </div>
                        {isCurrentTurn && <span className="text-blue-600">Current Turn</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <button 
              onClick={endGame}
              className="w-full mt-8 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              Back to Lobby
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (game) {
    return <GameLobby gameId={gameId} game={game} onStartGame={startGame} />;
  }

  return (
    <div className="game-container">
      <h1>Who is the Spy?</h1>
      <div className="input-container">
        <input
          type="text"
          placeholder="Enter your name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
        />
      </div>
      <div className="button-container">
        <button onClick={createGame}>Create Game</button>
        <div className="join-game">
          <input
            type="text"
            placeholder="Enter game ID"
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
          />
          <button onClick={() => joinGame(gameId)}>Join Game</button>
        </div>
      </div>
    </div>
  );
}

export default App;
