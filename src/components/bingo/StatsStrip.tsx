import React from 'react';
import { useBingo } from '../../context/BingoContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';

export const StatsStrip: React.FC = () => {
  const { betAmount, prizePool, playersCount, realPlayerCount, calledNumbers } = useBingo();
  const { t } = useLanguage();

  const currentPlayers = realPlayerCount > 0 ? realPlayerCount : playersCount;
  const currentPrize = prizePool > 0
    ? prizePool
    : (currentPlayers <= 5 ? currentPlayers * betAmount : Math.floor(currentPlayers * betAmount * 0.8));
  const prizeDisplay = currentPrize >= 1000 ? `${(currentPrize / 1000).toFixed(1)}K` : `${currentPrize}`;

  const stats = [
    {
      icon: 'fa-coins',
      iconColor: 'gold-ic',
      label: t('bingo.stake'),
      value: `${betAmount}`,
      unit: 'ETB',
      valColor: 'gold-val'
    },
    {
      icon: 'fa-trophy',
      iconColor: 'green-ic',
      label: t('bingo.winningAmount'),
      value: prizeDisplay,
      unit: 'ETB',
      valColor: 'green-val'
    },
    {
      icon: 'fa-users',
      iconColor: 'purple-ic',
      label: t('bingo.players'),
      value: `${currentPlayers}`,
      unit: '',
      valColor: 'purple-val'
    },
    {
      icon: 'fa-dice',
      iconColor: 'blue-ic',
      label: t('bingo.calledBalls'),
      value: calledNumbers.length > 0 ? `${calledNumbers.length}` : '--',
      unit: calledNumbers.length > 0 ? '/75' : '',
      valColor: 'slate-val'
    }
  ];


  return (
    <div className="new-stats-strip">
      {stats.map((s, i) => (
        <div key={i} className="new-stat-item">
          <div className={`new-stat-icon-circle ${s.iconColor}`}>
            <i className={`fa-solid ${s.icon}`}></i>
          </div>
          <span className="new-stat-label">{s.label}</span>
          <strong className={`new-stat-value ${s.valColor}`}>
            {s.value}{s.unit && <span style={{ fontSize: '0.45rem', fontWeight: 700 }}>{s.unit}</span>}
          </strong>
        </div>
      ))}
    </div>
  );
};
