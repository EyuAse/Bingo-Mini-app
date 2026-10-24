import dotenv from 'dotenv';
dotenv.config();
import { query, pool } from '../db.ts';

async function migrate() {
  console.log('Ensuring bot_blocked column exists...');
  await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS bot_blocked BOOLEAN DEFAULT FALSE;');
  
  console.log('Setting bot_started = TRUE for all existing telegram users who have not blocked the bot...');
  const res = await query(`
    UPDATE users 
    SET bot_started = TRUE 
    WHERE telegram_id IS NOT NULL 
      AND telegram_id > 0 
      AND (bot_blocked IS NULL OR bot_blocked = FALSE)
  `);
  console.log(`Updated ${res.rowCount} users with bot_started = TRUE`);

  const stats = await query(`
    SELECT 
      COUNT(*) FILTER (WHERE telegram_id IS NOT NULL AND telegram_id > 0) as total_tg,
      COUNT(*) FILTER (WHERE telegram_id IS NOT NULL AND telegram_id > 0 AND bot_started = TRUE) as started_true,
      COUNT(*) FILTER (WHERE telegram_id IS NOT NULL AND telegram_id > 0 AND (bot_blocked IS NULL OR bot_blocked = FALSE)) as unblocked
    FROM users
  `);
  console.log('Current stats:', stats.rows[0]);

  await pool.end();
}

migrate().catch(console.error);
