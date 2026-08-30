import React from 'react';
import { useApp } from '../../context/AppContext.tsx';

interface ProfileHeaderProps {
  onEditClick?: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ onEditClick }) => {
  const { switchPage } = useApp();

  const handleAction = () => {
    if (onEditClick) {
      onEditClick();
    } else {
      switchPage('profile');
    }
  };

  return (
    <div className="fresh-profile-banner-card">
      {/* Background Sliced Lemon Graphics */}
      <div className="banner-lemon-glow"></div>
      <div className="banner-lemon-slice-top"></div>

      {/* Avatar Container with Edit Badge */}
      <div className="profile-avatar-wrapper">
        <div className="avatar-ea-circle">EA</div>
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
        <h2 className="profile-name-bold">Eyu Ase</h2>
        <span className="profile-phone-sub">251983624574</span>
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
