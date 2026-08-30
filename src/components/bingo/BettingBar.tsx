import React from 'react';
import { useBingo } from '../../context/BingoContext.tsx';
import { useWallet } from '../../context/WalletContext.tsx';

export const BettingBar: React.FC = () => {
  const {
    betAmount,
    setBetAmount,
    cardQuantity,
    setCardQuantity,
    buyTicket,
    preBuyNextRound,
    roundPhase,
    hasTicket,
    hasPreBoughtNext
  } = useBingo();
  const { balance, isBalanceVisible } = useWallet();

  const betChips = [10, 20, 50, 100];
  const totalCost = betAmount * cardQuantity;

  const handleDecrement = () => {
    if (cardQuantity > 1) setCardQuantity(cardQuantity - 1);
  };

  const handleIncrement = () => {
    if (cardQuantity < 2) setCardQuantity(cardQuantity + 1);
  };

  const handleSetMax = () => {
    setCardQuantity(2);
  };

  return (
    <div className="fresh-bingo-bottom-betting-bar">
      {/* Top Row: Header & Wallet Balance */}
      <div className="betting-top-meta-row">
        <div className="betting-section-title">
          <i className="fa-solid fa-coins gold-coin-icon"></i>
          <span>SELECT STAKE AMOUNT</span>
        </div>

        <div className="betting-user-balance-pill">
          <i className="fa-solid fa-wallet"></i>
          <span>Your Balance</span>
          <strong>{isBalanceVisible ? `${balance.toFixed(2)} ETB` : '••••'}</strong>
        </div>
      </div>

      {/* Preset Stake Chips: 10 ETB, 20 ETB, 50 ETB, 100 ETB */}
      <div className="betting-stake-chips-row">
        {betChips.map(chip => (
          <button
            key={chip}
            type="button"
            className={`btn-stake-chip ${betAmount === chip ? 'active' : ''}`}
            onClick={() => setBetAmount(chip)}
          >
            {chip} ETB
          </button>
        ))}
      </div>

      {/* Cartels Stepper & Main Buy CTA Button */}
      <div className="betting-actions-stepper-row">
        {/* Left: Cartels Stepper */}
        <div className="cartels-stepper-group">
          <span className="cartels-label">
            <i className="fa-solid fa-clone gold"></i> CARTELS
          </span>

          <div className="stepper-controls-pill">
            <button
              type="button"
              className="btn-stepper-mini"
              onClick={handleDecrement}
              disabled={cardQuantity <= 1}
            >
              -
            </button>
            <span className="stepper-val">{cardQuantity}</span>
            <button
              type="button"
              className="btn-stepper-mini"
              onClick={handleIncrement}
              disabled={cardQuantity >= 2}
            >
              +
            </button>
          </div>

          <button
            type="button"
            className="btn-max-cartels"
            onClick={handleSetMax}
          >
            MAX 2
          </button>
        </div>

        {/* Right: Big Buy Ticket CTA Button */}
        <button
          type="button"
          className="btn-buy-ticket-huge-gold"
          onClick={roundPhase === 'lobby' ? buyTicket : preBuyNextRound}
        >
          <i className="fa-solid fa-ticket"></i>
          <span>
            {hasTicket
              ? `PLAYING (${totalCost} ETB)`
              : hasPreBoughtNext
              ? 'TICKET READY ✓'
              : `BUY TICKET • ${totalCost} ETB`}
          </span>
        </button>
      </div>
    </div>
  );
};
