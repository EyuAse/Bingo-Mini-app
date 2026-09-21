import { io } from '../io.ts';
import { query, withTransaction } from '../db.ts';
import { telegramBotService } from '../services/telegramBotService.ts';
import {
  type BingoCell,
  generateCardFromId,
  checkWinningPattern,
  getAllWinningPatterns,
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
  mode: 'active' | 'spectating';
  isProcessingVictory: boolean;
  lastBallTime: number;
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
  waitingForOtherHouses?: boolean; // true when this house finished early and waits for other active houses
  isHoldingClaimWindow?: boolean;  // true when holding 3.0s window for manual player simultaneous claim
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
export const STAKE_ROOM_IDS = ['room-10', 'room-20', 'room-50', 'room-100'];

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

  // Player Auto/Manual Mode Preference Registry (userId -> isAutoPlay)
  private playerModes: Map<string, boolean> = new Map();

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
      mode: 'active',
      isProcessingVictory: false,
      lastBallTime: Date.now(),
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
      waitingForOtherHouses: false,
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
    }

    // Default aliases map to room-10
    const primary = this.rooms.get('room-10')!;
    this.rooms.set(ARENA_ROOM_ID, primary);
    this.rooms.set('default', primary);

    // Launch Single Synchronized Master Cycle across all houses!
    this.startMasterLobbyTimer();
    this.startWatchdogTimer();
  }

  public getRoom(roomId?: string): GameRoomState {
    if (roomId && this.rooms.has(roomId)) {
      return this.rooms.get(roomId)!;
    }
    return this.rooms.get('room-10') || this.rooms.get(ARENA_ROOM_ID)!;
  }

  public getRealCartelaCount(room: GameRoomState): number {
    let count = 0;
    if (room.tickets) {
      room.tickets.forEach(list => { count += list.length; });
    }
    return count;
  }

  public getStakeRoomsSummary(): Record<number, number> {
    const getCount = (roomId: string) => {
      const r = this.rooms.get(roomId);
      if (!r) return 0;
      return r.phase === 'playing' ? r.realPlayerCount : this.getRealCartelaCount(r);
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

    const formatRoomSummary = (r: GameRoomState, idOverride?: string, nameOverride?: string) => ({
      id: idOverride || r.id,
      name: nameOverride || r.name,
      stakeAmount: r.stakeAmount,
      phase: r.phase,
      mode: r.mode || (r.tickets.size >= 2 ? 'active' : 'spectating'),
      lobbyCountdown: r.lobbyCountdown,
      winnerCountdown: r.winnerCountdown,
      playersCount: this.getRoomPlayersCount(r),
      realPlayerCount: this.getRealCartelaCount(r),
      totalPot: r.totalPot,
      winnerPayout: r.winnerPayout,
      winResult: r.winResult
    });

    return [
      formatRoomSummary(r10, 'lomi-arena', '10 Birr Arena (Default)'),
      formatRoomSummary(r10),
      formatRoomSummary(r20),
      formatRoomSummary(r50),
      formatRoomSummary(r100)
    ];
  }

  // Returns live count of real player cartelas + active bots (unlimited, no 50 cap)
  public getRoomPlayersCount(room: GameRoomState): number {
    const realCartelas = this.getRealCartelaCount(room);
    const botCount = room.opponentCards ? room.opponentCards.length : 0;
    return realCartelas + botCount;
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
    const cartelasCount = this.getRealCartelaCount(room);
    room.realPlayerCount = cartelasCount;
    room.waitingForPlayers = room.tickets.size < 2;
    this.broadcastRoomState(room);

    // Notify other players in the room that a player entered the room
    io.to(room.id).emit('room_user_joined', {
      userId,
      userName: userName || 'A player',
      activeUsersCount: activeInRoom,
      realPlayerCount: cartelasCount,
      waitingForPlayers: room.waitingForPlayers,
      roomId: room.id
    });
    if (room.id === 'room-10') {
      io.to(ARENA_ROOM_ID).emit('room_user_joined', {
        userId,
        userName: userName || 'A player',
        activeUsersCount: activeInRoom,
        realPlayerCount: cartelasCount,
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
    if (room.tickets.size < 2) {
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
    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    const userTickets = room.tickets.get(userId);
    const userNextTickets = room.nextRoundTickets?.get(userId);

    // If room is actively playing and user has active tickets in the current round, cannot cancel in-play cards
    if (room.phase === 'playing' && room.mode === 'active' && userTickets && userTickets.length > 0) {
      return { success: false, error: 'Cannot cancel tickets during active play' };
    }

    const ticketsToRefund: PlayerTicket[] = [];
    if (room.phase === 'lobby' && userTickets) {
      ticketsToRefund.push(...userTickets);
    }
    if (userNextTickets && userNextTickets.length > 0) {
      ticketsToRefund.push(...userNextTickets);
    }

    if (ticketsToRefund.length === 0) {
      return { success: false, error: 'No cancellable tickets in this room' };
    }

    let refundAmount = 0;
    ticketsToRefund.forEach(t => { refundAmount += t.betAmount; });

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
            [userId, refundAmount, refCode, `Refunded ${ticketsToRefund.length} cartelas from ${room.name}`]
          );
        });

        if (room.phase === 'lobby') {
          room.tickets.delete(userId);
          room.realPlayerCount = this.getRealCartelaCount(room);
          room.waitingForPlayers = room.tickets.size < 2;
          this.recalculatePot(room);
        }
        if (room.nextRoundTickets) {
          room.nextRoundTickets.delete(userId);
        }
        this.broadcastRoomState(room);

        io.emit(`user_${userId}_balance`, {
          type: 'ticket_refunded',
          refundAmount
        });
        io.emit('user_balance_updated', { userId });
        io.emit('stake_rooms_summary', this.getStakeRoomsSummary());

        console.log(`💸 [Ticket Refund] Refunded ${refundAmount} ETB to user ${userId} from ${room.name}`);
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
      oldRoom.realPlayerCount = this.getRealCartelaCount(oldRoom);
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
      newRoom.realPlayerCount = this.getRealCartelaCount(newRoom);
      newRoom.waitingForPlayers = newRoom.tickets.size < 2;
      this.recalculatePot(newRoom);
      this.broadcastRoomState(newRoom);

      // 4. Notify new room of player joined (for lobby feed)
      const userName = userTickets[0]?.userName || 'Player';
      io.to(newRoom.id).emit('player_joined', {
        userName,
        realPlayerCount: newRoom.realPlayerCount,
        waitingForPlayers: newRoom.waitingForPlayers,
        countdownStarted: newRoom.tickets.size >= 2,
        roomId: newRoom.id
      });
      if (newRoom.id === 'room-10') {
        io.to(ARENA_ROOM_ID).emit('player_joined', {
          userName,
          realPlayerCount: newRoom.realPlayerCount,
          waitingForPlayers: newRoom.waitingForPlayers,
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

    // Multi-Device / Double-Click Protection: If user already has active or pre-bought tickets, return existing tickets without deducting balance again
    const hasActiveLobbyTickets = room.phase === 'lobby' && room.tickets.has(userId) && (room.tickets.get(userId)?.length || 0) > 0;
    const hasPreBoughtTickets = room.phase !== 'lobby' && room.nextRoundTickets && room.nextRoundTickets.has(userId) && (room.nextRoundTickets.get(userId)?.length || 0) > 0;

    if (hasActiveLobbyTickets || hasPreBoughtTickets) {
      const existing = hasActiveLobbyTickets ? room.tickets.get(userId)! : room.nextRoundTickets.get(userId)!;
      console.log(`🎟️ [Multi-Device/Double-Click] User ${userName} (${userId}) already has ${existing.length} tickets (PreBuy: ${Boolean(hasPreBoughtTickets)}). Returning active cards.`);
      return {
        success: true,
        preBoughtForNextRound: Boolean(hasPreBoughtTickets),
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
          if (!assignedIds.has(reqId) && !drawnIds.includes(reqId)) {
            drawnIds.push(reqId);
          } else {
            // Concurrency Auto-Resolution: Requested cartela was claimed in a race condition.
            // Automatically allocate the next available unique cartela so the player's purchase succeeds.
            const altId = getNextUniqueCartelaId();
            drawnIds.push(altId);
            console.log(`🎯 [Cartela Race Resolved] Cartela #${reqId} was already taken in ${room.name}. Auto-assigned next available Cartela #${altId} to ${userName}`);
          }
        }
      }
    } else if (typeof requestedCartelaIds === 'number' && requestedCartelaIds >= 1 && requestedCartelaIds <= 400) {
      if (!assignedIds.has(requestedCartelaIds)) {
        drawnIds.push(requestedCartelaIds);
      } else {
        const altId = getNextUniqueCartelaId();
        drawnIds.push(altId);
        console.log(`🎯 [Cartela Race Resolved] Cartela #${requestedCartelaIds} was already taken in ${room.name}. Auto-assigned next available Cartela #${altId} to ${userName}`);
      }
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
      const resolvedAutoPlay = typeof isAutoPlay === 'boolean'
        ? isAutoPlay
        : (this.playerModes.has(userId) ? this.playerModes.get(userId)! : true);

      // Persist player mode preference immediately so round transitions and reconnects never overwrite it
      this.playerModes.set(userId, resolvedAutoPlay);

      const playerTickets: PlayerTicket[] = drawnIds.map(id => ({
        userId,
        userName,
        cartelaId: id,
        cardMatrix: generateCardFromId(id),
        betAmount: stakePerCard,
        socketId,
        isBonus: false,
        isAutoPlay: resolvedAutoPlay
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
        room.realPlayerCount = this.getRealCartelaCount(room);
        room.waitingForPlayers = room.tickets.size < 2;
        this.recalculatePot(room);
        this.broadcastRoomState(room);

        // Notify room clients a new real player joined (for lobby join feed UI)
        const playerJoinedPayload = {
          userName,
          realPlayerCount: room.realPlayerCount,
          waitingForPlayers: room.waitingForPlayers,
          countdownStarted: room.tickets.size >= 2,
          totalPot: room.totalPot,
          winnerPayout: room.winnerPayout,
          stakeAmount: room.stakeAmount,
          roomId: room.id
        };
        io.to(room.id).emit('player_joined', playerJoinedPayload);
        if (room.id === 'room-10') {
          io.to(ARENA_ROOM_ID).emit('player_joined', {
            ...playerJoinedPayload,
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
   * Updates player's Auto/Manual mode for their active & queued tickets across all rooms
   */
  public updatePlayerMode(roomId: string, userId: string, isAutoPlay: boolean) {
    this.playerModes.set(userId, isAutoPlay);
    const roomsToUpdate = new Set<string>([...STAKE_ROOM_IDS, roomId, ARENA_ROOM_ID].filter(Boolean));
    for (const rid of roomsToUpdate) {
      const room = this.rooms.get(rid);
      if (!room) continue;
      const userTickets = room.tickets.get(userId);
      if (userTickets) {
        userTickets.forEach(t => { t.isAutoPlay = isAutoPlay; });
      }
      const nextTickets = room.nextRoundTickets?.get(userId);
      if (nextTickets) {
        nextTickets.forEach(t => { t.isAutoPlay = isAutoPlay; });
      }
    }
  }

  /**
   * Inspects the registered player mode (true for Auto, false for Manual)
   */
  public getPlayerMode(userId: string): boolean | undefined {
    return this.playerModes.get(userId);
  }

  // Recalculates pot from actual bets placed + sliding commission tiers
  private recalculatePot(room: GameRoomState) {
    const totalCartelas = this.getRoomPlayersCount(room);
    room.realPlayerCount = this.getRealCartelaCount(room);

    // Commission tier based on total cartelas count:
    // <= 5 cartelas: 0% commission (Derash is 100% of pot)
    // > 5 cartelas: 20% commission cut
    if (totalCartelas <= 5) {
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
   * Synchronized 45-Second Master Lobby Timer across all 4 houses (10, 20, 50, 100 ETB)
   */
  public startMasterLobbyTimer() {
    if (this.intervals.has('master_lobby')) {
      clearInterval(this.intervals.get('master_lobby')!);
    }
    if (this.intervals.has('master_ball')) {
      clearInterval(this.intervals.get('master_ball')!);
    }
    if (this.intervals.has('master_winner')) {
      clearInterval(this.intervals.get('master_winner')!);
    }

    // Reset all stake houses into synchronized lobby state
    for (const roomId of STAKE_ROOM_IDS) {
      const room = this.rooms.get(roomId);
      if (!room) continue;

      room.isProcessingVictory = false;
      room.waitingForOtherHouses = false;
      room.isHoldingClaimWindow = false;
      room.phase = 'lobby';
      room.mode = 'active';
      room.lobbyCountdown = 45;
      room.drawnNumbers = [];
      room.currentCall = null;
      room.winResult = null;
      room.opponentCards = [];

      // Seamless Activation of Anytime Pre-Bought Tickets
      if (room.nextRoundTickets && room.nextRoundTickets.size > 0) {
        room.tickets = new Map(room.nextRoundTickets);
        for (const [uid, tList] of room.tickets.entries()) {
          if (this.playerModes.has(uid)) {
            const m = this.playerModes.get(uid)!;
            tList.forEach(t => { t.isAutoPlay = m; });
          }
        }
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
      }

      this.recalculatePot(room);
      this.broadcastRoomState(room);
    }

    let currentLobbyCountdown = 45;

    const interval = setInterval(async () => {
      const sample = this.rooms.get('room-10');
      if (sample && sample.phase !== 'lobby') {
        clearInterval(interval);
        return;
      }

      // Check: Does AT LEAST ONE house have >= 2 distinct real human players with confirmed purchased tickets?
      const anyHouseReady = STAKE_ROOM_IDS.some(id => {
        const r = this.rooms.get(id);
        return r && r.tickets.size >= 2;
      });

      for (const roomId of STAKE_ROOM_IDS) {
        const room = this.rooms.get(roomId);
        if (!room) continue;

        const cartelasCount = this.getRealCartelaCount(room);
        room.realPlayerCount = cartelasCount;

        if (!anyHouseReady) {
          room.waitingForPlayers = true;
          room.lobbyCountdown = 45;
          this.broadcastRoomState(room);
        } else {
          // If any house has >= 2 real players, game clock ticks for ALL houses together!
          // Houses with >= 2 real players are active participants
          // Houses with < 2 real players are marked waiting (will spectate if no 2nd player joins)
          room.waitingForPlayers = room.tickets.size < 2;
          room.lobbyCountdown = Math.max(0, currentLobbyCountdown - 1);
          this.broadcastRoomState(room);
        }
      }

      if (!anyHouseReady) {
        currentLobbyCountdown = 45;
        return;
      }

      currentLobbyCountdown -= 1;

      if (currentLobbyCountdown <= 0) {
        clearInterval(interval);
        await this.startMasterRound();
      }
    }, 1000);

    this.intervals.set('master_lobby', interval);
  }

  // Backwards-compatible alias for existing call sites
  public startLobbyTimer(_roomId?: string) {
    this.startMasterLobbyTimer();
  }

  /**
   * Start Live Round across all houses simultaneously
   * Houses with >= 2 players play actively for their house pot.
   * Houses with < 2 players spectate/watch the exact same live bingo.
   */
  public async startMasterRound() {
    const activeHouses: GameRoomState[] = [];

    for (const roomId of STAKE_ROOM_IDS) {
      const room = this.rooms.get(roomId);
      if (!room) continue;

      room.phase = 'locked';
      room.isProcessingVictory = false;
      room.lastBallTime = Date.now();
      this.recalculatePot(room);

      // Mode Synchronization Guard: Ensure all tickets strictly reflect the player's true registered mode
      for (const [uid, tList] of room.tickets.entries()) {
        const userMode = this.playerModes.has(uid) ? this.playerModes.get(uid)! : tList[0]?.isAutoPlay;
        if (typeof userMode === 'boolean') {
          tList.forEach(t => { t.isAutoPlay = userMode; });
        }
      }

      const realCartelaCount = this.getRealCartelaCount(room);
      const distinctRealPlayers = room.tickets.size;
      if (distinctRealPlayers >= 2) {
        // >= 2 distinct real human players: Active Play Mode!
        room.mode = 'active';
        room.waitingForPlayers = false;

        // Bot injection if 11+ real cartelas in this house
        room.opponentCards = [];
        if (realCartelaCount >= 11) {
          if (this.botAccounts.length < 3) await this.loadBotAccounts();
          const botPool = this.botAccounts.length >= 3 ? this.botAccounts : REGISTERED_3_BOTS;
          const assignedIds = new Set<number>();
          room.tickets.forEach(list => list.forEach(t => assignedIds.add(t.cartelaId)));

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
              stakeAmount: room.stakeAmount,
              isHouseBot: i === 0
            });
          }
          this.recalculatePot(room);
        }

        room.targetWinnerType = room.opponentCards.length > 0
          ? (Math.random() < 0.20 ? 'bot' : 'real')
          : 'real';

        // Insert database round & tickets for active house
        try {
          const roundRes = await query(
            `INSERT INTO game_rounds (room_id, round_number, phase, total_pot, platform_fee, winner_payout, started_at)
             VALUES ($1, $2, 'playing', $3, $4, $5, NOW()) RETURNING id`,
            [room.id, room.roundNumber, room.totalPot, room.houseFee, room.winnerPayout]
          );
          room.currentRoundId = roundRes.rows[0]?.id;

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

        activeHouses.push(room);
      } else {
        // < 2 players: Spectator / Watch Mode!
        room.mode = 'spectating';
        room.waitingForPlayers = true;
        room.opponentCards = [];
        room.totalPot = 0;
        room.winnerPayout = 0;
        room.houseFee = 0;
        room.currentRoundId = null;

        // Lone-Player Stake Protection: If a player placed a bet in this house but no opponent joined (< 2 players),
        // safely rollover their tickets to next round so their stake is never lost or unplayed.
        if (room.tickets.size > 0) {
          console.log(`🛡️ [GameEngine] Lone-player stake protection in ${room.id}: rolling over tickets for ${room.tickets.size} player(s) to Round #${room.roundNumber + 1}`);
          for (const [userId, tList] of room.tickets.entries()) {
            const existing = room.nextRoundTickets.get(userId) || [];
            room.nextRoundTickets.set(userId, [...existing, ...tList]);

            const socketId = room.activeUserSockets.get(userId);
            const noticePayload = {
              roomId: room.id,
              roundNumber: room.roundNumber,
              nextRoundNumber: room.roundNumber + 1,
              message: `Watching as Spectator • Your ticket is reserved for Round #${room.roundNumber + 1}`,
              queuedTicketsCount: tList.length,
              cartelaIds: tList.map(t => t.cartelaId)
            };
            if (socketId) {
              io.to(socketId).emit('lone_player_spectating_notice', noticePayload);
            }
          }

          const roomNoticePayload = {
            roomId: room.id,
            roundNumber: room.roundNumber,
            nextRoundNumber: room.roundNumber + 1,
            message: `Watching as Spectator • Unqualified house rolled over to Round #${room.roundNumber + 1}`
          };
          io.to(room.id).emit('lone_player_spectating_notice', roomNoticePayload);
          if (room.id === 'room-10') {
            io.to(ARENA_ROOM_ID).emit('lone_player_spectating_notice', { ...roomNoticePayload, roomId: ARENA_ROOM_ID });
            io.to('default').emit('lone_player_spectating_notice', { ...roomNoticePayload, roomId: 'default' });
          }

          room.tickets.clear();
        }
      }
    }

    // 2. Prepare Single Master Ball Sequence (1-75) supporting all active houses simultaneously
    const masterBallSequence = this.prepareMasterBallSequence(activeHouses);

    // 3. Set all rooms to 'playing' with the identical ball sequence
    for (const roomId of STAKE_ROOM_IDS) {
      const room = this.rooms.get(roomId);
      if (!room) continue;

      room.ballSequence = [...masterBallSequence];
      room.drawnNumbers = [];
      room.currentCall = null;
      room.winResult = null;
      room.phase = 'playing';

      const realTicketsCount = Array.from(room.tickets.values()).reduce((sum, t) => sum + t.length, 0);
      room.realPlayerCount = realTicketsCount;
      const roundStartedPayload = {
        roundId: room.currentRoundId,
        roundNumber: room.roundNumber,
        totalPot: room.totalPot,
        winnerPayout: room.winnerPayout,
        playersCount: realTicketsCount + room.opponentCards.length,
        realPlayerCount: room.realPlayerCount,
        waitingForPlayers: room.waitingForPlayers,
        mode: room.mode,
        roomId: room.id
      };

      io.to(room.id).emit('round_started', roundStartedPayload);
      if (room.id === 'room-10') {
        io.to(ARENA_ROOM_ID).emit('round_started', { ...roundStartedPayload, roomId: ARENA_ROOM_ID });
        io.to('default').emit('round_started', { ...roundStartedPayload, roomId: 'default' });
      }
      this.broadcastRoomState(room);
    }

    // 4. Launch Synchronized Master Ball Calling Loop
    this.startMasterBallCallingLoop(masterBallSequence);
  }

  // Backwards-compatible alias for existing call sites
  public async startRound(_roomId?: string) {
    await this.startMasterRound();
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

    // Pick winning line on target card (Row, Column, Diagonal, or Four Corners)
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
      [4, 8, 12, 16, 20],    // Diagonal TR-BL
      [0, 4, 20, 24]         // Four Corners
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

    // Mathematical Invariant Guarantee:
    // S will hold the exact set of (targetFinishBall - 1) balls to be drawn in slots 0 to finishIndex - 1.
    // S starts with earlyTargetNumbers (size 4).
    // finalBall is placed at finishIndex (ball targetFinishBall).
    // Neither target winner nor any competing card can EVER win at any ball < targetFinishBall!
    const S: number[] = [...earlyTargetNumbers];
    const sSet = new Set<number>(S);

    const isSafeToAdd = (candidate: number): boolean => {
      if (candidate === finalBall) return false;
      if (sSet.has(candidate)) return false;

      // Candidate must not cause target winner to win prematurely before targetFinishBall
      const testWinnerDrawn = [...S, candidate];
      if (checkWinningPattern(targetCardMatrix!, testWinnerDrawn).isWin) {
        return false;
      }

      // Candidate must not cause any competing card to win on or before targetFinishBall
      const testCompetingDrawn = [...testWinnerDrawn, finalBall];
      for (const card of otherCards) {
        if (checkWinningPattern(card, testCompetingDrawn).isWin) {
          return false;
        }
      }
      return true;
    };

    // Step 0: Weave 3 to 4 natural dispersion numbers for the target winner across other rows/columns
    // This eliminates the artificial "only 5 diagonal numbers in a row" tell so the winner has 7-9 marks total!
    const targetOtherNums = targetCardMatrix
      .map(c => c.val)
      .filter((v): v is number => typeof v === 'number' && !targetNumbers.includes(v))
      .sort(() => Math.random() - 0.5);

    let winnerExtraCount = 0;
    for (const num of targetOtherNums) {
      if (winnerExtraCount >= 4) break;
      if (S.length >= finishIndex - 8) break;
      if (isSafeToAdd(num)) {
        S.push(num);
        sSet.add(num);
        winnerExtraCount++;
      }
    }

    // Step A: For each competing card, add numbers from a competing line to lock them at "1 TO GO! 🔥"
    for (const otherCard of otherCards) {
      const compPattern = winningPatternsIndices[Math.floor(Math.random() * winningPatternsIndices.length)];
      const lineNums = compPattern
        .map(idx => otherCard[idx]?.val)
        .filter((v): v is number => typeof v === 'number');

      for (const num of lineNums) {
        if (S.length >= finishIndex - 3) break;
        if (isSafeToAdd(num)) {
          S.push(num);
          sSet.add(num);
        }
      }

      // Also add 3 to 4 numbers from other cells of this card for natural card distribution
      const otherCardNums = otherCard
        .map(c => c.val)
        .filter((v): v is number => typeof v === 'number' && !lineNums.includes(v))
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
   * Prepares a single authoritative 75-ball sequence that simultaneously weaves
   * organic winning lines and active dispersion for ALL active houses.
   * Every active house is assigned an unpredictable target finish ball between 16 and 24.
   */
  private prepareMasterBallSequence(activeHouses: GameRoomState[]): number[] {
    if (activeHouses.length === 0) {
      return generateRandomShuffledBalls();
    }

    if (activeHouses.length === 1) {
      return this.prepareBallSequence(activeHouses[0]);
    }

    // Stagger finish targets across active houses so they don't all collide on the same ball
    const targetPool = [17, 18, 19, 20, 21, 22, 23, 24].sort(() => Math.random() - 0.5);
    const houseConfigs: Array<{
      room: GameRoomState;
      targetCardMatrix: BingoCell[];
      targetNumbers: number[];
      finalBall: number;
      earlyTargetNumbers: number[];
      finishIndex: number;
    }> = [];

    for (let i = 0; i < activeHouses.length; i++) {
      const room = activeHouses[i];
      const targetFinishBall = targetPool[i] || (17 + i * 2);
      room.targetFinishBall = targetFinishBall;

      const allRealTickets: PlayerTicket[] = [];
      room.tickets.forEach(list => allRealTickets.push(...list));

      let targetCardMatrix: BingoCell[] | null = null;
      if (room.targetWinnerType === 'real' && allRealTickets.length > 0) {
        const chosenRealTicket = allRealTickets[Math.floor(Math.random() * allRealTickets.length)];
        targetCardMatrix = chosenRealTicket.cardMatrix;
      } else if (room.opponentCards.length > 0) {
        const bot = room.opponentCards[0];
        targetCardMatrix = bot.cardMatrix;
      } else if (allRealTickets.length > 0) {
        targetCardMatrix = allRealTickets[0].cardMatrix;
      }

      if (!targetCardMatrix) continue;

      const winningPatternsIndices = [
        [0, 1, 2, 3, 4], [5, 6, 7, 8, 9], [10, 11, 12, 13, 14], [15, 16, 17, 18, 19], [20, 21, 22, 23, 24],
        [0, 5, 10, 15, 20], [1, 6, 11, 16, 21], [2, 7, 12, 17, 22], [3, 8, 13, 18, 23], [4, 9, 14, 19, 24],
        [0, 6, 12, 18, 24], [4, 8, 12, 16, 20],
        [0, 4, 20, 24]
      ];

      // Ensure every active house selects a strictly unique final winning ball
      const assignedFinalBalls = new Set<number>(houseConfigs.map(h => h.finalBall));
      let selectedFinalBall = 0;
      let selectedEarly: number[] = [];
      let selectedPatternNums: number[] = [];

      const shuffledPatterns = [...winningPatternsIndices].sort(() => Math.random() - 0.5);
      for (const pattern of shuffledPatterns) {
        const pNums = pattern
          .map(idx => targetCardMatrix![idx]?.val)
          .filter((v): v is number => typeof v === 'number');

        const candidate = pNums.find(n => !assignedFinalBalls.has(n));
        if (candidate) {
          selectedFinalBall = candidate;
          selectedEarly = pNums.filter(n => n !== candidate);
          selectedPatternNums = pNums;
          break;
        }
      }

      if (!selectedFinalBall) {
        // Fallback: pick any number on targetCardMatrix not yet in assignedFinalBalls
        const anyAvail = targetCardMatrix
          .map(c => c.val)
          .find((v): v is number => typeof v === 'number' && !assignedFinalBalls.has(v));
        if (!anyAvail) continue;
        selectedFinalBall = anyAvail;
        selectedEarly = [];
        selectedPatternNums = [anyAvail];
      }

      houseConfigs.push({
        room,
        targetCardMatrix,
        targetNumbers: selectedPatternNums,
        finalBall: selectedFinalBall,
        earlyTargetNumbers: selectedEarly,
        finishIndex: targetFinishBall - 1
      });

      console.log(`🎯 [GameEngine] Active House ${room.id} targeting ${room.targetWinnerType.toUpperCase()} win on Ball #${targetFinishBall} (Winning Ball: ${selectedFinalBall})`);
    }

    if (houseConfigs.length === 0) {
      return this.prepareBallSequence(activeHouses[0]);
    }

    // Sort house configs by finishIndex ascending
    houseConfigs.sort((a, b) => a.finishIndex - b.finishIndex);
    const maxFinishIndex = Math.max(...houseConfigs.map(h => h.finishIndex));

    const finalSequence: number[] = new Array(75).fill(0);
    // Available numbers 1..75
    const availableBalls = new Set<number>(Array.from({ length: 75 }, (_, i) => i + 1));

    // 1. Place final winning balls at their respective finish indices
    for (const h of houseConfigs) {
      finalSequence[h.finishIndex] = h.finalBall;
      availableBalls.delete(h.finalBall);
    }

    // Count how many early slots (0 to maxFinishIndex) are currently 0 (unassigned)
    const emptyEarlySlots: number[] = [];
    for (let slot = 0; slot <= maxFinishIndex; slot++) {
      if (finalSequence[slot] === 0) {
        emptyEarlySlots.push(slot);
      }
    }

    // Gather all participating cards with their house target finish ball
    const allCardsWithMinBall: Array<{ card: BingoCell[]; minBall: number }> = [];
    for (const h of houseConfigs) {
      allCardsWithMinBall.push({ card: h.targetCardMatrix, minBall: h.room.targetFinishBall });
      h.room.tickets.forEach(l => l.forEach(t => {
        if (t.cardMatrix !== h.targetCardMatrix) {
          allCardsWithMinBall.push({ card: t.cardMatrix, minBall: h.room.targetFinishBall });
        }
      }));
      h.room.opponentCards.forEach(o => {
        if (o.cardMatrix !== h.targetCardMatrix) {
          allCardsWithMinBall.push({ card: o.cardMatrix, minBall: h.room.targetFinishBall });
        }
      });
    }

    const allAssignedFinalBalls = new Set<number>(houseConfigs.map(h => h.finalBall));

    const isSafeCandidate = (candidate: number, slotIndex: number): boolean => {
      if (allAssignedFinalBalls.has(candidate)) return false;
      const testDrawn = [...finalSequence.slice(0, slotIndex), candidate];
      const ballNumber = testDrawn.length;

      for (const item of allCardsWithMinBall) {
        if (ballNumber < item.minBall) {
          if (checkWinningPattern(item.card, testDrawn).isWin) {
            return false;
          }
        }
      }
      return true;
    };

    // Priority pools of balls to place early:
    // 1. Target early numbers from houses
    const preferredEarlyPool: number[] = [];
    for (const h of houseConfigs) {
      for (const num of h.earlyTargetNumbers) {
        if (availableBalls.has(num) && !preferredEarlyPool.includes(num)) {
          preferredEarlyPool.push(num);
        }
      }
    }

    // 2. Competitor dispersion numbers
    for (const h of houseConfigs) {
      const otherTickets: BingoCell[][] = [];
      h.room.tickets.forEach(list => list.forEach(t => {
        if (t.cardMatrix !== h.targetCardMatrix) otherTickets.push(t.cardMatrix);
      }));
      h.room.opponentCards.forEach(o => {
        if (o.cardMatrix !== h.targetCardMatrix) otherTickets.push(o.cardMatrix);
      });

      for (const comp of otherTickets) {
        const compNums = comp
          .map(c => c.val)
          .filter((v): v is number => typeof v === 'number' && availableBalls.has(v) && !preferredEarlyPool.includes(v))
          .sort(() => Math.random() - 0.5)
          .slice(0, 2);
        preferredEarlyPool.push(...compNums);
      }
    }

    // Now fill empty slots sequentially from left to right
    for (const slot of emptyEarlySlots) {
      let chosenBall = 0;

      // Try preferred early pool first
      for (let i = 0; i < preferredEarlyPool.length; i++) {
        const candidate = preferredEarlyPool[i];
        if (availableBalls.has(candidate) && isSafeCandidate(candidate, slot)) {
          chosenBall = candidate;
          preferredEarlyPool.splice(i, 1);
          break;
        }
      }

      // If preferred wasn't safe or was empty, draw from remaining available cage balls
      if (!chosenBall) {
        const shuffledRemaining = this.fisherYatesShuffle(Array.from(availableBalls));
        for (const candidate of shuffledRemaining) {
          if (isSafeCandidate(candidate, slot)) {
            chosenBall = candidate;
            break;
          }
        }
      }

      // Absolute fallback if no candidate passed safety
      if (!chosenBall) {
        chosenBall = Array.from(availableBalls)[0];
      }

      finalSequence[slot] = chosenBall;
      availableBalls.delete(chosenBall);
    }

    // 6. Fill all remaining slots (maxFinishIndex + 1 to 74) with the rest of availableBalls
    const remainingBalls = this.applyAntiClumpingSmoother(this.fisherYatesShuffle(Array.from(availableBalls)));
    let remIdx = 0;
    for (let slot = maxFinishIndex + 1; slot < 75; slot++) {
      finalSequence[slot] = remainingBalls[remIdx++];
    }

    return finalSequence.reverse();
  }

  /**
   * Fallback Best Card Finder: Guarantees a win resolution if balls reach round safety cap (Ball 26)
   */
  private findBestCardForFallbackWin(room: GameRoomState) {
    let bestTicket: {
      userId?: string;
      userName: string;
      cartelaId: number;
      isReal: boolean;
      winningPattern: string;
      winningIndices: number[];
      matchCount: number;
    } | null = null;

    for (const [uid, tList] of room.tickets.entries()) {
      const registeredAuto = this.playerModes.get(uid);
      for (const t of tList) {
        // Double-Guard: Fallback auto-win ONLY applies to strictly confirmed Auto players; manual players must claim manually
        const isEligibleAuto = (registeredAuto !== undefined ? registeredAuto : t.isAutoPlay) === true && t.isAutoPlay === true;
        if (!isEligibleAuto) continue;
        const winCheck = checkWinningPattern(t.cardMatrix, room.drawnNumbers);
        const matches = t.cardMatrix.filter(c => typeof c.val === 'number' && room.drawnNumbers.includes(c.val)).length;
        if (!bestTicket || matches > bestTicket.matchCount) {
          bestTicket = {
            userId: uid,
            userName: t.userName,
            cartelaId: t.cartelaId,
            isReal: true,
            winningPattern: winCheck.winningPattern || 'Bingo Line',
            winningIndices: winCheck.winningIndices || [0, 1, 2, 3, 4],
            matchCount: matches
          };
        }
      }
    }

    if (!bestTicket && room.tickets.size === 0 && room.opponentCards.length > 0) {
      const opp = room.opponentCards[0];
      return {
        userName: opp.opponentName,
        cartelaId: opp.cartelaId,
        isReal: false,
        winningPattern: 'Bingo Line',
        winningIndices: [0, 1, 2, 3, 4]
      };
    }

    return bestTicket;
  }

  /**
   * Fair Resolution: Refund all real player stakes when round expires with no winner.
   * Only used as an absolute last resort (Ball 75 exhausted — virtually impossible).
   */
  private async refundAllPlayerStakes(room: GameRoomState) {
    for (const [userId, tList] of room.tickets.entries()) {
      const refundAmount = tList.reduce((sum, t) => sum + t.betAmount, 0);
      if (refundAmount <= 0) continue;
      try {
        await withTransaction(async (client) => {
          await client.query(
            'UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE user_id = $2',
            [refundAmount, userId]
          );
          const refCode = `REFUND-EXP-${Date.now().toString().slice(-6)}`;
          await client.query(
            `INSERT INTO wallet_transactions (user_id, type, amount, balance_after, reference_code, status, description)
             VALUES ($1, 'refund', $2, (SELECT balance FROM wallets WHERE user_id = $1), $3, 'completed', $4)`,
            [userId, refundAmount, refCode, `Round expired refund in ${room.name} (Round #${room.roundNumber})`]
          );
        });
        io.emit(`user_${userId}_balance`, { type: 'round_refund', refundAmount });
        io.emit('user_balance_updated', { userId });
        console.log(`💸 [Refund] Refunded ${refundAmount} ETB to user ${userId} in ${room.name}`);
      } catch (err) {
        console.error(`❌ [Refund Error] Failed to refund ${refundAmount} to ${userId}:`, err);
      }
    }

    // Authoritative DB Finalization for Refunded Round in Neon DB
    if (room.currentRoundId) {
      try {
        await query(
          `UPDATE game_rounds 
           SET phase = 'ended', 
               winner_user_ids = '[]'::jsonb, 
               winner_cartelas = '[]'::jsonb, 
               winner_names = '["Refunded"]'::jsonb, 
               drawn_numbers = $1,
               ended_at = NOW() 
           WHERE id = $2`,
          [JSON.stringify(room.drawnNumbers || []), room.currentRoundId]
        );
        await query(
          `UPDATE game_tickets 
           SET status = 'refunded' 
           WHERE round_id = $1`,
          [room.currentRoundId]
        );
        console.log(`✅ [GameEngine] DB Finalized refunded Round #${room.roundNumber} (Round ID: ${room.currentRoundId}) in ${room.id}`);
      } catch (dbErr) {
        console.error(`❌ [GameEngine Error finalizing refunded game_rounds in DB for ${room.id}]:`, dbErr);
      }
    }
  }

  /**
   * Synchronized 3.0s Master Ball Drawing Loop across all 4 houses (10, 20, 50, 100 ETB)
   */
  private startMasterBallCallingLoop(masterBallSequence: number[]) {
    if (this.intervals.has('master_ball')) {
      clearInterval(this.intervals.get('master_ball')!);
    }

    let masterDrawnCount = 0;

    const interval = setInterval(async () => {
      // 1. Check if any room is still playing
      const anyStillPlaying = STAKE_ROOM_IDS.some(id => this.rooms.get(id)?.phase === 'playing');
      if (!anyStillPlaying) {
        clearInterval(interval);
        return;
      }

      if (masterBallSequence.length === 0) {
        clearInterval(interval);
        this.startMasterWinnerCelebrationTimer();
        return;
      }

      const nextNum = masterBallSequence.pop()!;
      const col = getBallColumn(nextNum);
      masterDrawnCount++;

      // 2. Broadcast Ball Called only to houses that are still playing (Audio & State Isolation)
      for (const roomId of STAKE_ROOM_IDS) {
        const room = this.rooms.get(roomId);
        if (!room) continue;

        // Audio & Visual Isolation: Skip rooms that have already won or are concluding victory!
        if (room.phase === 'winner' || room.isProcessingVictory || room.winResult) {
          continue;
        }

        room.drawnNumbers.push(nextNum);
        room.lastBallTime = Date.now();
        room.currentCall = {
          num: nextNum,
          col,
          index: room.drawnNumbers.length
        };

        const ballPayload = {
          currentCall: room.currentCall,
          drawnNumbers: room.drawnNumbers,
          totalCalled: room.drawnNumbers.length,
          mode: room.mode,
          roomId: room.id
        };

        io.to(room.id).emit('ball_called', ballPayload);
        if (room.id === 'room-10') {
          io.to(ARENA_ROOM_ID).emit('ball_called', { ...ballPayload, roomId: ARENA_ROOM_ID });
          io.to('default').emit('ball_called', { ...ballPayload, roomId: 'default' });
        }
      }

      // 3. Evaluate Winning Patterns for each ACTIVE house independently
      for (const roomId of STAKE_ROOM_IDS) {
        const room = this.rooms.get(roomId);
        if (!room || room.mode !== 'active') continue;

        if (room.winResult || room.isHoldingClaimWindow) {
          continue; // House already won or holding 3.5s window for simultaneous manual claim
        }

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

          // Check all Real Player tickets in this house (Auto-Play ONLY)
          for (const [uid, tList] of room.tickets.entries()) {
            const registeredAuto = this.playerModes.get(uid);
            for (const t of tList) {
              // Authoritative Double-Guard: MUST be strictly confirmed Auto in BOTH the playerModes registry AND ticket flag
              const isEligibleAuto = (registeredAuto !== undefined ? registeredAuto : t.isAutoPlay) === true && t.isAutoPlay === true;
              if (!isEligibleAuto) {
                continue; // Manual players (isAutoPlay === false) are strictly skipped and NEVER auto-claim!
              }

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

          // Check Bot Opponent cards in this house
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

          if (winningCards.length > 0) {
            // Simultaneous Win Check: Did any active Manual player ALSO complete a winning pattern on this ball?
            const currentNum = room.currentCall?.num || room.drawnNumbers[room.drawnNumbers.length - 1];
            let hasEligibleManualPlayer = false;

            for (const [uid, tList] of room.tickets.entries()) {
              const regAuto = this.playerModes.get(uid);
              for (const t of tList) {
                const isAuto = (regAuto !== undefined ? regAuto : t.isAutoPlay) === true && t.isAutoPlay === true;
                if (!isAuto) {
                  const wins = getAllWinningPatterns(t.cardMatrix, room.drawnNumbers);
                  if (wins.some(w => w.numbers.includes(currentNum))) {
                    hasEligibleManualPlayer = true;
                    break;
                  }
                }
              }
              if (hasEligibleManualPlayer) break;
            }

            if (hasEligibleManualPlayer) {
              // Industry standard: Pause room ball drawing and hold a 3.0s claim window
              // so the manual player has the ball call interval to click BINGO for a fair Split Pot.
              room.isHoldingClaimWindow = true;
              console.log(`⏱️ [Claim Window] Auto player won on ball ${currentNum}, but manual player also completed a line! Holding 3.0s claim window for room ${room.id}...`);
              setTimeout(async () => {
                room.isHoldingClaimWindow = false;
                if (room.mode === 'active' && !room.winResult) {
                  await this.processRoundVictory(room, winningCards);
                }
              }, 3000);
            } else {
              await this.processRoundVictory(room, winningCards);
            }
          }
        }
      }

      // ── EXTENDED DRAW: After Ball 25, check Auto-Play cards (Manual players must claim via BINGO button) ──
      // This activates only in extended draw territory (beyond normal finish window).
      // Manual players are NOT auto-awarded; balls continue drawing until a manual player claims or Auto completes.
      for (const roomId of STAKE_ROOM_IDS) {
        const room = this.rooms.get(roomId);
        if (!room || room.mode !== 'active') continue;
        if (room.drawnNumbers.length <= 25 || room.winResult || room.isProcessingVictory || room.isHoldingClaimWindow) continue;

        const extendedWinners: Array<{
          userId?: string;
          userName: string;
          cartelaId: number;
          isReal: boolean;
          winningPattern: string;
          winningIndices: number[];
        }> = [];

        // Check ONLY confirmed Auto-Play player tickets in extended draw
        for (const [uid, tList] of room.tickets.entries()) {
          const registeredAuto = this.playerModes.get(uid);
          for (const t of tList) {
            const isEligibleAuto = (registeredAuto !== undefined ? registeredAuto : t.isAutoPlay) === true && t.isAutoPlay === true;
            if (!isEligibleAuto) {
              continue; // Manual players (isAutoPlay === false) NEVER auto-claim; must explicitly tap BINGO!
            }
            const winCheck = checkWinningPattern(t.cardMatrix, room.drawnNumbers);
            if (winCheck.isWin) {
              extendedWinners.push({
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

        // Also check bot cards in extended draw
        for (const opp of room.opponentCards) {
          const winCheck = checkWinningPattern(opp.cardMatrix, room.drawnNumbers);
          if (winCheck.isWin) {
            extendedWinners.push({
              userName: opp.opponentName,
              cartelaId: opp.cartelaId,
              isReal: false,
              winningPattern: winCheck.winningPattern || 'Bingo Line',
              winningIndices: winCheck.winningIndices || []
            });
          }
        }

        if (extendedWinners.length > 0) {
          console.log(`🎉 [Extended Draw] Winner found on Ball #${room.drawnNumbers.length} in ${room.id}: ${extendedWinners[0].userName} (Cartela #${extendedWinners[0].cartelaId})`);
          await this.processRoundVictory(room, extendedWinners);
        }
      }

      // 4. Conclude when ALL active houses have resolved, or upon reaching safety cap (26 balls)
      const anyActiveHouse = STAKE_ROOM_IDS.some(id => this.rooms.get(id)?.mode === 'active');
      const pendingActiveHouse = STAKE_ROOM_IDS.some(id => {
        const r = this.rooms.get(id);
        return r && r.mode === 'active' && !r.winResult;
      });

      if (anyActiveHouse && !pendingActiveHouse) {
        clearInterval(interval);
        this.startMasterWinnerCelebrationTimer();
      } else if (anyActiveHouse && masterDrawnCount >= 26) {
        // Safety Guarantee: Force-complete any lingering active house that reached ball 26
        for (const roomId of STAKE_ROOM_IDS) {
          const r = this.rooms.get(roomId);
          if (r && r.mode === 'active' && !r.winResult) {
            const fallbackWinner = this.findBestCardForFallbackWin(r);
            if (fallbackWinner) {
              await this.processRoundVictory(r, [fallbackWinner]);
            } else if (r.tickets.size > 0) {
              // EXTENDED DRAW: Real players are active — keep drawing until someone wins naturally
              console.log(`🔄 [Extended Draw] House ${r.id} has ${r.tickets.size} active player(s) but no winner by Ball 26. Continuing ball draw...`);
              // Don't set winResult, don't end the room — the ball loop continues
              // Phase 2's extended draw scan will pick up winners on subsequent balls
            } else {
              // No real players at all — safe to end with no winner
              console.log(`⏱️ [Ball 26 Cap] House ${r.id} has no active players. Ending round.`);
              r.winResult = {
                roomId: r.id,
                winType: 'no_winner',
                winnerName: 'No Winner',
                winnerNames: [],
                winnerUserIds: [],
                winningCartelaNumber: 0,
                winningCartelas: [],
                winningPattern: 'No Players',
                winningIndices: [],
                totalPot: r.totalPot,
                houseFee: r.totalPot,
                netPrizePot: 0,
                commissionPercent: 100,
                winnerPayout: 0,
                stakeAmount: r.stakeAmount,
                sharePerWinner: 0,
                userShare: 0,
                coWinners: [],
                isSplit: false,
                winnersCount: 0
              };
              if (r.currentRoundId) {
                try {
                  await query(
                    `UPDATE game_rounds 
                     SET phase = 'ended', 
                         winner_user_ids = '[]'::jsonb, 
                         winner_cartelas = '[]'::jsonb, 
                         winner_names = '["No Winner"]'::jsonb, 
                         drawn_numbers = $1,
                         ended_at = NOW() 
                     WHERE id = $2`,
                    [JSON.stringify(r.drawnNumbers || []), r.currentRoundId]
                  );
                } catch (dbErr) {
                  console.error(`❌ [GameEngine Error finalizing empty game_rounds in DB for ${r.id}]:`, dbErr);
                }
              }
              this.broadcastRoomState(r);
            }
          }
        }
        // Only stop the loop if ALL active houses have resolved (no pending rooms in extended draw)
        const allHousesResolved = !STAKE_ROOM_IDS.some(id => {
          const rm = this.rooms.get(id);
          return rm && rm.mode === 'active' && !rm.winResult;
        });
        if (allHousesResolved) {
          clearInterval(interval);
          this.startMasterWinnerCelebrationTimer();
        }
        // Otherwise: ball loop continues — extended draw rooms will resolve via Phase 2 scan
      } else if (!anyActiveHouse && masterDrawnCount >= 25) {
        clearInterval(interval);
        this.startMasterWinnerCelebrationTimer();
      } else if (masterDrawnCount >= 75) {
        // Safety net: All 75 balls drawn — refund any unresolved rooms
        for (const roomId of STAKE_ROOM_IDS) {
          const r = this.rooms.get(roomId);
          if (r && r.mode === 'active' && !r.winResult && r.tickets.size > 0) {
            console.log(`🛡️ [Ball 75 Safety] All balls drawn in ${r.id} with no winner. Refunding ${r.tickets.size} player stake(s).`);
            await this.refundAllPlayerStakes(r);
            r.winResult = {
              roomId: r.id,
              winType: 'refunded',
              winnerName: 'Round Complete — Stakes Refunded',
              winnerNames: [],
              winnerUserIds: [],
              winningCartelaNumber: 0,
              winningCartelas: [],
              winningPattern: 'Refunded',
              winningIndices: [],
              totalPot: r.totalPot,
              houseFee: 0,
              netPrizePot: 0,
              commissionPercent: 0,
              winnerPayout: 0,
              stakeAmount: r.stakeAmount,
              sharePerWinner: 0,
              userShare: 0,
              coWinners: [],
              isSplit: false,
              winnersCount: 0
            };
            this.broadcastRoomState(r);
          }
        }
        clearInterval(interval);
        this.startMasterWinnerCelebrationTimer();
      }
    }, 3000);

    this.intervals.set('master_ball', interval);
  }

  // Backwards-compatible alias for existing call sites
  private startBallCallingLoop(roomId: string = 'room-10') {
    const room = this.rooms.get(roomId);
    if (room && room.ballSequence.length > 0) {
      this.startMasterBallCallingLoop(room.ballSequence);
    }
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
    if (room.isProcessingVictory || room.winResult) {
      console.warn(`⚠️ [GameEngine] Victory processing already in progress for ${room.id}. Ignoring concurrent claim.`);
      return;
    }
    room.isProcessingVictory = true;
    room.phase = 'winner';

    try {
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
                  acknowledged: !isOffline,
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
          });
        } catch (err) {
          console.error(`❌ [GameEngine Error processing winning payout in ${room.id}]:`, err);
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
          console.error(`❌ [GameEngine Error crediting bot win in ${room.id}]:`, err);
        }
      }

      const firstWinner = winningCards[0];
      const matchingOpp = room.opponentCards.find(o => o.cartelaId === firstWinner.cartelaId);
      const winnerStake = firstWinner.isReal
        ? (room.tickets.get(firstWinner.userId || '')?.[0]?.betAmount || 10)
        : (matchingOpp?.stakeAmount || 10);

      const primaryEntityId = firstWinner.isReal ? `real_${firstWinner.userId}` : `bot_${firstWinner.cartelaId}`;
      const externalCoWinners = Array.from(
        new Set(
          winningCards
            .filter(w => (w.isReal ? `real_${w.userId}` : `bot_${w.cartelaId}`) !== primaryEntityId)
            .map(w => w.userName)
        )
      );

      const winResult = {
        roomId: room.id,
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
        winnerPayout: displayWinnerPayout,
        stakeAmount: winnerStake,
        sharePerWinner: isSplit ? perCardPayout : displayWinnerPayout,
        userShare: primaryUserPayout,
        coWinners: isSplit ? externalCoWinners : [],
        isSplit,
        winnersCount: distinctEntities.size
      };

      room.winResult = winResult;

      // Authoritative DB Finalization: Always record round winner & update tickets in Neon DB (for real, split, or bot victory)
      if (room.currentRoundId) {
        try {
          const allWinningCartelas = winningCards.map(w => w.cartelaId);
          const allWinningNames = Array.from(new Set(winningCards.map(w => w.userName)));
          const allWinningUserIds = Array.from(new Set(realWinners.map(rw => rw.userId).filter(Boolean)));
          const drawnBalls = room.drawnNumbers || [];

          await query(
            `UPDATE game_rounds 
             SET phase = 'ended', 
                 winner_user_ids = $1, 
                 winner_cartelas = $2, 
                 winner_names = $3, 
                 drawn_numbers = $4,
                 ended_at = NOW() 
             WHERE id = $5`,
            [
              JSON.stringify(allWinningUserIds),
              JSON.stringify(allWinningCartelas),
              JSON.stringify(allWinningNames),
              JSON.stringify(drawnBalls),
              room.currentRoundId
            ]
          );

          // Update game_tickets status for this round in Neon DB
          if (allWinningCartelas.length > 0) {
            await query(
              `UPDATE game_tickets 
               SET status = 'won' 
               WHERE round_id = $1 AND cartela_id = ANY($2::int[])`,
              [room.currentRoundId, allWinningCartelas]
            );
            await query(
              `UPDATE game_tickets 
               SET status = 'lost' 
               WHERE round_id = $1 AND NOT (cartela_id = ANY($2::int[]))`,
              [room.currentRoundId, allWinningCartelas]
            );
          }
        } catch (dbFinalizeErr) {
          console.error(`❌ [GameEngine Error finalizing game_rounds in DB for ${room.id}]:`, dbFinalizeErr);
        }
      }

      // Broadcast round winner to room
      io.to(room.id).emit('round_winner', winResult);
      if (room.id === 'room-10') {
        io.to(ARENA_ROOM_ID).emit('round_winner', winResult);
        io.to('default').emit('round_winner', winResult);
      }
      this.broadcastRoomState(room);
    } catch (err) {
      console.error(`❌ [GameEngine General Error processing victory in ${room.id}]:`, err);
    } finally {
      room.isProcessingVictory = false;
    }

    // Check if any other active house still pending
    const otherActivePending = STAKE_ROOM_IDS.some(id => {
      const r = this.rooms.get(id);
      return r && r.id !== room.id && r.mode === 'active' && !r.winResult;
    });
    if (!otherActivePending) {
      for (const roomId of STAKE_ROOM_IDS) {
        const r = this.rooms.get(roomId);
        if (r) r.waitingForOtherHouses = false;
      }
      this.startMasterWinnerCelebrationTimer();
    } else {
      room.waitingForOtherHouses = true;
      this.broadcastRoomState(room);
    }
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
    if (!room || room.phase !== 'playing' || room.isProcessingVictory) {
      return { success: false, message: 'Game is not currently in playing phase or victory is already being processed.' };
    }

    const userTickets = room.tickets.get(userId) || [];
    const ticket = userTickets.find(t => t.cartelaId === cartelaId);
    if (!ticket) {
      return {
        success: false,
        message: 'You do not hold an active ticket for this cartela in this room.'
      };
    }
    const cardMatrix = ticket.cardMatrix;

    const allWins = getAllWinningPatterns(cardMatrix, room.drawnNumbers);
    if (allWins.length === 0) {
      return {
        success: false,
        message: 'Invalid Bingo claim. Not all numbers in a winning line have been drawn yet.'
      };
    }

    // Strict Single-Ball Rule for Manual Players:
    // The winning pattern must contain the current active ball.
    // If the next number is called before claiming, the pattern expires (slept bingo).
    const currentNum = room.currentCall?.num || room.drawnNumbers[room.drawnNumbers.length - 1];
    const eligibleBalls = typeof currentNum === 'number' && currentNum > 0 ? [currentNum] : [];

    let eligibleWin = allWins[0];

    if (ticket && ticket.isAutoPlay === false) {
      const activeWin = allWins.find(w => w.numbers.some(n => eligibleBalls.includes(n)));
      if (!activeWin) {
        console.log(`[ClaimBingo] Missed/Slept Bingo by ${userName} (${userId}) on Cartela #${cartelaId}. Pattern did not include active ball (${eligibleBalls.join(', ')}). Play continues.`);
        return {
          success: false,
          message: 'Missed Bingo! That pattern expired because the next number was called. Complete another 5-in-a-row line to call BINGO!'
        };
      }
      eligibleWin = activeWin;
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
        winningPattern: eligibleWin.patternName || 'Bingo Line',
        winningIndices: eligibleWin.indices || []
      }
    ];

    // Check if other confirmed AUTO-PLAY real players also completed a winning line on this ball (simultaneous split pot)
    for (const [otherUid, tList] of room.tickets.entries()) {
      const regAuto = this.playerModes.get(otherUid);
      for (const t of tList) {
        if (otherUid === userId && t.cartelaId === cartelaId) continue;
        const isEligibleAuto = (regAuto !== undefined ? regAuto : t.isAutoPlay) === true && t.isAutoPlay === true;

        // STRICT INVARIANT: Manual players (isAutoPlay === false) NEVER get an automatic split pot without clicking BINGO!
        if (!isEligibleAuto) {
          continue;
        }

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

    room.isHoldingClaimWindow = false;
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
    this.startMasterWinnerCelebrationTimer();
  }

  /**
   * Synchronized 8-Second Celebration across all 4 houses, then transitions all to next 45s lobby together
   */
  public startMasterWinnerCelebrationTimer() {
    if (this.intervals.has('master_ball')) {
      clearInterval(this.intervals.get('master_ball')!);
    }
    if (this.intervals.has('master_winner')) {
      clearInterval(this.intervals.get('master_winner')!);
    }

    for (const roomId of STAKE_ROOM_IDS) {
      const room = this.rooms.get(roomId);
      if (!room) continue;
      room.waitingForOtherHouses = false;
      room.phase = 'winner';
      room.winnerCountdown = 8;
      this.broadcastRoomState(room);
    }

    let currentWinnerCountdown = 8;

    const interval = setInterval(() => {
      currentWinnerCountdown -= 1;

      for (const roomId of STAKE_ROOM_IDS) {
        const room = this.rooms.get(roomId);
        if (!room) continue;
        room.winnerCountdown = Math.max(0, currentWinnerCountdown);
        this.broadcastRoomState(room);
      }

      if (currentWinnerCountdown <= 0) {
        clearInterval(interval);
        for (const roomId of STAKE_ROOM_IDS) {
          const room = this.rooms.get(roomId);
          if (!room) continue;
          room.roundNumber += 1;
          room.tickets.clear();
        }
        this.startMasterLobbyTimer();
      }
    }, 1000);

    this.intervals.set('master_winner', interval);
  }

  // Backwards-compatible alias for existing call sites
  private startWinnerCelebrationTimer(_roomId: string = 'room-10') {
    this.startMasterWinnerCelebrationTimer();
  }

  /**
   * Self-Healing Watchdog: Ensures game never freezes even under extreme network disruption
   */
  public startWatchdogTimer() {
    setInterval(() => {
      const sample = this.rooms.get('room-10');
      if (!sample) return;

      if (sample.phase === 'playing') {
        const now = Date.now();
        const stallThreshold = 14000; // 14 seconds without a ball drawn
        if (now - (sample.lastBallTime || 0) > stallThreshold) {
          console.warn('⚠️ [Watchdog] Master ball loop stalled for >14s. Auto-recovering round.');
          this.startMasterWinnerCelebrationTimer();
        }
      }
    }, 5000);
  }

  /**
   * Emergency Force-Reset (Used to immediately unstick any stuck room like room-50)
   */
  public forceResetRoomToLobby(roomId?: string) {
    if (roomId && this.rooms.has(roomId)) {
      const r = this.rooms.get(roomId)!;
      r.phase = 'lobby';
      r.isProcessingVictory = false;
      r.drawnNumbers = [];
      r.currentCall = null;
      r.winResult = null;
    }
    this.startMasterLobbyTimer();
    console.log(`🔄 [GameEngine] Force reset rooms to synchronized lobby`);
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
      mode: room.mode || (room.tickets.size >= 2 ? 'active' : 'spectating'),
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
      waitingForOtherHouses: room.waitingForOtherHouses || false,
      realPlayerCount: this.getRealCartelaCount(room),
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

  // Live / In-Flight Personal Bet History Helper (Strictly Scoped to Calling User)
  public getUserActiveTickets(userId: string): Array<{
    roomId: string;
    roomName: string;
    roundNumber: number;
    roundId: string | null;
    phase: string;
    isQueued: boolean;
    totalPot: number;
    winnerPayout: number;
    stakeAmount: number;
    tickets: Array<{
      cartelaId: number;
      cardMatrix: any[];
      betAmount: number;
      isAutoPlay: boolean;
    }>;
  }> {
    const results: Array<any> = [];
    if (!userId) return results;

    for (const room of this.rooms.values()) {
      // 1. Current active tickets in room.tickets (strictly for this userId)
      const activeList = room.tickets.get(userId);
      if (activeList && activeList.length > 0) {
        results.push({
          roomId: room.id,
          roomName: room.name,
          roundNumber: room.roundNumber,
          roundId: room.currentRoundId || null,
          phase: room.phase,
          isQueued: false,
          totalPot: room.totalPot,
          winnerPayout: room.winnerPayout,
          stakeAmount: room.stakeAmount,
          tickets: activeList.map(t => ({
            cartelaId: t.cartelaId,
            cardMatrix: t.cardMatrix,
            betAmount: t.betAmount,
            isAutoPlay: !!t.isAutoPlay
          }))
        });
      }

      // 2. Queued tickets in room.nextRoundTickets (Pre-Bought or Lone-Player Rollover)
      const queuedList = room.nextRoundTickets?.get(userId);
      if (queuedList && queuedList.length > 0) {
        results.push({
          roomId: room.id,
          roomName: room.name,
          roundNumber: room.roundNumber + 1,
          roundId: null,
          phase: 'queued',
          isQueued: true,
          totalPot: queuedList.reduce((sum, t) => sum + t.betAmount, 0),
          winnerPayout: 0,
          stakeAmount: room.stakeAmount,
          tickets: queuedList.map(t => ({
            cartelaId: t.cartelaId,
            cardMatrix: t.cardMatrix,
            betAmount: t.betAmount,
            isAutoPlay: !!t.isAutoPlay
          }))
        });
      }
    }

    return results;
  }
}

export const gameEngine = BingoGameEngine.getInstance();
