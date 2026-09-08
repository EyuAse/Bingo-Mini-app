import React from 'react';
import { useBingo } from '../../context/BingoContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';

export const StatsStrip: React.FC = () => {
  const { betAmount, prizePool, playersCount, realPlayerCount, calledNumbers } = useBingo();
  const { lang } = useLanguage();

  const currentPlayers = realPlayerCount > 0 ? realPlayerCount : playersCount;
  const currentPrize = prizePool > 0
    ? prizePool
    : (currentPlayers <= 5 ? currentPlayers * betAmount : Math.floor(currentPlayers * betAmount * 0.8));
  const prizeDisplay = currentPrize >= 1000 ? `${(currentPrize / 1000).toFixed(1)}K` : `${currentPrize}`;

  // Short round game code
  const gameId = `KL-${betAmount}`;

  return (
    <div className="bingo-top-status-strip">
      {/* 1. Game ID */}
      <div className="status-strip-box">
        <span className="status-strip-lbl">Game ID</span>
        <span className="status-strip-val text-purple">{gameId}</span>
      </div>

      {/* 2. Derash (ደራሽ / Prize Pool) */}
      <div className="status-strip-box derash-box">
        <span className="status-strip-lbl">{lang === 'am' ? 'ደራሽ' : 'Derash'}</span>
        <span className="status-strip-val text-green">{prizeDisplay}</span>
      </div>

      {/* 3. Players */}
      <div className="status-strip-box">
        <span className="status-strip-lbl">{lang === 'am' ? 'ተጫዋቾች' : 'Players'}</span>
        <span className="status-strip-val">{currentPlayers}</span>
      </div>

      {/* 4. Stake */}
      <div className="status-strip-box">
        <span className="status-strip-lbl">{lang === 'am' ? 'መደብ' : 'Stake'}</span>
        <span className="status-strip-val text-gold">{betAmount}</span>
      </div>

      {/* 5. Called Balls Count */}
      <div className="status-strip-box">
        <span className="status-strip-lbl">{lang === 'am' ? 'የተጠራ' : 'Called'}</span>
        <span className="status-strip-val">{calledNumbers.length}</span>
      </div>
    </div>
  );
};
