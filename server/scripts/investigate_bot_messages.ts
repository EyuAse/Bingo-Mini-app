import dotenv from 'dotenv';
dotenv.config();
import { query, pool } from '../db.ts';

async function main() {
  const users = await query('SELECT id, telegram_id, phone, created_at FROM users WHERE telegram_id IS NOT NULL AND bot_started = true');
  console.log(`Users with bot_started = true (${users.rows.length}):`);
  console.table(users.rows);
  await pool.end();
}

main().catch(console.error);
