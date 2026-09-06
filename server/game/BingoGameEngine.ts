import { io } from '../server.ts';
import { query, withTransaction } from '../db.ts';
import {
  BingoCell,
  generateCardFromId,
  checkWinningPattern,
  getBallColumn,
  generateRandomShuffledBalls
} from './cartelaGenerator.ts';

export interface PlayerTicket {
  userId: string;
  userName: string;
  cartelaId: number;
  cardMatrix: BingoCell[];
  betAmount: number;
  socketId: string;
  isBonus?: boolean;
}

export interface OpponentCard {
  botUserId?: string;
  cartelaId: number;
  cardMatrix: BingoCell[];
  opponentName: string;
  stakeAmount: number;
  isHouseBot?: boolean;
}

export interface OfflineWinRecord {
  id: string;
  userId: string;
  userName: string;
  roomId: string;
  roundNumber: number;
  cartelaId: number;
  amount: number;
  referenceCode: string;
  timestamp: string;
  isOffline: boolean;
  acknowledged: boolean;
  winningPattern: string;
}

export interface GameRoomState {
  id: string;
  name: string;
  stakeAmount: number;
  commissionPercent: number;
  commissionEnabled: boolean;
  phase: 'lobby' | 'locked' | 'playing' | 'winner';
  lobbyCountdown: number;
  winnerCountdown: number;
  currentRoundId: string | null;
  roundNumber: number;
  drawnNumbers: number[];
  ballSequence: number[];
  currentCall: { num: number; col: string; index: number } | null;
  totalPot: number;
  winnerPayout: number;
  houseFee: number;
  tickets: Map<string, PlayerTicket[]>; // userId -> active tickets in current round
  nextRoundTickets: Map<string, PlayerTicket[]>; // userId -> queued tickets for Round N+1 (Anytime Pre-Betting)
  activeSockets: Set<string>;
  winResult: any | null;
  opponentCards: OpponentCard[];
  targetWinnerType: 'owner' | 'bot' | 'real';
  targetFinishBall?: number;
  waitingForPlayers: boolean;   // true when < 2 real users have tickets; countdown frozen
  realPlayerCount: number;      // live count of distinct real users with tickets
}

interface BotProfile {
  id: string;
  name: string;
  phone: string;
}

// 200+ Authentic Ethiopian Bot Names Roster
const ETHIOPIAN_FIRST_NAMES = [
  'Abebe', 'Almaz', 'Bekele', 'Chaltu', 'Dawit', 'Eleni', 'Fikru', 'Genet',
  'Haile', 'Hiwot', 'Kassahun', 'Lemlem', 'Mekonnen', 'Meseret', 'Natnael', 'Rahel',
  'Samuel', 'Selam', 'Tariku', 'Tigist', 'Yonas', 'Zenebech', 'Biruk', 'Desta',
  'Ermias', 'Fasika', 'Girma', 'Hanna', 'Kidus', 'Liya', 'Meron', 'Nebiyu',
  'Robel', 'Saron', 'Tewodros', 'Tsedey', 'Yared', 'Zelalem', 'Bilen', 'Danait',
  'Ephrem', 'Frehiwot', 'Getachew', 'Helen', 'Kalkidan', 'Mahlet', 'Muluken', 'Netsanet',
  'Ruth', 'Solomon', 'Tadesse', 'Tsion', 'Yohannes', 'Zerihun', 'Bethel', 'Daniel',
  'Eyob', 'Fitsum', 'Kaleb', 'Nardos', 'Sintayehu', 'Wondwossen', 'Birtukan', 'Abel'
];

const ETHIOPIAN_LAST_NAMES = [
  'Bikila', 'Tesfaye', 'Mengistu', 'Worku', 'Tadesse', 'Gebre', 'Alemu', 'Kassa',
  'Assefa', 'Desta', 'Girma', 'Haile', 'Kebede', 'Melaku', 'Negash', 'Tilahun',
  'Wolde', 'Yilma', 'Zewde', 'Ayele', 'Berhanu', 'Demissie', 'Fekadu', 'Getahun'
];

function generate200BotNames(): string[] {
  const names: string[] = [];
  for (const fn of ETHIOPIAN_FIRST_NAMES) {
    for (const ln of ETHIOPIAN_LAST_NAMES) {
      names.push(`${fn} ${ln}`);
      if (names.length >= 260) break;
    }
    if (names.length >= 260) break;
  }
  return names;
}

const GLOBAL_BOT_POOL = generate200BotNames();

// Fisher-Yates True Random Shuffle
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Realistic Bot Multi-Stake Distribution
function getRandomBotStake(): number {
  const rand = Math.random() * 100;
  if (rand < 50) return 10;   // 50% bet 10 ETB
  if (rand < 75) return 20;   // 25% bet 20 ETB
  if (rand < 90) return 50;   // 15% bet 50 ETB
  return 100;                 // 10% bet 100 ETB
}

export const ARENA_ROOM_ID = 'lomi-arena';
export const ROOM_ALIASES = ['lomi-arena', 'room-10', 'room-20', 'room-50', 'room-100', 'default'];

class BingoGameEngine {
  private static instance: BingoGameEngine;
  private rooms: Map<string, GameRoomState> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  // Cached 200 Persistent Bot Profiles from Neon PostgreSQL
  private botAccounts: BotProfile[] = [];

  // Configurable Win Allocation Rates (Client Rule: 20% Owner, 30% Fake Bot, 50% Real Player)
  private ownerWinRate: number = 20;
  private botWinRate: number = 30;
  private realPlayerWinRate: number = 50;

  // Dynamic Room Capacity (Default 50, adjustable by Admin)
  private roomCapacity: number = 50;

  // Disconnect Protection: Rolling ledger of auto-credited wins
  private offlineWins: OfflineWinRecord[] = [];

  // Victory Processing Concurrency Guard (prevents double-spend on simultaneous BINGO claims)
  private isProcessingVictory: boolean = false;

  private constructor() {
    this.initializeUnifiedArena();
    this.loadBotAccounts();
  }

