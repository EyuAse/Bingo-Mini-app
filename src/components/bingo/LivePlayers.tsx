import React from 'react';
import { useBingo } from '../../context/BingoContext.tsx';

export const LivePlayers: React.FC = () => {
  const { opponents, playersCount, prizePool, totalPot, betAmount } = useBingo();
  const poolDisplay = prizePool > 0
    ? prizePool
    : (betAmount === 10 ? Math.floor(((playersCount || 50) * 10) * 0.8) : totalPot);

  const displayCount = betAmount === 10 ? Math.max(playersCount, 50) : playersCount;

  return (
    <div className="bingo-live-players-panel" id="bingo-live-players-panel">
      <div className="live-players-header">
        <div className="lp-title">
          <span className="live-indicator"></span>
          <span>
            LIVE ROOM PLAYERS (<strong id="live-players-header-count">{displayCount}</strong>)
          </span>
        </div>
        <span className="lp-subtitle">
          Competing for <strong className="gold" id="live-pool-display">{poolDisplay.toLocaleString()} ETB</strong>
        </span>
      </div>

      {/* Opponents Feed List */}
      <div className="live-players-feed" id="live-players-feed">
        {opponents.map((opp, idx) => {
          const isHot = opp.marksNeeded === 1;
          const isClose = opp.marksNeeded === 2;

          return (
            <div key={idx} className={`opponent-card ${isHot ? 'one-to-go' : ''}`}>
              <div className="opponent-left">
                <div className={`opponent-avatar ${opp.avatar}`}>{opp.initials}</div>
                <div className="opponent-info">
                  <span className="opponent-name">{opp.name}</span>
                  <span className="opponent-cards-count">
                    {opp.cards} card{opp.cards > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <span
                className={`opponent-status ${
                  isHot ? 'status-hot' : isClose ? 'status-close' : ''
                }`}
              >
                {opp.status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
