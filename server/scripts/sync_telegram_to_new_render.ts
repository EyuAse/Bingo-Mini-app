import dotenv from 'dotenv';
import { telegramBotService } from '../services/telegramBotService.ts';

dotenv.config();

async function syncTelegram() {
  const newUrl = 'https://bingo-mini-app-3li9.onrender.com';
  console.log(`\n======================================================`);
  console.log(`🤖 SYNCING TELEGRAM BOT TO NEW RENDER INSTANCE`);
  console.log(`Target: ${newUrl}`);
  console.log(`======================================================\n`);

  // 1. Sync Webhook
  console.log('1. Registering Webhook...');
  const webhookRes = await telegramBotService.setWebhook(`${newUrl}/api/telegram-webhook`);
  console.log('Webhook result:', webhookRes);

  // 2. Sync Chat Menu Button
  console.log('2. Updating Chat Menu Button to new web_app URL...');
  const menuRes = await telegramBotService.setChatMenuButton('web_app', newUrl);
  console.log('Menu Button result:', menuRes);

  // 3. Check Current Webhook Info
  console.log('3. Verifying Telegram Webhook Info from Telegram API...');
  const info = await telegramBotService.getWebhookInfo();
  console.log('Active Telegram Webhook Info:');
  console.log(info.result);

  console.log('\n✅ Telegram Bot is now 100% routed to https://bingo-mini-app-3li9.onrender.com!\n');
  process.exit(0);
}

syncTelegram().catch(err => {
  console.error('Error syncing telegram:', err);
  process.exit(1);
});
