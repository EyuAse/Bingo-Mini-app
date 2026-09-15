import { telegramBotService } from '../services/telegramBotService';

async function publishFreshChannelPost() {
  console.log('================================================================');
  console.log('📢 Publishing Fresh Official Announcement to @lomibingo_official');
  console.log('================================================================\n');

  const announcementText = 
`🍋 <b>እንኳን ወደ ሎሚ ቢንጎ በደህና መጡ!</b> 🎯🎉
<b>Welcome to Lomi Bingo - Ethiopia's Premier Live Bingo!</b>

🇪🇹 <b>በቀጥታ በቴሌግራም የሚጫወቱት ፈጣን እና አስተማማኝ ቢንጎ!</b>

🎁 <b>10 ETB የነፃ ቦነስ ስጦታ</b> ለሁሉም አዳዲስ ተጫዋቾች!
⚡ <b>ፈጣን ተቀማጭ እና ወጪ ክፍያዎች</b> በቴሌብር እና በሲቢኢ ብር!
🎙️ <b>እውነተኛ የድምፅ ጠሪ</b> በአማርኛ እና በእንግሊዝኛ!
🛡️ <b>የኔትወርክ መቋረጥ ጥበቃ ዋስትና:</b> በኔትወርክ ምክንያት ማሸነፍዎ አይቀርም!
👥 <b>ከእውነተኛ ተጫዋቾች ጋር</b> በቀጥታ ይወዳደሩ!

👇 <b>ከታች ያለውን ሰማያዊ ቁልፍ በመጫን አሁኑኑ ጨዋታውን ይጀምሩ!</b>`;

  const result = await telegramBotService.broadcast({
    title: '🍋 Welcome to Lomi Bingo - Official Announcement',
    messageText: announcementText,
    buttonText: '🎮 Play Bingo Now & Claim 10 ETB',
    buttonUrl: 'https://t.me/LomiBingobot/play',
    targetType: 'channel',
    targetId: '@lomibingo_official',
    pinMessage: true
  });

  console.log('Broadcast Result:', result);
  if (result.success) {
    console.log('\n🎉 Fresh announcement published and pinned successfully to @lomibingo_official!');
  } else {
    console.warn('\n⚠️ Broadcast notice:', result.message);
  }

  process.exit(0);
}

publishFreshChannelPost().catch(err => {
  console.error('❌ Failed to publish post:', err);
  process.exit(1);
});
