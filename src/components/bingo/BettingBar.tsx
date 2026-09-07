import React, { useState } from 'react';
import { useBingo } from '../../context/BingoContext.tsx';
import { useWallet } from '../../context/WalletContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { useAdmin } from '../../context/AdminContext.tsx';
import { RoomSwitchModal } from './RoomSwitchModal.tsx';

export const BettingBar: React.FC = () => {
  // ── All hooks untouched ────────────────────────────────────
  const {
    betAmount,
    setBetAmount,
    cardQuantity,
    setCardQuantity,
    totalPlayableCards,
    selectedCartelaIds,
    buyTicket,
    roundPhase,
    hasTicket,
    stakeRoomsSummary
  } = useBingo();
  const { balance, bonus, isBalanceVisible } = useWallet();
  const { buy2Get1Bonus } = useAdmin();
  const { t } = useLanguage();

  const [pendingSwitchStake, setPendingSwitchStake] = useState<number | null>(null);

  // ── All logic untouched ────────────────────────────────────
  const betChips = [10, 20, 50, 100];
  const totalCost = betAmount * cardQuantity;
  const hasBonus = cardQuantity >= 2 && buy2Get1Bonus;

  const handleChipClick = (chip: number) => {
    if (chip === betAmount) return;
    if (hasTicket && roundPhase === 'lobby') {
      setPendingSwitchStake(chip);
    } else {
      setBetAmount(chip);
    }
  };

  // ── New UI — Phase 5 ───────────────────────────────────────
  return (
    <div className="new-betting-bar">

      {/* Active Room Switch Confirmation Modal — logic 100% untouched */}
      <RoomSwitchModal
        isOpen={pendingSwitchStake !== null}
        currentStake={betAmount}
        targetStake={pendingSwitchStake || 10}
        totalRefundAmount={betAmount * cardQuantity}
        onConfirm={() => {
          if (pendingSwitchStake !== null) {
            setBetAmount(pendingSwitchStake);
          }
          setPendingSwitchStake(null);
        }}
        onCancel={() => setPendingSwitchStake(null)}
      />

      {/* ── Section 1: Stake Header + Balance ── */}
      <div className="new-betting-section-hdr">
        <div className="new-betting-icon-tile">🪙</div>
        <div className="new-betting-hdr-text">
          <span className="new-betting-hdr-title">Choose Your Stake Amount</span>
          <span className="new-betting-hdr-sub">Higher stakes, bigger prizes!</span>
        </div>
        {/* Balance pill — data untouched */}
        <div style={{ marginLeft: 'auto' }}>
          <div className="betting-user-balance-pill">
            <i className="fa-solid fa-wallet"></i>
            <strong>
              {isBalanceVisible ? `${(balance + bonus).toFixed(0)} ETB` : '••••'}
            </strong>
          </div>
        </div>
      </div>

      {/* ── Section 2: Stake Chip Cards (10 / 20 / 50 / 100 ETB) ── */}
      <div className="new-stake-chips-row">
        {betChips.map(chip => {
          const count = stakeRoomsSummary[chip] || 0;
          const isSelected = betAmount === chip;
          return (
            <button
              key={chip}
              type="button"
              className={`new-stake-chip${isSelected ? ' selected' : ''}`}
              onClick={() => handleChipClick(chip)}
              disabled={roundPhase === 'playing' && hasTicket}
            >
              {/* Gold ✅ badge — visible only on selected chip */}
              {isSelected && (
                <div className="new-chip-check-badge">
                  <i className="fa-solid fa-check"></i>
                </div>
              )}
              <span className="new-chip-coin-emoji">🪙</span>
              <span className="new-chip-amount">{chip} ETB</span>
              <span className="new-chip-player-badge">
                {count >= 2 ? '🟢' : '🟡'} {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Section 3: Assigned + System Assigned Row ── */}
      <div className="new-assigned-row">
        {/* Left: Assigned cartela ID(s) */}
        <div className="new-assigned-cell">
          <div className="new-assigned-icon">
            <i className="fa-solid fa-hashtag"></i>
          </div>
          <div className="new-assigned-text">
            <span className="new-assigned-label">Assigned</span>
            <span className="new-assigned-value">
              #{selectedCartelaIds[0]}
              {cardQuantity >= 2 && ` · #${selectedCartelaIds[1]}`}
              {hasBonus && ` · #${selectedCartelaIds[2]} 🎁`}
            </span>
          </div>
        </div>

        {/* Right: System Assigned */}
        <div className="new-assigned-cell new-system-cell">
          <div className="new-system-left">
            <div className="new-assigned-icon">
              <i className="fa-solid fa-shield-halved"></i>
            </div>
            <span className="new-system-label">System Assigned</span>
          </div>
          <i className="fa-solid fa-chevron-right new-system-chevron"></i>
        </div>
      </div>

      {/* ── Section 4: Cartelas Section Header ── */}
      <div className="new-cartelas-section-hdr">
        <div className="new-cartelas-tile">🎴</div>
        <div className="new-cartelas-hdr-text">
          <span className="new-cartelas-hdr-title">Cartelas</span>
          <span className="new-cartelas-hdr-sub">
            Choose how many cards you want to play with
          </span>
        </div>
      </div>

      {/* ── Section 5: Stepper + 2+1 FREE button ── */}
      <div className="new-stepper-row">
        <div className="new-stepper-controls">
          {/* Decrement — setCardQuantity logic untouched */}
          <button
            type="button"
            className="btn-stepper-purple"
            onClick={() => setCardQuantity(cardQuantity - 1)}
            disabled={cardQuantity <= 1 || hasTicket}
          >
            −
          </button>
          <span className="new-stepper-count">{cardQuantity}</span>
          {/* Increment — setCardQuantity logic untouched */}
          <button
            type="button"
            className="btn-stepper-purple"
            onClick={() => setCardQuantity(cardQuantity + 1)}
            disabled={cardQuantity >= 2 || hasTicket}
          >
            +
          </button>
        </div>

        {/* 🎁 2 + 1 FREE — same condition as original btn-max-cartels */}
        {!hasTicket && cardQuantity < 2 && buy2Get1Bonus && (
          <button
            type="button"
            className="btn-2plus1-free"
            onClick={() => setCardQuantity(2)}
          >
            🎁 2 + 1 FREE
          </button>
        )}
      </div>

      {/* Buy 2 Get 1 FREE promo info strip */}
      {hasBonus && !hasTicket && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'linear-gradient(135deg, #fefce8, #fef9c3)',
          border: '1px solid rgba(234,179,8,0.3)',
          borderRadius: '10px',
          padding: '7px 12px',
          fontSize: '0.625rem',
          fontWeight: 800,
          color: '#854d0e',
        }}>
          <span>🎁</span>
          <span>
            <strong>BUY 2 GET 1 FREE!</strong> You get 3 Cartelas for the price of 2!
          </span>
        </div>
      )}

      {/* ── Section 6: Buy Ticket / Playing CTA button ── */}
      <button
        type="button"
        className="btn-buy-ticket-new"
        onClick={hasTicket ? undefined : buyTicket}
        disabled={hasTicket}
      >
        {hasTicket ? (
          <>
            <i className="fa-solid fa-circle-check"></i>
            <span>PLAYING {totalPlayableCards} CARDS</span>
          </>
        ) : (
          <>
            <i className="fa-solid fa-ticket"></i>
            <span>{t('bingo.buyTicket')} · {totalCost} ETB</span>
          </>
        )}
      </button>

    </div>
  );
};
