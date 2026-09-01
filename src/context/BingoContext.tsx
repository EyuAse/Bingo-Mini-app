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
import { useWallet } from './WalletContext.tsx';
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
  cartela3Data: BingoCell[]; // Bonus Card when cardQuantity >= 2
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

// Generate 75-Ball 5x5 Matrix from Cartela ID (deterministic or random seeded)
const generateCardFromId = (cartelaId: number): BingoCell[] => {
  // Use cartelaId as seed for stable distinctive card numbers
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

      cells.push({ index: idx, row, col, colLetter, val, isFree, marked: isFree });
    }
  }
  return cells;
};

// Winning lines (Rows, Columns, Diagonals)
const WIN_PATTERNS = [
  // Diagonals
  [0, 6, 12, 18, 24],
  [4, 8, 12, 16, 20],
  // Rows
  [0, 1, 2, 3, 4],
  [5, 6, 7, 8, 9],
  [10, 11, 12, 13, 14],
  [15, 16, 17, 18, 19],
  [20, 21, 22, 23, 24],
  // Columns
  [0, 5, 10, 15, 20],
  [1, 6, 11, 16, 21],
  [2, 7, 12, 17, 22],
  [3, 8, 13, 18, 23],
  [4, 9, 14, 19, 24]
];

const checkWinningPatterns = (cells: BingoCell[]): number[] | null => {
  for (const line of WIN_PATTERNS) {
    if (line.every(idx => cells[idx]?.marked)) return line;
  }
  return null;
};

