import React from 'react';
import { useBingo } from '../../context/BingoContext.tsx';
import { useApp } from '../../context/AppContext.tsx';

export const WinModal: React.FC = () => {
  const {
    showWinModal,
    winResult,
    winnerCountdown,
    closeWinModalAndRestart
  } = useBingo();
  const { showToast } = useApp();

  if (!winResult || !showWinModal) return null;

  const isSolo = winResult.winType === 'user_solo';

  const handleShareWin = () => {
    const text = encodeURIComponent(
      `🎉 I just won ${winResult.userShare.toLocaleString()} ETB on Lomi Bingo! Come play 75-Ball Express and win with me: https://t.me/LomiBingoBot`
    );
    window.open(`https://t.me/share/url?url=https://t.me/LomiBingoBot&text=${text}`, '_blank');
  };

  return (
    <div className="fresh-victory-modal-backdrop">
      <div className="victory-celebration-card">
        {/* Glow Aura & Ray Particles */}
        <div className="victory-glow-aura"></div>

        {/* Top 3D Golden Trophy Artwork */}
        <div className="victory-trophy-hero">
          <svg className="victory-trophy-svg" viewBox="0 0 140 140" fill="none">
            {/* Sunburst Rays */}
            <circle cx="70" cy="70" r="54" fill="#fef08a" fillOpacity="0.4" />
            
            {/* Golden Star Coins */}
            <circle cx="28" cy="40" r="14" fill="#facc15" stroke="#ca8a04" strokeWidth="2" />
            <path d="M28 32L30 38L36 38L31 42L33 48L28 44L23 48L25 42L20 38L26 38L28 32Z" fill="#ffffff" />

            <circle cx="112" cy="40" r="14" fill="#facc15" stroke="#ca8a04" strokeWidth="2" />
            <path d="M112 32L114 38L120 38L115 42L117 48L112 44L107 48L109 42L104 38L110 38L112 32Z" fill="#ffffff" />

            {/* Trophy Cup */}
            <path
              d="M44 34H96V64C96 78 84 90 70 90C56 90 44 78 44 64V34Z"
              fill="url(#trophy-gold-grad)"
              stroke="#ca8a04"
              strokeWidth="3"
            />
            {/* Trophy Handles */}
            <path d="M44 42C30 42 24 54 28 66C32 78 44 78 44 78" stroke="#facc15" strokeWidth="6" strokeLinecap="round" />
            <path d="M96 42C110 42 116 54 112 66C108 78 96 78 96 78" stroke="#facc15" strokeWidth="6" strokeLinecap="round" />
            {/* Trophy Stem & Base */}
            <path d="M64 90H76V106H64V90Z" fill="#eab308" stroke="#ca8a04" strokeWidth="2" />
            <path d="M48 106H92L96 118H44L48 106Z" fill="#ca8a04" stroke="#854d0e" strokeWidth="2" />

            {/* Big 75 Ball on Trophy */}
            <circle cx="70" cy="58" r="16" fill="#ffffff" />
            <text x="70" y="64" textAnchor="middle" fill="#0f172a" fontSize="15" fontWeight="900" fontFamily="sans-serif">75</text>

            <defs>
              <linearGradient id="trophy-gold-grad" x1="44" y1="34" x2="96" y2="90" gradientUnits="userSpaceOnUse">
                <stop stopColor="#fef08a" />
                <stop offset="0.5" stopColor="#facc15" />
                <stop offset="1" stopColor="#eab308" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Title & Celebration Heading */}
        <h2 className="victory-celebration-title">🎉 BINGO! YOU WON! 🎉</h2>
        <p className="victory-celebration-sub">
          {isSolo
            ? `Congratulations! You claimed the full jackpot with Cartela #${winResult.winningCartelaNumber || '1'}!`
            : `Shared Win with ${winResult.coWinners.join(', ')}!`}
        </p>

        {/* Big Prize Amount Box */}
        <div className="victory-prize-display-card">
          <span className="victory-prize-label">TOTAL WINNING PRIZE</span>
          <strong className="victory-prize-amount">
            +{winResult.userShare.toLocaleString()}.00 ETB
          </strong>
          <span className="victory-credited-tag">✓ Automatically Credited to Balance</span>
        </div>

        {/* Auto Countdown Bar */}
        <div className="victory-next-round-timer">
          <i className="fa-solid fa-bolt gold"></i>
          <span>Next round begins in <strong>00:0{winnerCountdown}</strong></span>
        </div>

        {/* Action Buttons */}
        <div className="victory-actions-group">
          <button
            type="button"
            className="btn-victory-claim-gold"
            onClick={closeWinModalAndRestart}
          >
            <i className="fa-solid fa-coins"></i>
            <span>Claim & Play Next Round</span>
          </button>

          <button
            type="button"
            className="btn-victory-share-telegram"
            onClick={handleShareWin}
          >
            <i className="fa-brands fa-telegram"></i>
            <span>Share Win with Friends</span>
          </button>
        </div>
      </div>
    </div>
  );
};
