import React from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { useAdmin } from '../../context/AdminContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { apiClient } from '../../services/apiClient.ts';

interface WalletMenuProps {
  onOpenHistory?: (type: 'deposits' | 'withdrawals' | 'bets') => void;
  gamesCount?: number;
}

export const WalletMenu: React.FC<WalletMenuProps> = ({ onOpenHistory, gamesCount }) => {
  const { switchPage } = useApp();
  const { t, lang } = useLanguage();
  const { transactions } = useAdmin();
  const { user } = useAuth();
  const [liveGamesCount, setLiveGamesCount] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (gamesCount !== undefined) {
      setLiveGamesCount(gamesCount);
      return;
    }
    let isMounted = true;
    apiClient.wallet.getGameHistory()
      .then((res: any) => {
        if (isMounted && res && res.summary) {
          setLiveGamesCount(res.summary.totalGames);
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, [gamesCount]);

  const myTransactions = (transactions || []).filter(
    tx => tx.userId === user?.id || (user?.phone && tx.phone === user?.phone)
  );

  const depositsCount = myTransactions.filter(tx => tx.type === 'deposit').length;
  const withdrawalsCount = myTransactions.filter(tx => tx.type === 'withdrawal').length;
  const effectiveGamesCount = gamesCount !== undefined ? gamesCount : (liveGamesCount || 0);

  return (
    <div className="fresh-wallet-menu-container">
      {/* Row 1: Deposit History */}
      <div
        className="fresh-menu-row-item"
        onClick={() => onOpenHistory?.('deposits')}
      >
        <div className="menu-row-icon-box green">
          <i className="fa-solid fa-arrow-down"></i>
        </div>
        <div className="menu-row-info-text">
          <strong className="menu-row-title">{t('wallet.depositHistory')}</strong>
          <span className="menu-row-sub">
            {lang === 'am' ? 'የቴሌብር እና ንግድ ባንክ ተቀማጭዎን ይከታተሉ' : 'Track your Telebirr & CBE deposits'}
          </span>
        </div>
        <div className="menu-row-action-right">
          {depositsCount > 0 && (
            <span className="menu-counter-badge green">{depositsCount}</span>
          )}
          <i className="fa-solid fa-chevron-right menu-chevron"></i>
        </div>
      </div>

      {/* Row 2: Withdrawal History */}
      <div
        className="fresh-menu-row-item"
        onClick={() => onOpenHistory?.('withdrawals')}
      >
        <div className="menu-row-icon-box red">
          <i className="fa-solid fa-arrow-up-from-bracket"></i>
        </div>
        <div className="menu-row-info-text">
          <strong className="menu-row-title">{t('wallet.withdrawalHistory')}</strong>
          <span className="menu-row-sub">
            {lang === 'am' ? 'የገንዘብ ወጪዎችዎን እና ክፍያዎችን ይከታተሉ' : 'Track your payouts & cashouts'}
          </span>
        </div>
        <div className="menu-row-action-right">
          {withdrawalsCount > 0 && (
            <span className="menu-counter-badge red">{withdrawalsCount}</span>
          )}
          <i className="fa-solid fa-chevron-right menu-chevron"></i>
        </div>
      </div>

      {/* Row 3: Game & Bet History */}
      <div
        className="fresh-menu-row-item"
        onClick={() => onOpenHistory?.('bets')}
      >
        <div className="menu-row-icon-box amber">
          <i className="fa-solid fa-dice"></i>
        </div>
        <div className="menu-row-info-text">
          <strong className="menu-row-title">{t('wallet.betHistory')}</strong>
          <span className="menu-row-sub">
            {t('wallet.betHistorySub')}
          </span>
        </div>
        <div className="menu-row-action-right">
          {effectiveGamesCount > 0 && (
            <span className="menu-counter-badge amber">{effectiveGamesCount}</span>
          )}
          <i className="fa-solid fa-chevron-right menu-chevron"></i>
        </div>
      </div>

      {/* Row 4: Affiliate Program */}
      <div
        className="fresh-menu-row-item"
        onClick={() => switchPage('affiliate')}
      >
        <div className="menu-row-icon-box gold">
          <i className="fa-solid fa-users"></i>
        </div>
        <div className="menu-row-info-text">
          <strong className="menu-row-title">{t('wallet.affiliateProgram')}</strong>
          <span className="menu-row-sub">
            {lang === 'am' ? 'በእያንዳንዱ 1ኛ ተቀማጭ የ10% ቦነስ ያግኙ' : 'Earn 10% on every 1st deposit'}
          </span>
        </div>
        <div className="menu-row-action-right">
          <span className="menu-tag-pill gold">{t('wallet.bonusTag')}</span>
          <i className="fa-solid fa-chevron-right menu-chevron"></i>
        </div>
      </div>

      {/* Row 4: Help & Support */}
      <div
        className="fresh-menu-row-item"
        onClick={() => switchPage('help')}
      >
        <div className="menu-row-icon-box purple">
          <i className="fa-solid fa-headset"></i>
        </div>
        <div className="menu-row-info-text">
          <strong className="menu-row-title">{t('wallet.helpSupport')}</strong>
          <span className="menu-row-sub">
            {lang === 'am' ? 'የ24/7 የቀጥታ የደንበኞች ድጋፍ' : '24/7 Live customer assistance'}
          </span>
        </div>
        <div className="menu-row-action-right">
          <i className="fa-solid fa-chevron-right menu-chevron"></i>
        </div>
      </div>
    </div>
  );
};
