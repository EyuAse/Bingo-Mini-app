import React from 'react';
import { useBingo } from '../../context/BingoContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';

export const BingoActions: React.FC = () => {
  const {
    autoMark,
    toggleAutoMark,
    luckyPicks,
    useLuckyPick,
    claimBingo,
    canWin
  } = useBingo();
  const { t } = useLanguage();

  return (
    <div className="bingo-actions">
      <button
        className={`bingo-action-btn auto-mark-btn ${autoMark ? 'active' : ''}`}
        id="auto-mark-btn"
        title="Toggle Auto Daubing"
        onClick={toggleAutoMark}
      >
        <i className="fa-solid fa-bolt"></i>
        <span>{t('bingo.autoMark')}</span>
      </button>

      <button
        className={`bingo-btn-main ${canWin ? 'can-win' : ''}`}
        id="bingo-call-btn"
        onClick={claimBingo}
      >
        <span className="bingo-btn-star star-1">★</span>
        <span className="bingo-btn-text">{t('bingo.callBingo')}</span>
        <span className="bingo-btn-star star-2">★</span>
      </button>

      <button
        className="bingo-action-btn lucky-pick-btn"
        id="lucky-pick-btn"
        title="Use Lucky Pick Power-Up"
        onClick={useLuckyPick}
      >
        <i className="fa-solid fa-wand-magic-sparkles"></i>
        <span>{t('bingo.luckyPick')}</span>
        <span className="action-badge" id="lucky-pick-count">
          {luckyPicks}
        </span>
      </button>
    </div>
  );
};