  public static getInstance(): BingoGameEngine {
    if (!BingoGameEngine.instance) {
      BingoGameEngine.instance = new BingoGameEngine();
    }
    return BingoGameEngine.instance;
  }

  public getFairnessConfig() {
    return {
      ownerWinRate: this.ownerWinRate,
      botWinRate: this.botWinRate,
      realPlayerWinRate: Math.max(0, 100 - this.ownerWinRate - this.botWinRate),
      roomCapacity: this.roomCapacity,
      commissionPercent: 10
    };
  }

  public setFairnessConfig(cfg: { ownerWinRate?: number; botWinRate?: number; roomCapacity?: number }) {
    if (typeof cfg.ownerWinRate === 'number') this.ownerWinRate = Math.max(0, Math.min(100, cfg.ownerWinRate));
    if (typeof cfg.botWinRate === 'number') this.botWinRate = Math.max(0, Math.min(100, cfg.botWinRate));
    if (typeof cfg.roomCapacity === 'number') this.roomCapacity = Math.max(10, Math.min(200, cfg.roomCapacity));
    this.realPlayerWinRate = Math.max(0, 100 - this.ownerWinRate - this.botWinRate);
  }

  /**
   * Loads the 200 persistent bot accounts from Neon DB
   */
  public async loadBotAccounts() {
    try {
      const res = await query(
        'SELECT id, full_name as name, phone FROM users WHERE is_bot = true ORDER BY created_at ASC'
      );
      if (res.rows.length > 0) {
        this.botAccounts = res.rows.map(r => ({
          id: r.id,
          name: r.name,
          phone: r.phone
        }));
        console.log(`🤖 [BingoGameEngine] Loaded ${this.botAccounts.length} real bot accounts from Neon DB`);
      }
    } catch (err) {
      console.error('⚠️ [BingoGameEngine] Error loading bot accounts from DB:', err);
    }
  }

  /**
   * Initializes the Single Authoritative Arena Room (Model A).
   * All stake requests (10, 20, 50, 100 ETB) play in the exact same room
   * so all devices are 100% in sync with identical balls and timers.
   */
  private initializeUnifiedArena() {
    const arenaState: GameRoomState = {
      id: ARENA_ROOM_ID,
      name: 'Lomi Unified Arena',
      stakeAmount: 10.0,
      commissionPercent: 10.0,
      commissionEnabled: true,
      phase: 'lobby',
      lobbyCountdown: 45,
      winnerCountdown: 8,
      currentRoundId: null,
      roundNumber: 1,
      drawnNumbers: [],
      ballSequence: [],
      currentCall: null,
      totalPot: 500,
      winnerPayout: 450,
      houseFee: 50,
      tickets: new Map(),
      nextRoundTickets: new Map(),
      activeSockets: new Set(),
      winResult: null,
      opponentCards: [],
      targetWinnerType: 'real',
      targetFinishBall: 15,
      waitingForPlayers: true,
      realPlayerCount: 0
    };

    // Store under primary arena ID
    this.rooms.set(ARENA_ROOM_ID, arenaState);

    // Alias all legacy room IDs to the exact same room instance
    for (const alias of ROOM_ALIASES) {
      this.rooms.set(alias, arenaState);
    }

    this.startLobbyTimer(ARENA_ROOM_ID);
  }

  public getRoom(_roomId?: string): GameRoomState {
    // Every query returns the authoritative unified arena
    return this.rooms.get(ARENA_ROOM_ID)!;
  }

  public getAllRooms() {
    const arena = this.rooms.get(ARENA_ROOM_ID)!;
    const playersCount = this.getRoomPlayersCount(arena);

    // Provide unified status across all aliases so any legacy client stays in sync
    return [
      {
        id: 'lomi-arena',
        name: 'Lomi Unified Arena',
        stakeAmount: 10.0,
        phase: arena.phase,
        lobbyCountdown: arena.lobbyCountdown,
        playersCount,
        totalPot: arena.totalPot,
        winnerPayout: arena.winnerPayout
      },
      {
        id: 'room-10',
        name: '10 Birr Room',
        stakeAmount: 10.0,
        phase: arena.phase,
        lobbyCountdown: arena.lobbyCountdown,
        playersCount,
        totalPot: 500,
        winnerPayout: 450
      },
      {
        id: 'room-20',
        name: '20 Birr Room',
        stakeAmount: 20.0,
        phase: arena.phase,
        lobbyCountdown: arena.lobbyCountdown,
        playersCount,
        totalPot: 1000,
        winnerPayout: 900
      },
      {
        id: 'room-50',
        name: '50 Birr Room',
        stakeAmount: 50.0,
        phase: arena.phase,
        lobbyCountdown: arena.lobbyCountdown,
        playersCount,
        totalPot: 2500,
        winnerPayout: 2250
      },
      {
        id: 'room-100',
        name: '100 Birr VIP Room',
        stakeAmount: 100.0,
        phase: arena.phase,
        lobbyCountdown: arena.lobbyCountdown,
        playersCount,
        totalPot: 5000,
        winnerPayout: 4500
      }
    ];
  }

  public getRoomPlayersCount(room: GameRoomState): number {
    if (room.phase === 'playing' || room.phase === 'locked') {
      return 50; // Dynamic 50-Player Room Cap: strictly 50 players in action
    }
    // During 45s lobby, density builds up towards 50
    const progress = Math.max(0, Math.min(1, (45 - room.lobbyCountdown) / 45));
    const dynamicBots = Math.floor(38 + progress * 11);
    const realTickets = room.tickets.size;
    return Math.min(50, Math.max(realTickets, dynamicBots));
  }

  // Admin Controls: System Lock (House Commission)
  public setHouseCommission(enabled: boolean, rate?: number) {
    const arena = this.rooms.get(ARENA_ROOM_ID)!;
    arena.commissionEnabled = enabled;
    if (typeof rate === 'number') {
      arena.commissionPercent = rate;
    }
    this.recalculatePot(arena);
    this.broadcastRoomState(arena);
  }

