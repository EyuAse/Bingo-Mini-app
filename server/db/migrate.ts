import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { pool, checkDbConnection, query } from '../db.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  console.log('🚀 [Neon Migration] Starting database schema migration...');

  // 1. Check live database connection
  const health = await checkDbConnection();
  if (!health.connected) {
    console.error('❌ [Neon Migration] Failed to connect to Neon PostgreSQL:', health.error);
    process.exit(1);
  }
  console.log(`✅ [Neon DB Connected] Latency: ${health.latencyMs}ms`);

  const client = await pool.connect();

  try {
    // 2. Read and execute schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

    console.log('📄 [Neon Migration] Executing schema.sql DDL...');
    await client.query('BEGIN');
    await client.query(schemaSql);

    // 3. Seed Cashier/Admin Account if not exists
    const adminPhone = '0998983344';
    const checkAdmin = await client.query('SELECT id FROM users WHERE phone = $1', [adminPhone]);

    if (checkAdmin.rows.length === 0) {
      console.log('🌱 [Neon Migration] Seeding default Admin Cashier account...');
      const pinHash = await bcrypt.hash('1234', 10);
      const userRes = await client.query(
        `INSERT INTO users (phone, pin_hash, full_name, role, status)
         VALUES ($1, $2, $3, 'admin', 'active')
         RETURNING id`,
        [adminPhone, pinHash, 'Mekonen Woldekidane (Cashier)']
      );

      const adminId = userRes.rows[0].id;
      await client.query(
        `INSERT INTO wallets (user_id, balance, bonus)
         VALUES ($1, 0.00, 0.00)`,
        [adminId]
      );
      console.log('✅ [Neon Migration] Admin Cashier account created.');
    }

    await client.query('COMMIT');
    console.log('🎉 [Neon Migration] Database migration completed successfully!');

    // 4. Verify created tables
    const tableRes = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('📊 [Neon Tables]:', tableRes.rows.map(r => r.table_name).join(', '));
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ [Neon Migration Error]:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(err => {
  console.error('Fatal migration error:', err);
  process.exit(1);
});
