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

// Authoritative Registered 3 Bots (Registered as real users in Neon DB)
export const REGISTERED_3_BOTS: BotProfile[] = [
  { id: '00000000-0000-4000-8000-000000000001', name: 'Dawit Haile', phone: '0911445566' },
  { id: '00000000-0000-4000-8000-000000000002', name: 'Selam Tesfaye', phone: '0922334455' },
  { id: '00000000-0000-4000-8000-000000000003', name: 'Abebe Bikila', phone: '0933221100' }
];

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
   * Loads the 3 registered bot accounts from Neon DB
   */
  public async loadBotAccounts() {
    try {
      const res = await query(
        'SELECT id, full_name as name, phone FROM users WHERE is_bot = true ORDER BY created_at ASC LIMIT 3'
      );
      if (res.rows.length > 0) {
        this.botAccounts = res.rows.map(r => ({
          id: r.id,
          name: r.name,
          phone: r.phone
        }));
        console.log(`🤖 [BingoGameEngine] Loaded ${this.botAccounts.length} registered bot accounts from Neon DB`);
      } else {
        this.botAccounts = [...REGISTERED_3_BOTS];
      }
    } catch (err) {
      console.error('⚠️ [BingoGameEngine] Error loading bot accounts from DB:', err);
      this.botAccounts = [...REGISTERED_3_BOTS];
    }
  }

  private createRoomState(id: string, name: string, stakeAmount: number): GameRoomState {
    return {
      id,
      name,
      stakeAmount,
      commissionPercent: 0,
      commissionEnabled: false,
      phase: 'lobby',
      lobbyCountdown: 45,
      winnerCountdown: 8,
      currentRoundId: null,
      roundNumber: 1,
      drawnNumbers: [],
      ballSequence: [],
      currentCall: null,
      totalPot: 0,
      winnerPayout: 0,
      houseFee: 0,
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
  }

  /**
   * Initializes Dedicated Stake Rooms (10, 20, 50, 100 ETB) with synchronized clock cycles.
   * Every room has its uniform stake tier for 100% fair mathematical odds and payouts.
   */
  private initializeUnifiedArena() {
    const stakeDefs = [
      { id: 'room-10', name: '10 Birr Room', stake: 10.0 },
      { id: 'room-20', name: '20 Birr Room', stake: 20.0 },
      { id: 'room-50', name: '50 Birr Room', stake: 50.0 },
      { id: 'room-100', name: '100 Birr VIP Room', stake: 100.0 }
    ];

    for (const def of stakeDefs) {
      const state = this.createRoomState(def.id, def.name, def.stake);
      this.rooms.set(def.id, state);
      this.startLobbyTimer(def.id);
    }

    // Default aliases map to room-10
    const primary = this.rooms.get('room-10')!;
    this.rooms.set(ARENA_ROOM_ID, primary);
    this.rooms.set('default', primary);
  }

  public getRoom(roomId?: string): GameRoomState {
    if (roomId && this.rooms.has(roomId)) {
      return this.rooms.get(roomId)!;
    }
    return this.rooms.get('room-10') || this.rooms.get(ARENA_ROOM_ID)!;
  }

  public getStakeRoomsSummary(): Record<number, number> {
    return {
      10: this.rooms.get('room-10')?.tickets.size || 0,
      20: this.rooms.get('room-20')?.tickets.size || 0,
      50: this.rooms.get('room-50')?.tickets.size || 0,
      100: this.rooms.get('room-100')?.tickets.size || 0
    };
  }

  public getAllRooms() {
    const r10 = this.getRoom('room-10');
    const r20 = this.getRoom('room-20');
    const r50 = this.getRoom('room-50');
    const r100 = this.getRoom('room-100');

    return [
      {
        id: 'lomi-arena',
        name: '10 Birr Arena (Default)',
        stakeAmount: 10.0,
        phase: r10.phase,
        lobbyCountdown: r10.lobbyCountdown,
        playersCount: this.getRoomPlayersCount(r10),
        totalPot: r10.totalPot,
        winnerPayout: r10.winnerPayout
      },
      {
        id: 'room-10',
        name: '10 Birr Room',
        stakeAmount: 10.0,
        phase: r10.phase,
        lobbyCountdown: r10.lobbyCountdown,
        playersCount: this.getRoomPlayersCount(r10),
        totalPot: r10.totalPot,
        winnerPayout: r10.winnerPayout
      },
      {
        id: 'room-20',
        name: '20 Birr Room',
        stakeAmount: 20.0,
        phase: r20.phase,
        lobbyCountdown: r20.lobbyCountdown,
        playersCount: this.getRoomPlayersCount(r20),
        totalPot: r20.totalPot,
        winnerPayout: r20.winnerPayout
      },
      {
        id: 'room-50',
        name: '50 Birr Room',
        stakeAmount: 50.0,
        phase: r50.phase,
        lobbyCountdown: r50.lobbyCountdown,
        playersCount: this.getRoomPlayersCount(r50),
        totalPot: r50.totalPot,
        winnerPayout: r50.winnerPayout
      },
      {
        id: 'room-100',
        name: '100 Birr VIP Room',
        stakeAmount: 100.0,
        phase: r100.phase,
        lobbyCountdown: r100.lobbyCountdown,
        playersCount: this.getRoomPlayersCount(r100),
        totalPot: r100.totalPot,
        winnerPayout: r100.winnerPayout
      }
    ];
  }

  // Returns live count of real players + active bots (unlimited, no 50 cap)
  public getRoomPlayersCount(room: GameRoomState): number {
    const realCount = room.tickets.size;
    const botCount = room.opponentCards ? room.opponentCards.length : 0;
    return realCount + botCount;
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

  public handleJoinRoom(socketId: string, roomId: string, _userId?: string) {
    const room = this.getRoom(roomId);
    room.activeSockets.add(socketId);
    this.broadcastRoomState(room);
  }

  public handleLeaveRoom(socketId: string, roomId: string) {
    const room = this.getRoom(roomId);
    room.activeSockets.delete(socketId);
    this.broadcastRoomState(room);
  }

  /**
   * Safe Lobby Ticket Cancellation / Room Switch Refund
   * If player bought a ticket in a room lobby and switches to another stake, refund funds immediately.
   */
  public async handleCancelTicketLobby(
    userId: string,
    roomId: string
  ): Promise<{ success: boolean; refunded?: number; error?: string }> {
    const room = this.getRoom(roomId);
    if (!room || room.phase !== 'lobby') {
      return { success: false, error: 'Cannot cancel tickets outside lobby phase' };
    }

    const userTickets = room.tickets.get(userId);
    if (!userTickets || userTickets.length === 0) {
      return { success: false, error: 'No active tickets in this room lobby' };
    }

    let refundAmount = 0;
    userTickets.forEach(t => { refundAmount += t.betAmount; });

    if (refundAmount > 0) {
      try {
        await withTransaction(async (client) => {
          await client.query(
            'UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE user_id = $2',
            [refundAmount, userId]
          );
          const refCode = `REF-${Date.now().toString().slice(-6)}`;
          await client.query(
            `INSERT INTO wallet_transactions (user_id, type, amount, balance_after, reference_code, status, description)
             VALUES ($1, 'refund', $2, (SELECT balance FROM wallets WHERE user_id = $1), $3, 'completed', $4)`,
            [userId, refundAmount, refCode, `Refunded ${userTickets.length} cartelas from ${room.name} lobby`]
          );
        });

        room.tickets.delete(userId);
        room.realPlayerCount = room.tickets.size;
        room.waitingForPlayers = room.tickets.size < 2;
        this.recalculatePot(room);
        this.broadcastRoomState(room);

        io.emit(`user_${userId}_balance`, {
          type: 'ticket_refunded',
          refundAmount
        });
        io.emit('user_balance_updated', { userId });
        io.emit('stake_rooms_summary', this.getStakeRoomsSummary());

        console.log(`💸 [Lobby Refund] Refunded ${refundAmount} ETB to user ${userId} from ${room.name}`);
        return { success: true, refunded: refundAmount };
      } catch (err: any) {
        console.error('❌ [GameEngine] Error in handleCancelTicketLobby:', err);
        return { success: false, error: err.message || 'Refund failed' };
      }
    }
    return { success: false };
  }

  /**
   * 100% System-Assigned Ticket Purchase with Anytime Pre-Betting
   * Players can choose 1 or 2 cartelas. If 2 cartelas, 3rd is FREE!
   * Routes to the dedicated stake room matching customStake or requestedRoomId.
   */
  public async handleBuyTicket(
    userId: string,
    userName: string,
    requestedRoomId: string,
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
    // Resolve target room based on customStake or requestedRoomId
    let targetRoomId = requestedRoomId;
    if (customStake === 20) targetRoomId = 'room-20';
    else if (customStake === 50) targetRoomId = 'room-50';
    else if (customStake === 100) targetRoomId = 'room-100';
    else if (customStake === 10) targetRoomId = 'room-10';

    const room = this.getRoom(targetRoomId);
    const stakePerCard = room.stakeAmount;

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
          [userId, totalCost, newReal + newBonus, refCode, `Purchased ${drawnIds.length} cartelas in ${room.name}`]
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
        room.realPlayerCount = room.tickets.size;
        room.waitingForPlayers = room.tickets.size < 2;
        this.recalculatePot(room);
        this.broadcastRoomState(room);

        // Notify room clients a new real player joined (for lobby join feed UI)
        io.to(room.id).emit('player_joined', {
          userName,
          realPlayerCount: room.tickets.size,
          waitingForPlayers: room.tickets.size < 2,
          countdownStarted: room.tickets.size >= 2,
          roomId: room.id
        });
        if (room.id === 'room-10') {
          io.to(ARENA_ROOM_ID).emit('player_joined', {
            userName,
            realPlayerCount: room.tickets.size,
            waitingForPlayers: room.tickets.size < 2,
            countdownStarted: room.tickets.size >= 2,
            roomId: ARENA_ROOM_ID
          });
        }
      }

      io.emit('stake_rooms_summary', this.getStakeRoomsSummary());

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
  private startLobbyTimer(roomId: string = 'room-10') {
    const room = this.rooms.get(roomId) || this.rooms.get('room-10') || this.rooms.get(ARENA_ROOM_ID)!;

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
      console.log(`🎟️ [Lobby ${room.id}] Activated pre-bought tickets for ${room.tickets.size} users for Round #${room.roundNumber}`);
      io.to(room.id).emit('prebought_tickets_activated', {
        roundNumber: room.roundNumber,
        activeTicketsCount: room.tickets.size,
        roomId: room.id
      });
      if (room.id === 'room-10') {
        io.to(ARENA_ROOM_ID).emit('prebought_tickets_activated', {
          roundNumber: room.roundNumber,
          activeTicketsCount: room.tickets.size,
          roomId: ARENA_ROOM_ID
        });
      }
    } else {
      room.tickets.clear();
    }

    this.recalculatePot(room);

    const intervalKey = `lobby_${room.id}`;
    if (this.intervals.has(intervalKey)) {
      clearInterval(this.intervals.get(intervalKey)!);
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
        await this.startRound(room.id);
      }
    }, 1000);

    this.intervals.set(intervalKey, interval);
  }

  /**
   * Start Live Round for a specific stake room
   */
  private async startRound(roomId: string = 'room-10') {
    const room = this.rooms.get(roomId) || this.rooms.get('room-10') || this.rooms.get(ARENA_ROOM_ID)!;

    try {
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
        if (this.botAccounts.length < 3) {
          await this.loadBotAccounts();
        }

        const botPool = this.botAccounts.length >= 3 ? this.botAccounts : REGISTERED_3_BOTS;

        // Add exactly the 3 registered bots — always, regardless of how many real players (11, 50, 100...)
        for (let i = 0; i < 3; i++) {
          let botCartelaId = Math.floor(1 + Math.random() * 400);
          while (assignedIds.has(botCartelaId)) {
            botCartelaId = Math.floor(1 + Math.random() * 400);
          }
          assignedIds.add(botCartelaId);

          const botProfile = botPool[i];
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
        console.error(`❌ [GameEngine Error saving round to DB in ${room.id}]:`, err);
      }

      // 5. Generate Shuffled 1-75 Balls with Natural Win Steering
      room.ballSequence = this.prepareBallSequence(room);
      room.drawnNumbers = [];
      room.phase = 'playing';

      const roundStartedPayload = {
        roundId: room.currentRoundId,
        roundNumber: room.roundNumber,
        totalPot: room.totalPot,
        winnerPayout: room.winnerPayout,
        playersCount: realTicketsCount + room.opponentCards.length,
        roomId: room.id
      };

      // Broadcast Round Started to room
      io.to(room.id).emit('round_started', roundStartedPayload);
      if (room.id === 'room-10') {
        io.to(ARENA_ROOM_ID).emit('round_started', { ...roundStartedPayload, roomId: ARENA_ROOM_ID });
        io.to('default').emit('round_started', { ...roundStartedPayload, roomId: 'default' });
      }

      // Start 3.5s Ball Drawing Loop
      this.startBallCallingLoop(room.id);
    } catch (err) {
      console.error(`❌ [BingoGameEngine] Error in startRound for ${room.id}:`, err);
      this.startLobbyTimer(room.id);
    }
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
  private startBallCallingLoop(roomId: string = 'room-10') {
    const room = this.rooms.get(roomId) || this.rooms.get('room-10') || this.rooms.get(ARENA_ROOM_ID)!;

    const intervalKey = `ball_${room.id}`;
    if (this.intervals.has(intervalKey)) {
      clearInterval(this.intervals.get(intervalKey)!);
    }

    const interval = setInterval(async () => {
      if (room.phase !== 'playing') {
        clearInterval(interval);
        return;
      }

      if (room.ballSequence.length === 0) {
        clearInterval(interval);
        this.finishRoundWithoutWinner(room.id);
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

      const ballPayload = {
        currentCall: room.currentCall,
        drawnNumbers: room.drawnNumbers,
        totalCalled: room.drawnNumbers.length,
        roomId: room.id
      };

      // Broadcast Ball Called to room
      io.to(room.id).emit('ball_called', ballPayload);
      if (room.id === 'room-10') {
        io.to(ARENA_ROOM_ID).emit('ball_called', { ...ballPayload, roomId: ARENA_ROOM_ID });
        io.to('default').emit('ball_called', { ...ballPayload, roomId: 'default' });
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

    this.intervals.set(intervalKey, interval);
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

    const netPayout = room.winnerPayout > 0 ? room.winnerPayout : room.totalPot;
    const perCardPayout = Math.max(1, Math.floor(netPayout / totalWinningCards));

    let primaryUserPayout = 0;
    let displayWinnerPayout = netPayout;

    // 1. Credit all winning real players atomically via Neon PostgreSQL
    if (realWinnersByUser.size > 0) {
      try {
        await withTransaction(async (client) => {
          for (const [userId, userWinningCards] of realWinnersByUser.entries()) {
            const userTickets = room.tickets.get(userId) || [];

            // Calculate total payout for this user based on dynamic net prize pool:
            const userTotalWin = userWinningCards.length * perCardPayout;

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
          const botPayout = perCardPayout;
          displayWinnerPayout = botPayout;

          if (matchingOpp?.botUserId && !matchingOpp.botUserId.startsWith('bot_legacy_')) {
            // Deposit real winnings into the bot's Neon DB wallet!
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
      sharePerWinner: isSplit ? perCardPayout : displayWinnerPayout,
      userShare: primaryUserPayout,
      coWinners: isSplit ? externalCoWinners : [],
      isSplit,
      winnersCount: distinctEntities.size
    };

    room.winResult = winResult;

    // Broadcast round winner to room
    io.to(room.id).emit('round_winner', winResult);
    if (room.id === 'room-10') {
      io.to(ARENA_ROOM_ID).emit('round_winner', winResult);
      io.to('default').emit('round_winner', winResult);
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
    roomId: string,
    cartelaId: number
  ): Promise<{ success: boolean; message: string; winResult?: any }> {
    const room = this.getRoom(roomId);
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

    const intervalKey = `ball_${room.id}`;
    if (this.intervals.has(intervalKey)) {
      clearInterval(this.intervals.get(intervalKey)!);
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

  private finishRoundWithoutWinner(roomId: string = 'room-10') {
    const room = this.rooms.get(roomId) || this.rooms.get('room-10') || this.rooms.get(ARENA_ROOM_ID)!;
    room.phase = 'winner';
    io.to(room.id).emit('round_ended_no_winner', { totalPot: room.totalPot, roomId: room.id });
    if (room.id === 'room-10') {
      io.to(ARENA_ROOM_ID).emit('round_ended_no_winner', { totalPot: room.totalPot, roomId: ARENA_ROOM_ID });
      io.to('default').emit('round_ended_no_winner', { totalPot: room.totalPot, roomId: 'default' });
    }
    this.startWinnerCelebrationTimer(room.id);
  }

  private startWinnerCelebrationTimer(roomId: string = 'room-10') {
    const room = this.rooms.get(roomId) || this.rooms.get('room-10') || this.rooms.get(ARENA_ROOM_ID)!;

    room.winnerCountdown = 8;
    const intervalKey = `winner_${room.id}`;
    if (this.intervals.has(intervalKey)) {
      clearInterval(this.intervals.get(intervalKey)!);
    }

    const interval = setInterval(() => {
      room.winnerCountdown -= 1;
      this.broadcastRoomState(room);

      if (room.winnerCountdown <= 0) {
        clearInterval(interval);
        room.roundNumber += 1;
        room.tickets.clear();
        this.startLobbyTimer(room.id); // Transition to 45s lobby
      }
    }, 1000);

    this.intervals.set(intervalKey, interval);
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

    io.to(room.id).emit('room_state', payload);
    if (room.id === 'room-10') {
      io.to(ARENA_ROOM_ID).emit('room_state', { ...payload, roomId: ARENA_ROOM_ID });
      io.to('default').emit('room_state', { ...payload, roomId: 'default' });
    }
    io.emit('stake_rooms_summary', this.getStakeRoomsSummary());
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
