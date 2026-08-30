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
  const { showToast } = useApp();
  const { addWithdrawRequest } = useAdmin();
  const { t } = useLanguage();

  const [selectedMethod, setSelectedMethod] = useState<'Telebirr' | 'CBE'>('Telebirr');
  const [amount, setAmount] = useState<number>(200);
  const [accountHolder, setAccountHolder] = useState<string>('Player');
  const [accountNumber, setAccountNumber] = useState<string>('0911234567');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  if (!isOpen) return null;

  const quickAmounts = [100, 200, 500, 1000, 5000, 10000];

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

    // Submit to Admin Cashier Settlement Desk
    addWithdrawRequest(
      'usr-me',
      accountHolder || 'Player',
      accountNumber,
      amount,
      selectedMethod,
      accountNumber
    );

    setIsSubmitted(true);
    showToast(`💸 Withdrawal request of ${amount} ETB submitted to Cashier Desk!`);
  };

  const handleResetAndClose = () => {
    setIsSubmitted(false);
    onClose();
  };

  return (
    <div className="custom-modal-backdrop" onClick={handleResetAndClose}>
      <div className="custom-modal-card wallet-deposit-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <i className="fa-solid fa-arrow-up-from-bracket modal-icon" style={{ color: '#f87171' }}></i>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#ffffff' }}>
                {isSubmitted ? 'Withdrawal Submitted' : t('wallet.instantCashOut')}
              </h3>
              <span style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>
                Fast Settlement to Telebirr or CBE Bank
              </span>
            </div>
          </div>
          <button className="modal-close-btn" onClick={handleResetAndClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {isSubmitted ? (
          /* Submission Confirmation */
          <div className="deposit-success-view">
            <div className="status-pulse-circle" style={{ borderColor: 'rgba(74, 222, 128, 0.4)' }}>
              <i className="fa-solid fa-check" style={{ color: '#4ade80', fontSize: '2rem' }}></i>
            </div>

            <h4 style={{ color: '#ffffff', fontSize: '1.2rem', margin: '10px 0 4px' }}>
              Withdrawal Order Dispatched!
            </h4>
            <p style={{ color: '#94a3b8', fontSize: '0.8125rem', maxWidth: '340px', margin: '0 auto 16px' }}>
              Our Telebirr/CBE Cashier Desk is processing your payout. Funds will arrive in your account shortly.
            </p>

            <div className="receipt-summary-box">
              <div className="summary-line">
                <span>Amount:</span>
                <strong style={{ color: '#f87171' }}>-{amount.toFixed(2)} ETB</strong>
              </div>
              <div className="summary-line">
                <span>Recipient:</span>
                <span>{accountHolder} ({accountNumber})</span>
              </div>
              <div className="summary-line">
                <span>Method:</span>
                <span>{selectedMethod}</span>
              </div>
              <div className="summary-line">
                <span>Status:</span>
                <span className="status-pill pending">⏳ SETTLEMENT IN PROGRESS</span>
              </div>
            </div>

            <button
              type="button"
              className="btn-modal-submit"
              onClick={handleResetAndClose}
              style={{ marginTop: '16px' }}
            >
              <i className="fa-solid fa-check"></i> Done & Return
            </button>
          </div>
        ) : (
          /* Main Withdraw Form */
          <form onSubmit={handleWithdrawSubmit}>
            {/* Available Balance Card */}
            <div className="withdraw-balance-banner">
              <div>
                <span className="w-label">{t('wallet.availableWithdraw')}</span>
                <span className="w-sub">Withdrawable Cash</span>
              </div>
              <span className="w-amount">{balance.toFixed(2)} ETB</span>
            </div>

            {/* Provider Selection */}
            <div className="payment-methods-grid">
              <div
                className={`payment-method-card ${selectedMethod === 'Telebirr' ? 'active' : ''}`}
                onClick={() => setSelectedMethod('Telebirr')}
              >
                <div className="pm-logo-wrap">
                  <TelebirrLogo size={36} />
                </div>
                <div className="pm-info">
                  <span className="pm-name">Telebirr</span>
                  <span className="pm-sub">Direct to Mobile</span>
                </div>
                <i className={`fa-solid ${selectedMethod === 'Telebirr' ? 'fa-circle-check active-check' : 'fa-circle'}`}></i>
              </div>

              <div
                className={`payment-method-card ${selectedMethod === 'CBE' ? 'active' : ''}`}
                onClick={() => setSelectedMethod('CBE')}
              >
                <div className="pm-logo-wrap">
                  <CBELogo size={36} />
                </div>
                <div className="pm-info">
                  <span className="pm-name">CBE Bank</span>
                  <span className="pm-sub">Direct Bank Payout</span>
                </div>
                <i className={`fa-solid ${selectedMethod === 'CBE' ? 'fa-circle-check active-check' : 'fa-circle'}`}></i>
              </div>
            </div>

            {/* Limits Info Tag */}
            <div className="withdraw-limits-notice">
              <span><i className="fa-solid fa-circle-info"></i> Min: <strong>50 ETB</strong> · Max: <strong>25,000 ETB</strong> per request</span>
            </div>

            {/* Quick Amount Chips */}
            <div className="quick-amounts-label">
              <span>Select Amount</span>
            </div>
            <div className="quick-amounts-row">
              {quickAmounts.map(val => (
                <button
                  type="button"
                  key={val}
                  className={`quick-amt-chip ${amount === val ? 'active' : ''}`}
                  onClick={() => setAmount(val)}
                >
                  {val} ETB
                </button>
              ))}
            </div>

            {/* Amount & Account Inputs */}
            <div className="input-duo-grid">
              <div className="modal-input-group">
                <label>Payout Amount (ETB)</label>
                <input
                  type="number"
                  min="50"
                  max="25000"
                  required
                  value={amount}
                  onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                  placeholder="Min 50, Max 25,000"
                />
              </div>

              <div className="modal-input-group">
                <label>Account Holder Name</label>
                <input
                  type="text"
                  required
                  value={accountHolder}
                  onChange={e => setAccountHolder(e.target.value)}
                  placeholder="Full Legal Name"
                />
              </div>
            </div>

            <div className="modal-input-group" style={{ marginTop: '10px' }}>
              <label>
                {selectedMethod === 'Telebirr' ? 'Telebirr Phone Number' : 'CBE Bank Account Number'}
              </label>
              <input
                type="text"
                required
                value={accountNumber}
                onChange={e => setAccountNumber(e.target.value)}
                placeholder={selectedMethod === 'Telebirr' ? '09...' : '1000...'}
              />
            </div>

            <button
              type="submit"
              className="btn-modal-submit btn-modal-withdraw"
              disabled={amount < 50 || amount > 25000 || amount > balance}
              style={{ marginTop: '14px' }}
            >
              <i className="fa-solid fa-arrow-down-left"></i> Confirm Cash Out ({amount} ETB)
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
