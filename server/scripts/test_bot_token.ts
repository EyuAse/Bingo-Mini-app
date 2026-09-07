import { query } from '../db.ts';
import { telegramBotService } from '../services/telegramBotService.ts';

const TOKEN = '8970837393:AAFZ2vX1Ij67mua6TFU5U8jBVQNcjsGELHE';

async function testAndSaveToken() {
  console.log('🤖 Verifying Bot Token with Telegram API...');
  const me = await telegramBotService.getMe(TOKEN);
  console.log('Telegram API result:', me);

  if (me.ok) {
    console.log(`✅ SUCCESS! Verified Bot: @${me.result.username} (${me.result.first_name}, ID: ${me.result.id})`);
    await query(
      `INSERT INTO admin_settings (key, value, updated_at) 
       VALUES ('telegram_bot_token', $1, NOW()) 
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [TOKEN]
    );
    console.log('💾 Token saved into Neon PostgreSQL admin_settings successfully!');
  } else {
    console.error('❌ Verification failed:', me.description);
  }
  process.exit(0);
}

testAndSaveToken().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
