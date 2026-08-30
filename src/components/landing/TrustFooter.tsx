import React from 'react';

export const TrustFooter: React.FC = () => {
  return (
    <footer className="landing-fresh-trust-bar">
      <div className="trust-pillar-item">
        <div className="pillar-icon-box gold">
          <i className="fa-solid fa-shield-halved"></i>
        </div>
        <div className="pillar-text-group">
          <strong className="pillar-title">100% Secure</strong>
          <span className="pillar-sub">Safe & Fair Play</span>
        </div>
      </div>

      <div className="trust-pillar-sep"></div>

      <div className="trust-pillar-item">
        <div className="pillar-icon-box gold">
          <i className="fa-solid fa-bolt"></i>
        </div>
        <div className="pillar-text-group">
          <strong className="pillar-title">Instant Payouts</strong>
          <span className="pillar-sub">Fast & Reliable</span>
        </div>
      </div>

      <div className="trust-pillar-sep"></div>

      <div className="trust-pillar-item">
        <div className="pillar-icon-box gold">
          <i className="fa-solid fa-headset"></i>
        </div>
        <div className="pillar-text-group">
          <strong className="pillar-title">24/7 Support</strong>
          <span className="pillar-sub">We're here for you</span>
        </div>
      </div>
    </footer>
  );
};
