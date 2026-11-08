import { Server as SocketIOServer } from 'socket.io';
import type { Server as HttpServer } from 'http';

let ioInstance: SocketIOServer | null = null;

export function initSocketIO(httpServer: HttpServer, corsOrigin: string = '*'): SocketIOServer {
  ioInstance = new SocketIOServer(httpServer, {
    cors: {
      origin: corsOrigin,
      methods: ['GET', 'POST'],
      credentials: true
    },
    // WebSocket Per-Message Deflate Compression (RFC 7692)
    // Slashes large room state WebSocket payloads (> 1KB) by ~65-80% over the wire
    perMessageDeflate: {
      threshold: 1024,
      zlibDeflateOptions: {
        chunkSize: 1024,
        memLevel: 7,
        level: 3
      }
    },
    pingInterval: 20000,
    pingTimeout: 20000,
    transports: ['websocket', 'polling']
  });
  return ioInstance;
}

export function getIO(): SocketIOServer | null {
  return ioInstance;
}

/**
 * Authoritative Safe Proxy for Socket.IO Server
 * Prevents ES module circular dependency ReferenceErrors (TDZ)
 * and safely no-ops if invoked during initial module instantiation before HTTP server binds.
 */
export const io: SocketIOServer = new Proxy({} as SocketIOServer, {
  get(_target, prop: string | symbol) {
    if (!ioInstance) {
      if (prop === 'to' || prop === 'in') {
        return () => ({
          emit: () => false
        });
      }
      if (prop === 'emit') {
        return () => false;
      }
      if (prop === 'on') {
        return () => false;
      }
      return undefined;
    }
    const val = (ioInstance as any)[prop];
    if (typeof val === 'function') {
      return val.bind(ioInstance);
    }
    return val;
  }
});
