import { io, Socket } from 'socket.io-client';

class SocketService {
  private static instance: SocketService;
  private socket: Socket | null = null;
  private currentRoomId: string | null = null;

  private constructor() {}

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  public connect(): Socket {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    // Connect to server (proxied by Vite or direct origin)
    this.socket = io({
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000
    });

    this.socket.on('connect', () => {
      console.log('⚡ [Socket.IO] Connected to game server:', this.socket?.id);
      if (this.currentRoomId) {
        this.socket?.emit('join_room', { roomId: this.currentRoomId });
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('⚠️ [Socket.IO] Disconnected:', reason);
    });

    return this.socket;
  }

  public getSocket(): Socket {
    if (!this.socket) {
      return this.connect();
    }
    return this.socket;
  }

  public joinRoom(roomId: string, userId?: string, userName?: string) {
    this.currentRoomId = roomId;
    const sock = this.getSocket();
    sock.emit('join_room', { roomId, userId, userName });
  }

  public leaveRoom(roomId: string) {
    if (this.currentRoomId === roomId) {
      this.currentRoomId = null;
    }
    const sock = this.getSocket();
    sock.emit('leave_room', { roomId });
  }

  public buyTicket(
    roomId: string,
    userId: string,
    userName: string,
    cartelaIds: number[]
  ): Promise<{ success: boolean; error?: string; tickets?: any[]; remainingBalance?: number }> {
    return new Promise((resolve) => {
      const sock = this.getSocket();
      sock.emit(
        'buy_ticket',
        { roomId, userId, userName, cartelaIds },
        (response: any) => {
          resolve(response || { success: false, error: 'No response from game server' });
        }
      );
    });
  }

  public claimBingo(
    roomId: string,
    userId: string,
    userName: string,
    cartelaId: number
  ): Promise<{ success: boolean; message: string; winResult?: any }> {
    return new Promise((resolve) => {
      const sock = this.getSocket();
      sock.emit(
        'claim_bingo',
        { roomId, userId, userName, cartelaId },
        (response: any) => {
          resolve(response || { success: false, message: 'No response from server' });
        }
      );
    });
  }

  public onRoomState(callback: (state: any) => void): () => void {
    const sock = this.getSocket();
    sock.on('room_state', callback);
    sock.on('room_sync', callback);
    return () => {
      sock.off('room_state', callback);
      sock.off('room_sync', callback);
    };
  }

  public onBallCalled(callback: (data: any) => void): () => void {
    const sock = this.getSocket();
    sock.on('ball_called', callback);
    return () => sock.off('ball_called', callback);
  }

  public onRoundStarted(callback: (data: any) => void): () => void {
    const sock = this.getSocket();
    sock.on('round_started', callback);
    return () => sock.off('round_started', callback);
  }

  public onRoundWinner(callback: (winResult: any) => void): () => void {
    const sock = this.getSocket();
    sock.on('round_winner', callback);
    return () => sock.off('round_winner', callback);
  }

  public onUserBalanceUpdate(userId: string, callback: (data: any) => void): () => void {
    const sock = this.getSocket();
    const eventName = `user_${userId}_balance`;
    sock.on(eventName, callback);
    return () => sock.off(eventName, callback);
  }
}

export const socketService = SocketService.getInstance();
