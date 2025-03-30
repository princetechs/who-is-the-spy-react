import React from 'react';
import wordLists from '../config/wordLists.json';
import useGameStore from '../store/gameStore';

function GameSettings({ onStartGame }) {
  const selectedCategory = useGameStore(state => state.selectedCategory);
  const setSelectedCategory = useGameStore(state => state.setSelectedCategory);
  const gameMode = useGameStore(state => state.gameMode);
  const setGameMode = useGameStore(state => state.setGameMode);
  const preGameTimer = useGameStore(state => state.preGameTimer);
  const setPreGameTimer = useGameStore(state => state.setPreGameTimer);
  const playerTurnTimer = useGameStore(state => state.playerTurnTimer);
  const setPlayerTurnTimer = useGameStore(state => state.setPlayerTurnTimer);
  const game = useGameStore(state => state.game);

  const handleStartGame = () => {
    const words = wordLists[selectedCategory];
    if (!words || words.length === 0) {
      console.error('No words available for selected category');
      return;
    }
    
    if (!game || !game.players || game.players.length < 3) {
      alert('You need at least 3 players to start the game');
      return;
    }
    
    onStartGame();
  };

  return (
    <div className="mt-4 space-y-4">
      <div className="space-y-4">
        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
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
        </div>
        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Game Mode</label>
          <select
            value={gameMode}
            onChange={(e) => setGameMode(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="wordlessSpy">Wordless Spy</option>
            <option value="uniqueSpy">Unique Spy</option>
          </select>
          <p className="mt-1 text-sm text-gray-500">
            {gameMode === 'wordlessSpy' 
              ? 'The spy does not get any word' 
              : 'The spy gets a different word from the villagers'}
          </p>
        </div>
        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Pre-game Timer (seconds)</label>
          <input
            type="number"
            min="10"
            max="120"
            value={preGameTimer}
            onChange={(e) => setPreGameTimer(Math.max(10, Math.min(120, parseInt(e.target.value) || 30)))}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Player Turn Timer (seconds)</label>
          <input
            type="number"
            min="30"
            max="300"
            value={playerTurnTimer}
            onChange={(e) => setPlayerTurnTimer(Math.max(30, Math.min(300, parseInt(e.target.value) || 60)))}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div className="pt-4">
        <div className="text-sm text-gray-700 mb-4">
          <p className="font-medium">Game Rules:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Each villager gets the same word</li>
            <li>One player is randomly chosen as the spy</li>
            <li>Players take turns describing their word without saying it</li>
            <li>Try to identify who is the spy!</li>
          </ul>
        </div>
        <button 
          onClick={handleStartGame}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          disabled={!game || !game.players || game.players.length < 3}
        >
          Start Game
        </button>
        {(!game || !game.players || game.players.length < 3) && (
          <p className="mt-2 text-sm text-red-500">You need at least 3 players to start the game</p>
        )}
      </div>
    </div>
  );
}

export default GameSettings;