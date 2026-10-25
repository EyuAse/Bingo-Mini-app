import dotenv from 'dotenv';
import { query, pool } from '../db.ts';

dotenv.config();

async function main() {
  const newUrl = 'https://bingo-mini-app-3li9.onrender.com/?v=20261025_ORGANIC_BOTS_SCURVE_V3';
  console.log(`Setting telegram_webapp_url in database to: ${newUrl}`);

  await query(
    `INSERT INTO admin_settings (key, value, updated_at)
     VALUES ('telegram_webapp_url', $1, NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [newUrl]
  );

  const res = await query(`SELECT key, value FROM admin_settings WHERE key LIKE 'telegram_%'`);
  console.log('Current telegram admin settings:');
  console.table(res.rows);

  await pool.end();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
