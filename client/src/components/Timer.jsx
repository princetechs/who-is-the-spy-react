import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

function Timer({ timeLeft, label, className = '' }) {
  const [time, setTime] = useState(timeLeft);

  useEffect(() => {
    setTime(timeLeft);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    if (typeof seconds !== 'number' || isNaN(seconds)) return '00:00';
    const minutes = Math.floor(Math.max(0, seconds) / 60);
    const remainingSeconds = Math.max(0, seconds) % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  return (
    <div className={`text-center ${className}`}>
      {label && <div className="text-lg mb-1">{label}</div>}
      <div className="font-mono text-3xl font-bold">{formatTime(time)}</div>
    </div>
  );
}

Timer.propTypes = {
  timeLeft: PropTypes.number.isRequired,
  label: PropTypes.string,
  className: PropTypes.string
};

export default Timer;