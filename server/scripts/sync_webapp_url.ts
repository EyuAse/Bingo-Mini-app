import dotenv from 'dotenv';
import { query, pool } from '../db.ts';

dotenv.config();

import { telegramBotService } from '../services/telegramBotService.ts';

async function main() {
  const cliArg = process.argv[2];
  const newUrl = cliArg || process.env.TELEGRAM_WEBAPP_URL || 'https://bingo-mini-app-3li9.onrender.com';
  console.log(`Setting telegram_webapp_url in database to: ${newUrl}`);

  await query(
    `INSERT INTO admin_settings (key, value, updated_at)
     VALUES ('telegram_webapp_url', $1, NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [newUrl.trim()]
  );

  const res = await query(`SELECT key, value FROM admin_settings WHERE key LIKE 'telegram_%'`);
  console.log('Current telegram admin settings:');
  console.table(res.rows);

  console.log(`\nRegistering webhook with Telegram API...`);
  telegramBotService.clearConfigCache();
  const webhookResult = await telegramBotService.setWebhook();
  console.log('Webhook registration result:', webhookResult);

  await pool.end();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
