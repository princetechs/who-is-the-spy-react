import React from 'react';

function PlayerList({ players }) {
  return (
    <div className="players-list">
      <h3>Players:</h3>
      {players.map(player => (
        <div key={player.id} className="p-2 border-b last:border-b-0">
          {player.name}
        </div>
      ))}
    </div>
  );
}

export default PlayerList;