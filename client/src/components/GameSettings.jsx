import React from 'react';
import wordLists from '../config/wordLists.json';
import gameService from '../services/gameService';

function GameSettings({ onStartGame }) {
  const { selectedCategory, gameMode } = gameService.gameState;

  const handleStartGame = () => {
    const words = wordLists[selectedCategory];
    if (!words || words.length === 0) {
      console.error('No words available for selected category');
      return;
    }
    onStartGame(words);
  };

  return (
    <div className="mt-4 space-y-4">
      <div className="space-y-4">
        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => gameService.setSelectedCategory(e.target.value)}
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
            onChange={(e) => gameService.setGameMode(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="wordlessSpy">Wordless Spy</option>
            <option value="uniqueSpy">Unique Spy</option>
          </select>
        </div>
      </div>
      <button 
        onClick={handleStartGame}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        Start Game
      </button>
    </div>
  );
}

export default GameSettings;