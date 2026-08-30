import React from 'react';
import { useApp, PageId } from '../../context/AppContext.tsx';

interface NavItem {
  id: PageId;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { id: 'games', label: 'Games', icon: 'fa-solid fa-gamepad' },
  { id: 'wallet', label: 'Wallet', icon: 'fa-solid fa-wallet' },
  { id: 'affiliate', label: 'Rewards', icon: 'fa-solid fa-gift' },
  { id: 'profile', label: 'Profile', icon: 'fa-regular fa-user' }
];

export const BottomNav: React.FC = () => {
  const { currentPage, switchPage } = useApp();

  return (
    <nav className="lobby-fresh-bottom-nav">
      {navItems.map(item => {
        const isActive =
          currentPage === item.id ||
          (item.id === 'games' && currentPage === 'bingo') ||
          (item.id === 'profile' && (currentPage === 'account-info' || currentPage === 'help' || currentPage === 'about'));

        return (
          <button
            key={item.id + item.label}
            type="button"
            className={`fresh-nav-item ${isActive ? 'active' : ''}`}
            id={`nav-${item.id}`}
            onClick={() => switchPage(item.id)}
          >
            <i className={item.icon}></i>
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
