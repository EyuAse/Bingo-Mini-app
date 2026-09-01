import React from 'react';
import { useBingo } from '../../context/BingoContext.tsx';

export const BingoActions: React.FC = () => {
  const {
    autoPlay,
    toggleAutoPlay,
    claimBingo,
    canWin,
    roundPhase
  } = useBingo();

  const isPlaying = roundPhase === 'playing';

  return (
    <div className="fresh-bingo-actions-bar">
      {/* 1. Auto-Play Toggle */}
      <button
        type="button"
        className={`btn-autoplay-toggle ${autoPlay ? 'autoplay-on' : ''}`}
        onClick={toggleAutoPlay}
        title={autoPlay ? 'Auto-Play is ON — click to go manual' : 'Turn on Auto-Play'}
      >
        <i className={`fa-solid ${autoPlay ? 'fa-bolt' : 'fa-hand-pointer'} autoplay-icon`}></i>
        <div className={`autoplay-switch ${autoPlay ? 'on' : ''}`} />
        <span className="autoplay-label">{autoPlay ? 'AUTO ON' : 'MANUAL'}</span>
      </button>

      {/* 2. BINGO! Call Button — disabled when auto-play on (engine handles it) */}
      <button
        type="button"
        className={`btn-claim-bingo-gold ${canWin && !autoPlay ? 'can-claim-pulsing' : ''} ${autoPlay ? 'auto-claimed' : ''}`}
        onClick={autoPlay ? undefined : claimBingo}
        disabled={!isPlaying}
        title={autoPlay ? 'Auto-Play will claim BINGO automatically!' : 'Claim BINGO'}
      >
        {autoPlay ? (
          <>
            <i className="fa-solid fa-bolt"></i>
            <span>AUTO</span>
          </>
        ) : (
          <>
            <i className="fa-solid fa-star"></i>
            <span>BINGO!</span>
            <i className="fa-solid fa-star"></i>
          </>
        )}
      </button>

      {/* 3. Called count badge (replaced "Pick" button) */}
      <div className="btn-manual-mode">
        <i className="fa-solid fa-dice" style={{ fontSize: '0.875rem', color: '#94a3b8' }}></i>
        <span style={{ fontWeight: 900, fontSize: '0.5625rem', color: canWin ? '#dc2626' : '#64748b' }}>
          {canWin && !autoPlay ? '1 TO GO!' : 'MATCH'}
        </span>
      </div>
    </div>
  );
};
