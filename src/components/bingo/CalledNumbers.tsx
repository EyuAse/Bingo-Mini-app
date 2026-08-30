import React from 'react';
import { useBingo } from '../../context/BingoContext.tsx';
import { useApp } from '../../context/AppContext.tsx';

export const CalledNumbers: React.FC = () => {
  const { calledNumbers } = useBingo();
  const { showToast } = useApp();

  const getColForNum = (n: number) => {
    if (n <= 15) return 'b';
    if (n <= 30) return 'i';
    if (n <= 45) return 'n';
    if (n <= 60) return 'g';
    return 'o';
  };

  const recentCalls = calledNumbers.slice(-9).reverse();

  const handleMoreClick = () => {
    showToast(`Total Calls: ${calledNumbers.length} / 75 numbers`);
  };

  return (
    <div className="sidebar-panel called-numbers-panel">
      <div className="sidebar-label">CALLED NUMBERS</div>
      <div className="called-numbers-grid" id="called-numbers-grid">
        {recentCalls.map((num, idx) => {
          const colLetter = getColForNum(num).toUpperCase();
          const colClass = `col-${getColForNum(num)}`;
          const isActive = idx === 0;

          return (
            <div key={`${num}-${idx}`} className={`called-num ${colClass} ${isActive ? 'active-called' : ''}`}>
              <span className="cn-letter">{colLetter}</span>
              <span className="cn-number">{num}</span>
            </div>
          );
        })}
      </div>
      <button
        className="called-more-btn"
        id="view-all-called-btn"
        title="View all called numbers"
        onClick={handleMoreClick}
      >
        ...
      </button>
    </div>
  );
};
