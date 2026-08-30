import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext.tsx';
import { useApp } from '../../context/AppContext.tsx';
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
  const { showToast } = useApp();
  const [activeTab, setActiveTab] = useState<'deposits' | 'withdrawals'>(initialTab);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  // Filter player's own transactions (matching 'usr-me' or default user)
  const myTransactions = (transactions || []).filter(
    tx => tx.userId === 'usr-me' || tx.userName.includes('Me') || tx.userName === 'Player'
  );

  const deposits = myTransactions.filter(tx => tx.type === 'deposit');
  const withdrawals = myTransactions.filter(tx => tx.type === 'withdrawal');

  const activeList = activeTab === 'deposits' ? deposits : withdrawals;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`📋 Copied ${label}: ${text}`);
  };

  return (
    <div className="fresh-tx-history-container">
      {/* 1. Top Navigation Bar */}
      <div className="tx-history-top-navbar">
        {onBack && (
          <button type="button" className="btn-tx-back" onClick={onBack}>
            <i className="fa-solid fa-arrow-left"></i>
            <span>Back to Wallet</span>
          </button>
        )}
        <h2 className="tx-page-title">
          {activeTab === 'deposits' ? 'Deposit History' : 'Withdrawal History'}
        </h2>
      </div>

      {/* 2. Modern 2-Tab Switcher Bar */}
      <div className="tx-segmented-tabs-bar">
        <button
          type="button"
          className={`tx-segment-tab ${activeTab === 'deposits' ? 'active green' : ''}`}
          onClick={() => setActiveTab('deposits')}
        >
          <i className="fa-solid fa-arrow-down"></i>
          <span>Deposits</span>
          <span className="tx-count-pill">{deposits.length}</span>
        </button>

        <button
          type="button"
          className={`tx-segment-tab ${activeTab === 'withdrawals' ? 'active red' : ''}`}
          onClick={() => setActiveTab('withdrawals')}
        >
          <i className="fa-solid fa-arrow-up"></i>
          <span>Withdrawals</span>
          <span className="tx-count-pill">{withdrawals.length}</span>
        </button>
      </div>

      {/* 3. Transaction Cards List */}
      <div className="tx-history-cards-list">
        {activeList.length === 0 ? (
          <div className="tx-history-empty-card">
            <div className="empty-icon-circle">
              <i className="fa-solid fa-receipt"></i>
            </div>
            <h3 className="empty-title">No {activeTab} yet</h3>
            <p className="empty-subtext">
              Your {activeTab} transactions and live settlement status will appear here in real time.
            </p>
          </div>
        ) : (
          activeList.map(tx => {
            const isDeposit = tx.type === 'deposit';
            const isPending = tx.status === 'pending';
            const isApproved = tx.status === 'approved';
            const isRejected = tx.status === 'rejected';

            return (
              <div key={tx.id} className={`fresh-tx-card status-${tx.status || 'pending'}`}>
                {/* Header Row: Provider Logo & Live Status Pill */}
                <div className="tx-card-header-row">
                  <div className="tx-provider-group">
                    <div className="tx-provider-logo-box">
                      {tx.method === 'Telebirr' ? <TelebirrLogo size={24} /> : <CBELogo size={24} />}
                    </div>
                    <div className="tx-provider-meta">
                      <strong className="tx-provider-name">{tx.method}</strong>
                      <span className="tx-type-lbl">{isDeposit ? 'Deposit' : 'Withdrawal'}</span>
                    </div>
                  </div>

                  <div className="tx-status-badge-wrap">
                    {isPending && (
                      <span className="status-pill pending">
                        <span className="pulse-dot"></span>
                        <span>In Review</span>
                      </span>
                    )}
                    {isApproved && (
                      <span className="status-pill approved">
                        <i className="fa-solid fa-circle-check"></i>
                        <span>{isDeposit ? 'Verified' : 'Settled'}</span>
                      </span>
                    )}
                    {isRejected && (
                      <span className="status-pill rejected">
                        <i className="fa-solid fa-circle-xmark"></i>
                        <span>Rejected</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Amount & Time Row */}
                <div className="tx-card-body-row">
                  <div className="tx-time-ref-col">
                    <div className="tx-ref-row">
                      <span className="tx-ref-txt">{tx.referenceNumber}</span>
                      <button
                        type="button"
                        className="btn-copy-ref-mini"
                        onClick={() => handleCopy(tx.referenceNumber, 'TX Reference')}
                        title="Copy Reference"
                      >
                        <i className="fa-regular fa-copy"></i>
                      </button>
                    </div>
                    <div className="tx-timestamp">
                      <i className="fa-regular fa-clock"></i>
                      <span>{tx.createdAt || 'Today, 11:33 PM'}</span>
                    </div>
                  </div>

                  <div className={`tx-amount-huge ${isDeposit ? 'deposit' : 'withdrawal'}`}>
                    {isDeposit ? '+' : '-'}{(Number(tx.amount) || 0).toFixed(2)} ETB
                  </div>
                </div>

                {/* Attached Screenshot (if any) */}
                {tx.receiptImage && (
                  <div className="tx-receipt-thumbnail-row">
                    <span className="receipt-tag-label">
                      <i className="fa-solid fa-image"></i> Payment Screenshot
                    </span>
                    <img
                      src={tx.receiptImage}
                      alt="Receipt Thumbnail"
                      className="tx-receipt-thumb"
                      onClick={() => setZoomImage(tx.receiptImage || null)}
                      title="Click to view screenshot"
                    />
                  </div>
                )}

                {/* Cashier Note (Admin message on Approval or Rejection) */}
                {tx.adminNote && (
                  <div className={`tx-cashier-note-box ${isRejected ? 'note-rejected' : 'note-approved'}`}>
                    <i className={`fa-solid ${isRejected ? 'fa-circle-exclamation' : 'fa-circle-info'} note-icon`}></i>
                    <div className="note-text-group">
                      <strong className="note-title">
                        {isRejected ? 'Cashier Rejection Reason:' : 'Cashier Note:'}
                      </strong>
                      <p className="note-message">{tx.adminNote}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Full-Screen Receipt Lightbox Modal */}
      {zoomImage && (
        <div className="custom-modal-backdrop" onClick={() => setZoomImage(null)}>
          <div className="receipt-lightbox-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header-fresh">
              <h4>Attached Screenshot</h4>
              <button
                type="button"
                className="btn-close-modal-round"
                onClick={() => setZoomImage(null)}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="lightbox-img-wrap">
              <img src={zoomImage} alt="Full Receipt" className="lightbox-full-img" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
