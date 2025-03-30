import React from 'react';
import PropTypes from 'prop-types';

function Timer({ timeLeft, initialTime, label, className = '' }) {
  // Ensure we have valid values to work with
  const seconds = timeLeft !== undefined && timeLeft !== null ? 
    Math.max(0, timeLeft) : 0;
  const initial = initialTime || 60;
  
  // Format seconds to minutes and seconds
  const formatTime = () => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Calculate percentage for progress bar
  const percentage = Math.min(100, Math.max(0, (seconds / initial) * 100));
  
  // Determine color based on percentage
  const getColorClass = () => {
    if (percentage > 60) return 'bg-green-500';
    if (percentage > 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  // Add animation for urgency when time is low
  const getAnimationClass = () => {
    return percentage <= 20 ? 'animate-pulse' : '';
  };
  
  return (
    <div className={`${className} w-full`}>
      {label && <div className="text-sm font-medium mb-1">{label}</div>}
      
      <div className="flex items-center justify-between mb-1">
        <div className={`${getAnimationClass()} text-xl font-bold`}>
          {formatTime()}
        </div>
        <div className="text-sm">
          {percentage > 60 ? 'Take your time' : 
           percentage > 30 ? 'Keep it moving' : 
           'Wrap it up!'}
        </div>
      </div>
      
      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${getColorClass()} transition-all duration-1000 ease-linear`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      
      {/* Tick marks for visual reference */}
      <div className="flex justify-between mt-1 px-1">
        {[0, 25, 50, 75, 100].map(tick => (
          <div key={tick} className="w-1 h-1 bg-gray-400 rounded-full"></div>
        ))}
      </div>
    </div>
  );
}

Timer.propTypes = {
  timeLeft: PropTypes.number,
  initialTime: PropTypes.number,
  label: PropTypes.string,
  className: PropTypes.string
};

export default Timer;