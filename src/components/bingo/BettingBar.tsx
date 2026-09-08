import React, { useState } from 'react';
import { useBingo } from '../../context/BingoContext.tsx';
import { useWallet } from '../../context/WalletContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
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
  const { t } = useLanguage();

  const [pendingSwitchStake, setPendingSwitchStake] = useState<number | null>(null);

  // ── All logic untouched ────────────────────────────────────
  const betChips = [10, 20, 50, 100];
  const totalCost = betAmount * cardQuantity;

  const handleChipClick = (chip: number) => {
    if (chip === betAmount) return;
    if (hasTicket && roundPhase === 'lobby') {
      setPendingSwitchStake(chip);
    } else {
      setBetAmount(chip);
    }
  };

  return (
    <div className="compact-betting-bar">

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

      {/* ── Row 1: Header + Balance ── */}
      <div className="compact-betting-hdr">
        <div className="compact-betting-hdr-left">
          <div className="compact-hdr-icon">🪙</div>
          <div className="compact-hdr-text">
            <span className="compact-hdr-title">Stake Amount</span>
            <span className="compact-hdr-sub">Bigger stakes, bigger prizes!</span>
          </div>
        </div>

        {/* Balance pill */}
        <div className="compact-balance-pill">
          <i className="fa-solid fa-wallet"></i>
          <strong>
            {isBalanceVisible ? `${(balance + bonus).toFixed(0)} ETB` : '••••'}
          </strong>
        </div>
      </div>

      {/* ── Row 2: Sleek Low-Profile Stake Chips (10, 20, 50, 100 ETB) ── */}
      <div className="compact-stake-chips-row">
        {betChips.map(chip => {
          const count = stakeRoomsSummary[chip] || 0;
          const isSelected = betAmount === chip;
          return (
            <button
              key={chip}
              type="button"
              className={`compact-stake-chip${isSelected ? ' selected' : ''}`}
              onClick={() => handleChipClick(chip)}
              disabled={roundPhase === 'playing' && hasTicket}
            >
              {isSelected && (
                <span className="compact-chip-check">✓</span>
              )}
              <span className="compact-chip-coin">🪙</span>
              <span className="compact-chip-amount">{chip} ETB</span>
              <span className="compact-chip-player-dot" title={`${count} players`}>
                {count >= 2 ? '🟢' : '🟡'} {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Row 3: Compact Assigned & System Row ── */}
      <div className="compact-assigned-row">
        <div className="compact-assigned-left">
          <span className="compact-assigned-tag">#</span>
          <span className="compact-assigned-lbl">Assigned:</span>
          <span className="compact-assigned-val">
            #{selectedCartelaIds[0]}
            {cardQuantity >= 2 && ` · #${selectedCartelaIds[1]}`}
          </span>
        </div>

        <div className="compact-assigned-right">
          <i className="fa-solid fa-shield-halved"></i>
          <span>System Assigned</span>
          <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.6rem', opacity: 0.6 }}></i>
        </div>
      </div>

      {/* ── Row 4: Inline Cartelas Stepper + 2+1 FREE promo ── */}
      <div className="compact-stepper-row">
        <div className="compact-stepper-left">
          <span className="compact-cartelas-icon">🎴</span>
          <span className="compact-cartelas-label">Cartelas:</span>

          <div className="compact-stepper-ctrls">
            <button
              type="button"
              className="btn-stepper-mini"
              onClick={() => setCardQuantity(cardQuantity - 1)}
              disabled={cardQuantity <= 1 || hasTicket}
            >
              −
            </button>
            <span className="compact-stepper-num">{cardQuantity}</span>
            <button
              type="button"
              className="btn-stepper-mini"
              onClick={() => setCardQuantity(cardQuantity + 1)}
              disabled={cardQuantity >= 2 || hasTicket}
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* ── Row 5: Sleek Full-Width Buy Ticket Button ── */}
      <button
        type="button"
        className="btn-buy-ticket-compact"
        onClick={hasTicket ? undefined : buyTicket}
        disabled={hasTicket}
      >
        {hasTicket ? (
          <>
            <i className="fa-solid fa-circle-check"></i>
            <span>PLAYING {cardQuantity} {cardQuantity === 1 ? 'CARD' : 'CARDS'}</span>
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
