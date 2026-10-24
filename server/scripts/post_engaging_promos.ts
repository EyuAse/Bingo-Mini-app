import dotenv from 'dotenv';
dotenv.config();
import { telegramBotService } from '../services/telegramBotService.ts';
import { query, pool } from '../db.ts';

const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '@lomibingo_official';
const APP_URL = 'https://bingo-mini-app-3li9.onrender.com/?v=20261024_50PLAYERS';

const channelPosts = [
  {
    title: 'Weekend 10,000 ETB Mega Pool',
    photo: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=800&auto=format&fit=crop&q=80',
    caption: `🎉 <b>ታላቅ የሳምንቱ መጨረሻ የሎሚ ቢንጎ ውድድር!</b> 🍋✨
<b>10,000 ETB Mega Pool Tournament is LIVE!</b>

💰 <b>አጠቃላይ የሽልማት ፈንድ</b>: <b>10,000 ETB!</b>
🎁 አዲስ ለተመዘገቡ ተጫዋቾች <b>10 ETB ነፃ ቦነስ</b> ተዘጋጅቷል!
⚡ ጨዋታው በየ 2 ደቂቃው ይጀምራል — ፈጣን እና አስደሳች!

👇 ከታች ያለውን ሰማያዊ ቁልፍ ተጭነው ካርቴላዎን አሁኑኑ ይቁረጡ!`,
    buttonText: '🎮 አሁኑኑ ይጫወቱ • Play Bingo Now'
  },
  {
    title: 'Instant Telebirr & CBE Birr Cashier',
    photo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    caption: `💸 <b>በሰከንዶች ውስጥ ያሸነፉትን ገንዘብ ያውጡ!</b> ⚡🏦
<b>Instant Cashouts via Telebirr & CBE Birr!</b>

🛡️ 100% አስተማማኝ እና ፈጣን የተቀማጭና የወጪ ክፍያዎች
📱 በቴሌብር እና በሲቢኢ ብር በደቂቃዎች ውስጥ በቀጥታ ወደ አካውንትዎ ይደርሳል!
🎯 በትንሽ ብር ጀምረው ትልቅ ደርሽ ይውሰዱ!

👇 አሁኑኑ ይሞክሩ እና ያሸንፉ!`,
    buttonText: '💰 ካርቴላ ይቁረጡ • Get Tickets'
  },
  {
    title: 'Real Amharic Voice Caller & Live Arena',
    photo: 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?w=800&auto=format&fit=crop&q=80',
    caption: `🎙️ <b>እውነተኛ የአማርኛ ድምፅ ጠሪ በቀጥታ በቴሌግራም!</b> 🇪🇹🍋
<b>Authentic Addis Bingo Hall Atmosphere!</b>

👥 <b>ከ50+ በላይ ተጫዋቾች ጋር</b> በአንድ አሬና ውስጥ ይወዳደሩ!
🔢 ከ 400 ካርቴላዎች ውስጥ የሚወዱትን እድለኛ ቁጥር ይምረጡ
⚡ Auto-Daub ን በማብራት አንዲትም ቁጥር ሳያመልጥዎት ያሸንፉ!

👇 በቀጥታ ወደ አሬናው ይግቡ!`,
    buttonText: '🎙️ ወደ አሬናው ይግቡ • Enter Arena'
  },
  {
    title: 'Night Super Derash Challenge',
    photo: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop&q=80',
    caption: `🌙 <b>የምሽቱ ልዩ የቢንጎ ድግስ በሎሚ ቢንጎ!</b> 🔥🎯
<b>Tonight's High-Energy Derash Rush!</b>

💥 ትላልቅ ሽልማቶች እና የማያቋርጡ ፈጣን ዙሮች
🎟️ 1 ወይም 2 ካርቴላዎችን በመቁረጥ የማሸነፍ እድልዎን እጥፍ ያድርጉ!
🛡️ Disconnect Protection: የኔትወርክ መቆራረጥ ቢያጋጥምዎም ድልዎ የተጠበቀ ነው!

👇 ዛሬ ማታ እድልዎን ይሞክሩ!`,
    buttonText: '🔥 ዛሬ ማታ ያሸንፉ • Play Tonight'
  },
  {
    title: 'Lucky Serial Numbers (1 to 400)',
    photo: 'https://images.unsplash.com/photo-1541532713592-79a0317b6b77?w=800&auto=format&fit=crop&q=80',
    caption: `👑 <b>የእርስዎ እድለኛ ቁጥር ስንት ነው?</b> 🍀🍋
<b>Pick Your Lucky Serial Number & Claim Derash!</b>

🎯 የልደት ቀንዎን ወይም እድለኛ ቁጥርዎን ከ 1 እስከ 400 ይፈልጉ
🏆 አጠቃላይ ደርሹን ብቻዎን ጠራርገው ይውሰዱ!
🎁 አዳዲስ ተጫዋቾች የ 10 ETB ነፃ ስጦታዎን መውሰድ አይርሱ!

👇 አሁኑኑ ይክፈቱ እና ይጫወቱ!`,
    buttonText: '🍋 ሎሚ ቢንጎን ይክፈቱ • Open Lomi Bingo'
  }
];

