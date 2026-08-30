import React from 'react';

export const PatternDisplay: React.FC = () => {
  // 5x5 dots with diagonal indices active (0, 6, 12, 18, 24)
  const diagonalDots = [0, 6, 12, 18, 24];

  return (
    <div className="sidebar-panel pattern-panel">
      <div className="sidebar-label">PATTERN</div>
      <div className="pattern-grid-wrapper">
        <div className="pattern-grid" id="pattern-grid">
          {Array.from({ length: 25 }).map((_, idx) => {
            const isActive = diagonalDots.includes(idx);
            return (
              <div
                key={idx}
                className={`pattern-dot ${isActive ? 'active' : ''}`}
                data-idx={idx}
              />
            );
          })}
        </div>
        {/* Connecting Line SVG */}
        <svg className="pattern-line-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
          <line
            x1="10"
            y1="10"
            x2="90"
            y2="90"
            stroke="#ffffff"
            strokeWidth="6"
            strokeLinecap="round"
            filter="drop-shadow(0 0 4px #a855f7)"
          />
        </svg>
      </div>
      <div className="pattern-name" id="pattern-name-display">
        Diagonal
      </div>
      <div className="pattern-prize">
        Next Prize: <span className="gold"><i className="fa-solid fa-trophy"></i> 100 Birr</span>
      </div>
    </div>
  );
};
