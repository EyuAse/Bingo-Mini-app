import React, { useState } from 'react';
import { useWallet } from '../../context/WalletContext.tsx';
import { useApp } from '../../context/AppContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({ isOpen, onClose }) => {
  const { balance, deductBalance } = useWallet();
  const { showToast } = useApp();
  const { t } = useLanguage();
  const [selectedMethod, setSelectedMethod] = useState<'telebirr' | 'cbe'>('telebirr');
  const [amount, setAmount] = useState<number>(100);
  const [phone, setPhone] = useState<string>('0911234567');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (!isOpen) return null;

  return (
    <div className="custom-modal-backdrop" onClick={onClose}>
      <div className="custom-modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <i className="fa-solid fa-arrow-down-left modal-icon green"></i>
            <h3>{t('wallet.instantCashOut')}</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Current Available Balance */}
        <div className="withdraw-balance-banner">
          <span className="w-label">{t('wallet.availableWithdraw')}</span>
          <span className="w-amount">{balance.toFixed(2)} ETB</span>
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

        <form
          onSubmit={e => {
            e.preventDefault();
            if (amount <= 0) {
              showToast('⚠️ Please enter a valid withdrawal amount.');
              return;
            }
            if (amount > balance) {
              showToast('❌ Insufficient balance for withdrawal.');
              return;
            }

            setIsProcessing(true);
            setTimeout(() => {
              deductBalance(amount);
              setIsProcessing(false);
              showToast(`💸 ${amount} ETB successfully sent to your ${selectedMethod === 'telebirr' ? 'Telebirr' : 'CBE'} account!`);
              onClose();
            }, 800);
          }}
        >
          {/* Amount Input */}
          <div className="modal-input-group">
            <label>{t('wallet.customAmount')}</label>
            <div className="modal-input-box">
              <span className="input-currency">ETB</span>
              <input
                type="number"
                min="10"
                max={balance}
                value={amount}
                onChange={e => setAmount(parseInt(e.target.value) || 0)}
                required
              />
            </div>
          </div>

          {/* Phone / Account Number */}
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
          <button type="submit" className="modal-submit-btn withdraw-submit" disabled={isProcessing || balance < 10}>
            {isProcessing ? (
              <span>{t('wallet.processing')}</span>
            ) : (
              <>
                <i className="fa-solid fa-paper-plane"></i>
                <span>
                  {t('wallet.withdrawSubmit', {
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
