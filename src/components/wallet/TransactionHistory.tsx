import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext.tsx';
import { TelebirrLogo, CBELogo } from './PaymentLogos.tsx';

interface TransactionHistoryProps {
  initialTab?: 'deposits' | 'withdrawals';
  onBack?: () => void;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  initialTab = 'deposits',
  onBack
}) => {
  const { transactions } = useAdmin();
  const [activeTab, setActiveTab] = useState<'deposits' | 'withdrawals'>(initialTab);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  // Filter player's own transactions (matching 'usr-me' or default user)
  const myTransactions = (transactions || []).filter(
    tx => tx.userId === 'usr-me' || tx.userName.includes('Me') || tx.userName === 'Player'
  );

  const deposits = myTransactions.filter(tx => tx.type === 'deposit');
  const withdrawals = myTransactions.filter(tx => tx.type === 'withdrawal');

  const activeList = activeTab === 'deposits' ? deposits : withdrawals;

  return (
    <div className="tx-dedicated-view">
      {/* Back button and title */}
      {onBack && (
        <div className="tx-history-top-nav">
          <button type="button" className="btn-back-wallet" onClick={onBack}>
            <i className="fa-solid fa-arrow-left"></i> Back to Wallet
          </button>
          <span className="tx-view-title">
            {activeTab === 'deposits' ? '📥 Deposit History' : '📤 Withdrawal History'}
          </span>
        </div>
      )}

      <div className="tx-history-section" style={{ margin: onBack ? '0 16px 20px' : '16px 16px 20px' }}>
        <div className="tx-history-header">
          <div className="tx-tabs-container">
            <button
              type="button"
              className={`tx-history-tab ${activeTab === 'deposits' ? 'active' : ''}`}
              onClick={() => setActiveTab('deposits')}
            >
              <i className="fa-solid fa-arrow-down" style={{ color: '#4ade80' }}></i>
              <span>Deposits</span>
              <span className="tab-count-pill">{deposits.length}</span>
            </button>

            <button
              type="button"
              className={`tx-history-tab ${activeTab === 'withdrawals' ? 'active' : ''}`}
              onClick={() => setActiveTab('withdrawals')}
            >
              <i className="fa-solid fa-arrow-up" style={{ color: '#f87171' }}></i>
              <span>Withdrawals</span>
              <span className="tab-count-pill">{withdrawals.length}</span>
            </button>
          </div>
        </div>

        <div className="tx-history-list">
          {activeList.length === 0 ? (
            <div className="tx-history-empty">
              <i className="fa-solid fa-receipt empty-icon"></i>
              <p>No {activeTab} records yet</p>
              <span className="empty-sub">Your recent orders and status will appear here in real time.</span>
            </div>
          ) : (
            activeList.map(tx => {
              const isDeposit = tx.type === 'deposit';
              const isPending = tx.status === 'pending';
              const isApproved = tx.status === 'approved';
              const isRejected = tx.status === 'rejected';

              return (
                <div
                  key={tx.id}
                  className={`tx-history-card ${tx.status || 'pending'}`}
                >
                  {/* Top Row: Provider Logo, Reference, Status */}
                  <div className="tx-hist-top">
                    <div className="tx-hist-method">
                      <span className="hist-logo-box">
                        {tx.method === 'Telebirr' ? <TelebirrLogo size={20} /> : <CBELogo size={20} />}
                      </span>
                      <div className="hist-method-text">
                        <strong>{tx.method}</strong>
                        <span className="hist-ref">{tx.referenceNumber}</span>
                      </div>
                    </div>

                    <div className="tx-hist-status">
                      {isPending && (
                        <span className="status-badge pending">
                          <span className="pulsing-amber-dot"></span> Under Verification
                        </span>
                      )}
                      {isApproved && (
                        <span className="status-badge approved">
                          <i className="fa-solid fa-check-circle"></i> {isDeposit ? 'Credited' : 'Settled'}
                        </span>
                      )}
                      {isRejected && (
                        <span className="status-badge rejected">
                          <i className="fa-solid fa-circle-xmark"></i> Rejected
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle Row: Amount and Timestamp */}
                  <div className="tx-hist-body">
                    <div className="tx-hist-date">
                      <i className="fa-regular fa-clock"></i>
                      <span>{tx.createdAt || 'Today'}</span>
                    </div>

                    <div className={`tx-hist-amount ${isDeposit ? 'deposit' : 'withdrawal'}`}>
                      {isDeposit ? '+' : '-'}{(Number(tx.amount) || 0).toFixed(2)} ETB
                    </div>
                  </div>

                  {/* Receipt Image Thumbnail (if attached) */}
                  {tx.receiptImage && (
                    <div className="tx-hist-receipt-row">
                      <span className="receipt-tag">
                        <i className="fa-solid fa-image"></i> Payment Screenshot:
                      </span>
                      <img
                        src={tx.receiptImage}
                        alt="Receipt"
                        className="receipt-mini-thumb"
                        onClick={() => setZoomImage(tx.receiptImage || null)}
                        title="Click to view full receipt"
                      />
                    </div>
                  )}

                  {/* Admin Note / Rejection Reason Callout */}
                  {tx.adminNote && (
                    <div className={`tx-hist-admin-note ${isRejected ? 'rejected-note' : 'approved-note'}`}>
                      <i className={`fa-solid ${isRejected ? 'fa-circle-exclamation' : 'fa-circle-info'}`}></i>
                      <div>
                        <strong>{isRejected ? 'Cashier Rejection Reason:' : 'Cashier Note:'}</strong>
                        <p>{tx.adminNote}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Full-Screen Receipt Image Lightbox Modal */}
      {zoomImage && (
        <div className="custom-modal-backdrop" onClick={() => setZoomImage(null)}>
          <div className="receipt-lightbox-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h4 style={{ color: '#fff', margin: 0, fontSize: '1rem' }}>Attached Receipt</h4>
              <button className="modal-close-btn" onClick={() => setZoomImage(null)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <img
                src={zoomImage}
                alt="Receipt Zoom"
                style={{
                  maxWidth: '100%',
                  maxHeight: '75vh',
                  borderRadius: '8px',
                  objectFit: 'contain'
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
