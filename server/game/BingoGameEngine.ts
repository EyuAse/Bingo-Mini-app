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
}

export interface OpponentCard {
  cartelaId: number;
  cardMatrix: BingoCell[];
  opponentName: string;
}

export interface GameRoomState {
  id: string;
  name: string;
  stakeAmount: number;
  commissionPercent: number;
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
}

// Realistic Ethiopian names for simulated opponents
const ETHIOPIAN_NAMES = [
  'Abebe K.', 'Kebede M.', 'Tigist A.', 'Hanna B.', 'Dawit T.',
  'Meseret W.', 'Solomon G.', 'Bethlehem H.', 'Yonas D.', 'Sara M.',
  'Kidane F.', 'Mulu A.', 'Tadesse B.', 'Almaz G.', 'Girma S.',
  'Aster T.', 'Yared K.', 'Tsion D.', 'Henok M.', 'Selamawit B.',
  'Dereje A.', 'Firehiwot G.', 'Mulugeta T.', 'Rahel K.', 'Tesfaye W.',
  'Birtukan S.', 'Amanuel D.', 'Hiwot M.', 'Bekele A.', 'Meron T.',
  'Eyasu G.', 'Genet K.', 'Nahom B.', 'Tigist D.', 'Yohannes A.'
];

class BingoGameEngine {
  private static instance: BingoGameEngine;
  private rooms: Map<string, GameRoomState> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();


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
    const defaultRooms = [
      { id: 'room-10', name: '10 Birr Room', stake: 10.0, commission: 15.0 },
      { id: 'room-25', name: '25 Birr Room', stake: 25.0, commission: 15.0 },
      { id: 'room-50', name: '50 Birr Room', stake: 50.0, commission: 15.0 },
      { id: 'room-100', name: '100 Birr VIP Room', stake: 100.0, commission: 15.0 }
    ];

