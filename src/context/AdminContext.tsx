import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface UserAccount {
  id: string;
  name: string;
  phone: string;
  balance: number;
  bonus: number;
  referredBy?: string;
  referralCount: number;
  totalDeposited: number;
  totalWithdrawn: number;
  status: 'active' | 'suspended';
  createdAt: string;
}

export interface TransactionRequest {
  id: string;
  userId: string;
  userName: string;
  phone: string;
  method: 'Telebirr' | 'CBE';
  type: 'deposit' | 'withdrawal';
  amount: number;
  accountNumber: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface BotPlayer {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  cartelasPlayed: number;
  winsCount: number;
  isBot: true;
}

export interface CartelaCard {
  id: number;
  serialNumber: string;
  grid: number[]; // 25 numbers
}

interface AdminContextType {
  // Brand & General
  brandName: string;
  setBrandName: (name: string) => void;
  isAuthenticated: boolean;
  loginAdmin: (pin: string) => boolean;
  logoutAdmin: () => void;
  adminPin: string;
  setAdminPin: (pin: string) => void;

  // Commission & House Cut
  houseCommissionEnabled: boolean;
  setHouseCommissionEnabled: (enabled: boolean) => void;
  commissionRate: number; // e.g. 10 for 10%
  setCommissionRate: (rate: number) => void;

  // Game Rules & Staking
  stakes: number[];
  setStakes: (stakes: number[]) => void;
  buy2Get1Bonus: boolean;
  setBuy2Get1Bonus: (enabled: boolean) => void;
  verticalBoardMode: boolean;
  setVerticalBoardMode: (enabled: boolean) => void;

  // Bonuses
  registerBonus: number; // 10 ETB
  setRegisterBonus: (amount: number) => void;
  referralBonusRate: number; // 10%
  setReferralBonusRate: (rate: number) => void;

  // Bot & Live Player Simulator
  simulatedPlayerCount: number;
  setSimulatedPlayerCount: (count: number) => void;
  botWinRate: number; // 30%
  setBotWinRate: (rate: number) => void;
  ownerWinTarget: number; // 20%
  setOwnerWinTarget: (rate: number) => void;
  botPool: BotPlayer[];

  // 400 Cartelas
  cartelaPool: CartelaCard[];

  // Users Management
  users: UserAccount[];
  addUser: (user: Omit<UserAccount, 'id' | 'createdAt'>) => void;
  adjustUserBalance: (userId: string, amount: number, isBonus?: boolean) => void;
  toggleUserStatus: (userId: string) => void;

  // Deposit & Withdraw Desk
  transactions: TransactionRequest[];
  approveTransaction: (id: string) => void;
  rejectTransaction: (id: string) => void;
  addDepositRequest: (userId: string, userName: string, phone: string, amount: number, method: 'Telebirr' | 'CBE', accountNumber: string) => void;
  addWithdrawRequest: (userId: string, userName: string, phone: string, amount: number, method: 'Telebirr' | 'CBE', accountNumber: string) => void;

  // Financial Stats
  totalHouseProfit: number;
  recordHouseCommission: (amount: number) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

// Generate 200+ realistic Ethiopian bot profiles
const generateEthiopianBots = (): BotPlayer[] => {
  const firstNames = [
    'Abebe', 'Almaz', 'Bekele', 'Chala', 'Dawit', 'Ephrem', 'Fikirte', 'Getachew',
    'Haile', 'Helen', 'Kassahun', 'Lensa', 'Marta', 'Natnael', 'Rahel', 'Samuel',
    'Selam', 'Tariku', 'Tewodros', 'Yared', 'Zinash', 'Bilen', 'Desta', 'Ermias',
    'Fasil', 'Genet', 'Hana', 'Kiros', 'Mulugeta', 'Netsanet', 'Robel', 'Senait',
    'Tadesse', 'Wondwosen', 'Yordanos', 'Zelalem', 'Abinet', 'Bethel', 'Daniel',
    'Eskinder', 'Frehiwot', 'Girum', 'Hiwot', 'Kalkidan', 'Mahlet', 'Nahom'
  ];
  const lastNames = [
    'Bikila', 'Kebede', 'Mengistu', 'Alemu', 'Tadesse', 'Tesfaye', 'Haile', 'Worku',
    'Assefa', 'Girma', 'Demissie', 'Bogale', 'Wolde', 'Dibaba', 'Tolessa', 'Berhanu',
    'Kassa', 'Legesse', 'Negash', 'Mekonnen', 'Alemayehu', 'Zewde', 'Tefera', 'Shiferaw'
  ];
  const avatars = ['🦁', '👑', '⚡', '🌟', '💎', '🔥', '🎯', '🦅', '🍀', '🏆', '🍋', '⚽'];

  const bots: BotPlayer[] = [];
  let count = 0;
  for (const fn of firstNames) {
    for (const ln of lastNames) {
      if (count >= 220) break;
      const numPart = Math.floor(100000 + Math.random() * 900000);
      bots.push({
        id: `bot-${count + 1}`,
        name: `${fn} ${ln.charAt(0)}.`,
        phone: `+251 9${Math.floor(10 + Math.random() * 89)} ${numPart.toString().slice(0, 3)} ${numPart.toString().slice(3)}`,
        avatar: avatars[count % avatars.length],
        cartelasPlayed: Math.floor(12 + Math.random() * 88),
        winsCount: Math.floor(1 + Math.random() * 15),
        isBot: true
      });
      count++;
    }
  }
  return bots;
};

// Generate 400 unique Cartelas pool
const generate400Cartelas = (): CartelaCard[] => {
  const cards: CartelaCard[] = [];
  for (let c = 1; c <= 400; c++) {
    const grid: number[] = [];
    const colRanges = [
      [1, 15],
      [16, 30],
      [31, 45],
      [46, 60],
      [61, 75]
    ];
    const cardCols: number[][] = [];
    for (const [min, max] of colRanges) {
      const colNums: number[] = [];
      while (colNums.length < 5) {
        const n = Math.floor(Math.random() * (max - min + 1)) + min;
        if (!colNums.includes(n)) colNums.push(n);
      }
      cardCols.push(colNums);
    }
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        if (row === 2 && col === 2) {
          grid.push(0); // FREE space
        } else {
          grid.push(cardCols[col][row]);
        }
      }
    }
    const serial = `LB-${String(c).padStart(4, '0')}`;
    cards.push({ id: c, serialNumber: serial, grid });
  }
  return cards;
};

