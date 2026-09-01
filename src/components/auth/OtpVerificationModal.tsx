import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { validateEthiopianPhone } from '../../services/ethiopianPhoneValidator';

interface OtpVerificationModalProps {
  isOpen: boolean;
  phone: string;
  devCode?: string;
  onVerify: (code: string) => boolean;
  onResend: () => Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
}

export const OtpVerificationModal: React.FC<OtpVerificationModalProps> = ({
  isOpen,
  phone,
  devCode,
  onVerify,
  onResend,
  onClose,
  isLoading = false
}) => {
  const { lang } = useLanguage();
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState<number>(60);
  const [isResending, setIsResending] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const phoneValidation = validateEthiopianPhone(phone);

  // Timer countdown
  useEffect(() => {
    if (!isOpen) return;
    setDigits(['', '', '', '', '', '']);
    setCountdown(60);
    setErrorMsg(null);
    setIsSuccess(false);
    setIsVerifying(false);

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);

    return () => clearInterval(timer);
  }, [isOpen, phone]);

  if (!isOpen) return null;

  const triggerVerification = (codeToTest: string) => {
    if (codeToTest.length !== 6) return;
    setIsVerifying(true);
    setErrorMsg(null);

    setTimeout(() => {
      const isValid = onVerify(codeToTest);
      if (isValid) {
        setIsSuccess(true);
      } else {
        setIsVerifying(false);
        setErrorMsg(
          lang === 'am'
            ? 'የተሳሳተ የማረጋገጫ ኮድ። እባክዎ በስልክዎ የደረሰዎትን ኮድ ያረጋግጡ።'
            : 'Incorrect verification code. Please check the SMS on your phone.'
        );
      }
    }, 200);
  };

  const handleDigitChange = (index: number, value: string) => {
    const numeric = value.replace(/\D/g, '');
    if (!numeric) {
      const newDigits = [...digits];
      newDigits[index] = '';
      setDigits(newDigits);
      return;
    }

    const char = numeric.slice(-1);
    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);
    setErrorMsg(null);

    // Auto-advance
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify if all 6 digits filled
    const fullCode = newDigits.join('');
    if (fullCode.length === 6) {
      triggerVerification(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const newDigits = [...digits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || '';
      }
      setDigits(newDigits);
      if (pasted.length === 6) {
        inputRefs.current[5]?.focus();
        triggerVerification(pasted);
      } else {
        inputRefs.current[pasted.length]?.focus();
      }
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = digits.join('');
    if (fullCode.length < 6) {
      setErrorMsg(
        lang === 'am' ? 'እባክዎ ባለ 6 አሃዝ ማረጋገጫ ኮድ ያስገቡ።' : 'Please enter the complete 6-digit code.'
      );
      return;
    }
    triggerVerification(fullCode);
  };

  const handleResendClick = async () => {
    if (countdown > 0 || isResending) return;
    setIsResending(true);
    setErrorMsg(null);
    try {
      await onResend();
      setCountdown(60);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to resend code.');
    } finally {
      setIsResending(false);
    }
  };

  const handleAutoFillDev = () => {
    if (devCode && devCode.length === 6) {
      const arr = devCode.split('');
      setDigits(arr);
      triggerVerification(devCode);
    }
  };

  return (
    <div className="otp-modal-overlay">
      <div className="otp-modal-backdrop" onClick={onClose}></div>
      <div className="otp-modal-card">
        {/* Close Button */}
        <button type="button" className="btn-otp-modal-close" onClick={onClose} title="Close">
          <i className="fa-solid fa-xmark"></i>
        </button>

        {/* SMS Artwork / Icon */}
        <div className="otp-icon-header">
          <div className="otp-sms-icon-bubble">
            <i className={isSuccess ? 'fa-solid fa-circle-check' : 'fa-solid fa-comment-sms'}></i>
          </div>
        </div>

        <h3 className="otp-modal-title">
          {isSuccess
            ? lang === 'am'
              ? 'ስልክዎ ተረጋግጧል! ✅'
              : 'Phone Verified! ✅'
            : lang === 'am'
            ? 'ስልክዎን ያረጋግጡ'
            : 'Verify Phone Number'}
        </h3>
        <p className="otp-modal-sub">
          {isSuccess
            ? lang === 'am'
              ? 'መለያዎን በማጠናቀቅ ላይ...'
              : 'Completing your registration...'
            : lang === 'am'
            ? 'ባለ 6 አሃዝ የማረጋገጫ ኮድ ወደዚህ ቁጥር ልከናል፡'
            : 'We sent a 6-digit verification code via SMS to:'}
        </p>

        {/* Display Phone & Carrier */}
        <div className="otp-phone-display-pill">
          <span className="otp-phone-txt">{phoneValidation.formattedDisplay || phone}</span>
          {phoneValidation.carrier && (
            <span className={`carrier-tag-small ${phoneValidation.carrier}`}>
              {phoneValidation.carrierName}
            </span>
          )}
        </div>

        {/* Dev helper code */}
        {devCode && (
          <div className="otp-dev-helper-strip" onClick={handleAutoFillDev} title="Click to autofill code">
            <span className="dev-pill-badge">TEST / SMS CODE</span>
            <strong className="dev-otp-number">{devCode}</strong>
            <span className="dev-click-paste">
              <i className="fa-solid fa-bolt"></i> Auto-Fill
            </span>
          </div>
        )}

        <form onSubmit={handleManualSubmit} className="otp-form">
          {/* 6 Digit Inputs */}
          <div className="otp-inputs-grid" onPaste={handlePaste}>
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={el => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={e => handleDigitChange(idx, e.target.value)}
                onKeyDown={e => handleKeyDown(idx, e)}
                className={`otp-digit-box ${digit ? 'filled' : ''} ${errorMsg ? 'has-error' : ''}`}
                autoComplete="one-time-code"
                disabled={isSuccess || isVerifying}
              />
            ))}
          </div>

          {errorMsg && (
            <div className="otp-error-banner">
              <i className="fa-solid fa-circle-exclamation"></i>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="btn-confirm-otp-cta"
            disabled={isLoading || isVerifying || digits.join('').length < 6 || isSuccess}
          >
            {isVerifying ? (
              <span>
                <i className="fa-solid fa-spinner fa-spin"></i>{' '}
                {lang === 'am' ? 'በማረጋገጥ ላይ...' : 'Verifying Code...'}
              </span>
            ) : isSuccess ? (
              <span>
                <i className="fa-solid fa-check"></i>{' '}
                {lang === 'am' ? 'ተረጋግጧል!' : 'Verified!'}
              </span>
            ) : (
              <span>
                <i className="fa-solid fa-check"></i>{' '}
                {lang === 'am' ? 'ኮዱን አረጋግጥ' : 'Verify & Continue'}
              </span>
            )}
          </button>
        </form>

        {/* Resend Timer & Button */}
        <div className="otp-resend-row">
          {countdown > 0 ? (
            <div className="otp-timer-txt">
              <i className="fa-regular fa-clock"></i>{' '}
              {lang === 'am'
                ? `ኮድ እንደገና ለመላክ ${countdown} ሰከንድ ይጠብቁ`
                : `Resend code in ${countdown}s`}
            </div>
          ) : (
            <button
              type="button"
              className="btn-resend-sms-active"
              onClick={handleResendClick}
              disabled={isResending}
            >
              <i className={`fa-solid fa-rotate-right ${isResending ? 'fa-spin' : ''}`}></i>{' '}
              {lang === 'am' ? 'ኮድ በድጋሚ ላክ (SMS)' : 'Resend Code via SMS'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
