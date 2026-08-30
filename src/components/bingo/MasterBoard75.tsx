import React from 'react';
import { useBingo } from '../../context/BingoContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { useAdmin } from '../../context/AdminContext.tsx';

export const MasterBoard75: React.FC = () => {
  const { calledNumbers } = useBingo();
  const { t } = useLanguage();
  const { verticalBoardMode } = useAdmin();

  const columns: { letter: string; colorClass: string; min: number; max: number }[] = [
    { letter: 'B', colorClass: 'col-b-hdr', min: 1, max: 15 },
    { letter: 'I', colorClass: 'col-i-hdr', min: 16, max: 30 },
    { letter: 'N', colorClass: 'col-n-hdr', min: 31, max: 45 },
    { letter: 'G', colorClass: 'col-g-hdr', min: 46, max: 60 },
    { letter: 'O', colorClass: 'col-o-hdr', min: 61, max: 75 }
  ];

  return (
    <div className={`master-board-card ${verticalBoardMode ? 'vertical-layout' : ''}`}>
      <div className="master-board-title">
        <span>{t('bingo.masterBoard')}</span>
        {verticalBoardMode && <span className="vertical-tag">VERTICAL</span>}
      </div>

      <div className="master-board-table">
        {/* Column Headers: B I N G O */}
        <div className="mb-header-row">
          {columns.map(c => (
            <div key={c.letter} className={`mb-col-header ${c.colorClass}`}>
              {c.letter}
            </div>
          ))}
        </div>

        {/* 15 Rows of Numbers (1-75) */}
        <div className="mb-grid-body">
          {Array.from({ length: 15 }).map((_, rowIdx) => (
            <div key={rowIdx} className="mb-grid-row">
              {columns.map(col => {
                const num = col.min + rowIdx;
                const isDrawn = calledNumbers.includes(num);
                const isLatest = calledNumbers.length > 0 && calledNumbers[calledNumbers.length - 1] === num;

                return (
                  <div
                    key={num}
                    className={`mb-number-cell ${isDrawn ? 'drawn' : ''} ${isLatest ? 'latest' : ''}`}
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