  // Admin Controls: Win Distribution Rates
  public setWinRates(ownerRate: number, botRate: number, realRate: number) {
    this.ownerWinRate = ownerRate;
    this.botWinRate = botRate;
    this.realPlayerWinRate = realRate;
  }

  public handleJoinRoom(socketId: string, _roomId: string, _userId?: string) {
    const arena = this.rooms.get(ARENA_ROOM_ID)!;
    arena.activeSockets.add(socketId);
    this.broadcastRoomState(arena);
  }

  public handleLeaveRoom(socketId: string, _roomId: string) {
    const arena = this.rooms.get(ARENA_ROOM_ID)!;
    arena.activeSockets.delete(socketId);
    this.broadcastRoomState(arena);
  }

  /**
   * 100% System-Assigned Ticket Purchase with Anytime Pre-Betting
   * Players can choose 1 or 2 cartelas. If 2 cartelas, 3rd is FREE!
   * If purchased while a round is actively playing, ticket is queued in `nextRoundTickets`
   * and automatically activated for Round #N+1 when the lobby begins.
   */
  public async handleBuyTicket(
    userId: string,
    userName: string,
    _roomId: string,
    requestedCartelaIds: number[] | number,
    socketId: string,
    customStake?: number
  ): Promise<{
    success: boolean;
    error?: string;
    tickets?: PlayerTicket[];
    remainingBalance?: number;
    preBoughtForNextRound?: boolean;
  }> {
    const room = this.rooms.get(ARENA_ROOM_ID)!;

    // Model A: Support individual ticket stake levels (10, 20, 50, 100 ETB)
    const validStakes = [10, 20, 50, 100];
    const stakePerCard = customStake && validStakes.includes(Number(customStake))
      ? Number(customStake)
      : room.stakeAmount;

    // Determine quantity requested (1 or 2 cards)
    let quantity = 1;
    if (Array.isArray(requestedCartelaIds)) {
      quantity = Math.max(1, Math.min(2, requestedCartelaIds.length));
    } else if (typeof requestedCartelaIds === 'number') {
      quantity = Math.max(1, Math.min(2, requestedCartelaIds));
    }

    // Multi-Device Protection: If user already has active tickets for this round, return existing tickets without deducting balance again
    if (room.phase === 'lobby' && room.tickets.has(userId) && (room.tickets.get(userId)?.length || 0) > 0) {
      const existing = room.tickets.get(userId)!;
      console.log(`🎟️ [Multi-Device] User ${userName} (${userId}) already has ${existing.length} tickets for Round #${room.roundNumber}. Returning active cards.`);
      return {
        success: true,
        preBoughtForNextRound: false,
        tickets: existing
      };
    }

    const totalCost = quantity * stakePerCard;

    // Collect already assigned Cartela IDs in this room to ensure unique cards
    const assignedIds = new Set<number>();
    room.tickets.forEach(list => list.forEach(t => assignedIds.add(t.cartelaId)));
    if (room.nextRoundTickets) {
      room.nextRoundTickets.forEach(list => list.forEach(t => assignedIds.add(t.cartelaId)));
    }

    // System draws random unique Cartela numbers from 1 to 400
    const drawnIds: number[] = [];
    const getNextUniqueCartelaId = (): number => {
      let attempts = 0;
      while (attempts < 1000) {
        const id = Math.floor(1 + Math.random() * 400);
        if (!assignedIds.has(id) && !drawnIds.includes(id)) {
          return id;
        }
        attempts++;
      }
      return Math.floor(1 + Math.random() * 400);
    };

    // Card 1
    drawnIds.push(getNextUniqueCartelaId());

    // If quantity is 2: draw Card 2 + 1 FREE Bonus Card (Buy 2 Get 1 Free Promo)
    if (quantity === 2) {
      drawnIds.push(getNextUniqueCartelaId());
      drawnIds.push(getNextUniqueCartelaId()); // Card 3 (Bonus)
    }

    try {
      // Deduct balance atomically from Neon DB
      const result = await withTransaction(async (client) => {
        const walletRes = await client.query(
          'SELECT balance, bonus FROM wallets WHERE user_id = $1 FOR UPDATE',
          [userId]
        );

        if (walletRes.rows.length === 0) {
          throw new Error('Wallet not found');
        }

        const realBal = parseFloat(walletRes.rows[0].balance || '0');
        const bonusBal = parseFloat(walletRes.rows[0].bonus || '0');
        const totalFunds = realBal + bonusBal;

        if (totalFunds < totalCost) {
          throw new Error(`Insufficient funds (${totalFunds.toFixed(2)} ETB). Need ${totalCost.toFixed(2)} ETB.`);
        }

        const deductFromBonus = Math.min(bonusBal, totalCost);
        const deductFromReal = totalCost - deductFromBonus;

        const newReal = realBal - deductFromReal;
        const newBonus = bonusBal - deductFromBonus;

        await client.query(
          'UPDATE wallets SET balance = $1, bonus = $2, updated_at = NOW() WHERE user_id = $3',
          [newReal, newBonus, userId]
        );

        const refCode = `BET-ARENA-${Date.now().toString().slice(-6)}`;
        await client.query(
          `INSERT INTO wallet_transactions (user_id, type, amount, balance_after, reference_code, status, description)
           VALUES ($1, 'bet', $2, $3, $4, 'completed', $5)`,
          [userId, totalCost, newReal + newBonus, refCode, `Purchased ${drawnIds.length} cartelas in Lomi Bingo Arena`]
        );

        return { newReal, newBonus };
      });

      // Balance broadcast to user
      io.emit(`user_${userId}_balance`, {
        type: 'ticket_purchased',
        balance: result.newReal,
        bonus: result.newBonus,
        newBalance: result.newReal
      });

      io.emit('user_balance_updated', {
        userId,
        newBalance: result.newReal,
        balance: result.newReal,
        bonus: result.newBonus
      });

      // Register tickets in memory
      const playerTickets: PlayerTicket[] = drawnIds.map((id, idx) => ({
        userId,
        userName,
        cartelaId: id,
        cardMatrix: generateCardFromId(id),
        betAmount: idx === 2 ? 0 : stakePerCard, // 3rd card is FREE bonus
        socketId,
        isBonus: idx === 2
      }));

      const isPreBuy = room.phase !== 'lobby';

      if (isPreBuy) {
        // Queue for next round (Anytime Pre-Betting)
        const existingQueued = room.nextRoundTickets.get(userId) || [];
        room.nextRoundTickets.set(userId, [...existingQueued, ...playerTickets]);
        console.log(`🎟️ [Pre-Betting] User ${userName} (${userId}) queued ${playerTickets.length} cartelas for Round #${room.roundNumber + 1}`);
      } else {
        // Immediately active in current lobby
        room.tickets.set(userId, playerTickets);
        this.recalculatePot(room);
        this.broadcastRoomState(room);

        // Notify all clients a new real player joined (for lobby join feed UI)
        for (const rid of ROOM_ALIASES) {
          io.to(rid).emit('player_joined', {
            userName,
            realPlayerCount: room.tickets.size,
            waitingForPlayers: room.tickets.size < 2,
            countdownStarted: room.tickets.size >= 2
          });
        }
      }

      return {
        success: true,
        preBoughtForNextRound: isPreBuy,
        tickets: playerTickets,
        remainingBalance: result.newReal + result.newBonus
      };
    } catch (error: any) {
      return { success: false, error: error.message || 'Ticket purchase failed' };
    }
  }

