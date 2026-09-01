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
      switchPage('profile');
    }
  };

  const displayName = user?.fullName || 'Eyu Ase';
  const displayPhone = user?.nationalPhone || user?.phone || '0983624574';
  const initials = displayName
    .split(' ')
    .map(p => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'EA';

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
          <span className="profile-phone-sub">{displayPhone}</span>
          {user?.carrier && (
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
        </div>
      </div>

      {/* Right Arrow Button */}
      <button
        type="button"
        className="btn-profile-arrow-circ"
        onClick={handleAction}
        title="View Profile & Accounts"
      >
        <i className="fa-solid fa-chevron-right"></i>
      </button>
    </div>
  );
};
