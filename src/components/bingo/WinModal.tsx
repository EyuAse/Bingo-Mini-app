import React, { useEffect } from 'react';
import { useBingo } from '../../context/BingoContext.tsx';
import { useApp } from '../../context/AppContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';

export const WinModal: React.FC = () => {
  const {
    showWinModal,
    winResult,
    closeWinModalAndRestart
  } = useBingo();
  const { showToast } = useApp();
  const { t } = useLanguage();

  // Auto-dismiss after 8 seconds to match celebration countdown
  useEffect(() => {
    if (!showWinModal) return;
    const timer = setTimeout(() => {
      closeWinModalAndRestart();
    }, 8000);
    return () => clearTimeout(timer);
  }, [showWinModal, closeWinModalAndRestart]);

  if (!winResult || !showWinModal) return null;

  const isSolo = winResult.winType === 'user_solo';
  const isSplit = winResult.winType === 'user_split';
  const isOpponentWin = winResult.winType === 'opponent_win';

  const handleShareWin = () => {
    const text = encodeURIComponent(
      `🎉 I just won ${winResult.userShare.toLocaleString()} ETB on Lomi 75-Ball Bingo! Come play and win with me: https://t.me/LomiBingoBot`
    );
    window.open(`https://t.me/share/url?url=https://t.me/LomiBingoBot&text=${text}`, '_blank');
  };

  return (
    <div className="fresh-victory-modal-backdrop" onClick={closeWinModalAndRestart}>
      <div className="victory-celebration-card" onClick={e => e.stopPropagation()}>
        {/* Close Button */}
        <button
          type="button"
          className="btn-modal-exit-corner"
          onClick={closeWinModalAndRestart}
          title="Close & Exit"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        {/* Glow Aura */}
        <div className="victory-glow-aura"></div>

        {/* Trophy Artwork */}
        <div className="victory-trophy-hero">
          {isOpponentWin ? (
            <svg className="victory-trophy-svg" viewBox="0 0 140 140" fill="none">
              <circle cx="70" cy="70" r="54" fill="#fef9c3" />
              <circle cx="70" cy="70" r="44" fill="#facc15" stroke="#ca8a04" strokeWidth="3" />
              <circle cx="70" cy="70" r="34" fill="#ffffff" />
              <path d="M70 46L76 60L90 60L78 68L82 82L70 74L58 82L62 68L50 60L64 60L70 46Z" fill="#eab308" />
              <text x="70" y="108" textAnchor="middle" fill="#854d0e" fontSize="13" fontWeight="900" fontFamily="sans-serif">
                WINNER
              </text>
            </svg>
          ) : (
            <svg className="victory-trophy-svg" viewBox="0 0 140 140" fill="none">
              <circle cx="70" cy="70" r="54" fill="#fef08a" fillOpacity="0.4" />
              <circle cx="28" cy="40" r="14" fill="#facc15" stroke="#ca8a04" strokeWidth="2" />
              <path d="M28 32L30 38L36 38L31 42L33 48L28 44L23 48L25 42L20 38L26 38L28 32Z" fill="#ffffff" />
              <circle cx="112" cy="40" r="14" fill="#facc15" stroke="#ca8a04" strokeWidth="2" />
              <path d="M112 32L114 38L120 38L115 42L117 48L112 44L107 48L109 42L104 38L110 38L112 32Z" fill="#ffffff" />
              <path
                d="M44 34H96V64C96 78 84 90 70 90C56 90 44 78 44 64V34Z"
                fill="url(#trophy-gold-grad)"
                stroke="#ca8a04"
                strokeWidth="3"
              />
              <path d="M44 42C30 42 24 54 28 66C32 78 44 78 44 78" stroke="#facc15" strokeWidth="6" strokeLinecap="round" />
              <path d="M96 42C110 42 116 54 112 66C108 78 96 78 96 78" stroke="#facc15" strokeWidth="6" strokeLinecap="round" />
              <path d="M64 90H76V106H64V90Z" fill="#eab308" stroke="#ca8a04" strokeWidth="2" />
              <path d="M48 106H92L96 118H44L48 106Z" fill="#ca8a04" stroke="#854d0e" strokeWidth="2" />
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
          )}
        </div>

        {/* Title */}
        <h2 className="victory-celebration-title">
          {isOpponentWin
            ? '🏆 BINGO CALLED!'
            : isSplit
            ? '🤝 SPLIT POT VICTORY!'
            : '🎉 BINGO! YOU WON!'}
        </h2>

        <p className="victory-celebration-sub">
          {isOpponentWin ? (
            <>
              Winner: <strong>{winResult.winnerName}</strong> (Cartela #{winResult.winningCartelaNumber})
            </>
          ) : isSolo ? (
            <>
              Congratulations! Your <strong>Cartela #{winResult.winningCartelaNumber}</strong> completed BINGO first!
            </>
          ) : (
            <>
              Multiplayer Split: You and {winResult.coWinners.join(', ')} called BINGO on the same ball!
            </>
          )}
        </p>

        {/* Prize Box */}
        <div className="victory-prize-display-card">
          <span className="victory-prize-label">
            {isOpponentWin ? 'ROUND PRIZE POOL' : isSplit ? 'YOUR SPLIT POT SHARE' : 'YOUR TOTAL WINNINGS'}
          </span>
          <strong className={`victory-prize-amount ${isOpponentWin ? 'gold' : 'green'}`}>
            {isOpponentWin
              ? `${winResult.totalPot.toLocaleString()}.00 ETB`
              : `+${winResult.userShare.toLocaleString()}.00 ETB`}
          </strong>
          <span className="victory-credited-tag">
            {isOpponentWin
              ? 'Better luck next round! Keep playing!'
              : '✓ Instantly credited to your wallet'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="victory-actions-group">
          <button
            type="button"
            className="btn-victory-claim-gold"
            onClick={closeWinModalAndRestart}
          >
            <i className="fa-solid fa-play"></i>
            <span>{isOpponentWin ? 'PLAY NEXT ROUND' : 'CLAIM & PLAY NEXT ROUND'}</span>
          </button>

          {!isOpponentWin && (
            <button
              type="button"
              className="btn-victory-share-telegram"
              onClick={handleShareWin}
            >
              <i className="fa-brands fa-telegram"></i>
              <span>{t('bingo.shareWin')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
