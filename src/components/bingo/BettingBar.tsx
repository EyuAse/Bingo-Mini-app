import React, { useState } from 'react';
import { useBingo } from '../../context/BingoContext.tsx';
import { useWallet } from '../../context/WalletContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { RoomSwitchModal } from './RoomSwitchModal.tsx';
import { StakeRoomSelectorModal } from '../games/StakeRoomSelectorModal.tsx';

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
    openCartelaPicker,
    hasSelectedCartelas
  } = useBingo();
  const { balance, bonus, isBalanceVisible } = useWallet();
  const { t } = useLanguage();

  const [showStakeModal, setShowStakeModal] = useState<boolean>(false);
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

  const totalCost = betAmount * cardQuantity;

  return (
    <div className="compact-betting-bar">

      {/* Stake Room Selector Modal for switching rooms inside lobby */}
      <StakeRoomSelectorModal
        isOpen={showStakeModal}
        onClose={() => setShowStakeModal(false)}
        onSelectStake={(stake) => {
          setBetAmount(stake);
          setShowStakeModal(false);
        }}
      />

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
        /* ── Ultra-Compact Single-Row Lobby Buy Bar (~46px) ── */
        <div className="compact-lobby-buy-bar">
          <div className="compact-lobby-left-controls">
            {/* 1. Stepper for 1 or 2 cartelas */}
            <div className="compact-lobby-stepper" title="Choose 1 or 2 cartelas">
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

            {/* 2. Pick cards button */}
            <button
              type="button"
              className="btn-compact-pick-cards"
              onClick={openCartelaPicker}
              title="Pick your cartela numbers (from 400 cards)"
            >
              <i className="fa-solid fa-hand-pointer"></i>
              <span>
                {hasSelectedCartelas && selectedCartelaIds.length > 0
                  ? `Cards #${selectedCartelaIds.slice(0, cardQuantity).join(', #')}`
                  : 'Pick Cards 🎟️'}
              </span>
            </button>

            {/* 3. Active Stake Room Pill / Switcher */}
            <button
              type="button"
              className="btn-compact-stake-pill"
              onClick={() => setShowStakeModal(true)}
              title="Change stake room (10, 20, 50, 100 ETB)"
            >
              <span>🪙 {betAmount} ETB</span>
              <i className="fa-solid fa-chevron-down mini-arrow"></i>
            </button>
          </div>

          {/* 4. Primary CTA: Buy Ticket Button */}
          <button
            type="button"
            className="btn-compact-buy-cta"
            onClick={hasTicket ? undefined : (!hasSelectedCartelas ? openCartelaPicker : buyTicket)}
            disabled={hasTicket}
          >
            <i className={hasSelectedCartelas ? "fa-solid fa-ticket" : "fa-solid fa-hand-pointer"}></i>
            <span>
              {!hasSelectedCartelas
                ? `SELECT CARDS (${totalCost} ETB)`
                : `${t('bingo.buyTicket')} · ${totalCost} ETB`}
            </span>
          </button>
        </div>
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
