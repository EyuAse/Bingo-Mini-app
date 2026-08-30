import React, { createContext, useContext, useState, ReactNode } from 'react';

export type PageId =
  | 'landing'
  | 'login'
  | 'signup'
  | 'games'
  | 'wallet'
  | 'history'
  | 'leader'
  | 'profile'
  | 'bingo'
  | 'affiliate'
  | 'account-info'
  | 'help'
  | 'about'
  | 'admin';

interface AppContextType {
  currentPage: PageId;
  switchPage: (page: PageId) => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState<PageId>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const path = window.location.pathname;
      if (hash.includes('lomibingo-Admin-vBingo') || path.includes('lomibingo-Admin-vBingo') || hash.includes('admin')) {
        return 'admin';
      }
    }
    return 'landing';
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastTimeout, setToastTimeout] = useState<number | null>(null);

  // URL Hash routing listener for private route
  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const path = window.location.pathname;
      if (hash.includes('lomibingo-Admin-vBingo') || path.includes('lomibingo-Admin-vBingo') || hash.includes('admin')) {
        setCurrentPage('admin');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const switchPage = (page: PageId) => {
    setCurrentPage(page);
    if (page === 'admin') {
      window.location.hash = '/lomibingo-Admin-vBingo';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showToast = (msg: string) => {
    if (toastTimeout) {
      clearTimeout(toastTimeout);
    }
    setToastMessage(msg);
    const timeout = window.setTimeout(() => {
      setToastMessage(null);
    }, 2500);
    setToastTimeout(timeout);
  };

  return (
    <AppContext.Provider value={{ currentPage, switchPage, toastMessage, showToast }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
