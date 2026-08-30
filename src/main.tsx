import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App.tsx';
import { AppProvider } from './context/AppContext.tsx';
import { LanguageProvider } from './context/LanguageContext.tsx';
import { WalletProvider } from './context/WalletContext.tsx';
import { BingoProvider } from './context/BingoContext.tsx';
import { AdminProvider } from './context/AdminContext.tsx';

// Stylesheets
import './styles/index.css';
import './styles/header.css';
import './styles/games.css';
import './styles/wallet.css';
import './styles/navigation.css';
import './styles/bingo.css';
import './styles/landing.css';
import './styles/admin.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LanguageProvider>
      <AdminProvider>
        <AppProvider>
          <WalletProvider>
            <BingoProvider>
              <App />
            </BingoProvider>
          </WalletProvider>
        </AppProvider>
      </AdminProvider>
    </LanguageProvider>
  </React.StrictMode>
);
