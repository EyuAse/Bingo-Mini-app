import React from 'react';

interface RoomSwitchModalProps {
  isOpen: boolean;
  currentStake: number;
  targetStake: number;
  totalRefundAmount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export const RoomSwitchModal: React.FC<RoomSwitchModalProps> = ({
  isOpen,
  currentStake,
  targetStake,
  totalRefundAmount,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  const cardQuantity = Math.max(1, Math.round(totalRefundAmount / (currentStake || 10)));
  const isDowngrade = targetStake < currentStake;
  const stakeDiff = Math.abs(currentStake - targetStake) * cardQuantity;

  return (
    <div className="fresh-victory-modal-backdrop" onClick={onCancel} style={{ zIndex: 9999 }}>
      <div
        className="victory-celebration-card"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '380px', padding: '24px 20px', textAlign: 'center' }}
      >
        <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>
          🔄
        </div>

        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
          Switch to {targetStake} ETB Room?
        </h3>

        <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.5, marginBottom: '16px' }}>
          You have an active ticket in the <strong>{currentStake} ETB Room</strong>.
          Your ticket will seamlessly transfer to the <strong>{targetStake} ETB Room</strong> so you stay ready for the game!
        </p>

        <div style={{
          backgroundColor: '#f1f5f9',
          padding: '12px',
          borderRadius: '10px',
          marginBottom: '20px',
          fontSize: '0.8125rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ color: '#64748b' }}>
            {isDowngrade ? 'Wallet Refund (Difference):' : 'Stake Difference:'}
          </span>
          <strong style={{ color: isDowngrade ? '#16a34a' : '#2563eb', fontSize: '1rem' }}>
            {isDowngrade ? `+${stakeDiff.toFixed(2)} ETB` : `-${stakeDiff.toFixed(2)} ETB`}
          </strong>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            type="button"
            className="btn-victory-claim-gold"
            onClick={onConfirm}
            style={{ width: '100%', padding: '12px' }}
          >
            <i className="fa-solid fa-arrow-right-arrow-left"></i>
            <span>Confirm & Transfer to {targetStake} ETB</span>
          </button>

          <button
            type="button"
            onClick={onCancel}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: 'transparent',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              color: '#64748b',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            Stay in {currentStake} ETB Room
          </button>
        </div>
      </div>
    </div>
  );
};
