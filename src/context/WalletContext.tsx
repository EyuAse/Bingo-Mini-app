import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface WalletContextType {
  balance: number;
  bonus: number;
  isBalanceVisible: boolean;
  toggleBalanceVisibility: () => void;
  addBalance: (amount: number) => void;
  deductBalance: (amount: number) => boolean;
  addBonus: (amount: number) => void;
  deductBonus: (amount: number) => boolean;
  refreshBalance: () => void;
  isRefreshing: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [balance, setBalance] = useState<number>(() => {
    const saved = localStorage.getItem('betika_user_balance');
    if (saved) {
      const val = parseFloat(saved);
      return val < 500 ? 500.0 : val;
    }
    return 750.0;
  });
  const [bonus, setBonus] = useState<number>(() => {
    const saved = localStorage.getItem('betika_user_bonus');
    return saved ? parseFloat(saved) : 10.0; // 10 Birr Registration Bonus
  });
  const [isBalanceVisible, setIsBalanceVisible] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('betika_user_balance', balance.toFixed(2));
  }, [balance]);

  useEffect(() => {
    localStorage.setItem('betika_user_bonus', bonus.toFixed(2));
  }, [bonus]);

  // Reactive listener to admin cashier approvals
  useEffect(() => {
    const handleDepositApproved = (e: any) => {
      if (e.detail && e.detail.amount) {
        setBalance(prev => prev + e.detail.amount);
      }
    };

    const handleStorage = () => {
      const saved = localStorage.getItem('betika_user_balance');
      if (saved) {
        setBalance(parseFloat(saved));
      }
    };

    window.addEventListener('lb_deposit_approved' as any, handleDepositApproved);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('lb_deposit_approved' as any, handleDepositApproved);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const toggleBalanceVisibility = () => {
    setIsBalanceVisible(prev => !prev);
  };

  const addBalance = (amount: number) => {
    setBalance(prev => prev + amount);
  };

  const deductBalance = (amount: number): boolean => {
    if (balance >= amount) {
      setBalance(prev => prev - amount);
      return true;
    }
    return false;
  };

  const addBonus = (amount: number) => {
    setBonus(prev => prev + amount);
  };

  const deductBonus = (amount: number): boolean => {
    if (bonus >= amount) {
      setBonus(prev => prev - amount);
      return true;
    }
    return false;
  };

  const refreshBalance = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  return (
    <WalletContext.Provider
      value={{
        balance,
        bonus,
        isBalanceVisible,
        toggleBalanceVisibility,
        addBalance,
        deductBalance,
        addBonus,
        deductBonus,
        refreshBalance,
        isRefreshing
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
