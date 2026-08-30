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
  const { showToast, switchPage } = useApp();
  const { addDepositRequest } = useAdmin();
  const { t } = useLanguage();

  const [selectedMethod, setSelectedMethod] = useState<'Telebirr' | 'CBE'>('Telebirr');
  const [amount, setAmount] = useState<number>(100);
  const [playerPhone, setPlayerPhone] = useState<string>('0911234567');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [submittedRef, setSubmittedRef] = useState<string>('');

  if (!isOpen) return null;

  // Official Receiver Details
  const telebirrReceiverPhone = '0998983344';
  const cbeReceiverAccount = '100098983344';
  const receiverName = 'Mekonen Woldekidane';

  const activeReceiverNumber = selectedMethod === 'Telebirr' ? telebirrReceiverPhone : cbeReceiverAccount;
  const quickAmounts = [50, 100, 200, 500, 1000, 5000];

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`📋 Copied ${label}: ${text}`);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const rawResult = event.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1000;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.85);
            setReceiptImage(compressed);
            showToast('📸 Screenshot attached!');
          } else {
            setReceiptImage(rawResult);
            showToast('📸 Screenshot attached!');
          }
        };
        img.src = rawResult;
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
      assignedRef,
      receiptImage || undefined
    );

    setSubmittedRef(assignedRef);
    setIsSubmitted(true);
    showToast(`✅ Deposit request of ${amount} ETB submitted!`);
  };

  const handleResetAndClose = () => {
    setIsSubmitted(false);
    setTransactionRef('');
    setReceiptImage(null);
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
            <div className="modal-title-icon green">
              <i className="fa-solid fa-arrow-down"></i>
            </div>
            <div className="modal-title-texts">
              <h3 className="modal-heading">{isSubmitted ? 'Deposit Submitted' : 'Deposit Funds'}</h3>
              <span className="modal-subheading">Instant automated cashier credit</span>
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

            <h3 className="success-main-title">Deposit Request Received!</h3>
            <p className="success-subtext">
              Your deposit of <strong>{amount.toFixed(2)} ETB</strong> via <strong>{selectedMethod}</strong> is being verified by our automated cashier desk.
            </p>

            <div className="success-ref-box">
              <span className="ref-box-lbl">TRANSACTION ID</span>
              <strong className="ref-box-val">{submittedRef}</strong>
              <button
                type="button"
                className="btn-copy-ref-success"
                onClick={() => handleCopy(submittedRef, 'Transaction ID')}
              >
                <i className="fa-regular fa-copy"></i> Copy
              </button>
            </div>

            <div className="success-eta-tag">
              <i className="fa-solid fa-bolt gold"></i>
              <span>Average verification time: <strong>~30 seconds</strong></span>
            </div>

            <div className="success-actions-row">
              <button
                type="button"
                className="btn-payment-action-gold"
                onClick={handleViewHistory}
              >
                <span>View in Deposit History</span>
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
          /* Deposit Form */
          <form className="payment-modal-form" onSubmit={handleDepositSubmit}>
            {/* 1. Payment Method Selection */}
            <div className="form-section-block">
              <label className="form-section-label">
                <span className="step-num">1</span> Choose Payment Method
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
                    <strong className="method-name">Telebirr</strong>
                    <span className="method-badge-fast">⚡ Instant</span>
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
                    <strong className="method-name">CBE Bank</strong>
                    <span className="method-badge-fast">CBE Birr / Bank</span>
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
                  <span className="step-num">2</span> Deposit Amount
                </label>
                <span className="min-limit-sub">Min: 50 ETB</span>
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
                  max="100000"
                  value={amount || ''}
                  onChange={e => setAmount(Number(e.target.value))}
                  placeholder="Enter amount"
                  required
                />
              </div>
            </div>

            {/* 3. Official Receiver Account Details */}
            <div className="form-section-block">
              <label className="form-section-label">
                <span className="step-num">3</span> Send Payment To
              </label>

              <div className="deposit-receiver-callout">
                <div className="receiver-top-row">
                  <span className="receiver-provider-tag">{selectedMethod} Official Account</span>
                  <button
                    type="button"
                    className="btn-copy-receiver"
                    onClick={() => handleCopy(activeReceiverNumber, selectedMethod)}
                  >
                    <i className="fa-regular fa-copy"></i> Copy
                  </button>
                </div>

                <div className="receiver-number-display">
                  <span className="receiver-num-bold">{activeReceiverNumber}</span>
                </div>

                <div className="receiver-name-row">
                  <span className="receiver-name-lbl">Account Name:</span>
                  <strong className="receiver-name-val">{receiverName}</strong>
                </div>

                <p className="receiver-note-sub">
                  Transfer exact amount from your {selectedMethod} app, then enter the SMS reference below.
                </p>
              </div>
            </div>

            {/* 4. Verification & Submission */}
            <div className="form-section-block">
              <label className="form-section-label">
                <span className="step-num">4</span> Verification Details
              </label>

              <div className="input-field-group">
                <label className="field-tiny-label">Your Phone Number</label>
                <div className="field-input-box">
                  <i className="fa-solid fa-phone field-icon"></i>
                  <input
                    type="tel"
                    value={playerPhone}
                    onChange={e => setPlayerPhone(e.target.value)}
                    placeholder="0911234567"
                    required
                  />
                </div>
              </div>

              <div className="input-field-group" style={{ marginTop: '8px' }}>
                <label className="field-tiny-label">
                  SMS Transaction ID / Reference (Optional for Instant Match)
                </label>
                <div className="field-input-box">
                  <i className="fa-solid fa-receipt field-icon"></i>
                  <input
                    type="text"
                    value={transactionRef}
                    onChange={e => setTransactionRef(e.target.value)}
                    placeholder="e.g. TX-TB-123456 or FT24..."
                  />
                </div>
              </div>

              {/* Optional Screenshot Attachment */}
              <div className="proof-upload-pill" style={{ marginTop: '8px' }}>
                <input
                  type="file"
                  id="deposit-receipt-file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
                <label htmlFor="deposit-receipt-file" className="btn-upload-label">
                  <i className="fa-solid fa-camera"></i>
                  <span>{receiptImage ? 'Change Screenshot' : 'Attach Receipt Screenshot (Optional)'}</span>
                </label>

                {receiptImage && (
                  <div className="attached-preview-thumb">
                    <img src={receiptImage} alt="Receipt Preview" />
                    <button
                      type="button"
                      className="btn-remove-thumb"
                      onClick={() => setReceiptImage(null)}
                    >
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button type="submit" className="btn-submit-payment-gold">
              <i className="fa-solid fa-bolt"></i>
              <span>Deposit {amount > 0 ? `${amount} ETB` : ''} Now</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
