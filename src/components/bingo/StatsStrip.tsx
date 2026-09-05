import React from 'react';
import { useBingo } from '../../context/BingoContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';

export const StatsStrip: React.FC = () => {
  const { betAmount, prizePool, playersCount, calledNumbers } = useBingo();
  const { t } = useLanguage();

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
      value: prizePool >= 1000 ? `${(prizePool / 1000).toFixed(1)}K` : `${prizePool}`,
      unit: 'ETB',
      valColor: 'green'
    },
    {
      icon: 'fa-users',
      iconColor: 'purple',
      label: t('bingo.players'),
      value: `${playersCount}`,
      unit: '/50',
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
