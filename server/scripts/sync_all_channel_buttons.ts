import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error('No TELEGRAM_BOT_TOKEN found');
    process.exit(1);
  }

  const channel = '@lomibingo_official';
  const newUrl = 'https://bingo-mini-app-3li9.onrender.com/?v=20261025_ORGANIC_BOTS_SCURVE_V3';
  console.log(`Checking messages 1 to 100 in channel ${channel}...`);

  let updated = 0;
  for (let id = 1; id <= 80; id++) {
    try {
      const resp = await fetch(`https://api.telegram.org/bot${token}/editMessageReplyMarkup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: channel,
          message_id: id,
          reply_markup: {
            inline_keyboard: [
              [{ text: '🎮 አሁኑኑ ይጫወቱ • Play Bingo Now', url: newUrl }]
            ]
          }
        })
      });
      const data: any = await resp.json();
      if (data.ok) {
        console.log(`✓ Message #${id} button updated`);
        updated++;
      } else if (data.description && !data.description.includes('message to edit not found')) {
        console.log(`Message #${id}: ${data.description}`);
      }
    } catch (e: any) {
      console.error(`Error on #${id}:`, e.message);
    }
    await new Promise(r => setTimeout(r, 80));
  }

  console.log(`\nScan complete. Total channel messages with updated buttons: ${updated}`);
  process.exit(0);
}

main();