  // Recalculates pot from actual bets placed + sliding commission tiers
  private recalculatePot(room: GameRoomState) {
    const R = room.tickets.size; // distinct real users with tickets

    // Commission tier based on real player count
    if (R <= 5) {
      room.commissionEnabled = false;
      room.commissionPercent = 0;
    } else {
      room.commissionEnabled = true;
      room.commissionPercent = 20;
    }

    // Sum all actual bets placed by real players + bots (if any)
    let pot = 0;
    room.tickets.forEach(list => list.forEach(t => { pot += t.betAmount; }));
    room.opponentCards.forEach(o => { pot += o.stakeAmount; });

    room.totalPot = pot > 0 ? pot : 0;
    room.houseFee = room.commissionEnabled ? Math.floor(room.totalPot * 0.20) : 0;
    room.winnerPayout = room.totalPot - room.houseFee;
  }

  /**
   * 45-Second Gap Between Games (Lobby Timer)
   */
  private startLobbyTimer(_roomId?: string) {
    const room = this.rooms.get(ARENA_ROOM_ID)!;

    this.isProcessingVictory = false; // Reset victory lock for new round
    room.phase = 'lobby';
    room.lobbyCountdown = 45; // Authoritative 45-second gap
    room.drawnNumbers = [];
    room.currentCall = null;
    room.winResult = null;

    // Seamless Activation of Anytime Pre-Bought Tickets
    if (room.nextRoundTickets && room.nextRoundTickets.size > 0) {
      room.tickets = new Map(room.nextRoundTickets);
      room.nextRoundTickets.clear();
      console.log(`🎟️ [Lobby] Activated pre-bought tickets for ${room.tickets.size} users for Round #${room.roundNumber}`);
      for (const rid of ROOM_ALIASES) {
        io.to(rid).emit('prebought_tickets_activated', {
          roundNumber: room.roundNumber,
          activeTicketsCount: room.tickets.size
        });
      }
    } else {
      room.tickets.clear();
    }

    this.recalculatePot(room);

    if (this.intervals.has(ARENA_ROOM_ID)) {
      clearInterval(this.intervals.get(ARENA_ROOM_ID)!);
    }

    const interval = setInterval(async () => {
      if (room.phase !== 'lobby') {
        clearInterval(interval);
        return;
      }

      // FREEZE countdown until at least 2 real players have tickets
      const realUserCount = room.tickets.size;
      room.realPlayerCount = realUserCount;

      if (realUserCount < 2) {
        room.waitingForPlayers = true;
        room.lobbyCountdown = 45; // keep frozen at 45 — do not decrement
        this.broadcastRoomState(room);
        return;
      }

      // 2+ players joined — countdown runs normally
      room.waitingForPlayers = false;
      room.lobbyCountdown -= 1;
      this.broadcastRoomState(room);

      if (room.lobbyCountdown <= 0) {
        clearInterval(interval);
        await this.startRound(ARENA_ROOM_ID);
      }
    }, 1000);

    this.intervals.set(ARENA_ROOM_ID, interval);
  }

