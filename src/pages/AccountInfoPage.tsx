import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { TelebirrLogo, CBELogo } from '../components/wallet/PaymentLogos.tsx';

interface AttachedAccount {
  id: string;
  type: 'Telebirr' | 'CBE';
  name: string;
  accountNumber: string;
  isDefault: boolean;
  isVerified: boolean;
}

export const AccountInfoPage: React.FC = () => {
  const { switchPage, showToast } = useApp();

  const [fullName, setFullName] = useState<string>('Eyu Ase');
  const [isEditingName, setIsEditingName] = useState<boolean>(false);

  // Telegram Account Linking State
  const [telegramUsername, setTelegramUsername] = useState<string>('eyu_ase');
  const [isEditingTelegram, setIsEditingTelegram] = useState<boolean>(false);
  const [tempTelegramInput, setTempTelegramInput] = useState<string>('eyu_ase');

  // Attached Accounts List (Telebirr & CBE ONLY)
  const [attachedAccounts, setAttachedAccounts] = useState<AttachedAccount[]>([
    {
      id: 'acc-1',
      type: 'Telebirr',
      name: 'Primary Telebirr',
      accountNumber: '0983624574',
      isDefault: true,
      isVerified: true
    },
    {
      id: 'acc-2',
      type: 'CBE',
      name: 'Commercial Bank of Ethiopia',
      accountNumber: '100098983344',
      isDefault: false,
      isVerified: true
    }
  ]);

  // New Account Form State (Telebirr & CBE ONLY)
  const [showAddAccount, setShowAddAccount] = useState<boolean>(false);
  const [newAccType, setNewAccType] = useState<'Telebirr' | 'CBE'>('Telebirr');
  const [newAccName, setNewAccName] = useState<string>('Eyu Ase');
  const [newAccNumber, setNewAccNumber] = useState<string>('');

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`📋 Copied ${label}: ${text}`);
  };

  const handleSaveName = () => {
    setIsEditingName(false);
    showToast('✅ Full Name updated successfully!');
  };

  const handleLinkTelegram = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = tempTelegramInput.trim().replace(/^@/, '');
    if (!cleanUsername) {
      showToast('⚠️ Please enter your Telegram username or ID.');
      return;
    }
    setTelegramUsername(cleanUsername);
    setIsEditingTelegram(false);
    showToast(`✅ Telegram account @${cleanUsername} linked & verified!`);
  };

  const handleSetDefault = (id: string) => {
    setAttachedAccounts(prev =>
      prev.map(acc => ({
        ...acc,
        isDefault: acc.id === id
      }))
    );
    showToast('⭐ Default payout account updated!');
  };

  const handleRemoveAccount = (id: string) => {
    if (attachedAccounts.length <= 1) {
      showToast('⚠️ You must have at least one attached payout account.');
      return;
    }
    setAttachedAccounts(prev => prev.filter(a => a.id !== id));
    showToast('🗑️ Attached account removed.');
  };

  const handleAddNewAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccNumber || newAccNumber.trim().length < 8) {
      showToast('⚠️ Please enter a valid account or phone number.');
      return;
    }

    const newAcc: AttachedAccount = {
      id: `acc-${Date.now()}`,
      type: newAccType,
      name: newAccName || `${newAccType} Account`,
      accountNumber: newAccNumber.trim(),
      isDefault: false,
      isVerified: true
    };

    setAttachedAccounts(prev => [...prev, newAcc]);
    setShowAddAccount(false);
    setNewAccNumber('');
    showToast(`✅ ${newAccType} account attached successfully!`);
  };

  return (
    <div className="page active page-subpage-dedicated" id="page-account-info">
      {/* Top Back Navigation Bar */}
      <div className="subpage-back-header">
        <button
          type="button"
          className="btn-subpage-back"
          onClick={() => switchPage('profile')}
        >
          <i className="fa-solid fa-chevron-left"></i>
          <span>Profile</span>
        </button>
        <h2 className="subpage-header-title">Account Information</h2>
        <div style={{ width: '40px' }}></div>
      </div>

      <div className="subpage-content-scroll">
        {/* 1. Identity & VIP Badge Hero Card */}
        <div className="user-kyc-hero-box">
          <div className="kyc-avatar-wrap">
            <span className="avatar-letters">EA</span>
            <span className="kyc-verified-badge" title="KYC Level 1 Verified">
              <i className="fa-solid fa-circle-check"></i>
            </span>
          </div>

          <div className="kyc-user-details-col">
            <div className="user-name-edit-row">
              {isEditingName ? (
                <div className="name-edit-input-wrap">
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="input-inline-name"
                  />
                  <button type="button" className="btn-save-name-tiny" onClick={handleSaveName}>
                    Save
                  </button>
                </div>
              ) : (
                <div className="name-display-row">
                  <strong className="user-full-name">{fullName}</strong>
                  <button
                    type="button"
                    className="btn-pencil-edit-name"
                    onClick={() => setIsEditingName(true)}
                    title="Edit Name"
                  >
                    <i className="fa-solid fa-pen"></i>
                  </button>
                </div>
              )}
            </div>

            <div className="user-meta-chips-row">
              <span className="meta-vip-tier-chip">
                <i className="fa-solid fa-crown gold"></i> VIP Level 2 • Lemon Gold
              </span>
              <span className="meta-kyc-chip">
                <i className="fa-solid fa-shield-halved green"></i> Level 1 KYC
              </span>
            </div>
          </div>
        </div>

        {/* 2. Telegram Account Link & Verification Card */}
        <div className="info-section-group">
          <span className="info-group-title">
            <i className="fa-brands fa-telegram telegram-color"></i> LINKED TELEGRAM ACCOUNT
          </span>

          <div className="telegram-linking-card">
            <div className="tg-card-top-row">
              <div className="tg-logo-name-wrap">
                <i className="fa-brands fa-telegram tg-card-icon"></i>
                <div>
                  <strong className="tg-card-title">Telegram Mini App Account</strong>
                  <span className="tg-card-sub">Used for instant win notifications & bot alerts</span>
                </div>
              </div>

              {!isEditingTelegram && (
                <button
                  type="button"
                  className="btn-change-tg"
                  onClick={() => {
                    setTempTelegramInput(telegramUsername);
                    setIsEditingTelegram(true);
                  }}
                >
                  {telegramUsername ? 'Change' : '+ Add'}
                </button>
              )}
            </div>

            {isEditingTelegram ? (
              <form className="tg-edit-form" onSubmit={handleLinkTelegram}>
                <div className="tg-input-wrapper">
                  <span className="tg-at-symbol">@</span>
                  <input
                    type="text"
                    value={tempTelegramInput}
                    onChange={e => setTempTelegramInput(e.target.value)}
                    placeholder="your_telegram_username"
                    required
                  />
                </div>
                <div className="tg-form-btns-row">
                  <button type="submit" className="btn-tg-verify-save">
                    <i className="fa-solid fa-link"></i> Link & Verify Telegram
                  </button>
                  <button
                    type="button"
                    className="btn-tg-cancel"
                    onClick={() => setIsEditingTelegram(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="tg-status-display-row">
                <strong className="tg-handle-txt">@{telegramUsername}</strong>
                <span className="tg-connected-badge">
                  <i className="fa-solid fa-circle-check"></i> Connected & Verified
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 3. Attached Payout Accounts (Telebirr & CBE ONLY with Official Logos) */}
        <div className="info-section-group">
          <div className="section-title-with-btn">
            <span className="info-group-title">
              <i className="fa-solid fa-wallet gold"></i> ATTACHED PAYOUT ACCOUNTS
            </span>
            <button
              type="button"
              className="btn-attach-new-acc"
              onClick={() => setShowAddAccount(!showAddAccount)}
            >
              <i className="fa-solid fa-plus"></i> Attach Account
            </button>
          </div>

          {/* Add New Account Form (Telebirr & CBE ONLY) */}
          {showAddAccount && (
            <form className="add-attached-acc-form" onSubmit={handleAddNewAccount}>
              <div className="form-head-title">Attach Telebirr or CBE Bank Account</div>

              {/* 2-Option Selector with Official Logos */}
              <div className="add-acc-type-selector-two">
                <button
                  type="button"
                  className={`btn-type-card-logo ${newAccType === 'Telebirr' ? 'active' : ''}`}
                  onClick={() => setNewAccType('Telebirr')}
                >
                  <TelebirrLogo size={24} />
                  <span className="type-card-label">Telebirr</span>
                  {newAccType === 'Telebirr' && <i className="fa-solid fa-circle-check check-dot"></i>}
                </button>

                <button
                  type="button"
                  className={`btn-type-card-logo ${newAccType === 'CBE' ? 'active' : ''}`}
                  onClick={() => setNewAccType('CBE')}
                >
                  <CBELogo size={24} />
                  <span className="type-card-label">CBE Bank</span>
                  {newAccType === 'CBE' && <i className="fa-solid fa-circle-check check-dot"></i>}
                </button>
              </div>

              <div className="field-input-box" style={{ marginTop: '8px' }}>
                <i className="fa-solid fa-user field-icon"></i>
                <input
                  type="text"
                  value={newAccName}
                  onChange={e => setNewAccName(e.target.value)}
                  placeholder="Account Holder Full Name"
                  required
                />
              </div>

              <div className="field-input-box" style={{ marginTop: '8px' }}>
                <i className={`fa-solid ${newAccType === 'Telebirr' ? 'fa-mobile-screen' : 'fa-building-columns'} field-icon`}></i>
                <input
                  type="text"
                  value={newAccNumber}
                  onChange={e => setNewAccNumber(e.target.value)}
                  placeholder={newAccType === 'Telebirr' ? 'Telebirr Phone Number (e.g. 0911234567)' : 'CBE Bank Account Number'}
                  required
                />
              </div>

              <div className="add-acc-actions-row">
                <button type="submit" className="btn-confirm-add-acc">
                  <i className="fa-solid fa-check"></i> Save & Attach Account
                </button>
                <button
                  type="button"
                  className="btn-cancel-add-acc"
                  onClick={() => setShowAddAccount(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* List of Attached Accounts with Logos */}
          <div className="attached-accounts-list">
            {attachedAccounts.map(acc => (
              <div key={acc.id} className={`attached-account-card ${acc.isDefault ? 'default-card' : ''}`}>
                <div className="attached-acc-logo-wrap">
                  {acc.type === 'Telebirr' ? (
                    <TelebirrLogo size={28} />
                  ) : (
                    <CBELogo size={28} />
                  )}
                </div>

                <div className="attached-acc-info-col">
                  <div className="acc-name-badge-row">
                    <strong className="acc-type-title">{acc.name}</strong>
                    {acc.isDefault && <span className="default-payout-pill">⭐ Default Payout</span>}
                  </div>
                  <span className="acc-num-mono">{acc.accountNumber}</span>
                </div>

                <div className="attached-acc-actions-col">
                  {!acc.isDefault && (
                    <button
                      type="button"
                      className="btn-set-default"
                      onClick={() => handleSetDefault(acc.id)}
                      title="Set as Default Payout Method"
                    >
                      Set Default
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-trash-acc"
                    onClick={() => handleRemoveAccount(acc.id)}
                    title="Remove Account"
                  >
                    <i className="fa-regular fa-trash-can"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Credentials & Registration Details Strip */}
        <div className="info-section-group">
          <span className="info-group-title">
            <i className="fa-solid fa-shield gold"></i> CREDENTIALS & SECURITY
          </span>

          <div className="credentials-grid-strip">
            <div className="cred-item-box">
              <span className="cred-lbl">USER ID</span>
              <div className="cred-val-copy-row">
                <strong className="cred-mono">UID-8839201</strong>
                <button
                  type="button"
                  className="btn-cred-copy"
                  onClick={() => handleCopy('UID-8839201', 'User ID')}
                >
                  <i className="fa-regular fa-copy"></i>
                </button>
              </div>
            </div>

            <div className="cred-item-box">
              <span className="cred-lbl">PHONE NUMBER</span>
              <div className="cred-val-copy-row">
                <strong className="cred-mono">+251 98 362 4574</strong>
                <span className="verified-dot-tag">✓ Verified</span>
              </div>
            </div>

            <div className="cred-item-box">
              <span className="cred-lbl">ACTIVE DEVICE</span>
              <span className="cred-val-txt">Telegram Mini App (Web)</span>
            </div>

            <div className="cred-item-box">
              <span className="cred-lbl">REGISTERED</span>
              <span className="cred-val-txt">August 14, 2026</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
