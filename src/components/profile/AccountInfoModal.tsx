import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { TelebirrLogo, CBELogo } from '../wallet/PaymentLogos.tsx';

interface AccountInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AttachedAccount {
  id: string;
  type: 'Telebirr' | 'CBE' | 'Awash' | 'Dashen';
  name: string;
  accountNumber: string;
  isDefault: boolean;
  isVerified: boolean;
}

export const AccountInfoModal: React.FC<AccountInfoModalProps> = ({ isOpen, onClose }) => {
  const { showToast } = useApp();

  const [fullName, setFullName] = useState<string>('Eyu Ase');
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [dailyLimit, setDailyLimit] = useState<number>(50000);

  // Attached Accounts List
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

  // New Account Form State
  const [showAddAccount, setShowAddAccount] = useState<boolean>(false);
  const [newAccType, setNewAccType] = useState<'Telebirr' | 'CBE' | 'Awash' | 'Dashen'>('CBE');
  const [newAccName, setNewAccName] = useState<string>('Eyu Ase');
  const [newAccNumber, setNewAccNumber] = useState<string>('');

  if (!isOpen) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`📋 Copied ${label}: ${text}`);
  };

  const handleSaveName = () => {
    setIsEditingName(false);
    showToast('✅ Full Name updated successfully!');
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
    <div className="custom-modal-backdrop" onClick={onClose}>
      <div className="fresh-payment-modal-card account-info-modal-card" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="payment-modal-header">
          <div className="payment-modal-title-group">
            <div className="modal-title-icon green">
              <i className="fa-solid fa-user-shield"></i>
            </div>
            <div className="modal-title-texts">
              <h3 className="modal-heading">Account Information</h3>
              <span className="modal-subheading">Identity, Attached Accounts & Security</span>
            </div>
          </div>

          <button type="button" className="btn-modal-close" onClick={onClose} title="Close">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="account-info-scroll-body">
          {/* 1. Identity & VIP Badge Card */}
          <div className="info-section-group">
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

            {/* Quick Credentials Strip */}
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
                <span className="cred-lbl">TELEGRAM ACCOUNT</span>
                <div className="cred-val-copy-row">
                  <strong className="cred-mono">@eyu_ase</strong>
                  <span className="verified-dot-tag">✓ Linked</span>
                </div>
              </div>

              <div className="cred-item-box">
                <span className="cred-lbl">REGISTERED</span>
                <span className="cred-val-txt">August 14, 2026</span>
              </div>
            </div>
          </div>

          {/* 2. Attached & Linked Payout Accounts (The Big Company Standard) */}
          <div className="info-section-group">
            <div className="section-title-with-btn">
              <span className="info-group-title">
                <i className="fa-solid fa-link gold"></i> ATTACHED PAYOUT ACCOUNTS
              </span>
              <button
                type="button"
                className="btn-attach-new-acc"
                onClick={() => setShowAddAccount(!showAddAccount)}
              >
                <i className="fa-solid fa-plus"></i> Attach Account
              </button>
            </div>

            {/* Add New Account Drawer / Form */}
            {showAddAccount && (
              <form className="add-attached-acc-form" onSubmit={handleAddNewAccount}>
                <div className="form-head-title">Attach New Payment Method</div>

                <div className="add-acc-type-selector">
                  {(['Telebirr', 'CBE', 'Awash', 'Dashen'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      className={`btn-type-chip ${newAccType === type ? 'active' : ''}`}
                      onClick={() => setNewAccType(type)}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                <div className="field-input-box" style={{ marginTop: '8px' }}>
                  <i className="fa-solid fa-id-card field-icon"></i>
                  <input
                    type="text"
                    value={newAccName}
                    onChange={e => setNewAccName(e.target.value)}
                    placeholder="Account Holder Full Name"
                    required
                  />
                </div>

                <div className="field-input-box" style={{ marginTop: '8px' }}>
                  <i className="fa-solid fa-credit-card field-icon"></i>
                  <input
                    type="text"
                    value={newAccNumber}
                    onChange={e => setNewAccNumber(e.target.value)}
                    placeholder={newAccType === 'Telebirr' ? 'Mobile Number (e.g. 0911234567)' : 'Bank Account Number'}
                    required
                  />
                </div>

                <div className="add-acc-actions-row">
                  <button type="submit" className="btn-confirm-add-acc">
                    <i className="fa-solid fa-check"></i> Save & Attach
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

            {/* List of Attached Accounts */}
            <div className="attached-accounts-list">
              {attachedAccounts.map(acc => (
                <div key={acc.id} className={`attached-account-card ${acc.isDefault ? 'default-card' : ''}`}>
                  <div className="attached-acc-logo-wrap">
                    {acc.type === 'Telebirr' ? (
                      <TelebirrLogo size={24} />
                    ) : (
                      <CBELogo size={24} />
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

          {/* 3. Responsible Gaming & Limits */}
          <div className="info-section-group">
            <span className="info-group-title">
              <i className="fa-solid fa-sliders gold"></i> RESPONSIBLE GAMING LIMITS
            </span>

            <div className="limits-settings-card">
              <div className="limit-row-item">
                <div className="limit-text-col">
                  <strong className="limit-name">Daily Deposit Limit</strong>
                  <span className="limit-sub">Control daily maximum deposits</span>
                </div>
                <span className="limit-amount-tag">{dailyLimit.toLocaleString()} ETB</span>
              </div>

              <input
                type="range"
                min="1000"
                max="100000"
                step="1000"
                value={dailyLimit}
                onChange={e => setDailyLimit(Number(e.target.value))}
                className="limit-range-slider"
              />

              <div className="slider-min-max-row">
                <span>1,000 ETB</span>
                <span>100,000 ETB</span>
              </div>
            </div>
          </div>
        </div>

        {/* Done Button */}
        <button type="button" className="btn-submit-payment-gold" onClick={onClose}>
          <span>Done</span>
        </button>
      </div>
    </div>
  );
};
