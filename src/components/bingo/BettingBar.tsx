import React, { useState } from 'react';
import { useBingo } from '../../context/BingoContext.tsx';
import { useWallet } from '../../context/WalletContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { useAdmin } from '../../context/AdminContext.tsx';
import { RoomSwitchModal } from './RoomSwitchModal.tsx';

export const BettingBar: React.FC = () => {
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

  return (
    <div className="fresh-bingo-bottom-betting-bar">
      {/* Active Room Switch Confirmation Modal */}
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

      {/* Active Room Indicator Badge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '4px 10px',
        backgroundColor: 'rgba(234, 179, 8, 0.1)',
        border: '1px solid rgba(234, 179, 8, 0.25)',
        borderRadius: '6px',
        fontSize: '0.75rem',
        color: '#854d0e',
        marginBottom: '6px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <i className="fa-solid fa-door-open" style={{ color: '#ca8a04' }}></i>
          <span>Active Arena: <strong>{betAmount} ETB Room</strong></span>
        </div>
        <span style={{ fontWeight: 700, color: (stakeRoomsSummary[betAmount] || 0) >= 2 ? '#16a34a' : '#ca8a04' }}>
          {(stakeRoomsSummary[betAmount] || 0) >= 2 ? '⚡ Active Match' : '⏳ Waiting'} ({stakeRoomsSummary[betAmount] || 0} players)
        </span>
      </div>

      {/* Stake Chips: 10, 20, 50, 100 Birr */}
      <div className="betting-stake-chips-row">
        {betChips.map(chip => {
          const count = stakeRoomsSummary[chip] || 0;
          return (
            <button
              key={chip}
              type="button"
              className={`btn-stake-chip ${betAmount === chip ? 'active' : ''}`}
              onClick={() => handleChipClick(chip)}
              disabled={roundPhase === 'playing' && hasTicket}
            >
              <span className="chip-stake-val">{chip} ETB</span>
              <span className={`chip-player-count-badge ${count >= 2 ? 'ready' : 'empty'}`}>
                {count >= 2 ? '🟢' : '🟡'} {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* System-Assigned Cartelas Info Row (No manual handpick per client rule) */}
      <div className="betting-cartela-pool-meta-row">
        <div className="cartela-assigned-badges">
          <span className="cartela-badge-label">Assigned:</span>
          <span className="cartela-id-pill">#{selectedCartelaIds[0]}</span>
          {cardQuantity >= 2 && (
            <span className="cartela-id-pill">#{selectedCartelaIds[1]}</span>
          )}
          {hasBonus && (
            <span className="cartela-id-pill bonus-pill">#{selectedCartelaIds[2]} (FREE 🎁)</span>
          )}
        </div>

        <div className="system-assigned-auto-badge" title="Cartelas are securely auto-assigned by the system">
          <i className="fa-solid fa-dice" style={{ color: '#ca8a04', marginRight: 4 }}></i>
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#854d0e' }}>System Assigned</span>
        </div>
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
