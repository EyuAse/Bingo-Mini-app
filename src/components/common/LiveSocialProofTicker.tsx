import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';

interface LiveSocialProofTickerProps {
  onOpenStreak?: () => void;
}

export const LiveSocialProofTicker: React.FC<LiveSocialProofTickerProps> = ({ onOpenStreak }) => {
  const { lang } = useLanguage();
  const [onlineCount, setOnlineCount] = useState(1843);
  const [winnerIndex, setWinnerIndex] = useState(0);
  const [isSliding, setIsSliding] = useState(false);

  const winners = [
    { name: 'Selam_T', amount: 2100 },
    { name: 'Dawit_M', amount: 1450 },
    { name: 'Abebe_K', amount: 850 },
    { name: 'Eden_Rose', amount: 3200 },
    { name: 'Yonas_B', amount: 500 },
    { name: 'Sami_Lucky', amount: 1800 },
    { name: 'Nati_Boss', amount: 1120 },
    { name: 'Hanna_Addis', amount: 2500 },
    { name: 'Kidus_99', amount: 650 },
    { name: 'Miki_Star', amount: 4100 },
    { name: 'Tariku_King', amount: 920 },
    { name: 'Beti_Gold', amount: 1350 }
  ];

  // Rotate winners with smooth right-to-left slide transition & slight online count fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setIsSliding(true);
      setTimeout(() => {
        setWinnerIndex(prev => (prev + 1) % winners.length);
        setIsSliding(false);
      }, 300);

      // Organic online player fluctuation
      setOnlineCount(prev => prev + (Math.floor(Math.random() * 7) - 3));
    }, 3200);

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
        zIndex: 50,
        overflow: 'hidden'
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
        <span style={{ fontWeight: '700', color: '#86efac', letterSpacing: '0.2px' }}>
          {onlineCount.toLocaleString()} {lang === 'am' ? 'በመስመር ላይ' : 'Live'}
        </span>
      </div>

      {/* Center: Dynamic Right-to-Left Sliding Winner Ticker */}
      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textAlign: 'center',
          color: '#fde047',
          fontWeight: '700',
          position: 'relative',
          height: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div
          style={{
            transform: isSliding ? 'translateX(-30px)' : 'translateX(0)',
            opacity: isSliding ? 0 : 1,
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <span style={{ color: '#facc15' }}>🏆 @{currentWinner.name}</span>{' '}
          <span style={{ color: '#ffffff' }}>{lang === 'am' ? 'አሸነፈ' : 'won'}</span>{' '}
          <span style={{ color: '#4ade80', fontWeight: '900' }}>+{currentWinner.amount} ETB</span>
        </div>
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
