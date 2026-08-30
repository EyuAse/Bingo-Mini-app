import React from 'react';

export const FastBingoArt: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`fast-bingo-art-exact-wrap ${className}`}>
      <svg
        viewBox="0 0 200 170"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="fast-bingo-art-svg"
      >
        <defs>
          {/* Card Gradients */}
          <linearGradient id="card-green-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#15803d" />
          </linearGradient>

          <linearGradient id="card-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fde047" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>

          <linearGradient id="card-purple-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#6b21a8" />
          </linearGradient>

          {/* Red Ball 5 Gradient */}
          <radialGradient id="ball-red-radial" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#fca5a5" />
            <stop offset="40%" stopColor="#ef4444" />
            <stop offset="90%" stopColor="#991b1b" />
            <stop offset="100%" stopColor="#450a0a" />
          </radialGradient>

          {/* Green Ball 3 Gradient */}
          <radialGradient id="ball-green-radial" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#86efac" />
            <stop offset="40%" stopColor="#22c55e" />
            <stop offset="90%" stopColor="#166534" />
            <stop offset="100%" stopColor="#052e16" />
          </radialGradient>

          {/* Gold Coin Medal Gradient */}
          <radialGradient id="coin-gold-radial" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="35%" stopColor="#facc15" />
            <stop offset="75%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#854d0e" />
          </radialGradient>

          <linearGradient id="gold-text-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fffbeb" />
            <stop offset="30%" stopColor="#fde047" />
            <stop offset="70%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#ca8a04" />
          </linearGradient>

          {/* Filters for 3D Drop Shadow */}
          <filter id="art-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* 1. THREE BINGO CARDS IN BACKGROUND */}
        {/* Left Green Card */}
        <g transform="translate(48, 12) rotate(-16)" filter="url(#art-shadow)">
          <rect width="52" height="74" rx="5" fill="url(#card-green-grad)" stroke="#ffffff" strokeWidth="1.5" />
          <rect x="3" y="3" width="46" height="12" rx="2" fill="#14532d" />
          <text x="26" y="12" fill="#ffffff" fontSize="7" fontWeight="900" textAnchor="middle" letterSpacing="1">B I N G O</text>
          {/* Numbers Grid */}
          <rect x="3" y="17" width="46" height="53" rx="2" fill="#dcfce7" fillOpacity="0.95" />
          <text x="26" y="27" fill="#14532d" fontSize="5" fontWeight="800" textAnchor="middle">12  25  38  51  66</text>
          <text x="26" y="38" fill="#14532d" fontSize="5" fontWeight="800" textAnchor="middle">9   25  38  59  72</text>
          <text x="26" y="49" fill="#14532d" fontSize="5" fontWeight="800" textAnchor="middle">5   27  ★   59  78</text>
          <text x="26" y="60" fill="#14532d" fontSize="5" fontWeight="800" textAnchor="middle">6   29  37  61  73</text>
        </g>

        {/* Right Purple Card */}
        <g transform="translate(112, 16) rotate(16)" filter="url(#art-shadow)">
          <rect width="52" height="74" rx="5" fill="url(#card-purple-grad)" stroke="#ffffff" strokeWidth="1.5" />
          <rect x="3" y="3" width="46" height="12" rx="2" fill="#4c1d95" />
          <text x="26" y="12" fill="#ffffff" fontSize="7" fontWeight="900" textAnchor="middle" letterSpacing="1">B I N G O</text>
          {/* Numbers Grid */}
          <rect x="3" y="17" width="46" height="53" rx="2" fill="#f3e8ff" fillOpacity="0.95" />
          <text x="26" y="27" fill="#4c1d95" fontSize="5" fontWeight="800" textAnchor="middle">12  25  38  51  66</text>
          <text x="26" y="38" fill="#4c1d95" fontSize="5" fontWeight="800" textAnchor="middle">12  25  38  57  66</text>
          <text x="26" y="49" fill="#4c1d95" fontSize="5" fontWeight="800" textAnchor="middle">5   26  ★   56  72</text>
          <text x="26" y="60" fill="#4c1d95" fontSize="5" fontWeight="800" textAnchor="middle">9   23  39  59  79</text>
        </g>

        {/* Middle Gold Card */}
        <g transform="translate(74, 4)" filter="url(#art-shadow)">
          <rect width="52" height="76" rx="5" fill="url(#card-gold-grad)" stroke="#ffffff" strokeWidth="1.5" />
          <rect x="3" y="3" width="46" height="12" rx="2" fill="#78350f" />
          <text x="26" y="12" fill="#ffffff" fontSize="7" fontWeight="900" textAnchor="middle" letterSpacing="1">B I N G O</text>
          {/* Numbers Grid */}
          <rect x="3" y="17" width="46" height="55" rx="2" fill="#fef9c3" fillOpacity="0.95" />
          <text x="26" y="28" fill="#78350f" fontSize="5.2" fontWeight="800" textAnchor="middle">12  25  38  51  66</text>
          <text x="26" y="40" fill="#78350f" fontSize="5.2" fontWeight="800" textAnchor="middle">9   25  38  59  72</text>
          <text x="26" y="52" fill="#78350f" fontSize="5.2" fontWeight="800" textAnchor="middle">5   27  ★   59  78</text>
          <text x="26" y="64" fill="#78350f" fontSize="5.2" fontWeight="800" textAnchor="middle">6   29  37  61  73</text>
        </g>

        {/* 2. BALL 5 (RED) ON LEFT */}
        <g transform="translate(56, 74)" filter="url(#art-shadow)">
          <circle cx="16" cy="16" r="16" fill="url(#ball-red-radial)" stroke="#ffffff" strokeWidth="1" />
          {/* White inner disc */}
          <circle cx="16" cy="16" r="9" fill="#ffffff" />
          <text x="16" y="21" fill="#991b1b" fontSize="13" fontWeight="950" textAnchor="middle" fontFamily="sans-serif">5</text>
          {/* Ball Shine */}
          <ellipse cx="12" cy="10" rx="4" ry="2" transform="rotate(-30 12 10)" fill="#ffffff" fillOpacity="0.6" />
        </g>

        {/* 3. BALL 3 (GREEN) ON RIGHT */}
        <g transform="translate(126, 74)" filter="url(#art-shadow)">
          <circle cx="16" cy="16" r="16" fill="url(#ball-green-radial)" stroke="#ffffff" strokeWidth="1" />
          {/* White inner disc */}
          <circle cx="16" cy="16" r="9" fill="#ffffff" />
          <text x="16" y="21" fill="#166534" fontSize="13" fontWeight="950" textAnchor="middle" fontFamily="sans-serif">3</text>
          {/* Ball Shine */}
          <ellipse cx="12" cy="10" rx="4" ry="2" transform="rotate(-30 12 10)" fill="#ffffff" fillOpacity="0.6" />
        </g>

        {/* 4. LARGE 3D GOLD STAR MEDAL COIN IN CENTER */}
        <g transform="translate(76, 56)" filter="url(#art-shadow)">
          {/* Outer Coin Edge Ring */}
          <circle cx="24" cy="24" r="23" fill="#b45309" />
          <circle cx="24" cy="24" r="21" fill="url(#coin-gold-radial)" stroke="#ffffff" strokeWidth="1" />
          {/* Inner Groove Ring */}
          <circle cx="24" cy="24" r="17" fill="none" stroke="#78350f" strokeWidth="1" strokeOpacity="0.4" />

          {/* 3D Gold Star */}
          <polygon
            points="24,11 27.8,19.5 37,20.5 30.2,26.5 32.2,35.5 24,31 15.8,35.5 17.8,26.5 11,20.5 20.2,19.5"
            fill="#fde047"
            stroke="#78350f"
            strokeWidth="0.8"
          />
          {/* Star Highlight facets */}
          <polygon points="24,11 24,31 32.2,35.5 30.2,26.5" fill="#facc15" fillOpacity="0.8" />
          <polygon points="24,11 24,31 15.8,35.5 17.8,26.5" fill="#fef08a" fillOpacity="0.9" />

          {/* Coin Highlight */}
          <ellipse cx="17" cy="15" rx="6" ry="3" transform="rotate(-25 17 15)" fill="#ffffff" fillOpacity="0.5" />
        </g>

        {/* 5. 3D METALLIC "FAST BINGO" TEXT */}
        <g transform="translate(100, 142)">
          {/* Text Shadow / Outline */}
          <text
            x="0"
            y="0"
            fill="#451a03"
            fontSize="18"
            fontWeight="950"
            textAnchor="middle"
            letterSpacing="0.5"
            stroke="#451a03"
            strokeWidth="3.5"
            strokeLinejoin="round"
            fontFamily="'Outfit', sans-serif"
          >
            FAST BINGO
          </text>
          {/* Main Gold Gradient Text */}
          <text
            x="0"
            y="0"
            fill="url(#gold-text-grad)"
            fontSize="18"
            fontWeight="950"
            textAnchor="middle"
            letterSpacing="0.5"
            stroke="#ffffff"
            strokeWidth="0.5"
            fontFamily="'Outfit', sans-serif"
          >
            FAST BINGO
          </text>
        </g>
      </svg>
    </div>
  );
};
