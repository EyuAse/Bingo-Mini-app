import React from 'react';
import { useApp, PageId } from '../../context/AppContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';

interface NavItem {
  id: PageId;
  labelKey: string;
  icon: string;
}

const navItems: NavItem[] = [
  { id: 'games', labelKey: 'nav.games', icon: 'fa-solid fa-gamepad' },
  { id: 'wallet', labelKey: 'nav.wallet', icon: 'fa-solid fa-wallet' },
  { id: 'affiliate', labelKey: 'nav.rewards', icon: 'fa-solid fa-gift' },
  { id: 'profile', labelKey: 'nav.profile', icon: 'fa-regular fa-user' }
];

export const BottomNav: React.FC = () => {
  const { currentPage, switchPage } = useApp();
  const { t } = useLanguage();

  return (
    <nav className="lobby-fresh-bottom-nav">
      {navItems.map(item => {
        const isActive =
          currentPage === item.id ||
          (item.id === 'games' && currentPage === 'bingo') ||
          (item.id === 'profile' && (currentPage === 'account-info' || currentPage === 'help' || currentPage === 'about'));

        return (
          <button
            key={item.id}
            type="button"
            className={`fresh-nav-item ${isActive ? 'active' : ''}`}
            id={`nav-${item.id}`}
            onClick={() => switchPage(item.id)}
          >
            <i className={item.icon}></i>
            <span>{t(item.labelKey)}</span>
          </button>
        );
      })}
    </nav>
  );
};
