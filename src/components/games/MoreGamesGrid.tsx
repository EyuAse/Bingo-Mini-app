import React from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';

interface MiniGame {
  id: string;
  nameKey: string;
  categoryKey: string;
  img: string;
  badge?: string;
  isAviator?: boolean;
}

const miniGames: MiniGame[] = [
  {
    id: 'lucky-mines',
    nameKey: 'games.luckyMines',
    categoryKey: 'games.minesTag',
    img: '/assets/images/lucky-mines.jpg'
  },
  {
    id: 'fast-keno',
    nameKey: 'games.fastKeno',
    categoryKey: 'games.instantWinTag',
    img: '/assets/images/fast-keno.jpg',
    badge: 'fa-check'
  },
  {
    id: 'aviator',
    nameKey: 'games.aviator',
    categoryKey: 'games.crashTag',
    img: '/assets/images/aviator.png',
    isAviator: true
  },
  {
    id: 'chicken-road',
    nameKey: 'games.chickenRoad',
    categoryKey: 'games.arcadeTag',
    img: '/assets/images/chicken-road.jpg'
  }
];

export const MoreGamesGrid: React.FC = () => {
  const { showToast } = useApp();
  const { lang, t } = useLanguage();

  const handleGameClick = (game: MiniGame) => {
    const gameName = t(game.nameKey);
    const msg =
      lang === 'am'
        ? `🚀 ${gameName} በቅርብ ቀን ይጠብቁን! (Coming Soon)`
        : `🚀 ${gameName} is coming soon!`;
    showToast(msg);
  };

  return (
    <div className="more-games-section">
      <div className="section-header">
        <h3 className="section-title">
          <i className="fa-solid fa-shapes"></i>
          {t('games.moreGames')}
        </h3>
      </div>
      <div className="more-games-grid">
        {miniGames.map(game => (
          <div
            key={game.id}
            className={`game-card ${game.isAviator ? 'aviator' : ''}`}
            onClick={() => handleGameClick(game)}
            title={lang === 'am' ? 'በቅርብ ቀን ይጠብቁን' : 'Coming Soon'}
          >
            <div className="game-card-thumb-wrapper">
              <img
                src={game.img}
                alt={t(game.nameKey)}
                className="game-card-img"
                onError={e => {
                  const target = e.currentTarget;
                  if (game.id === 'lucky-mines') target.src = '/assets/images/room-30-ball.svg';
                  else if (game.id === 'fast-keno') target.src = '/assets/images/room-special.svg';
                  else if (game.id === 'aviator') target.src = '/assets/images/room-75-ball.svg';
                  else if (game.id === 'chicken-road') target.src = '/assets/images/room-90-ball.svg';
                }}
              />
              <span className="coming-soon-badge">
                {lang === 'am' ? 'በቅርብ ቀን' : 'SOON'}
              </span>
              {game.badge && (
                <div className="check-badge">
                  <i className={`fa-solid ${game.badge}`}></i>
                </div>
              )}
            </div>
            <div className="game-card-footer">
              <span className="game-card-name">{t(game.nameKey)}</span>
              <span className="game-card-cat">{t(game.categoryKey)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
