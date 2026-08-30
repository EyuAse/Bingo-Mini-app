import React from 'react';
import { useBingo } from '../../context/BingoContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { useWallet } from '../../context/WalletContext.tsx';

export const BettingBar: React.FC = () => {
  const {
    betAmount,
    setBetAmount,
    cardQuantity,
    setCardQuantity,
    hasTicket,
    hasPreBoughtNext,
    buyTicket,
    preBuyNextRound,
    lobbyCountdown,
    roundPhase
  } = useBingo();
  const { t } = useLanguage();
  const { balance, isBalanceVisible } = useWallet();

  const betChips = [10, 20, 50, 100];
  const totalCost = betAmount * cardQuantity;

  return (
    <div className="bingo-betting-bar" id="bingo-betting-bar">
      <div className="betting-header">
        <div className="betting-title">
          <i className="fa-solid fa-coins gold"></i>
          <span>{t('bingo.selectStakeHeader')}</span>
          <span className="betting-wallet-pill">
            <i className="fa-solid fa-wallet"></i> {isBalanceVisible ? `${balance.toFixed(2)} ETB` : '••••'}
          </span>
        </div>
        <div className={`lobby-countdown-pill ${roundPhase === 'lobby' ? 'active-lobby' : ''}`}>
          <i className="fa-regular fa-clock"></i>
          <span>
            {roundPhase === 'lobby' && (
              <>{t('bingo.nextRoundIn')} <strong>00:{lobbyCountdown < 10 ? `0${lobbyCountdown}` : lobbyCountdown}</strong></>
            )}
            {roundPhase === 'locked' && <strong className="red-lock">{t('bingo.salesLocked')}</strong>}
            {roundPhase === 'playing' && <strong>{t('bingo.inPlay')}</strong>}
            {roundPhase === 'winner' && <strong className="gold">{t('bingo.winnerFound')}</strong>}
          </span>
        </div>
      </div>

      {/* Quick Bet Chips: 10, 20, 50, 100 */}
      <div className="bet-chips-row">
        {betChips.map(chip => (
          <button
            key={chip}
            className={`bet-chip ${betAmount === chip ? 'active' : ''}`}
            data-bet={chip}
            onClick={() => setBetAmount(chip)}
          >
            {chip} ETB
          </button>
        ))}
      </div>

      {/* Card Quantity (Strict 1 or 2 Cartelas) & Action CTA */}
      <div className="buy-action-row">
        <div className="card-qty-selector">
          <span className="qty-label">{t('bingo.cartela')}:</span>
          <button
            className="qty-btn"
            id="qty-minus"
            disabled={cardQuantity <= 1}
            onClick={() => setCardQuantity(1)}
            title="Minimum 1 Cartela"
          >
            -
          </button>
          <span className="qty-val" id="qty-val">
            {cardQuantity}
          </span>
          <button
            className="qty-btn"
            id="qty-plus"
            disabled={cardQuantity >= 2}
            onClick={() => setCardQuantity(2)}
            title="Max 2 Cartelas Allowed"
          >
            +
          </button>
          <span className="max-qty-pill">Max 2</span>
        </div>

        {/* CTA Button Dynamic depending on phase and ticket status */}
        {roundPhase === 'lobby' ? (
          <button
            className={`btn-buy-ticket ${hasTicket ? 'bought' : ''}`}
            id="btn-buy-ticket"
            onClick={buyTicket}
          >
            {hasTicket ? (
              <>
                <i className="fa-solid fa-check"></i>
                <span>{t('bingo.readyBadge', { count: cardQuantity, total: totalCost })}</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-ticket"></i>
                <span>
                  {t('bingo.buyTicket')} &bull; <strong id="total-bet-display">{totalCost} ETB</strong>
                </span>
              </>
            )}
          </button>
        ) : hasTicket ? (
          <button className="btn-buy-ticket bought" disabled>
            <i className="fa-solid fa-gamepad"></i>
            <span>{t('bingo.playingBadge', { count: cardQuantity })}</span>
          </button>
        ) : hasPreBoughtNext ? (
          <button className="btn-buy-ticket prebought" disabled>
            <i className="fa-solid fa-circle-check"></i>
            <span>{t('bingo.preboughtBadge', { total: totalCost })}</span>
          </button>
        ) : (
          <button className="btn-buy-ticket prebuy-active" onClick={preBuyNextRound}>
            <i className="fa-solid fa-ticket"></i>
            <span>{t('bingo.prebuyActive', { total: totalCost })}</span>
          </button>
        )}
      </div>
    </div>
  );
};
