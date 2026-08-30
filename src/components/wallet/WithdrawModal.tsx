import React, { useState } from 'react';
import { useWallet } from '../../context/WalletContext.tsx';
import { useApp } from '../../context/AppContext.tsx';
import { useAdmin } from '../../context/AdminContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { TelebirrLogo, CBELogo } from './PaymentLogos.tsx';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({ isOpen, onClose }) => {
  const { balance, deductBalance } = useWallet();
  const { showToast, switchPage } = useApp();
  const { addWithdrawRequest } = useAdmin();
  const { t } = useLanguage();

  const [selectedMethod, setSelectedMethod] = useState<'Telebirr' | 'CBE'>('Telebirr');
  const [amount, setAmount] = useState<number>(200);
  const [accountHolder, setAccountHolder] = useState<string>('Eyu Ase');
  const [accountNumber, setAccountNumber] = useState<string>('0911234567');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [submittedRef, setSubmittedRef] = useState<string>('');

  if (!isOpen) return null;

  const quickAmounts = [100, 200, 500, 1000, 5000];

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (amount < 50) {
      showToast('⚠️ Minimum withdrawal amount is 50 ETB.');
      return;
    }

    if (amount > 25000) {
      showToast('⚠️ Maximum withdrawal limit is 25,000 ETB per request.');
      return;
    }

    if (amount > balance) {
      showToast('❌ Insufficient balance for withdrawal.');
      return;
    }

    if (!accountNumber || accountNumber.trim().length < 9) {
      showToast('⚠️ Please enter a valid account or phone number.');
      return;
    }

    // Deduct player balance
    const success = deductBalance(amount);
    if (!success) {
      showToast('❌ Failed to process withdrawal from balance.');
      return;
    }

    const assignedRef = `WD-${selectedMethod === 'Telebirr' ? 'TB' : 'CBE'}-${Math.floor(100000 + Math.random() * 900000)}`;

    // Submit to Admin Cashier Settlement Desk
    addWithdrawRequest(
      'usr-me',
      accountHolder || 'Eyu Ase',
      accountNumber,
      amount,
      selectedMethod,
      accountNumber
    );

    setSubmittedRef(assignedRef);
    setIsSubmitted(true);
    showToast(`💸 Withdrawal request of ${amount} ETB submitted!`);
  };

  const handleResetAndClose = () => {
    setIsSubmitted(false);
    onClose();
  };

  const handleViewHistory = () => {
    handleResetAndClose();
    switchPage('wallet');
  };

  return (
    <div className="custom-modal-backdrop" onClick={handleResetAndClose}>
      <div className="fresh-payment-modal-card" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="payment-modal-header">
          <div className="payment-modal-title-group">
            <div className="modal-title-icon red">
              <i className="fa-solid fa-arrow-up-from-bracket"></i>
            </div>
            <div className="modal-title-texts">
              <h3 className="modal-heading">{isSubmitted ? 'Withdrawal Submitted' : 'Withdraw Funds'}</h3>
              <span className="modal-subheading">Fast settlement to Telebirr or CBE Bank</span>
            </div>
          </div>

          <button
            type="button"
            className="btn-modal-close"
            onClick={handleResetAndClose}
            title="Close"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {isSubmitted ? (
          /* Success Confirmation View */
          <div className="payment-success-content">
            <div className="success-icon-circle green">
              <i className="fa-solid fa-check"></i>
            </div>

            <h3 className="success-main-title">Payout Request Submitted!</h3>
            <p className="success-subtext">
              Your cashout of <strong>{amount.toFixed(2)} ETB</strong> to <strong>{selectedMethod} ({accountNumber})</strong> has been received by our 24/7 cashier desk.
            </p>

            <div className="success-ref-box">
              <span className="ref-box-lbl">PAYOUT REFERENCE</span>
              <strong className="ref-box-val">{submittedRef}</strong>
            </div>

            <div className="success-eta-tag">
              <i className="fa-solid fa-clock gold"></i>
              <span>Estimated processing time: <strong>~1 to 3 minutes</strong></span>
            </div>

            <div className="success-actions-row">
              <button
                type="button"
                className="btn-payment-action-gold"
                onClick={handleViewHistory}
              >
                <span>View in Withdrawal History</span>
                <i className="fa-solid fa-arrow-right"></i>
              </button>

              <button
                type="button"
                className="btn-payment-action-outline"
                onClick={handleResetAndClose}
              >
                <span>Done</span>
              </button>
            </div>
          </div>
        ) : (
          /* Withdrawal Form */
          <form className="payment-modal-form" onSubmit={handleWithdrawSubmit}>
            {/* Available Balance Banner */}
            <div className="withdraw-balance-banner">
              <div className="balance-banner-left">
                <span className="balance-banner-lbl">Withdrawable Balance</span>
                <strong className="balance-banner-val">{balance.toFixed(2)} ETB</strong>
              </div>
              <div className="balance-banner-limits">
                <span>Min: 50 ETB</span>
                <span>Max: 25,000 ETB</span>
              </div>
            </div>

            {/* 1. Payment Method Selection */}
            <div className="form-section-block">
              <label className="form-section-label">
                <span className="step-num">1</span> Choose Payout Method
              </label>

              <div className="payment-method-selector-grid">
                <button
                  type="button"
                  className={`btn-payment-method-card ${selectedMethod === 'Telebirr' ? 'active' : ''}`}
                  onClick={() => setSelectedMethod('Telebirr')}
                >
                  <div className="method-logo-wrap">
                    <TelebirrLogo size={24} />
                  </div>
                  <div className="method-text-col">
                    <strong className="method-name">Telebirr Payout</strong>
                    <span className="method-badge-fast">⚡ Instant (1-3 min)</span>
                  </div>
                  <div className="method-radio-circ">
                    {selectedMethod === 'Telebirr' && <div className="radio-dot"></div>}
                  </div>
                </button>

                <button
                  type="button"
                  className={`btn-payment-method-card ${selectedMethod === 'CBE' ? 'active' : ''}`}
                  onClick={() => setSelectedMethod('CBE')}
                >
                  <div className="method-logo-wrap">
                    <CBELogo size={24} />
                  </div>
                  <div className="method-text-col">
                    <strong className="method-name">CBE Bank Payout</strong>
                    <span className="method-badge-fast">Direct Bank Transfer</span>
                  </div>
                  <div className="method-radio-circ">
                    {selectedMethod === 'CBE' && <div className="radio-dot"></div>}
                  </div>
                </button>
              </div>
            </div>

            {/* 2. Amount Selection */}
            <div className="form-section-block">
              <div className="section-label-row">
                <label className="form-section-label">
                  <span className="step-num">2</span> Withdrawal Amount
                </label>
                <button
                  type="button"
                  className="btn-max-all-balance"
                  onClick={() => setAmount(Math.min(balance, 25000))}
                >
                  Max All
                </button>
              </div>

              {/* Preset Chips */}
              <div className="amount-preset-chips-grid">
                {quickAmounts.map(chip => (
                  <button
                    key={chip}
                    type="button"
                    className={`btn-amount-chip ${amount === chip ? 'active' : ''}`}
                    onClick={() => setAmount(chip)}
                  >
                    {chip} ETB
                  </button>
                ))}
              </div>

              {/* Numeric Input */}
              <div className="amount-numeric-input-wrap">
                <span className="currency-tag">ETB</span>
                <input
                  type="number"
                  min="50"
                  max={Math.min(balance, 25000)}
                  value={amount || ''}
                  onChange={e => setAmount(Number(e.target.value))}
                  placeholder="Enter amount"
                  required
                />
              </div>
            </div>

            {/* 3. Destination Account Details */}
            <div className="form-section-block">
              <label className="form-section-label">
                <span className="step-num">3</span> Destination Account
              </label>

              <div className="input-field-group">
                <label className="field-tiny-label">Account Holder Full Name</label>
                <div className="field-input-box">
                  <i className="fa-solid fa-user field-icon"></i>
                  <input
                    type="text"
                    value={accountHolder}
                    onChange={e => setAccountHolder(e.target.value)}
                    placeholder="Full Name"
                    required
                  />
                </div>
              </div>

              <div className="input-field-group" style={{ marginTop: '8px' }}>
                <label className="field-tiny-label">
                  {selectedMethod === 'Telebirr' ? 'Telebirr Mobile Number' : 'CBE Account Number'}
                </label>
                <div className="field-input-box">
                  <i className={`fa-solid ${selectedMethod === 'Telebirr' ? 'fa-mobile-screen' : 'fa-building-columns'} field-icon`}></i>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={e => setAccountNumber(e.target.value)}
                    placeholder={selectedMethod === 'Telebirr' ? '0911234567' : '100012345678'}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Terms & Security Notice */}
            <div className="withdraw-security-notice">
              <i className="fa-solid fa-shield-halved security-icon"></i>
              <span>24/7 automated settlement desk. No withdrawal fees.</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn-submit-payment-gold"
              disabled={amount < 50 || amount > balance}
            >
              <i className="fa-solid fa-money-bill-transfer"></i>
              <span>Confirm & Withdraw {amount > 0 ? `${amount} ETB` : ''}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
