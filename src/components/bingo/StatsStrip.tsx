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
      iconColor: 'yellow',
      label: t('bingo.stake'),
      value: `${betAmount}`,
      unit: 'ETB',
      valColor: 'gold'
    },
    {
      icon: 'fa-trophy',
      iconColor: 'green',
      label: t('bingo.winningAmount'),
      value: prizeDisplay,
      unit: 'ETB',
      valColor: 'green'
    },
    {
      icon: 'fa-users',
      iconColor: 'purple',
      label: t('bingo.players'),
      value: `${currentPlayers}`,
      unit: '',
      valColor: 'purple'
    },
    {
      icon: 'fa-dice',
      iconColor: 'slate',
      label: t('bingo.calledBalls'),
      value: calledNumbers.length > 0 ? `${calledNumbers.length}` : '--',
      unit: calledNumbers.length > 0 ? '/75' : '',
      valColor: 'slate'
    }
  ];

  return (
    <div className="fresh-bingo-stats-grid">
      {stats.map((s, i) => (
        <div key={i} className="bingo-stat-card">
          <div className={`stat-icon-wrap ${s.iconColor}`}>
            <i className={`fa-solid ${s.icon}`}></i>
          </div>
          <div className="stat-text-group">
            <span className="stat-label">{s.label}</span>
            <strong className={`stat-val ${s.valColor}`}>
              {s.value}{s.unit && <span style={{ fontSize: '0.5rem', fontWeight: 700 }}>{s.unit}</span>}
            </strong>
          </div>
        </div>
      ))}
    </div>
  );
};
