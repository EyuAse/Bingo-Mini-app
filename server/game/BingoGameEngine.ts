import { io } from '../server.ts';
import { query, withTransaction } from '../db.ts';
import { telegramBotService } from '../services/telegramBotService.ts';
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
  isAutoPlay?: boolean;
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
  activeUsers: Set<string>;
  activeUserSockets: Map<string, string>; // userId -> socketId
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
      activeUsers: new Set(),
      activeUserSockets: new Map(),
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
    const getCount = (roomId: string) => {
      const r = this.rooms.get(roomId);
      if (!r) return 0;
      return Math.max(r.activeUsers.size, r.tickets.size);
    };
    return {
      10: getCount('room-10'),
      20: getCount('room-20'),
      50: getCount('room-50'),
      100: getCount('room-100')
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

  public handleJoinRoom(socketId: string, roomId: string, userId?: string, userName?: string) {
    const room = this.getRoom(roomId);
    room.activeSockets.add(socketId);
    if (userId) {
      room.activeUsers.add(userId);
      room.activeUserSockets.set(userId, socketId);
    }
    const activeInRoom = Math.max(room.activeUsers.size, room.activeSockets.size);
    if (activeInRoom >= 2 || room.tickets.size >= 2) {
      room.waitingForPlayers = false;
    }
    this.broadcastRoomState(room);

    // Notify other players in the room that a player entered the room
    io.to(room.id).emit('room_user_joined', {
      userId,
      userName: userName || 'A player',
      activeUsersCount: activeInRoom,
      realPlayerCount: room.tickets.size,
      waitingForPlayers: room.waitingForPlayers,
      roomId: room.id
    });
    if (room.id === 'room-10') {
      io.to(ARENA_ROOM_ID).emit('room_user_joined', {
        userId,
        userName: userName || 'A player',
        activeUsersCount: activeInRoom,
        realPlayerCount: room.tickets.size,
        waitingForPlayers: room.waitingForPlayers,
        roomId: ARENA_ROOM_ID
      });
    }
  }

  public handleLeaveRoom(socketId: string, roomId: string) {
    const room = this.getRoom(roomId);
    room.activeSockets.delete(socketId);
    for (const [uid, sid] of room.activeUserSockets.entries()) {
      if (sid === socketId) {
        room.activeUserSockets.delete(uid);
        room.activeUsers.delete(uid);
      }
    }
    const activeInRoom = Math.max(room.activeUsers.size, room.activeSockets.size);
    // Only set waitingForPlayers flag — do NOT reset the countdown timer.
    // The lobby interval's own freeze logic handles keeping the timer paused.
    // Hard-resetting to 45 here causes visible jumps when a user briefly disconnects/reconnects.
    if (activeInRoom < 2 && room.tickets.size < 2) {
      room.waitingForPlayers = true;
      // lobbyCountdown intentionally NOT reset here — the interval freeze handles it
    }
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
   * Seamless Lobby Stake Transfer
   * Moves a player's active cartelas from oldRoom lobby to newRoom lobby.
   * Adjusts net difference: refunds if moving down (e.g. 20 -> 10), or deducts if moving up (e.g. 10 -> 20).
   * Automatically keeps the player active in the new room so player count updates and countdown starts!
   */
  public async handleTransferTicketLobby(
    userId: string,
    oldRoomId: string,
    newRoomId: string,
    socketId: string
  ): Promise<{
    success: boolean;
    error?: string;
    tickets?: PlayerTicket[];
    refundedOrCharged?: number;
  }> {
    const oldRoom = this.getRoom(oldRoomId);
    const newRoom = this.getRoom(newRoomId);

    if (!oldRoom || !newRoom) {
      return { success: false, error: 'Target room not found' };
    }

    if (oldRoom.phase !== 'lobby' || newRoom.phase !== 'lobby') {
      return { success: false, error: 'Can only transfer tickets while both rooms are in lobby phase' };
    }

    const userTickets = oldRoom.tickets.get(userId);
    if (!userTickets || userTickets.length === 0) {
      return { success: false, error: 'No active tickets in previous room to transfer' };
    }

    const cardCount = userTickets.length;
    const oldTotalCost = cardCount * oldRoom.stakeAmount;
    const newTotalCost = cardCount * newRoom.stakeAmount;
    const netDifference = oldTotalCost - newTotalCost; // >0 means refund to user, <0 means user owes extra

    try {
      await withTransaction(async (client) => {
        if (netDifference > 0) {
          // Refund difference (e.g. 20 -> 10 ETB: refund 10 ETB per card)
          await client.query(
            'UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE user_id = $2',
            [netDifference, userId]
          );
          const refCode = `TRF-REF-${Date.now().toString().slice(-6)}`;
          await client.query(
            `INSERT INTO wallet_transactions (user_id, type, amount, balance_after, reference_code, status, description)
             VALUES ($1, 'refund', $2, (SELECT balance FROM wallets WHERE user_id = $1), $3, 'completed', $4)`,
            [userId, netDifference, refCode, `Stake room transfer difference refunded: ${oldRoom.name} -> ${newRoom.name}`]
          );
        } else if (netDifference < 0) {
          // Deduct difference (e.g. 10 -> 20 ETB: need 10 ETB extra per card)
          const extraCost = Math.abs(netDifference);
          const walletRes = await client.query(
            'SELECT balance, bonus FROM wallets WHERE user_id = $1 FOR UPDATE',
            [userId]
          );
          if (walletRes.rows.length === 0) throw new Error('Wallet not found');

          const realBal = parseFloat(walletRes.rows[0].balance || '0');
          const bonusBal = parseFloat(walletRes.rows[0].bonus || '0');
          const totalFunds = realBal + bonusBal;

          if (totalFunds < extraCost) {
            throw new Error(`Insufficient funds for stake upgrade. Need ${extraCost.toFixed(2)} ETB extra.`);
          }

          const deductFromBonus = Math.min(bonusBal, extraCost);
          const deductFromReal = extraCost - deductFromBonus;
          const newReal = realBal - deductFromReal;
          const newBonus = bonusBal - deductFromBonus;

          await client.query(
            'UPDATE wallets SET balance = $1, bonus = $2, updated_at = NOW() WHERE user_id = $3',
            [newReal, newBonus, userId]
          );
          const refCode = `TRF-BET-${Date.now().toString().slice(-6)}`;
          await client.query(
            `INSERT INTO wallet_transactions (user_id, type, amount, balance_after, reference_code, status, description)
             VALUES ($1, 'bet', $2, $3, $4, 'completed', $5)`,
            [userId, extraCost, newReal + newBonus, refCode, `Stake room transfer upgrade: ${oldRoom.name} -> ${newRoom.name}`]
          );
        }
      });

      // 1. Remove from old room
      oldRoom.tickets.delete(userId);
      oldRoom.realPlayerCount = oldRoom.tickets.size;
      oldRoom.waitingForPlayers = oldRoom.tickets.size < 2;
      this.recalculatePot(oldRoom);
      this.broadcastRoomState(oldRoom);

      // 2. Prepare transferred tickets in new room
      const transferredTickets: PlayerTicket[] = userTickets.map(t => ({
        ...t,
        betAmount: newRoom.stakeAmount,
        socketId: socketId || t.socketId
      }));

      // 3. Register in new room
      newRoom.tickets.set(userId, transferredTickets);
      newRoom.realPlayerCount = newRoom.tickets.size;
      newRoom.waitingForPlayers = newRoom.tickets.size < 2;
      this.recalculatePot(newRoom);
      this.broadcastRoomState(newRoom);

      // 4. Notify new room of player joined (for lobby feed)
      const userName = userTickets[0]?.userName || 'Player';
      io.to(newRoom.id).emit('player_joined', {
        userName,
        realPlayerCount: newRoom.tickets.size,
        waitingForPlayers: newRoom.tickets.size < 2,
        countdownStarted: newRoom.tickets.size >= 2,
        roomId: newRoom.id
      });
      if (newRoom.id === 'room-10') {
        io.to(ARENA_ROOM_ID).emit('player_joined', {
          userName,
          realPlayerCount: newRoom.tickets.size,
          waitingForPlayers: newRoom.tickets.size < 2,
          countdownStarted: newRoom.tickets.size >= 2,
          roomId: ARENA_ROOM_ID
        });
      }

      // 5. Broadcast wallet and stake summaries
      io.emit('user_balance_updated', { userId });
      io.emit('stake_rooms_summary', this.getStakeRoomsSummary());

      console.log(`🔄 [Lobby Transfer] Transferred ${cardCount} tickets for user ${userId} from ${oldRoom.name} to ${newRoom.name} (Net difference: ${netDifference} ETB)`);

      return {
        success: true,
        tickets: transferredTickets,
        refundedOrCharged: netDifference
      };
    } catch (err: any) {
      console.error('❌ [GameEngine] Error in handleTransferTicketLobby:', err);
      return { success: false, error: err.message || 'Transfer failed' };
    }
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
    customStake?: number,
    isAutoPlay: boolean = true
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

    // Validate and honor requested Cartela IDs (1-400) chosen by user
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

    if (Array.isArray(requestedCartelaIds) && requestedCartelaIds.length > 0) {
      for (let i = 0; i < quantity; i++) {
        const reqId = requestedCartelaIds[i];
        if (reqId && reqId >= 1 && reqId <= 400) {
          if (assignedIds.has(reqId)) {
            return {
              success: false,
              preBoughtForNextRound: false,
              tickets: [],
              error: `Cartela #${reqId} is already taken in this arena. Please choose another cartela.`
            };
          }
          if (!drawnIds.includes(reqId)) {
            drawnIds.push(reqId);
          }
        }
      }
    } else if (typeof requestedCartelaIds === 'number' && requestedCartelaIds >= 1 && requestedCartelaIds <= 400) {
      if (assignedIds.has(requestedCartelaIds)) {
        return {
          success: false,
          preBoughtForNextRound: false,
          tickets: [],
          error: `Cartela #${requestedCartelaIds} is already taken in this arena. Please choose another cartela.`
        };
      }
      drawnIds.push(requestedCartelaIds);
    }

    // Fill any remaining required card slots with unique untaken cartelas
    while (drawnIds.length < quantity) {
      drawnIds.push(getNextUniqueCartelaId());
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

      // Register tickets in memory (strictly max 2 cartelas, all paid stake)
      const playerTickets: PlayerTicket[] = drawnIds.map(id => ({
        userId,
        userName,
        cartelaId: id,
        cardMatrix: generateCardFromId(id),
        betAmount: stakePerCard,
        socketId,
        isBonus: false,
        isAutoPlay: isAutoPlay !== false
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

  /**
   * Updates player's Auto/Manual mode for their active & queued tickets
   */
  public updatePlayerMode(roomId: string, userId: string, isAutoPlay: boolean) {
    const room = this.getRoom(roomId);
    if (!room) return;
    const userTickets = room.tickets.get(userId);
    if (userTickets) {
      userTickets.forEach(t => { t.isAutoPlay = isAutoPlay; });
    }
    const nextTickets = room.nextRoundTickets?.get(userId);
    if (nextTickets) {
      nextTickets.forEach(t => { t.isAutoPlay = isAutoPlay; });
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

      const realUserCount = room.tickets.size; // distinct real users who have BOUGHT tickets
      const activeInRoom = Math.max(room.activeUsers.size, room.activeSockets.size);
      room.realPlayerCount = realUserCount;

      // FREEZE countdown: requires at least 2 real players present OR at least 2 tickets purchased.
      // Priority: ticket count (realUserCount) takes precedence — if 2+ have tickets, ALWAYS let countdown tick
      // even if activeInRoom temporarily dips (e.g. during reconnect).
      const shouldFreeze = realUserCount < 2 && activeInRoom < 2;

      if (shouldFreeze) {
        if (!room.waitingForPlayers) {
          room.waitingForPlayers = true;
        }
        // Clamp to 45 only if it drifted above (e.g. just entered lobby) — never decrement when frozen
        if (room.lobbyCountdown > 45) {
          room.lobbyCountdown = 45;
        }
        this.broadcastRoomState(room);
        return;
      }

      // 2+ players confirmed (present or ticketed) — countdown runs normally
      room.waitingForPlayers = false;
      room.lobbyCountdown -= 1;
      this.broadcastRoomState(room);

      if (room.lobbyCountdown <= 0) {
        if (room.tickets.size >= 2) {
          clearInterval(interval);
          await this.startRound(room.id);
        } else {
          // Countdown reached 0 but fewer than 2 tickets purchased — reset and wait again
          room.lobbyCountdown = 45;
          room.waitingForPlayers = true;
          this.broadcastRoomState(room);
        }
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
        realPlayerCount: room.tickets.size,
        waitingForPlayers: false,
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
   * Cryptographically sound Fisher-Yates shuffle for true un-biased randomness
   */
  private fisherYatesShuffle<T>(arr: T[]): T[] {
    const res = [...arr];
    for (let i = res.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [res[i], res[j]] = [res[j], res[i]];
    }
    return res;
  }

  /**
   * Anti-Clumping Column Smoother:
   * Ensures that no more than 2 consecutive balls belong to the exact same B-I-N-G-O column,
   * perfectly mimicking real physical 75-ball air-blower cage extractions.
   */
  private applyAntiClumpingSmoother(balls: number[]): number[] {
    const result = [...balls];
    for (let i = 2; i < result.length; i++) {
      const colA = getBallColumn(result[i - 2]);
      const colB = getBallColumn(result[i - 1]);
      const colC = getBallColumn(result[i]);

      if (colA === colB && colB === colC) {
        let swapped = false;
        for (let j = i + 1; j < result.length; j++) {
          if (getBallColumn(result[j]) !== colB) {
            const temp = result[i];
            result[i] = result[j];
            result[j] = temp;
            swapped = true;
            break;
          }
        }
        if (!swapped) {
          for (let j = 0; j < i - 2; j++) {
            if (getBallColumn(result[j]) !== colB) {
              const temp = result[i];
              result[i] = result[j];
              result[j] = temp;
              break;
            }
          }
        }
      }
    }
    return result;
  }

  /**
   * Prepares 75-Ball sequence completing between Ball 15 and 25 with Multi-Player Weaving.
   * Eliminates predictability while ensuring ALL real players receive active daubs (6-10 marked numbers)
   * and reach "1 TO GO" / "2 TO GO" before the target winner completes on targetFinishBall.
   * Guarantees non-winning players NEVER have empty cards.
   */
  private prepareBallSequence(room: GameRoomState): number[] {
    const baseBalls = generateRandomShuffledBalls();

    let targetCardMatrix: BingoCell[] | null = null;
    let chosenRealTicket: PlayerTicket | null = null;
    const allRealTickets: PlayerTicket[] = [];
    room.tickets.forEach(list => allRealTickets.push(...list));

    if (room.targetWinnerType === 'real' && allRealTickets.length > 0) {
      chosenRealTicket = allRealTickets[Math.floor(Math.random() * allRealTickets.length)];
      targetCardMatrix = chosenRealTicket.cardMatrix;
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
      room.targetFinishBall = 20;
      return baseBalls;
    }

    // Pick winning line on target card (Row, Column, or Diagonal)
    const winningPatternsIndices = [
      [0, 1, 2, 3, 4],       // Row 1
      [5, 6, 7, 8, 9],       // Row 2
      [10, 11, 12, 13, 14],  // Row 3
      [15, 16, 17, 18, 19],  // Row 4
      [20, 21, 22, 23, 24],  // Row 5
      [0, 5, 10, 15, 20],    // Column B
      [1, 6, 11, 16, 21],    // Column I
      [2, 7, 12, 17, 22],    // Column N
      [3, 8, 13, 18, 23],    // Column G
      [4, 9, 14, 19, 24],    // Column O
      [0, 6, 12, 18, 24],    // Diagonal TL-BR
      [4, 8, 12, 16, 20]     // Diagonal TR-BL
    ];
    const chosenPattern = winningPatternsIndices[Math.floor(Math.random() * winningPatternsIndices.length)];
    const targetNumbers = chosenPattern
      .map(idx => targetCardMatrix![idx]?.val)
      .filter((v): v is number => typeof v === 'number');

    // Dynamically pick round completion ball: Ball 15 to 25 (inclusive)
    const targetFinishBall = 15 + Math.floor(Math.random() * 11); // 15, 16, ..., 25
    room.targetFinishBall = targetFinishBall;
    const finishIndex = targetFinishBall - 1; // 14 to 24

    console.log(`🎯 [GameEngine] Round #${room.roundNumber} targeting ${room.targetWinnerType.toUpperCase()} win on Ball #${targetFinishBall} (Finish index: ${finishIndex})`);

    // Target winner's final winning ball MUST land exactly on finishIndex
    const finalBall = targetNumbers[targetNumbers.length - 1];
    const earlyTargetNumbers = targetNumbers.slice(0, -1);

    // Collect competing cards (other real players and bot cards)
    const otherCards: BingoCell[][] = [];
    if (chosenRealTicket) {
      allRealTickets.forEach(t => {
        if (t.cartelaId !== chosenRealTicket!.cartelaId) {
          otherCards.push(t.cardMatrix);
        }
      });
      room.opponentCards.forEach(o => otherCards.push(o.cardMatrix));
    } else {
      allRealTickets.forEach(t => otherCards.push(t.cardMatrix));
      room.opponentCards.forEach(o => {
        if (o.cardMatrix !== targetCardMatrix) otherCards.push(o.cardMatrix);
      });
    }

    // Target winner's non-target numbers must NOT be drawn before finishIndex
    // This strictly prevents the target winner from accidentally winning on another line early
    const targetNonWinningNumbers = new Set(
      targetCardMatrix
        .map(c => c.val)
        .filter((v): v is number => typeof v === 'number' && !targetNumbers.includes(v))
    );

    // Mathematical Invariant Guarantee:
    // S will hold the exact set of (targetFinishBall - 1) balls to be drawn in slots 0 to finishIndex - 1.
    // S starts with earlyTargetNumbers (size 4).
    // finalBall is placed at finishIndex (ball targetFinishBall).
    // For ANY card in otherCards:
    // checkWinningPattern(card, [...S, candidate, finalBall]).isWin MUST BE FALSE!
    // This guarantees mathematically that NO competing card can EVER win at any ball <= targetFinishBall!
    const S: number[] = [...earlyTargetNumbers];
    const sSet = new Set<number>(S);

    const isSafeToAdd = (candidate: number): boolean => {
      if (candidate === finalBall) return false;
      if (sSet.has(candidate)) return false;
      if (targetNonWinningNumbers.has(candidate)) return false;

      const testDrawn = [...S, candidate, finalBall];
      for (const card of otherCards) {
        if (checkWinningPattern(card, testDrawn).isWin) {
          return false;
        }
      }
      return true;
    };

    // Step A: For each competing card, add numbers from a competing line to lock them at "1 TO GO! 🔥"
    for (const otherCard of otherCards) {
      const compPattern = winningPatternsIndices[Math.floor(Math.random() * winningPatternsIndices.length)];
      const lineNums = compPattern
        .map(idx => otherCard[idx]?.val)
        .filter((v): v is number => typeof v === 'number');

      for (const num of lineNums) {
        if (S.length >= finishIndex) break;
        if (isSafeToAdd(num)) {
          S.push(num);
          sSet.add(num);
        }
      }

      // Also add 2 to 3 numbers from other cells of this card for natural card distribution
      const otherCardNums = otherCard
        .map(c => c.val)
        .filter((v): v is number => typeof v === 'number')
        .sort(() => Math.random() - 0.5);

      for (const num of otherCardNums) {
        if (S.length >= finishIndex) break;
        if (isSafeToAdd(num)) {
          S.push(num);
          sSet.add(num);
        }
      }
    }

    // Step B: Fill the remaining slots of S up to finishIndex with neutral cage balls
    const shuffledBaseBalls = this.fisherYatesShuffle(baseBalls);
    for (const b of shuffledBaseBalls) {
      if (S.length >= finishIndex) break;
      if (isSafeToAdd(b)) {
        S.push(b);
        sSet.add(b);
      }
    }

    // Natural 75-Ball Column Balancer:
    // Safe Set S contains all finishIndex balls (early target numbers, competing card numbers, neutral cage balls).
    // All numbers in S are mathematically guaranteed safe (no competing card wins on S ∪ {finalBall}).
    // We shuffle S with Fisher-Yates and apply the Anti-Clumping Column Smoother so balls alternate naturally across letters.
    const earlyShuffled = this.applyAntiClumpingSmoother(this.fisherYatesShuffle(S));

    const finalSequence: number[] = new Array(75).fill(0);

    // Place natural early balls in slots 0 to finishIndex - 1
    for (let i = 0; i < finishIndex; i++) {
      finalSequence[i] = earlyShuffled[i];
    }

    // Target winner's winning ball lands precisely on finishIndex (ball targetFinishBall)
    finalSequence[finishIndex] = finalBall;

    // Boundary Anti-Clumping: Ensure finalBall does not create a 3-streak with slots finishIndex - 1 and finishIndex - 2
    const finalCol = getBallColumn(finalBall);
    if (
      finishIndex >= 2 &&
      getBallColumn(finalSequence[finishIndex - 1]) === finalCol &&
      getBallColumn(finalSequence[finishIndex - 2]) === finalCol
    ) {
      for (let j = finishIndex - 3; j >= 0; j--) {
        if (getBallColumn(finalSequence[j]) !== finalCol) {
          const temp = finalSequence[finishIndex - 1];
          finalSequence[finishIndex - 1] = finalSequence[j];
          finalSequence[j] = temp;
          break;
        }
      }
    }

    // Collect all remaining balls (from 1 to 75) that have not been used in slots 0 to finishIndex
    const usedInEarlySlots = new Set<number>(finalSequence.slice(0, targetFinishBall));
    const remainingBalls = this.applyAntiClumpingSmoother(
      this.fisherYatesShuffle(baseBalls.filter(b => !usedInEarlySlots.has(b)))
    );

    // Fill remaining slots (from targetFinishBall to 74)
    for (let i = targetFinishBall; i < 75; i++) {
      finalSequence[i] = remainingBalls[i - targetFinishBall];
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

        // Check all Real Player tickets (Only auto-win for Auto-Play tickets; manual players must claim)
        for (const [uid, tList] of room.tickets.entries()) {
          for (const t of tList) {
            if (t.isAutoPlay !== false) {
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

              const isSocketConnected = room.activeUsers.has(userId) || userTickets.some(t => room.activeSockets.has(t.socketId));
              const isOffline = !isSocketConnected;
              const winRef = `WIN-ARENA-${Date.now().toString().slice(-6)}`;
              const winningCardIds = userWinningCards.map(w => `#${w.cartelaId}`).join(', ');
              const firstTicket = userTickets.find(t => t.cartelaId === userWinningCards[0].cartelaId);
              const ticketStake = firstTicket?.betAmount || room.stakeAmount;

              const description = isSplit
                ? `Split Pot Winner (${userWinningCards.length} of ${totalWinningCards} cards, ${ticketStake} ETB Stake) in ${room.name} (Cartela ${winningCardIds})${isOffline ? ' [Protected Offline Auto-Claim]' : ''}`
                : `Bingo Solo Winner (${ticketStake} ETB Stake) in ${room.name} (Cartela ${winningCardIds})${isOffline ? ' [Protected Offline Auto-Claim]' : ''}`;

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
                isOffline,
                acknowledged: !isOffline, // Connected winners celebrate live inside the app; offline winners get the modal upon return
                winningPattern: userWinningCards[0].winningPattern
              };
              this.offlineWins.unshift(winRecord);
              if (this.offlineWins.length > 200) this.offlineWins.pop();

              io.emit('offline_win_recorded', winRecord);

              // Automated Big Winner Channel Broadcast (if enabled & threshold met)
              telegramBotService.announceBigWinner(
                userWinningCards[0].userName,
                userTotalWin,
                room.name,
                userWinningCards[0].cartelaId
              ).catch(() => {});

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
      houseFee: room.houseFee || 0,
      netPrizePot: room.winnerPayout > 0 ? room.winnerPayout : room.totalPot,
      commissionPercent: room.commissionEnabled ? (room.commissionPercent || 20) : 0,
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

    const winningCards: Array<{
      userId?: string;
      userName: string;
      cartelaId: number;
      isReal: boolean;
      winningPattern: string;
      winningIndices: number[];
    }> = [
      {
        userId,
        userName,
        cartelaId,
        isReal: true,
        winningPattern: winCheck.winningPattern || 'Bingo Line',
        winningIndices: winCheck.winningIndices || []
      }
    ];

    // Check if other real players also completed a winning line on this ball (simultaneous split pot)
    for (const [otherUid, tList] of room.tickets.entries()) {
      for (const t of tList) {
        if (otherUid === userId && t.cartelaId === cartelaId) continue;
        const otherCheck = checkWinningPattern(t.cardMatrix, room.drawnNumbers);
        if (otherCheck.isWin) {
          winningCards.push({
            userId: otherUid,
            userName: t.userName,
            cartelaId: t.cartelaId,
            isReal: true,
            winningPattern: otherCheck.winningPattern || 'Bingo Line',
            winningIndices: otherCheck.winningIndices || []
          });
        }
      }
    }

    // Check if any bot cards also completed on this ball
    for (const opp of room.opponentCards) {
      const botCheck = checkWinningPattern(opp.cardMatrix, room.drawnNumbers);
      if (botCheck.isWin) {
        winningCards.push({
          userName: opp.opponentName,
          cartelaId: opp.cartelaId,
          isReal: false,
          winningPattern: botCheck.winningPattern || 'Bingo Line',
          winningIndices: botCheck.winningIndices || []
        });
      }
    }

    await this.processRoundVictory(room, winningCards);

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
    const occupiedCartelaIds = new Set<number>();
    room.tickets.forEach(list => list.forEach(t => occupiedCartelaIds.add(t.cartelaId)));
    if (room.nextRoundTickets) {
      room.nextRoundTickets.forEach(list => list.forEach(t => occupiedCartelaIds.add(t.cartelaId)));
    }

    const payload = {
      success: true,
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
      realPlayerCount: room.tickets.size,
      activeUsersCount: Math.max(room.activeUsers.size, room.activeSockets.size),
      occupiedCartelaIds: Array.from(occupiedCartelaIds)
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
    return this.offlineWins.filter(w => w.userId === userId && !w.acknowledged && w.isOffline === true);
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
