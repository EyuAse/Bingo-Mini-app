import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';

interface LiveSocialProofTickerProps {
  onOpenStreak?: () => void;
}

export const LiveSocialProofTicker: React.FC<LiveSocialProofTickerProps> = ({ onOpenStreak }) => {
  const { lang } = useLanguage();
  const [onlineCount, setOnlineCount] = useState(1842);
  const [winnerIndex, setWinnerIndex] = useState(0);

  const winners = [
    { name: 'Dawit_M', amount: 1450, room: 'Room 75' },
    { name: 'Abebe_K', amount: 850, room: 'Express 75' },
    { name: 'Selam_T', amount: 2100, room: 'Jackpot Live' },
    { name: 'Yonas_B', amount: 500, room: 'Room 75' },
    { name: 'Eden_Rose', amount: 3200, room: 'VIP Mega' },
    { name: 'Nati_Boss', amount: 1120, room: 'Express 75' }
  ];

  // Rotate winners & randomize online players slightly
  useEffect(() => {
    const interval = setInterval(() => {
      setWinnerIndex(prev => (prev + 1) % winners.length);
      setOnlineCount(prev => prev + (Math.floor(Math.random() * 7) - 3));
    }, 4000);

    return () => clearInterval(interval);
  }, [winners.length]);

  const currentWinner = winners[winnerIndex];

  return (
    <div
      className="live-social-proof-strip"
      style={{
        background: 'linear-gradient(90deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
        borderBottom: '1px solid rgba(250, 204, 21, 0.25)',
        padding: '6px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '11.5px',
        color: '#ffffff',
        gap: '8px',
        zIndex: 50
      }}
    >
      {/* Left: Online Players Pulse */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
        <span
          style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: '#22c55e',
            boxShadow: '0 0 8px #22c55e',
            display: 'inline-block'
          }}
        ></span>
        <span style={{ fontWeight: '700', color: '#86efac' }}>
          {onlineCount.toLocaleString()} {lang === 'am' ? 'በመስመር ላይ' : 'Live'}
        </span>
      </div>

      {/* Center: Live Winners Ticker */}
      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textAlign: 'center',
          color: '#fde047',
          fontWeight: '700'
        }}
      >
        <span style={{ color: '#facc15' }}>🏆 @{currentWinner.name}</span>{' '}
        <span style={{ color: '#ffffff' }}>{lang === 'am' ? 'አሸነፈ' : 'won'}</span>{' '}
        <span style={{ color: '#4ade80', fontWeight: '900' }}>+{currentWinner.amount} ETB</span>
      </div>

      {/* Right: Daily Streak Button */}
      {onOpenStreak && (
        <button
          type="button"
          onClick={onOpenStreak}
          style={{
            background: 'linear-gradient(135deg, #facc15 0%, #eab308 100%)',
            color: '#0f172a',
            border: 'none',
            borderRadius: '999px',
            padding: '2px 8px',
            fontSize: '10.5px',
            fontWeight: '900',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            boxShadow: '0 2px 6px rgba(234, 179, 8, 0.4)',
            flexShrink: 0
          }}
        >
          <span>🔥</span>
          <span>{lang === 'am' ? 'የቀን ቦነስ' : 'Streak'}</span>
        </button>
      )}
    </div>
  );
};
