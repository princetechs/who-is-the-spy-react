import React from 'react';
import Timer from './Timer';

function PlayerCard({ player, isCurrentTurn, isCurrentPlayer, turnTimeLeft, playerNumber, totalPlayers, game }) {
  // Debug - log player data
  React.useEffect(() => {
    console.log('PlayerCard received player:', player);
  }, [player]);

  // Safely determine if this player is next in turn
  const isNextPlayer = () => {
    if (!player || !game || !game.playerOrder || game.playerOrder.length === 0) return false;
    if (!game.currentTurn) return false;
    
    try {
      const currentTurnIndex = game.playerOrder.findIndex(id => id === game.currentTurn);
      if (currentTurnIndex === -1) return false;
      
      const nextTurnIndex = (currentTurnIndex + 1) % game.playerOrder.length;
      const nextPlayerId = game.playerOrder[nextTurnIndex];
      
      return player.id === nextPlayerId;
    } catch (err) {
      console.error("Error determining next player:", err);
      return false;
    }
  };
  
  // Make sure we have a valid player
  if (!player) {
    console.warn("PlayerCard received null/undefined player");
    return (
      <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
        <div className="text-center text-gray-500">Player data unavailable</div>
      </div>
    );
  }
  
  // Extract player properties safely
  const playerId = player.id || '';
  const playerName = player.name || 'Unknown Player';
  
  return (
    <div 
      className={`relative p-4 rounded-lg ${
        isCurrentTurn 
          ? 'bg-blue-50 border-2 border-blue-500 shadow-lg' 
          : isCurrentPlayer 
            ? 'bg-green-50 border-2 border-green-300' 
            : 'bg-gray-50 border border-gray-200'
      }`}
    >
      {/* Turn order badge */}
      <div className="absolute -top-2 -left-2 w-7 h-7 flex items-center justify-center rounded-full text-white font-bold text-sm bg-gray-700 border-2 border-white shadow">
        {playerNumber || '?'}
      </div>
      
      <div className="flex justify-between items-center mb-2 mt-1">
        <div className="flex items-center ml-4">
          <div 
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
              isCurrentTurn ? 'bg-blue-600' : isCurrentPlayer ? 'bg-green-600' : 'bg-gray-500'
            }`}
          >
            {playerName.charAt(0).toUpperCase()}
          </div>
          <div className="ml-3">
            <p className="font-medium text-gray-900">
              {playerName}
              {isCurrentPlayer && <span className="text-xs text-green-700 font-bold ml-1">(You)</span>}
            </p>
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-1 ${isCurrentPlayer ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span className="text-xs text-gray-500">
                {isCurrentTurn ? 'Current Turn' : `Turn ${playerNumber} of ${totalPlayers || 0}`}
              </span>
            </div>
          </div>
        </div>
        
        {isCurrentTurn && (
          <div className="animate-pulse flex-shrink-0 bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-bold">
            Active
          </div>
        )}
      </div>

      {/* Timer for current turn */}
      {isCurrentTurn && turnTimeLeft !== undefined && (
        <div className="mt-2 pt-2 border-t border-blue-200">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-1000 ease-linear"
              style={{ width: `${Math.max(0, (turnTimeLeft / 60) * 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span className="text-blue-700 font-semibold">{Math.max(0, turnTimeLeft)}s left</span>
            {isCurrentTurn && (
              <span className="text-blue-700 animate-pulse font-bold">Speaking now</span>
            )}
          </div>
        </div>
      )}
      
      {/* Next player indicator */}
      {!isCurrentTurn && isNextPlayer() && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="text-xs text-center font-medium text-orange-600">
            Next turn
          </div>
        </div>
      )}
    </div>
  );
}

export default PlayerCard; 