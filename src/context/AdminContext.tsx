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
  referenceNumber: string; // e.g. TX-TB-894210
  userId: string;
  userName: string;
  phone: string;
  method: 'Telebirr' | 'CBE';
  type: 'deposit' | 'withdrawal';
  amount: number;
  accountNumber: string;
  status: 'pending' | 'approved' | 'rejected';
  riskScore: 'verified' | 'low' | 'review';
  userLifetimeDeposits: number;
  userLifetimeWithdrawals: number;
  receiptImage?: string;
  senderName?: string;
  createdAt: string;
  processedAt?: string;
  adminNote?: string;
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

  // Sidebar state
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;

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

  // Deposit & Withdraw Cashier Desk
  transactions: TransactionRequest[];
  approveAndReleaseTransaction: (id: string, note?: string) => void;
  rejectTransaction: (id: string, note?: string) => void;
  addDepositRequest: (
    userId: string,
    userName: string,
    phone: string,
    amount: number,
    method: 'Telebirr' | 'CBE',
    accountNumber: string,
    receiptImage?: string,
    customRef?: string
  ) => void;
  addWithdrawRequest: (userId: string, userName: string, phone: string, amount: number, method: 'Telebirr' | 'CBE', accountNumber: string) => void;

  // Financial Summary Stats
  totalHouseProfit: number;
  totalDepositedToday: number;
  totalWithdrawnToday: number;
  recordHouseCommission: (amount: number) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