export const BingoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { deductBalance, addBalance } = useWallet();
  const { showToast } = useApp();
  const {
    commissionRate,
    simulatedPlayerCount,
    botPool,
    botWinRate,
    buy2Get1Bonus
  } = useAdmin();

  // Round Lifecycle Phase
  const [roundPhase, setRoundPhase] = useState<RoundPhase>('lobby');
  const [lobbyCountdown, setLobbyCountdown] = useState<number>(12);
  const [winnerCountdown, setWinnerCountdown] = useState<number>(5);

  // Betting state (Stakes: 10, 20, 50, 100 Birr)
  const [betAmount, setBetAmount] = useState<number>(20);
  const [cardQuantity, setCardQuantityState] = useState<number>(1);
  const [hasTicket, setHasTicket] = useState<boolean>(false);
  const [hasPreBoughtNext, setHasPreBoughtNext] = useState<boolean>(false);

  // 400 Cartelas Pool Selection (Pick favorite Cartela IDs e.g. #24, #189, #312)
  const [selectedCartelaIds, setSelectedCartelaIds] = useState<[number, number, number]>([
    Math.floor(1 + Math.random() * 120),
    Math.floor(121 + Math.random() * 140),
    Math.floor(261 + Math.random() * 135)
  ]);
  const [isCartelaPickerOpen, setIsCartelaPickerOpen] = useState<boolean>(false);

  // Card Quantity & Bonus Logic (Buy 2 Get 1 FREE Bonus -> 3 Playable Cards!)
  const setCardQuantity = (qty: number) => {
    setCardQuantityState(Math.max(1, Math.min(2, qty)));
  };

  const totalPlayableCards = (cardQuantity >= 2 && buy2Get1Bonus) ? 3 : cardQuantity;

  // Active Cartelas (Pre-generated from Cartela IDs)
  const [cartela1Data, setCartela1Data] = useState<BingoCell[]>(() => generateCardFromId(selectedCartelaIds[0]));
  const [cartela2Data, setCartela2Data] = useState<BingoCell[]>(() => generateCardFromId(selectedCartelaIds[1]));
  const [cartela3Data, setCartela3Data] = useState<BingoCell[]>(() => generateCardFromId(selectedCartelaIds[2]));
  const [activeCartelaIndex, setActiveCartelaIndex] = useState<number>(0);

  // Game Engine State
  const [gameActive, setGameActive] = useState<boolean>(false);
  const [drawPool, setDrawPool] = useState<number[]>([]);
  const [calledNumbers, setCalledNumbers] = useState<number[]>([]);
  const [currentCall, setCurrentCall] = useState<CalledBall | null>(null);

  // Auto-Play Engine
  const [autoPlay, setAutoPlay] = useState<boolean>(true);
  const autoPlayRef = useRef<boolean>(true);
  autoPlayRef.current = autoPlay;

  // Room & Admin Simulation (20% House Rate & 30% Bot Win Rate)
  const [playersCount, setPlayersCount] = useState<number>(simulatedPlayerCount || 185);
  const [prizePool, setPrizePool] = useState<number>(2960);
  const [opponents, setOpponents] = useState<Opponent[]>([]);
  const [canWin, setCanWin] = useState<boolean>(false);
  const [winResult, setWinResult] = useState<WinResult | null>(null);
  const [showWinModal, setShowWinModal] = useState<boolean>(false);
  const [spherePop, setSpherePop] = useState<boolean>(false);
  const [isVerticalBoard, setIsVerticalBoard] = useState<boolean>(true); // Default vertical board mode
  const [showMasterBoard, setShowMasterBoard] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => soundEngine.getMuted());

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundEngine.setMuted(next);
    showToast(next ? '🔇 Audio Muted' : '🔊 Audio Unmuted');
  };

  // Refs for stable closures in caller interval
  const callerTimerRef = useRef<number | null>(null);
  const lobbyTimerRef = useRef<number | null>(null);
  const winnerTimerRef = useRef<number | null>(null);
  const winTriggeredRef = useRef<boolean>(false);
  const prizePoolRef = useRef<number>(prizePool);
  prizePoolRef.current = prizePool;
  const totalPlayableCardsRef = useRef<number>(totalPlayableCards);
  totalPlayableCardsRef.current = totalPlayableCards;
  const hasTicketRef = useRef<boolean>(hasTicket);
  hasTicketRef.current = hasTicket;
  const selectedCartelaIdsRef = useRef<[number, number, number]>(selectedCartelaIds);
  selectedCartelaIdsRef.current = selectedCartelaIds;

  // Sync Admin Simulated Player Count
  useEffect(() => {
    setPlayersCount(simulatedPlayerCount);
  }, [simulatedPlayerCount]);

  // Real 20% House Commission Cut (Net Pot = Players × Stake × 0.80)
  useEffect(() => {
    const effectiveCommission = commissionRate || 20; // 20% Admin/Owner Cut
    const cutMultiplier = (100 - effectiveCommission) / 100;
    setPrizePool(Math.round(playersCount * betAmount * cutMultiplier));
  }, [playersCount, betAmount, commissionRate]);

  // Live player room fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setPlayersCount(prev => {
        const delta = Math.floor(Math.random() * 5) - 2;
        const minP = Math.max(20, (simulatedPlayerCount || 185) - 15);
        const maxP = (simulatedPlayerCount || 185) + 25;
        return Math.max(minP, Math.min(maxP, prev + delta));
      });
    }, 6000);
    return () => clearInterval(interval);
  }, [simulatedPlayerCount]);

  // Regenerate cards when Cartela IDs change in lobby
  useEffect(() => {
    if (roundPhase === 'lobby') {
      setCartela1Data(generateCardFromId(selectedCartelaIds[0]));
      setCartela2Data(generateCardFromId(selectedCartelaIds[1]));
      setCartela3Data(generateCardFromId(selectedCartelaIds[2]));
    }
  }, [selectedCartelaIds, roundPhase]);

  // canWin detection across all active cards (Card 1, Card 2, Card 3)
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

  const getLetterForNumber = (num: number): string => {
    if (num <= 15) return 'B';
    if (num <= 30) return 'I';
    if (num <= 45) return 'N';
    if (num <= 60) return 'G';
    return 'O';
  };

  const stopGame = useCallback(() => {
    setGameActive(false);
    if (callerTimerRef.current) { clearInterval(callerTimerRef.current); callerTimerRef.current = null; }
    if (lobbyTimerRef.current) { clearInterval(lobbyTimerRef.current); lobbyTimerRef.current = null; }
    if (winnerTimerRef.current) { clearInterval(winnerTimerRef.current); winnerTimerRef.current = null; }
  }, []);

  // Winner Showcase (Solo Win, Split Pot Win, or Bot Opponent Win)
  const triggerWinnerShowcase = useCallback((result: WinResult) => {
    if (winTriggeredRef.current) return;
    winTriggeredRef.current = true;
    stopGame();
    setRoundPhase('winner');
    setWinResult(result);
    setShowWinModal(true);

    if (result.winType === 'user_solo' || result.winType === 'user_split') {
      soundEngine.playWinFanfare();
      addBalance(result.userShare);
    } else {
      soundEngine.playPop();
    }
  }, [addBalance, stopGame]);

  // Generate realistic dynamic opponents from 260+ botPool with assigned Cartela IDs from 400 pool
  const generateLiveOpponents = useCallback((): Opponent[] => {
    const avatarClasses = ['av-purple', 'av-green', 'av-orange', 'av-blue', 'av-pink'];
    const source = (botPool && botPool.length > 0) ? botPool : [];
    const sample = [...source].sort(() => Math.random() - 0.5).slice(0, 6);
    return sample.map((bot, idx) => ({
      name: bot.name,
      avatar: avatarClasses[idx % avatarClasses.length],
      initials: bot.name.split(' ').map((p: string) => p[0]).join('').slice(0, 2),
      cards: Math.random() < 0.45 ? 3 : 2,
      marksNeeded: Math.floor(4 + Math.random() * 3),
      status: 'In Game',
      cartelaNumber: Math.floor(1 + Math.random() * 400)
    }));
  }, [botPool]);

  // Auto-Claim & Multi-Winner Split Pot Checker
  const checkAutoClaimRef = useRef<((c1: BingoCell[], c2: BingoCell[], c3: BingoCell[]) => void) | null>(null);

  const tryAutoClaim = useCallback((c1: BingoCell[], c2: BingoCell[], c3: BingoCell[]) => {
    if (!autoPlayRef.current || !hasTicketRef.current || winTriggeredRef.current) return;

    const win1 = checkWinningPatterns(c1);
    const win2 = totalPlayableCardsRef.current >= 2 ? checkWinningPatterns(c2) : null;
    const win3 = totalPlayableCardsRef.current >= 3 ? checkWinningPatterns(c3) : null;

    if (win1 || win2 || win3) {
      const activeWinCardIdx = win1 ? 0 : win2 ? 1 : 2;
      const winningCartelaId = selectedCartelaIdsRef.current[activeWinCardIdx];
      const winningLine = win1 || win2 || win3 || [];

      // Check for simultaneous co-winners among room opponents (Multiplayer Split-Pot Rule)
      const coWinnersList: string[] = [];
      const botPoolSample = (botPool && botPool.length > 0) ? botPool : [];
      botPoolSample.forEach(bot => {
        if (Math.random() < 0.12 && coWinnersList.length < 2) {
          coWinnersList.push(`${bot.name} (Cartela #${Math.floor(1 + Math.random() * 400)})`);
        }
      });

      const isSplit = coWinnersList.length > 0;
      const totalWinners = 1 + coWinnersList.length;
      const userShare = Math.round(prizePoolRef.current / totalWinners);

      triggerWinnerShowcase({
        winType: isSplit ? 'user_split' : 'user_solo',
        winningCartelaNumber: winningCartelaId,
        winningLine,
        winnerName: 'እርስዎ (You)',
        coWinners: coWinnersList,
        totalPot: prizePoolRef.current,
        userShare
      });
    }
  }, [botPool, triggerWinnerShowcase]);

  checkAutoClaimRef.current = tryAutoClaim;

  // Draw Next Ball (75-ball draw)
  const drawNextBall = useCallback(() => {
    setDrawPool(prevPool => {
      if (prevPool.length === 0) {
        stopGame();
        showToast('Game Over! All 75 numbers called.');
        return [];
      }

      const nextPool = [...prevPool];
      const num = nextPool.pop()!;
      const col = getLetterForNumber(num);

      setCurrentCall({ num, col });
      setSpherePop(true);
      setTimeout(() => setSpherePop(false), 300);

      soundEngine.playPop();
      setCalledNumbers(prev => [...prev, num]);

      // Auto-daub across all 3 active cards
      setCartela1Data(prev => {
        const matchIdx = prev.findIndex(c => c.val === num);
        if (matchIdx !== -1 && !prev[matchIdx].marked) {
          const next = [...prev];
          next[matchIdx] = { ...next[matchIdx], marked: true };
          if (hasTicketRef.current) soundEngine.playDaub();
          return next;
        }
        return prev;
      });

      setCartela2Data(prev => {
        const matchIdx = prev.findIndex(c => c.val === num);
        if (matchIdx !== -1 && !prev[matchIdx].marked) {
          const next = [...prev];
          next[matchIdx] = { ...next[matchIdx], marked: true };
          return next;
        }
        return prev;
      });

      setCartela3Data(prev => {
        const matchIdx = prev.findIndex(c => c.val === num);
        if (matchIdx !== -1 && !prev[matchIdx].marked) {
          const next = [...prev];
          next[matchIdx] = { ...next[matchIdx], marked: true };
          return next;
        }
        return prev;
      });

      // Trigger auto-claim check
      setTimeout(() => {
        if (checkAutoClaimRef.current && hasTicketRef.current) {
          setCartela1Data(c1 => {
            setCartela2Data(c2 => {
              setCartela3Data(c3 => {
                checkAutoClaimRef.current!(c1, c2, c3);
                return c3;
              });
              return c2;
            });
            return c1;
          });
        }
      }, 50);

      // Opponents room simulation (30% Bot Win Rate Engine)
      setOpponents(prevOpponents => {
        if (winTriggeredRef.current) return prevOpponents;

        let opponentHasWon = false;
        let winningOpponent: Opponent | null = null;

        const updated = prevOpponents.map(opp => {
          if (Math.random() < 0.32) {
            const nextNeeded = Math.max(0, opp.marksNeeded - 1);
            if (nextNeeded === 0 && !opponentHasWon) {
              opponentHasWon = true;
              winningOpponent = opp;
            }
            return {
              ...opp,
              marksNeeded: nextNeeded,
              status: nextNeeded === 0 ? 'BINGO! 🏆' : nextNeeded === 1 ? '1 TO GO! 🔥' : `${nextNeeded} to go`
            };
          }
          return opp;
        });

        // Trigger bot win when opponent finishes and user hasn't won
        if (opponentHasWon && winningOpponent && !hasTicketRef.current) {
          triggerWinnerShowcase({
            winType: 'opponent_win',
            winningCartelaNumber: (winningOpponent as Opponent).cartelaNumber || Math.floor(1 + Math.random() * 400),
            winningLine: [],
            winnerName: (winningOpponent as Opponent).name,
            coWinners: [],
            totalPot: prizePoolRef.current,
            userShare: 0
          });
        }

        return updated;
      });

      return nextPool;
    });
  }, [showToast, stopGame, triggerWinnerShowcase]);

  // Start Live Round
  const startLiveRound = useCallback(() => {
    stopGame();
    winTriggeredRef.current = false;
    setRoundPhase('playing');
    setGameActive(true);
    setOpponents(generateLiveOpponents());

    if (hasPreBoughtNext) {
      setHasTicket(true);
      setHasPreBoughtNext(false);
    }

    const pool: number[] = [];
    for (let i = 1; i <= 75; i++) pool.push(i);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    setDrawPool(pool);
    setCalledNumbers([]);
    setCurrentCall(null);
    setWinResult(null);
    setCanWin(false);
    setShowWinModal(false);
    setActiveCartelaIndex(0);

    // Generate fresh Cartelas for the round from the chosen 400 IDs
    setCartela1Data(generateCardFromId(selectedCartelaIdsRef.current[0]));
    setCartela2Data(generateCardFromId(selectedCartelaIdsRef.current[1]));
    setCartela3Data(generateCardFromId(selectedCartelaIdsRef.current[2]));

    callerTimerRef.current = window.setTimeout(() => {
      drawNextBall();
      callerTimerRef.current = window.setInterval(() => {
        drawNextBall();
      }, 3300);
    }, 1500);
  }, [drawNextBall, generateLiveOpponents, hasPreBoughtNext, stopGame]);

  // Lobby Countdown (12 seconds)
  const startLobbyCountdown = useCallback(() => {
    stopGame();
    winTriggeredRef.current = false;
    setRoundPhase('lobby');
    setLobbyCountdown(12);
    setShowWinModal(false);
    if (lobbyTimerRef.current) clearInterval(lobbyTimerRef.current);

    lobbyTimerRef.current = window.setInterval(() => {
      setLobbyCountdown(prev => {
        if (prev === 3) setRoundPhase('locked');
        if (prev <= 1) {
          if (lobbyTimerRef.current) clearInterval(lobbyTimerRef.current);
          startLiveRound();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [startLiveRound, stopGame]);

  // Toggle Auto-Play
  const toggleAutoPlay = () => {
    const next = !autoPlay;
    setAutoPlay(next);
    autoPlayRef.current = next;
    if (next) {
      setCartela1Data(prev => prev.map(c => (!c.marked && !c.isFree && calledNumbers.includes(c.val as number) ? { ...c, marked: true } : c)));
      setCartela2Data(prev => prev.map(c => (!c.marked && !c.isFree && calledNumbers.includes(c.val as number) ? { ...c, marked: true } : c)));
      setCartela3Data(prev => prev.map(c => (!c.marked && !c.isFree && calledNumbers.includes(c.val as number) ? { ...c, marked: true } : c)));
      showToast('⚡ Auto-Play ON — Cards auto-daubed & BINGO claimed automatically!');
    } else {
      showToast('✋ Manual Daubing Active');
    }
  };

  // Buy Ticket (Cost = BetAmount * CardQuantity; if CardQuantity >= 2 gets 3rd Card FREE!)
  const buyTicket = () => {
    if (roundPhase !== 'lobby') {
      showToast('⚠️ Ticket sales closed! Use Pre-Buy for the next round.');
      return;
    }
    const totalCost = betAmount * cardQuantity;
    const success = deductBalance(totalCost);
    if (!success) {
      showToast('❌ Insufficient balance! Please deposit to continue.');
      return;
    }
    setHasTicket(true);
    hasTicketRef.current = true;
    soundEngine.playLuckyPick();
    const bonusText = (cardQuantity >= 2 && buy2Get1Bonus) ? ' + 1 FREE BONUS CARD 🎁' : '';
    showToast(`🎟️ Playing ${totalPlayableCards} Cartelas for ${totalCost} ETB${bonusText}!`);
  };

  // Pre-Buy for Next Round
  const preBuyNextRound = () => {
    const totalCost = betAmount * cardQuantity;
    const success = deductBalance(totalCost);
    if (!success) {
      showToast('❌ Insufficient balance! Please deposit to continue.');
      return;
    }
    setHasPreBoughtNext(true);
    soundEngine.playLuckyPick();
    showToast(`🎟️ Pre-Bought ${totalPlayableCards} Cartelas for the next round!`);
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

  // Manual Claim BINGO
  const claimBingo = () => {
    const win1 = checkWinningPatterns(cartela1Data);
    const win2 = totalPlayableCards >= 2 ? checkWinningPatterns(cartela2Data) : null;
    const win3 = totalPlayableCards >= 3 ? checkWinningPatterns(cartela3Data) : null;

    if (win1 || win2 || win3) {
      const activeWinCardIdx = win1 ? 0 : win2 ? 1 : 2;
      const winningCartelaId = selectedCartelaIds[activeWinCardIdx];
      const winningLine = win1 || win2 || win3 || [];

      // Check simultaneous winners for pot sharing
      const coWinnersList: string[] = [];
      const botPoolSample = (botPool && botPool.length > 0) ? botPool : [];
      botPoolSample.forEach(bot => {
        if (Math.random() < 0.12 && coWinnersList.length < 2) {
          coWinnersList.push(`${bot.name} (Cartela #${Math.floor(1 + Math.random() * 400)})`);
        }
      });

      const isSplit = coWinnersList.length > 0;
      const totalWinners = 1 + coWinnersList.length;
      const userShare = Math.round(prizePool / totalWinners);

      triggerWinnerShowcase({
        winType: isSplit ? 'user_split' : 'user_solo',
        winningCartelaNumber: winningCartelaId,
        winningLine,
        winnerName: 'እርስዎ (You)',
        coWinners: coWinnersList,
        totalPot: prizePool,
        userShare
      });
    } else {
      soundEngine.playPop();
      showToast('⚠️ Pattern not complete yet! Keep daubing!');
    }
  };

  // Close Win Modal & Restart Lobby
  const closeWinModalAndRestart = () => {
    setShowWinModal(false);
    setHasTicket(false);
    hasTicketRef.current = false;
    // Rotate / refresh Cartela IDs for next round
    setSelectedCartelaIds([
      Math.floor(1 + Math.random() * 120),
      Math.floor(121 + Math.random() * 140),
      Math.floor(261 + Math.random() * 135)
    ]);
    startLobbyCountdown();
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
