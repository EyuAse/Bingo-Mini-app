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
  const tgIdStr = user?.telegramId ? String(user.telegramId) : '';
  const hasRealPhone =
    !!user?.phone &&
    user.phone.length >= 9 &&
    !user.phone.startsWith('+25198888') &&
    user.phone !== '0911234567' &&
    (!tgIdStr || (!user.phone.includes(tgIdStr.slice(-6)) && user.phone !== `09${tgIdStr.slice(-8)}`));

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
            {hasRealPhone
              ? (user?.formattedPhone || user?.phone)
              : (user?.telegramUsername ? `@${user.telegramUsername}` : 'ስልክ ቁጥር አልተያያዘም')}
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
                padding: '2px 8px',
                borderRadius: '999px',
                background: 'rgba(234, 179, 8, 0.15)',
                color: '#ca8a04',
                border: '1px solid rgba(234, 179, 8, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px'
              }}
            >
              <i className="fa-solid fa-plus" style={{ fontSize: '8px' }}></i> ስልክ አያይዝ
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
