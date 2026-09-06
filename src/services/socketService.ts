import { io, Socket } from 'socket.io-client';

export type ConnectionStatus = 'connected' | 'reconnecting' | 'polling' | 'disconnected' | 'degraded';

export interface OfflineWinData {
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
  winningPattern: string;
}

class SocketService {
  private static instance: SocketService;
  private socket: Socket | null = null;
  private currentRoomId: string | null = null;
  private currentUserId: string | null = null;
  private currentUserName: string | null = null;

  private status: ConnectionStatus = 'disconnected';
  private latencyMs: number = 24;
  private statusListeners: Array<(status: ConnectionStatus, latencyMs: number) => void> = [];
  private foregroundListeners: Array<() => void> = [];
  private pingInterval: any = null;
  private silenceCheckInterval: any = null;
  private lastMessageTime: number = Date.now();

  private constructor() {
    this.initLifecycleListeners();
  }

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  private initLifecycleListeners() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const handleForeground = () => {
      if (document.visibilityState === 'visible') {
        console.log('📱 [SocketService] Page became visible / focused. Re-verifying socket connection & room sync.');
        if (!this.socket || !this.socket.connected) {
          this.connect();
        } else {
          if (this.currentRoomId) {
            this.socket.emit('join_room', {
              roomId: this.currentRoomId,
              userId: this.currentUserId,
              userName: this.currentUserName
            });
          }
          this.measurePing();
        }
        // Notify foreground listeners to sync game state immediately
        this.foregroundListeners.forEach(cb => {
          try {
            cb();
          } catch (err) {
            console.warn('Foreground listener error:', err);
          }
        });
      }
    };

