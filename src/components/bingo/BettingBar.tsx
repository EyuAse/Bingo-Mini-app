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
    cancelLobbyTicket,
    roundPhase,
    waitingForPlayers,
    realPlayerCount,
    lobbyCountdown,
    hasTicket,
    stakeRoomsSummary,
    shuffleCartela,
    shuffleAllCartelas,
    openCartelaPicker
  } = useBingo();
  const { balance, bonus, isBalanceVisible } = useWallet();
  const { t } = useLanguage();

  const [pendingSwitchStake, setPendingSwitchStake] = useState<number | null>(null);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  const handleConfirmCancel = async () => {
    setIsCancelling(true);
    try {
      await cancelLobbyTicket();
    } finally {
      setIsCancelling(false);
      setShowCancelModal(false);
    }
  };

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

      {/* ── When Bet Placed in Lobby: Ultra-Compact Placed Status & Cancel Refund CTA ── */}
      {hasTicket && (roundPhase === 'lobby' || waitingForPlayers) ? (
        <div className="lobby-placed-bet-container">
          <div className="lobby-placed-status-pill">
            <i className={waitingForPlayers ? 'fa-solid fa-hourglass-half waiting-pulse-icon' : 'fa-solid fa-circle-check'}></i>
            <div className="lobby-placed-text-group">
              <span className="lobby-placed-text">
                BET PLACED · {cardQuantity} {cardQuantity === 1 ? 'CARD' : 'CARDS'} ({totalCost} ETB)
              </span>
              <span className="lobby-matchmaking-hint">
                {waitingForPlayers
                  ? '🟡 Waiting for 1 more player to join (1/2) · Starts at 2 players'
                  : `🟢 Ready! Game starts in ${lobbyCountdown}s (${realPlayerCount || 2} Players)`}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="btn-lobby-cancel-action"
            onClick={() => setShowCancelModal(true)}
            title="Cancel your bet and get an immediate refund"
          >
            <i className="fa-solid fa-ban"></i>
            <span>CANCEL BET</span>
          </button>
        </div>
      ) : (
        <>
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

          {/* ── Row 3: Interactive Selected Cartela & Pick Action ── */}
          <div className="compact-assigned-row">
            <div
              className="compact-assigned-left"
              onClick={openCartelaPicker}
              style={{ cursor: 'pointer' }}
              title="Click to choose cartela numbers"
            >
              <span className="compact-assigned-tag">🎟️</span>
              <span className="compact-assigned-lbl">Selected:</span>
              <span className="compact-assigned-val">
                #{selectedCartelaIds[0]}
                {cardQuantity >= 2 && ` · #${selectedCartelaIds[1]}`}
              </span>
            </div>

            <button
              type="button"
              className="compact-change-cartela-btn"
              onClick={openCartelaPicker}
              title="Pick your favorite Cartelas from 400 numbers"
            >
              <i className="fa-solid fa-hand-pointer"></i>
              <span>Pick Cards 🎟️</span>
            </button>
          </div>

          {/* ── Row 4: Inline Cartelas Stepper ── */}
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

          {/* ── Row 5: Compact Full-Width Buy Ticket CTA Button ── */}
          <button
            type="button"
            className="btn-buy-ticket-compact"
            onClick={hasTicket ? undefined : buyTicket}
            disabled={hasTicket}
          >
            <i className="fa-solid fa-ticket"></i>
            <span>{t('bingo.buyTicket')} · {totalCost} ETB</span>
          </button>
        </>
      )}

      {/* ── Safe In-Lobby Cancel Bet Confirmation Modal ── */}
      {showCancelModal && (
        <div className="bingo-cancel-modal-overlay" onClick={() => !isCancelling && setShowCancelModal(false)}>
          <div className="bingo-cancel-modal-card" onClick={e => e.stopPropagation()}>
            <div className="cancel-modal-icon-wrap">
              <div className="cancel-modal-icon">
                <i className="fa-solid fa-arrow-rotate-left"></i>
              </div>
            </div>

            <h3 className="cancel-modal-title">Cancel Bet & Refund?</h3>
            <p className="cancel-modal-desc">
              Would you like to cancel your bet and immediately refund <strong>{totalCost} ETB</strong> back to your wallet?
            </p>

            <div className="cancel-modal-cartelas-preview">
              <span className="preview-lbl">Cartelas to release:</span>
              <span className="preview-val">#{selectedCartelaIds.slice(0, cardQuantity).join(' · #')}</span>
            </div>

            <div className="cancel-modal-actions">
              <button
                type="button"
                className="btn-cancel-modal-keep"
                onClick={() => setShowCancelModal(false)}
                disabled={isCancelling}
              >
                Keep Bet
              </button>
              <button
                type="button"
                className="btn-cancel-modal-confirm"
                onClick={handleConfirmCancel}
                disabled={isCancelling}
              >
                {isCancelling ? 'Refunding...' : `Yes, Cancel & Refund (${totalCost} ETB)`}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
