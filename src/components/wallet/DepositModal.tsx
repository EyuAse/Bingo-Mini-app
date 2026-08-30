import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { useAdmin } from '../../context/AdminContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { TelebirrLogo, CBELogo } from './PaymentLogos.tsx';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose }) => {
  const { showToast } = useApp();
  const { addDepositRequest } = useAdmin();
  const { t } = useLanguage();

  const [selectedMethod, setSelectedMethod] = useState<'Telebirr' | 'CBE'>('Telebirr');
  const [amount, setAmount] = useState<number>(200);
  const [playerPhone, setPlayerPhone] = useState<string>('0911234567');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [submittedRef, setSubmittedRef] = useState<string>('');

  if (!isOpen) return null;

  const quickAmounts = [50, 100, 200, 500, 1000, 2000];

  // Official Receiver Details
  const telebirrReceiverPhone = '0998983344';
  const cbeReceiverAccount = '100098983344';
  const receiverName = 'Mekonen Woldekidane';

  const activeReceiverNumber = selectedMethod === 'Telebirr' ? telebirrReceiverPhone : cbeReceiverAccount;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`📋 Copied ${label}: ${text}`);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('⚠️ Image size exceeds 5MB limit.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptImage(reader.result as string);
        showToast('📸 Receipt screenshot attached!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount < 50) {
      showToast('⚠️ Minimum deposit is 50 ETB.');
      return;
    }

    if (!playerPhone || playerPhone.trim().length < 9) {
      showToast('⚠️ Please enter your valid mobile number.');
      return;
    }

    const assignedRef = transactionRef.trim()
      ? transactionRef.trim().toUpperCase()
      : `${selectedMethod === 'Telebirr' ? 'TX-TB-' : 'TX-CBE-'}${Math.floor(100000 + Math.random() * 900000)}`;

    addDepositRequest(
      'usr-me',
      'Player (Me)',
      playerPhone,
      amount,
      selectedMethod,
      activeReceiverNumber,
      receiptImage || undefined,
      assignedRef
    );

    setSubmittedRef(assignedRef);
    setIsSubmitted(true);
    showToast(`🚀 Deposit request of ${amount} ETB submitted for verification!`);
  };

  const handleResetAndClose = () => {
    setIsSubmitted(false);
    setTransactionRef('');
    setReceiptImage(null);
    onClose();
  };

  return (
    <div className="custom-modal-backdrop" onClick={handleResetAndClose}>
      <div className="custom-modal-card wallet-deposit-card" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <i className="fa-solid fa-wallet modal-icon gold"></i>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#ffffff' }}>
                {isSubmitted ? 'Deposit Confirmation' : t('wallet.quickDeposit')}
              </h3>
              <span style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>
                Instant Telebirr & CBE Cashier Verification
              </span>
            </div>
          </div>
          <button className="modal-close-btn" onClick={handleResetAndClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {isSubmitted ? (
          /* ============================================================
             SUBMITTED STATUS CONFIRMATION SCREEN
             ============================================================ */
          <div className="deposit-success-view">
            <div className="status-pulse-circle">
              <i className="fa-solid fa-hourglass-half" style={{ color: '#facc15', fontSize: '2rem' }}></i>
            </div>

            <h4 style={{ color: '#ffffff', fontSize: '1.2rem', margin: '10px 0 4px' }}>
              Deposit Request Submitted!
            </h4>
            <p style={{ color: '#94a3b8', fontSize: '0.8125rem', maxWidth: '340px', margin: '0 auto 16px' }}>
              Our {selectedMethod} Cashier Desk is verifying your payment reference. Your wallet will be credited automatically.
            </p>

            <div className="receipt-summary-box">
              <div className="summary-line">
                <span>Amount:</span>
                <strong style={{ color: '#4ade80', fontSize: '1.1rem' }}>+{amount.toFixed(2)} ETB</strong>
              </div>
              <div className="summary-line">
                <span>Reference ID:</span>
                <strong style={{ fontFamily: 'monospace', color: '#facc15' }}>{submittedRef}</strong>
              </div>
              <div className="summary-line">
                <span>Sent To:</span>
                <span>{receiverName} ({activeReceiverNumber})</span>
              </div>
              <div className="summary-line">
                <span>Status:</span>
                <span className="status-pill pending">⏳ AWAITING VERIFICATION</span>
              </div>
            </div>

            <button
              type="button"
              className="btn-modal-submit"
              onClick={handleResetAndClose}
              style={{ marginTop: '16px' }}
            >
              <i className="fa-solid fa-check"></i> Done & Return to Game
            </button>
          </div>
        ) : (
          /* ============================================================
             MAIN CLEAN DEPOSIT FORM
             ============================================================ */
          <form onSubmit={handleDepositSubmit}>
            {/* 1. Payment Provider Selection with Real Official Logos */}
            <div className="payment-methods-grid">
              <div
                className={`payment-method-card ${selectedMethod === 'Telebirr' ? 'active' : ''}`}
                onClick={() => setSelectedMethod('Telebirr')}
              >
                <div className="pm-logo-wrap">
                  <TelebirrLogo size={32} />
                </div>
                <div className="pm-info">
                  <span className="pm-name">Telebirr</span>
                  <span className="pm-sub">0998983344</span>
                </div>
                <i className={`fa-solid ${selectedMethod === 'Telebirr' ? 'fa-circle-check active-check' : 'fa-circle'}`}></i>
              </div>

              <div
                className={`payment-method-card ${selectedMethod === 'CBE' ? 'active' : ''}`}
                onClick={() => setSelectedMethod('CBE')}
              >
                <div className="pm-logo-wrap">
                  <CBELogo size={32} />
                </div>
                <div className="pm-info">
                  <span className="pm-name">CBE Bank</span>
                  <span className="pm-sub">1000...</span>
                </div>
                <i className={`fa-solid ${selectedMethod === 'CBE' ? 'fa-circle-check active-check' : 'fa-circle'}`}></i>
              </div>
            </div>

            {/* 2. Official Receiver Card (Dynamic per Telebirr or CBE selection) */}
            <div className="official-receiver-card">
              <div className="receiver-header">
                <span className="receiver-tag">
                  <i className="fa-solid fa-shield-check" style={{ color: '#4ade80' }}></i> Verified Merchant Receiver
                </span>
                <span className="receiver-min-badge">Min: 50 ETB</span>
              </div>

              <div className="receiver-details-grid">
                <div className="receiver-item">
                  <span className="rcv-lbl">
                    {selectedMethod === 'Telebirr' ? 'Send Telebirr to:' : 'Send CBE Bank Transfer to:'}
                  </span>
                  <div className="rcv-copy-row">
                    <strong className="rcv-phone">{activeReceiverNumber}</strong>
                    <button
                      type="button"
                      className="btn-copy-mini"
                      onClick={() => handleCopy(activeReceiverNumber, selectedMethod === 'Telebirr' ? 'Telebirr Phone' : 'CBE Account Number')}
                    >
                      <i className="fa-regular fa-copy"></i> Copy
                    </button>
                  </div>
                </div>

                <div className="receiver-item">
                  <span className="rcv-lbl">Account Holder:</span>
                  <div className="rcv-copy-row">
                    <strong className="rcv-name">{receiverName}</strong>
                    <button
                      type="button"
                      className="btn-copy-mini"
                      onClick={() => handleCopy(receiverName, 'Account Name')}
                    >
                      <i className="fa-regular fa-copy"></i> Copy
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Quick Amount Preset Chips (Minimum 50 ETB) */}
            <div className="quick-amounts-label">
              <span>Select Deposit Amount</span>
              <span style={{ fontSize: '0.6875rem', color: '#facc15' }}>Min 50 ETB</span>
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

            {/* Custom Amount & Sender Phone */}
            <div className="input-duo-grid">
              <div className="modal-input-group">
                <label>Amount (ETB)</label>
                <input
                  type="number"
                  min="50"
                  required
                  value={amount}
                  onChange={e => setAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder="Min 50 ETB"
                />
              </div>

              <div className="modal-input-group">
                <label>Your Phone / Account</label>
                <input
                  type="text"
                  required
                  value={playerPhone}
                  onChange={e => setPlayerPhone(e.target.value)}
                  placeholder="0911234567"
                />
              </div>
            </div>

            {/* 4. Telebirr / CBE SMS Ref ID or Receipt Image Proof */}
            <div className="proof-submission-section">
              <div className="modal-input-group" style={{ marginBottom: '10px' }}>
                <label>
                  {selectedMethod === 'Telebirr' ? 'Telebirr SMS Transaction ID / Reference' : 'CBE Transaction / SMS Reference ID'}
                </label>
                <input
                  type="text"
                  value={transactionRef}
                  onChange={e => setTransactionRef(e.target.value)}
                  placeholder={selectedMethod === 'Telebirr' ? 'e.g. CFA492810 or SMS Reference' : 'e.g. FT2490182390 or CBE Ref'}
                />
              </div>

              {/* Upload Screenshot Dropzone */}
              <div className="receipt-upload-container">
                <label className="upload-label">
                  <i className="fa-solid fa-camera" style={{ color: '#c4b5fd' }}></i>
                  <span>Attach SMS / App Payment Screenshot (Optional)</span>
                </label>

                {receiptImage ? (
                  <div className="receipt-preview-box">
                    <img src={receiptImage} alt="Payment Receipt" className="receipt-thumb" />
                    <div className="preview-meta">
                      <span>✓ Receipt Screenshot Attached</span>
                      <button
                        type="button"
                        className="btn-remove-proof"
                        onClick={() => setReceiptImage(null)}
                      >
                        <i className="fa-solid fa-trash"></i> Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="receipt-dropzone">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                    <i className="fa-solid fa-cloud-arrow-up drop-icon"></i>
                    <span className="drop-text">Click or drag screenshot here</span>
                    <span className="drop-sub">JPG, PNG up to 5MB</span>
                  </label>
                )}
              </div>
            </div>

            {/* Prominent Submit Button */}
            <button
              type="submit"
              className="btn-modal-submit"
              disabled={amount < 50}
              style={{ marginTop: '16px', padding: '14px' }}
            >
              <i className="fa-solid fa-paper-plane"></i> Submit Deposit ({amount} ETB)
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