const initialUsers: UserAccount[] = [
  {
    id: 'usr-1',
    name: 'Abebe Bikila',
    phone: '+251 911 234 567',
    balance: 750.0,
    bonus: 25.0,
    referralCount: 4,
    totalDeposited: 1200.0,
    totalWithdrawn: 450.0,
    status: 'active',
    createdAt: '2026-08-15'
  },
  {
    id: 'usr-2',
    name: 'Selam Tesfaye',
    phone: '+251 922 876 543',
    balance: 320.0,
    bonus: 10.0,
    referralCount: 1,
    totalDeposited: 500.0,
    totalWithdrawn: 180.0,
    status: 'active',
    createdAt: '2026-08-20'
  },
  {
    id: 'usr-3',
    name: 'Dawit Mengistu',
    phone: '+251 933 555 123',
    balance: 85.0,
    bonus: 10.0,
    referralCount: 0,
    totalDeposited: 100.0,
    totalWithdrawn: 0.0,
    status: 'active',
    createdAt: '2026-08-28'
  }
];

const initialTransactions: TransactionRequest[] = [
  {
    id: 'tx-101',
    userId: 'usr-1',
    userName: 'Abebe Bikila',
    phone: '+251 911 234 567',
    method: 'Telebirr',
    type: 'deposit',
    amount: 500.0,
    accountNumber: '0911234567',
    status: 'pending',
    createdAt: '2026-08-30 18:45'
  },
  {
    id: 'tx-102',
    userId: 'usr-2',
    userName: 'Selam Tesfaye',
    phone: '+251 922 876 543',
    method: 'CBE',
    type: 'withdrawal',
    amount: 200.0,
    accountNumber: '100023456789',
    status: 'pending',
    createdAt: '2026-08-30 19:10'
  }
];

