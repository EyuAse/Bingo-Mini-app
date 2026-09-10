import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { query } from '../db.js';

dotenv.config();

export interface BackupData {
  version: string;
  timestamp: string;
  sourceUrlMasked: string;
  totalTables: number;
  totalRows: number;
  checksum: string;
  tables: {
    users: any[];
    wallets: any[];
    admin_settings: any[];
    game_rooms: any[];
    referrals: any[];
    deposit_requests: any[];
    withdrawal_requests: any[];
    wallet_transactions: any[];
    game_rounds: any[];
    game_tickets: any[];
    telegram_broadcasts: any[];
    [key: string]: any[];
  };
}

/**
 * Ordered list of all tables to guarantee safe relational integrity
 */
export const BACKUP_TABLES = [
  'users',
  'wallets',
  'admin_settings',
  'game_rooms',
  'referrals',
  'deposit_requests',
  'withdrawal_requests',
  'wallet_transactions',
  'game_rounds',
  'game_tickets',
  'telegram_broadcasts'
] as const;

/**
 * Export complete database state into an authoritative, validated JSON snapshot
 */
export async function exportDatabaseBackup(): Promise<BackupData> {
  console.log('🔄 [DB Backup] Beginning authoritative Neon database snapshot...');
  const startTime = Date.now();

  // 1. Warm-up ping to wake up Neon serverless endpoint if sleeping
  try {
    await query('SELECT 1 as warmup');
    console.log('  ⚡ Database connection active and ready.');
  } catch (err: any) {
    console.warn(`  ⚠️ Warmup retry needed: ${err.message}`);
    await new Promise(res => setTimeout(res, 2000));
    await query('SELECT 1 as warmup_retry');
  }

  const tablesData: Record<string, any[]> = {};
  let totalRows = 0;

  for (const table of BACKUP_TABLES) {
    let attempts = 0;
    let success = false;
    let lastError: any = null;

    while (attempts < 3 && !success) {
      attempts++;
      try {
        const res = await query(`SELECT * FROM ${table}`);
        tablesData[table] = res.rows || [];
        totalRows += res.rows.length;
        console.log(`  ✓ Table '${table}': ${res.rows.length} records captured`);
        success = true;
      } catch (err: any) {
        lastError = err;
        console.warn(`  ⚠️ Attempt ${attempts} for '${table}' failed: ${err.message}. Retrying...`);
        await new Promise(res => setTimeout(res, 1500 * attempts));
      }
    }

    if (!success) {
      throw new Error(`CRITICAL: Backup aborted. Failed to backup table '${table}': ${lastError?.message || 'Unknown error'}`);
    }
  }

  // Mask sensitive database URL for metadata logging
  const rawDbUrl = process.env.DATABASE_URL || '';
  const maskedDbUrl = rawDbUrl.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:***@');

  const payloadString = JSON.stringify(tablesData);
  const checksum = crypto.createHash('sha256').update(payloadString).digest('hex');

  const backup: BackupData = {
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    sourceUrlMasked: maskedDbUrl,
    totalTables: BACKUP_TABLES.length,
    totalRows,
    checksum,
    tables: tablesData as BackupData['tables']
  };

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`✅ [DB Backup] Complete snapshot finished in ${elapsed}s. Total rows: ${totalRows}.`);
  return backup;
}

/**
 * Save snapshot to disk (backups/ folder)
 */
export async function saveBackupToFile(backup: BackupData, outDir?: string): Promise<{ filePath: string; latestPath: string }> {
  const dir = outDir || path.resolve(process.cwd(), 'backups');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `neon-backup-${dateStr}.json`;
  const filePath = path.join(dir, fileName);
  const latestPath = path.join(dir, 'latest-backup.json');

  const jsonContent = JSON.stringify(backup, null, 2);
  fs.writeFileSync(filePath, jsonContent, 'utf8');
  fs.writeFileSync(latestPath, jsonContent, 'utf8');

  const sizeMb = (Buffer.byteLength(jsonContent, 'utf8') / (1024 * 1024)).toFixed(2);
  console.log(`💾 [DB Backup] Saved backup file (${sizeMb} MB):`);
  console.log(`   -> ${filePath}`);
  console.log(`   -> ${latestPath}`);

  return { filePath, latestPath };
}

// Direct CLI execution
if (process.argv[1] && process.argv[1].includes('backup_database')) {
  (async () => {
    try {
      const backup = await exportDatabaseBackup();
      await saveBackupToFile(backup);
      console.log('🎉 Full database backup successfully saved! All user accounts, balances, and history preserved.');
      process.exit(0);
    } catch (err) {
      console.error('❌ [DB Backup Failed]:', err);
      process.exit(1);
    }
  })();
}
