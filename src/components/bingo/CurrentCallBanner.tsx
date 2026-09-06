import React from 'react';
import { useBingo } from '../../context/BingoContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';

const getColClass = (num: number): string => {
  if (num <= 15) return 'b';
  if (num <= 30) return 'i';
  if (num <= 45) return 'n';
  if (num <= 60) return 'g';
  return 'o';
};

const getColLetter = (num: number): string => getColClass(num).toUpperCase();

export const CurrentCallBanner: React.FC = () => {
  const { currentCall, spherePop, calledNumbers, lobbyCountdown, roundPhase, waitingForPlayers, realPlayerCount } = useBingo();
  const { t } = useLanguage();

  // Recent 6 drawn balls (newest first, skip current which is shown in hero)
  const recentTrail = [...calledNumbers].reverse().slice(0, 7);

  return (
    <div className="fresh-bingo-call-banner">
      {/* Top row: art + live call */}
      <div className="call-banner-top-row">
        {/* Left Art: Hourglass */}
        <div className="call-banner-left-art">
          <svg className="hourglass-svg" viewBox="0 0 100 120" fill="none">
            <path d="M24 38C12 30 10 16 16 12C26 12 34 22 34 32L24 38Z" fill="#22c55e" />
            <path d="M20 28C24 24 30 22 32 22" stroke="#86efac" strokeWidth="2" strokeLinecap="round" />
            <circle cx="28" cy="92" r="20" fill="#fef08a" stroke="#eab308" strokeWidth="3" />
            <path d="M28 75L28 109M11 92L45 92M16 80L40 104M16 104L40 80" stroke="#facc15" strokeWidth="2" />
            <circle cx="28" cy="92" r="7" fill="#ffffff" />
            <path
              d="M36 20H84C84 20 82 48 64 60C82 72 84 100 84 100H36C36 100 38 72 56 60C38 48 36 20 36 20Z"
              fill="url(#glass-gradient)"
              stroke="#eab308"
              strokeWidth="3"
            />
            <rect x="30" y="14" width="60" height="8" rx="4" fill="#facc15" stroke="#ca8a04" strokeWidth="2" />
            <rect x="30" y="98" width="60" height="8" rx="4" fill="#facc15" stroke="#ca8a04" strokeWidth="2" />
            <path d="M46 32H74C74 32 72 46 60 54C48 46 46 32 46 32Z" fill="#facc15" />
            <line x1="60" y1="54" x2="60" y2="94" stroke="#fde047" strokeWidth="3" strokeLinecap="round" strokeDasharray="3 3" />
            <path d="M42 94C42 84 78 84 78 94H42Z" fill="#facc15" />
            <defs>
              <linearGradient id="glass-gradient" x1="36" y1="20" x2="84" y2="100" gradientUnits="userSpaceOnUse">
                <stop stopColor="#ffffff" stopOpacity="0.8" />
                <stop offset="0.5" stopColor="#fefce8" stopOpacity="0.4" />
                <stop offset="1" stopColor="#ffffff" stopOpacity="0.9" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Center: Current Call */}
        <div className="call-banner-center-text">
          {currentCall ? (
            <div className={`live-ball-call-row ${spherePop ? 'call-pop-anim' : ''}`}>
              <div className={`live-ball-badge col-${currentCall.col.toLowerCase()}`}>
                {currentCall.col}
              </div>
              <div className="live-ball-info">
                <h2 className="live-call-heading">
                  {currentCall.col}-{currentCall.num}
                </h2>
                <span className="live-call-sub">Match on your cartela!</span>
              </div>
            </div>
          ) : roundPhase === 'lobby' ? (
            <div className="waiting-call-row">
              <h2 className="waiting-call-heading" style={{ color: '#ca8a04' }}>
                {waitingForPlayers ? '⏳ WAITING FOR PLAYERS' : `⏳ STARTS IN ${lobbyCountdown}s`}
              </h2>
              <p className="waiting-call-sub">
                {waitingForPlayers ? `${realPlayerCount}/2 Players Joined` : `${realPlayerCount} Players • ${lobbyCountdown}s`}
              </p>
            </div>
          ) : (
            <div className="waiting-call-row">
              <h2 className="waiting-call-heading">{t('bingo.waitingCall')}</h2>
              <p className="waiting-call-sub">{t('bingo.goodLuckSub')}</p>
            </div>
          )}
        </div>

        {/* Right Art: Lemon Slice */}
        <div className="call-banner-right-art">
          <svg className="lemon-slice-svg" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="42" fill="#facc15" stroke="#eab308" strokeWidth="4" />
            <circle cx="50" cy="50" r="36" fill="#fefce8" />
            <path d="M50 14L50 86M14 50L86 50M24 24L76 76M24 76L76 24" stroke="#facc15" strokeWidth="3.5" />
            <circle cx="50" cy="50" r="9" fill="#ffffff" />
            <path d="M78 20C90 18 94 30 90 38C82 38 76 30 78 20Z" fill="#16a34a" />
          </svg>
        </div>
      </div>

      {/* Recent Calls Trail */}
      <div className="recent-calls-trail">
        {recentTrail.length > 0 ? (
          recentTrail.map((num, idx) => {
            const colClass = getColClass(num);
            const colLetter = getColLetter(num);
            return (
              <div key={`${num}-${idx}`} className="recent-call-pill">
                <span className={`recent-call-pill-letter col-${colClass}`}>{colLetter}</span>
                <span className="recent-call-pill-num">{num}</span>
              </div>
            );
          })
        ) : (
          <span className="recent-calls-empty">Waiting for first ball...</span>
        )}
      </div>
    </div>
  );
};
