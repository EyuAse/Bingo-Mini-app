import React from 'react';
import { useBingo } from '../../context/BingoContext.tsx';

export const BingoGrid: React.FC = () => {
  const {
    cartela1Data,
    cartela2Data,
    cardQuantity,
    activeCartelaIndex,
    setActiveCartelaIndex,
    handleManualDaub,
    winResult
  } = useBingo();

  const columns = ['B', 'I', 'N', 'G', 'O'];
  const currentCardData = activeCartelaIndex === 0 ? cartela1Data : cartela2Data;

  // Calculate marked count for 1TG / 2TG badges
  const getCardStatus = (cells: typeof cartela1Data) => {
    const patterns = [
      [0, 6, 12, 18, 24],
      [4, 8, 12, 16, 20],
      [0, 1, 2, 3, 4],
      [5, 6, 7, 8, 9],
      [10, 11, 12, 13, 14],
      [15, 16, 17, 18, 19],
      [20, 21, 22, 23, 24]
    ];
    let maxMarked = 0;
    for (const p of patterns) {
      const marked = p.filter(idx => cells[idx]?.marked).length;
      if (marked > maxMarked) maxMarked = marked;
    }
    if (maxMarked === 5) return 'BINGO! 🎉';
    if (maxMarked === 4) return '1 TO GO! 🔥';
    if (maxMarked === 3) return '2 TO GO';
    return null;
  };

  const c1Status = getCardStatus(cartela1Data);
  const c2Status = cardQuantity > 1 ? getCardStatus(cartela2Data) : null;

  return (
    <div className="bingo-card-area">
      {/* Dual Cartela Tabs (When playing with 2 Cartelas) */}
      {cardQuantity > 1 && (
        <div className="cartela-tabs-row">
          <button
            className={`cartela-tab-btn ${activeCartelaIndex === 0 ? 'active' : ''}`}
            onClick={() => setActiveCartelaIndex(0)}
          >
            <span>Cartela #1</span>
            {c1Status && <span className={`cartela-status-pill ${c1Status.includes('1') ? 'hot' : ''}`}>{c1Status}</span>}
          </button>
          <button
            className={`cartela-tab-btn ${activeCartelaIndex === 1 ? 'active' : ''}`}
            onClick={() => setActiveCartelaIndex(1)}
          >
            <span>Cartela #2</span>
            {c2Status && <span className={`cartela-status-pill ${c2Status.includes('1') ? 'hot' : ''}`}>{c2Status}</span>}
          </button>
        </div>
      )}

      <div className="bingo-card-container">
        {/* Colorful Column Headers */}
        <div className="bingo-header-row">
          {columns.map(col => (
            <div key={col} className={`bingo-col-header col-${col.toLowerCase()}`}>
              <span>{col}</span>
            </div>
          ))}
        </div>

        {/* 5x5 Number Grid */}
        <div className="bingo-grid" id="bingo-grid">
          {currentCardData.map(cell => {
            const isWinningCell =
              winResult &&
              winResult.winningCartelaNumber === activeCartelaIndex + 1 &&
              winResult.winningLine.includes(cell.index);

            return (
              <div
                key={`${activeCartelaIndex}-${cell.index}`}
                className={`bingo-cell ${cell.marked ? 'marked' : 'unmarked'} ${
                  cell.isFree ? 'free-cell' : ''
                } ${isWinningCell ? 'winning-cell' : ''}`}
                data-index={cell.index}
                data-col={cell.colLetter}
                data-val={cell.val}
                onClick={() => handleManualDaub(activeCartelaIndex, cell.index)}
              >
                {cell.isFree ? (
                  <>
                    <span className="free-star">★</span>
                    <span className="free-text">★FREE★</span>
                  </>
                ) : cell.marked ? (
                  <>
                    <div className="token-star">★</div>
                    <span className="cell-num">{cell.val}</span>
                  </>
                ) : (
                  <span className="cell-num">{cell.val}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
