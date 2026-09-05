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
  cartelaId: number;
  cardMatrix: BingoCell[];
  opponentName: string;
  isHouseBot?: boolean;
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
  tickets: Map<string, PlayerTicket[]>; // userId -> tickets[]
  activeSockets: Set<string>;
  winResult: any | null;
  opponentCards: OpponentCard[];
  targetWinnerType: 'owner' | 'bot' | 'real';
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

const ETHIOPIAN_LAST_INITIALS = [
  'B.', 'T.', 'M.', 'W.', 'G.', 'A.', 'K.', 'D.', 'H.', 'N.',
  'Y.', 'Z.', 'F.', 'S.', 'L.', 'R.', 'P.', 'C.', 'E.', 'J.'
];

function generate200BotNames(): string[] {
  const names: string[] = [];
  for (const fn of ETHIOPIAN_FIRST_NAMES) {
    for (const ln of ETHIOPIAN_LAST_INITIALS) {
      names.push(`${fn} ${ln}`);
      if (names.length >= 260) break;
    }
    if (names.length >= 260) break;
  }
  return names;
}

const GLOBAL_BOT_POOL = generate200BotNames();

class BingoGameEngine {
  private static instance: BingoGameEngine;
  private rooms: Map<string, GameRoomState> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  // Configurable Win Allocation Rates (Default: 20% Owner, 30% Fake Bot, 50% Real Player)
  private ownerWinRate: number = 20;
  private botWinRate: number = 30;
  private realPlayerWinRate: number = 50;

  private constructor() {
    this.initializeRooms();
  }

  public static getInstance(): BingoGameEngine {
    if (!BingoGameEngine.instance) {
      BingoGameEngine.instance = new BingoGameEngine();
    }
    return BingoGameEngine.instance;
  }

  private initializeRooms() {
    // Exact client stakes: 10, 20, 50, 100 ETB
    const defaultRooms = [
      { id: 'room-10', name: '10 Birr Room', stake: 10.0, commission: 10.0 },
      { id: 'room-20', name: '20 Birr Room', stake: 20.0, commission: 10.0 },
      { id: 'room-50', name: '50 Birr Room', stake: 50.0, commission: 10.0 },
      { id: 'room-100', name: '100 Birr VIP Room', stake: 100.0, commission: 10.0 }
    ];

    for (const r of defaultRooms) {
      const roomState: GameRoomState = {
        id: r.id,
        name: r.name,
        stakeAmount: r.stake,
        commissionPercent: r.commission, // 10% default
        commissionEnabled: true,        // Admin toggleable
        phase: 'lobby',
        lobbyCountdown: 45,             // 45-second gap between each play
        winnerCountdown: 8,
        currentRoundId: null,
        roundNumber: 1,
        drawnNumbers: [],
        ballSequence: [],
        currentCall: null,
        totalPot: 50 * r.stake,          // 50-player capacity pot
        winnerPayout: 50 * r.stake * 0.9,
        houseFee: 50 * r.stake * 0.1,
        tickets: new Map(),
        activeSockets: new Set(),
        winResult: null,
        opponentCards: [],
        targetWinnerType: 'real'
      };

      this.rooms.set(r.id, roomState);
      this.startLobbyTimer(r.id);
    }
  }

  public getRoom(roomId: string): GameRoomState | undefined {
    return this.rooms.get(roomId);
  }

  public getAllRooms() {
    return Array.from(this.rooms.values()).map(r => ({
      id: r.id,
      name: r.name,
      stakeAmount: r.stakeAmount,
      phase: r.phase,
      lobbyCountdown: r.lobbyCountdown,
      playersCount: this.getRoomPlayersCount(r),
      totalPot: r.totalPot,
      winnerPayout: r.winnerPayout
    }));
  }

  public getRoomPlayersCount(room: GameRoomState): number {
    if (room.phase === 'playing' || room.phase === 'locked') {
      return 50; // Always 50 players active during a live round
    }
    const realTickets = room.tickets.size;
    const connected = room.activeSockets.size;
    return Math.min(50, Math.max(realTickets, connected, 12));
  }

  // Admin Controls: System Lock (House Commission)
  public setHouseCommission(enabled: boolean, rate?: number) {
    this.rooms.forEach(room => {
      room.commissionEnabled = enabled;
      if (typeof rate === 'number') {
        room.commissionPercent = rate;
      }
      this.recalculatePot(room);
      this.broadcastRoomState(room);
    });
  }

