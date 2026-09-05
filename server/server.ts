import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { checkDbConnection } from './db.ts';

import authRouter from './routes/auth.ts';
import walletRouter from './routes/wallet.ts';
import adminRouter from './routes/admin.ts';
import { setupGameSockets } from './sockets/gameSocket.ts';
import { gameEngine } from './game/BingoGameEngine.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// Socket.IO Server Configuration with Low-Latency Keep-Alive for mobile networks
export const io = new SocketIOServer(server, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingInterval: 5000,
  pingTimeout: 4000,
  transports: ['websocket', 'polling']
});

// Setup Multiplayer Game Socket Handlers
setupGameSockets(io);

// Security & Body Parsers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check Endpoint
app.get('/api/health', async (_req, res) => {
  const dbHealth = await checkDbConnection();
  res.status(dbHealth.connected ? 200 : 503).json({
    status: dbHealth.connected ? 'healthy' : 'degraded',
    service: 'Lomi Bingo Production API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: {
      provider: 'Neon PostgreSQL (Serverless Pooler)',
      connected: dbHealth.connected,
      latencyMs: dbHealth.latencyMs,
      error: dbHealth.error
    }
  });
});

// Network Health & Diagnostics Endpoint (Open for Admin and Client Status)
app.get('/api/network-health', (_req, res) => {
  res.json({
    success: true,
    metrics: gameEngine.getNetworkMetrics()
  });
});

// Rooms List Endpoint
app.get('/api/rooms', (_req, res) => {
  res.json({
    success: true,
    rooms: gameEngine.getAllRooms()
  });
});

// Dual-Engine HTTP Fallback State Sync for Low-Network / Disconnected Devices
app.get('/api/rooms/:id/sync', (req, res) => {
  const room = gameEngine.getRoom(req.params.id);
  if (!room) {
    return res.status(404).json({ success: false, error: 'Room not found' });
  }

  res.json({
    success: true,
    roomId: room.id,
    phase: room.phase,
    lobbyCountdown: room.lobbyCountdown,
    winnerCountdown: room.winnerCountdown,
    stakeAmount: room.stakeAmount,
    totalPot: room.totalPot,
    winnerPayout: room.winnerPayout,
    playersCount: gameEngine.getRoomPlayersCount(room),
    drawnNumbers: room.drawnNumbers,
    currentCall: room.currentCall,
    winResult: room.winResult,
    serverTime: Date.now()
  });
});

// Mount Routes
app.use('/api/auth', authRouter);
app.use('/api/wallet', walletRouter);
app.use('/api/admin', adminRouter);

// Serve Static Frontend Bundle in Production (Single-port hosting)
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    if (req.method === 'GET') {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('❌ [Unhandled Express Error]:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// Start Server
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`🚀 [Lomi Bingo Server] Running on http://localhost:${PORT}`);
    console.log(`📊 [Neon PostgreSQL] Connection Pool Active`);
    console.log(`🎮 [Bingo Engine] 4 Game Rooms Initialized`);
  });
}

export { app, server };