const botMessages = [
  {
    text: `👋 <b>ሰላም! የ 10 ETB ነፃ ስጦታዎ ዝግጁ ነው!</b> 🍋🎁
<b>Your Free 10 ETB Welcome Bonus is Waiting!</b>

ካርቴላዎን ያለ ምንም ተቀማጭ በነፃ ይቁረጡ እና እውነተኛ የገንዘብ ሽልማት ያሸንፉ!

👇 ጨዋታውን ለመክፈት ከታች ያለውን ሰማያዊ ቁልፍ ይጫኑ:`,
    buttonText: '🎁 ቦነስዎን ይውሰዱ • Claim 10 ETB'
  },
  {
    text: `⚡ <b>በቴሌብር እና በሲቢኢ ብር ፈጣን ክፍያዎች!</b> 💸
<b>Fast Deposits & Instant Withdrawals!</b>

በሎሚ ቢንጎ ያሸነፉትን ገንዘብ ያለምንም መዘግየት በቅጽበት ማውጣት ይችላሉ!

👇 አሁኑኑ ካርቴላ ቆርጠው ደርሹን ይውሰዱ:`,
    buttonText: '⚡ አሁኑኑ ይጫወቱ • Play Now'
  },
  {
    text: `🔥 <b>አሬናው አሁን በሞቀ ጨዋታ ላይ ነው!</b> 🎯
<b>The Arena is Packed — 50+ Players Live!</b>

ጠረጴዛዎቹ ሞልተዋል! ደርሹ አሁን ትልቅ ደረጃ ላይ ደርሷል! አንዱን ካርቴላ ቆርጠው አብረው ይወዳደሩ!

👇 አሁኑኑ ወደ አሬናው ይግቡ:`,
    buttonText: '🎮 ወደ ጨዋታው ይግቡ • Join Match'
  },
  {
    text: `💰 <b>ትልቅ ማሸነፍ ለሚፈልጉ ተጫዋቾች!</b> 🏆✨
<b>Choose Your Stake: 10, 20, 50, or 100 ETB!</b>

እንደ ምርጫዎ የሚመጥንዎትን ክፍል ይምረጡና ተጋጣሚዎችዎን አሸንፈው ትልቁን ድል ይውሰዱ!

👇 ክፍልዎን ይምረጡ:`,
    buttonText: '🏆 ትልቅ ድል ያሸንፉ • Win Big'
  },
  {
    text: `🎙️ <b>በቀጥታ ድምፅ ጠሪ ይጫወቱ!</b> 🍋
<b>Real Audio Caller in Amharic & English!</b>

የቢንጎ አዳራሹን ስሜት በስልክዎ ላይ በቀጥታ ይለማመዱ! 2 ካርቴላ ቆርጠው ድልዎን ያፋጥኑ!

👇 አሁኑኑ ይጀምሩ:`,
    buttonText: '🍋 ካርቴላ ይቁረጡ • Pick Cartela'
  }
];

async function run() {
  console.log(`\n======================================================`);
  console.log(`📢 POSTING 5 ENGAGING POSTS TO CHANNEL: ${CHANNEL_ID}`);
  console.log(`======================================================\n`);

  for (let i = 0; i < channelPosts.length; i++) {
    const post = channelPosts[i];
    console.log(`Sending Channel Post #${i + 1}: "${post.title}"...`);
    const res = await telegramBotService.sendPhoto(
      CHANNEL_ID,
      post.photo,
      post.caption,
      {
        inlineKeyboard: [
          [{ text: post.buttonText, url: 'https://t.me/LomiBingobot/play' }]
        ]
      }
    );
    if (res.ok) {
      console.log(`  ✓ Successfully posted to ${CHANNEL_ID} (Message ID: ${res.result?.message_id})`);
    } else {
      console.warn(`  ⚠️ Failed to post to ${CHANNEL_ID}:`, res.description);
    }
    // Rate limit pause between channel posts
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log(`\n======================================================`);
  console.log(`🤖 DISPATCHING ENGAGING POSTS TO BOT USERS`);
  console.log(`======================================================\n`);

  // Fetch active bot users
  const usersRes = await query(
    `SELECT DISTINCT telegram_id FROM users WHERE telegram_id IS NOT NULL AND telegram_id > 0 AND bot_started = TRUE`
  );
  const recipients = usersRes.rows.map((r: any) => r.telegram_id);
  console.log(`Found ${recipients.length} active bot users to receive engaging messages.\n`);

  // We broadcast the featured top engaging post with photo to all users
  const topPromo = channelPosts[0]; // 10,000 ETB Mega Pool & 10 ETB Welcome Bonus
  console.log(`Broadcasting featured interactive card to all bot users...`);
  
  let delivered = 0;
  for (const chatId of recipients) {
    try {
      const res = await telegramBotService.sendPhoto(
        chatId,
        topPromo.photo,
        topPromo.caption,
        {
          inlineKeyboard: [
            [{ text: topPromo.buttonText, web_app: { url: APP_URL } }]
          ]
        }
      );
      if (res.ok) {
        delivered++;
      }
    } catch { }
    await new Promise(r => setTimeout(r, 100)); // smooth rate limit
  }

  console.log(`\n✅ Finished! Delivered to ${delivered}/${recipients.length} bot users.`);
  console.log(`\nAll 5 Channel Posts and Bot Broadcast are now LIVE with link: ${APP_URL}\n`);

  await pool.end();
  process.exit(0);
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
