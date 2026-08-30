import React from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { useBingo } from '../../context/BingoContext.tsx';

export interface RoomCardProps {
  id: string;
  theme: 'purple' | 'green' | 'orange' | 'blue';
  badge: { label: string; type: 'popular' | 'hot' | 'quick' | 'special' };
  imgSrc: string;
  title: string;
  subtitle: string;
  players: string;
}

export const RoomCard: React.FC<RoomCardProps> = ({
  theme,
  badge,
  imgSrc,
  title,
  subtitle,
  players
}) => {
  const { switchPage } = useApp();
  const { startLobbyCountdown } = useBingo();

  const handlePlayNow = () => {
    switchPage('bingo');
    startLobbyCountdown();
  };

  return (
    <div className={`bingo-room-card room-${theme}`}>
      <div className="room-card-top">
        <span className={`room-badge badge-${badge.type}`}>{badge.label}</span>
      </div>
      <div className="room-card-hero">
        <img src={imgSrc} alt={title} className="room-hero-img" />
      </div>
      <div className="room-card-body">
        <h3 className="room-card-title">{title}</h3>
        <p className="room-card-sub">{subtitle}</p>
        <div className="room-stats-row">
          <div className="room-stat-players">
            <i className="fa-solid fa-user"></i>
            <span>{players}</span>
          </div>
          <div className="room-stat-divider"></div>
          <div className="room-stat-jackpot">
            <i className="fa-solid fa-trophy"></i>
            <span>JACKPOT</span>
          </div>
        </div>
        <button
          className={`room-play-btn btn-${theme}`}
          onClick={handlePlayNow}
        >
          <span>PLAY NOW</span>
          <i className="fa-solid fa-arrow-right"></i>
        </button>
      </div>
    </div>
  );
};
