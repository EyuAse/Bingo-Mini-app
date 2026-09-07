import { Server, Socket } from 'socket.io';
import { gameEngine } from '../game/BingoGameEngine.ts';

export function setupGameSockets(io: Server) {
  io.on('connection', (socket: Socket) => {
    let currentRoomId: string | null = null;
    let authUserId: string | null = null;
    let authUserName: string = 'Lomi Player';

    // 1. Join Game Room
    socket.on('join_room', (data: { roomId: string; userId?: string; userName?: string }) => {
      const { roomId, userId, userName } = data;
      if (!roomId) return;

      if (currentRoomId && currentRoomId !== roomId) {
        socket.leave(currentRoomId);
        gameEngine.handleLeaveRoom(socket.id, currentRoomId);
      }

      currentRoomId = roomId;
      if (userId) {
        authUserId = userId;
        socket.join(`user_${userId}`);
        // Check for Disconnect Protection wins that occurred while offline
        const unackedWins = gameEngine.getUnacknowledgedWins(userId);
        if (unackedWins && unackedWins.length > 0) {
          socket.emit('offline_win_notification', unackedWins);
        }
      }
      if (userName) authUserName = userName;

      socket.join(roomId);
      gameEngine.handleJoinRoom(socket.id, roomId, userId);

      const room = gameEngine.getRoom(roomId);
      if (room) {
        // Find any existing active or queued pre-bought tickets for this user
        const existingTickets = userId
          ? (room.tickets.get(userId) || room.nextRoundTickets.get(userId) || [])
          : [];
        const isPreBuy = Boolean(userId && room.nextRoundTickets.has(userId));

        // Send immediate authoritative room snapshot to joining player
        socket.emit('room_sync', {
          success: true,
          roomId: roomId,
          phase: room.phase,
          roundNumber: room.roundNumber,
          lobbyCountdown: room.lobbyCountdown,
          winnerCountdown: room.winnerCountdown,
          stakeAmount: room.stakeAmount,
          totalPot: room.totalPot,
          winnerPayout: room.winnerPayout,
          playersCount: gameEngine.getRoomPlayersCount(room),
          realPlayerCount: room.realPlayerCount,
          waitingForPlayers: room.waitingForPlayers,
          drawnNumbers: room.drawnNumbers,
          currentCall: room.currentCall,
          winResult: room.winResult,
          stakeRoomsSummary: gameEngine.getStakeRoomsSummary(),
          userTickets: existingTickets,
          isPreBuy
        });

        // If user already had bought tickets for this round/room, sync them directly to the reconnecting socket
        if (existingTickets.length > 0) {
          socket.emit('user_tickets_synced', {
            roomId,
            userId,
            roundNumber: room.roundNumber,
            isPreBuy,
            tickets: existingTickets
          });
        }
      }
      socket.emit('stake_rooms_summary', gameEngine.getStakeRoomsSummary());
    });

    // Cancel Ticket in Lobby (Room switch refund)
    socket.on('cancel_ticket_lobby', async (data: { roomId: string; userId: string }, callback?: (res: any) => void) => {
      const { roomId, userId } = data;
      const result = await gameEngine.handleCancelTicketLobby(userId, roomId);
      if (callback) {
        callback(result);
      } else {
        socket.emit('cancel_ticket_lobby_response', result);
      }
    });

    // Admin Socket Config Controls
    socket.on('admin_set_commission', (data: { enabled: boolean; rate?: number }) => {
      gameEngine.setHouseCommission(data.enabled, data.rate);
    });

    socket.on('admin_set_win_rates', (data: { ownerRate: number; botRate: number; realRate: number }) => {
      gameEngine.setWinRates(data.ownerRate, data.botRate, data.realRate);
    });

    // 2. Buy Ticket Event
    socket.on(
      'buy_ticket',
      async (
        data: { roomId: string; userId: string; userName: string; cartelaIds: number[]; stakeAmount?: number; isAutoPlay?: boolean },
        callback?: (res: any) => void
      ) => {
        const { roomId, userId, userName, cartelaIds, stakeAmount, isAutoPlay } = data;
        const result = await gameEngine.handleBuyTicket(
          userId,
          userName || authUserName,
          roomId,
          cartelaIds,
          socket.id,
          stakeAmount,
          isAutoPlay
        );

        if (callback) {
          callback(result);
        } else {
          socket.emit('buy_ticket_response', result);
        }

        // Multi-Device Mirroring: Broadcast synced tickets to ALL devices logged in as this user
        if (result.success && userId) {
          const room = gameEngine.getRoom(roomId);
          io.to(`user_${userId}`).emit('user_tickets_synced', {
            roomId,
            userId,
            roundNumber: room?.roundNumber,
            isPreBuy: result.preBoughtForNextRound,
            tickets: result.tickets,
            remainingBalance: result.remainingBalance
          });
        }
      }
    );

    // 2.2 Update Player Auto/Manual Mode Event
    socket.on('update_player_mode', (data: { roomId: string; userId: string; isAutoPlay: boolean }) => {
      if (data?.roomId && data?.userId) {
        gameEngine.updatePlayerMode(data.roomId, data.userId, data.isAutoPlay);
      }
    });

    // 3. Claim Bingo Event
    socket.on(
      'claim_bingo',
      async (
        data: { roomId: string; userId: string; userName: string; cartelaId: number },
        callback?: (res: any) => void
      ) => {
        const { roomId, userId, userName, cartelaId } = data;
        const result = await gameEngine.handleClaimBingo(
          userId,
          userName || authUserName,
          roomId,
          cartelaId
        );

        if (callback) {
          callback(result);
        } else {
          socket.emit('claim_bingo_response', result);
        }
      }
    );

    // 4. Leave Room Event
    socket.on('leave_room', (data: { roomId: string }) => {
      const { roomId } = data;
      if (roomId) {
        socket.leave(roomId);
        gameEngine.handleLeaveRoom(socket.id, roomId);
        if (currentRoomId === roomId) {
          currentRoomId = null;
        }
      }
    });

    // 5. Authoritative Disconnect Protection Acknowledgement
    socket.on('acknowledge_offline_win', (data: { winId: string }) => {
      if (data?.winId) {
        gameEngine.acknowledgeOfflineWin(data.winId);
      }
    });

    // 6. Network Latency Ping Check
    socket.on('ping_check', (clientTimestamp: number, callback?: (data: any) => void) => {
      const serverTime = Date.now();
      if (typeof callback === 'function') {
        callback({ clientTimestamp, serverTime });
      } else {
        socket.emit('pong_check', { clientTimestamp, serverTime });
      }
    });

    // 7. Disconnect
    socket.on('disconnect', () => {
      if (currentRoomId) {
        gameEngine.handleLeaveRoom(socket.id, currentRoomId);
      }
    });
  });
}
