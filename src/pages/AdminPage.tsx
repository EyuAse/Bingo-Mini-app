import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext.tsx';
import { useApp } from '../context/AppContext.tsx';
import { AdminPINModal } from '../components/admin/AdminPINModal.tsx';
import { AdminSidebar, AdminTab } from '../components/admin/AdminSidebar.tsx';
import { CashierDesk } from '../components/admin/CashierDesk.tsx';
import { CashFlowAnalytics } from '../components/admin/CashFlowAnalytics.tsx';
import '../styles/admin.css';

export const AdminPage: React.FC = () => {
  const {
    brandName,
    isAuthenticated,
    isSidebarCollapsed,
    houseCommissionEnabled,
    setHouseCommissionEnabled,
    commissionRate,
    setCommissionRate,
    stakes,
    buy2Get1Bonus,
    setBuy2Get1Bonus,
    verticalBoardMode,
    setVerticalBoardMode,
    registerBonus,
    setRegisterBonus,
    referralBonusRate,
    setReferralBonusRate,
    simulatedPlayerCount,
    setSimulatedPlayerCount,
    botWinRate,
    setBotWinRate,
    ownerWinTarget,
    setOwnerWinTarget,
    botPool,
    cartelaPool,
    users,
    addUser,
    adjustUserBalance,
    toggleUserStatus,
    transactions,
    totalHouseProfit
  } = useAdmin();

  const { switchPage, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Search & Filter States
  const [userSearch, setUserSearch] = useState('');
  const [botSearch, setBotSearch] = useState('');
  const [cartelaSearch, setCartelaSearch] = useState('');

  // Add User Modal State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserBalance, setNewUserBalance] = useState('100');

  // Adjust Balance Modal State
  const [adjustTargetUser, setAdjustTargetUser] = useState<string | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('50');
  const [adjustIsBonus, setAdjustIsBonus] = useState(false);

  // If not authenticated, render the PIN lock guard
  if (!isAuthenticated) {
    return <AdminPINModal />;
  }

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserPhone.trim()) {
      showToast('❌ Please fill name and phone');
      return;
    }
    addUser({
      name: newUserName.trim(),
      phone: newUserPhone.trim(),
      balance: parseFloat(newUserBalance) || 0,
      bonus: registerBonus,
      referralCount: 0,
      totalDeposited: parseFloat(newUserBalance) || 0,
      totalWithdrawn: 0,
      status: 'active'
    });
    setNewUserName('');
    setNewUserPhone('');
    setNewUserBalance('100');
    setShowAddUserModal(false);
    showToast('✅ User created with 10 ETB Register Bonus');
  };

  const handleApplyAdjustment = () => {
    if (adjustTargetUser) {
      const amount = parseFloat(adjustAmount) || 0;
      adjustUserBalance(adjustTargetUser, amount, adjustIsBonus);
      showToast(`✅ Balance adjusted: ${amount > 0 ? '+' : ''}${amount} ETB`);
      setAdjustTargetUser(null);
    }
  };

  const filteredUsers = users.filter(
    u =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.phone.includes(userSearch)
  );

  const filteredBots = botPool.filter(
    b =>
      b.name.toLowerCase().includes(botSearch.toLowerCase()) ||
      b.phone.includes(botSearch)
  );

  const filteredCartelas = cartelaPool.filter(
    c =>
      c.serialNumber.toLowerCase().includes(cartelaSearch.toLowerCase()) ||
      String(c.id).includes(cartelaSearch)
  );

  const pendingTransactions = transactions.filter(t => t.status === 'pending');

  return (
    <div className="admin-layout-shell">
      {/* 1. Modern Collapsible Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMobileOpen={isMobileSidebarOpen}
        closeMobileSidebar={() => setIsMobileSidebarOpen(false)}
      />

      {/* 2. Admin Content Viewport */}
      <div className={`admin-main-viewport ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Top Header Bar */}
        <header className="admin-viewport-header">
          <div className="viewport-header-left">
            <button
              className="admin-mobile-toggle"
              onClick={() => setIsMobileSidebarOpen(true)}
              title="Open Navigation"
            >
              <i className="fa-solid fa-bars"></i>
            </button>
            <div className="viewport-page-title">
              <h2>
                {activeTab === 'overview' && '📊 Dashboard & Platform Analytics'}
                {activeTab === 'cashier' && '⚡ Cashier Approvals & Settlement Queue'}
                {activeTab === 'cashflow' && '💰 Cash Flow & Revenue Analytics'}
                {activeTab === 'commission' && '⚙️ Game Rules & House Commission (10%)'}
                {activeTab === 'bots' && '🤖 200+ Smart Bots & Crowd Simulator'}
                {activeTab === 'users' && '👥 Player Accounts & Bonus Manager'}
                {activeTab === 'cartelas' && '🎴 400 Serial Cartela Cards Library'}
              </h2>
            </div>
          </div>

          <div className="viewport-header-right">
            <button
              className="btn-admin-preview"
              onClick={() => {
                window.location.hash = '';
                switchPage('bingo');
              }}
              title="Open Live Game Room"
            >
              <i className="fa-solid fa-gamepad"></i> Open Bingo Room
            </button>
          </div>
        </header>

        {/* Tab Content Panes */}
        <main className="admin-tab-content">
          {/* TAB 1: OVERVIEW & ANALYTICS */}
          {activeTab === 'overview' && (
            <div className="tab-pane">
              <div className="admin-metrics-grid">
                <div className="admin-metric-card">
                  <div className="metric-header">
                    <span className="metric-title">House Commission Profit</span>
                    <i className="fa-solid fa-vault metric-icon gold"></i>
                  </div>
                  <div className="metric-val gold">{totalHouseProfit.toFixed(2)} ETB</div>
                  <span className="metric-sub">
                    {houseCommissionEnabled ? `Active at ${commissionRate}% Cut` : 'Commission Paused'}
                  </span>
                </div>

                <div className="admin-metric-card">
                  <div className="metric-header">
                    <span className="metric-title">Active Live Players</span>
                    <i className="fa-solid fa-users metric-icon purple"></i>
                  </div>
                  <div className="metric-val purple">{simulatedPlayerCount}</div>
                  <span className="metric-sub">200+ Smart Bots in Lobby</span>
                </div>

                <div className="admin-metric-card">
                  <div className="metric-header">
                    <span className="metric-title">Registered Accounts</span>
                    <i className="fa-solid fa-address-card metric-icon green"></i>
                  </div>
                  <div className="metric-val green">{users.length} Users</div>
                  <span className="metric-sub">10 ETB Signup Bonus Active</span>
                </div>

                <div className="admin-metric-card">
                  <div className="metric-header">
                    <span className="metric-title">Pending Cashier Orders</span>
                    <i className="fa-solid fa-receipt metric-icon"></i>
                  </div>
                  <div className="metric-val">{pendingTransactions.length}</div>
                  <span className="metric-sub">Telebirr & CBE Settlement</span>
                </div>
              </div>

              {/* System Status Summary */}
              <div className="admin-card">
                <div className="admin-card-header">
                  <h3 className="admin-card-title">
                    <i className="fa-solid fa-server"></i> System Operational Status
                  </h3>
                  <span className="admin-card-badge">LIVE ENGINE V3</span>
                </div>

                <div className="admin-control-row">
                  <div className="control-info">
                    <h4>10% System House Cut</h4>
                    <p>Automatically deducts {commissionRate}% commission from every round's total pot</p>
                  </div>
                  <span className={`status-pill ${houseCommissionEnabled ? 'active' : 'suspended'}`}>
                    {houseCommissionEnabled ? `ON (${commissionRate}%)` : 'OFF'}
                  </span>
                </div>

                <div className="admin-control-row">
                  <div className="control-info">
                    <h4>Register & Referral Incentives</h4>
                    <p>10 Birr free register bonus + 10% referral deposit reward</p>
                  </div>
                  <span className="status-pill active">ENABLED</span>
                </div>

                <div className="admin-control-row">
                  <div className="control-info">
                    <h4>2+1 Cartela Bonus Promo</h4>
                    <p>Players purchasing 2 or more cards receive 1 bonus card</p>
                  </div>
                  <span className={`status-pill ${buy2Get1Bonus ? 'active' : 'suspended'}`}>
                    {buy2Get1Bonus ? 'ACTIVE' : 'DISABLED'}
                  </span>
                </div>

                <div className="admin-control-row">
                  <div className="control-info">
                    <h4>Cartela Library Size</h4>
                    <p>Pre-generated mathematical pool available for live selection</p>
                  </div>
                  <span className="slider-val-badge">400 Cards</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CASHIER APPROVALS DESK */}
          {activeTab === 'cashier' && <CashierDesk />}

          {/* TAB 3: CASH FLOW & REVENUE ANALYTICS */}
          {activeTab === 'cashflow' && <CashFlowAnalytics />}

          {/* TAB 3: GAME & COMMISSION RULES */}
          {activeTab === 'commission' && (
            <div className="tab-pane">
              <div className="admin-card">
                <div className="admin-card-header">
                  <h3 className="admin-card-title">
                    <i className="fa-solid fa-percent"></i> House Commission System
                  </h3>
                  <span className="admin-card-badge">Default 10%</span>
                </div>

                <div className="admin-control-row">
                  <div className="control-info">
                    <h4>Enable House Commission</h4>
                    <p>Lock/take percentage of the round prize pool for the house</p>
                  </div>
                  <label className="admin-switch">
                    <input
                      type="checkbox"
                      checked={houseCommissionEnabled}
                      onChange={e => {
                        setHouseCommissionEnabled(e.target.checked);
                        showToast(`House Commission ${e.target.checked ? 'Enabled' : 'Disabled'}`);
                      }}
                    />
                    <span className="slider-round"></span>
                  </label>
                </div>

                <div className="admin-control-row">
                  <div className="control-info">
                    <h4>Commission Percentage</h4>
                    <p>Adjust house cut percentage per game (Default: 10%)</p>
                  </div>
                  <div className="slider-container">
                    <input
                      type="range"
                      min="1"
                      max="30"
                      step="1"
                      value={commissionRate}
                      className="admin-range-slider"
                      onChange={e => setCommissionRate(parseInt(e.target.value, 10))}
                    />
                    <span className="slider-val-badge">{commissionRate}%</span>
                  </div>
                </div>
              </div>

              <div className="admin-card">
                <div className="admin-card-header">
                  <h3 className="admin-card-title">
                    <i className="fa-solid fa-coins"></i> Game Staking & Layout
                  </h3>
                  <span className="admin-card-badge">Stakes: 10, 20, 50, 100 ETB</span>
                </div>

                <div className="admin-control-row">
                  <div className="control-info">
                    <h4>2+1 Cartela Bonus Promo</h4>
                    <p>A player who plays 2 or more cards receives 1 bonus card free</p>
                  </div>
                  <label className="admin-switch">
                    <input
                      type="checkbox"
                      checked={buy2Get1Bonus}
                      onChange={e => {
                        setBuy2Get1Bonus(e.target.checked);
                        showToast(`2+1 Cartela Bonus ${e.target.checked ? 'Enabled' : 'Disabled'}`);
                      }}
                    />
                    <span className="slider-round"></span>
                  </label>
                </div>

                <div className="admin-control-row">
                  <div className="control-info">
                    <h4>Vertical Playing Board Mode</h4>
                    <p>Switch master 75-ball board orientation to vertical layout</p>
                  </div>
                  <label className="admin-switch">
                    <input
                      type="checkbox"
                      checked={verticalBoardMode}
                      onChange={e => {
                        setVerticalBoardMode(e.target.checked);
                        showToast(`Vertical Board Layout ${e.target.checked ? 'Enabled' : 'Disabled'}`);
                      }}
                    />
                    <span className="slider-round"></span>
                  </label>
                </div>

                <div className="admin-control-row">
                  <div className="control-info">
                    <h4>Active Stake Chips</h4>
                    <p>Default stake options available on the player betting bar</p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {stakes.map(stk => (
                      <span key={stk} className="slider-val-badge">
                        {stk} ETB
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: 200+ BOT SIMULATION */}
          {activeTab === 'bots' && (
            <div className="tab-pane">
              <div className="admin-card">
                <div className="admin-card-header">
                  <h3 className="admin-card-title">
                    <i className="fa-solid fa-gamepad"></i> Live Player Size & Bot Control
                  </h3>
                  <span className="admin-card-badge">200+ Realistic Ethiopian Bots</span>
                </div>

                <div className="admin-control-row">
                  <div className="control-info">
                    <h4>Simulated Live Player Size</h4>
                    <p>Dynamically increase or decrease room player counter anytime</p>
                  </div>
                  <div className="slider-container">
                    <input
                      type="range"
                      min="20"
                      max="450"
                      step="5"
                      value={simulatedPlayerCount}
                      className="admin-range-slider"
                      onChange={e => setSimulatedPlayerCount(parseInt(e.target.value, 10))}
                    />
                    <span className="slider-val-badge">{simulatedPlayerCount} Players</span>
                  </div>
                </div>

                <div className="admin-control-row">
                  <div className="control-info">
                    <h4>Fake Bot Win Rate</h4>
                    <p>Percentage of simulated bot players winning pots to maintain excitement (30% default)</p>
                  </div>
                  <div className="slider-container">
                    <input
                      type="range"
                      min="5"
                      max="60"
                      step="5"
                      value={botWinRate}
                      className="admin-range-slider"
                      onChange={e => setBotWinRate(parseInt(e.target.value, 10))}
                    />
                    <span className="slider-val-badge">{botWinRate}%</span>
                  </div>
                </div>

                <div className="admin-control-row">
                  <div className="control-info">
                    <h4>Owner Target Winning Rate (RTP)</h4>
                    <p>Target house edge rate (20% default)</p>
                  </div>
                  <div className="slider-container">
                    <input
                      type="range"
                      min="5"
                      max="40"
                      step="1"
                      value={ownerWinTarget}
                      className="admin-range-slider"
                      onChange={e => setOwnerWinTarget(parseInt(e.target.value, 10))}
                    />
                    <span className="slider-val-badge">{ownerWinTarget}%</span>
                  </div>
                </div>
              </div>

              {/* Bots Directory Table */}
              <div className="admin-card">
                <div className="admin-card-header">
                  <h3 className="admin-card-title">
                    <i className="fa-solid fa-robot"></i> 200+ Active Bot Roster
                  </h3>
                  <input
                    type="text"
                    placeholder="Search bot names..."
                    value={botSearch}
                    onChange={e => setBotSearch(e.target.value)}
                    style={{
                      background: '#0f0724',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      color: '#fff',
                      fontSize: '0.8125rem'
                    }}
                  />
                </div>

                <div className="admin-table-wrapper" style={{ maxHeight: '380px' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Avatar</th>
                        <th>Bot Name</th>
                        <th>Phone</th>
                        <th>Cartelas Played</th>
                        <th>Wins</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBots.slice(0, 50).map(bot => (
                        <tr key={bot.id}>
                          <td style={{ fontSize: '1.2rem' }}>{bot.avatar}</td>
                          <td>
                            <strong>{bot.name}</strong>
                          </td>
                          <td style={{ color: '#94a3b8' }}>{bot.phone}</td>
                          <td>{bot.cartelasPlayed}</td>
                          <td style={{ color: '#facc15', fontWeight: 800 }}>{bot.winsCount} 🏆</td>
                          <td>
                            <span className="status-pill active">ONLINE SIMULATED</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: USERS & BONUSES */}
          {activeTab === 'users' && (
            <div className="tab-pane">
              <div className="admin-card">
                <div className="admin-card-header">
                  <h3 className="admin-card-title">
                    <i className="fa-solid fa-gift"></i> Incentive & Bonus Engine
                  </h3>
                  <span className="admin-card-badge">Instant Player Rewards</span>
                </div>

                <div className="admin-control-row">
                  <div className="control-info">
                    <h4>Registration Free Bonus</h4>
                    <p>Amount credited to every new signup (usable immediately without making a deposit)</p>
                  </div>
                  <div className="slider-container">
                    <input
                      type="range"
                      min="0"
                      max="50"
                      step="5"
                      value={registerBonus}
                      className="admin-range-slider"
                      onChange={e => setRegisterBonus(parseInt(e.target.value, 10))}
                    />
                    <span className="slider-val-badge">{registerBonus} ETB</span>
                  </div>
                </div>

                <div className="admin-control-row">
                  <div className="control-info">
                    <h4>Referral First Deposit Bonus</h4>
                    <p>Percentage of referee's first deposit credited as play-only bonus (non-withdrawable)</p>
                  </div>
                  <div className="slider-container">
                    <input
                      type="range"
                      min="5"
                      max="30"
                      step="5"
                      value={referralBonusRate}
                      className="admin-range-slider"
                      onChange={e => setReferralBonusRate(parseInt(e.target.value, 10))}
                    />
                    <span className="slider-val-badge">{referralBonusRate}%</span>
                  </div>
                </div>
              </div>

              {/* Users Management Table */}
              <div className="admin-card">
                <div className="admin-card-header">
                  <h3 className="admin-card-title">
                    <i className="fa-solid fa-users"></i> Registered Player Accounts
                  </h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Search player name or phone..."
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                      style={{
                        background: '#0f0724',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        color: '#fff',
                        fontSize: '0.8125rem'
                      }}
                    />
                    <button
                      className="btn-tbl-action btn-approve"
                      onClick={() => setShowAddUserModal(true)}
                    >
                      <i className="fa-solid fa-user-plus"></i> Add Player
                    </button>
                  </div>
                </div>

                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Player</th>
                        <th>Phone</th>
                        <th>Cash Balance</th>
                        <th>Bonus Wallet</th>
                        <th>Referrals</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(user => (
                        <tr key={user.id}>
                          <td>
                            <strong>{user.name}</strong>
                            <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>
                              Joined {user.createdAt}
                            </div>
                          </td>
                          <td>{user.phone}</td>
                          <td style={{ fontWeight: 800, color: '#4ade80' }}>
                            {user.balance.toFixed(2)} ETB
                          </td>
                          <td style={{ fontWeight: 800, color: '#c084fc' }}>
                            {user.bonus.toFixed(2)} ETB
                          </td>
                          <td>{user.referralCount}</td>
                          <td>
                            <span className={`status-pill ${user.status}`}>
                              {user.status.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn-tbl-action"
                              onClick={() => {
                                setAdjustTargetUser(user.id);
                                setAdjustAmount('100');
                              }}
                              title="Add / Deduct Balance"
                            >
                              <i className="fa-solid fa-coins"></i> Adjust
                            </button>
                            <button
                              className="btn-tbl-action btn-reject"
                              onClick={() => {
                                toggleUserStatus(user.id);
                                showToast(`Status toggled for ${user.name}`);
                              }}
                            >
                              {user.status === 'active' ? 'Suspend' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: 400 CARTELA CARDS */}
          {activeTab === 'cartelas' && (
            <div className="tab-pane">
              <div className="admin-card">
                <div className="admin-card-header">
                  <h3 className="admin-card-title">
                    <i className="fa-solid fa-layer-group"></i> 400 Serial Cartela Cards Library
                  </h3>
                  <input
                    type="text"
                    placeholder="Search Card Serial (e.g. LB-0042)..."
                    value={cartelaSearch}
                    onChange={e => setCartelaSearch(e.target.value)}
                    style={{
                      background: '#0f0724',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      color: '#fff',
                      fontSize: '0.8125rem'
                    }}
                  />
                </div>

                <div className="cartela-grid-browser">
                  {filteredCartelas.slice(0, 60).map(card => (
                    <div key={card.id} className="mini-cartela-card">
                      <div className="mini-cartela-header">
                        <span>Card #{card.id}</span>
                        <span>{card.serialNumber}</span>
                      </div>
                      <div className="mini-grid-5x5">
                        {card.grid.map((num, idx) => (
                          <div key={idx} className={`mini-cell ${num === 0 ? 'free' : ''}`}>
                            {num === 0 ? '★' : num}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="admin-pin-overlay" style={{ position: 'fixed', inset: 0, zIndex: 1000 }}>
          <div className="admin-pin-card" style={{ maxWidth: '440px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '16px' }}>
              Add New Player Account
            </h3>
            <form onSubmit={handleCreateUser}>
              <div style={{ marginBottom: '12px', textAlign: 'left' }}>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  placeholder="e.g. Dawit Kebede"
                  style={{ width: '100%', padding: '10px', background: '#0f0724', border: '1px solid #7c3aed', borderRadius: '8px', color: '#fff' }}
                />
              </div>

              <div style={{ marginBottom: '12px', textAlign: 'left' }}>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={newUserPhone}
                  onChange={e => setNewUserPhone(e.target.value)}
                  placeholder="0911223344"
                  style={{ width: '100%', padding: '10px', background: '#0f0724', border: '1px solid #7c3aed', borderRadius: '8px', color: '#fff' }}
                />
              </div>

              <div style={{ marginBottom: '20px', textAlign: 'left' }}>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Initial Deposit (ETB)
                </label>
                <input
                  type="number"
                  value={newUserBalance}
                  onChange={e => setNewUserBalance(e.target.value)}
                  style={{ width: '100%', padding: '10px', background: '#0f0724', border: '1px solid #7c3aed', borderRadius: '8px', color: '#fff' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="btn-pin-cancel"
                  onClick={() => setShowAddUserModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-pin-unlock">
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Balance Modal */}
      {adjustTargetUser && (
        <div className="admin-pin-overlay" style={{ position: 'fixed', inset: 0, zIndex: 1000 }}>
          <div className="admin-pin-card" style={{ maxWidth: '400px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '16px' }}>
              Adjust User Balance
            </h3>
            <div style={{ marginBottom: '14px', textAlign: 'left' }}>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                Amount (+ to add, - to deduct)
              </label>
              <input
                type="number"
                value={adjustAmount}
                onChange={e => setAdjustAmount(e.target.value)}
                style={{ width: '100%', padding: '10px', background: '#0f0724', border: '1px solid #7c3aed', borderRadius: '8px', color: '#fff' }}
              />
            </div>

            <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-start' }}>
              <input
                type="checkbox"
                id="adjustBonus"
                checked={adjustIsBonus}
                onChange={e => setAdjustIsBonus(e.target.checked)}
              />
              <label htmlFor="adjustBonus" style={{ fontSize: '0.8125rem', color: '#cbd5e1' }}>
                Apply to Play-Only Bonus Wallet
              </label>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn-pin-cancel"
                onClick={() => setAdjustTargetUser(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-pin-unlock"
                onClick={handleApplyAdjustment}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