  /**
   * Start Dynamic 50-Player Live Round with Bot Backfilling (B = max(0, 50 - R))
   */
  private async startRound(_roomId?: string) {
    const room = this.rooms.get(ARENA_ROOM_ID)!;

    room.phase = 'locked';
    this.recalculatePot(room);
    this.broadcastRoomState(room);

    // 1. Count Real Player Tickets
    let realTicketsCount = 0;
    const assignedIds = new Set<number>();
    room.tickets.forEach(list => {
      realTicketsCount += list.length;
      list.forEach(t => assignedIds.add(t.cartelaId));
    });

    // 2. New Rule: Inject exactly 3 bots ONLY when 11+ real players; otherwise no bots
    const realUserCount = room.tickets.size; // distinct real users
    room.opponentCards = [];

    if (realUserCount >= 11) {
      if (this.botAccounts.length === 0) {
        await this.loadBotAccounts();
      }

      // Sample bot pool
      const botPool = this.botAccounts.length > 0
        ? shuffleArray(this.botAccounts)
        : shuffleArray(GLOBAL_BOT_POOL.map((name, i) => ({
            id: `bot_legacy_${i}`,
            name,
            phone: `09${10000000 + i}`
          })));

      // Add exactly 3 bots — always, regardless of how many real players (11, 50, 100...)
      for (let i = 0; i < 3; i++) {
        let botCartelaId = Math.floor(1 + Math.random() * 400);
        while (assignedIds.has(botCartelaId)) {
          botCartelaId = Math.floor(1 + Math.random() * 400);
        }
        assignedIds.add(botCartelaId);

        const botProfile = botPool[i % botPool.length];
        room.opponentCards.push({
          botUserId: botProfile.id,
          cartelaId: botCartelaId,
          cardMatrix: generateCardFromId(botCartelaId),
          opponentName: botProfile.name,
          stakeAmount: room.stakeAmount, // bots bet same as room stake
          isHouseBot: i === 0
        });
      }
    }

    // 3. Win routing: bots win 20% only when 11+ real players; real player wins otherwise
    if (room.opponentCards.length > 0) {
      // 11+ players: 20% collective bot win probability
      room.targetWinnerType = Math.random() < 0.20 ? 'bot' : 'real';
    } else {
      // 2–10 players: real player always wins (no bots in the game)
      room.targetWinnerType = 'real';
    }

    // 4. Save Round to Neon PostgreSQL
    try {
      const roundRes = await query(
        `INSERT INTO game_rounds (room_id, round_number, phase, total_pot, platform_fee, winner_payout, started_at)
         VALUES ($1, $2, 'playing', $3, $4, $5, NOW())
         RETURNING id`,
        [room.id, room.roundNumber, room.totalPot, room.houseFee, room.winnerPayout]
      );
      room.currentRoundId = roundRes.rows[0]?.id;

      // Save purchased tickets to Neon DB
      for (const [userId, tList] of room.tickets.entries()) {
        for (const t of tList) {
          await query(
            `INSERT INTO game_tickets (round_id, user_id, cartela_id, card_matrix, bet_amount, status)
             VALUES ($1, $2, $3, $4, $5, 'active')`,
            [room.currentRoundId, userId, t.cartelaId, JSON.stringify(t.cardMatrix), t.betAmount]
          );
        }
      }
    } catch (err) {
      console.error('❌ [GameEngine Error saving round to DB]:', err);
    }

    // 5. Generate Shuffled 1-75 Balls with Natural Win Steering
    room.ballSequence = this.prepareBallSequence(room);
    room.drawnNumbers = [];
    room.phase = 'playing';

    // Broadcast Round Started to all alias rooms
    for (const rid of ROOM_ALIASES) {
      io.to(rid).emit('round_started', {
        roundId: room.currentRoundId,
        roundNumber: room.roundNumber,
        totalPot: room.totalPot,
        winnerPayout: room.winnerPayout,
        playersCount: Math.min(roomCap, realTicketsCount + room.opponentCards.length)
      });
    }

    // Start 3.5s Ball Drawing Loop
    this.startBallCallingLoop(ARENA_ROOM_ID);
  }

  /**
   * Computes evenly spaced insertion positions ending precisely at finishIndex.
   * Guarantees target line completes on exact finishIndex without duplicate indices.
   */
  private getInsertPositions(count: number, finishIndex: number): number[] {
    const positions: number[] = [];
    const step = finishIndex / count;
    for (let i = 1; i < count; i++) {
      positions.push(Math.round(i * step));
    }
    positions.push(finishIndex);
    return positions;
  }

  /**
   * Prepares 75-Ball sequence with Dynamic Cadence completing between Ball 15 and 18.
   * Eliminates predictability while guaranteeing target category (Real Player 50%, Bot 30%, Owner 20%)
   * completes reliably without early bot interception.
   */
  private prepareBallSequence(room: GameRoomState): number[] {
    const baseBalls = generateRandomShuffledBalls();

    let targetCardMatrix: BingoCell[] | null = null;
    if (room.targetWinnerType === 'real' && room.tickets.size > 0) {
      const allRealTickets: PlayerTicket[] = [];
      room.tickets.forEach(list => allRealTickets.push(...list));
      if (allRealTickets.length > 0) {
        const chosenRealTicket = allRealTickets[Math.floor(Math.random() * allRealTickets.length)];
        targetCardMatrix = chosenRealTicket.cardMatrix;
      }
    } else if (room.opponentCards.length > 0) {
      if (room.targetWinnerType === 'owner') {
        // Owner victory: Target designated House Bot (isHouseBot: true)
        const houseBot = room.opponentCards.find(o => o.isHouseBot) || room.opponentCards[0];
        targetCardMatrix = houseBot.cardMatrix;
      } else {
        // Fake Bot victory: Pick a random non-house bot to build community trust
        const nonHouseBots = room.opponentCards.filter(o => !o.isHouseBot);
        const pool = nonHouseBots.length > 0 ? nonHouseBots : room.opponentCards;
        const randomOpponent = pool[Math.floor(Math.random() * pool.length)];
        targetCardMatrix = randomOpponent.cardMatrix;
      }
    }

    if (!targetCardMatrix) {
      room.targetFinishBall = 15;
      return baseBalls;
    }

    // Pick winning line on target card (e.g. Row 1 or Column B or Diagonal)
    const winningPatternsIndices = [
      [0, 1, 2, 3, 4],       // Row 1
      [5, 6, 7, 8, 9],       // Row 2
      [0, 5, 10, 15, 20],    // Column B
      [0, 6, 12, 18, 24]     // Diagonal
    ];
    const chosenPattern = winningPatternsIndices[Math.floor(Math.random() * winningPatternsIndices.length)];
    const targetNumbers = chosenPattern
      .map(idx => targetCardMatrix![idx]?.val)
      .filter((v): v is number => typeof v === 'number');

    // Dynamically pick round completion ball: Ball 15, 16, 17, or 18
    const targetFinishBall = 15 + Math.floor(Math.random() * 4); // 15, 16, 17, or 18
    room.targetFinishBall = targetFinishBall;
    const finishIndex = targetFinishBall - 1; // 14, 15, 16, or 17

    console.log(`🎯 [GameEngine] Round #${room.roundNumber} targeting ${room.targetWinnerType.toUpperCase()} win on Ball #${targetFinishBall}`);

    const otherBalls = baseBalls.filter(b => !targetNumbers.includes(b));
    const finalSequence: number[] = [];

    // Distribute target numbers smoothly up to finishIndex
    const insertPositions = this.getInsertPositions(targetNumbers.length, finishIndex);
    for (let i = 0; i < 75; i++) {
      if (insertPositions.includes(i) && targetNumbers.length > 0) {
        finalSequence.push(targetNumbers.shift()!);
      } else if (otherBalls.length > 0) {
        finalSequence.push(otherBalls.shift()!);
      }
    }

    // Return reversed array since Array.pop() draws from the end
    return finalSequence.reverse();
  }

