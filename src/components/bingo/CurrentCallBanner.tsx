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
  const { currentCall, spherePop, calledNumbers } = useBingo();
  const { t } = useLanguage();

  // Recent drawn balls (newest first, limit to 6)
  const recentTrail = [...calledNumbers].reverse().slice(0, 6);

  return (
    <div className="fresh-bingo-call-banner">
      <div className="call-banner-content-row">
        {/* Active Live Ball Sphere */}
        <div className="call-banner-live-sphere-box">
          {currentCall ? (
            <div className={`live-ball-sphere col-${currentCall.col.toLowerCase()} ${spherePop ? 'call-pop-anim' : ''}`}>
              <span className="sphere-letter">{currentCall.col}</span>
              <span className="sphere-number">{currentCall.num}</span>
            </div>
          ) : (
            <div className="live-ball-sphere waiting-sphere">
              <span className="waiting-lemon-icon">🍋</span>
            </div>
          )}
        </div>

        {/* Live Call Info or Waiting Text */}
        <div className="call-banner-details-wrap">
          {currentCall ? (
            <div className="live-call-text-group">
              <div className="call-headline-row">
                <span className="call-live-indicator-dot"></span>
                <h2 className="live-call-title">
                  CALL: <strong className={`col-text-${currentCall.col.toLowerCase()}`}>{currentCall.col}-{currentCall.num}</strong>
                </h2>
              </div>
              <p className="live-call-hint">
                Check & match on your Cartela!
              </p>
            </div>
          ) : (
            <div className="waiting-call-text-group">
              <h2 className="waiting-call-title">{t('bingo.waitingCall')}</h2>
              <p className="waiting-call-hint">{t('bingo.goodLuckSub')}</p>
            </div>
          )}
        </div>

        {/* Recent Balls Ribbon */}
        <div className="call-banner-recent-ribbon">
          <span className="recent-ribbon-label">Recent:</span>
          <div className="recent-ribbon-trail">
            {recentTrail.length > 0 ? (
              recentTrail.map((num, idx) => {
                const colClass = getColClass(num);
                const colLetter = getColLetter(num);
                return (
                  <div key={`${num}-${idx}`} className="mini-recent-ball-pill">
                    <span className={`pill-letter col-${colClass}`}>{colLetter}</span>
                    <span className="pill-num">{num}</span>
                  </div>
                );
              })
            ) : (
              <span className="recent-none-tag">--</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
