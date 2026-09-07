import React from 'react';
import { useAuth } from '../../context/AuthContext';

export const ConcurrentSessionModal: React.FC = () => {
  const { concurrentSessionNotice, dismissConcurrentSessionNotice } = useAuth();

  if (!concurrentSessionNotice) return null;

  const handleUseOnThisDevice = () => {
    // Dismiss notice and reload window so this device reconnects as the authoritative device
    dismissConcurrentSessionNotice();
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <div
      className="fresh-victory-modal-backdrop"
      style={{
        zIndex: 99999,
        backgroundColor: 'rgba(15, 23, 42, 0.82)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        className="victory-celebration-card"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '400px',
          width: '100%',
          padding: '28px 24px',
          textAlign: 'center',
          borderRadius: '20px',
          background: '#ffffff',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          border: '1px solid #f1f5f9'
        }}
      >
        {/* Security Alert Icon */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#fef2f2',
            border: '2px solid #fecaca',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            fontSize: '1.75rem',
            color: '#dc2626'
          }}
        >
          <i className="fa-solid fa-shield-halved"></i>
        </div>

        <h3
          style={{
            fontSize: '1.25rem',
            fontWeight: 800,
            color: '#0f172a',
            marginBottom: '8px',
            letterSpacing: '-0.02em'
          }}
        >
          Account Active on Another Device
        </h3>

        <p
          style={{
            fontSize: '0.875rem',
            color: '#475569',
            lineHeight: 1.55,
            marginBottom: '20px'
          }}
        >
          You have been logged out because your account was accessed from another phone or browser.
          <br /><br />
          <strong style={{ color: '#0f172a' }}>
            Lomi Bingo strictly prohibits simultaneous logins on multiple devices for game fairness and wallet security.
          </strong>
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            type="button"
            className="btn-victory-claim-gold"
            onClick={handleUseOnThisDevice}
            style={{
              width: '100%',
              padding: '12px 16px',
              fontWeight: 700,
              fontSize: '0.9375rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <i className="fa-solid fa-mobile-screen"></i>
            <span>Use on This Device</span>
          </button>

          <button
            type="button"
            onClick={dismissConcurrentSessionNotice}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: 'transparent',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              color: '#64748b',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            Close & Log Out
          </button>
        </div>
      </div>
    </div>
  );
};
