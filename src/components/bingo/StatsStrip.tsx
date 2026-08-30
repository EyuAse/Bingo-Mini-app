import React from 'react';
import { useBingo } from '../../context/BingoContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';

export const StatsStrip: React.FC = () => {
  const { betAmount, prizePool, playersCount, calledNumbers } = useBingo();
  const { t } = useLanguage();

  return (
    <div className="fresh-bingo-stats-grid">
      {/* 1. Stake Card */}
      <div className="bingo-stat-card card-stake">
        <div className="stat-icon-wrap yellow">
          <i className="fa-solid fa-coins"></i>
        </div>
        <div className="stat-text-group">
          <span className="stat-label">{t('bingo.stake')}</span>
          <strong className="stat-val gold">{betAmount} ETB</strong>
        </div>
      </div>

      {/* 2. Prize Amount Card */}
      <div className="bingo-stat-card card-prize">
        <div className="stat-icon-wrap green">
          <i className="fa-solid fa-trophy"></i>
        </div>
        <div className="stat-text-group">
          <span className="stat-label">{t('bingo.winningAmount')}</span>
          <strong className="stat-val green">{prizePool.toLocaleString()} ETB</strong>
        </div>
      </div>

      {/* 3. Players Card */}
      <div className="bingo-stat-card card-players">
        <div className="stat-icon-wrap purple">
          <i className="fa-solid fa-users"></i>
        </div>
        <div className="stat-text-group">
          <span className="stat-label">{t('bingo.players')}</span>
          <strong className="stat-val purple">{playersCount}</strong>
        </div>
      </div>

      {/* 4. Called Balls Card */}
      <div className="bingo-stat-card card-called">
        <div className="stat-icon-wrap slate">
          <i className="fa-solid fa-dice"></i>
        </div>
        <div className="stat-text-group">
          <span className="stat-label">{t('bingo.calledBalls')}</span>
          <strong className="stat-val slate">
            {calledNumbers.length > 0 ? `${calledNumbers.length}/75` : '--'}
          </strong>
        </div>
      </div>
    </div>
  );
};
