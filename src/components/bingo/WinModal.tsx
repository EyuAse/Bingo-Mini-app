import React, { useEffect, useMemo, useRef } from 'react';
import { useBingo, generateCardFromId } from '../../context/BingoContext.tsx';
import { useApp } from '../../context/AppContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

// Safe numeric formatter that NEVER throws on undefined, null, or NaN
const safeLocale = (val: any, fallback = 0): string => {
  if (val === null || val === undefined) return fallback.toLocaleString();
  const num = typeof val === 'number' ? val : Number(val);
  return (isNaN(num) ? fallback : num).toLocaleString();
};

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
  // isMounted guard prevents calling closeWinModalAndRestart during unmount
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!showWinModal) return;
    const timer = setTimeout(() => {
      if (isMountedRef.current) {
        closeWinModalAndRestart();
      }
    }, 8000);
    return () => clearTimeout(timer);
  }, [showWinModal, closeWinModalAndRestart]);

  if (!winResult || !showWinModal) return null;

  const isSolo = winResult.winType === 'user_solo';
  const isSplit = winResult.winType === 'user_split';
  const isOpponentWin = winResult.winType === 'opponent_win';

  const userShare = typeof winResult.userShare === 'number' && !isNaN(winResult.userShare)
    ? winResult.userShare
    : (typeof (winResult as any).sharePerWinner === 'number' ? (winResult as any).sharePerWinner : 0);

  const winnerPayout = typeof winResult.winnerPayout === 'number' && !isNaN(winResult.winnerPayout)
    ? winResult.winnerPayout
    : (typeof (winResult as any).sharePerWinner === 'number' ? (winResult as any).sharePerWinner : (winResult.totalPot || 50));

  const stakeAmt = Number(winResult.stakeAmount) || 10;

  // Clamped valid Cartela ID (1-400)
  const rawCartela = Number(winResult.winningCartelaNumber || (winResult as any).winningCartela || 1);
  const cartelaNum = (!isNaN(rawCartela) && rawCartela >= 1 && rawCartela <= 400) ? rawCartela : 1;

  const winnerName = typeof winResult.winnerName === 'string' && winResult.winnerName.trim()
    ? winResult.winnerName
    : (Array.isArray((winResult as any).winnerNames) && (winResult as any).winnerNames[0]
      ? String((winResult as any).winnerNames[0])
      : 'Player');

  // Bulletproof 5x5 card cells generation
  const winningCardCells = useMemo(() => {
    try {
      const cells = generateCardFromId(cartelaNum);
      if (Array.isArray(cells) && cells.length === 25) {
        return cells;
      }
    } catch (e) {
      console.warn('⚠️ [WinModal] generateCardFromId fallback to #1:', e);
    }
    return generateCardFromId(1);
  }, [cartelaNum]);

  // Safe string filtering of co-winners
  const rawCoWinners: any[] = Array.isArray(winResult.coWinners) && winResult.coWinners.length > 0
    ? winResult.coWinners
    : (Array.isArray((winResult as any).winnerNames) ? (winResult as any).winnerNames : []);

  const otherCoWinners = rawCoWinners
    .map(item => (typeof item === 'string' ? item : (typeof item === 'object' && item?.userName ? String(item.userName) : String(item || ''))))
    .filter(name => {
      if (!name || !name.trim()) return false;
      if (name.trim() === 'You') return false;
      const cleanName = name.trim().toLowerCase();
      const fullName = user?.fullName;
      if (fullName && typeof fullName === 'string' && cleanName === fullName.trim().toLowerCase()) return false;
      const userUsername = (user as any)?.username || user?.telegramUsername;
      if (userUsername && typeof userUsername === 'string' && cleanName.includes(userUsername.toLowerCase())) return false;
      return true;
    });

  const isTrueMultiplayerSplit = isSplit && otherCoWinners.length > 0;
  const coWinnersList = otherCoWinners.join(', ');

  const handleShareWin = () => {
    const text = encodeURIComponent(
      `🎉 I just won ${safeLocale(userShare)} ETB on Lomi 75-Ball Bingo! Come play and win with me: https://t.me/LomiBingoBot`
    );
    window.open(`https://t.me/share/url?url=https://t.me/LomiBingoBot&text=${text}`, '_blank');
  };

  // Safe winning indices array
  const winningIndices = Array.isArray(winResult.winningLine)
    ? winResult.winningLine
    : (Array.isArray((winResult as any).winningIndices) ? (winResult as any).winningIndices : []);

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
                ? `${safeLocale(winnerPayout)} ETB`
                : `+${safeLocale(userShare)} ETB`}
            </strong>

            {/* Pot & Commission Transparency Breakdown */}
            {(() => {
              const grossPot = Number(winResult.totalPot) || Number(winnerPayout) || 0;
              const houseFee = typeof (winResult as any).houseFee === 'number'
                ? Number((winResult as any).houseFee) || 0
                : (isTrueMultiplayerSplit ? 0 : Math.max(0, grossPot - (Number(winnerPayout) || 0)));
              const netPrizePool = typeof (winResult as any).netPrizePot === 'number'
                ? Number((winResult as any).netPrizePot) || 0
                : Math.max(0, grossPot - houseFee);
              const isFeeCharged = houseFee > 0;

              return (
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
                    <strong style={{ color: '#0f172a' }}>{safeLocale(grossPot)} ETB</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Platform Commission:</span>
                    <span style={{ color: isFeeCharged ? '#b91c1c' : '#16a34a', fontWeight: 600 }}>
                      {isFeeCharged
                        ? `20% (-${safeLocale(houseFee)} ETB)`
                        : '0% (0.00 ETB • ≤5 Players)'}
                    </span>
                  </div>
                  {isTrueMultiplayerSplit && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Net Prize Pot:</span>
                      <strong style={{ color: '#0f172a' }}>{safeLocale(netPrizePool)} ETB</strong>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #cbd5e1', paddingTop: '4px' }}>
                    <span>{isTrueMultiplayerSplit ? 'Your Split Share (50/50):' : 'Net Winner Payout:'}</span>
                    <strong style={{ color: '#16a34a' }}>{safeLocale(winnerPayout)} ETB</strong>
                  </div>
                </div>
              );
            })()}

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
                {winningIndices.length >= 4 ? '5-IN-A-ROW' : 'BINGO'}
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
                {Array.isArray(winningCardCells) && winningCardCells.map(cell => {
                  if (!cell || typeof cell.index !== 'number') return null;
                  const isWinningCell = Array.isArray(winningIndices) && winningIndices.includes(cell.index);
                  return (
                    <div
                      key={cell.index}
                      className={`win-modal-cell ${isWinningCell ? 'win-highlight' : ''} ${cell.isFree ? 'free-cell' : ''}`}
                    >
                      {cell.isFree ? '⭐' : (cell.val !== undefined && cell.val !== null ? cell.val : '')}
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
                  : `CLAIM ${safeLocale(userShare)} ETB & PLAY NEXT ROUND`}
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
