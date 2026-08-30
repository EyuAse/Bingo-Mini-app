import React from 'react';
import { useBingo } from '../../context/BingoContext.tsx';

export const BingoActions: React.FC = () => {
  const {
    autoMark,
    toggleAutoMark,
    luckyPicks,
    useLuckyPick,
    claimBingo,
    canWin
  } = useBingo();

  return (
    <div className="fresh-bingo-actions-bar">
      {/* 1. Auto-Daub Toggle Button */}
      <button
        type="button"
        className={`btn-bingo-action-pill auto-daub-btn ${autoMark ? 'active-green' : ''}`}
        onClick={toggleAutoMark}
        title="Toggle Auto Daubing"
      >
        <i className="fa-solid fa-bolt"></i>
        <span>{autoMark ? 'Auto ON' : 'Auto OFF'}</span>
      </button>

      {/* 2. Big Glowing BINGO Call Button */}
      <button
        type="button"
        className={`btn-claim-bingo-gold ${canWin ? 'can-claim-pulsing' : ''}`}
        onClick={claimBingo}
      >
        <i className="fa-solid fa-star"></i>
        <span>BINGO!</span>
        <i className="fa-solid fa-star"></i>
      </button>

      {/* 3. Lucky Pick Power-Up Button */}
      <button
        type="button"
        className="btn-bingo-action-pill lucky-btn"
        onClick={useLuckyPick}
        title="Use Lucky Pick"
      >
        <i className="fa-solid fa-wand-magic-sparkles"></i>
        <span>Pick</span>
        <span className="lucky-count-tag">{luckyPicks}</span>
      </button>
    </div>
  );
};
