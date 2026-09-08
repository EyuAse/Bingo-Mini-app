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
import { telegramService } from '../services/telegramService.ts';
import { getApiBase } from '../config/env.ts';
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
  stakeRoomsSummary: Record<number, number>;

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

  // Lobby State & Join Feed
  waitingForPlayers: boolean;
  realPlayerCount: number;
  joinFeed: Array<{ id: number; userName: string; countdownStarted: boolean }>;

  // Actions
  startLobbyCountdown: () => void;
  handleManualDaub: (cartelaIdx: number, cellIdx: number) => void;
  claimBingo: () => void;
  closeWinModalAndRestart: () => void;
  stopGame: () => void;
  shuffleCartela: (cardIdx?: number) => void;
  selectSpecificCartela: (cardIdx: number, cartelaId: number) => void;

  // Network Resilience & Disconnect Protection
  networkStatus: 'connected' | 'reconnecting' | 'polling' | 'disconnected' | 'degraded';
  networkLatency: number;
  offlineWinsNotice: any[];
  dismissOfflineWin: (winId: string) => void;
  triggerManualSync: () => Promise<void>;
  isSyncing: boolean;
  cancelLobbyTicket: () => Promise<boolean>;

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

const fetchRoomSyncWithTimeout = async (roomId: string, timeoutMs = 6000, userId?: string): Promise<any | null> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const apiBase = getApiBase();
    const url = userId
      ? `${apiBase}/rooms/${roomId}/sync?userId=${encodeURIComponent(userId)}`
      : `${apiBase}/rooms/${roomId}/sync`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    const data = await res.json();
    return data && data.success ? data : null;
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
};

