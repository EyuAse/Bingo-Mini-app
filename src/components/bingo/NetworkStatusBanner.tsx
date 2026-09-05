import React from 'react';
import { useBingo } from '../../context/BingoContext.tsx';
import { socketService } from '../../services/socketService.ts';

export const NetworkStatusBanner: React.FC = () => {
  const { networkStatus, offlineWinsNotice, dismissOfflineWin } = useBingo();

  const currentOfflineWin = offlineWinsNotice && offlineWinsNotice.length > 0 ? offlineWinsNotice[0] : null;

  return (
    <>
      {/* 1. Offline Disconnect Protection Celebration Modal */}
      {currentOfflineWin && (
        <div className="offline-win-modal-overlay">
          <div className="offline-win-card">
            <div className="offline-win-trophy-ring">
              <i className="fa-solid fa-trophy gold-trophy"></i>
              <span className="offline-shield-badge">
                <i className="fa-solid fa-shield-halved"></i> PROTECTED
              </span>
            </div>

            <h2 className="offline-win-title">YOU WON WHILE AWAY!</h2>
            <p className="offline-win-subtitle">
              የሞባይል ኔትዎርክዎ ቢቋረጥም፣ ሰርቨሩ የቢንጎ አሸናፊነትዎን አረጋግጦ ገንዘቡን ወደ ዋሌትዎ አስገብቷል!
            </p>

            <div className="offline-win-details-box">
              <div className="offline-detail-row">
                <span className="detail-label">Cartela Number</span>
                <strong className="detail-value gold">#{currentOfflineWin.cartelaId}</strong>
              </div>
              <div className="offline-detail-row">
                <span className="detail-label">Winning Amount</span>
                <strong className="detail-value green">+{Number(currentOfflineWin.amount).toFixed(2)} ETB</strong>
              </div>
              <div className="offline-detail-row">
                <span className="detail-label">Round Reference</span>
                <span className="detail-code">{currentOfflineWin.referenceCode || `ROUND #${currentOfflineWin.roundNumber}`}</span>
              </div>
              <div className="offline-detail-row">
                <span className="detail-label">Deposit Status</span>
                <span className="detail-status-pill">
                  <i className="fa-solid fa-circle-check"></i> Credited to Balance
                </span>
              </div>
            </div>

            <button
              type="button"
              className="offline-win-claim-btn"
              onClick={() => dismissOfflineWin(currentOfflineWin.id)}
            >
              <i className="fa-solid fa-wallet"></i>
              <span>COLLECT {Number(currentOfflineWin.amount).toFixed(0)} ETB & CONTINUE</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Reconnecting / Low Network Status Alerts */}
      {networkStatus === 'reconnecting' && (
        <div className="network-status-alert reconnecting">
          <div className="status-alert-left">
            <span className="pulsing-warning-dot"></span>
            <span className="status-alert-text">
              <strong>Reconnecting...</strong> Server Disconnect Protection is ACTIVE. Your ticket is protected.
            </span>
          </div>
          <button
            type="button"
            className="status-retry-action-btn"
            onClick={() => socketService.forceReconnect()}
          >
            <i className="fa-solid fa-rotate-right"></i> Retry
          </button>
        </div>
      )}

      {networkStatus === 'polling' && (
        <div className="network-status-alert polling">
          <div className="status-alert-left">
            <span className="pulse-cyan-dot"></span>
            <span className="status-alert-text">
              <strong>⚡ Low Network Mode:</strong> Dual-Engine HTTP Sync active. Ball calls will not freeze.
            </span>
          </div>
        </div>
      )}
    </>
  );
};

export const NetworkLatencyPill: React.FC = () => {
  const { networkStatus, networkLatency } = useBingo();

  if (networkStatus === 'reconnecting') {
    return (
      <span className="network-latency-pill pill-warning" title="Reconnecting to game server">
        <span className="ping-dot dot-yellow"></span>
        <span>Reconnecting</span>
      </span>
    );
  }

  if (networkStatus === 'polling') {
    return (
      <span className="network-latency-pill pill-cyan" title="HTTP Polling Fallback Active">
        <span className="ping-dot dot-cyan"></span>
        <span>HTTP Sync</span>
      </span>
    );
  }

  return (
    <span
      className={`network-latency-pill ${networkLatency < 150 ? 'pill-good' : networkLatency < 400 ? 'pill-moderate' : 'pill-slow'}`}
      title={`Server Ping: ${networkLatency}ms`}
    >
      <span className="ping-dot dot-green"></span>
      <span>{networkLatency}ms</span>
    </span>
  );
};
