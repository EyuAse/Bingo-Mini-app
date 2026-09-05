import React from 'react';
import { useBingo } from '../../context/BingoContext.tsx';
import { useApp } from '../../context/AppContext.tsx';

export const InsufficientBalanceModal: React.FC = () => {
  const {
    showInsufficientBalanceModal,
    setShowInsufficientBalanceModal,
    insufficientBalanceDetails,
    betAmount,
    cardQuantity
  } = useBingo();

  const { switchPage } = useApp();

  if (!showInsufficientBalanceModal) return null;

  const required = insufficientBalanceDetails?.required ?? (betAmount * cardQuantity);
  const balance = insufficientBalanceDetails?.balance ?? 0;
  const shortfall = insufficientBalanceDetails?.shortfall ?? Math.max(0, required - balance);

  const handleGoToDeposit = () => {
    setShowInsufficientBalanceModal(false);
    switchPage('deposit');
  };

  const handleClose = () => {
    setShowInsufficientBalanceModal(false);
  };

  return (
    <div className="fresh-victory-modal-backdrop" onClick={handleClose}>
      <div className="victory-celebration-card" onClick={e => e.stopPropagation()} style={{ borderColor: '#ef4444', maxWidth: '380px' }}>
        {/* Close Button */}
        <button
          type="button"
          className="btn-modal-exit-corner"
          onClick={handleClose}
          title="Close Modal"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        {/* Glow Aura in red/amber */}
        <div
          className="victory-glow-aura"
          style={{ background: 'radial-gradient(circle, rgba(239, 68, 68, 0.35), transparent 70%)' }}
        ></div>

        {/* Warning Icon Graphic */}
        <div style={{ width: '80px', height: '80px', marginTop: '6px', position: 'relative' }}>
          <svg viewBox="0 0 100 100" fill="none" style={{ width: '100%', height: '100%' }}>
            <circle cx="50" cy="50" r="44" fill="#fee2e2" stroke="#ef4444" strokeWidth="4" />
            <path d="M50 24V56" stroke="#b91c1c" strokeWidth="6" strokeLinecap="round" />
            <circle cx="50" cy="72" r="5" fill="#b91c1c" />
          </svg>
        </div>

        {/* Modal Heading */}
        <h2 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#0f172a', margin: '4px 0 0' }}>
          ⚠️ INSUFFICIENT BALANCE
        </h2>
        <p style={{ fontSize: '0.9rem', color: '#b91c1c', fontWeight: '800', margin: '0 0 6px' }}>
          ቀሪ ሂሳብዎ ለዚህ ውርርድ በቂ አይደለም!
        </p>

        {/* Financial Shortfall Breakdown Card */}
        <div
          style={{
            width: '100%',
            background: '#f8fafc',
            border: '1.5px solid #e2e8f0',
            borderRadius: '16px',
            padding: '14px',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <span style={{ color: '#64748b', fontWeight: '600' }}>Required Bet / የሚያስፈልገው:</span>
            <strong style={{ color: '#0f172a', fontWeight: '800' }}>{required.toFixed(2)} ETB</strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <span style={{ color: '#64748b', fontWeight: '600' }}>Your Balance / ያለዎት ሂሳብ:</span>
            <strong style={{ color: '#16a34a', fontWeight: '800' }}>{balance.toFixed(2)} ETB</strong>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.925rem',
              paddingTop: '8px',
              borderTop: '1px dashed #cbd5e1'
            }}
          >
            <span style={{ color: '#dc2626', fontWeight: '800' }}>Shortfall / የጎደለው:</span>
            <strong style={{ color: '#dc2626', fontWeight: '900' }}>-{shortfall.toFixed(2)} ETB</strong>
          </div>
        </div>

        {/* Instant Deposit Fast Gateways */}
        <div
          style={{
            width: '100%',
            background: '#f1f5f9',
            borderRadius: '12px',
            padding: '8px 12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontSize: '0.78rem',
            color: '#475569',
            fontWeight: '700'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚡ Instant Top-Up with:</span>
            <span style={{ background: '#0284c7', color: '#fff', padding: '2px 8px', borderRadius: '6px', fontWeight: '900' }}>
              Telebirr
            </span>
            <span style={{ background: '#7c3aed', color: '#fff', padding: '2px 8px', borderRadius: '6px', fontWeight: '900' }}>
              CBE Birr
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#b45309', background: '#fef3c7', padding: '2px 8px', borderRadius: '6px', fontWeight: '800' }}>
            💡 ዝቅተኛ ተቀማጭ 50 ብር ነው (Min deposit: 50 ETB)
          </div>
        </div>

        {/* Call to Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginTop: '6px' }}>
          <button
            type="button"
            onClick={handleGoToDeposit}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '14px',
              padding: '13px 16px',
              fontSize: '0.95rem',
              fontWeight: '900',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 8px 20px rgba(22, 163, 74, 0.35)',
              transition: 'transform 0.15s ease'
            }}
          >
            <i className="fa-solid fa-wallet"></i>
            <span>DEPOSIT MONEY NOW / አሁኑኑ ገንዘብ ያስገቡ</span>
          </button>

          <button
            type="button"
            onClick={handleClose}
            style={{
              width: '100%',
              background: 'transparent',
              color: '#64748b',
              border: '1.5px solid #cbd5e1',
              borderRadius: '14px',
              padding: '10px 16px',
              fontSize: '0.825rem',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            Watch as Spectator / እንደ ተመልካች ይቀጥሉ
          </button>
        </div>
      </div>
    </div>
  );
};
