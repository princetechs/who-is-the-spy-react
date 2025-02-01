import React from 'react';

function PlayerList({ players = [] }) {
  if (!players || players.length === 0) {
    return (
      <div className="players-list">
        <div className="text-center p-4 text-gray-500">No players yet</div>
      </div>
    );
  }

  return (
    <div className="players-list space-y-2">
      {players.map(player => (
        <div 
          key={player.id} 
          className="p-3 bg-gray-50 rounded-lg flex items-center space-x-2"
        >
          <div className="w-8 h-8 flex items-center justify-center bg-blue-500 text-white rounded-full">
            {player.name.charAt(0).toUpperCase()}
          </div>
          <span className="font-medium">{player.name}</span>
        </div>
      ))}
    </div>
  );
}

export default PlayerList;