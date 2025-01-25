import { useState, useEffect } from 'react';
import './App.css';
import wordLists from './config/wordLists.json';
import GameLobby from './components/GameLobby';
import gameService from './services/gameService';
import socketService from './services/socketService';

function App() {
  const [connected, setConnected] = useState(false);
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('playerName') || '');
  const [gameId, setGameId] = useState(() => localStorage.getItem('gameId') || '');
  const [game, setGame] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [playerRole, setPlayerRole] = useState(null);
  const [word, setWord] = useState('');

  useEffect(() => {
    socketService.socket.on('connect', () => {
      setConnected(true);
      // Auto-rejoin game if we have stored gameId
      const storedGameId = localStorage.getItem('gameId');
      const storedPlayerName = localStorage.getItem('playerName');
      if (storedGameId && storedPlayerName) {
        // Add a small delay to ensure proper socket connection
        setTimeout(() => {
          socketService.socket.emit('joinGame', { gameId: storedGameId, playerName: storedPlayerName });
        }, 500);
      }
    });
    socketService.socket.on('disconnect', () => setConnected(false));

    socketService.socket.on('gameCreated', ({ gameId, game }) => {
      setGameId(gameId);
      setGame(game);
      localStorage.setItem('gameId', gameId);
    });

    socketService.socket.on('playerJoined', ({ game }) => {
      setGame(game);
    });

    socketService.socket.on('gameStarted', ({ isSpy, word, gameMode }) => {
      setGameStarted(true);
      setPlayerRole(isSpy ? 'Spy' : 'Villager');
      // Only show word to non-spy players, or in uniqueSpy mode
      const displayWord = isSpy ? (gameMode === 'uniqueSpy' ? word : '') : word;
      setWord(displayWord);
      localStorage.setItem('gameStarted', 'true');
      localStorage.setItem('playerRole', isSpy ? 'Spy' : 'Villager');
      localStorage.setItem('word', displayWord);
    });

    socketService.socket.on('playerLeft', ({ game }) => {
      setGame(game);
    });

    socketService.socket.on('error', (message) => {
      alert(message);
      if (message === 'Game not found') {
        localStorage.removeItem('gameId');
        localStorage.removeItem('gameStarted');
        localStorage.removeItem('playerRole');
        localStorage.removeItem('word');
        setGameId('');
        setGameStarted(false);
        setPlayerRole(null);
        setWord('');
      }
    });

    // Check for stored game state
    const storedGameStarted = localStorage.getItem('gameStarted') === 'true';
    const storedPlayerRole = localStorage.getItem('playerRole');
    const storedWord = localStorage.getItem('word');
    if (storedGameStarted && storedPlayerRole && storedWord) {
      setGameStarted(true);
      setPlayerRole(storedPlayerRole);
      setWord(storedWord);
    }

    return () => {
      socketService.socket.off('connect');
      socketService.socket.off('disconnect');
      socketService.socket.off('gameCreated');
      socketService.socket.off('playerJoined');
      socketService.socket.off('gameStarted');
      socketService.socket.off('playerLeft');
      socketService.socket.off('error');
    };
  }, []);

  useEffect(() => {
    if (playerName) {
      localStorage.setItem('playerName', playerName);
    }
  }, [playerName]);

  const createGame = () => {
    if (!playerName) return alert('Please enter your name');
    socketService.socket.emit('createGame', playerName);
  };

  const joinGame = () => {
    if (!playerName || !gameId) return alert('Please enter your name and game ID');
    socketService.socket.emit('joinGame', { gameId, playerName });
  };

  const endGame = () => {
    localStorage.removeItem('gameStarted');
    localStorage.removeItem('playerRole');
    localStorage.removeItem('word');
    setGameStarted(false);
    setPlayerRole(null);
    setWord('');
  };

  const startGame = () => {
    const { selectedCategory, gameMode } = gameService.gameState;
    const words = wordLists[selectedCategory];
    socketService.socket.emit('startGame', { gameId, words, gameMode });
  };

  if (!connected) return <div className="flex items-center justify-center min-h-screen">Connecting to server...</div>;

  if (gameStarted) {
    return (
      <div className="game-container">
        <h2>Game Started!</h2>
        <p>Your Role: {playerRole}</p>
        <p>Your Word: {word}</p>
        <div className="players-list">
          <h3>Players:</h3>
          {game?.players.map(player => (
            <div key={player.id} className="p-2 border-b last:border-b-0">{player.name}</div>
          ))}
        </div>
        <button onClick={endGame} className="mt-4 bg-red-500 hover:bg-red-600">Back to Lobby</button>
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
          <button onClick={joinGame}>Join Game</button>
        </div>
      </div>
    </div>
  );
}

export default App;
