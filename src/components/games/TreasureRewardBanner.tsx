import React from 'react';

export const TreasureRewardBanner: React.FC = () => {
  return (
    <div className="lobby-rewards-chest-card">
      {/* Left: 3D Balls (75, 32, 61) */}
      <div className="chest-balls-cluster-left">
        {/* Top 75 Ball (Blue Glossy) */}
        <div className="chest-3d-ball ball-blue-75">
          <div className="ball-inner-ring">
            <span className="ball-num-bold">75</span>
          </div>
          <div className="ball-gloss-highlight"></div>
        </div>

        {/* Bottom Pair: 32 (Green) & 61 (Magenta) */}
        <div className="chest-balls-bottom-row">
          <div className="chest-3d-ball ball-green-32">
            <div className="ball-inner-ring">
              <span className="ball-num-bold">32</span>
            </div>
            <div className="ball-gloss-highlight"></div>
          </div>

          <div className="chest-3d-ball ball-magenta-61">
            <div className="ball-inner-ring">
              <span className="ball-num-bold">61</span>
            </div>
            <div className="ball-gloss-highlight"></div>
          </div>
        </div>
      </div>

      {/* Center Text */}
      <div className="chest-center-text">
        <h3 className="chest-title-bold">More fun, More wins!</h3>
        <p className="chest-sub-txt">Play, Win & Enjoy Big Rewards!</p>
      </div>

      {/* Right: Glowing 3D Golden Treasure Chest */}
      <div className="chest-graphic-right">
        <svg className="treasure-chest-svg" viewBox="0 0 120 100" fill="none">
          {/* Gold Sparkle Rays */}
          <circle cx="60" cy="50" r="40" fill="url(#chest-glow-rad)" opacity="0.4" />
          <path d="M10 25L15 20L20 25L15 30L10 25Z" fill="#facc15" />
          <path d="M100 15L104 10L108 15L104 20L100 15Z" fill="#facc15" />
          <path d="M105 75L108 72L111 75L108 78L105 75Z" fill="#facc15" />

          {/* Wooden Chest Base */}
          <rect x="25" y="45" width="70" height="42" rx="6" fill="url(#wood-grad)" stroke="#854d0e" strokeWidth="2.5" />
          <rect x="25" y="45" width="70" height="12" fill="#ca8a04" opacity="0.2" />

          {/* Golden Straps & Rivets */}
          <rect x="35" y="45" width="10" height="42" fill="url(#gold-metal-grad)" stroke="#854d0e" strokeWidth="1.5" />
          <rect x="75" y="45" width="10" height="42" fill="url(#gold-metal-grad)" stroke="#854d0e" strokeWidth="1.5" />
          <circle cx="40" cy="52" r="1.5" fill="#713f12" />
          <circle cx="40" cy="80" r="1.5" fill="#713f12" />
          <circle cx="80" cy="52" r="1.5" fill="#713f12" />
          <circle cx="80" cy="80" r="1.5" fill="#713f12" />

          {/* Golden Lock Clasp */}
          <rect x="54" y="52" width="12" height="15" rx="3" fill="url(#gold-metal-grad)" stroke="#713f12" strokeWidth="1.5" />
          <circle cx="60" cy="58" r="2" fill="#713f12" />
          <rect x="59" y="58" width="2" height="5" fill="#713f12" />

          {/* Open Chest Lid (Tilted Up) */}
          <path d="M22 45C22 25 35 15 60 15C85 15 98 25 98 45L92 45C92 28 80 20 60 20C40 20 28 28 28 45Z" fill="url(#wood-lid-grad)" stroke="#854d0e" strokeWidth="2" />
          <path d="M33 45C33 30 40 22 60 22C80 22 87 30 87 45" stroke="#eab308" strokeWidth="3" fill="none" />

          {/* Overflowing Gold Coins & Sparkling Gems */}
          <ellipse cx="60" cy="45" rx="28" ry="10" fill="url(#gold-coins-grad)" />
          {/* Individual Gold Coins */}
          <circle cx="50" cy="40" r="5.5" fill="#fde047" stroke="#ca8a04" strokeWidth="1" />
          <circle cx="60" cy="38" r="6" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />
          <circle cx="70" cy="41" r="5" fill="#fde047" stroke="#ca8a04" strokeWidth="1" />
          <circle cx="42" cy="44" r="5" fill="#eab308" stroke="#ca8a04" strokeWidth="1" />
          <circle cx="78" cy="43" r="5" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />
          <circle cx="55" cy="44" r="6" fill="#fde047" stroke="#ca8a04" strokeWidth="1" />
          <circle cx="65" cy="43" r="5.5" fill="#fde047" stroke="#ca8a04" strokeWidth="1" />

          {/* Sparkling Cyan & Ruby Gems */}
          <polygon points="46,35 50,32 54,35 50,38" fill="#38bdf8" stroke="#0284c7" strokeWidth="0.8" />
          <polygon points="66,34 70,30 74,34 70,38" fill="#f43f5e" stroke="#be123c" strokeWidth="0.8" />
          <polygon points="58,32 61,28 64,32 61,35" fill="#a855f7" stroke="#7e22ce" strokeWidth="0.8" />

          {/* Scattered Coins on Floor */}
          <ellipse cx="30" cy="88" rx="7" ry="3.5" fill="#fde047" stroke="#ca8a04" strokeWidth="1" />
          <ellipse cx="38" cy="92" rx="6.5" ry="3" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />
          <ellipse cx="90" cy="89" rx="6" ry="3" fill="#fde047" stroke="#ca8a04" strokeWidth="1" />

          <defs>
            <radialGradient id="chest-glow-rad" cx="0.5" cy="0.5" r="0.5">
              <stop stopColor="#fef08a" stopOpacity="0.9" />
              <stop offset="1" stopColor="#facc15" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="wood-grad" x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#b45309" />
              <stop offset="1" stopColor="#78350f" />
            </linearGradient>
            <linearGradient id="wood-lid-grad" x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#d97706" />
              <stop offset="1" stopColor="#92400e" />
            </linearGradient>
            <linearGradient id="gold-metal-grad" x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#fde047" />
              <stop offset="0.5" stopColor="#eab308" />
              <stop offset="1" stopColor="#a16207" />
            </linearGradient>
            <linearGradient id="gold-coins-grad" x1="0" y1="0" x2="1" y2="0">
              <stop stopColor="#eab308" />
              <stop offset="0.5" stopColor="#fde047" />
              <stop offset="1" stopColor="#facc15" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
};
