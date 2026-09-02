import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { apiClient } from '../services/apiClient';
import { socketService } from '../services/socketService';

interface WalletContextType {
  balance: number;
  bonus: number;
  isBalanceVisible: boolean;
  toggleBalanceVisibility: () => void;
  addBalance: (amount: number) => void;
  deductBalance: (amount: number) => boolean;
  addBonus: (amount: number) => void;
  deductBonus: (amount: number) => boolean;
  refreshBalance: () => Promise<void>;
  isRefreshing: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Purge any legacy mock storage on initial run
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('betika_user_balance');
      localStorage.removeItem('betika_user_bonus');
    }
  }, []);

  const [balance, setBalance] = useState<number>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('lomi_live_balance') : null;
    return saved ? parseFloat(saved) : 0.0;
  });

  const [bonus, setBonus] = useState<number>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('lomi_live_bonus') : null;
    return saved ? parseFloat(saved) : 0.0;
  });

  const [isBalanceVisible, setIsBalanceVisible] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Sync strictly to live cache
  useEffect(() => {
    localStorage.setItem('lomi_live_balance', balance.toFixed(2));
  }, [balance]);

  useEffect(() => {
    localStorage.setItem('lomi_live_bonus', bonus.toFixed(2));
  }, [bonus]);

  // Fetch Live Real Balance directly from Neon PostgreSQL
  const fetchLiveBalance = useCallback(async () => {
    try {
      const data = await apiClient.wallet.getBalance();
      if (data && typeof data.balance === 'number') {
        setBalance(data.balance);
        setBonus(data.bonus);
      }
    } catch {
      // Offline fallback
    }
  }, []);

  useEffect(() => {
    fetchLiveBalance();
  }, [fetchLiveBalance]);

  // Real-time WebSocket Balance Updates & Admin Cashier Approvals
  useEffect(() => {
    const handleDepositApproved = (e: any) => {
      if (e.detail && typeof e.detail.amount === 'number') {
        setBalance(prev => prev + e.detail.amount);
      }
    };

    const handleWalletUpdated = (e: any) => {
      if (e.detail) {
        if (typeof e.detail.balance === 'number') setBalance(e.detail.balance);
        if (typeof e.detail.bonus === 'number') setBonus(e.detail.bonus);
      }
    };

    const handleStorage = () => {
      const saved = localStorage.getItem('lomi_live_balance');
      const savedBonus = localStorage.getItem('lomi_live_bonus');
      if (saved) setBalance(parseFloat(saved));
      if (savedBonus) setBonus(parseFloat(savedBonus));
    };

    window.addEventListener('lb_deposit_approved' as any, handleDepositApproved);
    window.addEventListener('lb_wallet_updated' as any, handleWalletUpdated);
    window.addEventListener('storage', handleStorage);

    const socket = socketService.connect();
    const handleBalanceEvent = (data: any) => {
      console.log('⚡ [Live Real Balance Event Received]:', data);
      if (typeof data.newBalance === 'number') {
        setBalance(data.newBalance);
      } else if (typeof data.amount === 'number') {
        setBalance(prev => prev + data.amount);
      }
    };

    socket.on('user_balance_updated', handleBalanceEvent);

    return () => {
      window.removeEventListener('lb_deposit_approved' as any, handleDepositApproved);
      window.removeEventListener('lb_wallet_updated' as any, handleWalletUpdated);
      window.removeEventListener('storage', handleStorage);
      socket.off('user_balance_updated', handleBalanceEvent);
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

  const refreshBalance = async () => {
    setIsRefreshing(true);
    await fetchLiveBalance();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 400);
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
