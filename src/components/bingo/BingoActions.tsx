import React from 'react';
import { useBingo } from '../../context/BingoContext.tsx';

export const BingoActions: React.FC = () => {
  const {
    autoPlay,
    toggleAutoPlay,
    claimBingo,
    claimInProgress,
    canWin,
    roundPhase,
    lobbyCountdown
  } = useBingo();

  const isPlaying = roundPhase === 'playing';
  const isLobby = roundPhase === 'lobby';

  return (
    <div className="fresh-bingo-actions-bar">
      {/* 1. Auto-Play Toggle */}
      <button
        type="button"
        className={`btn-autoplay-toggle ${autoPlay ? 'autoplay-on' : ''}`}
        onClick={toggleAutoPlay}
        title={autoPlay ? 'Auto-Play is ON — click to go manual' : 'Turn on Auto-Play'}
      >
        <i className={`fa-solid ${autoPlay ? 'fa-robot' : 'fa-hand-pointer'} autoplay-icon`}></i>
        <div className={`autoplay-switch ${autoPlay ? 'on' : ''}`} />
        <span className="autoplay-label">{autoPlay ? 'AUTO ON' : 'MANUAL'}</span>
      </button>

      {/* 2. BINGO! Call Button — disabled when in lobby or when auto-play on or claim in progress */}
      <button
        type="button"
        className={`btn-claim-bingo-gold ${autoPlay ? 'auto-claimed' : ''} ${isLobby ? 'lobby-waiting' : ''} ${claimInProgress ? 'claiming' : ''}`}
        onClick={autoPlay || !isPlaying || claimInProgress ? undefined : claimBingo}
        disabled={!isPlaying || claimInProgress}
        title={isLobby ? `Round starts in ${lobbyCountdown}s` : autoPlay ? 'Auto-Play will claim BINGO automatically!' : claimInProgress ? 'Claiming your victory...' : 'Claim BINGO'}
      >
        {isLobby ? (
          <>
            <i className="fa-solid fa-hourglass-half"></i>
            <span>STARTS IN {lobbyCountdown}s</span>
          </>
        ) : autoPlay ? (
          <>
            <i className="fa-solid fa-robot"></i>
            <span>AUTO</span>
          </>
        ) : claimInProgress ? (
          <>
            <i className="fa-solid fa-spinner fa-spin"></i>
            <span>CLAIMING...</span>
          </>
        ) : (
          <>
            <i className="fa-solid fa-trophy"></i>
            <span>BINGO!</span>
          </>
        )}
      </button>

      {/* 3. Called count badge (replaced "Pick" button) */}
      <div className="btn-manual-mode">
        <i className="fa-solid fa-dice" style={{ fontSize: '0.875rem', color: '#94a3b8' }}></i>
        <span style={{ fontWeight: 900, fontSize: '0.5625rem', color: '#64748b' }}>
          MATCH
        </span>
      </div>
    </div>
  );
};
