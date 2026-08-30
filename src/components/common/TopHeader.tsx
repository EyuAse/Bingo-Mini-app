import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { useBingo } from '../../context/BingoContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { LanguageDropdown } from './LanguageDropdown.tsx';
import { DepositModal } from '../wallet/DepositModal.tsx';

export const TopHeader: React.FC = () => {
  const { switchPage } = useApp();
  const { isMuted, toggleMute } = useBingo();
  const { t } = useLanguage();
  const [isDepositOpen, setIsDepositOpen] = useState(false);

  return (
    <>
      <header className="top-header">
        <button
          className="header-menu-btn"
          id="header-menu-btn"
          title={t('nav.menu')}
          onClick={() => switchPage('landing')}
        >
          <i className="fa-solid fa-bars"></i>
        </button>

        {/* Lomi Bingo Logo Branding */}
        <div
          className="header-world-bingo-logo"
          onClick={() => switchPage('games')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <div className="lomi-logo-badge">
            <span className="lomi-icon">🍋</span>
            <span className="lomi-title">LOMI BINGO</span>
          </div>
        </div>

        <div className="header-actions-group">
          {/* Custom Country Flag Language Dropdown */}
          <LanguageDropdown />

          {/* Sound Mute/Unmute */}
          <button
            className="header-sound-btn"
            onClick={toggleMute}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            <i className={`fa-solid ${isMuted ? 'fa-volume-xmark' : 'fa-volume-high'}`}></i>
          </button>

          {/* Notification Button */}
          <button className="header-notif-btn" id="header-notif-btn" title={t('nav.notifications')}>
            <i className="fa-solid fa-bell"></i>
            <span className="notif-badge">3</span>
          </button>
        </div>
      </header>

      {/* Quick Deposit Modal */}
      <DepositModal isOpen={isDepositOpen} onClose={() => setIsDepositOpen(false)} />
    </>
  );
};
