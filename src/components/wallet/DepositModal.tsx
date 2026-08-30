import React, { useState } from 'react';
import { useWallet } from '../../context/WalletContext.tsx';
import { useApp } from '../../context/AppContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose }) => {
  const { addBalance } = useWallet();
  const { showToast } = useApp();
  const { t } = useLanguage();
  const [selectedMethod, setSelectedMethod] = useState<'telebirr' | 'cbe'>('telebirr');
  const [amount, setAmount] = useState<number>(100);
  const [phone, setPhone] = useState<string>('0911234567');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (!isOpen) return null;

  const quickAmounts = [50, 100, 200, 500, 1000];

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      showToast('⚠️ Please enter a valid deposit amount.');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      addBalance(amount);
      setIsProcessing(false);
      showToast(`✅ ${amount} ETB successfully deposited via ${selectedMethod === 'telebirr' ? 'Telebirr' : 'CBE Birr'}!`);
      onClose();
    }, 800);
  };

  return (
    <div className="custom-modal-backdrop" onClick={onClose}>
      <div className="custom-modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <i className="fa-solid fa-wallet modal-icon gold"></i>
            <h3>{t('wallet.quickDeposit')}</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Payment Method Selector */}
        <div className="payment-methods-grid">
          <div
            className={`payment-method-card ${selectedMethod === 'telebirr' ? 'active' : ''}`}
            onClick={() => setSelectedMethod('telebirr')}
          >
            <div className="pm-icon telebirr-icon">
              <span>📱</span>
            </div>
            <div className="pm-info">
              <span className="pm-name">{t('wallet.telebirrName')}</span>
              <span className="pm-sub">{t('wallet.telebirrSub')}</span>
            </div>
            <i className={`fa-solid ${selectedMethod === 'telebirr' ? 'fa-circle-check active-check' : 'fa-circle'}`}></i>
          </div>

          <div
            className={`payment-method-card ${selectedMethod === 'cbe' ? 'active' : ''}`}
            onClick={() => setSelectedMethod('cbe')}
          >
            <div className="pm-icon cbe-icon">
              <span>🏦</span>
            </div>
            <div className="pm-info">
              <span className="pm-name">{t('wallet.cbeName')}</span>
              <span className="pm-sub">{t('wallet.cbeSub')}</span>
            </div>
            <i className={`fa-solid ${selectedMethod === 'cbe' ? 'fa-circle-check active-check' : 'fa-circle'}`}></i>
          </div>
        </div>

        <form onSubmit={handleDepositSubmit}>
          {/* Quick Amounts */}
          <div className="quick-amounts-label">{t('wallet.selectAmount')}</div>
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

          {/* Amount Input */}
          <div className="modal-input-group">
            <label>{t('wallet.customAmount')}</label>
            <div className="modal-input-box">
              <span className="input-currency">ETB</span>
              <input
                type="number"
                min="10"
                max="50000"
                value={amount}
                onChange={e => setAmount(parseInt(e.target.value) || 0)}
                required
              />
            </div>
          </div>

          {/* Phone Number */}
          <div className="modal-input-group">
            <label>{selectedMethod === 'telebirr' ? t('wallet.phoneNumber') : t('wallet.cbeAccount')}</label>
            <div className="modal-input-box">
              <i className="fa-solid fa-phone input-icon"></i>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button type="submit" className="modal-submit-btn deposit-submit" disabled={isProcessing}>
            {isProcessing ? (
              <span>{t('wallet.processing')}</span>
            ) : (
              <>
                <i className="fa-solid fa-bolt"></i>
                <span>
                  {t('wallet.depositSubmit', {
                    amt: amount,
                    method: selectedMethod === 'telebirr' ? 'Telebirr' : 'CBE Birr'
                  })}
                </span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
