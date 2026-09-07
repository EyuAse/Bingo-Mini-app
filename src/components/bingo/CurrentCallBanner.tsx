import React from 'react';
import { useBingo } from '../../context/BingoContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';

// ── Column helpers (untouched) ─────────────────────────────
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

  // Last 5 previous balls (skip the current one which is shown in the hero ball)
  const prevTrail = [...calledNumbers].reverse().slice(currentCall ? 1 : 0, 6);

  // Ball column class for the main hero ball
  const mainColClass = currentCall
    ? `col-${currentCall.col.toLowerCase()}`
    : 'col-none';

  return (
    <div className={`nb-call-section${spherePop ? ' nb-call-pop' : ''}`}>

      {/* LEFT — Glowing 3D Solar Hero Ball */}
      <div className="nb-ball-wrap">
        <div className={`nb-ball-solar-ring ${mainColClass}`}></div>
        <span className="nb-solar-sparkle sparkle-top">✨</span>
        <span className="nb-solar-sparkle sparkle-bot">✨</span>

        <div className={`nb-ball-circle ${mainColClass}`}>
          <div className={`nb-ball-inner-sphere ${mainColClass}`}>
            {currentCall ? (
              <>
                <span className={`nb-ball-letter ${mainColClass}`}>{currentCall.col}</span>
                <span className={`nb-ball-number ${mainColClass}`}>{currentCall.num}</span>
              </>
            ) : (
              <span className="nb-ball-placeholder">
                {roundPhase === 'lobby' ? '⏳' : '🎱'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* CENTER — Label + Large Number (strictly single line, no wrapping) */}
      <div className="nb-call-center">
        <div className="nb-current-ball-pill">CURRENT BALL</div>

        {currentCall ? (
          <div className="nb-call-number-text">
            <span className="nb-col-letter">{currentCall.col}</span>-{currentCall.num}
          </div>
        ) : roundPhase === 'lobby' ? (
          <div className="nb-waiting-block">
            <div className="nb-waiting-text">
              {waitingForPlayers
                ? 'WAITING FOR PLAYERS'
                : `STARTS IN ${lobbyCountdown}s`}
            </div>
            <div className="nb-waiting-sub">
              {waitingForPlayers
                ? `${realPlayerCount}/2 Players Joined`
                : `${realPlayerCount} Players Ready`}
            </div>
          </div>
        ) : (
          <div className="nb-waiting-block">
            <div className="nb-waiting-text">{t('bingo.waitingCall')}</div>
            <div className="nb-waiting-sub">{t('bingo.goodLuckSub')}</div>
          </div>
        )}
      </div>

      {/* RIGHT — Previous Balls inside bordered pill */}
      <div className="nb-prev-balls-col">
        <div className="nb-prev-balls-frame">
          <span className="nb-prev-label">PREVIOUS BALLS</span>
          <div className="nb-prev-balls-row">
            {prevTrail.length > 0 ? (
              prevTrail.map((num, idx) => {
                const colClass = getColClass(num);
                const colLetter = getColLetter(num);
                return (
                  <div key={`${num}-${idx}`} className={`nb-prev-ball-pill col-${colClass}`}>
                    <span className="prev-letter">{colLetter}</span>
                    <span className="prev-num">{num}</span>
                  </div>
                );
              })
            ) : (
              <span className="nb-prev-empty">—</span>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};
