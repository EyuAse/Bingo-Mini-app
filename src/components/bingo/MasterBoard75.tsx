import React from 'react';
import { useBingo } from '../../context/BingoContext.tsx';

export const MasterBoard75: React.FC = () => {
  const { calledNumbers } = useBingo();

  const columns = [
    { letter: 'B', colorClass: 'col-b', min: 1, max: 15 },
    { letter: 'I', colorClass: 'col-i', min: 16, max: 30 },
    { letter: 'N', colorClass: 'col-n', min: 31, max: 45 },
    { letter: 'G', colorClass: 'col-g', min: 46, max: 60 },
    { letter: 'O', colorClass: 'col-o', min: 61, max: 75 }
  ];

  return (
    <div className="fresh-master-board-card">
      <div className="master-board-table-grid">
        {/* Column Headers: B I N G O */}
        <div className="mb-header-cols-row">
          {columns.map(c => (
            <div key={c.letter} className={`mb-header-cell ${c.colorClass}`}>
              {c.letter}
            </div>
          ))}
        </div>

        {/* 15 Number Rows (1 to 75) */}
        <div className="mb-body-numbers">
          {Array.from({ length: 15 }).map((_, rowIdx) => (
            <div key={rowIdx} className="mb-number-row">
              {columns.map(col => {
                const num = col.min + rowIdx;
                const isDrawn = calledNumbers.includes(num);
                const isLatest = calledNumbers.length > 0 && calledNumbers[calledNumbers.length - 1] === num;

                return (
                  <div
                    key={num}
                    className={`mb-num-box ${isDrawn ? 'drawn' : ''} ${isLatest ? 'latest' : ''}`}
                    title={`Ball ${col.letter}-${num}`}
                  >
                    {num}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
