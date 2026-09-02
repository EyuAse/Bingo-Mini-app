import React from 'react';
import { useApp } from '../context/AppContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useWallet } from '../context/WalletContext.tsx';

export const BingoPage: React.FC = () => {
  const { switchPage } = useApp();
  const { lang } = useLanguage();
  const { balance, bonus } = useWallet();

  const totalFunds = balance + bonus;

  return (
    <div className="page active fresh-bingo-page" id="page-bingo" style={{ paddingBottom: 40 }}>
      <div className="bingo-page-content-wrapper" style={{ maxWidth: 460, margin: '0 auto', gap: 14 }}>
        
        {/* Top Header Navigation */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 4px'
        }}>
          <button
            type="button"
            onClick={() => switchPage('games')}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: 10,
              padding: '7px 12px',
              fontSize: '0.8125rem',
              fontWeight: 800,
              color: '#334155',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <i className="fa-solid fa-arrow-left"></i>
            <span>{lang === 'am' ? 'ወደ ጨዋታዎች ተመለስ' : 'Back to Games'}</span>
          </button>

          <span style={{
            background: 'linear-gradient(135deg, #fef08a, #facc15)',
            color: '#854d0e',
            fontSize: '0.6875rem',
            fontWeight: 900,
            padding: '5px 10px',
            borderRadius: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}>
            <i className="fa-solid fa-clock"></i>
            <span>{lang === 'am' ? 'በቅርብ ቀን' : 'COMING SOON'}</span>
          </span>
        </div>

        {/* Hero Card with 3D Lemon & Bingo Balls Artwork */}
        <div style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          borderRadius: 22,
          padding: '26px 18px',
          color: '#ffffff',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 12px 30px rgba(15, 23, 42, 0.25)',
          border: '1.5px solid #334155'
        }}>
          <div style={{
            width: 76,
            height: 76,
            margin: '0 auto 12px',
            background: 'radial-gradient(circle, #fde047 0%, #facc15 60%, #ca8a04 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            boxShadow: '0 8px 24px rgba(250, 204, 21, 0.4)'
          }}>
            🍋
          </div>

          <h2 style={{
            fontSize: '1.35rem',
            fontWeight: 900,
            marginBottom: 6,
            background: 'linear-gradient(135deg, #fef08a, #facc15)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            {lang === 'am' ? 'የሎሚ 75-ኳስ ቢንጎ በቅርብ ቀን!' : 'Lomi 75-Ball Bingo Coming Soon!'}
          </h2>

          <p style={{
            fontSize: '0.8125rem',
            color: '#94a3b8',
            lineHeight: 1.5,
            maxWidth: 340,
            margin: '0 auto 16px'
          }}>
            {lang === 'am'
              ? 'የኢትዮጵያ #1 ፈጣን የገንዘብ ቢንጎ ዝግጅት የመጨረሻ ደረጃ ላይ ይገኛል። በቴሌብር እና በንግድ ባንክ ፈጣን ክፍያ፣ 13 የማሸነፊያ መንገዶች እና የ400 ካርቴላ ገንዳ በቅርቡ ይጀምራል!'
              : 'Ethiopia’s #1 Real-Money Multiplayer Bingo is getting its final touches. Instant Telebirr/CBE payouts, 13 winning patterns, and the 400 Cartela pool launch shortly!'}
          </p>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(255, 255, 255, 0.08)',
            padding: '8px 16px',
            borderRadius: 30,
            fontSize: '0.75rem',
            color: '#cbd5e1'
          }}>
            <i className="fa-solid fa-wallet" style={{ color: '#facc15' }}></i>
            <span>{lang === 'am' ? 'የእርስዎ ቀሪ ሂሳብ፡' : 'Your Wallet Balance:'}</span>
            <strong style={{ color: '#fde047', fontWeight: 900 }}>{totalFunds.toFixed(0)} ETB</strong>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 10
        }}>
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            padding: '14px 12px',
            textAlign: 'center'
          }}>
            <div style={{
              width: 36,
              height: 36,
              margin: '0 auto 8px',
              borderRadius: 10,
              background: '#ecfdf5',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem'
            }}>
              <i className="fa-solid fa-bolt"></i>
            </div>
            <strong style={{ display: 'block', fontSize: '0.78rem', color: '#0f172a', marginBottom: 2 }}>
              {lang === 'am' ? 'ፈጣን ክፍያ' : 'Instant Cashouts'}
            </strong>
            <span style={{ fontSize: '0.6875rem', color: '#64748b' }}>
              {lang === 'am' ? 'በቴሌብር እና በንግድ ባንክ' : 'Via Telebirr & CBE'}
            </span>
          </div>

          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            padding: '14px 12px',
            textAlign: 'center'
          }}>
            <div style={{
              width: 36,
              height: 36,
              margin: '0 auto 8px',
              borderRadius: 10,
              background: '#fefce8',
              color: '#eab308',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem'
            }}>
              <i className="fa-solid fa-shapes"></i>
            </div>
            <strong style={{ display: 'block', fontSize: '0.78rem', color: '#0f172a', marginBottom: 2 }}>
              {lang === 'am' ? '13 የማሸነፊያ መንገዶች' : '13 Win Patterns'}
            </strong>
            <span style={{ fontSize: '0.6875rem', color: '#64748b' }}>
              {lang === 'am' ? 'ረድፎች፣ አምዶች፣ 4 ማዕዘኖች' : 'Lines, Diagonals & Corners'}
            </span>
          </div>

          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            padding: '14px 12px',
            textAlign: 'center'
          }}>
            <div style={{
              width: 36,
              height: 36,
              margin: '0 auto 8px',
              borderRadius: 10,
              background: '#f5f3ff',
              color: '#8b5cf6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem'
            }}>
              <i className="fa-solid fa-table-cells-large"></i>
            </div>
            <strong style={{ display: 'block', fontSize: '0.78rem', color: '#0f172a', marginBottom: 2 }}>
              {lang === 'am' ? '400 የካርቴላ ገንዳ' : '400 Cartela Pool'}
            </strong>
            <span style={{ fontSize: '0.6875rem', color: '#64748b' }}>
              {lang === 'am' ? 'እስከ 3 ካርቴላ በአንድ ጊዜ' : 'Play up to 3 cards'}
            </span>
          </div>

          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            padding: '14px 12px',
            textAlign: 'center'
          }}>
            <div style={{
              width: 36,
              height: 36,
              margin: '0 auto 8px',
              borderRadius: 10,
              background: '#fff1f2',
              color: '#f43f5e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem'
            }}>
              <i className="fa-solid fa-gift"></i>
            </div>
            <strong style={{ display: 'block', fontSize: '0.78rem', color: '#0f172a', marginBottom: 2 }}>
              {lang === 'am' ? '2 ሲገዙ 1 በነጻ' : 'Buy 2 Get 1 Free'}
            </strong>
            <span style={{ fontSize: '0.6875rem', color: '#64748b' }}>
              {lang === 'am' ? 'ተጨማሪ የማሸነፍ እድል' : '3 Cards for price of 2'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 6 }}>
          <button
            type="button"
            onClick={() => switchPage('wallet')}
            style={{
              background: 'linear-gradient(135deg, #fde047 0%, #facc15 50%, #eab308 100%)',
              border: 'none',
              borderRadius: 14,
              padding: '14px',
              fontSize: '0.875rem',
              fontWeight: 900,
              color: '#0f172a',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 4px 16px rgba(234, 179, 8, 0.4)'
            }}
          >
            <i className="fa-solid fa-wallet"></i>
            <span>{lang === 'am' ? 'ገንዘብ ያስገቡ እና ይዘጋጁ' : 'Deposit & Top Up Wallet'}</span>
          </button>

          <button
            type="button"
            onClick={() => switchPage('games')}
            style={{
              background: '#f8fafc',
              border: '1.5px solid #e2e8f0',
              borderRadius: 14,
              padding: '12px',
              fontSize: '0.8125rem',
              fontWeight: 800,
              color: '#475569',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
          >
            <i className="fa-solid fa-gamepad"></i>
            <span>{lang === 'am' ? 'ወደ ጨዋታዎች ዝርዝር ተመለስ' : 'Explore Other Games'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
