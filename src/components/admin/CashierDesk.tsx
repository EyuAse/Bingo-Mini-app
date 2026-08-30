import React, { useState } from 'react';
import { useAdmin, TransactionRequest } from '../../context/AdminContext.tsx';
import { useApp } from '../../context/AppContext.tsx';
import { TelebirrLogo, CBELogo } from '../wallet/PaymentLogos.tsx';

type FilterType = 'pending' | 'pending_deposits' | 'pending_withdrawals' | 'all' | 'approved' | 'rejected';

export const CashierDesk: React.FC = () => {
  const {
    transactions,
    approveAndReleaseTransaction,
    rejectTransaction,
    addDepositRequest,
    addWithdrawRequest,
    users
  } = useAdmin();

  const { showToast } = useApp();

  // Default to 'pending' to prioritize actionable orders
  const [activeFilter, setActiveFilter] = useState<FilterType>('pending');
  const [methodFilter, setMethodFilter] = useState<'all' | 'Telebirr' | 'CBE'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected TX for Inspection Modal & Zoom Modal
  const [inspectTx, setInspectTx] = useState<TransactionRequest | null>(null);
  const [rejectTargetTx, setRejectTargetTx] = useState<TransactionRequest | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('Invalid SMS Reference Code (Not found in Telebirr)');
  const [customRejectNote, setCustomRejectNote] = useState<string>('');
  const [adminNoteInput, setAdminNoteInput] = useState('');
  const [zoomReceiptImg, setZoomReceiptImg] = useState<string | null>(null);

  // Manual Transaction Modal
  const [showManualTxModal, setShowManualTxModal] = useState(false);
  const [manualType, setManualType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [manualUser, setManualUser] = useState(users[0]?.id || '');
  const [manualAmount, setManualAmount] = useState('500');
  const [manualMethod, setManualMethod] = useState<'Telebirr' | 'CBE'>('Telebirr');
  const [manualAccount, setManualAccount] = useState('0911234567');

  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  const pendingDepositsCount = safeTransactions.filter(
    t => (t.type || 'deposit') === 'deposit' && (t.status || 'pending') === 'pending'
  ).length;

  const pendingWithdrawalsCount = safeTransactions.filter(
    t => t.type === 'withdrawal' && (t.status || 'pending') === 'pending'
  ).length;

  const totalPendingCount = pendingDepositsCount + pendingWithdrawalsCount;

  // Filter Logic
  const filteredTransactions = safeTransactions.filter(tx => {
    // Status Filter
    if (activeFilter === 'pending' && tx.status !== 'pending') return false;
    if (activeFilter === 'pending_deposits' && !(tx.type === 'deposit' && tx.status === 'pending')) return false;
    if (activeFilter === 'pending_withdrawals' && !(tx.type === 'withdrawal' && tx.status === 'pending')) return false;
    if (activeFilter === 'approved' && tx.status !== 'approved') return false;
    if (activeFilter === 'rejected' && tx.status !== 'rejected') return false;

    // Method Filter
    if (methodFilter !== 'all' && tx.method !== methodFilter) return false;

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchRef = (tx.referenceNumber || '').toLowerCase().includes(q);
      const matchName = (tx.userName || '').toLowerCase().includes(q);
      const matchPhone = (tx.phone || '').includes(q);
      const matchAcc = (tx.accountNumber || '').includes(q);
      if (!matchRef && !matchName && !matchPhone && !matchAcc) return false;
    }

    return true;
  });

  const handleApprove = (tx: TransactionRequest) => {
    const safeAmt = Number(tx.amount) || 0;
    approveAndReleaseTransaction(tx.id, adminNoteInput || 'Approved & Released by Admin');
    showToast(`✅ ${(tx.type || 'deposit').toUpperCase()} of ${safeAmt} ETB released to ${tx.userName || 'Player'}!`);
    setInspectTx(null);
    setAdminNoteInput('');
  };

  const handleConfirmReject = () => {
    if (!rejectTargetTx) return;
    const finalReason = customRejectNote.trim() ? customRejectNote.trim() : rejectReason;
    rejectTransaction(rejectTargetTx.id, finalReason);
    showToast(`❌ ${(rejectTargetTx.type || 'deposit').toUpperCase()} rejected: ${finalReason}`);
    setRejectTargetTx(null);
    setInspectTx(null);
    setCustomRejectNote('');
  };

  const handleCreateManualTx = (e: React.FormEvent) => {
    e.preventDefault();
    const targetUser = (users && users.find(u => u.id === manualUser)) || (users && users[0]) || {
      id: 'usr-1',
      name: 'Player',
      phone: '+251 911 000 000'
    };
    const amt = parseFloat(manualAmount) || 100;
    if (manualType === 'deposit') {
      addDepositRequest(targetUser.id, targetUser.name, targetUser.phone, amt, manualMethod, manualAccount);
      showToast(`📥 Deposit request of ${amt} ETB created for ${targetUser.name}`);
    } else {
      addWithdrawRequest(targetUser.id, targetUser.name, targetUser.phone, amt, manualMethod, manualAccount);
      showToast(`📤 Withdrawal request of ${amt} ETB created for ${targetUser.name}`);
    }
    setShowManualTxModal(false);
  };

  const rejectionPresets = [
    'Invalid SMS Reference Code (Not found in Telebirr)',
    'Payment not received in receiver account (0998983344)',
    'Amount mismatch between deposit request and bank slip',
    'Duplicate or expired transaction reference',
    'Account name does not match sender profile'
  ];

  return (
    <div className="cashier-desk-root">
      {/* 1. Header with Action Callout */}
      <div className="cashier-desk-header">
        <div className="desk-title-block">
          <div className="desk-badge">
            <i className="fa-solid fa-cash-register"></i>
            <span>TELEBIRR & CBE CASHIER DESK</span>
          </div>
          <p className="desk-subtitle">
            Verify SMS references, inspect player receipts, and release wallet balances in 1-click.
          </p>
        </div>

        <div className="desk-actions-cluster">
          <button
            type="button"
            className="btn-new-tx-request"
            onClick={() => setShowManualTxModal(true)}
          >
            <i className="fa-solid fa-plus-circle"></i> New Manual Order
          </button>
        </div>
      </div>

      {/* 2. FILTERS & SEARCH BAR */}
      <div className="cashier-toolbar">
        {/* Status Filters */}
        <div className="cashier-filter-tabs">
          <button
            type="button"
            className={`cf-tab ${activeFilter === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveFilter('pending')}
          >
            <span>Action Queue</span>
            {totalPendingCount > 0 && <span className="cf-pill-count pulse">{totalPendingCount}</span>}
          </button>

          <button
            type="button"
            className={`cf-tab ${activeFilter === 'pending_deposits' ? 'active' : ''}`}
            onClick={() => setActiveFilter('pending_deposits')}
          >
            <span>Deposits</span>
            {pendingDepositsCount > 0 && <span className="cf-pill-count green">{pendingDepositsCount}</span>}
          </button>

          <button
            type="button"
            className={`cf-tab ${activeFilter === 'pending_withdrawals' ? 'active' : ''}`}
            onClick={() => setActiveFilter('pending_withdrawals')}
          >
            <span>Withdrawals</span>
            {pendingWithdrawalsCount > 0 && <span className="cf-pill-count red">{pendingWithdrawalsCount}</span>}
          </button>

          <button
            type="button"
            className={`cf-tab ${activeFilter === 'approved' ? 'active' : ''}`}
            onClick={() => setActiveFilter('approved')}
          >
            <span>Approved & Settled</span>
          </button>

          <button
            type="button"
            className={`cf-tab ${activeFilter === 'rejected' ? 'active' : ''}`}
            onClick={() => setActiveFilter('rejected')}
          >
            <span>Rejected</span>
          </button>

          <button
            type="button"
            className={`cf-tab ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            <span>All ({safeTransactions.length})</span>
          </button>
        </div>

        {/* Method & Search Bar */}
        <div className="cashier-search-cluster">
          <div className="method-pill-group">
            <button
              type="button"
              className={`method-pill ${methodFilter === 'all' ? 'active' : ''}`}
              onClick={() => setMethodFilter('all')}
            >
              All Methods
            </button>
            <button
              type="button"
              className={`method-pill ${methodFilter === 'Telebirr' ? 'active' : ''}`}
              onClick={() => setMethodFilter('Telebirr')}
            >
              Telebirr
            </button>
            <button
              type="button"
              className={`method-pill ${methodFilter === 'CBE' ? 'active' : ''}`}
              onClick={() => setMethodFilter('CBE')}
            >
              CBE
            </button>
          </div>

          <div className="search-input-wrap">
            <div className="cashier-search-box">
              <i className="fa-solid fa-magnifying-glass search-icon"></i>
              <input
                type="text"
                placeholder="Search reference, player or phone..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
                  <i className="fa-solid fa-xmark"></i>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. ZERO-SCROLL RESPONSIVE TRANSACTION CARDS GRID */}
      <div className="tx-card-grid">
        {filteredTransactions.length === 0 ? (
          <div className="tx-empty-state">
            <i className="fa-solid fa-circle-check" style={{ fontSize: '2.5rem', color: '#10b981', marginBottom: '12px' }}></i>
            <h4>All Clear! No Pending Requests</h4>
            <p style={{ color: '#94a3b8', fontSize: '0.8125rem' }}>
              All deposit and withdrawal orders in this view have been processed.
            </p>
          </div>
        ) : (
          filteredTransactions.map(tx => {
            const txAmt = Number(tx.amount) || 0;
            const txMethod = tx.method || 'Telebirr';
            const txType = tx.type || 'deposit';
            const txRisk = tx.riskScore || 'verified';
            const txRef = tx.referenceNumber || 'TX-REF-000';
            const isPending = (tx.status || 'pending') === 'pending';

            return (
              <div
                key={tx.id}
                className={`tx-card-item ${isPending ? 'pending-card' : 'settled-card'}`}
              >
                {/* 1. Card Top Bar: Method Badge + Status */}
                <div className="tx-card-top">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span className={`method-logo-badge ${txMethod.toLowerCase()}`}>
                      <span className="cashier-mini-logo-box">
                        {txMethod === 'Telebirr' ? <TelebirrLogo size={18} /> : <CBELogo size={18} />}
                      </span>
                      <span>{txMethod === 'Telebirr' ? 'Telebirr' : 'CBE Bank'}</span>
                    </span>
                    <span className={`tx-type-pill ${txType}`}>
                      {txType === 'deposit' ? '📥 DEPOSIT' : '📤 WITHDRAWAL'}
                    </span>
                  </div>

                  <span className={`status-pill ${tx.status || 'pending'}`}>
                    {isPending && <span className="pulsing-amber-dot"></span>}
                    {(tx.status || 'pending').toUpperCase()}
                  </span>
                </div>

                {/* 2. Transaction Clear Details Section */}
                <div className="tx-details-box">
                  <div className="tx-detail-row">
                    <span className="tx-detail-lbl">Transaction ID:</span>
                    <span
                      className="tx-ref-clickable"
                      onClick={() => {
                        navigator.clipboard.writeText(txRef);
                        showToast(`📋 Copied ${txRef}`);
                      }}
                      title="Click to copy Transaction ID"
                    >
                      <code>{txRef}</code>
                      <i className="fa-regular fa-copy"></i>
                    </span>
                  </div>

                  <div className="tx-detail-row">
                    <span className="tx-detail-lbl">Player / Account:</span>
                    <span className="tx-detail-val">
                      <strong>{tx.userName || 'Player'}</strong> ({tx.phone || '+251 9...'})
                    </span>
                  </div>

                  <div className="tx-detail-row">
                    <span className="tx-detail-lbl">Provider Account:</span>
                    <span className="tx-detail-val monospace">{tx.accountNumber || '0998983344'}</span>
                  </div>

                  <div className="tx-detail-row">
                    <span className="tx-detail-lbl">Request Time:</span>
                    <span className="tx-detail-val muted">{tx.createdAt || 'Today'}</span>
                  </div>

                  {/* PROMINENT RECEIPT SCREENSHOT PREVIEW ON CARD */}
                  {tx.receiptImage ? (
                    <div className="tx-card-receipt-preview">
                      <div className="receipt-badge-title">
                        <i className="fa-solid fa-camera" style={{ color: '#4ade80' }}></i>
                        <span>Attached Screenshot Receipt</span>
                      </div>
                      <img
                        src={tx.receiptImage}
                        alt="Receipt"
                        className="tx-card-thumb-img"
                        onClick={() => setZoomReceiptImg(tx.receiptImage || null)}
                        title="Click to zoom receipt"
                      />
                    </div>
                  ) : (
                    <div className="tx-card-sms-preview">
                      <i className="fa-solid fa-message-check" style={{ color: '#38bdf8' }}></i>
                      <span>SMS Reference Verification (No Screenshot Attached)</span>
                    </div>
                  )}

                  {/* ADMIN REASON NOTE (IF REJECTED OR NOTED) */}
                  {tx.adminNote && (
                    <div className={`tx-card-admin-note ${tx.status === 'rejected' ? 'rejected' : 'approved'}`}>
                      <i className="fa-solid fa-comment-dots"></i>
                      <span>{tx.adminNote}</span>
                    </div>
                  )}
                </div>

                {/* 3. Player Stats & Large Amount Row */}
                <div className="tx-card-body">
                  <div className="tx-player-micro-stats">
                    <span className={`risk-badge ${txRisk}`}>
                      <i className="fa-solid fa-shield-check"></i> {txRisk.toUpperCase()}
                    </span>
                    <span className="lifetime-deposits-tag">
                      Lifetime In: {(Number(tx.userLifetimeDeposits) || 0).toFixed(0)} ETB
                    </span>
                  </div>

                  <div className="tx-amount-col">
                    <span className="tx-amount-label">Amount</span>
                    <div className={`tx-amount-huge ${txType}`}>
                      {txType === 'deposit' ? '+' : '-'}{txAmt.toFixed(2)}
                      <span className="currency-unit"> ETB</span>
                    </div>
                  </div>
                </div>

                {/* 4. Action Buttons with Zero Overlap */}
                <div className="tx-card-actions">
                  {isPending ? (
                    <>
                      <button
                        type="button"
                        className="btn-card-action btn-card-approve"
                        onClick={() => handleApprove(tx)}
                      >
                        <i className="fa-solid fa-bolt"></i> Approve & Release
                      </button>
                      <button
                        type="button"
                        className="btn-card-action btn-card-inspect"
                        onClick={() => setInspectTx(tx)}
                        title="Review Full Details & Notes"
                      >
                        <i className="fa-solid fa-magnifying-glass"></i> Full Slip
                      </button>
                      <button
                        type="button"
                        className="btn-card-action btn-card-reject"
                        onClick={() => setRejectTargetTx(tx)}
                        title="Reject Request with Reason Note"
                      >
                        <i className="fa-solid fa-xmark"></i> Reject
                      </button>
                    </>
                  ) : (
                    <div className="tx-card-settled-info">
                      <span>Processed: <strong>{tx.processedAt || 'Settled'}</strong></span>
                      {tx.adminNote && <span className="settled-note-sub"> • {tx.adminNote}</span>}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. REJECTION REASON MODAL (VISIBLE TO PLAYER) */}
      {rejectTargetTx && (
        <div className="admin-pin-overlay" style={{ position: 'fixed', inset: 0, zIndex: 1200 }}>
          <div className="inspect-modal-card" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-triangle-exclamation" style={{ color: '#f87171' }}></i>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>
                  Reject Transaction ({rejectTargetTx.referenceNumber})
                </h3>
              </div>
              <button className="modal-close-btn" onClick={() => setRejectTargetTx(null)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <p style={{ color: '#94a3b8', fontSize: '0.8125rem', marginBottom: '14px' }}>
              Select or type the rejection reason. <strong>The player will see this message directly in their Deposit/Withdrawal history.</strong>
            </p>

            <div className="rejection-presets-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
              {rejectionPresets.map(preset => (
                <label
                  key={preset}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: rejectReason === preset ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    border: `1px solid ${rejectReason === preset ? '#ef4444' : 'rgba(255, 255, 255, 0.08)'}`,
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    color: '#fff'
                  }}
                >
                  <input
                    type="radio"
                    name="rejectReason"
                    checked={rejectReason === preset}
                    onChange={() => setRejectReason(preset)}
                  />
                  <span>{preset}</span>
                </label>
              ))}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.75rem', color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>
                Or Custom Reason Note:
              </label>
              <input
                type="text"
                value={customRejectNote}
                onChange={e => setCustomRejectNote(e.target.value)}
                placeholder="Type custom note to player..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#090314',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.8125rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn-inspect-reject"
                style={{ flex: 1 }}
                onClick={() => setRejectTargetTx(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-card-reject"
                style={{ flex: 1.5, background: '#ef4444', color: '#fff', border: 'none', padding: '12px' }}
                onClick={handleConfirmReject}
              >
                <i className="fa-solid fa-xmark"></i> Confirm & Notify Player
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. FULL INSPECTION SLIP MODAL */}
      {inspectTx && (
        <div className="admin-pin-overlay" style={{ position: 'fixed', inset: 0, zIndex: 1100 }}>
          <div className="inspect-modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-receipt" style={{ color: '#a855f7' }}></i>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>
                  Transaction Inspection #{inspectTx.referenceNumber}
                </h3>
              </div>
              <button className="modal-close-btn" onClick={() => setInspectTx(null)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Quick Structured Metrics Box */}
            <div className="inspect-metrics-box">
              <div className="inspect-info-row">
                <span className="inspect-lbl">Transaction ID:</span>
                <span
                  className="tx-ref-clickable"
                  onClick={() => {
                    navigator.clipboard.writeText(inspectTx.referenceNumber);
                    showToast(`📋 Copied ${inspectTx.referenceNumber}`);
                  }}
                  title="Click to copy Transaction ID"
                >
                  <code style={{ fontSize: '0.875rem', fontWeight: 800 }}>{inspectTx.referenceNumber}</code>
                  <i className="fa-regular fa-copy"></i>
                </span>
              </div>

              <div className="inspect-info-row">
                <span className="inspect-lbl">Order Type:</span>
                <span className={`tx-type-pill ${inspectTx.type || 'deposit'}`}>
                  {(inspectTx.type || 'deposit') === 'deposit' ? '📥 DEPOSIT' : '📤 WITHDRAWAL'}
                </span>
              </div>

              <div className="inspect-info-row">
                <span className="inspect-lbl">Amount:</span>
                <span className={`inspect-amount-val ${(inspectTx.type || 'deposit') === 'deposit' ? 'green' : 'red'}`}>
                  {(inspectTx.type || 'deposit') === 'deposit' ? '+' : '-'}{(Number(inspectTx.amount) || 0).toFixed(2)} ETB
                </span>
              </div>

              <div className="inspect-info-row">
                <span className="inspect-lbl">Payment Provider:</span>
                <span className="inspect-val-bold">
                  {inspectTx.method === 'Telebirr' ? '📱 Telebirr' : '🏦 CBE Bank'}
                </span>
              </div>

              <div className="inspect-info-row">
                <span className="inspect-lbl">Receiver Account:</span>
                <span className="inspect-val-mono">{inspectTx.accountNumber || '0998983344'}</span>
              </div>

              <div className="inspect-info-row">
                <span className="inspect-lbl">Submission Time:</span>
                <span className="inspect-val-muted">{inspectTx.createdAt || 'Today'}</span>
              </div>
            </div>

            {/* Uploaded Receipt Image Preview (if attached) */}
            {inspectTx.receiptImage ? (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.75rem', color: '#facc15', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontWeight: 700 }}>
                  <i className="fa-solid fa-image"></i> Attached Payment Receipt Screenshot (Click to zoom):
                </label>
                <div
                  style={{ background: '#0a0518', border: '1px solid rgba(168,85,247,0.4)', borderRadius: '10px', padding: '8px', textAlign: 'center', cursor: 'pointer' }}
                  onClick={() => setZoomReceiptImg(inspectTx.receiptImage || null)}
                >
                  <img
                    src={inspectTx.receiptImage}
                    alt="Player Receipt"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '220px',
                      objectFit: 'contain',
                      borderRadius: '6px'
                    }}
                  />
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: '16px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '8px', padding: '10px 12px', fontSize: '0.8125rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-circle-info"></i>
                <span>No screenshot attached. Please verify via SMS Reference: <strong>{inspectTx.referenceNumber}</strong></span>
              </div>
            )}

            {/* Player Risk & Lifetime Context */}
            <div className="player-context-box">
              <div className="context-header">
                <i className="fa-solid fa-user-check" style={{ color: '#4ade80' }}></i>
                <span>Player Profile: <strong>{inspectTx.userName || 'Player'}</strong> ({inspectTx.phone || '+251 9...'})</span>
              </div>
              <div className="context-stats-row">
                <div>
                  <span className="sub-lbl">Lifetime Deposits</span>
                  <strong>{(Number(inspectTx.userLifetimeDeposits) || 0).toFixed(2)} ETB</strong>
                </div>
                <div>
                  <span className="sub-lbl">Lifetime Withdrawals</span>
                  <strong>{(Number(inspectTx.userLifetimeWithdrawals) || 0).toFixed(2)} ETB</strong>
                </div>
                <div>
                  <span className="sub-lbl">Risk Assessment</span>
                  <span className="status-pill active">SAFE / VERIFIED</span>
                </div>
              </div>
            </div>

            {/* Admin Settlement Note */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                Admin Settlement Note (Optional)
              </label>
              <input
                type="text"
                value={adminNoteInput}
                onChange={e => setAdminNoteInput(e.target.value)}
                placeholder="e.g. Telebirr SMS Ref Confirmed #88921"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#0f0724',
                  border: '1px solid rgba(168,85,247,0.3)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.8125rem'
                }}
              />
            </div>

            {/* Modal Actions */}
            <div className="inspect-actions-row">
              <button
                type="button"
                className="btn-inspect-reject"
                onClick={() => {
                  setRejectTargetTx(inspectTx);
                }}
              >
                <i className="fa-solid fa-xmark"></i> Reject Request
              </button>
              <button
                type="button"
                className="btn-inspect-approve"
                onClick={() => handleApprove(inspectTx)}
              >
                <i className="fa-solid fa-check-double"></i> Approve & Release Funds
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. FULL-SCREEN RECEIPT IMAGE ZOOM LIGHTBOX */}
      {zoomReceiptImg && (
        <div className="admin-pin-overlay" style={{ position: 'fixed', inset: 0, zIndex: 1300 }} onClick={() => setZoomReceiptImg(null)}>
          <div style={{ background: '#0a0518', border: '1.5px solid #a855f7', borderRadius: '16px', padding: '16px', maxWidth: '600px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ color: '#fff', margin: 0, fontSize: '1rem' }}>Receipt Screenshot Zoom</h4>
              <button className="modal-close-btn" onClick={() => setZoomReceiptImg(null)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div style={{ textAlign: 'center' }}>
              <img
                src={zoomReceiptImg}
                alt="Receipt Full"
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

      {/* Manual Request Modal */}
      {showManualTxModal && (
        <div className="admin-pin-overlay" style={{ position: 'fixed', inset: 0, zIndex: 1100 }}>
          <div className="manual-tx-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-circle-plus" style={{ color: '#a855f7' }}></i>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>Create Manual Order</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setShowManualTxModal(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleCreateManualTx}>
              <div className="modal-input-group">
                <label>Order Type</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    className={`type-select-btn ${manualType === 'deposit' ? 'active green' : ''}`}
                    onClick={() => setManualType('deposit')}
                  >
                    📥 Deposit
                  </button>
                  <button
                    type="button"
                    className={`type-select-btn ${manualType === 'withdrawal' ? 'active red' : ''}`}
                    onClick={() => setManualType('withdrawal')}
                  >
                    📤 Withdrawal
                  </button>
                </div>
              </div>

              <div className="modal-input-group">
                <label>Select Player Account</label>
                <select value={manualUser} onChange={e => setManualUser(e.target.value)}>
                  {users && users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.phone}) — Bal: {u.balance} ETB
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-input-group">
                <label>Amount (ETB)</label>
                <input
                  type="number"
                  min="50"
                  required
                  value={manualAmount}
                  onChange={e => setManualAmount(e.target.value)}
                />
              </div>

              <div className="modal-input-group">
                <label>Payment Method</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    className={`type-select-btn ${manualMethod === 'Telebirr' ? 'active' : ''}`}
                    onClick={() => setManualMethod('Telebirr')}
                  >
                    Telebirr
                  </button>
                  <button
                    type="button"
                    className={`type-select-btn ${manualMethod === 'CBE' ? 'active' : ''}`}
                    onClick={() => setManualMethod('CBE')}
                  >
                    CBE Bank
                  </button>
                </div>
              </div>

              <div className="modal-input-group">
                <label>Recipient / Sender Account Number</label>
                <input
                  type="text"
                  required
                  value={manualAccount}
                  onChange={e => setManualAccount(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn-inspect-reject"
                  style={{ flex: 1 }}
                  onClick={() => setShowManualTxModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-inspect-approve"
                  style={{ flex: 1.5 }}
                >
                  <i className="fa-solid fa-plus-circle"></i> Create Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
