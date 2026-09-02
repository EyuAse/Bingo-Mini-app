import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { useAdmin } from '../context/AdminContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { TelebirrLogo, CBELogo } from '../components/wallet/PaymentLogos.tsx';
import { LanguageDropdown } from '../components/common/LanguageDropdown.tsx';
import { apiClient } from '../services/apiClient.ts';

export const DepositPage: React.FC = () => {
  const { switchPage, showToast } = useApp();
  const { addDepositRequest } = useAdmin();
  const { user } = useAuth();
  const { t, lang } = useLanguage();

  const [selectedMethod, setSelectedMethod] = useState<'Telebirr' | 'CBE'>('Telebirr');
  const [amount, setAmount] = useState<number>(100);
  const [playerPhone, setPlayerPhone] = useState<string>(() => user?.phone || user?.formattedPhone || '');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [submittedRef, setSubmittedRef] = useState<string>('');

  // Official Receiver Details
  const telebirrReceiverPhone = '0998983344';
  const cbeReceiverAccount = '100098983344';
  const receiverName = 'Mekonen Woldekidane';

  const activeReceiverNumber = selectedMethod === 'Telebirr' ? telebirrReceiverPhone : cbeReceiverAccount;
  const quickAmounts = [50, 100, 200, 500, 1000, 5000];

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`📋 ${t('common.copied')}: ${label}`);
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
      showToast(lang === 'am' ? '⚠️ ዝቅተኛ ተቀማጭ 50 ብር ነው።' : '⚠️ Minimum deposit is 50 ETB.');
      return;
    }

    if (!playerPhone || playerPhone.trim().length < 9) {
      showToast(lang === 'am' ? '⚠️ እባክዎ ትክክለኛ ስልክ ቁጥር ያስገቡ።' : '⚠️ Please enter your valid mobile number.');
      return;
    }

    const assignedRef = transactionRef.trim()
      ? transactionRef.trim().toUpperCase()
      : `${selectedMethod === 'Telebirr' ? 'TX-TB-' : 'TX-CBE-'}${Math.floor(100000 + Math.random() * 900000)}`;

    // Call live Neon DB API
    apiClient.wallet.deposit({
      amount,
      paymentMethod: selectedMethod,
      playerPhone,
      transactionRef: assignedRef,
      receiptImage: receiptImage || undefined
    }).catch(err => {
      console.warn('Backend deposit notice:', err);
    });

    addDepositRequest(
      user?.id || 'usr-me',
      user?.fullName || 'Player',
      playerPhone,
      amount,
      selectedMethod,
      playerPhone,
      receiptImage || undefined,
      assignedRef
    );

    setSubmittedRef(assignedRef);
    setIsSubmitted(true);
    showToast(lang === 'am' ? `✅ የ${amount} ብር ተቀማጭ ጥያቄ ተልኳል!` : `✅ Deposit request of ${amount} ETB submitted!`);
  };

  return (
    <div className="page active page-subpage-fresh" id="page-deposit">
      {/* Clean Inline Page Navigation Header */}
      <div className="subpage-inline-nav-row">
        <button
          type="button"
          className="btn-subpage-back-pill"
          onClick={() => switchPage('wallet')}
          title="Back to Wallet"
        >
          <i className="fa-solid fa-arrow-left"></i>
          <span>{lang === 'am' ? 'ወደ ዋሌት' : 'Back to Wallet'}</span>
        </button>

        <h1 className="subpage-main-heading">
          {lang === 'am' ? 'ገንዘብ አስገባ' : 'Deposit Funds'}
        </h1>
      </div>

      <div className="subpage-scroll-content">
        <div className="fresh-cashier-card-shell">
          {isSubmitted ? (
            /* Success Confirmation View */
            <div className="payment-success-content">
              <div className="success-icon-circle green">
                <i className="fa-solid fa-check"></i>
              </div>

              <h3 className="success-main-title">
                {lang === 'am' ? 'የተቀማጭ ጥያቄ ደርሶናል!' : 'Deposit Request Received!'}
              </h3>
              <p className="success-subtext">
                {lang === 'am' ? (
                  <>የ<strong>{amount.toFixed(2)} ብር</strong> በ<strong>{selectedMethod}</strong> ተቀማጭ ጥያቄዎ በካሳችን እየተረጋገጠ ነው።</>
                ) : (
                  <>Your deposit of <strong>{amount.toFixed(2)} ETB</strong> via <strong>{selectedMethod}</strong> is being verified by our automated cashier desk.</>
                )}
              </p>

              <div className="success-ref-box">
                <span className="ref-box-lbl">{lang === 'am' ? 'የግብይት መለያ ቁጥር' : 'TRANSACTION ID'}</span>
                <strong className="ref-box-val">{submittedRef}</strong>
                <button
                  type="button"
                  className="btn-copy-ref-success"
                  onClick={() => handleCopy(submittedRef, 'Transaction ID')}
                >
                  <i className="fa-regular fa-copy"></i> {t('common.copy')}
                </button>
              </div>

              <div className="success-eta-tag">
                <i className="fa-solid fa-bolt gold"></i>
                <span>{lang === 'am' ? 'አማካይ የማረጋገጫ ጊዜ፡ ' : 'Average verification time: '}<strong>~30 {lang === 'am' ? 'ሰከንዶች' : 'seconds'}</strong></span>
              </div>

              <div className="success-actions-row">
                <button
                  type="button"
                  className="btn-payment-action-gold"
                  onClick={() => switchPage('wallet')}
                >
                  <span>{lang === 'am' ? 'በተቀማጭ ታሪክ እይ' : 'View in Deposit History'}</span>
                  <i className="fa-solid fa-arrow-right"></i>
                </button>

                <button
                  type="button"
                  className="btn-payment-action-outline"
                  onClick={() => switchPage('games')}
                >
                  <span>{lang === 'am' ? 'ወደ ጨዋታ ተመለስ' : 'Return to Games'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Deposit Form */
            <form className="payment-modal-form" onSubmit={handleDepositSubmit}>
              {/* 1. Payment Method Selection */}
              <div className="form-section-block">
                <label className="form-section-label">
                  <span className="step-num">1</span> {lang === 'am' ? 'የመክፈያ መንገድ ይምረጡ' : 'Choose Payment Method'}
                </label>

                <div className="payment-method-selector-grid">
                  <button
                    type="button"
                    className={`btn-payment-method-card ${selectedMethod === 'Telebirr' ? 'active' : ''}`}
                    onClick={() => setSelectedMethod('Telebirr')}
                  >
                    <div className="method-logo-wrap">
                      <TelebirrLogo size={26} />
                    </div>
                    <div className="method-text-col">
                      <strong className="method-name">Telebirr</strong>
                      <span className="method-badge-fast">{lang === 'am' ? '⚡ ፈጣን' : '⚡ Instant'}</span>
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
                      <CBELogo size={26} />
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
                    <span className="step-num">2</span> {lang === 'am' ? 'የተቀማጭ መጠን' : 'Deposit Amount'}
                  </label>
                  <span className="min-limit-sub">{lang === 'am' ? 'ዝቅተኛ፡ 50 ብር' : 'Min: 50 ETB'}</span>
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
                    placeholder={lang === 'am' ? 'መጠን ያስገቡ' : 'Enter amount'}
                    required
                  />
                </div>
              </div>

              {/* 3. Official Receiver Account Details */}
              <div className="form-section-block">
                <label className="form-section-label">
                  <span className="step-num">3</span> {lang === 'am' ? 'ክፍያውን ወደዚህ ይላኩ' : 'Send Payment To'}
                </label>

                <div className="deposit-receiver-callout">
                  <div className="receiver-top-row">
                    <span className="receiver-provider-tag">
                      {selectedMethod} {lang === 'am' ? 'ይፋዊ አካውንት' : 'Official Account'}
                    </span>
                    <button
                      type="button"
                      className="btn-copy-receiver"
                      onClick={() => handleCopy(activeReceiverNumber, selectedMethod)}
                    >
                      <i className="fa-regular fa-copy"></i> {t('common.copy')}
                    </button>
                  </div>

                  <div className="receiver-number-display">
                    <span className="receiver-num-bold">{activeReceiverNumber}</span>
                  </div>

                  <div className="receiver-name-row">
                    <span className="receiver-name-lbl">{lang === 'am' ? 'የአካውንት ስም፡' : 'Account Name:'}</span>
                    <strong className="receiver-name-val">{receiverName}</strong>
                  </div>

                  <p className="receiver-note-sub">
                    {lang === 'am' ? 'ትክክለኛውን መጠን ከባንክ መተግበሪያዎ ይላኩ፣ ከዚያም የግብይት ቁጥሩን ከታች ያስገቡ።' : `Transfer exact amount from your ${selectedMethod} app, then enter the SMS reference below.`}
                  </p>
                </div>
              </div>

              {/* 4. Verification & Submission */}
              <div className="form-section-block">
                <label className="form-section-label">
                  <span className="step-num">4</span> {lang === 'am' ? 'የማረጋገጫ ዝርዝሮች' : 'Verification Details'}
                </label>

                <div className="input-field-group">
                  <label className="field-tiny-label">{lang === 'am' ? 'የእርስዎ ስልክ ቁጥር' : 'Your Phone Number'}</label>
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
                    {lang === 'am' ? 'የኤስኤምኤስ ግብይት መለያ ቁጥር' : 'SMS Transaction ID / Reference (Optional)'}
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
                    id="dedicated-deposit-receipt"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="dedicated-deposit-receipt" className="btn-upload-label">
                    <i className="fa-solid fa-camera"></i>
                    <span>
                      {receiptImage
                        ? (lang === 'am' ? 'ምስሉን ቀይር' : 'Change Screenshot')
                        : (lang === 'am' ? 'የደረሰኝ ምስል አያይዝ (አስገዳጅ አይደለም)' : 'Attach Receipt Screenshot (Optional)')}
                    </span>
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
                <span>{lang === 'am' ? `አሁን ${amount > 0 ? `${amount} ብር` : ''} አስገባ` : `Deposit ${amount > 0 ? `${amount} ETB` : ''} Now`}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