export const BingoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { deductBalance, addBalance, refreshBalance, balance, bonus } = useWallet();
  const { user } = useAuth();
  const { showToast } = useApp();
  const {
    commissionRate,
    simulatedPlayerCount,
    botPool
  } = useAdmin();

  // Round Lifecycle Phase
  const [roundPhase, setRoundPhase] = useState<RoundPhase>('lobby');
  const [lobbyCountdown, setLobbyCountdown] = useState<number>(45);
  const [winnerCountdown, setWinnerCountdown] = useState<number>(8);
  const [waitingForPlayers, setWaitingForPlayers] = useState<boolean>(true);
  const [realPlayerCount, setRealPlayerCount] = useState<number>(0);
  const [joinFeed, setJoinFeed] = useState<Array<{ id: number; userName: string; countdownStarted: boolean }>>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Betting state (Stakes: 10, 20, 50, 100 Birr)
  const [betAmount, setBetAmountState] = useState<number>(10);
  const [stakeRoomsSummary, setStakeRoomsSummary] = useState<Record<number, number>>({ 10: 0, 20: 0, 50: 0, 100: 0 });
  const [cardQuantity, setCardQuantityState] = useState<number>(2);
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

  const totalPlayableCards = cardQuantity;

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
  const [playersCount, setPlayersCount] = useState<number>(0);
  const [prizePool, setPrizePool] = useState<number>(0);
  const [opponents, setOpponents] = useState<Opponent[]>([]);
  const [canWin, setCanWin] = useState<boolean>(false);
  const [winResult, setWinResult] = useState<WinResult | null>(null);
  const [showWinModal, setShowWinModal] = useState<boolean>(false);
  const winModalDismissedForRoundRef = useRef<number | null>(null);
  const lastLiveWinRoundRef = useRef<number | null>(null);
  const [spherePop, setSpherePop] = useState<boolean>(false);
  const [isVerticalBoard, setIsVerticalBoard] = useState<boolean>(true);
  const [showMasterBoard, setShowMasterBoard] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => soundEngine.getMuted());

  // Low-Network & Disconnect Protection States
  const [networkStatus, setNetworkStatus] = useState<'connected' | 'reconnecting' | 'polling' | 'disconnected' | 'degraded'>('connected');
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

  // Dedicated Stake Room Architecture: room-10, room-20, room-50, room-100
  const getActiveRoomId = useCallback(() => `room-${betAmount}`, [betAmount]);

  // Safe Stake Switcher: If player changes stake while waiting in lobby, seamlessly transfer ticket with net difference adjusted
  const setBetAmount = async (newStake: number) => {
    if (newStake === betAmount) return;

    if (roundPhase === 'playing' && hasTicket) {
      showToast('⚠️ Active round in progress! Switch rooms when round ends.');
      return;
    }

    if (roundPhase === 'lobby' && hasTicket) {
      if (userRef.current?.id) {
        try {
          const oldRoomId = `room-${betAmount}`;
          const newRoomId = `room-${newStake}`;
          // Attempt seamless ticket transfer between stake rooms
          const transferRes = await socketService.transferTicketLobby(oldRoomId, newRoomId, userRef.current.id);
          if (transferRes.success) {
            setHasTicket(true);
            if (transferRes.tickets && transferRes.tickets.length > 0) {
              const newIds = transferRes.tickets.map((t: any) => t.cartelaId);
              setSelectedCartelaIds([
                newIds[0] || selectedCartelaIdsRef.current[0],
                newIds[1] || selectedCartelaIdsRef.current[1],
                newIds[2] || selectedCartelaIdsRef.current[2]
              ]);
            }
            const diff = transferRes.refundedOrCharged || 0;
            if (diff > 0) {
              showToast(`💸 Switched to ${newStake} ETB Room (+${diff.toFixed(0)} ETB refunded)`);
            } else if (diff < 0) {
              showToast(`🎯 Switched to ${newStake} ETB Room (${Math.abs(diff).toFixed(0)} ETB stake adjusted)`);
            } else {
              showToast(`🎯 Switched to ${newStake} ETB Room`);
            }
            setBetAmountState(newStake);
            refreshBalanceRef.current();
            return;
          } else {
            console.warn('Ticket transfer failed, falling back to cancel & refund:', transferRes.error);
            const cancelRes = await socketService.cancelTicketLobby(oldRoomId, userRef.current.id);
            if (cancelRes.success) {
              showToast(`💸 ${cancelRes.refunded || (betAmount * cardQuantity)} ETB refunded from ${betAmount} ETB lobby!`);
            }
            setHasTicket(false);
            setHasPreBoughtNext(false);
            try {
              localStorage.removeItem('betika_bingo_active_ticket');
            } catch {}
            refreshBalanceRef.current();
          }
        } catch (err) {
          console.warn('Error transferring lobby ticket on stake switch:', err);
          setHasTicket(false);
        }
      } else {
        const oldCost = betAmount * cardQuantity;
        const newCost = newStake * cardQuantity;
        const diff = oldCost - newCost;
        if (diff > 0) {
          addBalanceRef.current(diff);
          showToast(`💸 Switched to ${newStake} ETB Room (+${diff} ETB refunded)`);
          setHasTicket(true);
        } else if (balance + bonus >= Math.abs(diff)) {
          deductBalance(Math.abs(diff));
          showToast(`🎯 Switched to ${newStake} ETB Room (${Math.abs(diff)} ETB stake adjusted)`);
          setHasTicket(true);
        } else {
          addBalanceRef.current(oldCost);
          setHasTicket(false);
          showToast(`⚠️ Insufficient balance for ${newStake} ETB. ${oldCost} ETB refunded.`);
        }
        refreshBalanceRef.current();
      }
    }

    setBetAmountState(newStake);
    showToast(`🎯 Switched to ${newStake} ETB Room`);
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundEngine.setMuted(next);
    showToast(next ? '🔇 Audio Muted' : '🔊 Audio Unmuted');
  };

  // Pre-warm and cache Column B & Column I voice files into memory & bind universal unlock listener
  useEffect(() => {
    soundEngine.preloadVoicePack('ALL', 30);

    const handleInteractionUnlock = () => {
      soundEngine.unlockAudio();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('touchstart', handleInteractionUnlock, { once: true, passive: true });
      window.addEventListener('touchend', handleInteractionUnlock, { once: true, passive: true });
      window.addEventListener('click', handleInteractionUnlock, { once: true, passive: true });
      window.addEventListener('keydown', handleInteractionUnlock, { once: true, passive: true });
    }
  }, []);

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

    // Voice-Only: Real human recorded voice announcement (zero synthetic pops/chimes)
    soundEngine.speakBall(col, num).catch(() => {});
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

    // Auto-daub cards only when Auto-Play is active; in Manual mode, user taps their card
    if (autoPlayRef.current) {
      setCartela1Data(prev => daubCard(prev));
      setCartela2Data(prev => daubCard(prev));
      setCartela3Data(prev => daubCard(prev));
    }
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

    if (autoPlayRef.current) {
      setCartela1Data(prev => markMatching(prev));
      setCartela2Data(prev => markMatching(prev));
      setCartela3Data(prev => markMatching(prev));
    }
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

  const calledNumbersRef = useRef<number[]>([]);
  calledNumbersRef.current = calledNumbers;

  // Helper to rehydrate card checkmarks with drawn numbers (prevents raw server matrix from wiping user ticks upon resume)
  const hydrateCardWithDrawn = (
    cardMatrix: BingoCell[],
    drawnNums?: number[],
    isAuto: boolean = true
  ): BingoCell[] => {
    if (!cardMatrix || !Array.isArray(cardMatrix)) return cardMatrix;
    if (!drawnNums || !Array.isArray(drawnNums) || drawnNums.length === 0 || !isAuto) {
      return cardMatrix;
    }
    const drawnSet = new Set(drawnNums);
    return cardMatrix.map(c => {
      if (c.isFree || drawnSet.has(c.val as number)) {
        return { ...c, marked: true };
      }
      return c;
    });
  };

  // Authoritative Round Number & Ball Liveness Watchdog Tracking
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const roundNumberRef = useRef<number>(1);
  roundNumberRef.current = roundNumber;

  const lastBallTimeRef = useRef<number>(Date.now());

  // Storage key for persistent active ticket across app reloads / disconnects
  const ACTIVE_TICKET_STORAGE_KEY = 'betika_bingo_active_ticket';

  // ── Persistent Active Ticket & Disconnect Protection Rehydration ──
  useEffect(() => {
    try {
      const savedRaw = localStorage.getItem(ACTIVE_TICKET_STORAGE_KEY);
      if (savedRaw) {
        const saved = JSON.parse(savedRaw);
        const ageMs = Date.now() - (saved.timestamp || 0);
        // Valid within 15 minutes (active lobby or game in progress)
        if (ageMs < 15 * 60 * 1000) {
          if (typeof saved.betAmount === 'number') setBetAmountState(saved.betAmount);
          if (typeof saved.cardQuantity === 'number') setCardQuantityState(Math.max(1, Math.min(2, saved.cardQuantity)));
          if (Array.isArray(saved.selectedCartelaIds) && saved.selectedCartelaIds.length > 0) {
            setSelectedCartelaIds([
              saved.selectedCartelaIds[0] || selectedCartelaIds[0],
              saved.selectedCartelaIds[1] || selectedCartelaIds[1],
              saved.selectedCartelaIds[2] || selectedCartelaIds[2]
            ]);
            setCartela1Data(generateCardFromId(saved.selectedCartelaIds[0]));
            if (saved.selectedCartelaIds[1]) {
              setCartela2Data(generateCardFromId(saved.selectedCartelaIds[1]));
            }
          }
          setHasTicket(true);
          setGameActive(true);
          console.log('🔄 [BingoContext] Restored active waiting ticket from persistent session');
        } else {
          // Stale unplayed ticket that was abandoned while waiting in lobby: reconcile and refund stake
          const unplayedRefund = (saved.betAmount || 10) * (saved.cardQuantity || 1);
          if (unplayedRefund > 0) {
            addBalanceRef.current(unplayedRefund);
            refreshBalanceRef.current();
            showToast(`💸 ${unplayedRefund} ETB refunded from unplayed lobby round!`);
          }
          localStorage.removeItem(ACTIVE_TICKET_STORAGE_KEY);
        }
      }
    } catch (e) {
      console.warn('Error reading active ticket storage:', e);
    }
  }, []);

  // Socket.IO Multiplayer Room Listener (Stable: Never reconnects on stake change)
  useEffect(() => {
    const roomId = getActiveRoomId();
    socketService.joinRoom(roomId, userRef.current?.id, userRef.current?.fullName);

    // 1. Room State / Sync
    const unsubRoomState = socketService.onRoomState((state: any) => {
      // Room isolation guard: ignore broadcasts from other stake rooms
      if (state.roomId && state.roomId !== roomId) return;

      if (typeof state.roundNumber === 'number' && state.roundNumber !== roundNumberRef.current) {
        console.log(`🔄 [BingoContext] Round transition: #${roundNumberRef.current} -> #${state.roundNumber}`);
        setRoundNumber(state.roundNumber);
      }

      if (state.phase) {
        setRoundPhase(prev => {
          if (prev !== 'lobby' && state.phase === 'lobby') {
            winModalDismissedForRoundRef.current = null;
            setShowWinModal(false);
            setHasTicket(hasPreBoughtNextRef.current);
            setHasPreBoughtNext(false);
            setCalledNumbers([]);
            setCurrentCall(null);
          } else if (state.phase === 'playing') {
            setGameActive(true);
          }
          return state.phase;
        });
      }
      if (typeof state.lobbyCountdown === 'number') setLobbyCountdown(state.lobbyCountdown);
      if (typeof state.winnerCountdown === 'number') setWinnerCountdown(state.winnerCountdown);
      if (typeof state.playersCount === 'number') setPlayersCount(state.playersCount);
      if (typeof state.winnerPayout === 'number') setPrizePool(state.winnerPayout);
      else if (typeof state.totalPot === 'number') setPrizePool(state.totalPot);

      if (typeof state.waitingForPlayers === 'boolean') setWaitingForPlayers(state.waitingForPlayers);
      if (typeof state.realPlayerCount === 'number') setRealPlayerCount(state.realPlayerCount);
      if (state.stakeRoomsSummary) setStakeRoomsSummary(state.stakeRoomsSummary);

      if (state.currentCall) {
        setCurrentCall(state.currentCall);
      }

      // Multi-Device & Disconnect Hydration: If server reports active tickets for this user
      if (state.userTickets && Array.isArray(state.userTickets) && state.userTickets.length > 0) {
        const tickets = state.userTickets;
        const newIds = tickets.map((t: any) => t.cartelaId);
        const updatedIds: [number, number, number] = [
          newIds[0] || selectedCartelaIdsRef.current[0],
          newIds[1] || selectedCartelaIdsRef.current[1],
          newIds[2] || selectedCartelaIdsRef.current[2]
        ];
        setSelectedCartelaIds(updatedIds);
        const drawn = (state.drawnNumbers && state.drawnNumbers.length > 0) ? state.drawnNumbers : calledNumbersRef.current;
        if (tickets[0]?.cardMatrix) setCartela1Data(hydrateCardWithDrawn(tickets[0].cardMatrix, drawn, autoPlayRef.current));
        if (tickets[1]?.cardMatrix) setCartela2Data(hydrateCardWithDrawn(tickets[1].cardMatrix, drawn, autoPlayRef.current));

        if (state.isPreBuy) {
          setHasPreBoughtNext(true);
        } else {
          setHasTicket(true);
          if (state.phase === 'playing') {
            setGameActive(true);
          }
        }
      }

      if (state.drawnNumbers && Array.isArray(state.drawnNumbers) && state.drawnNumbers.length > 0) {
        fastForwardCatchUpRef.current(state.drawnNumbers);
        lastBallTimeRef.current = Date.now();
      }

      if (state.winResult && winModalDismissedForRoundRef.current !== (state.roundNumber || roundNumberRef.current)) {
        const currentUser = userRef.current;
        const isRealUserWin = 
          Boolean(currentUser?.id && Array.isArray(state.winResult.winnerUserIds) && state.winResult.winnerUserIds.includes(currentUser.id)) ||
          Boolean(currentUser?.id && state.winResult.winnerId && state.winResult.winnerId.includes(currentUser.id)) || 
          Boolean(currentUser?.fullName && state.winResult.winnerNames && state.winResult.winnerNames.includes(currentUser.fullName));

        if (isRealUserWin) {
          lastLiveWinRoundRef.current = state.roundNumber || roundNumberRef.current;
        }

        const winType = state.winResult.isSplit
          ? (isRealUserWin ? 'user_split' : 'opponent_win')
          : (isRealUserWin ? 'user_solo' : 'opponent_win');

        const payout = isRealUserWin ? (state.winResult.sharePerWinner || state.winResult.userShare || 0) : 0;
        const displayPayout = typeof state.winResult.winnerPayout === 'number'
          ? state.winResult.winnerPayout
          : (state.winResult.sharePerWinner || state.winResult.totalPot || 50);

        setWinResult({
          winType,
          winningCartelaNumber: state.winResult.winningCartelaNumber || (state.winResult.winningCartelas?.[0]) || 1,
          winningLine: state.winResult.winningIndices || [],
          winnerName: state.winResult.winnerName || (state.winResult.winnerNames?.[0]) || 'Winner',
          coWinners: Array.isArray(state.winResult.coWinners) ? state.winResult.coWinners : (Array.isArray(state.winResult.winnerNames) ? state.winResult.winnerNames : []),
          totalPot: state.winResult.totalPot || displayPayout,
          userShare: payout,
          winnerPayout: displayPayout,
          stakeAmount: state.winResult.stakeAmount || 10
        });
        setShowWinModal(true);
      }
    });

    // 2. Ball Called
    const unsubBallCalled = socketService.onBallCalled((data: any) => {
      if (data.roomId && data.roomId !== roomId) return;
      lastBallTimeRef.current = Date.now();
      if (data.currentCall) {
        applyDrawnNumberRef.current(data.currentCall.num, data.currentCall.col);
      }
      if (data.drawnNumbers) {
        setCalledNumbers(data.drawnNumbers);
      }
    });

    // 3. Round Started
    const unsubRoundStarted = socketService.onRoundStarted((data: any) => {
      if (data.roomId && data.roomId !== roomId) return;
      lastBallTimeRef.current = Date.now();
      if (typeof data.roundNumber === 'number') {
        setRoundNumber(data.roundNumber);
      }
      setRoundPhase('playing');
      setGameActive(true);
      setWaitingForPlayers(false);
      if (typeof data.realPlayerCount === 'number') {
        setRealPlayerCount(data.realPlayerCount);
      }
      if (typeof data.playersCount === 'number') {
        setPlayersCount(data.playersCount);
      }
      setCalledNumbers([]);
      setCurrentCall(null);
      setWinResult(null);
      winModalDismissedForRoundRef.current = null;
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
      if (winData.roomId && winData.roomId !== roomId) return;
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
        : (winData.sharePerWinner || winData.totalPot || 50);

      setWinResult({
        winType,
        winningCartelaNumber: winData.winningCartelaNumber || (winData.winningCartelas?.[0]) || 1,
        winningLine: winData.winningIndices || [],
        winnerName: winData.winnerName || (winData.winnerNames?.[0]) || 'Winner',
        coWinners: Array.isArray(winData.coWinners) ? winData.coWinners : (Array.isArray(winData.winnerNames) ? winData.winnerNames : []),
        totalPot: winData.totalPot || displayPayout,
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
      try {
        localStorage.removeItem(ACTIVE_TICKET_STORAGE_KEY);
      } catch {}
      refreshBalanceRef.current();
    });

    // 5. Real-Time Server Balance Push
    let unsubBalance: (() => void) | null = null;
    if (user?.id) {
      unsubBalance = socketService.onUserBalanceUpdate(user.id, () => {
        refreshBalanceRef.current();
      });
    }

    // 6. Cross-Device Live Mirroring: Tickets Synced Across All Logged-in Devices
    const unsubTicketsSynced = socketService.onUserTicketsSynced((data: any) => {
      console.log('🎟️ [BingoContext] Multi-device ticket sync event received:', data);
      if (data.tickets && Array.isArray(data.tickets) && data.tickets.length > 0) {
        const tickets = data.tickets;
        const newIds = tickets.map((t: any) => t.cartelaId);
        const updatedIds: [number, number, number] = [
          newIds[0] || selectedCartelaIdsRef.current[0],
          newIds[1] || selectedCartelaIdsRef.current[1],
          newIds[2] || selectedCartelaIdsRef.current[2]
        ];
        setSelectedCartelaIds(updatedIds);
        const drawn = calledNumbersRef.current;
        if (tickets[0]?.cardMatrix) setCartela1Data(hydrateCardWithDrawn(tickets[0].cardMatrix, drawn, autoPlayRef.current));
        if (tickets[1]?.cardMatrix) setCartela2Data(hydrateCardWithDrawn(tickets[1].cardMatrix, drawn, autoPlayRef.current));
        if (tickets[2]?.cardMatrix) setCartela3Data(hydrateCardWithDrawn(tickets[2].cardMatrix, drawn, autoPlayRef.current));

        if (data.isPreBuy) {
          setHasPreBoughtNext(true);
          showToast('🎟️ Tickets synced from your other phone (Pre-Bought for Next Round)!');
        } else {
          setHasTicket(true);
          showToast('🎟️ Tickets synced from your other phone! Ready for round.');
        }
      }
      refreshBalanceRef.current();
    });

    // 7. Network Connection Status & Offline Win Listeners
    const unsubConn = socketService.onConnectionStatusChange((status, latency) => {
      setNetworkLatency(latency);
      setNetworkStatus(status);
    });

    const unsubOfflineWins = socketService.onOfflineWinNotification((wins) => {
      if (Array.isArray(wins) && wins.length > 0) {
        const currentRnd = roundNumberRef.current;
        const lastLiveRnd = lastLiveWinRoundRef.current;

        const trulyOfflineWins: any[] = [];
        wins.forEach((w: any) => {
          // If the win belongs to the current round or a round played live, auto-acknowledge silently without modal
          if (w.roundNumber === currentRnd || w.roundNumber === lastLiveRnd) {
            console.log(`🛡️ [BingoContext] Suppressing offline modal for live-participated round #${w.roundNumber}`);
            socketService.acknowledgeOfflineWin(w.id);
          } else {
            trulyOfflineWins.push(w);
          }
        });

        if (trulyOfflineWins.length > 0) {
          setOfflineWinsNotice(trulyOfflineWins);
          soundEngine.playWinFanfare();
          refreshBalanceRef.current();
        }
      }
    });

    // 8. Real-Time Lobby Player Joined Event
    const unsubPlayerJoined = socketService.onPlayerJoined((data: any) => {
      if (data.roomId && data.roomId !== roomId) return;
      if (typeof data.realPlayerCount === 'number') setRealPlayerCount(data.realPlayerCount);
      if (typeof data.waitingForPlayers === 'boolean') setWaitingForPlayers(data.waitingForPlayers);
      if (data.userName) {
        setJoinFeed(prev => [
          { id: Date.now(), userName: data.userName, countdownStarted: Boolean(data.countdownStarted) },
          ...prev
        ].slice(0, 4));
      }
    });

    // 9. Real-Time Stake Rooms Player Count Summary
    const unsubStakeSummary = socketService.onStakeRoomsSummary((summary) => {
      if (summary) setStakeRoomsSummary(summary);
    });

    return () => {
      unsubRoomState();
      unsubBallCalled();
      unsubRoundStarted();
      unsubRoundWinner();
      if (unsubBalance) unsubBalance();
      unsubTicketsSynced();
      unsubConn();
      unsubOfflineWins();
      unsubPlayerJoined();
      unsubStakeSummary();
    };
  }, [getActiveRoomId, user?.id]);

  // Central Authoritative Room Snapshot Reconciliation
  const applyRoomSnapshot = useCallback((data: any) => {
    if (!data || !data.success) return;

    if (typeof data.roundNumber === 'number') {
      setRoundNumber(data.roundNumber);
    }

    if (data.phase) {
      setRoundPhase(prev => {
        if (prev !== 'lobby' && data.phase === 'lobby') {
          winModalDismissedForRoundRef.current = null;
          setShowWinModal(false);
          setWinResult(null);
          setHasTicket(hasPreBoughtNextRef.current);
          setHasPreBoughtNext(false);
          setCalledNumbers([]);
          setCurrentCall(null);

          // Regenerate fresh unmarked cartelas on entering lobby so previous win-glow never persists
          const currentIds = selectedCartelaIdsRef.current;
          setCartela1Data(generateCardFromId(currentIds[0]));
          setCartela2Data(generateCardFromId(currentIds[1]));
          setCartela3Data(generateCardFromId(currentIds[2]));
        } else if (data.phase === 'playing') {
          setGameActive(true);
        }
        return data.phase;
      });
    }

    if (typeof data.lobbyCountdown === 'number') setLobbyCountdown(data.lobbyCountdown);
    if (typeof data.winnerCountdown === 'number') setWinnerCountdown(data.winnerCountdown);
    if (typeof data.playersCount === 'number') setPlayersCount(data.playersCount);
    if (typeof data.winnerPayout === 'number') setPrizePool(data.winnerPayout);
    else if (typeof data.totalPot === 'number') setPrizePool(data.totalPot);
    if (typeof data.waitingForPlayers === 'boolean') setWaitingForPlayers(data.waitingForPlayers);
    if (typeof data.realPlayerCount === 'number') setRealPlayerCount(data.realPlayerCount);
    if (data.stakeRoomsSummary) setStakeRoomsSummary(data.stakeRoomsSummary);

    if (Array.isArray(data.drawnNumbers) && data.drawnNumbers.length > 0) {
      fastForwardCatchUpRef.current(data.drawnNumbers);
      lastBallTimeRef.current = Date.now();
    }

    if (data.currentCall) {
      setCurrentCall(data.currentCall);
    }

    // Multi-Device Hydration: If user has active tickets on server, sync into local state
    if (data.userTickets && Array.isArray(data.userTickets) && data.userTickets.length > 0) {
      const tickets = data.userTickets;
      const newIds = tickets.map((t: any) => t.cartelaId);
      const updatedIds: [number, number, number] = [
        newIds[0] || selectedCartelaIdsRef.current[0],
        newIds[1] || selectedCartelaIdsRef.current[1],
        newIds[2] || selectedCartelaIdsRef.current[2]
      ];
      setSelectedCartelaIds(updatedIds);
      const drawn = (data.drawnNumbers && data.drawnNumbers.length > 0) ? data.drawnNumbers : calledNumbersRef.current;
      if (tickets[0]?.cardMatrix) setCartela1Data(hydrateCardWithDrawn(tickets[0].cardMatrix, drawn, autoPlayRef.current));
      if (tickets[1]?.cardMatrix) setCartela2Data(hydrateCardWithDrawn(tickets[1].cardMatrix, drawn, autoPlayRef.current));
      if (tickets[2]?.cardMatrix) setCartela3Data(hydrateCardWithDrawn(tickets[2].cardMatrix, drawn, autoPlayRef.current));

      if (data.isPreBuy) {
        setHasPreBoughtNext(true);
      } else {
        setHasTicket(true);
        if (data.phase === 'playing') {
          setGameActive(true);
        }
      }
    }

    if (data.winResult && !showWinModal && winModalDismissedForRoundRef.current !== data.roundNumber) {
      const currentUser = userRef.current;
      const isRealUserWin = 
        Boolean(currentUser?.id && Array.isArray(data.winResult.winnerUserIds) && data.winResult.winnerUserIds.includes(currentUser.id)) ||
        Boolean(currentUser?.id && data.winResult.winnerId && data.winResult.winnerId.includes(currentUser.id)) || 
        Boolean(currentUser?.fullName && data.winResult.winnerNames && data.winResult.winnerNames.includes(currentUser.fullName));

      if (isRealUserWin) {
        lastLiveWinRoundRef.current = data.roundNumber || roundNumberRef.current;
      }

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
        totalPot: data.winResult.totalPot || (data.winResult.winnerPayout || 50),
        userShare: payout,
        winnerPayout: data.winResult.winnerPayout || (data.winResult.totalPot || 50),
        stakeAmount: data.winResult.stakeAmount || 10
      });
      setShowWinModal(true);
    }
  }, [showWinModal]);

  // 1-Tap Manual Refresh Trigger (Instantly resolves freezes on weak network)
  const triggerManualSync = useCallback(async () => {
    const roomId = getActiveRoomId();
    console.log('⚡ [BingoContext] Manual 1-Tap Re-Sync triggered by user for room:', roomId);
    telegramService.triggerHaptic('light');
    setIsSyncing(true);
    showToast('🔄 Synchronizing game state...');

    try {
      // Re-verify room membership on socket
      socketService.joinRoom(roomId, userRef.current?.id, userRef.current?.fullName);

      // Resilient 6-second HTTP state snapshot fetch
      const data = await fetchRoomSyncWithTimeout(roomId, 6000, userRef.current?.id);
      if (data) {
        applyRoomSnapshot(data);
        socketService.markActivity();
        setNetworkStatus('connected');
        soundEngine.resumeAudioContext();
        telegramService.triggerHaptic('success');
        showToast('✅ Game state synchronized!');
      } else {
        // Safe reconnection that preserves all event listeners
        socketService.forceReconnect();
        showToast('⚠️ Reconnected to server. Fetching latest state...');
      }
    } finally {
      setIsSyncing(false);
    }
  }, [getActiveRoomId, applyRoomSnapshot, showToast]);

  // Dual-Engine HTTP Polling Fallback (Runs if Socket drops, degraded, or reconnecting)
  useEffect(() => {
    if (networkStatus !== 'reconnecting' && networkStatus !== 'polling' && networkStatus !== 'degraded') {
      return;
    }

    const roomId = getActiveRoomId();
    let isCancelled = false;

    const pollSync = async () => {
      const data = await fetchRoomSyncWithTimeout(roomId, 5000, userRef.current?.id);
      if (isCancelled || !data) return;
      if (networkStatus === 'reconnecting' || networkStatus === 'degraded') {
        setNetworkStatus('polling');
      }
      applyRoomSnapshot(data);
    };

    pollSync();
    const interval = setInterval(pollSync, 2000);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [networkStatus, getActiveRoomId, applyRoomSnapshot]);

  // 1. Mobile Foreground Lifecycle Resynchronization (Zero-Freeze Recovery)
  useEffect(() => {
    const handleForegroundSync = async () => {
      soundEngine.resumeAudioContext();
      const roomId = getActiveRoomId();
      try {
        const data = await fetchRoomSyncWithTimeout(roomId, 6000, userRef.current?.id);
        if (data) {
          console.log('⚡ [BingoContext] Fast-forward catch-up on foreground resume:', {
            phase: data.phase,
            roundNumber: data.roundNumber,
            totalDrawn: data.totalDrawn
          });
          applyRoomSnapshot(data);
          socketService.markActivity();
          setNetworkStatus('connected');
        }
      } catch (err) {
        console.warn('Foreground sync notice:', err);
      }
    };

    const unsubResume = socketService.onForegroundResume(handleForegroundSync);
    return () => {
      unsubResume();
    };
  }, [getActiveRoomId, applyRoomSnapshot]);

  // 2. Universal All-Phase Liveness Watchdog (Lobby + Playing + Winner)
  // Ensures countdowns, ball calls, and phase transitions never freeze even with packet drops
  useEffect(() => {
    const watchdogInterval = setInterval(async () => {
      const roomId = getActiveRoomId();

      if (roundPhase === 'playing') {
        const elapsedSinceLastBall = Date.now() - lastBallTimeRef.current;
        // Normal cadence is 3.5s. If > 4.5s has elapsed without a ball event:
        if (elapsedSinceLastBall > 4500) {
          console.warn(`⚠️ [Bingo Watchdog] No ball event for ${(elapsedSinceLastBall / 1000).toFixed(1)}s. Running silent sync...`);
          const data = await fetchRoomSyncWithTimeout(roomId, 4000, userRef.current?.id);
          if (data) {
            applyRoomSnapshot(data);
            lastBallTimeRef.current = Date.now();
          }
        }
      } else if (roundPhase === 'lobby') {
        // If lobby timer reaches <= 0 or stops updating for > 3s, verify if round started on server
        if (lobbyCountdown <= 0) {
          const data = await fetchRoomSyncWithTimeout(roomId, 4000, userRef.current?.id);
          if (data && data.phase !== 'lobby') {
            console.log('⚡ [Bingo Watchdog] Lobby ended. Auto-transitioning to active round...');
            applyRoomSnapshot(data);
          }
        }
      } else if (roundPhase === 'winner') {
        // If in winner phase and countdown is 0 or > 8s elapsed, sync to enter lobby
        if (winnerCountdown <= 0) {
          const data = await fetchRoomSyncWithTimeout(roomId, 4000, userRef.current?.id);
          if (data && data.phase !== 'winner') {
            applyRoomSnapshot(data);
          }
        }
      }
    }, 2000);

    return () => clearInterval(watchdogInterval);
  }, [roundPhase, lobbyCountdown, winnerCountdown, getActiveRoomId, applyRoomSnapshot]);

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

  const shuffleCartela = (cardIdx: number = 0) => {
    if (hasTicket && roundPhase === 'playing') return;
    const newId = Math.floor(1 + Math.random() * 400);
    const updated: [number, number, number] = [...selectedCartelaIds];
    updated[cardIdx] = newId;
    setSelectedCartelaIds(updated);
    soundEngine.playPop();
    showToast(`🎲 Previewing Cartela #${newId}`);
  };

  const selectSpecificCartela = (cardIdx: number, cartelaId: number) => {
    if (hasTicket && roundPhase === 'playing') return;
    const clamped = Math.max(1, Math.min(400, cartelaId));
    const updated: [number, number, number] = [...selectedCartelaIds];
    updated[cardIdx] = clamped;
    setSelectedCartelaIds(updated);
    showToast(`🎟️ Selected Cartela #${clamped}`);
  };

  const stopGame = useCallback(() => {
    setGameActive(false);
  }, []);

  const toggleAutoPlay = () => {
    if (roundPhase === 'playing') {
      showToast(
        autoPlay
          ? '🔒 Auto-Play is locked during active game! You can change to Manual in the next game.'
          : '🔒 Manual Mode is locked during active game! You can change to Auto-Play in the next game.'
      );
      return;
    }

    const next = !autoPlay;
    setAutoPlay(next);
    autoPlayRef.current = next;
    if (next) {
      setCartela1Data(prev => prev.map(c => (!c.marked && !c.isFree && calledNumbers.includes(c.val as number) ? { ...c, marked: true } : c)));
      setCartela2Data(prev => prev.map(c => (!c.marked && !c.isFree && calledNumbers.includes(c.val as number) ? { ...c, marked: true } : c)));
      setCartela3Data(prev => prev.map(c => (!c.marked && !c.isFree && calledNumbers.includes(c.val as number) ? { ...c, marked: true } : c)));
      showToast('⚡ Auto-Play Selected (Active for next game)');
    } else {
      showToast('✋ Manual Mode Selected (Active for next game)');
    }

    if (user?.id) {
      socketService.updatePlayerMode(getActiveRoomId(), user.id, next);
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

    // Send to live server with chosen isAutoPlay mode
    if (user?.id) {
      const res = await socketService.buyTicket(roomId, user.id, user.fullName, activeIds, betAmount, autoPlayRef.current);
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

    // Persist active ticket session so app reload / close does not lose ticket or money
    try {
      localStorage.setItem(ACTIVE_TICKET_STORAGE_KEY, JSON.stringify({
        roomId,
        betAmount,
        cardQuantity,
        selectedCartelaIds: activeIds,
        timestamp: Date.now(),
        roundNumber: roundNumberRef.current
      }));
    } catch {}

    // If joining during playing phase, auto-daub any numbers already drawn
    if (calledNumbers.length > 0) {
      setCartela1Data(prev => prev.map(c => (!c.marked && !c.isFree && calledNumbers.includes(c.val as number) ? { ...c, marked: true } : c)));
      setCartela2Data(prev => prev.map(c => (!c.marked && !c.isFree && calledNumbers.includes(c.val as number) ? { ...c, marked: true } : c)));
      setCartela3Data(prev => prev.map(c => (!c.marked && !c.isFree && calledNumbers.includes(c.val as number) ? { ...c, marked: true } : c)));
    }

    soundEngine.playLuckyPick();
    showToast(`🎟️ Playing ${totalPlayableCards} Cartela${totalPlayableCards > 1 ? 's' : ''} (${totalCost} ETB)!`);
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

  // Safe Voluntary Lobby Exit / Disconnect Refund
  const cancelLobbyTicket = async (): Promise<boolean> => {
    if (!hasTicket && !hasPreBoughtNext) return false;
    const refundAmount = betAmount * cardQuantity;
    let refunded = false;

    if (userRef.current?.id) {
      try {
        const roomId = getActiveRoomId();
        const res = await socketService.cancelTicketLobby(roomId, userRef.current.id);
        if (res.success) {
          refunded = true;
        }
      } catch (err) {
        console.warn('Error cancelling lobby ticket:', err);
      }
    }

    if (!refunded) {
      addBalanceRef.current(refundAmount);
    }

    setHasTicket(false);
    setHasPreBoughtNext(false);
    try {
      localStorage.removeItem(ACTIVE_TICKET_STORAGE_KEY);
    } catch {}
    refreshBalanceRef.current();
    showToast(`💸 ${refundAmount} ETB refunded to your wallet!`);
    return true;
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

        // INSTANT WIN CHECK: If this tap completes a 5-in-a-row line, claim BINGO immediately with no extra button!
        const winLine = checkWinningPatterns(newCells);
        if (winLine && winLine.length > 0) {
          console.log(`🎉 [ManualDaub] Winning line completed on Cartela #${selectedCartelaIds[cartelaIdx]}! Triggering instant claim...`);
          claimBingo(cartelaIdx, newCells);
        }
      } else {
        showToast(`⚠️ ${cell.colLetter}-${cell.val} has not been called yet!`);
      }
    }
  };

  // Claim BINGO to Server Engine (supports direct override with current cell state)
  const claimBingo = async (overrideCardIdx?: number, overrideCells?: BingoCell[]) => {
    const c1 = overrideCardIdx === 0 && overrideCells ? overrideCells : cartela1Data;
    const c2 = overrideCardIdx === 1 && overrideCells ? overrideCells : cartela2Data;
    const c3 = overrideCardIdx === 2 && overrideCells ? overrideCells : cartela3Data;

    const win1 = checkWinningPatterns(c1);
    const win2 = totalPlayableCards >= 2 ? checkWinningPatterns(c2) : null;
    const win3 = totalPlayableCards >= 3 ? checkWinningPatterns(c3) : null;

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

        const winData = res.winResult;
        lastLiveWinRoundRef.current = winData?.roundNumber || roundNumberRef.current;
        const totalPot = winData?.totalPot || prizePool;
        const winnerPayout = winData?.winnerPayout || totalPot;
        const userShare = winData?.sharePerWinner || winData?.userShare || winnerPayout;

        setWinResult({
          winType: winData?.isSplit ? 'user_split' : 'user_solo',
          winningCartelaNumber: winningCartelaId,
          winningLine: win1 || win2 || win3 || [],
          winnerName: user.fullName || 'እርስዎ (You)',
          coWinners: winData?.coWinners || [],
          totalPot: totalPot,
          userShare: userShare,
          winnerPayout: winnerPayout,
          stakeAmount: betAmount
        });
        setShowWinModal(true);
        soundEngine.playWinFanfare();
        return;
      }

      setWinResult({
        winType: 'user_solo',
        winningCartelaNumber: winningCartelaId,
        winningLine: win1 || win2 || win3 || [],
        winnerName: 'እርስዎ (You)',
        coWinners: [],
        totalPot: prizePool,
        userShare: prizePool,
        winnerPayout: prizePool,
        stakeAmount: betAmount
      });
      setShowWinModal(true);
      soundEngine.playWinFanfare();
    } else {
      soundEngine.playPop();
      showToast('⚠️ Pattern not complete yet! Keep daubing!');
    }
  };

  const closeWinModalAndRestart = () => {
    winModalDismissedForRoundRef.current = roundNumberRef.current || roundNumber;
    setShowWinModal(false);
    setWinResult(null);
    setHasTicket(false);
    const newIds: [number, number, number] = [
      Math.floor(1 + Math.random() * 120),
      Math.floor(121 + Math.random() * 140),
      Math.floor(261 + Math.random() * 135)
    ];
    setSelectedCartelaIds(newIds);
    setCartela1Data(generateCardFromId(newIds[0]));
    setCartela2Data(generateCardFromId(newIds[1]));
    setCartela3Data(generateCardFromId(newIds[2]));
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
        stakeRoomsSummary,
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
        waitingForPlayers,
        realPlayerCount,
        joinFeed,
        startLobbyCountdown,
        handleManualDaub,
        claimBingo,
        closeWinModalAndRestart,
        stopGame,
        shuffleCartela,
        selectSpecificCartela,
        networkStatus,
        networkLatency,
        offlineWinsNotice,
        dismissOfflineWin,
        triggerManualSync,
        isSyncing,
        cancelLobbyTicket,
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
