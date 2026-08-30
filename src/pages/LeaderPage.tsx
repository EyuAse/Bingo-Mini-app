import React from 'react';
import { useLanguage } from '../context/LanguageContext.tsx';

interface LeaderItem {
  rank: number;
  name: string;
  winnings: number;
  games: number;
  badge: string;
}

const mockLeaders: LeaderItem[] = [
  { rank: 1, name: 'Abebe_K', winnings: 48500, games: 142, badge: '🥇' },
  { rank: 2, name: 'Sara_B', winnings: 36200, games: 98, badge: '🥈' },
  { rank: 3, name: 'Dawit_M', winnings: 29800, games: 85, badge: '🥉' },
  { rank: 4, name: 'Aster_T', winnings: 19400, games: 64, badge: '⭐' },
  { rank: 5, name: 'Chala_G', winnings: 14500, games: 52, badge: '⭐' }
];

export const LeaderPage: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="page active" id="page-leader" style={{ padding: '16px' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ffffff', fontFamily: 'var(--font-display)' }}>
          {t('leaderboard.title')}
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '4px' }}>
          {t('leaderboard.subtitle')}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {mockLeaders.map(item => (
          <div
            key={item.rank}
            style={{
              background: '#0d122b',
              border: item.rank === 1 ? '1.5px solid #facc15' : '1px solid rgba(255,255,255,0.08)',
              borderRadius: '14px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: item.rank === 1 ? '0 0 16px rgba(250,204,21,0.2)' : 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#facc15', width: '24px' }}>
                {item.badge}
              </span>
              <div>
                <span style={{ color: '#ffffff', fontWeight: 800, fontSize: '0.95rem', display: 'block' }}>
                  {item.name}
                </span>
                <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                  {item.games} {t('leaderboard.gamesPlayed')}
                </span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ color: '#22c55e', fontWeight: 900, fontSize: '1rem', display: 'block' }}>
                +{item.winnings.toLocaleString()} ETB
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
