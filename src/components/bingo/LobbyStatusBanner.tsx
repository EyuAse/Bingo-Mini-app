import React, { useEffect, useState } from 'react';
import { useBingo } from '../../context/BingoContext.tsx';

export const LobbyStatusBanner: React.FC = () => {
  const {
    roundPhase,
    lobbyCountdown,
    waitingForPlayers,
    realPlayerCount,
    joinFeed
  } = useBingo();

  // Local active toasts that automatically fade out after 4 seconds
  const [visibleToasts, setVisibleToasts] = useState<Array<{ id: number; userName: string; countdownStarted: boolean }>>([]);

  useEffect(() => {
    if (joinFeed.length === 0) return;
    const latest = joinFeed[0];
    setVisibleToasts(prev => {
      if (prev.some(t => t.id === latest.id)) return prev;
      return [latest, ...prev].slice(0, 3);
    });

    const timer = setTimeout(() => {
      setVisibleToasts(prev => prev.filter(t => t.id !== latest.id));
    }, 4000);

    return () => clearTimeout(timer);
  }, [joinFeed]);

  if (roundPhase !== 'lobby') {
    return null;
  }

  return (
    <div className="lobby-status-banner-wrap">
      {/* Live Toast Feed for Player Joins */}
      {visibleToasts.length > 0 && (
        <div className="player-join-feed-container">
          {visibleToasts.map(toast => (
            <div key={toast.id} className="join-feed-entry">
              <span className="join-feed-avatar">
                <i className="fa-solid fa-user-check"></i>
              </span>
              <div className="join-feed-text">
                <span className="join-feed-name">{toast.userName}</span> joined the game!
                {toast.countdownStarted && (
                  <span className="join-feed-started-badge">
                    <i className="fa-solid fa-bolt"></i> 2 Players Reached — Starting!
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Lobby Banner Card */}
      <div className={`lobby-status-card ${waitingForPlayers ? 'is-waiting' : 'is-counting'}`}>
        {waitingForPlayers ? (
          <div className="lobby-waiting-state">
            <div className="waiting-spinner-ring">
              <i className="fa-solid fa-spinner fa-spin"></i>
            </div>
            <div className="waiting-info">
              <div className="waiting-title-row">
                <span className="waiting-title">Waiting for Players</span>
                <span className="waiting-count-pill">
                  <i className="fa-solid fa-users"></i> {realPlayerCount} / 2 Needed
                </span>
              </div>
              <p className="waiting-subtext">
                Round begins as soon as 2 real players buy tickets • Countdown frozen at 45s
              </p>
            </div>
          </div>
        ) : (
          <div className="lobby-countdown-state">
            <div className="countdown-timer-bubble">
              <span className="countdown-number">{lobbyCountdown}s</span>
            </div>
            <div className="countdown-info">
              <div className="countdown-title-row">
                <span className="countdown-title">Game Starting Soon!</span>
                <span className="countdown-players-pill">
                  <i className="fa-solid fa-users-viewfinder"></i> {realPlayerCount} Players Ready
                </span>
              </div>
              <p className="countdown-subtext">
                {realPlayerCount <= 5
                  ? '🎯 100% Payout Tier: 0% House Fee (Winner takes all!)'
                  : realPlayerCount <= 10
                  ? '🛡️ 100% Real Players (No Bots in Room)'
                  : '⚡ Big Arena Match (3 bots added)'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
