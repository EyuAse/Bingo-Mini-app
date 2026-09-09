import React, { useEffect, useState } from 'react';
import { useBingo } from '../../context/BingoContext.tsx';

export const LobbyStatusBanner: React.FC = () => {
  const {
    roundPhase,
    lobbyCountdown,
    waitingForPlayers,
    realPlayerCount,
    hasTicket,
    joinFeed,
    betAmount,
    setBetAmount,
    stakeRoomsSummary
  } = useBingo();

  // Never show 0 when local user holds a ticket (server broadcast may not have arrived yet)
  const displayPlayerCount = Math.max(realPlayerCount, hasTicket ? 1 : 0);

  const suggestedStake = Object.entries(stakeRoomsSummary)
    .map(([stakeStr, count]) => ({ stake: Number(stakeStr), count }))
    .filter(s => s.stake !== betAmount && s.count >= 2)
    .sort((a, b) => b.count - a.count)[0];

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
                  <i className="fa-solid fa-users"></i> {displayPlayerCount} / 2 Needed
                </span>
              </div>
              <p className="waiting-subtext">
                Waiting for 2 real players to enter the {betAmount} ETB arena • Countdown will start immediately
              </p>
              {suggestedStake && (
                <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <i className="fa-solid fa-bolt" style={{ color: '#eab308' }}></i>
                    <span>Live Match Available in Another Room!</span>
                  </div>
                  <button
                    type="button"
                    className="btn-switch-active-room-helper"
                    onClick={() => setBetAmount(suggestedStake.stake)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '10px 14px',
                      backgroundColor: '#16a34a',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(22, 163, 74, 0.3)'
                    }}
                  >
                    <i className="fa-solid fa-play"></i>
                    <span>Switch to {suggestedStake.stake} ETB Room ({suggestedStake.count} Players Ready!)</span>
                  </button>
                </div>
              )}
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
                  <i className="fa-solid fa-users-viewfinder"></i> {displayPlayerCount} Players Ready
                </span>
              </div>
              <p className="countdown-subtext">
                {displayPlayerCount <= 5
                  ? '🎯 100% Payout Tier: 0% House Fee (Winner takes all!)'
                  : displayPlayerCount <= 10
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
