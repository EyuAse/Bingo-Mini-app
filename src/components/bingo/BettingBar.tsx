import React from 'react';
import { useBingo } from '../../context/BingoContext.tsx';
import { useWallet } from '../../context/WalletContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { useAdmin } from '../../context/AdminContext.tsx';

export const BettingBar: React.FC = () => {
  const {
    betAmount,
    setBetAmount,
    cardQuantity,
    setCardQuantity,
    totalPlayableCards,
    selectedCartelaIds,
    openCartelaPicker,
    buyTicket,
    preBuyNextRound,
    roundPhase,
    hasTicket,
    hasPreBoughtNext
  } = useBingo();
  const { balance, bonus, isBalanceVisible } = useWallet();
  const { buy2Get1Bonus } = useAdmin();
  const { t } = useLanguage();

  const betChips = [10, 20, 50, 100];
  const totalCost = betAmount * cardQuantity;
  const canBuy = roundPhase === 'lobby' || roundPhase === 'playing';
  const hasBonus = cardQuantity >= 2 && buy2Get1Bonus;

  return (
    <div className="fresh-bingo-bottom-betting-bar">
      {/* Top Header: Select Stake & Balance */}
      <div className="betting-top-meta-row">
        <div className="betting-section-title">
          <i className="fa-solid fa-coins gold-coin-icon"></i>
          <span>{t('bingo.selectStake')} (Birr)</span>
        </div>
        <div className="betting-user-balance-pill">
          <i className="fa-solid fa-wallet"></i>
          <span>{t('common.balance')}</span>
          <strong>{isBalanceVisible ? `${(balance + bonus).toFixed(0)} ETB` : '••••'}</strong>
        </div>
      </div>

      {/* Stake Chips: 10, 20, 50, 100 Birr */}
      <div className="betting-stake-chips-row">
        {betChips.map(chip => (
          <button
            key={chip}
            type="button"
            className={`btn-stake-chip ${betAmount === chip ? 'active' : ''}`}
            onClick={() => setBetAmount(chip)}
            disabled={hasTicket}
          >
            {chip} ETB
          </button>
        ))}
      </div>

      {/* Cartelas Selection & 400 Pool Info */}
      <div className="betting-cartela-pool-meta-row">
        <div className="cartela-assigned-badges">
          <span className="cartela-badge-label">Cartelas:</span>
          <span className="cartela-id-pill">#{selectedCartelaIds[0]}</span>
          {cardQuantity >= 2 && (
            <span className="cartela-id-pill">#{selectedCartelaIds[1]}</span>
          )}
          {hasBonus && (
            <span className="cartela-id-pill bonus-pill">#{selectedCartelaIds[2]} (FREE 🎁)</span>
          )}
        </div>

        <button
          type="button"
          className="btn-open-400-picker"
          onClick={openCartelaPicker}
          disabled={hasTicket}
          title="Pick favorite Cartela numbers from 1 to 400"
        >
          <i className="fa-solid fa-table-cells-large"></i>
          <span>400 Pool</span>
        </button>
      </div>

      {/* Buy 2 Get 1 FREE Bonus Highlight Banner */}
      {hasBonus && !hasTicket && (
        <div className="betting-bonus-promo-bar">
          <i className="fa-solid fa-gift gold"></i>
          <span><strong>BUY 2 GET 1 FREE!</strong> You get 3 Cartelas for the price of 2!</span>
        </div>
      )}

      {/* Cartels Stepper & Main Buy Action Button */}
      <div className="betting-actions-stepper-row">
        {/* Stepper (1 or 2 cards) */}
        <div className="cartels-stepper-group">
          <span className="cartels-label">
            <i className="fa-solid fa-clone gold"></i>
            {t('bingo.cartels')}
          </span>
          <div className="stepper-controls-pill">
            <button
              type="button"
              className="btn-stepper-mini"
              onClick={() => setCardQuantity(cardQuantity - 1)}
              disabled={cardQuantity <= 1 || hasTicket}
            >
              −
            </button>
            <span className="stepper-val">{cardQuantity}</span>
            <button
              type="button"
              className="btn-stepper-mini"
              onClick={() => setCardQuantity(cardQuantity + 1)}
              disabled={cardQuantity >= 2 || hasTicket}
            >
              +
            </button>
          </div>
          {!hasTicket && cardQuantity < 2 && (
            <button
              type="button"
              className="btn-max-cartels"
              onClick={() => setCardQuantity(2)}
            >
              2 + 1 FREE
            </button>
          )}
        </div>

        {/* Buy / Playing CTA */}
        <button
          type="button"
          className="btn-buy-ticket-huge-gold"
          onClick={hasTicket ? undefined : buyTicket}
          disabled={hasTicket}
        >
          <i className="fa-solid fa-ticket"></i>
          <span>
            {hasTicket
              ? `PLAYING ${totalPlayableCards} CARDS`
              : `${t('bingo.buyTicket')} • ${totalCost} ETB`}
          </span>
        </button>
      </div>
    </div>
  );
};
