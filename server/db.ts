import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import dotenv from 'dotenv';

dotenv.config();

// Configure WebSocket for Node.js environment
neonConfig.webSocketConstructor = ws;

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_aubNpLCw9U3j@ep-royal-boat-ax8df6ez-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require';

// Neon Serverless Connection Pool
export const pool = new Pool({
  connectionString
});

pool.on('error', (err) => {
  console.error('❌ [Neon DB Pool] Error:', err);
});

/**
 * Execute a single query against Neon PostgreSQL
 */
export async function query<T = any>(text: string, params?: any[]): Promise<{ rows: T[]; rowCount: number }> {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development' && duration > 150) {
      console.log(`⏱️ [Neon DB Query] took ${duration}ms, rows: ${res.rowCount}`);
    }
    return { rows: res.rows as T[], rowCount: res.rowCount || 0 };
  } catch (error) {
    console.error('❌ [Neon DB Query Error]:', text, params, error);
    throw error;
  }
}

/**
 * Execute a series of queries inside an isolated ACID Transaction
 */
export async function withTransaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Verify live connection to Neon PostgreSQL
 */
export async function checkDbConnection(): Promise<{ connected: boolean; latencyMs: number; version?: string; error?: string }> {
  const start = Date.now();
  try {
    const res = await query('SELECT version(), NOW() as server_time');
    const latencyMs = Date.now() - start;
    return {
      connected: true,
      latencyMs,
      version: res.rows[0]?.version
    };
  } catch (err: any) {
    return {
      connected: false,
      latencyMs: Date.now() - start,
      error: err.message || String(err)
    };
  }
}