  // Admin Controls: Win Distribution Rates
  public setWinRates(ownerRate: number, botRate: number, realRate: number) {
    this.ownerWinRate = ownerRate;
    this.botWinRate = botRate;
    this.realPlayerWinRate = realRate;
  }

  public handleJoinRoom(socketId: string, roomId: string, userId?: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.activeSockets.add(socketId);
    this.broadcastRoomState(room);
  }

  public handleLeaveRoom(socketId: string, roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.activeSockets.delete(socketId);
    this.broadcastRoomState(room);
  }

  /**
   * 100% System-Assigned Ticket Purchase
   * Players can choose 1 or 2 cartelas.
   * If buying 2 cartelas, the system automatically awards the 3rd Cartela for FREE!
   */
  public async handleBuyTicket(
    userId: string,
    userName: string,
    roomId: string,
    requestedCartelaIds: number[] | number,
    socketId: string
  ): Promise<{ success: boolean; error?: string; tickets?: PlayerTicket[]; remainingBalance?: number }> {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    if (room.phase === 'winner') {
      return { success: false, error: 'Round is concluding. Next round starts in a few seconds.' };
    }

    if (room.phase === 'playing' && room.drawnNumbers.length > 55) {
      return { success: false, error: 'Round is almost over. Please wait for the next 45s lobby.' };
    }

    // Determine quantity requested (1 or 2 cards)
    let quantity = 1;
    if (Array.isArray(requestedCartelaIds)) {
      quantity = Math.max(1, Math.min(2, requestedCartelaIds.length));
    } else if (typeof requestedCartelaIds === 'number') {
      quantity = Math.max(1, Math.min(2, requestedCartelaIds));
    }

    const totalCost = quantity * room.stakeAmount;

    // Collect already assigned Cartela IDs in this room to ensure unique cards
    const assignedIds = new Set<number>();
    room.tickets.forEach(list => list.forEach(t => assignedIds.add(t.cartelaId)));

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

        const refCode = `BET-${roomId.toUpperCase()}-${Date.now().toString().slice(-6)}`;
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
        betAmount: idx === 2 ? 0 : room.stakeAmount, // 3rd card is FREE bonus
        socketId,
        isBonus: idx === 2
      }));

      room.tickets.set(userId, playerTickets);

      // If purchased during active round, save directly to game_tickets
      if (room.currentRoundId) {
        for (const t of playerTickets) {
          await query(
            `INSERT INTO game_tickets (round_id, user_id, cartela_id, card_matrix, bet_amount, status)
             VALUES ($1, $2, $3, $4, $5, 'active')`,
            [room.currentRoundId, userId, t.cartelaId, JSON.stringify(t.cardMatrix), t.betAmount]
          ).catch(err => console.error('Error inserting live ticket:', err));
        }
      }

      this.recalculatePot(room);
      this.broadcastRoomState(room);

      return {
        success: true,
        tickets: playerTickets,
        remainingBalance: result.newReal + result.newBonus
      };
    } catch (error: any) {
      return { success: false, error: error.message || 'Ticket purchase failed' };
    }
  }

  // 50-Player Pot Calculation
  private recalculatePot(room: GameRoomState) {
    room.totalPot = 50 * room.stakeAmount;
    room.houseFee = room.commissionEnabled ? room.totalPot * (room.commissionPercent / 100) : 0;
    room.winnerPayout = room.totalPot - room.houseFee;
  }

  /**
   * 45-Second Gap Between Games (Lobby Timer)
   */
  private startLobbyTimer(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.phase = 'lobby';
    room.lobbyCountdown = 45; // 45 seconds gap
    room.drawnNumbers = [];
    room.currentCall = null;
    room.winResult = null;
    this.recalculatePot(room);

    if (this.intervals.has(roomId)) {
      clearInterval(this.intervals.get(roomId)!);
    }

    const interval = setInterval(async () => {
      if (room.phase !== 'lobby') {
        clearInterval(interval);
        return;
      }

      room.lobbyCountdown -= 1;
      this.broadcastRoomState(room);

      if (room.lobbyCountdown <= 0) {
        clearInterval(interval);
        await this.startRound(roomId);
      }
    }, 1000);

    this.intervals.set(roomId, interval);
  }

  /**
   * Start 50-Player Live Round with Bot Backfilling and Outcome Routing
   */
  private async startRound(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

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

    // 2. 50-Player Dynamic Bot Backfilling ($50 - R$ bots)
    const botsNeeded = Math.max(0, 50 - realTicketsCount);
    room.opponentCards = [];

    // Shuffle and sample bots from the 200+ roster
    const shuffledBotNames = [...GLOBAL_BOT_POOL].sort(() => 0.5 - Math.random());

    for (let i = 0; i < botsNeeded; i++) {
      let botCartelaId = Math.floor(1 + Math.random() * 400);
      while (assignedIds.has(botCartelaId)) {
        botCartelaId = Math.floor(1 + Math.random() * 400);
      }
      assignedIds.add(botCartelaId);

      const botName = shuffledBotNames[i % shuffledBotNames.length] || `Player ${i + 1}`;
      room.opponentCards.push({
        cartelaId: botCartelaId,
        cardMatrix: generateCardFromId(botCartelaId),
        opponentName: botName,
        isHouseBot: i === 0 // 1st bot can act as designated house bot
      });
    }

    // 3. Tri-Tier Win Rate Routing (20% Owner / 30% Bot / 50% Real Player)
    const roll = Math.random() * 100;
    const hasRealPlayers = realTicketsCount > 0;

    if (hasRealPlayers) {
      if (roll < this.ownerWinRate) {
        room.targetWinnerType = 'owner';
      } else if (roll < this.ownerWinRate + this.botWinRate) {
        room.targetWinnerType = 'bot';
      } else {
        room.targetWinnerType = 'real';
      }
    } else {
      room.targetWinnerType = roll < 40 ? 'owner' : 'bot';
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

    // Broadcast Round Started
    io.to(roomId).emit('round_started', {
      roundId: room.currentRoundId,
      roundNumber: room.roundNumber,
      totalPot: room.totalPot,
      winnerPayout: room.winnerPayout,
      playersCount: 50
    });

    // Start 3.5s Ball Drawing Loop
    this.startBallCallingLoop(roomId);
  }

  /**
   * Prepares 75-Ball sequence ensuring targeted category completes naturally around ball 32-38
   */
  private prepareBallSequence(room: GameRoomState): number[] {
    const baseBalls = generateRandomShuffledBalls();

    let targetCardMatrix: BingoCell[] | null = null;
    if (room.targetWinnerType === 'real' && room.tickets.size > 0) {
      const firstRealUserTickets = Array.from(room.tickets.values())[0];
      if (firstRealUserTickets && firstRealUserTickets.length > 0) {
        targetCardMatrix = firstRealUserTickets[0].cardMatrix;
      }
    } else if (room.opponentCards.length > 0) {
      targetCardMatrix = room.opponentCards[0].cardMatrix;
    }

    if (!targetCardMatrix) return baseBalls;

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

    // Place target numbers across balls 12 through 34 so BINGO occurs around ball 32-35
    const otherBalls = baseBalls.filter(b => !targetNumbers.includes(b));
    const finalSequence: number[] = [];

    // Distribute target numbers smoothly
    const insertPositions = [12, 18, 24, 30, 34];
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
  private startBallCallingLoop(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    if (this.intervals.has(roomId)) {
      clearInterval(this.intervals.get(roomId)!);
    }

    const interval = setInterval(async () => {
      if (room.phase !== 'playing') {
        clearInterval(interval);
        return;
      }

      if (room.ballSequence.length === 0) {
        clearInterval(interval);
        this.finishRoundWithoutWinner(roomId);
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

      // Broadcast Ball Called event
      io.to(roomId).emit('ball_called', {
        currentCall: room.currentCall,
        drawnNumbers: room.drawnNumbers,
        totalCalled: room.drawnNumbers.length
      });

      // Evaluate Winning Patterns on each ball drawn (after min 20 balls)
      if (room.drawnNumbers.length >= 20) {
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

    this.intervals.set(roomId, interval);
  }

  /**
   * Process Round Victory & Split Pot Distribution
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
    room.phase = 'winner';

    const winnerCount = winningCards.length;
    const sharePerWinner = Math.floor(room.winnerPayout / winnerCount);
    const realWinners = winningCards.filter(w => w.isReal);
    const isSplit = winnerCount > 1;

    // Credit all winning real players atomically via Neon PostgreSQL
    if (realWinners.length > 0) {
      try {
        await withTransaction(async (client) => {
          for (const rw of realWinners) {
            if (!rw.userId) continue;

            const walletRes = await client.query(
              'SELECT balance FROM wallets WHERE user_id = $1 FOR UPDATE',
              [rw.userId]
            );

            if (walletRes.rows.length > 0) {
              const currentBal = parseFloat(walletRes.rows[0].balance || '0');
              const newBal = currentBal + sharePerWinner;

              await client.query(
                'UPDATE wallets SET balance = $1, updated_at = NOW() WHERE user_id = $2',
                [newBal, rw.userId]
              );

              const winRef = `WIN-${room.id.toUpperCase()}-${Date.now().toString().slice(-6)}`;
              await client.query(
                `INSERT INTO wallet_transactions (user_id, type, amount, balance_after, reference_code, status, payment_method, description)
                 VALUES ($1, 'win', $2, $3, $4, 'completed', 'in_game', $5)`,
                [
                  rw.userId,
                  sharePerWinner,
                  newBal,
                  winRef,
                  isSplit
                    ? `Split Pot Winner (1 of ${winnerCount}) in ${room.name} (Cartela #${rw.cartelaId})`
                    : `Bingo Solo Winner in ${room.name} (Cartela #${rw.cartelaId})`
                ]
              );

              io.emit(`user_${rw.userId}_balance`, {
                type: 'bingo_win',
                amount: sharePerWinner,
                newBalance: newBal
              });
            }
          }

          // Update game_rounds in Neon DB
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
                JSON.stringify(realWinners.map(rw => rw.userId)),
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

    const firstWinner = winningCards[0];
    const winResult = {
      winType: isSplit
        ? (realWinners.length > 0 ? 'user_split' : 'opponent_win')
        : (firstWinner.isReal ? 'user_solo' : 'opponent_win'),
      winnerId: firstWinner.userId || `bot_${firstWinner.cartelaId}`,
      winnerName: firstWinner.userName,
      winnerNames: winningCards.map(w => w.userName),
      winningCartelaNumber: firstWinner.cartelaId,
      winningCartelas: winningCards.map(w => w.cartelaId),
      winningPattern: firstWinner.winningPattern,
      winningIndices: firstWinner.winningIndices,
      totalPot: room.totalPot,
      winnerPayout: room.winnerPayout,
      sharePerWinner,
      userShare: realWinners.length > 0 ? sharePerWinner : 0,
      coWinners: winningCards.map(w => w.userName),
      isSplit,
      winnersCount: winnerCount
    };

    room.winResult = winResult;

    // Broadcast round winner to all clients in the room
    io.to(room.id).emit('round_winner', winResult);

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
    const room = this.rooms.get(roomId);
    if (!room || room.phase !== 'playing') {
      return { success: false, message: 'Game is not currently in playing phase.' };
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

    // Stop ball calling interval immediately
    if (this.intervals.has(roomId)) {
      clearInterval(this.intervals.get(roomId)!);
    }

    // Trigger full victory processing
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

  private finishRoundWithoutWinner(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.phase = 'winner';
    io.to(roomId).emit('round_ended_no_winner', { totalPot: room.totalPot });
    this.startWinnerCelebrationTimer(roomId);
  }

  private startWinnerCelebrationTimer(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.winnerCountdown = 8;
    const interval = setInterval(() => {
      room.winnerCountdown -= 1;
      this.broadcastRoomState(room);

      if (room.winnerCountdown <= 0) {
        clearInterval(interval);
        room.roundNumber += 1;
        room.tickets.clear();
        this.startLobbyTimer(roomId); // Transition to 45s lobby
      }
    }, 1000);
  }

  public broadcastRoomState(room: GameRoomState) {
    io.to(room.id).emit('room_state', {
      roomId: room.id,
      phase: room.phase,
      lobbyCountdown: room.lobbyCountdown,
      winnerCountdown: room.winnerCountdown,
      playersCount: this.getRoomPlayersCount(room),
      totalPot: room.totalPot,
      winnerPayout: room.winnerPayout,
      stakeAmount: room.stakeAmount,
      drawnNumbersCount: room.drawnNumbers.length,
      currentCall: room.currentCall,
      winResult: room.winResult
    });
  }
}

export const gameEngine = BingoGameEngine.getInstance();
