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
  { id: 'history', labelKey: 'nav.history', icon: 'fa-solid fa-clock-rotate-left' },
  { id: 'wallet', labelKey: 'nav.wallet', icon: 'fa-solid fa-wallet' },
  { id: 'leader', labelKey: 'nav.leaderboard', icon: 'fa-solid fa-trophy' },
  { id: 'profile', labelKey: 'nav.profile', icon: 'fa-solid fa-user' }
];

export const BottomNav: React.FC = () => {
  const { currentPage, switchPage } = useApp();
  const { t } = useLanguage();

  return (
    <nav className="bottom-nav">
      {navItems.map(item => {
        const isActive = currentPage === item.id;
        return (
          <button
            key={item.id}
            className={`nav-item ${isActive ? 'active' : ''}`}
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