  /**
   * 3.5s Ball Drawing Loop with Authoritative Split Pot Tie Evaluation
   */
  private startBallCallingLoop(_roomId?: string) {
    const room = this.rooms.get(ARENA_ROOM_ID)!;

    if (this.intervals.has(ARENA_ROOM_ID)) {
      clearInterval(this.intervals.get(ARENA_ROOM_ID)!);
    }

    const interval = setInterval(async () => {
      if (room.phase !== 'playing') {
        clearInterval(interval);
        return;
      }

      if (room.ballSequence.length === 0) {
        clearInterval(interval);
        this.finishRoundWithoutWinner(ARENA_ROOM_ID);
        return;
      }

      const nextNum = room.ballSequence.pop()!;
      room.drawnNumbers.push(nextNum);
      const col = getBallColumn(nextNum);

      room.currentCall = {
        num: nextNum,
        col,
        index: room.drawnNumbers.length
      };

      // Broadcast Ball Called to all alias rooms simultaneously
      for (const rid of ROOM_ALIASES) {
        io.to(rid).emit('ball_called', {
          currentCall: room.currentCall,
          drawnNumbers: room.drawnNumbers,
          totalCalled: room.drawnNumbers.length
        });
      }

      // Evaluate Winning Patterns on each ball drawn once round target finish ball is reached
      const evalThreshold = room.targetFinishBall || 15;
      if (room.drawnNumbers.length >= evalThreshold) {
        const winningCards: Array<{
          userId?: string;
          userName: string;
          cartelaId: number;
          isReal: boolean;
          winningPattern: string;
          winningIndices: number[];
        }> = [];

        // Check all Real Player tickets
        for (const [uid, tList] of room.tickets.entries()) {
          for (const t of tList) {
            const winCheck = checkWinningPattern(t.cardMatrix, room.drawnNumbers);
            if (winCheck.isWin) {
              winningCards.push({
                userId: uid,
                userName: t.userName,
                cartelaId: t.cartelaId,
                isReal: true,
                winningPattern: winCheck.winningPattern || 'Bingo Line',
                winningIndices: winCheck.winningIndices || []
              });
            }
          }
        }

        // Check all Bot Opponent cards
        for (const opp of room.opponentCards) {
          const winCheck = checkWinningPattern(opp.cardMatrix, room.drawnNumbers);
          if (winCheck.isWin) {
            winningCards.push({
              userName: opp.opponentName,
              cartelaId: opp.cartelaId,
              isReal: false,
              winningPattern: winCheck.winningPattern || 'Bingo Line',
              winningIndices: winCheck.winningIndices || []
            });
          }
        }

        // Winner or Split Pot Detected!
        if (winningCards.length > 0) {
          clearInterval(interval);
          await this.processRoundVictory(room, winningCards);
          return;
        }
      }
    }, 3500);

    this.intervals.set(ARENA_ROOM_ID, interval);
  }

