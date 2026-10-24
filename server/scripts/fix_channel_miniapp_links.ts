import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error('No TELEGRAM_BOT_TOKEN');
    process.exit(1);
  }

  const channel = process.env.TELEGRAM_CHANNEL_ID || '@lomibingo_official';
  // Native Telegram Mini App Direct Link: opens full-screen inside Telegram Mini App
  const miniAppUrl = 'https://t.me/LomiBingobot/play';

  console.log(`Updating channel messages in ${channel} to native Mini App URL: ${miniAppUrl}`);

  // Specifically update the 5 newly created posts (52, 53, 54, 55, 56) and all previous posts
  const targetIds = [56, 55, 54, 53, 52, 47, 45, 43, 42, 40, 38, 37, 36, 34, 32, 30, 24, 13, 12, 11, 10, 9, 3];

  let successCount = 0;
  for (const id of targetIds) {
    try {
      const resp = await fetch(`https://api.telegram.org/bot${token}/editMessageReplyMarkup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: channel,
          message_id: id,
          reply_markup: {
            inline_keyboard: [
              [{ text: '🎮 አሁኑኑ ይጫወቱ • Play Bingo Now', url: miniAppUrl }]
            ]
          }
        })
      });
      const data: any = await resp.json();
      if (data.ok) {
        console.log(`✓ Message #${id} updated to native Mini App link!`);
        successCount++;
      } else {
        console.log(`Message #${id}: ${data.description}`);
      }
    } catch (e: any) {
      console.error(`Error #${id}:`, e.message);
    }
    await new Promise(r => setTimeout(r, 80));
  }

  console.log(`\nDone! Updated ${successCount} messages in ${channel} to native Mini App URL.`);
  process.exit(0);
}

main();