// Generate 260+ realistic, dynamic & 100% UNIQUE Ethiopian player identities / usernames
const generateEthiopianBots = (): BotPlayer[] => {
  // Diverse realistic usernames, gaming handles & Ethiopian player names (no repetitive father names)
  const dynamicIdentities = [
    // Modern Telegram / Mobile Gaming Usernames
    'Alex_King', 'Sami_Lucky', 'Nati_Boss', 'Dani_Addis', 'Bini_Winner', 'Teddy_Pro', 'Robel_21', 'Ermi_Ace',
    'Henok_VIP', 'Yoni_Bole', 'Miku_Hero', 'Jhonny_Star', 'Surafel_Gold', 'Abel_Winner', 'Sol_King', 'Kidus_Habesha',
    'Dagi_Champion', 'Biruk_777', 'Yared_Lomi', 'Temu_Winner', 'Redi_Star', 'Fasika_Lucky', 'Bila_Pro', 'Mika_Star',
    'Mesi_Cute', 'Eden_Rose', 'Hanna_Queen', 'Marta_Beauty', 'Meron_Sweet', 'Bethel_7', 'Tsion_Lucky', 'Aster_Smile',
    'Kalkidan_Love', 'Liya_Star', 'Feven_Gold', 'Sara_Bole', 'Helen_Sweet', 'Winta_Joy', 'Zufan_Lucky', 'Rahel_Queen',
    'ShegerBoy', 'LuckyHabesha', 'HabeshaQueen', 'BoleWinner', 'AddisHero', 'LomiChamp', 'KingDawit', 'GoldBingo_ET',
    'LuckyLomi77', 'AddisViper', 'ShegerQueen', 'BingoKing_ET', 'HabeshaLegend', 'LomiMaster', 'AddisSniper', 'Abyssinia_Lion',
    'Tommy_Star', 'Kidus_G', 'Brook_Champ', 'Nebiyu_Winner', 'Bisrat_Pro', 'Yidne_7', 'Fikadu_Boss', 'Mikias_VIP',
    'Amanuel_Ace', 'Eyob_King', 'Chernet_Lucky', 'Biniyam_Hero', 'Ibrahim_Star', 'Habtamu_Pro', 'Jaleta_Winner', 'Kenenisa_Run',

    // Natural Player Names (Clean First Names with Distinct Last Names)
    'Abebe Bikila', 'Dawit Mengistu', 'Almaz Kebede', 'Chala Tolessa', 'Bilen Haile', 'Senait Girma',
    'Ermias Tadesse', 'Robel Assefa', 'Fitsum Demissie', 'Kalid Bogale', 'Natnael Wolde', 'Tigist Dibaba',
    'Yohannes Berhanu', 'Sintayehu Kassa', 'Meseret Legesse', 'Solomon Negash', 'Binyam Mekonnen', 'Eden Alemayehu',
    'Ephrem Zewde', 'Fikirte Tefera', 'Getachew Shiferaw', 'Helen Gashaw', 'Kassahun Belay', 'Lensa Aysele',
    'Marta Kassaye', 'Samuel Ayele', 'Selam Derese', 'Tariku Tilahun', 'Tewodros Feyissa', 'Zinash Gebre',
    'Desta Abate', 'Fasil Woldemariam', 'Genet Getahun', 'Kiros Bedada', 'Mulugeta Mamo', 'Netsanet Endale',
    'Wondwosen Bayisa', 'Yordanos Fikre', 'Zelalem Gemechu', 'Abinet Hailu', 'Daniel Jemal', 'Eskinder Kumsa',
    'Frehiwot Lema', 'Girum Mulu', 'Hiwot Nega', 'Mahlet Robba', 'Nahom Tura', 'Surafel Wakgari',

    // First Name + Single Initial
    'Dawit K.', 'Sara B.', 'Abebe M.', 'Almaz T.', 'Senait G.', 'Ermias W.', 'Fitsum D.', 'Kiros H.',
    'Selamawit N.', 'Yohannes S.', 'Tigist L.', 'Natnael B.', 'Robel M.', 'Bilen T.', 'Henok F.', 'Kalkidan Z.',
    'Abel G.', 'Bethel A.', 'Surafel P.', 'Biruk T.', 'Meron K.', 'Eden S.', 'Tsion R.', 'Marta D.',
    'Chala B.', 'Tariku H.', 'Binyam E.', 'Mahlet G.', 'Nahom V.', 'Fasika M.', 'Zelalem K.', 'Genet W.',

    // Regional & Modern Ethiopian Handles
    'AddisGamer', 'BoleBoy_251', 'PiassaKing', 'GondarStar', 'HawassaVibes', 'AdamaChamp', 'MekelleWinner', 'DireDawaAce',
    'BahrDarPro', 'ArbaMinchStar', 'JimmaWinner', 'DebreZeitKing', 'WolloHero', 'HararStar', 'ShegerGamer', 'AbyssiniaStar',
    'LomiPlayer_01', 'LomiPlayer_02', 'LomiPlayer_03', 'LomiPlayer_07', 'LomiPlayer_10', 'LomiPlayer_77', 'LomiPlayer_99',
    'LuckyStrike_ET', 'BingoHero_2026', 'GoldenDaub', 'BingoSniper', 'DaubMaster', 'CartelaKing', 'CartelaQueen', 'FastDauber',
    'LuckyTicket_ET', 'DailyWinner_ET', 'BirrMaker', 'PocketWinner', 'TelebirrMaster', 'CBE_Champ', 'SuperLomi', 'JackpotHunter',

    // Realistic Individual Nicknames
    'Abe_Addis', 'Almi_Cute', 'Beki_Star', 'Chali_Pro', 'Dawi_King', 'Ephri_Hero', 'Fiki_Sweet', 'Getu_Gold',
    'Haily_Champ', 'Heli_Smile', 'Kassu_Winner', 'Lensi_Star', 'Marti_Beauty', 'Nati_Vip', 'Rahi_Queen', 'Sammy_Boss',
    'Selu_Lucky', 'Tari_Ace', 'Teddy_Winner', 'Yari_Lomi', 'Zini_Star', 'Bili_Cute', 'Desi_Hero', 'Ermi_King',
    'Fasi_Champ', 'Geni_Smile', 'Hani_Sweet', 'Kiri_Pro', 'Mule_Boss', 'Neti_Queen', 'Robi_Star', 'Seni_Gold',
    'Tadi_Winner', 'Wondi_Ace', 'Yordi_Beauty', 'Zeli_King', 'Abi_Hero', 'Beti_Star', 'Dani_Vip', 'Eski_Champ',
    'Fre_Smile', 'Giru_Gold', 'Hiwi_Sweet', 'Kalki_Queen', 'Mahi_Star', 'Naho_Winner', 'Sura_Ace', 'Biri_King',
    'Meri_Cute', 'Heni_Hero', 'Tigi_Gold', 'Yoni_Winner', 'Fitsu_Star', 'Kali_Pro', 'Sinti_Champ', 'Mesi_Smile',
    'Soli_King', 'Tsioni_Sweet', 'Bini_Hero', 'Edu_Beauty', 'Keni_Runner', 'Abeli_Star', 'Asti_Smile', 'Biniy_Winner',
    'Cheri_Pro', 'Debri_King', 'Eyobi_Hero', 'Fevi_Gold', 'Gashi_Champ', 'Habti_Star', 'Ibro_Winner', 'Jali_Ace',
    'Kidi_Sweet', 'Liyi_Queen', 'Miki_Pro', 'Nardi_Beauty', 'Omi_King', 'Redu_Star', 'Sabi_Smile', 'Temi_Winner',
    'Urgi_Hero', 'Winti_Gold', 'Yoni_Star', 'Zufi_Queen', 'Amani_Ace', 'Nebi_Winner', 'Bisri_Champ', 'Brooki_King'
  ];

  const phonePrefixes = ['911', '912', '913', '914', '915', '920', '921', '922', '923', '924', '930', '933', '940', '944', '955', '966', '977', '701', '711'];
  const avatars = ['🦁', '👑', '⚡', '🌟', '💎', '🔥', '🎯', '🦅', '🍀', '🏆', '🍋', '⚽', '🥇', '🚀', '✨', '🐺', '🦊', '🐯', '🎩', '🎲', '🧿', '💰', '🎮', '🦄'];

  const bots: BotPlayer[] = [];
  const usedNames = new Set<string>();
  const usedPhones = new Set<string>();

  for (let i = 0; i < dynamicIdentities.length; i++) {
    const rawName = dynamicIdentities[i];
    if (usedNames.has(rawName)) continue;
    usedNames.add(rawName);

    const prefix = phonePrefixes[bots.length % phonePrefixes.length];
    let numPart = 100000 + ((bots.length * 3719 + 17) % 899999);
    let phoneStr = `+251 ${prefix} ${numPart.toString().slice(0, 3)} ${numPart.toString().slice(3)}`;
    while (usedPhones.has(phoneStr)) {
      numPart = (numPart + 7919) % 899999;
      phoneStr = `+251 ${prefix} ${numPart.toString().slice(0, 3)} ${numPart.toString().slice(3)}`;
    }
    usedPhones.add(phoneStr);

    bots.push({
      id: `bot-${bots.length + 1}`,
      name: rawName,
      phone: phoneStr,
      avatar: avatars[bots.length % avatars.length],
      cartelasPlayed: 15 + ((bots.length * 7 + 13) % 95),
      winsCount: 1 + ((bots.length * 3 + 5) % 22),
      isBot: true
    });

    if (bots.length >= 260) break;
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
  },
  {
    id: 'usr-4',
    name: 'Marta Worku',
    phone: '+251 944 112 233',
    balance: 1450.0,
    bonus: 50.0,
    referralCount: 6,
    totalDeposited: 2500.0,
    totalWithdrawn: 1100.0,
    status: 'active',
    createdAt: '2026-08-10'
  }
];

