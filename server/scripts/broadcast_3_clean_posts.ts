import dotenv from 'dotenv';
dotenv.config();
import { telegramBotService } from '../services/telegramBotService.ts';
import { query, pool } from '../db.ts';

const APP_URL = 'https://bingo-mini-app-3li9.onrender.com/?v=20261025_RESPONSIVE_V1';

const posts = [
  {
    title: 'Weekend 10,000 ETB Mega Pool & 10 ETB Free Gift',
    photo: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=800&auto=format&fit=crop&q=80',
    caption: `🎉 <b>ታላቅ የሳምንቱ መጨረሻ የሎሚ ቢንጎ ውድድር!</b> 🍋✨
<b>10,000 ETB Mega Pool Tournament is LIVE!</b>

💰 <b>የሳምንቱ አጠቃላይ የሽልማት ፈንድ</b>: <b>10,000 ETB!</b>
🎁 አዲስ ለተመዘገቡ ተጫዋቾች <b>10 ETB ነፃ ቦነስ</b> ተዘጋጅቷል!
⚡ ጨዋታው በየ 2 ደቂቃው ይጀምራል — ፈጣን፣ ፍትሃዊ እና እጅግ አስደሳች!

📌 <b>እንዴት መጫወት ይቻላል?</b>
1️⃣ ከታች ያለውን ሰማያዊ ቁልፍ ይጫኑ
2️⃣ 1 ወይም ከዚያ በላይ ካርቴላ ይምረጡ
3️⃣ ቁጥሮችዎን ይከተሉና "ቢንጎ!" ብለው በአንድ ቅጽበት ያሸንፉ!

👇 <b>ካርቴላዎን አሁኑኑ ይቁረጡና የዕድሉ ተካፋይ ይሁኑ!</b>`,
    buttonText: '🎮 አሁኑኑ ይጫወቱ • Play Bingo Now'
  },
  {
    title: 'Instant Telebirr & CBE Birr Cashier',
    photo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    caption: `💸 <b>በሰከንዶች ውስጥ ያሸነፉትን ገንዘብ ያውጡ!</b> ⚡🏦
<b>Instant Cashouts via Telebirr & CBE Birr!</b>

🛡️ <b>100% አስተማማኝ እና ፈጣን የተቀማጭና የወጪ ክፍያዎች</b>
📱 በቴሌብር (Telebirr) እና በሲቢኢ ብር (CBE Birr) ያሸነፉት ገንዘብ በቀጥታ ወደ አካውንትዎ በደቂቃዎች ውስጥ ይደርሳል!
🎯 በትንሽ ብር ጀምረው ትልቅ ደርሽ ይውሰዱ — 24/7 ፈጣን አገልግሎት!

👇 <b>አሁኑኑ ይግቡ፣ ይጫወቱ፣ ያሸንፉ!</b>`,
    buttonText: '💰 ካርቴላ ይቁረጡ • Get Tickets'
  },
  {
    title: 'Authentic Addis Audio Caller & 50+ Player Live Arena',
    photo: 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?w=800&auto=format&fit=crop&q=80',
    caption: `🎙️ <b>እውነተኛ የአማርኛ ድምፅ ጠሪ በቀጥታ በቴሌግራም!</b> 🇪🇹🍋
<b>Authentic Addis Bingo Hall Atmosphere!</b>

🔥 <b>ከ 50 በላይ ተጫዋቾች</b> በአንድ ላይ የሚፎካከሩበት የቀጥታ አሬና!
🔊 እውነተኛ የአዲስ አበባ ቢንጎ ጠሪ ድምፅ ቁጥሮችን ይጠራል
⚡ በየ 10 ሴኮንዱ አዳዲስ አሸናፊዎች የሚፈጠሩበት ተወዳጅ ጨዋታ!

👇 <b>ድምፁን ከፍ ያድርጉና አሁኑኑ ተቀላቀሉ!</b>`,
    buttonText: '🔥 ወደ አሬናው ይግቡ • Enter Arena'
  }
];

