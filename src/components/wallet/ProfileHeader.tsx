import React from 'react';
import { useApp } from '../../context/AppContext.tsx';

export const ProfileHeader: React.FC = () => {
  const { switchPage, showToast } = useApp();

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
          onClick={() => showToast('✏️ Edit profile details')}
          title="Edit Profile"
        >
          <i className="fa-solid fa-pencil"></i>
        </button>
      </div>

      {/* Profile Name & Phone */}
      <div className="profile-details-group">
        <h2 className="profile-name-bold">Eyu Ase</h2>
        <span className="profile-phone-sub">251983624574</span>
      </div>

      {/* Right Arrow Button */}
      <button
        type="button"
        className="btn-profile-arrow-circ"
        onClick={() => switchPage('profile')}
        title="View Profile"
      >
        <i className="fa-solid fa-chevron-right"></i>
      </button>
    </div>
  );
};
