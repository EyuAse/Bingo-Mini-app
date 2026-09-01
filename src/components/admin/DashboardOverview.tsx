import React from 'react';
import { useAdmin, TransactionRequest } from '../../context/AdminContext.tsx';
import { useApp } from '../../context/AppContext.tsx';
import { AdminTab } from './AdminSidebar.tsx';
import { TelebirrLogo, CBELogo } from '../wallet/PaymentLogos.tsx';

interface DashboardOverviewProps {
  onNavigateTab: (tab: AdminTab) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ onNavigateTab }) => {
  const {
    totalHouseProfit,
    houseCommissionEnabled,
    setHouseCommissionEnabled,
    commissionRate,
    simulatedPlayerCount,
    setSimulatedPlayerCount,
    botWinRate,
    users,
    transactions,
    buy2Get1Bonus,
    setBuy2Get1Bonus,
    approveAndReleaseTransaction,
    rejectTransaction
  } = useAdmin();

  const { switchPage, showToast } = useApp();

  const pendingTransactions = transactions.filter(t => t.status === 'pending');
  const activeUsersCount = users.filter(u => u.status === 'active').length;

  const handleApproveTx = (tx: TransactionRequest) => {
    approveAndReleaseTransaction(tx.id);
    showToast(`✓ Approved ${tx.amount} ETB for ${tx.userName}`);
  };

  const handleRejectTx = (tx: TransactionRequest) => {
    rejectTransaction(tx.id, 'Rejected from Dashboard Quick Review');
    showToast(`❌ Rejected transaction ${tx.referenceNumber}`);
  };

  return (
    <div className="dashboard-overview-container">
      {/* 1. Hero Command Center Banner */}
      <div className="dashboard-hero-banner">
        <div className="dash-hero-left">
          <div className="dash-hero-icon-box">
            <i className="fa-solid fa-gauge-high"></i>
          </div>
          <div className="dash-hero-titles">
            <div className="dash-hero-badge-row">
              <span className="dash-live-badge">
                <span className="pulse-green-dot"></span>
                <span>ENGINE V3 RUNNING</span>
              </span>
              <span className="dash-uptime-tag">99.9% Uptime</span>
            </div>
            <h1 className="dash-hero-main-title">LOMI BINGO PLATFORM OPERATIONS DESK</h1>
            <p className="dash-hero-sub-title">
              የሎሚ ቢንጎ የቀጥታ ጨዋታዎችን፣ የኮሚሽን ትርፍን እና የክፍያዎችን ፍሰት በአንድ ማዕከል ይቆጣጠሩ
            </p>
          </div>
        </div>

        <div className="dash-hero-right">
          {/* Lemon SVG Art */}
          <div className="dash-hero-lemon-art">
            <svg width="48" height="48" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="32" cy="32" r="28" fill="#facc15" stroke="#eab308" strokeWidth="3" />
              <circle cx="32" cy="32" r="23" fill="#fef08a" />
              <path d="M32 9L32 55" stroke="#eab308" strokeWidth="2" strokeLinecap="round" />
              <path d="M9 32L55 32" stroke="#eab308" strokeWidth="2" strokeLinecap="round" />
              <path d="M16 16L48 48" stroke="#eab308" strokeWidth="2" strokeLinecap="round" />
              <path d="M48 16L16 48" stroke="#eab308" strokeWidth="2" strokeLinecap="round" />
              <circle cx="32" cy="32" r="6" fill="#ffffff" stroke="#eab308" strokeWidth="1.5" />
            </svg>
          </div>

          <div className="dash-hero-action-buttons">
            <button
              type="button"
              className="btn-dash-hero-cashier"
              onClick={() => onNavigateTab('cashier')}
            >
              <i className="fa-solid fa-receipt"></i>
              <span>Cashier Queue ({pendingTransactions.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. 4 Hero Metric KPI Cards */}
      <div className="dashboard-kpi-grid">
        {/* Card 1: House Profit */}
        <div className="dashboard-kpi-card gold">
          <div className="kpi-card-header">
            <span className="kpi-card-title">House Commission Profit</span>
            <div className="kpi-card-icon-box gold">
              <i className="fa-solid fa-vault"></i>
            </div>
          </div>
          <div className="kpi-card-value gold">
            {totalHouseProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="kpi-unit">ETB</span>
          </div>
          <div className="kpi-card-footer">
            <span className="kpi-badge gold">
              <i className="fa-solid fa-percent"></i>
              {houseCommissionEnabled ? `${commissionRate}% House Cut Active` : 'Cut Paused'}
            </span>
            <span className="kpi-micro-text">20% of all played pools</span>
          </div>
        </div>

        {/* Card 2: Active Players */}
        <div className="dashboard-kpi-card purple">
          <div className="kpi-card-header">
            <span className="kpi-card-title">Active Live Players</span>
            <div className="kpi-card-icon-box purple">
              <i className="fa-solid fa-users"></i>
            </div>
          </div>
          <div className="kpi-card-value purple">
            {simulatedPlayerCount} <span className="kpi-unit">Online</span>
          </div>
          <div className="kpi-card-footer">
            <span className="kpi-badge purple">
              <i className="fa-solid fa-robot"></i>
              260+ Bot Identities Active
            </span>
            <span className="kpi-micro-text">{botWinRate}% Win Target</span>
          </div>
        </div>

        {/* Card 3: Registered Accounts */}
        <div className="dashboard-kpi-card green">
          <div className="kpi-card-header">
            <span className="kpi-card-title">Registered Accounts</span>
            <div className="kpi-card-icon-box green">
              <i className="fa-solid fa-address-card"></i>
            </div>
          </div>
          <div className="kpi-card-value green">
            {users.length} <span className="kpi-unit">Accounts</span>
          </div>
          <div className="kpi-card-footer">
            <span className="kpi-badge green">
              <i className="fa-solid fa-gift"></i>
              10 ETB Welcome Bonus
            </span>
            <span className="kpi-micro-text">{activeUsersCount} Active today</span>
          </div>
        </div>

        {/* Card 4: Pending Cashier Settlements */}
        <div className="dashboard-kpi-card blue">
          <div className="kpi-card-header">
            <span className="kpi-card-title">Pending Cashier Queue</span>
            <div className="kpi-card-icon-box blue">
              <i className="fa-solid fa-cash-register"></i>
            </div>
          </div>
          <div className="kpi-card-value blue">
            {pendingTransactions.length} <span className="kpi-unit">Orders</span>
          </div>
          <div className="kpi-card-footer">
            <span className={`kpi-badge ${pendingTransactions.length > 0 ? 'red' : 'green'}`}>
              <i className={`fa-solid ${pendingTransactions.length > 0 ? 'fa-clock' : 'fa-check'}`}></i>
              {pendingTransactions.length > 0 ? `${pendingTransactions.length} Needs Action` : 'All Settled'}
            </span>
            <button
              type="button"
              className="kpi-card-link-btn"
              onClick={() => onNavigateTab('cashier')}
            >
              Open Desk ➔
            </button>
          </div>
        </div>
      </div>

      {/* 3. Live Operational Quick Controls Matrix */}
      <div className="dashboard-white-section-card">
        <div className="section-card-header-row">
          <div className="section-title-wrap">
            <div className="section-icon-gold">
              <i className="fa-solid fa-sliders"></i>
            </div>
            <div>
              <h2 className="section-main-heading">Live Operational Quick Controls</h2>
              <p className="section-sub-heading">Real-time dynamic adjustment of player density, commission, and bonuses</p>
            </div>
          </div>
          <span className="section-status-tag">⚡ INSTANT SYSTEM SYNC</span>
        </div>

        <div className="dashboard-controls-grid">
          {/* Control 1: Simulated Crowd Density Slider */}
          <div className="dash-control-cell">
            <div className="cell-info-stack">
              <div className="cell-label-row">
                <strong className="cell-title">Simulated Room Crowd Density</strong>
                <span className="cell-pill-val purple">{simulatedPlayerCount} Players</span>
              </div>
              <p className="cell-desc">Dynamically scale online players and bots participating in 75-ball rounds</p>
            </div>

            <div className="slider-interactive-wrap">
              <input
                type="range"
                min="20"
                max="450"
                step="5"
                value={simulatedPlayerCount}
                className="dash-range-slider"
                onChange={e => setSimulatedPlayerCount(parseInt(e.target.value, 10))}
              />
              <div className="slider-preset-chips-row">
                <span className="preset-label">Quick Presets:</span>
                {[50, 100, 185, 250, 350, 400].map(cnt => (
                  <button
                    key={cnt}
                    type="button"
                    className={`btn-dash-preset-chip ${simulatedPlayerCount === cnt ? 'active' : ''}`}
                    onClick={() => setSimulatedPlayerCount(cnt)}
                  >
                    {cnt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Control 2: 20% House Commission Switch */}
          <div className="dash-control-cell">
            <div className="cell-info-stack">
              <div className="cell-label-row">
                <strong className="cell-title">20% House Commission Profit</strong>
                <span className="cell-pill-val gold">{commissionRate}% Cut Active</span>
              </div>
              <p className="cell-desc">Automatically deducts {commissionRate}% commission cut from every round's total stake pool</p>
            </div>

            <div className="switch-interactive-row">
              <span className="switch-status-text">
                Status: <strong>{houseCommissionEnabled ? 'Enabled (20% Cut)' : 'Disabled (0% Cut)'}</strong>
              </span>
              <label className="dash-toggle-switch">
                <input
                  type="checkbox"
                  checked={houseCommissionEnabled}
                  onChange={e => {
                    setHouseCommissionEnabled(e.target.checked);
                    showToast(`House Commission ${e.target.checked ? 'Enabled' : 'Disabled'}`);
                  }}
                />
                <span className="dash-toggle-slider"></span>
              </label>
            </div>
          </div>

          {/* Control 3: Buy 2 Get 1 FREE Promo */}
          <div className="dash-control-cell">
            <div className="cell-info-stack">
              <div className="cell-label-row">
                <strong className="cell-title">2+1 Cartela Bonus Promo</strong>
                <span className="cell-pill-val green">{buy2Get1Bonus ? 'Promo Active 🎁' : 'Promo Off'}</span>
              </div>
              <p className="cell-desc">Players purchasing 2 or more cards (cartelas) automatically receive 1 bonus card free</p>
            </div>

            <div className="switch-interactive-row">
              <span className="switch-status-text">
                Status: <strong>{buy2Get1Bonus ? 'Active (Buy 2 Get 1 FREE)' : 'Disabled'}</strong>
              </span>
              <label className="dash-toggle-switch">
                <input
                  type="checkbox"
                  checked={buy2Get1Bonus}
                  onChange={e => {
                    setBuy2Get1Bonus(e.target.checked);
                    showToast(`2+1 Bonus Promo ${e.target.checked ? 'Enabled' : 'Disabled'}`);
                  }}
                />
                <span className="dash-toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Live Bingo Arena Monitor & Cash Flow Barometer */}
      <div className="dashboard-two-column-grid">
        {/* Left Column: 75-Ball Arena Monitor */}
        <div className="dashboard-white-section-card">
          <div className="section-card-header-row">
            <div className="section-title-wrap">
              <div className="section-icon-gold">
                <i className="fa-solid fa-tower-broadcast"></i>
              </div>
              <div>
                <h3 className="section-main-heading">Live Bingo Arena Monitor</h3>
                <p className="section-sub-heading">Real-time parameters of active 75-ball betting games</p>
              </div>
            </div>
            <span className="section-status-tag green">75-BALL LIVE</span>
          </div>

          <div className="arena-monitor-grid">
            <div className="arena-spec-tile">
              <span className="spec-label">Stakes Range</span>
              <strong className="spec-value">10, 20, 50, 100 ETB</strong>
            </div>
            <div className="arena-spec-tile">
              <span className="spec-label">Total Cartela Pool</span>
              <strong className="spec-value gold">400 Serial Cards</strong>
            </div>
            <div className="arena-spec-tile">
              <span className="spec-label">Multi-Winner Rule</span>
              <strong className="spec-value green">Split Pot Shared</strong>
            </div>
            <div className="arena-spec-tile">
              <span className="spec-label">Bonus Cartela Slot</span>
              <strong className="spec-value purple">{buy2Get1Bonus ? 'Card 3 (FREE 🎁)' : 'Disabled'}</strong>
            </div>
          </div>
        </div>

        {/* Right Column: Today's Financial Cash Flow Barometer */}
        <div className="dashboard-white-section-card">
          <div className="section-card-header-row">
            <div className="section-title-wrap">
              <div className="section-icon-gold">
                <i className="fa-solid fa-scale-balanced"></i>
              </div>
              <div>
                <h3 className="section-main-heading">Financial Cash Flow Barometer</h3>
                <p className="section-sub-heading">Daily Telebirr & CBE banking turnover and retention</p>
              </div>
            </div>
            <span className="section-status-tag">DAILY SETTLEMENT</span>
          </div>

          <div className="cashflow-barometer-grid">
            <div className="barometer-cell green">
              <span className="baro-label">Today's Inflow (Deposits)</span>
              <strong className="baro-amount green">+28,500.00 ETB</strong>
              <span className="baro-sub">Telebirr & CBE verified</span>
            </div>
            <div className="barometer-cell red">
              <span className="baro-label">Today's Outflow (Payouts)</span>
              <strong className="baro-amount red">-14,200.00 ETB</strong>
              <span className="baro-sub">Processed player withdrawals</span>
            </div>
            <div className="barometer-cell gold">
              <span className="baro-label">Net Inflow (Platform Balance)</span>
              <strong className="baro-amount gold">+14,300.00 ETB</strong>
              <span className="baro-sub">+50.1% Net Retention</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Quick Cashier Pending Queue Mini-Desk */}
      <div className="dashboard-white-section-card">
        <div className="section-card-header-row">
          <div className="section-title-wrap">
            <div className="section-icon-gold">
              <i className="fa-solid fa-cash-register"></i>
            </div>
            <div>
              <h3 className="section-main-heading">Cashier Queue Quick Review</h3>
              <p className="section-sub-heading">Recent pending deposits and withdrawals awaiting supervisor approval</p>
            </div>
          </div>
          <button
            type="button"
            className="btn-dash-view-all-cashier"
            onClick={() => onNavigateTab('cashier')}
          >
            <span>Open Cashier Desk ({transactions.length} Total)</span>
            <i className="fa-solid fa-arrow-right"></i>
          </button>
        </div>

        {pendingTransactions.length === 0 ? (
          <div className="dash-empty-queue-box">
            <i className="fa-solid fa-circle-check green"></i>
            <div>
              <strong className="empty-title">All Settlements Cleared!</strong>
              <p className="empty-sub">No pending Telebirr or CBE requests awaiting cashier verification.</p>
            </div>
          </div>
        ) : (
          <div className="dash-mini-tx-grid">
            {pendingTransactions.slice(0, 3).map(tx => {
              const isTelebirr = tx.method === 'Telebirr';
              const isDeposit = tx.type === 'deposit';

              return (
                <div key={tx.id} className="dash-mini-tx-card">
                  <div className="mini-card-top-row">
                    <div className="mini-card-provider">
                      {isTelebirr ? <TelebirrLogo size={20} /> : <CBELogo size={20} />}
                      <span className={`provider-name ${isTelebirr ? 'telebirr' : 'cbe'}`}>{tx.method}</span>
                    </div>
                    <span className={`mini-type-pill ${isDeposit ? 'deposit' : 'withdrawal'}`}>
                      {isDeposit ? 'DEPOSIT' : 'WITHDRAWAL'}
                    </span>
                  </div>

                  <div className="mini-card-customer-row">
                    <strong className="mini-customer-name">{tx.userName}</strong>
                    <span className="mini-customer-phone">{tx.phone}</span>
                  </div>

                  <div className="mini-card-ref-box">
                    <span className="ref-lbl">Ref:</span>
                    <span className="ref-code">{tx.referenceNumber}</span>
                  </div>

                  <div className="mini-card-amount-row">
                    <span className="amt-lbl">Amount:</span>
                    <strong className={`amt-val ${isDeposit ? 'deposit-green' : 'withdraw-gold'}`}>
                      {tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB
                    </strong>
                  </div>

                  <div className="mini-card-actions-row">
                    <button
                      type="button"
                      className="btn-mini-approve-green"
                      onClick={() => handleApproveTx(tx)}
                    >
                      <i className="fa-solid fa-bolt"></i>
                      <span>Approve</span>
                    </button>
                    <button
                      type="button"
                      className="btn-mini-reject-red"
                      onClick={() => handleRejectTx(tx)}
                    >
                      <i className="fa-solid fa-xmark"></i>
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
