import React from 'react';
import { useBingo } from '../../context/BingoContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';

export const WinModal: React.FC = () => {
  const {
    showWinModal,
    winResult,
    winnerCountdown,
    closeWinModalAndRestart,
    preBuyNextRound,
    hasPreBoughtNext
  } = useBingo();
  const { t } = useLanguage();

  if (!winResult) return null;

  return (
    <div className={`bingo-win-modal ${showWinModal ? 'active' : ''}`} id="bingo-win-modal">
      <div className="bingo-win-card">
        {/* Scenario 1: Solo Winner */}
        {winResult.winType === 'user_solo' && (
          <>
            <div className="win-crown">👑</div>
            <h2 className="win-title gold-title">{t('bingo.soloWinTitle')}</h2>
            <p className="win-subtitle">
              {t('bingo.soloWinSub', { num: winResult.winningCartelaNumber })}
            </p>
            <div className="win-prize-box">
              <span className="win-prize-label">{t('bingo.soloWinLabel')}</span>
              <span className="win-prize-amount" id="modal-prize-amount">
                +{winResult.userShare.toLocaleString()} ETB
              </span>
            </div>
          </>
        )}

        {/* Scenario 2: Split Winner */}
        {winResult.winType === 'user_split' && (
          <>
            <div className="split-win-badge">
              <i className="fa-solid fa-handshake"></i>
              <span>{t('bingo.splitWinBadge', { count: winResult.coWinners.length + 1 })}</span>
            </div>
            <h2 className="win-title gold-title">{t('bingo.callBingo')}</h2>
            <p className="win-subtitle">
              {t('bingo.splitWinSub', { names: winResult.coWinners.join(', ') })}
            </p>
            <div className="win-prize-box split-box">
              <div className="split-details-row">
                <span>{t('bingo.splitTotalLabel', { pot: winResult.totalPot.toLocaleString() })}</span>
                <span>{t('bingo.splitShareLabel', { pct: Math.round(100 / (winResult.coWinners.length + 1)) })}</span>
              </div>
              <span className="win-prize-label">{t('bingo.yourShare')}</span>
              <span className="win-prize-amount" id="modal-prize-amount">
                +{winResult.userShare.toLocaleString()} ETB
              </span>
            </div>
          </>
        )}

        {/* Scenario 3: Opponent Winner */}
        {winResult.winType === 'opponent_win' && (
          <>
            <div className="opp-trophy">🏆</div>
            <h2 className="win-title blue-title">{t('bingo.oppWinTitle')}</h2>
            <p className="win-subtitle">
              {t('bingo.oppWinSub', { name: winResult.winnerName, amount: winResult.totalPot.toLocaleString() })}
            </p>
            <div className="opp-encourage-box">
              <i className="fa-regular fa-clock prompt-icon"></i>
              <span>{t('bingo.oppEncourage')}</span>
            </div>
            {!hasPreBoughtNext ? (
              <button className="prebuy-cta-btn" onClick={preBuyNextRound}>
                <i className="fa-solid fa-ticket"></i>
                <span>{t('bingo.preBuyBtn')}</span>
              </button>
            ) : (
              <div className="prebought-badge">
                <i className="fa-solid fa-check"></i>
                <span>{t('bingo.preBoughtBoxTitle')}</span>
              </div>
            )}
          </>
        )}

        {/* 5-Second Auto-Countdown Indicator */}
        <div className="winner-countdown-row">
          <i className="fa-solid fa-rotate-right spin-slow"></i>
          <span>{t('bingo.nextRoundStarting', { sec: winnerCountdown })}</span>
        </div>

        {/* Manual Dismiss / Play Next CTA */}
        <button
          className="win-collect-btn"
          id="win-collect-btn"
          onClick={closeWinModalAndRestart}
        >
          {t('bingo.playNextRound')}
        </button>
      </div>
    </div>
  );
};
