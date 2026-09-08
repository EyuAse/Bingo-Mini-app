import React from 'react';
import { useBingo } from '../../context/BingoContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';

// ── Column helpers ─────────────────────────────────────────
const getColClass = (num: number): string => {
  if (num <= 15) return 'b';
  if (num <= 30) return 'i';
  if (num <= 45) return 'n';
  if (num <= 60) return 'g';
  return 'o';
};

const getColLetter = (num: number): string => getColClass(num).toUpperCase();

export const CurrentCallBanner: React.FC = () => {
  const {
    currentCall,
    spherePop,
    calledNumbers,
    lobbyCountdown,
    roundPhase,
    waitingForPlayers,
    isMuted,
    toggleMute,
    autoPlay,
    toggleAutoPlay
  } = useBingo();
  const { t } = useLanguage();

  // Last 3-4 previous balls (skip the active one)
  const prevTrail = [...calledNumbers].reverse().slice(currentCall ? 1 : 0, 4);

  const mainColClass = currentCall
    ? `col-${currentCall.col.toLowerCase()}`
    : 'col-none';

  return (
    <div className="compact-current-call-block">
      {/* 1. Main Current Call Header Bar */}
      <div className={`compact-call-header ${spherePop ? 'call-pop' : ''}`}>
        <div className="compact-call-title">
          {roundPhase === 'playing' ? 'Current Call' : 'Current Call'}
        </div>

        <div className="compact-call-badge-wrap">
          {currentCall ? (
            <div className={`compact-current-ball-pill ${mainColClass}`}>
              <span className="ball-col">{currentCall.col}</span>
              <span className="ball-hyphen">-</span>
              <span className="ball-num">{currentCall.num}</span>
            </div>
          ) : roundPhase === 'lobby' ? (
            <div className="compact-current-ball-pill lobby-timer">
              <span className="ball-col">⏳</span>
              <span className="ball-num">{waitingForPlayers ? 'WAIT' : `${lobbyCountdown}s`}</span>
            </div>
          ) : (
            <div className="compact-current-ball-pill waiting">
              <span className="ball-col">🎱</span>
              <span className="ball-num">--</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Recent Balls Tray */}
      <div className="compact-recent-balls-tray">
        <div className="compact-recent-balls-inner">
          {prevTrail.length > 0 ? (
            prevTrail.map((num, idx) => {
              const colClass = getColClass(num);
              const colLetter = getColLetter(num);
              return (
                <div key={`${num}-${idx}`} className={`compact-recent-ball col-${colClass}`}>
                  <span>{colLetter}{num}</span>
                </div>
              );
            })
          ) : (
            <div className="compact-recent-empty">
              <span>{roundPhase === 'playing' ? 'Drawing first ball...' : 'Recent calls will appear here'}</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. In-line Sound & Auto-Daub Controls Strip */}
      <div className="compact-call-controls-row">
        <button
          type="button"
          className={`btn-compact-sound ${isMuted ? 'muted' : 'active'}`}
          onClick={toggleMute}
          title={isMuted ? 'Sound Muted — Click to unmute' : 'Sound ON — Click to mute'}
        >
          <span className="sound-lbl">Sound</span>
          <i className={`fa-solid ${isMuted ? 'fa-volume-xmark' : 'fa-volume-high'}`}></i>
        </button>

        <button
          type="button"
          className={`btn-compact-auto ${autoPlay ? 'on' : 'off'}`}
          onClick={toggleAutoPlay}
          title={autoPlay ? 'Auto Daub ON' : 'Auto Daub OFF'}
        >
          <span className="auto-lbl">Auto</span>
          <span className={`auto-switch-pill ${autoPlay ? 'on' : 'off'}`}>
            {autoPlay ? 'ON' : 'OFF'}
          </span>
        </button>
      </div>
    </div>
  );
};