  /**
   * Process Round Victory & Real Database Ledger Credits for Players & Bots
   */
  private async processRoundVictory(
    room: GameRoomState,
    winningCards: Array<{
      userId?: string;
      userName: string;
      cartelaId: number;
      isReal: boolean;
      winningPattern: string;
      winningIndices: number[];
    }>
  ) {
    if (this.isProcessingVictory) {
      console.warn('⚠️ [GameEngine] Victory processing already in progress. Ignoring concurrent claim.');
      return;
    }
    this.isProcessingVictory = true;
    room.phase = 'winner';
    const totalWinningCards = winningCards.length;
    const realWinners = winningCards.filter(w => w.isReal);
    const botWinners = winningCards.filter(w => !w.isReal);

    // Group winning cards by unique entity: real users by userId, bots by opponent ID
    const distinctEntities = new Set(winningCards.map(w => w.isReal ? `real_${w.userId}` : `bot_${w.cartelaId}`));
    const isSplit = distinctEntities.size > 1;

    // Group real winning cards by userId
    const realWinnersByUser = new Map<string, typeof realWinners>();
    for (const rw of realWinners) {
      if (!rw.userId) continue;
      const list = realWinnersByUser.get(rw.userId) || [];
      list.push(rw);
      realWinnersByUser.set(rw.userId, list);
    }

    let primaryUserPayout = 0;
    let displayWinnerPayout = 450;

    // 1. Credit all winning real players atomically via Neon PostgreSQL
    if (realWinnersByUser.size > 0) {
      try {
        await withTransaction(async (client) => {
          for (const [userId, userWinningCards] of realWinnersByUser.entries()) {
            const userTickets = room.tickets.get(userId) || [];

            // Calculate total payout for this user:
            // Each winning card gets (ticketStake * 45) / totalWinningCards.
            // If all winning cards belong to this user (e.g. 2 cards), user receives 2 * 225 = 450 ETB (100% Solo Win)!
            const userTotalWin = userWinningCards.reduce((sum, rw) => {
              const matchingTicket = userTickets.find(t => t.cartelaId === rw.cartelaId);
              const ticketStake = matchingTicket && matchingTicket.betAmount > 0
                ? matchingTicket.betAmount
                : (userTickets[0]?.betAmount > 0 ? userTickets[0].betAmount : room.stakeAmount);

              const perCardPayout = Math.floor((ticketStake * 45) / totalWinningCards);
              return sum + perCardPayout;
            }, 0);

            primaryUserPayout = userTotalWin;
            displayWinnerPayout = userTotalWin;

            const walletRes = await client.query(
              'SELECT balance FROM wallets WHERE user_id = $1 FOR UPDATE',
              [userId]
            );

            if (walletRes.rows.length > 0) {
              const currentBal = parseFloat(walletRes.rows[0].balance || '0');
              const newBal = currentBal + userTotalWin;

              await client.query(
                'UPDATE wallets SET balance = $1, updated_at = NOW() WHERE user_id = $2',
                [newBal, userId]
              );

              const isSocketConnected = userTickets.some(t => room.activeSockets.has(t.socketId));
              const winRef = `WIN-ARENA-${Date.now().toString().slice(-6)}`;
              const winningCardIds = userWinningCards.map(w => `#${w.cartelaId}`).join(', ');
              const firstTicket = userTickets.find(t => t.cartelaId === userWinningCards[0].cartelaId);
              const ticketStake = firstTicket?.betAmount || room.stakeAmount;

              const description = isSplit
                ? `Split Pot Winner (${userWinningCards.length} of ${totalWinningCards} cards, ${ticketStake} ETB Stake) in ${room.name} (Cartela ${winningCardIds})${!isSocketConnected ? ' [Protected Offline Auto-Claim]' : ''}`
                : `Bingo Solo Winner (${ticketStake} ETB Stake) in ${room.name} (Cartela ${winningCardIds})${!isSocketConnected ? ' [Protected Offline Auto-Claim]' : ''}`;

              await client.query(
                `INSERT INTO wallet_transactions (user_id, type, amount, balance_after, reference_code, status, payment_method, description)
                 VALUES ($1, 'win', $2, $3, $4, 'completed', 'in_game', $5)`,
                [userId, userTotalWin, newBal, winRef, description]
              );

              // Disconnect Protection: Record in authoritative offline/online ledger
              const winRecord: OfflineWinRecord = {
                id: `WINREC-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
                userId,
                userName: userWinningCards[0].userName,
                roomId: room.id,
                roundNumber: room.roundNumber,
                cartelaId: userWinningCards[0].cartelaId,
                amount: userTotalWin,
                referenceCode: winRef,
                timestamp: new Date().toISOString(),
                isOffline: !isSocketConnected,
                acknowledged: false,
                winningPattern: userWinningCards[0].winningPattern
              };
              this.offlineWins.unshift(winRecord);
              if (this.offlineWins.length > 200) this.offlineWins.pop();

              io.emit('offline_win_recorded', winRecord);
              io.emit(`user_${userId}_balance`, {
                type: 'bingo_win',
                amount: userTotalWin,
                newBalance: newBal
              });
              io.emit('user_balance_updated', {
                userId,
                type: 'bingo_win',
                amount: userTotalWin,
                newBalance: newBal,
                balance: newBal
              });
            }
          }

          if (room.currentRoundId) {
            await client.query(
              `UPDATE game_rounds 
               SET phase = 'ended', 
                   winner_user_ids = $1, 
                   winner_cartelas = $2, 
                   winner_names = $3, 
                   ended_at = NOW() 
               WHERE id = $4`,
              [
                JSON.stringify(Array.from(realWinnersByUser.keys())),
                JSON.stringify(winningCards.map(w => w.cartelaId)),
                JSON.stringify(winningCards.map(w => w.userName)),
                room.currentRoundId
              ]
            );
          }
        });
      } catch (err) {
        console.error('❌ [GameEngine Error processing winning payout]:', err);
      }
    }

    // 2. Process Bot Victory: Real Ledger Credit in Neon DB
    if (botWinners.length > 0 && realWinners.length === 0) {
      try {
        for (const bw of botWinners) {
          const matchingOpp = room.opponentCards.find(o => o.cartelaId === bw.cartelaId);
          const botStake = matchingOpp?.stakeAmount || 10;
          const botPayout = Math.floor((botStake * 45) / totalWinningCards);
          displayWinnerPayout = botPayout;

          if (matchingOpp?.botUserId && !matchingOpp.botUserId.startsWith('bot_legacy_')) {
            // Deposit real 45x winnings into the bot's Neon DB wallet!
            await query(
              'UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE user_id = $2',
              [botPayout, matchingOpp.botUserId]
            );

            const botWinRef = `BOT-WIN-${Date.now().toString().slice(-6)}`;
            await query(
              `INSERT INTO wallet_transactions (user_id, type, amount, balance_after, reference_code, status, payment_method, description)
               VALUES ($1, 'win', $2, (SELECT balance FROM wallets WHERE user_id = $1), $3, 'completed', 'in_game', $4)`,
              [
                matchingOpp.botUserId,
                botPayout,
                botWinRef,
                isSplit
                  ? `Split Pot Winner (1 of ${totalWinningCards}, ${botStake} ETB Stake) in ${room.name} (Cartela #${bw.cartelaId})`
                  : `Bingo Solo Winner (${botStake} ETB Stake) in ${room.name} (Cartela #${bw.cartelaId})`
              ]
            );
          }
        }
      } catch (err) {
        console.error('❌ [GameEngine Error crediting bot win]:', err);
      }
    }

    const firstWinner = winningCards[0];
    const matchingOpp = room.opponentCards.find(o => o.cartelaId === firstWinner.cartelaId);
    const winnerStake = firstWinner.isReal
      ? (room.tickets.get(firstWinner.userId || '')?.[0]?.betAmount || 10)
      : (matchingOpp?.stakeAmount || 10);

    // List other external winner names, excluding the primary winner's own entity
    const primaryEntityId = firstWinner.isReal ? `real_${firstWinner.userId}` : `bot_${firstWinner.cartelaId}`;
    const externalCoWinners = Array.from(
      new Set(
        winningCards
          .filter(w => (w.isReal ? `real_${w.userId}` : `bot_${w.cartelaId}`) !== primaryEntityId)
          .map(w => w.userName)
      )
    );

    const winResult = {
      winType: isSplit
        ? (realWinners.length > 0 ? 'user_split' : 'opponent_win')
        : (firstWinner.isReal ? 'user_solo' : 'opponent_win'),
      winnerId: firstWinner.userId || matchingOpp?.botUserId || `bot_${firstWinner.cartelaId}`,
      winnerName: firstWinner.userName,
      winnerNames: Array.from(new Set(winningCards.map(w => w.userName))),
      winnerUserIds: Array.from(new Set(realWinners.map(rw => rw.userId))),
      winningCartelaNumber: firstWinner.cartelaId,
      winningCartelas: winningCards.map(w => w.cartelaId),
      winningPattern: firstWinner.winningPattern,
      winningIndices: firstWinner.winningIndices,
      totalPot: room.totalPot,
      winnerPayout: displayWinnerPayout, // Exact payout won
      stakeAmount: winnerStake,
      sharePerWinner: isSplit ? Math.floor((winnerStake * 45) / totalWinningCards) : displayWinnerPayout,
      userShare: primaryUserPayout,
      coWinners: isSplit ? externalCoWinners : [],
      isSplit,
      winnersCount: distinctEntities.size
    };

    room.winResult = winResult;

    // Broadcast round winner to all alias rooms simultaneously
    for (const rid of ROOM_ALIASES) {
      io.to(rid).emit('round_winner', winResult);
    }

    // 8-Second celebration before transitioning to next 45s lobby
    this.startWinnerCelebrationTimer(room.id);
  }

  /**
   * Player Claims Bingo Manually
   */
  public async handleClaimBingo(
    userId: string,
    userName: string,
    _roomId: string,
    cartelaId: number
  ): Promise<{ success: boolean; message: string; winResult?: any }> {
    const room = this.rooms.get(ARENA_ROOM_ID)!;
    if (!room || room.phase !== 'playing' || this.isProcessingVictory) {
      return { success: false, message: 'Game is not currently in playing phase or victory is already being processed.' };
    }

    const userTickets = room.tickets.get(userId) || [];
    const ticket = userTickets.find(t => t.cartelaId === cartelaId);
    const cardMatrix = ticket ? ticket.cardMatrix : generateCardFromId(cartelaId);

    const winCheck = checkWinningPattern(cardMatrix, room.drawnNumbers);
    if (!winCheck.isWin) {
      return {
        success: false,
        message: 'Invalid Bingo claim. Not all numbers in a winning line have been drawn yet.'
      };
    }

    if (this.intervals.has(ARENA_ROOM_ID)) {
      clearInterval(this.intervals.get(ARENA_ROOM_ID)!);
    }

    await this.processRoundVictory(room, [
      {
        userId,
        userName,
        cartelaId,
        isReal: true,
        winningPattern: winCheck.winningPattern || 'Bingo Line',
        winningIndices: winCheck.winningIndices || []
      }
    ]);

    return {
      success: true,
      message: 'BINGO VERIFIED! Congratulations!',
      winResult: room.winResult
    };
  }

  private finishRoundWithoutWinner(_roomId?: string) {
    const room = this.rooms.get(ARENA_ROOM_ID)!;
    room.phase = 'winner';
    for (const rid of ROOM_ALIASES) {
      io.to(rid).emit('round_ended_no_winner', { totalPot: room.totalPot });
    }
    this.startWinnerCelebrationTimer(ARENA_ROOM_ID);
  }

  private startWinnerCelebrationTimer(_roomId?: string) {
    const room = this.rooms.get(ARENA_ROOM_ID)!;

    room.winnerCountdown = 8;
    const interval = setInterval(() => {
      room.winnerCountdown -= 1;
      this.broadcastRoomState(room);

      if (room.winnerCountdown <= 0) {
        clearInterval(interval);
        room.roundNumber += 1;
        room.tickets.clear();
        this.startLobbyTimer(ARENA_ROOM_ID); // Transition to 45s lobby
      }
    }, 1000);
  }

  public broadcastRoomState(room: GameRoomState) {
    const payload = {
      roomId: room.id,
      phase: room.phase,
      roundNumber: room.roundNumber,
      lobbyCountdown: room.lobbyCountdown,
      winnerCountdown: room.winnerCountdown,
      playersCount: this.getRoomPlayersCount(room),
      totalPot: room.totalPot,
      winnerPayout: room.winnerPayout,
      stakeAmount: room.stakeAmount,
      drawnNumbers: room.drawnNumbers,
      drawnNumbersCount: room.drawnNumbers.length,
      currentCall: room.currentCall,
      winResult: room.winResult,
      waitingForPlayers: room.waitingForPlayers || false,
      realPlayerCount: room.tickets.size
    };

    for (const rid of ROOM_ALIASES) {
      io.to(rid).emit('room_state', { ...payload, roomId: rid });
    }
  }

  // Authoritative Disconnect Protection Helpers
  public getUnacknowledgedWins(userId: string): OfflineWinRecord[] {
    return this.offlineWins.filter(w => w.userId === userId && !w.acknowledged);
  }

  public acknowledgeOfflineWin(winId: string): boolean {
    const target = this.offlineWins.find(w => w.id === winId);
    if (target) {
      target.acknowledged = true;
      return true;
    }
    return false;
  }

  // Live Network Health & Diagnostics for Admin Desk
  public getNetworkMetrics() {
    const room = this.rooms.get(ARENA_ROOM_ID)!;
    const activeSocketsCount = room.activeSockets.size;

    return {
      totalActiveSockets: activeSocketsCount,
      engineStatus: 'healthy',
      disconnectProtectionActive: true,
      transportsSupported: ['WebSocket', 'HTTP Polling Fallback'],
      rooms: this.getAllRooms().map(r => ({
        ...r,
        activeSocketsCount,
        ticketsCount: room.tickets.size,
        drawnBallsCount: room.drawnNumbers.length
      })),
      totalOfflineWinsRecorded: this.offlineWins.length,
      recentOfflineWins: this.offlineWins.slice(0, 30),
      serverTimestamp: new Date().toISOString()
    };
  }
}

export const gameEngine = BingoGameEngine.getInstance();
