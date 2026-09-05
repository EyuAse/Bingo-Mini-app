import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
  useCallback
} from 'react';
import { soundEngine } from '../services/soundEngine.ts';
import { socketService } from '../services/socketService.ts';
import { useWallet } from './WalletContext.tsx';
import { useAuth } from './AuthContext.tsx';
import { useApp } from './AppContext.tsx';
import { useAdmin } from './AdminContext.tsx';

export interface BingoCell {
  index: number;
  row: number;
  col: number;
  colLetter: string;
  val: number | 'FREE';
  isFree: boolean;
  marked: boolean;
}

export interface CalledBall {
  num: number;
  col: string;
}

export interface Opponent {
  name: string;
  avatar: string;
  initials: string;
  cards: number;
  marksNeeded: number;
  status: string;
  cartelaNumber?: number;
}

export interface WinResult {
  winType: 'user_solo' | 'user_split' | 'opponent_win';
  winningCartelaNumber: number;
  winningLine: number[];
  winnerName: string;
  coWinners: string[];
  totalPot: number;
  userShare: number;
  winnerPayout?: number;
  stakeAmount?: number;
}

export type RoundPhase = 'lobby' | 'locked' | 'playing' | 'winner';

interface BingoContextType {
  // Lifecycle & Phase
  roundPhase: RoundPhase;
  lobbyCountdown: number;
  winnerCountdown: number;

  // Betting & Tickets
  betAmount: number;
  setBetAmount: (amt: number) => void;
  cardQuantity: number;
  setCardQuantity: (qty: number) => void;
  hasTicket: boolean;
  hasPreBoughtNext: boolean;
  buyTicket: () => void;
  preBuyNextRound: () => void;

  // 400 Cartelas Pool & Selection
  selectedCartelaIds: [number, number, number];
  setSelectedCartelaIds: (ids: [number, number, number]) => void;
  isCartelaPickerOpen: boolean;
  openCartelaPicker: () => void;
  closeCartelaPicker: () => void;
  chooseCartelaId: (slotIdx: number, newId: number) => void;

  // Active Game State
  gameActive: boolean;
  cartela1Data: BingoCell[];
  cartela2Data: BingoCell[];
  cartela3Data: BingoCell[];
  totalPlayableCards: number;
  activeCartelaIndex: number;
  setActiveCartelaIndex: (idx: number) => void;
  currentCall: CalledBall | null;
  calledNumbers: number[];
  autoPlay: boolean;
  toggleAutoPlay: () => void;
  playersCount: number;
  prizePool: number;
  opponents: Opponent[];
  canWin: boolean;
  winResult: WinResult | null;
  showWinModal: boolean;
  spherePop: boolean;
  isVerticalBoard: boolean;
  toggleVerticalBoard: () => void;
  showMasterBoard: boolean;
  toggleMasterBoard: () => void;
  isMuted: boolean;
  toggleMute: () => void;

  // Actions
  startLobbyCountdown: () => void;
  handleManualDaub: (cartelaIdx: number, cellIdx: number) => void;
  claimBingo: () => void;
  closeWinModalAndRestart: () => void;
  stopGame: () => void;

  // Network Resilience & Disconnect Protection
  networkStatus: 'connected' | 'reconnecting' | 'polling' | 'disconnected';
  networkLatency: number;
  offlineWinsNotice: any[];
  dismissOfflineWin: (winId: string) => void;

  // Insufficient Balance Modal
  showInsufficientBalanceModal: boolean;
  setShowInsufficientBalanceModal: (show: boolean) => void;
  insufficientBalanceDetails: { required: number; balance: number; shortfall: number } | null;
}

const BingoContext = createContext<BingoContextType | undefined>(undefined);

