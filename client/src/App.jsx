import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import './App.css';
import wordLists from './config/wordLists.json';

const socket = io(import.meta.env.PROD ? window.location.origin : 'http://localhost:3000', {
  path: '/api/socket'
});

function App() {
  const [connected, setConnected] = useState(false);
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('playerName') || '');
  const [gameId, setGameId] = useState(() => localStorage.getItem('gameId') || '');
  const [game, setGame] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [playerRole, setPlayerRole] = useState(null);
  const [word, setWord] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('fruits');
  const [gameMode, setGameMode] = useState('wordlessSpy');

  useEffect(() => {
    socket.on('connect', () => {
      setConnected(true);
      // Auto-rejoin game if we have stored gameId
      const storedGameId = localStorage.getItem('gameId');
      const storedPlayerName = localStorage.getItem('playerName');
      if (storedGameId && storedPlayerName) {
        socket.emit('joinGame', { gameId: storedGameId, playerName: storedPlayerName });
      }
    });
    socket.on('disconnect', () => setConnected(false));

    socket.on('gameCreated', ({ gameId, game }) => {
      setGameId(gameId);
      setGame(game);
      localStorage.setItem('gameId', gameId);
    });

    socket.on('playerJoined', ({ game }) => {
      setGame(game);
    });

    socket.on('gameStarted', ({ isSpy, word }) => {
      setGameStarted(true);
      setPlayerRole(isSpy ? 'Spy' : 'Villager');
      setWord(word);
      localStorage.setItem('gameStarted', 'true');
      localStorage.setItem('playerRole', isSpy ? 'Spy' : 'Villager');
      localStorage.setItem('word', word);
    });

    socket.on('playerLeft', ({ game }) => {
      setGame(game);
    });

    socket.on('error', (message) => {
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
      socket.off('connect');
      socket.off('disconnect');
      socket.off('gameCreated');
      socket.off('playerJoined');
      socket.off('gameStarted');
      socket.off('playerLeft');
      socket.off('error');
    };
  }, []);

  useEffect(() => {
    if (playerName) {
      localStorage.setItem('playerName', playerName);
    }
  }, [playerName]);

  const createGame = () => {
    if (!playerName) return alert('Please enter your name');
    socket.emit('createGame', playerName);
  };

  const joinGame = () => {
    if (!playerName || !gameId) return alert('Please enter your name and game ID');
    socket.emit('joinGame', { gameId, playerName });
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
    const words = wordLists[selectedCategory];
    socket.emit('startGame', { gameId, words, gameMode });
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
    return (
      <div className="game-container">
        <h2>Game Lobby</h2>
        <p>Game ID: {gameId}</p>
        <div className="players-list">
          <h3>Players:</h3>
          {game.players.map(player => (
            <div key={player.id} className="p-2 border-b last:border-b-0">{player.name}</div>
          ))}
        </div>
        {game.host === socket.id && (
          <div className="mt-4 space-y-4">
            <div className="space-y-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.keys(wordLists).map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
              <select
                value={gameMode}
                onChange={(e) => setGameMode(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="wordlessSpy">Wordless Spy</option>
                <option value="uniqueSpy">Unique Spy</option>
              </select>
            </div>
            <button onClick={startGame}>Start Game</button>
          </div>
        )}
      </div>
    );
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

export default App
