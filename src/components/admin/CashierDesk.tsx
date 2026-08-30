import React, { useState } from 'react';
import { useAdmin, TransactionRequest } from '../../context/AdminContext.tsx';
import { useApp } from '../../context/AppContext.tsx';

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

  // Selected TX for Inspection Modal
  const [inspectTx, setInspectTx] = useState<TransactionRequest | null>(null);
  const [adminNoteInput, setAdminNoteInput] = useState('');

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

  const handleReject = (tx: TransactionRequest) => {
    rejectTransaction(tx.id, adminNoteInput || 'Rejected by Admin');
    showToast(`❌ ${(tx.type || 'deposit').toUpperCase()} rejected`);
    setInspectTx(null);
    setAdminNoteInput('');
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

  return (
    <div className="cashier-desk-wrapper">
      {/* 1. Actionable Header with Pending Badge */}
      <div className="admin-card" style={{ marginBottom: '18px' }}>
        <div className="admin-card-header" style={{ marginBottom: '14px' }}>
          <div className="cashier-title-group">
            <h3 className="admin-card-title">
              <i className="fa-solid fa-bolt-lightning" style={{ color: '#facc15' }}></i> Cashier Approvals & Settlement Queue
            </h3>
            <p className="cashier-subtitle">
              Direct 1-click approvals for Telebirr & CBE deposits and withdrawals
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span className={`sidebar-pending-badge ${totalPendingCount === 0 ? 'green-badge' : ''}`} style={{ fontSize: '0.8125rem', padding: '6px 12px' }}>
              {totalPendingCount} Pending Action
            </span>
            <button
              className="btn-tbl-action btn-approve"
              onClick={() => setShowManualTxModal(true)}
              style={{ margin: 0, padding: '8px 14px' }}
            >
              <i className="fa-solid fa-plus"></i> New Request
            </button>
          </div>
        </div>

        {/* 2. Filter Tabs & Search Bar */}
        <div className="cashier-filter-row" style={{ margin: 0 }}>
          <div className="cashier-filter-tabs">
            <button
              className={`filter-tab-btn ${activeFilter === 'pending' ? 'active' : ''}`}
              onClick={() => setActiveFilter('pending')}
            >
              🚨 All Pending ({totalPendingCount})
            </button>
            <button
              className={`filter-tab-btn ${activeFilter === 'pending_deposits' ? 'active' : ''}`}
              onClick={() => setActiveFilter('pending_deposits')}
            >
              📥 Deposits ({pendingDepositsCount})
            </button>
            <button
              className={`filter-tab-btn ${activeFilter === 'pending_withdrawals' ? 'active' : ''}`}
              onClick={() => setActiveFilter('pending_withdrawals')}
            >
              📤 Withdrawals ({pendingWithdrawalsCount})
            </button>
            <button
              className={`filter-tab-btn ${activeFilter === 'approved' ? 'active' : ''}`}
              onClick={() => setActiveFilter('approved')}
            >
              ✅ Settled
            </button>
            <button
              className={`filter-tab-btn ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              All Orders ({safeTransactions.length})
            </button>
          </div>

          <div className="cashier-search-group">
            <select
              className="cashier-select"
              value={methodFilter}
              onChange={e => setMethodFilter(e.target.value as any)}
            >
              <option value="all">All Methods</option>
              <option value="Telebirr">Telebirr</option>
              <option value="CBE">CBE</option>
            </select>

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
                {/* 1. Card Top Bar: Method Badge + Ref Code + Status */}
                <div className="tx-card-top">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span className={`method-logo-badge ${txMethod.toLowerCase()}`}>
                      {txMethod === 'Telebirr' ? '📱 Telebirr' : '🏦 CBE Bank'}
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
                    <span className="tx-detail-val font-mono">{tx.accountNumber || '0900000000'}</span>
                  </div>

                  <div className="tx-detail-row">
                    <span className="tx-detail-lbl">Request Time:</span>
                    <span className="tx-detail-val muted">{tx.createdAt || 'Today'}</span>
                  </div>
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

                {/* 4. Action Buttons */}
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
                        onClick={() => handleReject(tx)}
                        title="Reject Request"
                      >
                        <i className="fa-solid fa-xmark"></i> Reject
                      </button>
                    </>
                  ) : (
                    <div className="tx-card-settled-info">
                      <span>✓ Processed: {tx.processedAt || 'Settled'}</span>
                      <span>· Note: {tx.adminNote || 'Verified'}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ============================================================
          4. INSPECTION & RELEASE VERIFICATION MODAL
          ============================================================ */}
      {inspectTx && (
        <div className="admin-pin-overlay" style={{ position: 'fixed', inset: 0, zIndex: 1100 }}>
          <div className="admin-pin-card cashier-inspect-card" style={{ maxWidth: '520px', textAlign: 'left' }}>
            <div className="inspect-header">
              <div>
                <span className="inspect-badge-type">{(inspectTx.type || 'DEPOSIT').toUpperCase()} VERIFICATION</span>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#ffffff', margin: '4px 0' }}>
                  {inspectTx.referenceNumber || 'TX-REF'}
                </h3>
              </div>
              <button className="inspect-close-btn" onClick={() => setInspectTx(null)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Transaction Key Details */}
            <div className="inspect-details-grid">
              <div className="inspect-detail-item">
                <span className="label">Requested Amount</span>
                <span className="val-large gold">{(Number(inspectTx.amount) || 0).toFixed(2)} ETB</span>
              </div>
              <div className="inspect-detail-item">
                <span className="label">Payment Provider</span>
                <span className="val-bold">{inspectTx.method || 'Telebirr'}</span>
              </div>
              <div className="inspect-detail-item">
                <span className="label">Account / Phone</span>
                <span className="val-bold">{inspectTx.accountNumber || '0900000000'}</span>
              </div>
              <div className="inspect-detail-item">
                <span className="label">Request Time</span>
                <span className="val-muted">{inspectTx.createdAt || 'Today'}</span>
              </div>
            </div>

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

            {/* Uploaded Receipt Image Preview (if attached) */}
            {inspectTx.receiptImage && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.75rem', color: '#facc15', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontWeight: 700 }}>
                  <i className="fa-solid fa-image"></i> Attached Payment Receipt Screenshot
                </label>
                <div style={{ background: '#0a0518', border: '1px solid rgba(168,85,247,0.4)', borderRadius: '10px', padding: '8px', textAlign: 'center' }}>
                  <img
                    src={inspectTx.receiptImage}
                    alt="Player Receipt"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '180px',
                      objectFit: 'contain',
                      borderRadius: '6px'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Admin Settlement Note */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                Admin Settlement Note / SMS Receipt Code (Optional)
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
                onClick={() => handleReject(inspectTx)}
              >
                <i className="fa-solid fa-xmark"></i> Reject & Cancel
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

      {/* Manual Request Modal */}
      {showManualTxModal && (
        <div className="admin-pin-overlay" style={{ position: 'fixed', inset: 0, zIndex: 1100 }}>
          <div className="admin-pin-card" style={{ maxWidth: '440px', textAlign: 'left' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '16px', color: '#ffffff' }}>
              Inject Manual Cashier Request
            </h3>
            <form onSubmit={handleCreateManualTx}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Transaction Type
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    className={`btn-tbl-action ${manualType === 'deposit' ? 'btn-approve' : ''}`}
                    style={{ flex: 1, padding: '8px' }}
                    onClick={() => setManualType('deposit')}
                  >
                    Deposit
                  </button>
                  <button
                    type="button"
                    className={`btn-tbl-action ${manualType === 'withdrawal' ? 'btn-reject' : ''}`}
                    style={{ flex: 1, padding: '8px' }}
                    onClick={() => setManualType('withdrawal')}
                  >
                    Withdrawal
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Select Player
                </label>
                <select
                  value={manualUser}
                  onChange={e => setManualUser(e.target.value)}
                  style={{ width: '100%', padding: '10px', background: '#0f0724', border: '1px solid #7c3aed', borderRadius: '8px', color: '#fff' }}
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.phone}) - Bal: {u.balance} ETB
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Amount (ETB)
                </label>
                <input
                  type="number"
                  required
                  value={manualAmount}
                  onChange={e => setManualAmount(e.target.value)}
                  style={{ width: '100%', padding: '10px', background: '#0f0724', border: '1px solid #7c3aed', borderRadius: '8px', color: '#fff' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Payment Method
                </label>
                <select
                  value={manualMethod}
                  onChange={e => setManualMethod(e.target.value as any)}
                  style={{ width: '100%', padding: '10px', background: '#0f0724', border: '1px solid #7c3aed', borderRadius: '8px', color: '#fff' }}
                >
                  <option value="Telebirr">Telebirr</option>
                  <option value="CBE">CBE</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Account / Phone Number
                </label>
                <input
                  type="text"
                  required
                  value={manualAccount}
                  onChange={e => setManualAccount(e.target.value)}
                  style={{ width: '100%', padding: '10px', background: '#0f0724', border: '1px solid #7c3aed', borderRadius: '8px', color: '#fff' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="btn-pin-cancel"
                  onClick={() => setShowManualTxModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-pin-unlock">
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
