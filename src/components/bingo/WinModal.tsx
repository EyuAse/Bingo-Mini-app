import React, { useEffect, useMemo } from 'react';
import { useBingo, generateCardFromId } from '../../context/BingoContext.tsx';
import { useApp } from '../../context/AppContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

export const WinModal: React.FC = () => {
  const {
    showWinModal,
    winResult,
    closeWinModalAndRestart
  } = useBingo();
  const { showToast } = useApp();
  const { t } = useLanguage();
  const { user } = useAuth();

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

  const userShare = typeof winResult.userShare === 'number' 
    ? winResult.userShare 
    : (typeof (winResult as any).sharePerWinner === 'number' ? (winResult as any).sharePerWinner : 0);
  const winnerPayout = typeof winResult.winnerPayout === 'number'
    ? winResult.winnerPayout
    : (typeof (winResult as any).sharePerWinner === 'number' ? (winResult as any).sharePerWinner : (winResult.totalPot || 50));
  const stakeAmt = winResult.stakeAmount || 10;
  const cartelaNum = winResult.winningCartelaNumber || (winResult as any).winningCartela || 1;
  const winnerName = winResult.winnerName || (winResult as any).winnerNames?.[0] || 'Player';

  const winningCardCells = useMemo(() => {
    return generateCardFromId(cartelaNum);
  }, [cartelaNum]);

  // Filter out current user's own name, 'You', and username from co-winners to eliminate the self-split bug
  const rawCoWinners: string[] = Array.isArray(winResult.coWinners) && winResult.coWinners.length > 0
    ? winResult.coWinners
    : (Array.isArray((winResult as any).winnerNames) ? (winResult as any).winnerNames : []);

  const otherCoWinners = rawCoWinners.filter(name => {
    if (!name) return false;
    if (name === 'You') return false;
    if (user?.fullName && name.trim().toLowerCase() === user.fullName.trim().toLowerCase()) return false;
    const userUsername = (user as any)?.username || user?.telegramUsername;
    if (userUsername && name.toLowerCase().includes(userUsername.toLowerCase())) return false;
    return true;
  });

  const isTrueMultiplayerSplit = isSplit && otherCoWinners.length > 0;
  const coWinnersList = otherCoWinners.join(', ');

  const handleShareWin = () => {
    const text = encodeURIComponent(
      `🎉 I just won ${userShare.toLocaleString()} ETB on Lomi 75-Ball Bingo! Come play and win with me: https://t.me/LomiBingoBot`
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
            : isTrueMultiplayerSplit
            ? '🤝 SPLIT POT VICTORY!'
            : '🎉 BINGO! YOU WON!'}
        </h2>

        <p className="victory-celebration-sub">
          {isOpponentWin ? (
            <>
              Winner: <strong>{winnerName}</strong> (Cartela #{cartelaNum})
            </>
          ) : !isTrueMultiplayerSplit ? (
            <>
              Congratulations! Your <strong>Cartela #{cartelaNum}</strong> completed BINGO!
            </>
          ) : (
            <>
              Multiplayer Split: You and <strong>{coWinnersList}</strong> called BINGO on the same ball!
            </>
          )}
        </p>

        {/* Prize Box with Financial Transparency Breakdown */}
        <div className="victory-prize-display-card">
          <span className="victory-prize-label">
            {isOpponentWin ? 'PRIZE WON BY WINNER' : isTrueMultiplayerSplit ? 'YOUR SPLIT POT SHARE' : 'YOUR NET WINNINGS'}
          </span>
          <strong className={`victory-prize-amount ${isOpponentWin ? 'gold' : 'green'}`}>
            {isOpponentWin
              ? `${winnerPayout.toLocaleString()} ETB`
              : `+${userShare.toLocaleString()} ETB`}
          </strong>

          {/* Pot & Commission Transparency Breakdown */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            marginTop: '8px',
            padding: '8px 12px',
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
            borderRadius: '8px',
            fontSize: '0.75rem',
            color: '#475569',
            width: '100%'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Total Room Pot:</span>
              <strong style={{ color: '#0f172a' }}>{(winResult.totalPot || winnerPayout).toLocaleString()} ETB</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>House Commission:</span>
              <span style={{ color: ((winResult.totalPot || winnerPayout) - winnerPayout) > 0 ? '#b91c1c' : '#16a34a', fontWeight: 600 }}>
                {((winResult.totalPot || winnerPayout) - winnerPayout) > 0
                  ? `20% (-${((winResult.totalPot || winnerPayout) - winnerPayout).toLocaleString()} ETB)`
                  : '0% (0.00 ETB • ≤5 Players)'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #cbd5e1', paddingTop: '4px' }}>
              <span>Net Winner Payout:</span>
              <strong style={{ color: '#16a34a' }}>{winnerPayout.toLocaleString()} ETB</strong>
            </div>
          </div>

          <span className="victory-credited-tag" style={{ marginTop: '8px' }}>
            {isOpponentWin
              ? `Winner played in the ${stakeAmt} ETB Room`
              : '✓ Instantly credited to your wallet'}
          </span>
        </div>

        {/* ── Winning Cartela 5x5 Matrix Showcase: Shows the exact winning numbers & pattern ── */}
        <div className="victory-winning-cartela-box">
          <div className="winning-cartela-header">
            <span className="winning-cartela-title">
              🏆 Cartela #{cartelaNum} (Winning Card)
            </span>
            <span className="winning-cartela-badge">
              {winResult.winningLine && winResult.winningLine.length >= 4 ? '5-IN-A-ROW' : 'BINGO'}
            </span>
          </div>

          <div className="winning-cartela-grid-wrap">
            <div className="winning-cartela-col-headers">
              <span className="win-col-hdr col-b">B</span>
              <span className="win-col-hdr col-i">I</span>
              <span className="win-col-hdr col-n">N</span>
              <span className="win-col-hdr col-g">G</span>
              <span className="win-col-hdr col-o">O</span>
            </div>
            <div className="winning-cartela-5x5">
              {winningCardCells.map(cell => {
                const isWinningCell = Array.isArray(winResult.winningLine) && winResult.winningLine.includes(cell.index);
                return (
                  <div
                    key={cell.index}
                    className={`win-modal-cell ${isWinningCell ? 'win-highlight' : ''} ${cell.isFree ? 'free-cell' : ''}`}
                  >
                    {cell.isFree ? '⭐' : cell.val}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="winning-cartela-footnote">
            ⭐ Gold glowing cells show the verified winning pattern
          </div>
        </div>

        {/* Action Buttons */}
        <div className="victory-actions-group">
          <button
            type="button"
            className="btn-victory-claim-gold"
            onClick={closeWinModalAndRestart}
          >
            <i className="fa-solid fa-play"></i>
            <span>
              {isOpponentWin
                ? 'PLAY NEXT ROUND'
                : `CLAIM ${userShare.toLocaleString()} ETB & PLAY NEXT ROUND`}
            </span>
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
