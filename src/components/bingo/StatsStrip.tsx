import React from 'react';
import { useBingo } from '../../context/BingoContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';

export const StatsStrip: React.FC = () => {
  const { betAmount, prizePool, playersCount, currentCall } = useBingo();
  const { t } = useLanguage();

  return (
    <div className="stats-strip-container">
      {/* 1. መወራረድ (Stake) */}
      <div className="stat-pill-box pill-stake">
        <span className="stat-pill-label">{t('bingo.stake')}</span>
        <span className="stat-pill-val gold">{betAmount} ETB</span>
      </div>

      {/* 2. የማሸነፊያ መጠን (Prize Pool) */}
      <div className="stat-pill-box pill-prize">
        <span className="stat-pill-label">{t('bingo.winningAmount')}</span>
        <span className="stat-pill-val green">{prizePool.toLocaleString()} ETB</span>
      </div>

      {/* 3. PLAYERS */}
      <div className="stat-pill-box pill-players">
        <span className="stat-pill-label">{t('bingo.players')}</span>
        <span className="stat-pill-val purple">{playersCount}</span>
      </div>

      {/* 4. የወጡ ኳሶች (Last Call) */}
      <div className="stat-pill-box pill-last-call">
        <span className="stat-pill-label">{t('bingo.calledBalls')}</span>
        <span className="stat-pill-val cyan">
          {currentCall ? `${currentCall.col}-${currentCall.num}` : '--'}
        </span>
      </div>
    </div>
  );
};
