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

  const columns = [
    { letter: 'B', colorClass: 'col-b' },
    { letter: 'I', colorClass: 'col-i' },
    { letter: 'N', colorClass: 'col-n' },
    { letter: 'G', colorClass: 'col-g' },
    { letter: 'O', colorClass: 'col-o' }
  ];

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
  const currentStatus = activeCartelaIndex === 0 ? c1Status : c2Status;

  return (
    <div className="fresh-cartela-play-card">
      {/* Top Cartela Header & Dual Tabs */}
      <div className="cartela-card-header-bar">
        {cardQuantity > 1 ? (
          <div className="cartela-switch-tabs">
            <button
              type="button"
              className={`btn-cartela-tab ${activeCartelaIndex === 0 ? 'active' : ''}`}
              onClick={() => setActiveCartelaIndex(0)}
            >
              <span>Card 1</span>
            </button>
            <button
              type="button"
              className={`btn-cartela-tab ${activeCartelaIndex === 1 ? 'active' : ''}`}
              onClick={() => setActiveCartelaIndex(1)}
            >
              <span>Card 2</span>
            </button>
          </div>
        ) : (
          <div className="cartela-single-title">
            <i className="fa-solid fa-ticket gold"></i>
            <span>YOUR CARTELA</span>
          </div>
        )}

        {/* Live To-Go Radar Status Badge */}
        {currentStatus && (
          <span className={`cartela-radar-badge ${currentStatus.includes('1') ? 'radar-hot' : ''}`}>
            {currentStatus}
          </span>
        )}
      </div>

      {/* 5x5 Matrix Matrix Container */}
      <div className="cartela-5x5-matrix-wrap">
        {/* Top 5 Colored Column Headers: B I N G O */}
        <div className="cartela-header-cols-row">
          {columns.map(c => (
            <div key={c.letter} className={`cartela-col-hdr ${c.colorClass}`}>
              {c.letter}
            </div>
          ))}
        </div>

        {/* 5x5 Grid Cells */}
        <div className="cartela-5x5-grid">
          {currentCardData.map(cell => {
            const isWinningCell =
              winResult &&
              winResult.winningCartelaNumber === activeCartelaIndex + 1 &&
              winResult.winningLine.includes(cell.index);

            return (
              <div
                key={`${activeCartelaIndex}-${cell.index}`}
                className={`cartela-num-cell ${cell.marked ? 'daubed' : 'unmarked'} ${
                  cell.isFree ? 'free-star-cell' : ''
                } ${isWinningCell ? 'winning-glow-cell' : ''}`}
                onClick={() => handleManualDaub(activeCartelaIndex, cell.index)}
              >
                {cell.isFree ? (
                  <div className="free-cell-content">
                    <span className="star-icon">★</span>
                    <span className="free-lbl">FREE</span>
                  </div>
                ) : (
                  <>
                    <span className="cell-num-txt">{cell.val}</span>
                    {cell.marked && (
                      <div className="daub-stamp-circle">
                        <i className="fa-solid fa-check"></i>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
