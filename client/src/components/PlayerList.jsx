import React from 'react';
import socketService from '../services/socketService';

function PlayerList({ players, hostId }) {
  const currentPlayerId = socketService.id;

  if (!players || players.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500 italic">
        No players have joined yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {players.map((player, index) => {
        const isCurrentPlayer = player.id === currentPlayerId;
        const isHost = player.id === hostId;
        
        return (
          <div 
            key={player.id}
            className={`flex items-center justify-between p-3 rounded-lg ${
              isCurrentPlayer 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-gray-50 border border-gray-100'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div 
                className={`w-8 h-8 flex items-center justify-center rounded-full text-white font-medium ${
                  isHost ? 'bg-purple-500' : 'bg-gray-500'
                }`}
              >
                {player.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-medium">
                  {player.name} 
                  {isCurrentPlayer && <span className="text-green-600 text-xs ml-1">(You)</span>}
                </div>
                {isHost && (
                  <div className="text-xs text-purple-600 font-medium">Host</div>
                )}
              </div>
            </div>
            
            <div className="flex items-center">
              <div 
                className={`w-2 h-2 rounded-full ${
                  isCurrentPlayer ? 'bg-green-500' : 'bg-gray-300'
                }`}
              ></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default PlayerList;