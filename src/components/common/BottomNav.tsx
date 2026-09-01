import React from 'react';
import { useApp, PageId } from '../../context/AppContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';

interface NavItemDef {
  id: PageId;
  labelKey: string;
  iconClass: string;
  svgIcon: React.ReactNode;
}

const navItems: NavItemDef[] = [
  {
    id: 'games',
    labelKey: 'nav.games',
    iconClass: 'fa-solid fa-gamepad',
    svgIcon: (
      <svg className="nav-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="6" y1="12" x2="10" y2="12" />
        <line x1="8" y1="10" x2="8" y2="14" />
        <line x1="15" y1="13" x2="15.01" y2="13" />
        <line x1="18" y1="11" x2="18.01" y2="11" />
        <rect x="2" y="6" width="20" height="12" rx="2" />
      </svg>
    )
  },
  {
    id: 'wallet',
    labelKey: 'nav.wallet',
    iconClass: 'fa-solid fa-wallet',
    svgIcon: (
      <svg className="nav-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
        <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
        <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
      </svg>
    )
  },
  {
    id: 'affiliate',
    labelKey: 'nav.rewards',
    iconClass: 'fa-solid fa-gift',
    svgIcon: (
      <svg className="nav-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 12 20 22 4 22 4 12" />
        <rect x="2" y="7" width="20" height="5" />
        <line x1="12" y1="22" x2="12" y2="7" />
        <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
        <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
      </svg>
    )
  },
  {
    id: 'profile',
    labelKey: 'nav.profile',
    iconClass: 'fa-regular fa-user',
    svgIcon: (
      <svg className="nav-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    )
  }
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
            <div className="nav-icon-wrapper">
              {item.svgIcon}
            </div>
            <span className="nav-label-txt">{t(item.labelKey)}</span>
          </button>
        );
      })}
    </nav>
  );
};