// Generate 75-Ball 5x5 Matrix from Cartela ID (deterministic)
const generateCardFromId = (cartelaId: number): BingoCell[] => {
  let seed = cartelaId * 7919 + 1013;
  const pseudoRandom = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  const getUniqueRandoms = (min: number, max: number, count: number): number[] => {
    const pool: number[] = [];
    for (let i = min; i <= max; i++) pool.push(i);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(pseudoRandom() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, count);
  };

  const bNums = getUniqueRandoms(1, 15, 5);
  const iNums = getUniqueRandoms(16, 30, 5);
  const nNums = getUniqueRandoms(31, 45, 4); // 4 + FREE
  const gNums = getUniqueRandoms(46, 60, 5);
  const oNums = getUniqueRandoms(61, 75, 5);

  const cells: BingoCell[] = [];
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      const idx = row * 5 + col;
      let val: number | 'FREE';
      let colLetter: string;
      let isFree = false;

      if (col === 0) { val = bNums[row]; colLetter = 'B'; }
      else if (col === 1) { val = iNums[row]; colLetter = 'I'; }
      else if (col === 2) {
        if (row === 2) { val = 'FREE'; colLetter = 'N'; isFree = true; }
        else { val = nNums[row > 2 ? row - 1 : row]; colLetter = 'N'; }
      }
      else if (col === 3) { val = gNums[row]; colLetter = 'G'; }
      else { val = oNums[row]; colLetter = 'O'; }

      cells.push({
        index: idx,
        row,
        col,
        colLetter,
        val,
        isFree,
        marked: isFree
      });
    }
  }
  return cells;
};

// Winning patterns (Standard 75-Ball)
const WIN_PATTERNS: number[][] = [
  // 5 Rows
  [0, 1, 2, 3, 4],
  [5, 6, 7, 8, 9],
  [10, 11, 12, 13, 14],
  [15, 16, 17, 18, 19],
  [20, 21, 22, 23, 24],
  // 5 Columns
  [0, 5, 10, 15, 20],
  [1, 6, 11, 16, 21],
  [2, 7, 12, 17, 22],
  [3, 8, 13, 18, 23],
  [4, 9, 14, 19, 24],
  // 2 Diagonals
  [0, 6, 12, 18, 24],
  [4, 8, 12, 16, 20],
  // 4 Corners
  [0, 4, 20, 24]
];

const checkWinningPatterns = (cells: BingoCell[]): number[] | null => {
  for (const line of WIN_PATTERNS) {
    if (line.every(idx => cells[idx]?.marked)) return line;
  }
  return null;
};

