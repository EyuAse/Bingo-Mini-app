import React from 'react';
import { useLanguage } from '../context/LanguageContext.tsx';

export const HistoryPage: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="page active" id="page-history">
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: '16px',
          padding: '24px',
          textAlign: 'center'
        }}
      >
        <i className="fa-solid fa-clock-rotate-left" style={{ fontSize: '3.5rem', color: 'var(--text-muted)' }}></i>
        <h3 style={{ color: '#ffffff', fontSize: '1.25rem', fontWeight: 800 }}>{t('history.title')}</h3>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', fontWeight: 500, maxWidth: '300px' }}>
          {t('history.noHistory')}
        </span>
      </div>
    </div>
  );
};
