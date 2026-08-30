import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.tsx';

export const DailyTimer: React.FC = () => {
  const { switchPage } = useApp();
  // Start with 9h 54m 28s = 35668 seconds
  const [totalSeconds, setTotalSeconds] = useState<number>(35668);

  useEffect(() => {
    const timer = setInterval(() => {
      setTotalSeconds(prev => (prev > 0 ? prev - 1 : 86400));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return (
    <div className="fresh-leaderboard-countdown-card">
      {/* Top Title & View Link */}
      <div className="leaderboard-card-header">
        <div className="leaderboard-title-left">
          <div className="trophy-icon-circ">
            <i className="fa-solid fa-trophy"></i>
          </div>
          <h3 className="leaderboard-heading-txt">Daily Leaderboard</h3>
        </div>

        <button
          type="button"
          className="btn-view-leaderboard-gold"
          onClick={() => switchPage('leader')}
        >
          <span>View Leaderboard</span>
          <i className="fa-solid fa-chevron-right"></i>
        </button>
      </div>

      {/* 3 Yellow Countdown Block Digits */}
      <div className="countdown-blocks-row">
        <div className="time-digit-block">
          <span className="digit-huge">{hours.toString().padStart(2, '0')}</span>
          <span className="digit-unit-lbl">HRS</span>
        </div>

        <span className="time-digit-sep">:</span>

        <div className="time-digit-block">
          <span className="digit-huge">{minutes.toString().padStart(2, '0')}</span>
          <span className="digit-unit-lbl">MIN</span>
        </div>

        <span className="time-digit-sep">:</span>

        <div className="time-digit-block">
          <span className="digit-huge">{seconds.toString().padStart(2, '0')}</span>
          <span className="digit-unit-lbl">SEC</span>
        </div>
      </div>
    </div>
  );
};
