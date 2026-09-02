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
  pingInterval: 10000,
  pingTimeout: 5000,
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

// Rooms List Endpoint
app.get('/api/rooms', (_req, res) => {
  res.json({
    success: true,
    rooms: gameEngine.getAllRooms()
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
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
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
