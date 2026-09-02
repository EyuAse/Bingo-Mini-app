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
      if (userId) authUserId = userId;
      if (userName) authUserName = userName;

      socket.join(roomId);
      gameEngine.handleJoinRoom(socket.id, roomId, userId);

      const room = gameEngine.getRoom(roomId);
      if (room) {
        // Send immediate room snapshot to joining player
        socket.emit('room_sync', {
          roomId: room.id,
          phase: room.phase,
          lobbyCountdown: room.lobbyCountdown,
          winnerCountdown: room.winnerCountdown,
          stakeAmount: room.stakeAmount,
          totalPot: room.totalPot,
          winnerPayout: room.winnerPayout,
          drawnNumbers: room.drawnNumbers,
          currentCall: room.currentCall,
          winResult: room.winResult
        });
      }
    });

    // 2. Buy Ticket Event
    socket.on(
      'buy_ticket',
      async (
        data: { roomId: string; userId: string; userName: string; cartelaIds: number[] },
        callback?: (res: any) => void
      ) => {
        const { roomId, userId, userName, cartelaIds } = data;
        const result = await gameEngine.handleBuyTicket(
          userId,
          userName || authUserName,
          roomId,
          cartelaIds,
          socket.id
        );

        if (callback) {
          callback(result);
        } else {
          socket.emit('buy_ticket_response', result);
        }
      }
    );

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

    // 5. Disconnect
    socket.on('disconnect', () => {
      if (currentRoomId) {
        gameEngine.handleLeaveRoom(socket.id, currentRoomId);
      }
    });
  });
}
