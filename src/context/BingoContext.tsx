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
  const [lobbyCountdown, setLobbyCountdown] = useState<number>(20);
  const [winnerCountdown, setWinnerCountdown] = useState<number>(8);

  // Betting state (Stakes: 10, 25, 50, 100 Birr)
  const [betAmount, setBetAmount] = useState<number>(10);
  const [cardQuantity, setCardQuantityState] = useState<number>(1);
  const [hasTicket, setHasTicket] = useState<boolean>(false);
  const [hasPreBoughtNext, setHasPreBoughtNext] = useState<boolean>(false);

  // 400 Cartelas Pool Selection
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
  const [playersCount, setPlayersCount] = useState<number>(simulatedPlayerCount || 45);
  const [prizePool, setPrizePool] = useState<number>(340);
  const [opponents, setOpponents] = useState<Opponent[]>([]);
  const [canWin, setCanWin] = useState<boolean>(false);
  const [winResult, setWinResult] = useState<WinResult | null>(null);
  const [showWinModal, setShowWinModal] = useState<boolean>(false);
  const [spherePop, setSpherePop] = useState<boolean>(false);
  const [isVerticalBoard, setIsVerticalBoard] = useState<boolean>(true);
  const [showMasterBoard, setShowMasterBoard] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => soundEngine.getMuted());

  const getActiveRoomId = useCallback(() => {
    if (betAmount >= 100) return 'room-100';
    if (betAmount >= 50) return 'room-50';
    if (betAmount >= 25) return 'room-25';
    return 'room-10';
  }, [betAmount]);

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

  // Socket.IO Multiplayer Room Listener
  useEffect(() => {
    const roomId = getActiveRoomId();
    socketService.joinRoom(roomId, user?.id, user?.fullName);

    // 1. Room State / Sync
    const unsubRoomState = socketService.onRoomState((state: any) => {
      if (state.phase) setRoundPhase(state.phase);
      if (typeof state.lobbyCountdown === 'number') setLobbyCountdown(state.lobbyCountdown);
      if (typeof state.winnerCountdown === 'number') setWinnerCountdown(state.winnerCountdown);
      if (typeof state.playersCount === 'number') setPlayersCount(state.playersCount);
      if (typeof state.winnerPayout === 'number') setPrizePool(state.winnerPayout);
      else if (typeof state.totalPot === 'number') setPrizePool(state.totalPot);

      if (state.currentCall) {
        setCurrentCall(state.currentCall);
      }

      if (state.drawnNumbers && Array.isArray(state.drawnNumbers)) {
        setCalledNumbers(state.drawnNumbers);
      }

      if (state.winResult) {
        setWinResult(state.winResult);
        setShowWinModal(true);
      }
    });

    // 2. Ball Called
    const unsubBallCalled = socketService.onBallCalled((data: any) => {
      if (data.currentCall) {
        applyDrawnNumber(data.currentCall.num, data.currentCall.col);
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
      setCartela1Data(generateCardFromId(selectedCartelaIds[0]));
      setCartela2Data(generateCardFromId(selectedCartelaIds[1]));
      setCartela3Data(generateCardFromId(selectedCartelaIds[2]));
    });

    // 4. Round Winner
    const unsubRoundWinner = socketService.onRoundWinner((winData: any) => {
      setRoundPhase('winner');
      setWinResult({
        winType: winData.winnerId === user?.id ? 'user_solo' : 'opponent_win',
        winningCartelaNumber: winData.winningCartelaNumber,
        winningLine: winData.winningIndices || [],
        winnerName: winData.winnerName,
        coWinners: [],
        totalPot: winData.totalPot || prizePool,
        userShare: winData.winnerId === user?.id ? winData.userShare : 0
      });
      setShowWinModal(true);

      if (winData.winnerId === user?.id) {
        soundEngine.playWinFanfare();
        addBalance(winData.userShare);
      } else {
        soundEngine.playPop();
      }
      refreshBalance();
    });

    return () => {
      unsubRoomState();
      unsubBallCalled();
      unsubRoundStarted();
      unsubRoundWinner();
    };
  }, [getActiveRoomId, user, applyDrawnNumber, selectedCartelaIds, prizePool, addBalance, refreshBalance]);

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

  // Buy Ticket via Live Socket Engine & Neon DB
  const buyTicket = async () => {
    const roomId = getActiveRoomId();
    const activeIds = selectedCartelaIds.slice(0, totalPlayableCards);
    const totalCost = betAmount * cardQuantity;

    // Check available funds (balance + bonus)
    const totalFunds = balance + bonus;
    if (totalFunds < totalCost) {
      showToast(`❌ Insufficient balance (${totalFunds.toFixed(0)} ETB). Need ${totalCost} ETB.`);
      return;
    }

    // Send to live server
    if (user?.id) {
      const res = await socketService.buyTicket(roomId, user.id, user.fullName, activeIds);
      if (!res.success) {
        showToast(`❌ ${res.error || 'Ticket purchase failed'}`);
        return;
      }
    } else {
      // Local fallback
      const success = deductBalance(totalCost);
      if (!success) {
        showToast('❌ Insufficient balance! Please deposit to continue.');
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

  const preBuyNextRound = () => {
    const totalCost = betAmount * cardQuantity;
    const totalFunds = balance + bonus;
    if (totalFunds < totalCost) {
      showToast(`❌ Insufficient balance (${totalFunds.toFixed(0)} ETB). Need ${totalCost} ETB.`);
      return;
    }
    const success = deductBalance(totalCost);
    if (!success) {
      showToast('❌ Insufficient balance! Please deposit to continue.');
      return;
    }
    setHasPreBoughtNext(true);
    soundEngine.playLuckyPick();
    refreshBalance();
    showToast(`🎟️ Pre-Bought ${totalPlayableCards} Cartelas for next round!`);
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
        stopGame
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