    for (const r of defaultRooms) {
      const roomState: GameRoomState = {
        id: r.id,
        name: r.name,
        stakeAmount: r.stake,
        commissionPercent: r.commission,
        phase: 'lobby',
        lobbyCountdown: 20,
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
        activeSockets: new Set(),
        winResult: null,
        opponentCards: []
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
      totalPot: r.totalPot
    }));
  }

  private getRoomPlayersCount(room: GameRoomState): number {
    const ticketHolders = room.tickets.size;
    const connectedUsers = room.activeSockets.size;
    return Math.max(ticketHolders, connectedUsers, 1);
  }

  /**
   * Handle Player Joining Room
   */
  public handleJoinRoom(socketId: string, roomId: string, userId?: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.activeSockets.add(socketId);
    this.broadcastRoomState(room);
  }

  /**
   * Handle Player Leaving Room
   */
  public handleLeaveRoom(socketId: string, roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.activeSockets.delete(socketId);
    this.broadcastRoomState(room);
  }

  /**
   * Player Buys Tickets for Active/Next Round
   */
  public async handleBuyTicket(
    userId: string,
    userName: string,
    roomId: string,
    cartelaIds: number[],
    socketId: string
  ): Promise<{ success: boolean; error?: string; tickets?: PlayerTicket[]; remainingBalance?: number }> {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    if (room.phase === 'winner') {
      return { success: false, error: 'Round is concluding. Next round starts in 5 seconds.' };
    }

    if (room.phase === 'playing' && room.drawnNumbers.length > 55) {
      return { success: false, error: 'Round is almost over. Please wait for the next lobby.' };
    }

    const totalCost = cartelaIds.length * room.stakeAmount;

    try {
      // Deduct balance and/or bonus atomically from Neon DB
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

        // Deduct from bonus first, then real balance
        const deductFromBonus = Math.min(bonusBal, totalCost);
        const deductFromReal = totalCost - deductFromBonus;

        const newReal = realBal - deductFromReal;
        const newBonus = bonusBal - deductFromBonus;

        await client.query(
          'UPDATE wallets SET balance = $1, bonus = $2, updated_at = NOW() WHERE user_id = $3',
          [newReal, newBonus, userId]
        );

        // Record bet transaction
        const refCode = `BET-${roomId.toUpperCase()}-${Date.now().toString().slice(-6)}`;
        await client.query(
          `INSERT INTO wallet_transactions (user_id, type, amount, balance_after, reference_code, status, description)
           VALUES ($1, 'bet', $2, $3, $4, 'completed', $5)`,
          [userId, totalCost, newReal + newBonus, refCode, `Purchased ${cartelaIds.length} cards in ${room.name}`]
        );

        return { newReal, newBonus };
      });

      // Notify user's balance bar immediately
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
      const playerTickets: PlayerTicket[] = cartelaIds.map(id => ({
        userId,
        userName,
        cartelaId: id,
        cardMatrix: generateCardFromId(id),
        betAmount: room.stakeAmount,
        socketId
      }));

      room.tickets.set(userId, playerTickets);

      // If purchased during active round, save to game_tickets table
      if (room.currentRoundId) {
        for (const t of playerTickets) {
          await query(
            `INSERT INTO game_tickets (round_id, user_id, cartela_id, card_matrix, bet_amount, status)
             VALUES ($1, $2, $3, $4, $5, 'active')`,
            [room.currentRoundId, userId, t.cartelaId, JSON.stringify(t.cardMatrix), t.betAmount]
          ).catch(err => console.error('Error inserting live ticket:', err));
        }
      }

      // Recalculate Pot
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

  private recalculatePot(room: GameRoomState) {
    let totalTicketsCount = 0;
    room.tickets.forEach(tList => {
      totalTicketsCount += tList.length;
    });

    // If 1 real player is practicing, guarantee standard payout
    const minCalculatedTickets = Math.max(totalTicketsCount, 4);
    room.totalPot = minCalculatedTickets * room.stakeAmount;
    room.houseFee = room.totalPot * (room.commissionPercent / 100);
    room.winnerPayout = room.totalPot - room.houseFee;
  }

  /**
   * Lobby Countdown Timer (20s)
   */
  private startLobbyTimer(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.phase = 'lobby';
    room.lobbyCountdown = 20;
    room.drawnNumbers = [];
    room.currentCall = null;
    room.winResult = null;

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
   * Start Live Bingo Round
   */
  private async startRound(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.phase = 'locked';
    this.recalculatePot(room);
    this.broadcastRoomState(room);

    // Generate simulated opponent cartelas (Ethiopian Bingo halls have 20-50 players)
    const numOpponents = 20 + Math.floor(Math.random() * 16); // 20-35 opponents
    room.opponentCards = [];
    for (let i = 0; i < numOpponents; i++) {
      const opponentCartelaId = Math.floor(1 + Math.random() * 400);
      room.opponentCards.push({
        cartelaId: opponentCartelaId,
        cardMatrix: generateCardFromId(opponentCartelaId),
        opponentName: ETHIOPIAN_NAMES[Math.floor(Math.random() * ETHIOPIAN_NAMES.length)]
      });
    }

    // Create Round in Neon PostgreSQL
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

    // Prepare Ball Draw Sequence (1 to 75 shuffled)
    room.ballSequence = generateRandomShuffledBalls();
    room.drawnNumbers = [];
    room.phase = 'playing';

    // Broadcast Round Started
    io.to(roomId).emit('round_started', {
      roundId: room.currentRoundId,
      roundNumber: room.roundNumber,
      totalPot: room.totalPot,
      winnerPayout: room.winnerPayout
    });

    // Start 3.5s Ball Drawing Loop
    this.startBallCallingLoop(roomId);
  }

  /**
   * 3.5s Ball Drawing Loop — checks opponent and human wins each ball
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

      // After minimum 20 balls drawn, check opponent cards for wins
      if (room.drawnNumbers.length >= 20 && room.opponentCards) {
        for (const opp of room.opponentCards) {
          const winCheck = checkWinningPattern(opp.cardMatrix, room.drawnNumbers);
          if (winCheck.isWin) {
            // Opponent wins! End round after a small delay to feel natural
            clearInterval(interval);
            
            setTimeout(() => {
              if (room.phase !== 'playing') return;
              room.phase = 'winner';

              const winResult = {
                winnerId: `opponent_${opp.cartelaId}`,
                winnerName: opp.opponentName,
                winningCartelaNumber: opp.cartelaId,
                winningPattern: winCheck.winningPattern,
                winningIndices: winCheck.winningIndices,
                totalPot: room.totalPot,
                userShare: 0 // opponent won, no payout to real user
              };

              room.winResult = winResult;
              io.to(roomId).emit('round_winner', winResult);

              // Update game_rounds in DB
              if (room.currentRoundId) {
                query(
                  `UPDATE game_rounds SET phase = 'ended', winner_names = $1, ended_at = NOW() WHERE id = $2`,
                  [JSON.stringify([opp.opponentName]), room.currentRoundId]
                ).catch(() => {});
              }

              this.startWinnerCelebrationTimer(roomId);
            }, 1500); // 1.5s delay feels like opponent just called BINGO

            return;
          }
        }
      }
    }, 3500);

    this.intervals.set(roomId, interval);
  }

  /**
   * Player Claims Bingo
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

    // 1. Check if user holds this cartela
    const userTickets = room.tickets.get(userId) || [];
    const ticket = userTickets.find(t => t.cartelaId === cartelaId);

    // If user didn't register ticket in lobby, generate matrix for check
    const cardMatrix = ticket ? ticket.cardMatrix : generateCardFromId(cartelaId);

    // 2. Server-Authoritative Win Pattern Verification
    const winCheck = checkWinningPattern(cardMatrix, room.drawnNumbers);

    if (!winCheck.isWin) {
      return {
        success: false,
        message: 'Invalid Bingo claim. Not all numbers in a winning line have been drawn yet.'
      };
    }

    // 3. Valid Win! Halt ball calling and transition to WINNER phase
    if (this.intervals.has(roomId)) {
      clearInterval(this.intervals.get(roomId)!);
    }

    room.phase = 'winner';
    const winPayout = room.winnerPayout;

    // 4. Update Database Atomically
    try {
      await withTransaction(async (client) => {
        // Credit winner's wallet
        const walletRes = await client.query(
          'SELECT balance FROM wallets WHERE user_id = $1 FOR UPDATE',
          [userId]
        );

        if (walletRes.rows.length > 0) {
          const currentBal = parseFloat(walletRes.rows[0].balance);
          const newBal = currentBal + winPayout;

          await client.query(
            'UPDATE wallets SET balance = $1, updated_at = NOW() WHERE user_id = $2',
            [newBal, userId]
          );

          // Record win transaction
          const winRef = `WIN-${roomId.toUpperCase()}-${Date.now().toString().slice(-6)}`;
          await client.query(
            `INSERT INTO wallet_transactions (user_id, type, amount, balance_after, reference_code, status, payment_method, description)
             VALUES ($1, 'win', $2, $3, $4, 'completed', 'in_game', $5)`,
            [userId, winPayout, newBal, winRef, `Bingo Won in ${room.name} (Cartela #${cartelaId})`]
          );
        }

        // Update game_rounds record
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
              JSON.stringify([userId]),
              JSON.stringify([cartelaId]),
              JSON.stringify([userName]),
              room.currentRoundId
            ]
          );
        }
      });
    } catch (err) {
      console.error('❌ [GameEngine Error processing winning payout]:', err);
    }

    const winResult = {
      winnerId: userId,
      winnerName: userName,
      winningCartelaNumber: cartelaId,
      winningPattern: winCheck.winningPattern,
      winningIndices: winCheck.winningIndices,
      totalPot: room.totalPot,
      userShare: winPayout
    };

    room.winResult = winResult;

    // Broadcast Win to all players in the room
    io.to(roomId).emit('round_winner', winResult);

    // Notify winner wallet balance update
    io.emit(`user_${userId}_balance`, {
      type: 'bingo_win',
      amount: winPayout
    });

    io.emit('user_balance_updated', {
      userId,
      amount: winPayout
    });

    // Start 8-second celebration timer before next lobby
    this.startWinnerCelebrationTimer(roomId);

    return { success: true, message: 'BINGO VERIFIED! Congratulations!', winResult };
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
        this.startLobbyTimer(roomId);
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