    document.addEventListener('visibilitychange', handleForeground);
    window.addEventListener('focus', handleForeground);
    window.addEventListener('online', () => {
      console.log('🌐 [SocketService] Network connection restored (online).');
      handleForeground();
    });
  }

  public onForegroundResume(callback: () => void): () => void {
    this.foregroundListeners.push(callback);
    return () => {
      this.foregroundListeners = this.foregroundListeners.filter(cb => cb !== callback);
    };
  }

  public connect(): Socket {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    // Connect to server (proxied by Vite or direct origin)
    const socketOrigin = (typeof window !== 'undefined' && window.location.hostname.includes('netlify.app'))
      ? 'https://bingo-mini-app-30pe.onrender.com'
      : undefined;

    // Resilient Mobile Network Socket.IO Configuration (15s timeout with jitter backoff)
    const socketOptions = {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 3000,
      randomizationFactor: 0.2,
      timeout: 15000
    };

    this.socket = socketOrigin ? io(socketOrigin, socketOptions) : io(socketOptions);

    this.socket.on('connect', () => {
      console.log('⚡ [Socket.IO] Connected to game server:', this.socket?.id);
      this.lastMessageTime = Date.now();
      this.updateStatus('connected');
      this.measurePing();

      if (this.currentRoomId) {
        this.socket?.emit('join_room', {
          roomId: this.currentRoomId,
          userId: this.currentUserId,
          userName: this.currentUserName
        });
      }
    });

    // Active Inbound Traffic Heartbeat
    this.socket.onAny(() => {
      this.lastMessageTime = Date.now();
      if (this.status === 'degraded') {
        this.updateStatus('connected');
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('⚠️ [Socket.IO] Disconnected:', reason);
      this.updateStatus('reconnecting');
    });

    this.socket.on('connect_error', (error) => {
      console.warn('⚠️ [Socket.IO] Connection Error (reconnecting):', error.message);
      this.updateStatus('reconnecting');
    });

    this.socket.io.on('reconnect_attempt', () => {
      this.updateStatus('reconnecting');
    });

    this.socket.io.on('reconnect', () => {
      console.log('✅ [Socket.IO] Successfully reconnected!');
      this.lastMessageTime = Date.now();
      this.updateStatus('connected');
    });

    // Start background ping latency check
    if (!this.pingInterval) {
      this.pingInterval = setInterval(() => {
        if (this.socket?.connected) {
          this.measurePing();
        }
      }, 10000);
    }

    // Active Packet Silence Detector (Catches Half-Open TCP Stalls with 9.5s threshold)
    if (!this.silenceCheckInterval) {
      this.silenceCheckInterval = setInterval(() => {
        if (this.socket?.connected) {
          const elapsed = Date.now() - this.lastMessageTime;
          if (elapsed > 9500 && this.status === 'connected') {
            console.warn(`⚠️ [SocketService] Inbound traffic stalled for ${(elapsed / 1000).toFixed(1)}s. Degrading connection status.`);
            this.updateStatus('degraded');
          }
        }
      }, 2000);
    }

    return this.socket;
  }

  public getLastMessageTime(): number {
    return this.lastMessageTime;
  }

  public markActivity() {
    this.lastMessageTime = Date.now();
    if (this.status === 'degraded') {
      this.updateStatus('connected');
    }
  }

  public forceHardReconnect() {
    console.log('🔄 [SocketService] Performing hard socket reconnection...');
    if (this.socket) {
      try {
        this.socket.disconnect();
      } catch (e) {
        console.warn('Socket disconnect error:', e);
      }
      this.socket = null;
    }
    this.status = 'reconnecting';
    this.updateStatus('reconnecting');
    const newSock = this.connect();
    if (this.currentRoomId) {
      newSock.emit('join_room', {
        roomId: this.currentRoomId,
        userId: this.currentUserId,
        userName: this.currentUserName
      });
    }
  }

  private updateStatus(newStatus: ConnectionStatus) {
    this.status = newStatus;
    this.statusListeners.forEach(cb => cb(this.status, this.latencyMs));
  }

  public measurePing(): Promise<number> {
    return new Promise((resolve) => {
      if (!this.socket || !this.socket.connected) {
        resolve(this.latencyMs);
        return;
      }
      const start = Date.now();
      this.socket.emit('ping_check', start, () => {
        const roundTrip = Date.now() - start;
        this.latencyMs = Math.max(8, roundTrip);
        this.statusListeners.forEach(cb => cb(this.status, this.latencyMs));
        resolve(this.latencyMs);
      });
      // Safety timeout
      setTimeout(() => resolve(this.latencyMs), 1500);
    });
  }

  public getConnectionStatus(): { status: ConnectionStatus; latencyMs: number } {
    return { status: this.status, latencyMs: this.latencyMs };
  }

  public onConnectionStatusChange(callback: (status: ConnectionStatus, latencyMs: number) => void): () => void {
    this.statusListeners.push(callback);
    callback(this.status, this.latencyMs);
    return () => {
      this.statusListeners = this.statusListeners.filter(cb => cb !== callback);
    };
  }

  public getSocket(): Socket {
    if (!this.socket) {
      return this.connect();
    }
    return this.socket;
  }

  public joinRoom(roomId: string, userId?: string, userName?: string) {
    this.currentRoomId = roomId;
    if (userId) this.currentUserId = userId;
    if (userName) this.currentUserName = userName;

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
    cartelaIds: number[],
    stakeAmount?: number
  ): Promise<{ success: boolean; error?: string; tickets?: any[]; remainingBalance?: number; preBoughtForNextRound?: boolean }> {
    return new Promise((resolve) => {
      const sock = this.getSocket();
      sock.emit(
        'buy_ticket',
        { roomId, userId, userName, cartelaIds, stakeAmount },
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

  // Multi-Device Cross-Session Ticket Synchronization
  public onUserTicketsSynced(callback: (data: any) => void): () => void {
    const sock = this.getSocket();
    sock.on('user_tickets_synced', callback);
    return () => sock.off('user_tickets_synced', callback);
  }

  // Real-Time Lobby Player Joined Event
  public onPlayerJoined(callback: (data: any) => void): () => void {
    const sock = this.getSocket();
    sock.on('player_joined', callback);
    return () => sock.off('player_joined', callback);
  }

  // Disconnect Protection Listeners
  public onOfflineWinNotification(callback: (wins: OfflineWinData[]) => void): () => void {
    const sock = this.getSocket();
    sock.on('offline_win_notification', callback);
    return () => sock.off('offline_win_notification', callback);
  }

  public acknowledgeOfflineWin(winId: string) {
    const sock = this.getSocket();
    sock.emit('acknowledge_offline_win', { winId });
  }

  // Lobby Ticket Cancellation / Stake Switch Refund
  public cancelTicketLobby(roomId: string, userId: string): Promise<{ success: boolean; refunded?: number; error?: string }> {
    return new Promise((resolve) => {
      const sock = this.getSocket();
      sock.emit('cancel_ticket_lobby', { roomId, userId }, (res: any) => {
        resolve(res || { success: false, error: 'No response from server' });
      });
    });
  }

  // Stake Rooms Player Count Summary
  public onStakeRoomsSummary(callback: (summary: Record<number, number>) => void): () => void {
    const sock = this.getSocket();
    sock.on('stake_rooms_summary', callback);
    return () => sock.off('stake_rooms_summary', callback);
  }

  public forceReconnect() {
    this.forceHardReconnect();
  }
}

export const socketService = SocketService.getInstance();