export const BingoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { deductBalance, addBalance, refreshBalance, balance, bonus } = useWallet();
  const { user } = useAuth();
  const { showToast } = useApp();
  const {
    commissionRate,
    simulatedPlayerCount,
    botPool,
    buy2Get1Bonus
  } = useAdmin();

  // Round Lifecycle Phase
  const [roundPhase, setRoundPhase] = useState<RoundPhase>('lobby');
  const [lobbyCountdown, setLobbyCountdown] = useState<number>(45);
  const [winnerCountdown, setWinnerCountdown] = useState<number>(8);

  // Betting state (Stakes: 10, 20, 50, 100 Birr)
  const [betAmount, setBetAmount] = useState<number>(10);
  const [cardQuantity, setCardQuantityState] = useState<number>(1);
  const [hasTicket, setHasTicket] = useState<boolean>(false);
  const [hasPreBoughtNext, setHasPreBoughtNext] = useState<boolean>(false);

  // 400 Cartelas Pool Selection (System Assigned)
  const [selectedCartelaIds, setSelectedCartelaIds] = useState<[number, number, number]>([
    Math.floor(1 + Math.random() * 120),
    Math.floor(121 + Math.random() * 140),
    Math.floor(261 + Math.random() * 135)
  ]);
  const [isCartelaPickerOpen, setIsCartelaPickerOpen] = useState<boolean>(false);

  const setCardQuantity = (qty: number) => {
    setCardQuantityState(Math.max(1, Math.min(2, qty)));
  };

  const totalPlayableCards = (cardQuantity >= 2 && buy2Get1Bonus) ? 3 : cardQuantity;

  // Active Cartelas
  const [cartela1Data, setCartela1Data] = useState<BingoCell[]>(() => generateCardFromId(selectedCartelaIds[0]));
  const [cartela2Data, setCartela2Data] = useState<BingoCell[]>(() => generateCardFromId(selectedCartelaIds[1]));
  const [cartela3Data, setCartela3Data] = useState<BingoCell[]>(() => generateCardFromId(selectedCartelaIds[2]));
  const [activeCartelaIndex, setActiveCartelaIndex] = useState<number>(0);

  // Game Engine State
  const [gameActive, setGameActive] = useState<boolean>(false);
  const [calledNumbers, setCalledNumbers] = useState<number[]>([]);
  const [currentCall, setCurrentCall] = useState<CalledBall | null>(null);

  // Auto-Play Engine
  const [autoPlay, setAutoPlay] = useState<boolean>(true);
  const autoPlayRef = useRef<boolean>(true);
  autoPlayRef.current = autoPlay;

  // Room State
  const [playersCount, setPlayersCount] = useState<number>(50);
  const [prizePool, setPrizePool] = useState<number>(450);
  const [opponents, setOpponents] = useState<Opponent[]>([]);
  const [canWin, setCanWin] = useState<boolean>(false);
  const [winResult, setWinResult] = useState<WinResult | null>(null);
  const [showWinModal, setShowWinModal] = useState<boolean>(false);
  const [spherePop, setSpherePop] = useState<boolean>(false);
  const [isVerticalBoard, setIsVerticalBoard] = useState<boolean>(true);
  const [showMasterBoard, setShowMasterBoard] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => soundEngine.getMuted());

  // Low-Network & Disconnect Protection States
  const [networkStatus, setNetworkStatus] = useState<'connected' | 'reconnecting' | 'polling' | 'disconnected'>('connected');
  const [networkLatency, setNetworkLatency] = useState<number>(24);
  const [offlineWinsNotice, setOfflineWinsNotice] = useState<any[]>([]);

  const dismissOfflineWin = useCallback((winId: string) => {
    socketService.acknowledgeOfflineWin(winId);
    setOfflineWinsNotice(prev => prev.filter(w => w.id !== winId));
  }, []);

  // Insufficient Balance Modal State
  const [showInsufficientBalanceModal, setShowInsufficientBalanceModal] = useState<boolean>(false);
  const [insufficientBalanceDetails, setInsufficientBalanceDetails] = useState<{
    required: number;
    balance: number;
    shortfall: number;
  } | null>(null);

  // Model A Unified Arena: All stakes play in the exact same room
  const getActiveRoomId = useCallback(() => 'lomi-arena', []);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundEngine.setMuted(next);
    showToast(next ? '🔇 Audio Muted' : '🔊 Audio Unmuted');
  };

  // Keep Cartelas synchronized when IDs change
  useEffect(() => {
    if (roundPhase === 'lobby' || !hasTicket) {
      setCartela1Data(generateCardFromId(selectedCartelaIds[0]));
      setCartela2Data(generateCardFromId(selectedCartelaIds[1]));
      setCartela3Data(generateCardFromId(selectedCartelaIds[2]));
    }
  }, [selectedCartelaIds, roundPhase, hasTicket]);

  // canWin detection
  useEffect(() => {
    const check = (cells: BingoCell[]) => {
      for (const line of WIN_PATTERNS) {
        if (line.filter(idx => cells[idx]?.marked).length >= line.length - 1) return true;
      }
      return false;
    };
    const c1Win = check(cartela1Data);
    const c2Win = totalPlayableCards >= 2 && check(cartela2Data);
    const c3Win = totalPlayableCards >= 3 && check(cartela3Data);
    setCanWin(c1Win || c2Win || c3Win);
  }, [cartela1Data, cartela2Data, cartela3Data, totalPlayableCards]);

  // Auto-daub helper when a number is called
  const applyDrawnNumber = useCallback((num: number, col: string) => {
    setCurrentCall({ num, col });
    setSpherePop(true);
    setTimeout(() => setSpherePop(false), 300);

    soundEngine.playPop();
    setCalledNumbers(prev => (prev.includes(num) ? prev : [...prev, num]));

    const daubCard = (prev: BingoCell[]) => {
      const matchIdx = prev.findIndex(c => c.val === num);
      if (matchIdx !== -1 && !prev[matchIdx].marked) {
        const next = [...prev];
        next[matchIdx] = { ...next[matchIdx], marked: true };
        return next;
      }
      return prev;
    };

    setCartela1Data(prev => daubCard(prev));
    setCartela2Data(prev => daubCard(prev));
    setCartela3Data(prev => daubCard(prev));
  }, []);

  // Instant State Catch-Up Protocol: Daub all drawn numbers within 100ms
  const fastForwardCatchUp = useCallback((drawnNums: number[]) => {
    if (!drawnNums || drawnNums.length === 0) return;
    setCalledNumbers(drawnNums);

    const lastNum = drawnNums[drawnNums.length - 1];
    const colLetter = lastNum <= 15 ? 'B' : lastNum <= 30 ? 'I' : lastNum <= 45 ? 'N' : lastNum <= 60 ? 'G' : 'O';
    setCurrentCall({ num: lastNum, col: colLetter });

    const markMatching = (cells: BingoCell[]) => {
      return cells.map(c => {
        if (!c.marked && !c.isFree && drawnNums.includes(c.val as number)) {
          return { ...c, marked: true };
        }
        return c;
      });
    };

    setCartela1Data(prev => markMatching(prev));
    setCartela2Data(prev => markMatching(prev));
    setCartela3Data(prev => markMatching(prev));
  }, []);

  const hasPreBoughtNextRef = useRef<boolean>(false);
  hasPreBoughtNextRef.current = hasPreBoughtNext;

  const userRef = useRef(user);
  userRef.current = user;

  const selectedCartelaIdsRef = useRef(selectedCartelaIds);
  selectedCartelaIdsRef.current = selectedCartelaIds;

  const addBalanceRef = useRef(addBalance);
  addBalanceRef.current = addBalance;

  const refreshBalanceRef = useRef(refreshBalance);
  refreshBalanceRef.current = refreshBalance;

  const applyDrawnNumberRef = useRef(applyDrawnNumber);
  applyDrawnNumberRef.current = applyDrawnNumber;

  const fastForwardCatchUpRef = useRef(fastForwardCatchUp);
  fastForwardCatchUpRef.current = fastForwardCatchUp;

  // Socket.IO Multiplayer Room Listener (Stable: Never reconnects on stake change)
  useEffect(() => {
    const roomId = getActiveRoomId();
    socketService.joinRoom(roomId, userRef.current?.id, userRef.current?.fullName);

    // 1. Room State / Sync
    const unsubRoomState = socketService.onRoomState((state: any) => {
      if (state.phase) {
        setRoundPhase(prev => {
          if (prev === 'winner' && state.phase === 'lobby') {
            setShowWinModal(false);
            setHasTicket(hasPreBoughtNextRef.current);
            setHasPreBoughtNext(false);
            setCalledNumbers([]);
            setCurrentCall(null);
          }
          return state.phase;
        });
      }
      if (typeof state.lobbyCountdown === 'number') setLobbyCountdown(state.lobbyCountdown);
      if (typeof state.winnerCountdown === 'number') setWinnerCountdown(state.winnerCountdown);
      if (typeof state.playersCount === 'number') setPlayersCount(state.playersCount);
      if (typeof state.winnerPayout === 'number') setPrizePool(state.winnerPayout);
      else if (typeof state.totalPot === 'number') setPrizePool(state.totalPot);

      if (state.currentCall) {
        setCurrentCall(state.currentCall);
      }

      if (state.drawnNumbers && Array.isArray(state.drawnNumbers)) {
        fastForwardCatchUpRef.current(state.drawnNumbers);
      }

      if (state.winResult) {
        const currentUser = userRef.current;
        const isRealUserWin = 
          Boolean(currentUser?.id && Array.isArray(state.winResult.winnerUserIds) && state.winResult.winnerUserIds.includes(currentUser.id)) ||
          Boolean(currentUser?.id && state.winResult.winnerId && state.winResult.winnerId.includes(currentUser.id)) || 
          Boolean(currentUser?.fullName && state.winResult.winnerNames && state.winResult.winnerNames.includes(currentUser.fullName));

        const winType = state.winResult.isSplit
          ? (isRealUserWin ? 'user_split' : 'opponent_win')
          : (isRealUserWin ? 'user_solo' : 'opponent_win');

        const payout = isRealUserWin ? (state.winResult.sharePerWinner || state.winResult.userShare || 0) : 0;
        const displayPayout = typeof state.winResult.winnerPayout === 'number'
          ? state.winResult.winnerPayout
          : (state.winResult.sharePerWinner || 450);

        setWinResult({
          winType,
          winningCartelaNumber: state.winResult.winningCartelaNumber || (state.winResult.winningCartelas?.[0]) || 1,
          winningLine: state.winResult.winningIndices || [],
          winnerName: state.winResult.winnerName || (state.winResult.winnerNames?.[0]) || 'Winner',
          coWinners: Array.isArray(state.winResult.coWinners) ? state.winResult.coWinners : (Array.isArray(state.winResult.winnerNames) ? state.winResult.winnerNames : []),
          totalPot: state.winResult.totalPot || 450,
          userShare: payout,
          winnerPayout: displayPayout,
          stakeAmount: state.winResult.stakeAmount || 10
        });
        setShowWinModal(true);
      }
    });

    // 2. Ball Called
    const unsubBallCalled = socketService.onBallCalled((data: any) => {
      if (data.currentCall) {
        applyDrawnNumberRef.current(data.currentCall.num, data.currentCall.col);
      }
      if (data.drawnNumbers) {
        setCalledNumbers(data.drawnNumbers);
      }
    });

    // 3. Round Started
    const unsubRoundStarted = socketService.onRoundStarted((data: any) => {
      setRoundPhase('playing');
      setGameActive(true);
      setCalledNumbers([]);
      setCurrentCall(null);
      setWinResult(null);
      setShowWinModal(false);
      if (data.winnerPayout) setPrizePool(data.winnerPayout);

      // If player had pre-bought ticket, transition to active playing
      setHasPreBoughtNext(prev => {
        if (prev) {
          setHasTicket(true);
          return false;
        }
        return false;
      });

      // Generate fresh cards
      const currentIds = selectedCartelaIdsRef.current;
      setCartela1Data(generateCardFromId(currentIds[0]));
      setCartela2Data(generateCardFromId(currentIds[1]));
      setCartela3Data(generateCardFromId(currentIds[2]));
    });

    // 4. Round Winner & Split Pot Handler
    const unsubRoundWinner = socketService.onRoundWinner((winData: any) => {
      setRoundPhase('winner');
      const currentUser = userRef.current;
      const isRealUserWin = 
        Boolean(currentUser?.id && Array.isArray(winData.winnerUserIds) && winData.winnerUserIds.includes(currentUser.id)) ||
        Boolean(currentUser?.id && winData.winnerId && winData.winnerId.includes(currentUser.id)) || 
        Boolean(currentUser?.fullName && winData.winnerNames && winData.winnerNames.includes(currentUser.fullName)) ||
        Boolean(currentUser?.id && winData.winnerId === currentUser.id);

      const winType = winData.isSplit
        ? (isRealUserWin ? 'user_split' : 'opponent_win')
        : (isRealUserWin ? 'user_solo' : 'opponent_win');

      const payout = isRealUserWin ? (winData.sharePerWinner || winData.userShare || 0) : 0;
      const displayPayout = typeof winData.winnerPayout === 'number'
        ? winData.winnerPayout
        : (winData.sharePerWinner || 450);

      setWinResult({
        winType,
        winningCartelaNumber: winData.winningCartelaNumber || (winData.winningCartelas?.[0]) || 1,
        winningLine: winData.winningIndices || [],
        winnerName: winData.winnerName || (winData.winnerNames?.[0]) || 'Winner',
        coWinners: Array.isArray(winData.coWinners) ? winData.coWinners : (Array.isArray(winData.winnerNames) ? winData.winnerNames : []),
        totalPot: winData.totalPot || 450,
        userShare: payout,
        winnerPayout: displayPayout,
        stakeAmount: winData.stakeAmount || 10
      });
      setShowWinModal(true);

      if (isRealUserWin) {
        soundEngine.playWinFanfare();
        addBalanceRef.current(payout);
      } else {
        soundEngine.playPop();
      }
      refreshBalanceRef.current();
    });

    // 5. Real-Time Server Balance Push
    let unsubBalance: (() => void) | null = null;
    if (user?.id) {
      unsubBalance = socketService.onUserBalanceUpdate(user.id, () => {
        refreshBalanceRef.current();
      });
    }

    // 6. Network Connection Status & Offline Win Listeners
    const unsubConn = socketService.onConnectionStatusChange((status, latency) => {
      setNetworkLatency(latency);
      if (status === 'connected') {
        setNetworkStatus('connected');
      } else {
        setNetworkStatus('reconnecting');
      }
    });

    const unsubOfflineWins = socketService.onOfflineWinNotification((wins) => {
      if (Array.isArray(wins) && wins.length > 0) {
        setOfflineWinsNotice(wins);
        soundEngine.playWinFanfare();
        refreshBalanceRef.current();
      }
    });

    return () => {
      unsubRoomState();
      unsubBallCalled();
      unsubRoundStarted();
      unsubRoundWinner();
      if (unsubBalance) unsubBalance();
      unsubConn();
      unsubOfflineWins();
    };
  }, [getActiveRoomId, user?.id]);

  // Dual-Engine HTTP Polling Fallback (Runs if Socket drops or is reconnecting)
  useEffect(() => {
    if (networkStatus !== 'reconnecting' && networkStatus !== 'polling') {
      return;
    }

    const roomId = getActiveRoomId();
    let isCancelled = false;

    const pollSync = async () => {
      try {
        const res = await fetch(`/api/rooms/${roomId}/sync`);
        if (!res.ok) return;
        const data = await res.json();
        if (isCancelled || !data.success) return;

        setNetworkStatus('polling');

        if (data.phase) {
          setRoundPhase(prev => {
            if (prev === 'winner' && data.phase === 'lobby') {
              setShowWinModal(false);
              setHasTicket(hasPreBoughtNextRef.current);
              setHasPreBoughtNext(false);
              setCalledNumbers([]);
              setCurrentCall(null);
            }
            return data.phase;
          });
        }
        if (typeof data.lobbyCountdown === 'number') setLobbyCountdown(data.lobbyCountdown);
        if (typeof data.winnerCountdown === 'number') setWinnerCountdown(data.winnerCountdown);
        if (typeof data.playersCount === 'number') setPlayersCount(data.playersCount);
        if (typeof data.winnerPayout === 'number') setPrizePool(data.winnerPayout);

        if (Array.isArray(data.drawnNumbers) && data.drawnNumbers.length > 0) {
          fastForwardCatchUp(data.drawnNumbers);
        }

        if (data.winResult && !showWinModal) {
          const isRealUserWin = 
            Boolean(user?.id && Array.isArray(data.winResult.winnerUserIds) && data.winResult.winnerUserIds.includes(user.id)) ||
            Boolean(user?.id && data.winResult.winnerId && data.winResult.winnerId.includes(user.id)) || 
            Boolean(user?.fullName && data.winResult.winnerNames && data.winResult.winnerNames.includes(user.fullName));

          const winType = data.winResult.isSplit
            ? (isRealUserWin ? 'user_split' : 'opponent_win')
            : (isRealUserWin ? 'user_solo' : 'opponent_win');

          const payout = isRealUserWin ? (data.winResult.sharePerWinner || data.winResult.userShare || 0) : 0;

          setWinResult({
            winType,
            winningCartelaNumber: data.winResult.winningCartelaNumber || 1,
            winningLine: data.winResult.winningIndices || [],
            winnerName: data.winResult.winnerName || 'Winner',
            coWinners: Array.isArray(data.winResult.coWinners) ? data.winResult.coWinners : [],
            totalPot: data.winResult.totalPot || 450,
            userShare: payout
          });
          setShowWinModal(true);
        }
      } catch (err) {
        // Mobile network drop; next poll will retry automatically
      }
    };

    pollSync();
    const interval = setInterval(pollSync, 2000);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [networkStatus, getActiveRoomId, fastForwardCatchUp, showWinModal, user]);

  const toggleVerticalBoard = () => setIsVerticalBoard(prev => !prev);
  const toggleMasterBoard = () => setShowMasterBoard(prev => !prev);
  const openCartelaPicker = () => setIsCartelaPickerOpen(true);
  const closeCartelaPicker = () => setIsCartelaPickerOpen(false);

  const chooseCartelaId = (slotIdx: number, newId: number) => {
    const updated: [number, number, number] = [...selectedCartelaIds];
    updated[slotIdx] = newId;
    setSelectedCartelaIds(updated);
    showToast(`🎟️ Selected Cartela #${newId}`);
  };

  const stopGame = useCallback(() => {
    setGameActive(false);
  }, []);

  const toggleAutoPlay = () => {
    const next = !autoPlay;
    setAutoPlay(next);
    autoPlayRef.current = next;
    if (next) {
      setCartela1Data(prev => prev.map(c => (!c.marked && !c.isFree && calledNumbers.includes(c.val as number) ? { ...c, marked: true } : c)));
      setCartela2Data(prev => prev.map(c => (!c.marked && !c.isFree && calledNumbers.includes(c.val as number) ? { ...c, marked: true } : c)));
      setCartela3Data(prev => prev.map(c => (!c.marked && !c.isFree && calledNumbers.includes(c.val as number) ? { ...c, marked: true } : c)));
      showToast('⚡ Auto-Play ON — Cards auto-daubed!');
    } else {
      showToast('✋ Manual Daubing Active');
    }
  };

  // Buy Ticket via Live Socket Engine & Neon DB with Anytime Pre-Betting
  const buyTicket = async () => {
    const roomId = getActiveRoomId();
    const activeIds = selectedCartelaIds.slice(0, totalPlayableCards);
    const totalCost = betAmount * cardQuantity;

    // Check available funds (balance + bonus)
    const totalFunds = balance + bonus;
    if (totalFunds < totalCost) {
      setInsufficientBalanceDetails({
        required: totalCost,
        balance: totalFunds,
        shortfall: totalCost - totalFunds
      });
      setShowInsufficientBalanceModal(true);
      return;
    }

    // Send to live server
    if (user?.id) {
      const res = await socketService.buyTicket(roomId, user.id, user.fullName, activeIds, betAmount);
      if (!res.success) {
        showToast(`❌ ${res.error || 'Ticket purchase failed'}`);
        return;
      }
      if (res.tickets && res.tickets.length > 0) {
        const newIds = res.tickets.map((t: any) => t.cartelaId);
        const updatedIds: [number, number, number] = [
          newIds[0] || selectedCartelaIds[0],
          newIds[1] || selectedCartelaIds[1],
          newIds[2] || selectedCartelaIds[2]
        ];
        setSelectedCartelaIds(updatedIds);
        if (res.tickets[0]) setCartela1Data(res.tickets[0].cardMatrix);
        if (res.tickets[1]) setCartela2Data(res.tickets[1].cardMatrix);
        if (res.tickets[2]) setCartela3Data(res.tickets[2].cardMatrix);
      }

      if (res.preBoughtForNextRound) {
        setHasPreBoughtNext(true);
        soundEngine.playLuckyPick();
        refreshBalance();
        showToast(`🎟️ Ticket Pre-Bought for Upcoming Round ✓`);
        return;
      }
    } else {
      // Local fallback
      const success = deductBalance(totalCost);
      if (!success) {
        setInsufficientBalanceDetails({
          required: totalCost,
          balance: totalFunds,
          shortfall: totalCost - totalFunds
        });
        setShowInsufficientBalanceModal(true);
        return;
      }
      if (roundPhase !== 'lobby') {
        setHasPreBoughtNext(true);
        showToast('🎟️ Pre-Bought for next round!');
        return;
      }
    }

    setHasTicket(true);
    setGameActive(true);
    refreshBalance();

    // If joining during playing phase, auto-daub any numbers already drawn
    if (calledNumbers.length > 0) {
      setCartela1Data(prev => prev.map(c => (!c.marked && !c.isFree && calledNumbers.includes(c.val as number) ? { ...c, marked: true } : c)));
      setCartela2Data(prev => prev.map(c => (!c.marked && !c.isFree && calledNumbers.includes(c.val as number) ? { ...c, marked: true } : c)));
      setCartela3Data(prev => prev.map(c => (!c.marked && !c.isFree && calledNumbers.includes(c.val as number) ? { ...c, marked: true } : c)));
    }

    soundEngine.playLuckyPick();
    const bonusText = (cardQuantity >= 2 && buy2Get1Bonus) ? ' + 1 FREE BONUS CARD 🎁' : '';
    showToast(`🎟️ Playing ${totalPlayableCards} Cartelas (${totalCost} ETB)${bonusText}!`);
  };

  const preBuyNextRound = async () => {
    const totalCost = betAmount * cardQuantity;
    const totalFunds = balance + bonus;
    if (totalFunds < totalCost) {
      setInsufficientBalanceDetails({
        required: totalCost,
        balance: totalFunds,
        shortfall: totalCost - totalFunds
      });
      setShowInsufficientBalanceModal(true);
      return;
    }

    if (user?.id) {
      const roomId = getActiveRoomId();
      const activeIds = selectedCartelaIds.slice(0, totalPlayableCards);
      const res = await socketService.buyTicket(roomId, user.id, user.fullName, activeIds, betAmount);
      if (!res.success) {
        showToast(`❌ ${res.error || 'Pre-buy failed'}`);
        return;
      }
      if (res.tickets && res.tickets.length > 0) {
        const newIds = res.tickets.map((t: any) => t.cartelaId);
        const updatedIds: [number, number, number] = [
          newIds[0] || selectedCartelaIds[0],
          newIds[1] || selectedCartelaIds[1],
          newIds[2] || selectedCartelaIds[2]
        ];
        setSelectedCartelaIds(updatedIds);
        if (res.tickets[0]) setCartela1Data(res.tickets[0].cardMatrix);
        if (res.tickets[1]) setCartela2Data(res.tickets[1].cardMatrix);
        if (res.tickets[2]) setCartela3Data(res.tickets[2].cardMatrix);
      }
    } else {
      const success = deductBalance(totalCost);
      if (!success) {
        setInsufficientBalanceDetails({
          required: totalCost,
          balance: totalFunds,
          shortfall: totalCost - totalFunds
        });
        setShowInsufficientBalanceModal(true);
        return;
      }
    }

    setHasPreBoughtNext(true);
    soundEngine.playLuckyPick();
    refreshBalance();
    showToast(`🎟️ Pre-Bought ${totalPlayableCards} Cartelas for next round! ✓`);
  };

  // Manual Daubing
  const handleManualDaub = (cartelaIdx: number, cellIdx: number) => {
    const targetData = cartelaIdx === 0 ? cartela1Data : cartelaIdx === 1 ? cartela2Data : cartela3Data;
    const setTargetData = cartelaIdx === 0 ? setCartela1Data : cartelaIdx === 1 ? setCartela2Data : setCartela3Data;
    const cell = targetData[cellIdx];

    if (!cell || cell.isFree) return;

    if (cell.marked) {
      const newCells = [...targetData];
      newCells[cellIdx] = { ...cell, marked: false };
      setTargetData(newCells);
    } else {
      if (calledNumbers.includes(cell.val as number)) {
        const newCells = [...targetData];
        newCells[cellIdx] = { ...cell, marked: true };
        setTargetData(newCells);
        soundEngine.playDaub();
      } else {
        showToast(`⚠️ ${cell.colLetter}-${cell.val} has not been called yet!`);
      }
    }
  };

  // Claim BINGO to Server Engine
  const claimBingo = async () => {
    const win1 = checkWinningPatterns(cartela1Data);
    const win2 = totalPlayableCards >= 2 ? checkWinningPatterns(cartela2Data) : null;
    const win3 = totalPlayableCards >= 3 ? checkWinningPatterns(cartela3Data) : null;

    if (win1 || win2 || win3) {
      const activeWinCardIdx = win1 ? 0 : win2 ? 1 : 2;
      const winningCartelaId = selectedCartelaIds[activeWinCardIdx];
      const roomId = getActiveRoomId();

      if (user?.id) {
        const res = await socketService.claimBingo(roomId, user.id, user.fullName, winningCartelaId);
        if (!res.success) {
          showToast(`⚠️ ${res.message}`);
          return;
        }
      }

      setWinResult({
        winType: 'user_solo',
        winningCartelaNumber: winningCartelaId,
        winningLine: win1 || win2 || win3 || [],
        winnerName: 'እርስዎ (You)',
        coWinners: [],
        totalPot: prizePool,
        userShare: prizePool
      });
      setShowWinModal(true);
      soundEngine.playWinFanfare();
    } else {
      soundEngine.playPop();
      showToast('⚠️ Pattern not complete yet! Keep daubing!');
    }
  };

  const closeWinModalAndRestart = () => {
    setShowWinModal(false);
    setHasTicket(false);
    setSelectedCartelaIds([
      Math.floor(1 + Math.random() * 120),
      Math.floor(121 + Math.random() * 140),
      Math.floor(261 + Math.random() * 135)
    ]);
  };

  const startLobbyCountdown = () => {
    // Controlled by server
  };

  return (
    <BingoContext.Provider
      value={{
        roundPhase,
        lobbyCountdown,
        winnerCountdown,
        betAmount,
        setBetAmount,
        cardQuantity,
        setCardQuantity,
        hasTicket,
        hasPreBoughtNext,
        buyTicket,
        preBuyNextRound,
        selectedCartelaIds,
        setSelectedCartelaIds,
        isCartelaPickerOpen,
        openCartelaPicker,
        closeCartelaPicker,
        chooseCartelaId,
        gameActive,
        cartela1Data,
        cartela2Data,
        cartela3Data,
        totalPlayableCards,
        activeCartelaIndex,
        setActiveCartelaIndex,
        currentCall,
        calledNumbers,
        autoPlay,
        toggleAutoPlay,
        playersCount,
        prizePool,
        opponents,
        canWin,
        winResult,
        showWinModal,
        spherePop,
        isVerticalBoard,
        toggleVerticalBoard,
        showMasterBoard,
        toggleMasterBoard,
        isMuted,
        toggleMute,
        startLobbyCountdown,
        handleManualDaub,
        claimBingo,
        closeWinModalAndRestart,
        stopGame,
        networkStatus,
        networkLatency,
        offlineWinsNotice,
        dismissOfflineWin,
        showInsufficientBalanceModal,
        setShowInsufficientBalanceModal,
        insufficientBalanceDetails
      }}
    >
      {children}
    </BingoContext.Provider>
  );
};

export const useBingo = (): BingoContextType => {
  const context = useContext(BingoContext);
  if (!context) throw new Error('useBingo must be used within a BingoProvider');
  return context;
};
