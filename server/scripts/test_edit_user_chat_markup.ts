import dotenv from 'dotenv';
dotenv.config();

async function testUserEdit() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error('No TELEGRAM_BOT_TOKEN');
    process.exit(1);
  }

  // Let's test on the most recently active bot user: 8912677502 or 8299290998
  const testChatIds = [8912677502, 8299290998, 7256185093, 8618655930, 339238998, 7519207447, 2005113062, 8218896502];
  const newUrl = 'https://bingo-mini-app-3li9.onrender.com/?v=20261024_50PLAYERS';

  console.log('Testing retroactive button edits in private user chats...');

  for (const chatId of testChatIds) {
    console.log(`\nScanning chat_id: ${chatId}...`);
    let found = 0;
    // Scan recent message IDs (e.g. 1 to 30)
    for (let msgId = 1; msgId <= 35; msgId++) {
      try {
        const resp = await fetch(`https://api.telegram.org/bot${token}/editMessageReplyMarkup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            message_id: msgId,
            reply_markup: {
              inline_keyboard: [
                [{ text: '🎮 Play Bingo Now & Get 10 ETB', web_app: { url: newUrl } }]
              ]
            }
          })
        });
        const data: any = await resp.json();
        if (data.ok) {
          console.log(`  ✓ Successfully updated button in user ${chatId} message #${msgId}!`);
          found++;
        } else if (data.description && !data.description.includes('message to edit not found')) {
          console.log(`  msgId #${msgId}: ${data.description}`);
        }
      } catch (e: any) {
        // network
      }
      await new Promise(r => setTimeout(r, 60));
    }
    console.log(`Chat ${chatId}: ${found} messages updated.`);
  }

  process.exit(0);
}

testUserEdit();
