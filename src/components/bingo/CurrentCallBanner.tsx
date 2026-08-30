import React from 'react';
import { useBingo } from '../../context/BingoContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';

export const CurrentCallBanner: React.FC = () => {
  const { currentCall, spherePop } = useBingo();
  const { t } = useLanguage();

  return (
    <div className="current-call-banner">
      {currentCall ? (
        <div className={`call-content-box ${spherePop ? 'call-pop-anim' : ''}`}>
          <div className="call-letter-badge">
            <span>{currentCall.col}</span>
          </div>
          <div className="call-number-text">
            <span>{currentCall.col}-{currentCall.num}</span>
          </div>
        </div>
      ) : (
        <div className="call-waiting-box">
          <div className="call-letter-badge waiting">
            <span>⏳</span>
          </div>
          <div className="call-number-text waiting">
            <span>{t('bingo.waitingCall')}</span>
          </div>
        </div>
      )}
    </div>
  );
};
