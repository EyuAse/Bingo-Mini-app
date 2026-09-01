import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

interface ProfileHeaderProps {
  onEditClick?: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ onEditClick }) => {
  const { switchPage } = useApp();
  const { user } = useAuth();

  const handleAction = () => {
    if (onEditClick) {
      onEditClick();
    } else {
      switchPage('account-info');
    }
  };

  const displayName = user?.fullName || (user?.telegramUsername ? `@${user.telegramUsername}` : 'Telegram Player');
  const hasRealPhone = user?.phone && !user.id.includes(user.phone.slice(-6)) && user.phone.length >= 10 && !user.phone.startsWith('+25198888');
  
  const displayHandle = user?.telegramUsername
    ? `@${user.telegramUsername}`
    : (user?.formattedPhone || user?.phone || 'Telegram Account');

  const initials = displayName
    .split(' ')
    .map(p => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || (user?.telegramUsername ? user.telegramUsername.slice(0, 2).toUpperCase() : 'TG');

  return (
    <div className="fresh-profile-banner-card">
      {/* Background Sliced Lemon Graphics */}
      <div className="banner-lemon-glow"></div>
      <div className="banner-lemon-slice-top"></div>

      {/* Avatar Container with Edit Badge */}
      <div className="profile-avatar-wrapper">
        <div className="avatar-ea-circle">{initials}</div>
        <button
          type="button"
          className="btn-avatar-edit-pencil"
          onClick={handleAction}
          title="Edit Profile & Accounts"
        >
          <i className="fa-solid fa-pencil"></i>
        </button>
      </div>

      {/* Profile Name & Phone */}
      <div className="profile-details-group" onClick={handleAction} style={{ cursor: 'pointer' }}>
        <h2 className="profile-name-bold">{displayName}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="profile-phone-sub">
            {hasRealPhone ? user?.formattedPhone : displayHandle}
          </span>
          {hasRealPhone && user?.carrier && (
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: '999px',
                background: user.carrier === 'ethiotelecom' ? '#dcfce7' : '#fee2e2',
                color: user.carrier === 'ethiotelecom' ? '#15803d' : '#b91c1c',
                textTransform: 'uppercase'
              }}
            >
              {user.carrier === 'ethiotelecom' ? 'EthioTel' : 'Safaricom'}
            </span>
          )}
          {!hasRealPhone && (
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: '999px',
                background: '#e0f2fe',
                color: '#0369a1'
              }}
            >
              Telegram
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
