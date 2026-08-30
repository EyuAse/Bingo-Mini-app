import React, { useState, useEffect } from 'react';

export const DailyTimer: React.FC = () => {
  // Start with 9h 54m 35s = 35675 seconds
  const [totalSeconds, setTotalSeconds] = useState<number>(35675);

  useEffect(() => {
    const timer = setInterval(() => {
      setTotalSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return (
    <div className="daily-leaderboard">
      <div className="leaderboard-title">
        <i className="fa-regular fa-clock"></i>
        Daily Leaderboard
      </div>
      <div className="countdown-timer" id="daily-countdown">
        <div className="timer-block">
          <div className="timer-number" id="timer-hours">
            {hours.toString().padStart(2, '0')}
          </div>
          <span className="timer-label">HRS</span>
        </div>
        <span className="timer-separator">:</span>
        <div className="timer-block">
          <div className="timer-number" id="timer-minutes">
            {minutes.toString().padStart(2, '0')}
          </div>
          <span className="timer-label">MIN</span>
        </div>
        <span className="timer-separator">:</span>
        <div className="timer-block">
          <div className="timer-number" id="timer-seconds">
            {seconds.toString().padStart(2, '0')}
          </div>
          <span className="timer-label">SEC</span>
        </div>
      </div>
    </div>
  );
};
