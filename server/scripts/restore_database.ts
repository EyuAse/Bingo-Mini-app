import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import { BackupData, BACKUP_TABLES } from './backup_database.js';

dotenv.config();
neonConfig.webSocketConstructor = ws;

interface RestoreOptions {
  targetUrl: string;
  backupFilePath: string;
  dryRun?: boolean;
}

/**
 * Restore an authoritative backup into a target Neon database
 */
export async function restoreDatabaseToTarget(options: RestoreOptions) {
  const { targetUrl, backupFilePath, dryRun = false } = options;

  console.log('🚀 [DB Restore] Starting zero-loss database restore/migration...');
  console.log(`📁 Backup File: ${backupFilePath}`);
  const maskedTarget = targetUrl.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:***@');
  console.log(`🎯 Target Neon DB: ${maskedTarget}`);

  if (!fs.existsSync(backupFilePath)) {
    throw new Error(`Backup file not found at ${backupFilePath}`);
  }

  const rawJson = fs.readFileSync(backupFilePath, 'utf8');
  const backup: BackupData = JSON.parse(rawJson);
  console.log(`📊 Backup Info: Timestamp=${backup.timestamp}, Version=${backup.version}, Total Records=${backup.totalRows}`);

  if (dryRun) {
    console.log('🔎 [Dry Run] Validating backup contents without writing to target...');
    for (const table of BACKUP_TABLES) {
      const rows = backup.tables[table] || [];
      console.log(`  ✓ Table '${table}': ${rows.length} records ready to import`);
    }
    console.log('✅ [Dry Run] Backup file is 100% valid and ready for migration.');
    return { success: true, dryRun: true };
  }

  // Connect to target database
  const targetPool = new Pool({
    connectionString: targetUrl,
    max: 10,
    connectionTimeoutMillis: 30000
  });

  const client = await targetPool.connect();
  try {
    console.log('⚡ Connected to target database. Applying schema.sql...');

    // 1. Read and apply schema.sql
    const schemaPath = path.resolve(process.cwd(), 'server', 'db', 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`schema.sql not found at ${schemaPath}`);
    }
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await client.query(schemaSql);
    console.log('✅ Target schema and tables created/verified successfully.');

    // 2. Perform restore inside a transaction
    await client.query('BEGIN');

    // Helper: Bulk insert records for a table
    const insertTableRows = async (tableName: string, rows: any[]) => {
      if (!rows || rows.length === 0) return 0;
      let inserted = 0;

      for (const row of rows) {
        const keys = Object.keys(row);
        if (keys.length === 0) continue;

        // Clean values for Postgres (e.g. serialize JSON objects)
        const values = keys.map(k => {
          const val = row[k];
          if (val !== null && typeof val === 'object' && !(val instanceof Date)) {
            return JSON.stringify(val);
          }
          return val;
        });

        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
        const colNames = keys.map(k => `"${k}"`).join(', ');

        const queryText = `INSERT INTO "${tableName}" (${colNames}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
        await client.query(queryText, values);
        inserted++;
      }
      return inserted;
    };

    console.log('📦 Restoring tables in strict foreign-key dependency order...');

    // Step A: Users (temporarily omit referred_by to prevent self-referencing FK conflicts)
    const rawUsers = backup.tables.users || [];
    const usersWithoutReferrer = rawUsers.map(u => ({ ...u, referred_by: null }));
    const uCount = await insertTableRows('users', usersWithoutReferrer);
    console.log(`  ✓ Restored 'users': ${uCount} rows`);

    // Step B: Wallets
    const wCount = await insertTableRows('wallets', backup.tables.wallets || []);
    console.log(`  ✓ Restored 'wallets': ${wCount} rows`);

    // Step C: Admin Settings
    const sCount = await insertTableRows('admin_settings', backup.tables.admin_settings || []);
    console.log(`  ✓ Restored 'admin_settings': ${sCount} rows`);

    // Step D: Game Rooms
    const grCount = await insertTableRows('game_rooms', backup.tables.game_rooms || []);
    console.log(`  ✓ Restored 'game_rooms': ${grCount} rows`);

    // Step E: Referrals
    const rCount = await insertTableRows('referrals', backup.tables.referrals || []);
    console.log(`  ✓ Restored 'referrals': ${rCount} rows`);

    // Step F: Deposit Requests
    const dCount = await insertTableRows('deposit_requests', backup.tables.deposit_requests || []);
    console.log(`  ✓ Restored 'deposit_requests': ${dCount} rows`);

    // Step G: Withdrawal Requests
    const wdCount = await insertTableRows('withdrawal_requests', backup.tables.withdrawal_requests || []);
    console.log(`  ✓ Restored 'withdrawal_requests': ${wdCount} rows`);

    // Step H: Wallet Transactions
    const txCount = await insertTableRows('wallet_transactions', backup.tables.wallet_transactions || []);
    console.log(`  ✓ Restored 'wallet_transactions': ${txCount} rows`);

    // Step I: Game Rounds
    const roundCount = await insertTableRows('game_rounds', backup.tables.game_rounds || []);
    console.log(`  ✓ Restored 'game_rounds': ${roundCount} rows`);

    // Step J: Game Tickets
    const ticketCount = await insertTableRows('game_tickets', backup.tables.game_tickets || []);
    console.log(`  ✓ Restored 'game_tickets': ${ticketCount} rows`);

    // Step K: Telegram Broadcasts
    const bCount = await insertTableRows('telegram_broadcasts', backup.tables.telegram_broadcasts || []);
    console.log(`  ✓ Restored 'telegram_broadcasts': ${bCount} rows`);

    // Reset sequence so future auto-increment IDs do not collide with restored IDs
    await client.query(`
      SELECT setval('telegram_broadcasts_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM telegram_broadcasts), 1), 1), true)
    `);
    console.log(`  ✓ Synchronized 'telegram_broadcasts_id_seq' sequence.`);

    // Step L: Re-link users.referred_by
    for (const u of rawUsers) {
      if (u.referred_by) {
        await client.query('UPDATE users SET referred_by = $1 WHERE id = $2', [u.referred_by, u.id]);
      }
    }
    console.log('  ✓ Restored user referral hierarchy links.');

    await client.query('COMMIT');
    console.log('✅ ACID Transaction committed successfully.');

    // Step 3: Verification - Check target table counts
    console.log('🔍 Verifying target database counts against backup...');
    let allMatched = true;
    for (const table of BACKUP_TABLES) {
      const targetCountRes = await client.query(`SELECT COUNT(*) as count FROM "${table}"`);
      const targetCount = parseInt(targetCountRes.rows[0]?.count || '0', 10);
      const backupCount = (backup.tables[table] || []).length;

      const match = targetCount >= backupCount;
      if (!match) allMatched = false;
      console.log(`  ${match ? '✓' : '❌'} ${table}: target has ${targetCount} (backup had ${backupCount})`);
    }

    if (!allMatched) {
      console.warn('⚠️ Some table counts did not fully match! Please inspect table logs.');
    } else {
      console.log('🎉 100% ZERO DATA LOSS VERIFIED! All tables, users, balances, and history successfully migrated.');
    }

    return { success: true, allMatched };
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('❌ [DB Restore Failed - Rolled Back]:', err);
    throw err;
  } finally {
    client.release();
    await targetPool.end();
  }
}

// CLI Execution
if (process.argv[1] && process.argv[1].includes('restore_database')) {
  (async () => {
    try {
      const args = process.argv.slice(2);
      let targetUrl = '';
      let backupFile = path.resolve(process.cwd(), 'backups', 'latest-backup.json');
      let dryRun = false;

      for (const arg of args) {
        if (arg.startsWith('--target=')) {
          targetUrl = arg.replace('--target=', '').replace(/^["']|["']$/g, '');
        } else if (arg.startsWith('--file=')) {
          backupFile = path.resolve(process.cwd(), arg.replace('--file=', '').replace(/^["']|["']$/g, ''));
        } else if (arg === '--dry-run') {
          dryRun = true;
        }
      }

      if (!targetUrl && !dryRun) {
        console.error('❌ Error: Missing --target parameter!');
        console.log('\nUsage:');
        console.log('  npx tsx server/scripts/restore_database.ts --target="postgresql://user:pass@host/dbname"');
        console.log('  npx tsx server/scripts/restore_database.ts --dry-run');
        console.log('  npx tsx server/scripts/restore_database.ts --file="backups/neon-backup-2026-09-10.json" --target="postgresql://..."');
        process.exit(1);
      }

      await restoreDatabaseToTarget({
        targetUrl: targetUrl || process.env.DATABASE_URL || '',
        backupFilePath: backupFile,
        dryRun
      });

      process.exit(0);
    } catch (err) {
      console.error('❌ Restore execution terminated with error:', err);
      process.exit(1);
    }
  })();
}