async function broadcastPosts() {
  console.log('🚀 Starting broadcast of 3 clean, engaging posts to all Telegram bot users...');

  // 1. Fetch all eligible telegram users
  const usersRes = await query(
    `SELECT DISTINCT telegram_id 
     FROM users 
     WHERE telegram_id IS NOT NULL 
       AND telegram_id > 0
       AND (bot_blocked IS NULL OR bot_blocked = FALSE)
     ORDER BY telegram_id ASC`
  );

  const recipients = usersRes.rows.map((r: any) => Number(r.telegram_id));
  console.log(`📋 Total eligible recipients found: ${recipients.length}`);

  if (recipients.length === 0) {
    console.error('No recipients found!');
    await pool.end();
    return;
  }

  for (let pIdx = 0; pIdx < posts.length; pIdx++) {
    const post = posts[pIdx];
    console.log(`\n======================================================`);
    console.log(`📢 [Post ${pIdx + 1}/${posts.length}]: "${post.title}"`);
    console.log(`======================================================`);

    const inlineKeyboard = [
      [
        {
          text: post.buttonText,
          web_app: { url: APP_URL }
        }
      ]
    ];

    let sent = 0;
    let failed = 0;
    const batchSize = 25;

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (chatId: number) => {
          try {
            const res = await telegramBotService.sendPhoto(chatId, post.photo, post.caption, { inlineKeyboard });
            if (res.ok) {
              sent++;
              query('UPDATE users SET bot_started = TRUE, bot_blocked = FALSE WHERE telegram_id = $1', [chatId]).catch(() => {});
            } else {
              failed++;
              const desc = (res.description || '').toLowerCase();
              if (desc.includes('bot was blocked') || desc.includes('deactivated') || desc.includes("can't initiate")) {
                query('UPDATE users SET bot_blocked = TRUE, bot_started = FALSE WHERE telegram_id = $1', [chatId]).catch(() => {});
              }
            }
          } catch {
            failed++;
          }
        })
      );

      process.stdout.write(`  Progress: ${Math.min(i + batchSize, recipients.length)}/${recipients.length} (Sent: ${sent}, Failed: ${failed})\r`);
      if (i + batchSize < recipients.length) {
        await new Promise(r => setTimeout(r, 1050));
      }
    }

    console.log(`\n✅ Post ${pIdx + 1} completed! Total Delivered: ${sent}, Failed/Blocked: ${failed}`);

    // Record into telegram_broadcasts table
    try {
      await query(
        `INSERT INTO telegram_broadcasts 
         (title, message_text, photo_url, button_text, button_url, target_type, target_id, pin_message, total_recipients, sent_count, failed_count, status)
         VALUES ($1, $2, $3, $4, $5, 'all_users', 'all_users', false, $6, $7, $8, 'completed')`,
        [post.title, post.caption, post.photo, post.buttonText, APP_URL, recipients.length, sent, failed]
      );
    } catch (e) {
      console.warn('Could not record broadcast history:', e);
    }

    // Small breather between the 3 distinct posts
    if (pIdx < posts.length - 1) {
      console.log('⏳ Waiting 2 seconds before sending next post...');
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  // Also set the latest featured promo as active in-bot promo
  try {
    const featured = posts[0];
    await query(
      `INSERT INTO admin_settings (key, value, updated_at)
       VALUES 
         ('telegram_active_promo_title', $1, NOW()),
         ('telegram_active_promo_text', $2, NOW()),
         ('telegram_active_promo_photo', $3, NOW()),
         ('telegram_active_promo_button_text', $4, NOW()),
         ('telegram_active_promo_button_url', $5, NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [featured.title, featured.caption, featured.photo, featured.buttonText, APP_URL]
    );
    console.log('✨ Updated active in-bot promotion (/promo) settings.');
  } catch (e) {
    console.warn('Failed to update active promo settings:', e);
  }

  console.log('\n🎉 ALL 3 CLEAN ENGAGING POSTS SUCCESSFULLY BROADCAST TO ALL BOT USERS!');
  await pool.end();
}

broadcastPosts().catch(err => {
  console.error('Fatal error during broadcast:', err);
  process.exit(1);
});
