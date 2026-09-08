import React from 'react';

interface LeaveConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const LeaveConfirmModal: React.FC<LeaveConfirmModalProps> = ({
  isOpen,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fresh-victory-modal-backdrop" onClick={onCancel} style={{ zIndex: 9999 }}>
      <div
        className="victory-celebration-card"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '360px',
          padding: '24px 20px',
          textAlign: 'center',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)'
        }}
      >
        <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>
          🚪
        </div>

        <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a', marginBottom: '8px' }}>
          Leave Active Game?
        </h3>

        <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5, marginBottom: '16px' }}>
          The game round is currently in progress. If you leave now, your cartela will <strong>continue playing automatically</strong> on the server.
        </p>

        <div style={{
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          padding: '10px 14px',
          borderRadius: '10px',
          marginBottom: '20px',
          fontSize: '0.8rem',
          color: '#15803d',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          textAlign: 'left'
        }}>
          <i className="fa-solid fa-shield-halved" style={{ fontSize: '1.1rem', flexShrink: 0 }}></i>
          <span>Any winnings will be safely credited directly to your wallet balance!</span>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '11px',
              borderRadius: '10px',
              border: '1.5px solid #e2e8f0',
              background: '#f8fafc',
              color: '#334155',
              fontWeight: 800,
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            Stay & Play
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '11px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.875rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.35)'
            }}
          >
            Yes, Leave
          </button>
        </div>
      </div>
    </div>
  );
};