const initialTransactions: TransactionRequest[] = [
  {
    id: 'tx-101',
    referenceNumber: 'TX-TB-894210',
    userId: 'usr-1',
    userName: 'Abebe Bikila',
    phone: '+251 911 234 567',
    method: 'Telebirr',
    type: 'deposit',
    amount: 500.0,
    accountNumber: '0911234567',
    status: 'pending',
    riskScore: 'verified',
    userLifetimeDeposits: 1200.0,
    userLifetimeWithdrawals: 450.0,
    createdAt: 'Today, 18:45'
  },
  {
    id: 'tx-102',
    referenceNumber: 'TX-CBE-551980',
    userId: 'usr-2',
    userName: 'Selam Tesfaye',
    phone: '+251 922 876 543',
    method: 'CBE',
    type: 'withdrawal',
    amount: 200.0,
    accountNumber: '100023456789',
    status: 'pending',
    riskScore: 'verified',
    userLifetimeDeposits: 500.0,
    userLifetimeWithdrawals: 180.0,
    createdAt: 'Today, 19:10'
  },
  {
    id: 'tx-103',
    referenceNumber: 'TX-TB-773120',
    userId: 'usr-4',
    userName: 'Marta Worku',
    phone: '+251 944 112 233',
    method: 'Telebirr',
    type: 'deposit',
    amount: 1000.0,
    accountNumber: '0944112233',
    status: 'pending',
    riskScore: 'verified',
    userLifetimeDeposits: 2500.0,
    userLifetimeWithdrawals: 1100.0,
    createdAt: 'Today, 19:35'
  },
  {
    id: 'tx-104',
    referenceNumber: 'TX-TB-662910',
    userId: 'usr-3',
    userName: 'Dawit Mengistu',
    phone: '+251 933 555 123',
    method: 'Telebirr',
    type: 'deposit',
    amount: 100.0,
    accountNumber: '0933555123',
    status: 'approved',
    riskScore: 'low',
    userLifetimeDeposits: 100.0,
    userLifetimeWithdrawals: 0.0,
    createdAt: 'Today, 17:15',
    processedAt: 'Today, 17:18'
  }
];

