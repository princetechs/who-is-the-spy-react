import React from 'react';
import wordLists from '../config/wordLists.json';
import gameService from '../services/gameService';

function GameSettings() {
  const { selectedCategory, gameMode } = gameService.gameState;

  const handleStartGame = () => {
    const words = wordLists[selectedCategory];
    gameService.startGame(words);
  };

  return (
    <div className="mt-4 space-y-4">
      <div className="space-y-4">
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
        <select
          value={gameMode}
          onChange={(e) => gameService.setGameMode(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="wordlessSpy">Wordless Spy</option>
          <option value="uniqueSpy">Unique Spy</option>
        </select>
      </div>
      <button onClick={handleStartGame}>Start Game</button>
    </div>
  );
}

export default GameSettings;