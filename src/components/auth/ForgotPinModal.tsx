import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { EthiopianPhoneInput } from './EthiopianPhoneInput';
import { validateEthiopianPhone } from '../../services/ethiopianPhoneValidator';

interface ForgotPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ForgotPinModal: React.FC<ForgotPinModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { sendOtp, resetPin } = useAuth();
  const { lang } = useLanguage();

  const [step, setStep] = useState<'phone' | 'reset'>('phone');
  const [phone, setPhone] = useState<string>('');
  const [otpCode, setOtpCode] = useState<string>('');
  const [devCode, setDevCode] = useState<string | undefined>(undefined);
  const [newPin, setNewPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateEthiopianPhone(phone);
    if (!validation.isValid) {
      setErrorMsg(validation.errorMessage || 'Please enter a valid Ethiopian phone number.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await sendOtp(phone);
      setDevCode(res.devCode);
      setStep('reset');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to send OTP code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 6) {
      setErrorMsg(lang === 'am' ? 'ባለ 6 አሃዝ ማረጋገጫ ኮድ ያስገቡ።' : 'Please enter the 6-digit OTP code.');
      return;
    }

    if (newPin.length < 4 || newPin.length > 8) {
      setErrorMsg(lang === 'am' ? 'ሚስጥር ቁጥር ከ4 እስከ 8 አሃዝ መሆን አለበት።' : 'PIN must be 4 to 8 digits.');
      return;
    }

    if (newPin !== confirmPin) {
      setErrorMsg(lang === 'am' ? 'የተሰጡት ሚስጥር ቁጥሮች አይመሳሰሉም።' : 'PINs do not match.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      await resetPin(phone, otpCode, newPin);
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to reset PIN.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="otp-modal-overlay">
      <div className="otp-modal-backdrop" onClick={onClose}></div>
      <div className="otp-modal-card">
        <button type="button" className="btn-otp-modal-close" onClick={onClose} title="Close">
          <i className="fa-solid fa-xmark"></i>
        </button>

        <div className="otp-icon-header">
          <div className="otp-sms-icon-bubble gold">
            <i className="fa-solid fa-key"></i>
          </div>
        </div>

        <h3 className="otp-modal-title">
          {lang === 'am' ? 'ሚስጥር ቁጥር መቀየሪያ' : 'Reset Security PIN'}
        </h3>
        <p className="otp-modal-sub">
          {step === 'phone'
            ? lang === 'am'
              ? 'የተመዘገቡበትን የኢትዮጵያ ስልክ ቁጥር ያስገቡ'
              : 'Enter your registered Ethiopian phone number to receive a verification code'
            : lang === 'am'
            ? 'የተላከውን የማረጋገጫ ኮድ እና አዲሱን ሚስጥር ቁጥር ያስገቡ'
            : 'Enter the SMS code sent to your phone and choose a new PIN'}
        </p>

        {errorMsg && (
          <div className="otp-error-banner" style={{ marginBottom: '12px' }}>
            <i className="fa-solid fa-circle-exclamation"></i>
            <span>{errorMsg}</span>
          </div>
        )}

        {step === 'phone' ? (
          <form onSubmit={handleRequestOtp} className="otp-form">
            <div className="auth-input-group" style={{ marginBottom: '16px' }}>
              <label className="auth-input-label">
                {lang === 'am' ? 'የኢትዮጵያ ስልክ ቁጥር' : 'Ethiopian Phone Number'}
              </label>
              <EthiopianPhoneInput value={phone} onChange={setPhone} autoFocus />
            </div>

            <button type="submit" className="btn-confirm-otp-cta" disabled={isLoading}>
              {isLoading ? (
                <span>
                  <i className="fa-solid fa-spinner fa-spin"></i>{' '}
                  {lang === 'am' ? 'በመላክ ላይ...' : 'Sending SMS...'}
                </span>
              ) : (
                <span>
                  <i className="fa-solid fa-paper-plane"></i>{' '}
                  {lang === 'am' ? 'የማረጋገጫ ኮድ ላክ' : 'Send Verification Code'}
                </span>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPin} className="otp-form">
            {devCode && (
              <div
                className="otp-dev-helper-strip"
                onClick={() => setOtpCode(devCode)}
                style={{ marginBottom: '12px' }}
                title="Click to fill code"
              >
                <span className="dev-pill-badge">TEST CODE</span>
                <strong className="dev-otp-number">{devCode}</strong>
                <span className="dev-click-paste">Click to fill</span>
              </div>
            )}

            <div className="auth-input-group">
              <label className="auth-input-label">
                {lang === 'am' ? 'ባለ 6 አሃዝ የማረጋገጫ ኮድ' : '6-Digit SMS Code'}
              </label>
              <div className="auth-input-pill">
                <div className="input-icon-wrap yellow">
                  <i className="fa-solid fa-shield-halved"></i>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 482910"
                  required
                />
              </div>
            </div>

            <div className="auth-input-group">
              <label className="auth-input-label">
                {lang === 'am' ? 'አዲስ ሚስጥር ቁጥር (4-8 አሃዝ)' : 'New PIN (4-8 digits)'}
              </label>
              <div className="auth-input-pill">
                <div className="input-icon-wrap gold">
                  <i className="fa-solid fa-lock"></i>
                </div>
                <input
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  maxLength={8}
                  value={newPin}
                  onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 4-8 digit PIN"
                  required
                />
                <button
                  type="button"
                  className="btn-eye-toggle"
                  onClick={() => setShowPin(!showPin)}
                >
                  <i className={`fa-solid ${showPin ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            <div className="auth-input-group">
              <label className="auth-input-label">
                {lang === 'am' ? 'አዲሱን ሚስጥር ቁጥር ያረጋግጡ' : 'Confirm New PIN'}
              </label>
              <div className="auth-input-pill">
                <div className="input-icon-wrap gold">
                  <i className="fa-solid fa-check-double"></i>
                </div>
                <input
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  maxLength={8}
                  value={confirmPin}
                  onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Re-enter PIN"
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-confirm-otp-cta" disabled={isLoading}>
              {isLoading ? (
                <span>
                  <i className="fa-solid fa-spinner fa-spin"></i>{' '}
                  {lang === 'am' ? 'በመቀየር ላይ...' : 'Updating PIN...'}
                </span>
              ) : (
                <span>
                  <i className="fa-solid fa-check"></i>{' '}
                  {lang === 'am' ? 'ሚስጥር ቁጥር ቀይር' : 'Update Security PIN'}
                </span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
