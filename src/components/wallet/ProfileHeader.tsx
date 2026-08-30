import React from 'react';
import { useApp } from '../../context/AppContext.tsx';

export const ProfileHeader: React.FC = () => {
  const { switchPage } = useApp();

  return (
    <div className="profile-header">
      <div className="profile-avatar">EA</div>
      <div className="profile-details">
        <div className="profile-name">Eyu Ase</div>
        <div className="profile-phone">251983624574</div>
      </div>
      <button className="profile-close" id="profile-close" onClick={() => switchPage('games')} title="Close">
        <i className="fa-solid fa-xmark"></i>
      </button>
    </div>
  );
};