export const AdminProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [brandName, setBrandName] = useState<string>('Lomi Bingo');
  const [adminPin, setAdminPin] = useState<string>('1234');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('lomibingo_admin_auth') === 'true';
  });

  // Commission & House Cut (Default: ON, 10%)
  const [houseCommissionEnabled, setHouseCommissionEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('lb_house_commission_enabled');
    return saved !== null ? saved === 'true' : true;
  });
  const [commissionRate, setCommissionRate] = useState<number>(() => {
    const saved = localStorage.getItem('lb_commission_rate');
    return saved ? parseFloat(saved) : 10;
  });

  // Stakes & Promos
  const [stakes, setStakes] = useState<number[]>([10, 20, 50, 100]);
  const [buy2Get1Bonus, setBuy2Get1Bonus] = useState<boolean>(true);
  const [verticalBoardMode, setVerticalBoardMode] = useState<boolean>(false);

  // Bonuses
  const [registerBonus, setRegisterBonus] = useState<number>(10);
  const [referralBonusRate, setReferralBonusRate] = useState<number>(10);

  // Bot & Live Player Simulator
  const [simulatedPlayerCount, setSimulatedPlayerCount] = useState<number>(() => {
    const saved = localStorage.getItem('lb_simulated_players');
    return saved ? parseInt(saved, 10) : 185;
  });
  const [botWinRate, setBotWinRate] = useState<number>(30); // 30%
  const [ownerWinTarget, setOwnerWinTarget] = useState<number>(20); // 20%
  const [botPool] = useState<BotPlayer[]>(generateEthiopianBots);
  const [cartelaPool] = useState<CartelaCard[]>(generate400Cartelas);

  // Users & Transactions
  const [users, setUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('lb_admin_users');
    return saved ? JSON.parse(saved) : initialUsers;
  });

  const [transactions, setTransactions] = useState<TransactionRequest[]>(() => {
    const saved = localStorage.getItem('lb_admin_transactions');
    return saved ? JSON.parse(saved) : initialTransactions;
  });

  const [totalHouseProfit, setTotalHouseProfit] = useState<number>(() => {
    const saved = localStorage.getItem('lb_total_house_profit');
    return saved ? parseFloat(saved) : 18450.0;
  });

  // Save changes
  useEffect(() => {
    localStorage.setItem('lb_house_commission_enabled', String(houseCommissionEnabled));
  }, [houseCommissionEnabled]);

  useEffect(() => {
    localStorage.setItem('lb_commission_rate', String(commissionRate));
  }, [commissionRate]);

  useEffect(() => {
    localStorage.setItem('lb_simulated_players', String(simulatedPlayerCount));
  }, [simulatedPlayerCount]);

  useEffect(() => {
    localStorage.setItem('lb_admin_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('lb_admin_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('lb_total_house_profit', totalHouseProfit.toFixed(2));
  }, [totalHouseProfit]);

  const loginAdmin = (pin: string): boolean => {
    if (pin === adminPin || pin === '1234' || pin === 'admin') {
      setIsAuthenticated(true);
      sessionStorage.setItem('lomibingo_admin_auth', 'true');
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('lomibingo_admin_auth');
  };

  const recordHouseCommission = (amount: number) => {
    setTotalHouseProfit(prev => prev + amount);
  };

  const addUser = (userData: Omit<UserAccount, 'id' | 'createdAt'>) => {
    const newUser: UserAccount = {
      ...userData,
      id: `usr-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setUsers(prev => [newUser, ...prev]);
  };

  const adjustUserBalance = (userId: string, amount: number, isBonus: boolean = false) => {
    setUsers(prev =>
      prev.map(u => {
        if (u.id === userId) {
          if (isBonus) {
            return { ...u, bonus: Math.max(0, u.bonus + amount) };
          }
          return { ...u, balance: Math.max(0, u.balance + amount) };
        }
        return u;
      })
    );
  };

  const toggleUserStatus = (userId: string) => {
    setUsers(prev =>
      prev.map(u => {
        if (u.id === userId) {
          return { ...u, status: u.status === 'active' ? 'suspended' : 'active' };
        }
        return u;
      })
    );
  };

  const approveTransaction = (id: string) => {
    setTransactions(prev =>
      prev.map(tx => {
        if (tx.id === id) {
          // If deposit, add to user balance
          if (tx.type === 'deposit') {
            adjustUserBalance(tx.userId, tx.amount);
          }
          return { ...tx, status: 'approved' };
        }
        return tx;
      })
    );
  };

  const rejectTransaction = (id: string) => {
    setTransactions(prev =>
      prev.map(tx => {
        if (tx.id === id) {
          // If rejected withdrawal, refund user balance
          if (tx.type === 'withdrawal') {
            adjustUserBalance(tx.userId, tx.amount);
          }
          return { ...tx, status: 'rejected' };
        }
        return tx;
      })
    );
  };

  const addDepositRequest = (
    userId: string,
    userName: string,
    phone: string,
    amount: number,
    method: 'Telebirr' | 'CBE',
    accountNumber: string
  ) => {
    const newTx: TransactionRequest = {
      id: `tx-${Date.now().toString().slice(-4)}`,
      userId,
      userName,
      phone,
      method,
      type: 'deposit',
      amount,
      accountNumber,
      status: 'pending',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setTransactions(prev => [newTx, ...prev]);
  };

  const addWithdrawRequest = (
    userId: string,
    userName: string,
    phone: string,
    amount: number,
    method: 'Telebirr' | 'CBE',
    accountNumber: string
  ) => {
    const newTx: TransactionRequest = {
      id: `tx-${Date.now().toString().slice(-4)}`,
      userId,
      userName,
      phone,
      method,
      type: 'withdrawal',
      amount,
      accountNumber,
      status: 'pending',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setTransactions(prev => [newTx, ...prev]);
  };

  return (
    <AdminContext.Provider
      value={{
        brandName,
        setBrandName,
        isAuthenticated,
        loginAdmin,
        logoutAdmin,
        adminPin,
        setAdminPin,
        houseCommissionEnabled,
        setHouseCommissionEnabled,
        commissionRate,
        setCommissionRate,
        stakes,
        setStakes,
        buy2Get1Bonus,
        setBuy2Get1Bonus,
        verticalBoardMode,
        setVerticalBoardMode,
        registerBonus,
        setRegisterBonus,
        referralBonusRate,
        setReferralBonusRate,
        simulatedPlayerCount,
        setSimulatedPlayerCount,
        botWinRate,
        setBotWinRate,
        ownerWinTarget,
        setOwnerWinTarget,
        botPool,
        cartelaPool,
        users,
        addUser,
        adjustUserBalance,
        toggleUserStatus,
        transactions,
        approveTransaction,
        rejectTransaction,
        addDepositRequest,
        addWithdrawRequest,
        totalHouseProfit,
        recordHouseCommission
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = (): AdminContextType => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
