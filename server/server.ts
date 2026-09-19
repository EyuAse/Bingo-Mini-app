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
import telegramBotRouter from './routes/telegramBot.ts';
import { setupGameSockets } from './sockets/gameSocket.ts';
import { gameEngine } from './game/BingoGameEngine.ts';
import { telegramBotService } from './services/telegramBotService.ts';

import rateLimit from 'express-rate-limit';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { initSocketIO, io } from './io.ts';
export { io };

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// Socket.IO Server Configuration with Mobile-Resilient Keep-Alive (15s timeout prevents cellular drops)
initSocketIO(server, CORS_ORIGIN);

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

  const userId = req.query.userId as string | undefined;
  let userTickets = null;
  let isPreBuy = false;

  if (userId) {
    if (room.tickets.has(userId)) {
      userTickets = room.tickets.get(userId);
    } else if (room.nextRoundTickets && room.nextRoundTickets.has(userId)) {
      userTickets = room.nextRoundTickets.get(userId);
      isPreBuy = true;
    }
  }

  // Compute occupied cartela IDs (same as broadcastRoomState) so HTTP polling matches socket payloads
  const occupiedCartelaIds: number[] = [];
  room.tickets.forEach(list => list.forEach(t => occupiedCartelaIds.push(t.cartelaId)));
  if (room.nextRoundTickets) {
    room.nextRoundTickets.forEach(list => list.forEach(t => occupiedCartelaIds.push(t.cartelaId)));
  }

  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.json({
    success: true,
    roomId: room.id,
    phase: room.phase,
    mode: room.mode || (gameEngine.getRealCartelaCount(room) >= 2 ? 'active' : 'spectating'),
    roundNumber: room.roundNumber,
    lobbyCountdown: room.lobbyCountdown,
    winnerCountdown: room.winnerCountdown,
    stakeAmount: room.stakeAmount,
    totalPot: room.totalPot,
    winnerPayout: room.winnerPayout,
    playersCount: gameEngine.getRoomPlayersCount(room),
    drawnNumbers: room.drawnNumbers,
    totalDrawn: room.drawnNumbers.length,
    currentCall: room.currentCall,
    winResult: room.winResult,
    userTickets,
    isPreBuy,
    waitingForPlayers: room.waitingForPlayers || false,
    waitingForOtherHouses: room.waitingForOtherHouses || false,
    realPlayerCount: gameEngine.getRealCartelaCount(room),
    activeUsersCount: Math.max(room.activeUsers.size, room.activeSockets.size),
    occupiedCartelaIds,
    stakeRoomsSummary: gameEngine.getStakeRoomsSummary(),
    serverTime: Date.now()
  });
});

// Emergency Unstick & Reset Endpoint
app.post('/api/rooms/reset', (req, res) => {
  const roomId = req.query.roomId as string | undefined;
  gameEngine.forceResetRoomToLobby(roomId);
  res.json({ success: true, message: 'Rooms reset to synchronized lobby.' });
});

// Rate Limiters for DoS and Brute-Force Hardening
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 30, // Limit each IP to 30 requests per windowMs
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, error: 'Too many authentication attempts. Please try again in 15 minutes.' }
});

const walletLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 60, // Limit each IP to 60 requests per minute
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Please slow down.' }
});

// Mount Routes with Rate Limiting
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/wallet', walletLimiter, walletRouter);
app.use('/api/admin', adminRouter);
app.use('/api/admin/telegram', telegramBotRouter);
app.use('/api/telegram', telegramBotRouter);

// Serve Static Frontend Bundle in Production (Single-port hosting) with Optimized Caching
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  // Universal Cache-Busting Redirect: Force unversioned root requests to /?v=20260919_4
  // so Telegram Webview never serves stale CEF/WebView2 disk cache from old bot posts
  app.use((req, res, next) => {
    if (req.method === 'GET' && (req.path === '/' || req.path === '/index.html')) {
      const v = req.query.v;
      if (v !== '20260919_4') {
        const cleanUrl = req.url.replace(/([?&])v=[^&]*(&|$)/g, '$1').replace(/[?&]$/, '');
        const sep = cleanUrl.includes('?') ? '&' : '?';
        const redirectUrl = `${cleanUrl}${sep}v=20260919_4`;
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        return res.redirect(302, redirectUrl);
      }
    }
    next();
  });

  app.use(express.static(distPath, {
    setHeaders: (res, filePath) => {
      const normalizedPath = filePath.replace(/\\/g, '/');
      const isHashedAsset = /-[a-zA-Z0-9_-]{8,}\.(js|css|woff2?)$/i.test(normalizedPath);
      const isAudio = normalizedPath.includes('/assets/audio/') || /\.(mp3|wav|ogg|webm|m4a)$/i.test(normalizedPath);

      if (isHashedAsset) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else if (isAudio) {
        res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600, must-revalidate');
      } else if (normalizedPath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=86400');
      }
    }
  }));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    if (req.method === 'GET') {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
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
  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`ℹ️ [Lomi Bingo Server] Port ${PORT} is already in use by primary instance.`);
    } else {
      console.error('❌ [Server Error]:', err);
    }
  });

  server.listen(PORT, () => {
    console.log(`🚀 [Lomi Bingo Server] Running on http://localhost:${PORT}`);
    console.log(`📊 [Neon PostgreSQL] Connection Pool Active`);
    console.log(`🎮 [Bingo Engine] 4 Game Rooms Initialized`);
    telegramBotService.setMyCommands().catch(err => {
      console.warn('⚠️ [TelegramBotService] Auto-sync bot commands deferred:', err.message || err);
    });
    telegramBotService.setChatMenuButton('commands').catch(err => {
      console.warn('⚠️ [TelegramBotService] Auto-sync chat menu button deferred:', err.message || err);
    });
  });
}

export { app, server };
