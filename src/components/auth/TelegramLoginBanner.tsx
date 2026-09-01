import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAdmin } from '../../context/AdminContext';
import { useWallet } from '../../context/WalletContext';

interface TelegramLoginBannerProps {
  onSuccess?: () => void;
}

export const TelegramLoginBanner: React.FC<TelegramLoginBannerProps> = ({ onSuccess }) => {
  const { loginWithTelegram, telegramUser, isInsideTelegram } = useAuth();
  const { switchPage, showToast } = useApp();
  const { lang } = useLanguage();
  const { addUser, registerBonus } = useAdmin();
  const { addBonus } = useWallet();

  const handleTelegramAuth = async () => {
    try {
      const { user, isNewUser } = await loginWithTelegram();

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
      showToast(`⚠️ ${err?.message || 'Telegram login failed.'}`);
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
        title="1-Click Instant Login with Telegram"
      >
        <div className="tg-btn-left-icon">
          <i className="fa-brands fa-telegram"></i>
        </div>
        <div className="tg-btn-text-wrap">
          <span className="tg-btn-main-txt">
            {lang === 'am' ? 'በቴሌግራም ፈጣን መግቢያ' : '⚡ 1-Click Telegram Login'}
          </span>
          {isInsideTelegram && telegramUser && (
            <span className="tg-btn-user-sub">
              {lang === 'am' ? `እንደ ${displayName}` : `Continue as ${displayName}`}
            </span>
          )}
        </div>
        <div className="tg-btn-free-badge">
          <span>0 ETB SMS</span>
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
