import React, { useState } from 'react';
import { useAdmin, TransactionRequest } from '../../context/AdminContext.tsx';
import { useApp } from '../../context/AppContext.tsx';

type FilterType = 'all' | 'pending_deposits' | 'pending_withdrawals' | 'approved' | 'rejected';

export const CashierDesk: React.FC = () => {
  const {
    transactions,
    approveAndReleaseTransaction,
    rejectTransaction,
    addDepositRequest,
    addWithdrawRequest,
    totalDepositedToday,
    totalWithdrawnToday,
    users
  } = useAdmin();

  const { showToast } = useApp();

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [methodFilter, setMethodFilter] = useState<'all' | 'Telebirr' | 'CBE'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected TX for Inspection Modal
  const [inspectTx, setInspectTx] = useState<TransactionRequest | null>(null);
  const [adminNoteInput, setAdminNoteInput] = useState('');

  // Manual Transaction Injection Modal
  const [showManualTxModal, setShowManualTxModal] = useState(false);
  const [manualType, setManualType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [manualUser, setManualUser] = useState(users[0]?.id || '');
  const [manualAmount, setManualAmount] = useState('500');
  const [manualMethod, setManualMethod] = useState<'Telebirr' | 'CBE'>('Telebirr');
  const [manualAccount, setManualAccount] = useState('0911234567');

  // Stats Calculations
  const pendingDeposits = transactions.filter(t => t.type === 'deposit' && t.status === 'pending');
  const pendingWithdrawals = transactions.filter(t => t.type === 'withdrawal' && t.status === 'pending');
  const totalPendingAmount = [...pendingDeposits, ...pendingWithdrawals].reduce((acc, t) => acc + t.amount, 0);
  const netCashflow = totalDepositedToday - totalWithdrawnToday;

  // Filter Logic
  const filteredTransactions = transactions.filter(tx => {
    // Status Filter
    if (activeFilter === 'pending_deposits' && !(tx.type === 'deposit' && tx.status === 'pending')) return false;
    if (activeFilter === 'pending_withdrawals' && !(tx.type === 'withdrawal' && tx.status === 'pending')) return false;
    if (activeFilter === 'approved' && tx.status !== 'approved') return false;
    if (activeFilter === 'rejected' && tx.status !== 'rejected') return false;

    // Method Filter
    if (methodFilter !== 'all' && tx.method !== methodFilter) return false;

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchRef = tx.referenceNumber?.toLowerCase().includes(q);
      const matchName = tx.userName?.toLowerCase().includes(q);
      const matchPhone = tx.phone?.includes(q);
      const matchAcc = tx.accountNumber?.includes(q);
      if (!matchRef && !matchName && !matchPhone && !matchAcc) return false;
    }

    return true;
  });

  const handleApprove = (tx: TransactionRequest) => {
    approveAndReleaseTransaction(tx.id, adminNoteInput || 'Approved & Released by Admin');
    showToast(`✅ ${tx.type.toUpperCase()} of ${tx.amount} ETB released to ${tx.userName}!`);
    setInspectTx(null);
    setAdminNoteInput('');
  };

  const handleReject = (tx: TransactionRequest) => {
    rejectTransaction(tx.id, adminNoteInput || 'Rejected by Admin');
    showToast(`❌ ${tx.type.toUpperCase()} rejected`);
    setInspectTx(null);
    setAdminNoteInput('');
  };

  const handleCreateManualTx = (e: React.FormEvent) => {
    e.preventDefault();
    const targetUser = users.find(u => u.id === manualUser) || users[0];
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
      {/* 1. Big-Operator Financial Barometer (Inflow / Outflow / Net) */}
      <div className="admin-metrics-grid">
        <div className="admin-metric-card">
          <div className="metric-header">
            <span className="metric-title">Today's Inflow (Deposits)</span>
            <i className="fa-solid fa-arrow-down-long metric-icon green"></i>
          </div>
          <div className="metric-val green">+{totalDepositedToday.toFixed(2)} ETB</div>
          <span className="metric-sub">Telebirr & CBE Cashier Inflow</span>
        </div>

        <div className="admin-metric-card">
          <div className="metric-header">
            <span className="metric-title">Today's Outflow (Payouts)</span>
            <i className="fa-solid fa-arrow-up-long metric-icon" style={{ color: '#f87171' }}></i>
          </div>
          <div className="metric-val" style={{ color: '#f87171' }}>
            -{totalWithdrawnToday.toFixed(2)} ETB
          </div>
          <span className="metric-sub">Processed Player Withdrawals</span>
        </div>

        <div className="admin-metric-card">
          <div className="metric-header">
            <span className="metric-title">Net Platform Cashflow</span>
            <i className="fa-solid fa-scale-balanced metric-icon gold"></i>
          </div>
          <div className="metric-val gold">
            {netCashflow >= 0 ? `+${netCashflow.toFixed(2)}` : netCashflow.toFixed(2)} ETB
          </div>
          <span className="metric-sub">Platform Retained Liquidity</span>
        </div>

        <div className="admin-metric-card">
          <div className="metric-header">
            <span className="metric-title">Pending Queue Value</span>
            <i className="fa-solid fa-hourglass-half metric-icon purple"></i>
          </div>
          <div className="metric-val purple">{totalPendingAmount.toFixed(2)} ETB</div>
          <span className="metric-sub">
            {pendingDeposits.length + pendingWithdrawals.length} Orders Awaiting Action
          </span>
        </div>
      </div>

      {/* 2. Cashier Operations Desk Header & Actions */}
      <div className="admin-card">
        <div className="admin-card-header">
          <div className="cashier-title-group">
            <h3 className="admin-card-title">
              <i className="fa-solid fa-building-columns"></i> Telebirr & CBE Cashier Settlement Desk
            </h3>
            <p className="cashier-subtitle">
              Verify SMS references, inspect player risk scores, and release wallet balances in 1-click
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn-tbl-action btn-approve"
              onClick={() => setShowManualTxModal(true)}
            >
              <i className="fa-solid fa-plus"></i> New Transaction Request
            </button>
          </div>
        </div>

        {/* 3. Filter Matrix & Search Bar */}
        <div className="cashier-filter-row">
          <div className="cashier-filter-tabs">
            <button
              className={`filter-tab-btn ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              All Orders ({transactions.length})
            </button>
            <button
              className={`filter-tab-btn ${activeFilter === 'pending_deposits' ? 'active' : ''}`}
              onClick={() => setActiveFilter('pending_deposits')}
            >
              Pending Deposits
              {pendingDeposits.length > 0 && (
                <span className="filter-badge green-badge">{pendingDeposits.length}</span>
              )}
            </button>
            <button
              className={`filter-tab-btn ${activeFilter === 'pending_withdrawals' ? 'active' : ''}`}
              onClick={() => setActiveFilter('pending_withdrawals')}
            >
              Pending Withdrawals
              {pendingWithdrawals.length > 0 && (
                <span className="filter-badge red-badge">{pendingWithdrawals.length}</span>
              )}
            </button>
            <button
              className={`filter-tab-btn ${activeFilter === 'approved' ? 'active' : ''}`}
              onClick={() => setActiveFilter('approved')}
            >
              Approved & Settled
            </button>
            <button
              className={`filter-tab-btn ${activeFilter === 'rejected' ? 'active' : ''}`}
              onClick={() => setActiveFilter('rejected')}
            >
              Rejected
            </button>
          </div>

          <div className="cashier-search-group">
            {/* Payment Method Select */}
            <select
              className="cashier-select"
              value={methodFilter}
              onChange={e => setMethodFilter(e.target.value as any)}
            >
              <option value="all">All Methods</option>
              <option value="Telebirr">Telebirr</option>
              <option value="CBE">CBE Birr / Bank</option>
            </select>

            {/* Search Input */}
            <div className="cashier-search-box">
              <i className="fa-solid fa-magnifying-glass search-icon"></i>
              <input
                type="text"
                placeholder="Search TX reference, player or phone..."
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

        {/* 4. Enterprise Transactions Table */}
        <div className="admin-table-wrapper">
          <table className="admin-table cashier-table">
            <thead>
              <tr>
                <th>Reference ID</th>
                <th>Type</th>
                <th>Method</th>
                <th>Player / Account</th>
                <th>Amount</th>
                <th>Player Risk</th>
                <th>Time</th>
                <th>Status</th>
                <th>Settlement Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                    <i className="fa-solid fa-receipt" style={{ fontSize: '2rem', marginBottom: '10px', display: 'block' }}></i>
                    No transactions match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(tx => (
                  <tr key={tx.id} className={tx.status === 'pending' ? 'highlight-pending-row' : ''}>
                    <td>
                      <strong className="tx-ref-code">{tx.referenceNumber}</strong>
                    </td>
                    <td>
                      <span className={`tx-type-pill ${tx.type}`}>
                        <i className={`fa-solid ${tx.type === 'deposit' ? 'fa-arrow-down' : 'fa-arrow-up'}`}></i>
                        {tx.type.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div className="method-pill-brand">
                        <span className={`method-logo-badge ${tx.method.toLowerCase()}`}>
                          {tx.method === 'Telebirr' ? '📱 TB' : '🏦 CBE'}
                        </span>
                        <span>{tx.method}</span>
                      </div>
                    </td>
                    <td>
                      <div className="player-account-cell">
                        <strong>{tx.userName}</strong>
                        <span className="account-number-sub">{tx.accountNumber}</span>
                      </div>
                    </td>
                    <td>
                      <span className="tx-amount-badge">
                        {tx.type === 'deposit' ? '+' : '-'}{tx.amount.toFixed(2)} ETB
                      </span>
                    </td>
                    <td>
                      <span className={`risk-badge ${tx.riskScore}`}>
                        <i className="fa-solid fa-shield-check"></i> {tx.riskScore.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{tx.createdAt}</td>
                    <td>
                      <span className={`status-pill ${tx.status}`}>
                        {tx.status === 'pending' && <span className="pulsing-amber-dot"></span>}
                        {tx.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      {tx.status === 'pending' ? (
                        <div className="settlement-actions-cell">
                          <button
                            className="btn-tbl-action btn-inspect"
                            onClick={() => setInspectTx(tx)}
                            title="Inspect Proof & Release"
                          >
                            <i className="fa-solid fa-magnifying-glass"></i> Review & Release
                          </button>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          <span>{tx.processedAt || 'Settled'}</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================
          5. INSPECTION & RELEASE VERIFICATION MODAL (Big Operator Standard)
          ============================================================ */}
      {inspectTx && (
        <div className="admin-pin-overlay" style={{ position: 'fixed', inset: 0, zIndex: 1100 }}>
          <div className="admin-pin-card cashier-inspect-card" style={{ maxWidth: '520px', textAlign: 'left' }}>
            <div className="inspect-header">
              <div>
                <span className="inspect-badge-type">{inspectTx.type.toUpperCase()} VERIFICATION</span>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#ffffff', margin: '4px 0' }}>
                  {inspectTx.referenceNumber}
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
                <span className="val-large gold">{inspectTx.amount.toFixed(2)} ETB</span>
              </div>
              <div className="inspect-detail-item">
                <span className="label">Payment Provider</span>
                <span className="val-bold">{inspectTx.method}</span>
              </div>
              <div className="inspect-detail-item">
                <span className="label">Account / Phone</span>
                <span className="val-bold">{inspectTx.accountNumber}</span>
              </div>
              <div className="inspect-detail-item">
                <span className="label">Request Time</span>
                <span className="val-muted">{inspectTx.createdAt}</span>
              </div>
            </div>

            {/* Player Risk & Lifetime Context */}
            <div className="player-context-box">
              <div className="context-header">
                <i className="fa-solid fa-user-check" style={{ color: '#4ade80' }}></i>
                <span>Player Profile: <strong>{inspectTx.userName}</strong> ({inspectTx.phone})</span>
              </div>
              <div className="context-stats-row">
                <div>
                  <span className="sub-lbl">Lifetime Deposits</span>
                  <strong>{inspectTx.userLifetimeDeposits.toFixed(2)} ETB</strong>
                </div>
                <div>
                  <span className="sub-lbl">Lifetime Withdrawals</span>
                  <strong>{inspectTx.userLifetimeWithdrawals.toFixed(2)} ETB</strong>
                </div>
                <div>
                  <span className="sub-lbl">Risk Assessment</span>
                  <span className="status-pill active">SAFE / VERIFIED</span>
                </div>
              </div>
            </div>

            {/* Admin Release Notes */}
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

            {/* Big Action Buttons */}
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

      {/* ============================================================
          6. MANUAL TRANSACTION INJECTION MODAL (For Direct Support)
          ============================================================ */}
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
                    Deposit (Inflow)
                  </button>
                  <button
                    type="button"
                    className={`btn-tbl-action ${manualType === 'withdrawal' ? 'btn-reject' : ''}`}
                    style={{ flex: 1, padding: '8px' }}
                    onClick={() => setManualType('withdrawal')}
                  >
                    Withdrawal (Outflow)
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
                  <option value="CBE">CBE Birr / Bank</option>
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
