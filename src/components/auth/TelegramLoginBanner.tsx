import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAdmin } from '../../context/AdminContext';
import { useWallet } from '../../context/WalletContext';
import { telegramService } from '../../services/telegramService';

interface TelegramLoginBannerProps {
  onSuccess?: () => void;
}

export const TelegramLoginBanner: React.FC<TelegramLoginBannerProps> = ({ onSuccess }) => {
  const { loginWithTelegram, telegramUser, isInsideTelegram } = useAuth();
  const { switchPage, showToast } = useApp();
  const { lang } = useLanguage();
  const { addUser, registerBonus } = useAdmin();
  const { addBonus } = useWallet();
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  const handleTelegramAuth = async () => {
    setIsConnecting(true);
    try {
      // 1. Try to request native Telegram phone if supported
      let detectedPhone: string | undefined = undefined;
      if (isInsideTelegram) {
        try {
          const sharedPhone = await telegramService.requestTelegramPhone();
          if (sharedPhone) {
            detectedPhone = sharedPhone;
          }
        } catch (e) {
          // Continue with profile
        }
      }

      // 2. Log in with Telegram user and detected phone
      const { user, isNewUser } = await loginWithTelegram(telegramUser || undefined, detectedPhone);

      if (isNewUser) {
        addUser({
          name: user.fullName,
          phone: user.formattedPhone,
          balance: 0,
          bonus: registerBonus,
          referralCount: 0,
          totalDeposited: 0,
          totalWithdrawn: 0,
          status: 'active'
        });
        addBonus(registerBonus);
        showToast(
          lang === 'am'
            ? `🎉 እንኳን ደህና መጡ ${user.fullName}! የ${registerBonus} ብር ነፃ ቦነስ ተጨምሯል!`
            : `🎉 Welcome ${user.fullName}! +${registerBonus} ETB Bonus Added!`
        );
      } else {
        showToast(
          lang === 'am'
            ? `እንኳን ደህና መጡ፣ ${user.fullName}!`
            : `Welcome back, ${user.fullName}!`
        );
      }

      if (onSuccess) {
        onSuccess();
      } else {
        switchPage('games');
      }
    } catch (err: any) {
      showToast(`⚠️ ${err?.message || 'Telegram connection failed.'}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const displayName = telegramUser
    ? `${telegramUser.first_name || ''} ${telegramUser.last_name || ''}`.trim() || `@${telegramUser.username}`
    : 'Telegram Player';

  return (
    <div className="tg-one-click-container">
      <button
        type="button"
        className="btn-tg-one-click-cta"
        onClick={handleTelegramAuth}
        disabled={isConnecting}
        title="1-Click Instant Login with Telegram"
      >
        <div className="tg-btn-left-icon">
          {isConnecting ? (
            <i className="fa-solid fa-spinner fa-spin"></i>
          ) : (
            <i className="fa-brands fa-telegram"></i>
          )}
        </div>
        <div className="tg-btn-text-wrap">
          <span className="tg-btn-main-txt">
            {isConnecting
              ? lang === 'am'
                ? 'በመገናኘት ላይ...'
                : 'Connecting to Telegram...'
              : isInsideTelegram && telegramUser
              ? lang === 'am'
                ? `እንደ ${displayName} ቀጥል ⚡`
                : `Continue as ${displayName} ⚡`
              : lang === 'am'
              ? '⚡ በቴሌግራም ፈጣን መግቢያ'
              : '⚡ 1-Click Telegram Login'}
          </span>
          <span className="tg-btn-user-sub">
            {isInsideTelegram
              ? lang === 'am'
                ? 'የቴሌግራም መለያዎን ወዲያውኑ ያገናኙ'
                : 'Instant verified Telegram authentication'
              : lang === 'am'
              ? 'ያለ SMS ክፍያ ወዲያውኑ ይጫወቱ'
              : 'Zero SMS fees • No password needed'}
          </span>
        </div>
        <div className="tg-btn-free-badge">
          <span>{isInsideTelegram ? 'VERIFIED' : '0 ETB'}</span>
        </div>
      </button>

      <div className="tg-or-divider">
        <span className="tg-divider-line"></span>
        <span className="tg-divider-text">
          {lang === 'am' ? 'ወይም በስልክ ቁጥር' : 'OR WITH PHONE'}
        </span>
        <span className="tg-divider-line"></span>
      </div>
    </div>
  );
};