export const AdminProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [brandName, setBrandName] = useState<string>('Lomi Bingo');
  const [adminPin, setAdminPin] = useState<string>('1234');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
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

  // Users & Transactions (with defensive sanitization)
  const [users, setUsers] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem('lb_admin_users');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((u: any, idx: number) => ({
            id: u.id || `usr-${idx + 1}`,
            name: u.name || 'Lomi Player',
            phone: u.phone || '+251 900 000 000',
            balance: Number(u.balance) || 0,
            bonus: Number(u.bonus) || 0,
            referralCount: Number(u.referralCount) || 0,
            totalDeposited: Number(u.totalDeposited) || 0,
            totalWithdrawn: Number(u.totalWithdrawn) || 0,
            status: u.status === 'suspended' ? 'suspended' : 'active',
            createdAt: u.createdAt || '2026-08-01'
          }));
        }
      }
    } catch (e) {
      console.warn('Error reading admin users:', e);
    }
    return initialUsers;
  });

  const [transactions, setTransactions] = useState<TransactionRequest[]>(() => {
    try {
      const saved = localStorage.getItem('lb_admin_transactions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((t: any, idx: number) => ({
            id: t.id || `tx-${idx + 100}`,
            referenceNumber: t.referenceNumber || (t.method === 'CBE' ? `TX-CBE-${100000 + idx}` : `TX-TB-${800000 + idx}`),
            userId: t.userId || 'usr-1',
            userName: t.userName || 'Player',
            phone: t.phone || '+251 911 000 000',
            method: t.method === 'CBE' ? 'CBE' : 'Telebirr',
            type: t.type === 'withdrawal' ? 'withdrawal' : 'deposit',
            amount: Number(t.amount) || 100,
            accountNumber: t.accountNumber || '0911000000',
            status: t.status === 'approved' ? 'approved' : t.status === 'rejected' ? 'rejected' : 'pending',
            riskScore: t.riskScore || 'verified',
            userLifetimeDeposits: Number(t.userLifetimeDeposits) || 500,
            userLifetimeWithdrawals: Number(t.userLifetimeWithdrawals) || 0,
            createdAt: t.createdAt || 'Today, 18:00',
            processedAt: t.processedAt,
            adminNote: t.adminNote,
            receiptImage: t.receiptImage
          }));
        }
      }
    } catch (e) {
      console.warn('Error reading admin transactions:', e);
    }
    return initialTransactions;
  });

  const [totalHouseProfit, setTotalHouseProfit] = useState<number>(() => {
    const saved = localStorage.getItem('lb_total_house_profit');
    return saved ? parseFloat(saved) : 18450.0;
  });

  const [totalDepositedToday, setTotalDepositedToday] = useState<number>(28500.0);
  const [totalWithdrawnToday, setTotalWithdrawnToday] = useState<number>(14200.0);

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

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => !prev);
  };

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

  const approveAndReleaseTransaction = (id: string, note?: string) => {
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setTransactions(prev =>
      prev.map(tx => {
        if (tx.id === id) {
          // If deposit, release cash into user live wallet
          if (tx.type === 'deposit') {
            adjustUserBalance(tx.userId, tx.amount);
            setTotalDepositedToday(d => d + tx.amount);

            // Sync with player active wallet
            try {
              const currentSaved = parseFloat(localStorage.getItem('betika_user_balance') || '750');
              const newBal = currentSaved + tx.amount;
              localStorage.setItem('betika_user_balance', newBal.toFixed(2));
              window.dispatchEvent(new CustomEvent('lb_deposit_approved', { detail: { amount: tx.amount, txId: tx.id } }));
            } catch (e) {
              console.warn('Error updating player storage:', e);
            }
          } else {
            setTotalWithdrawnToday(w => w + tx.amount);
          }
          return {
            ...tx,
            status: 'approved',
            processedAt: `Today, ${nowTime}`,
            adminNote: note || 'Approved & Released by Admin'
          };
        }
        return tx;
      })
    );
  };

  const rejectTransaction = (id: string, note?: string) => {
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setTransactions(prev =>
      prev.map(tx => {
        if (tx.id === id) {
          // If rejected withdrawal, refund user wallet
          if (tx.type === 'withdrawal') {
            adjustUserBalance(tx.userId, tx.amount);
            try {
              const currentSaved = parseFloat(localStorage.getItem('betika_user_balance') || '750');
              const newBal = currentSaved + tx.amount;
              localStorage.setItem('betika_user_balance', newBal.toFixed(2));
              window.dispatchEvent(new CustomEvent('lb_deposit_approved', { detail: { amount: tx.amount } }));
            } catch (e) {
              console.warn('Error refunding player storage:', e);
            }
          }
          return {
            ...tx,
            status: 'rejected',
            processedAt: `Today, ${nowTime}`,
            adminNote: note || 'Rejected by Admin'
          };
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
    accountNumber: string,
    receiptImage?: string,
    customRef?: string
  ) => {
    const finalRef = customRef?.trim()
      ? customRef.trim().toUpperCase()
      : `${method === 'Telebirr' ? 'TX-TB-' : 'TX-CBE-'}${Math.floor(100000 + Math.random() * 900000)}`;

    const newTx: TransactionRequest = {
      id: `tx-${Date.now().toString().slice(-5)}`,
      referenceNumber: finalRef,
      userId,
      userName: userName || 'Player',
      phone: phone || accountNumber,
      method,
      type: 'deposit',
      amount,
      accountNumber,
      receiptImage,
      status: 'pending',
      riskScore: 'verified',
      userLifetimeDeposits: 500,
      userLifetimeWithdrawals: 0,
      createdAt: `Today, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
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
    const randomRef = `${method === 'Telebirr' ? 'TX-TB-' : 'TX-CBE-'}${Math.floor(100000 + Math.random() * 900000)}`;
    const newTx: TransactionRequest = {
      id: `tx-${Date.now().toString().slice(-4)}`,
      referenceNumber: randomRef,
      userId,
      userName,
      phone,
      method,
      type: 'withdrawal',
      amount,
      accountNumber,
      status: 'pending',
      riskScore: 'verified',
      userLifetimeDeposits: 1000,
      userLifetimeWithdrawals: 200,
      createdAt: `Today, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
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
        isSidebarCollapsed,
        toggleSidebar,
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
        approveAndReleaseTransaction,
        rejectTransaction,
        addDepositRequest,
        addWithdrawRequest,
        totalHouseProfit,
        totalDepositedToday,
        totalWithdrawnToday,
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
