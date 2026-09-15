import { telegramBotService } from '../services/telegramBotService';

async function runPurge() {
  console.log('================================================================');
  console.log('🧹 Phase B: Purging Old Promotional Posts from Channel');
  console.log('================================================================\n');

  // Purge up to 50 recent message IDs in the channel
  const result = await telegramBotService.purgeChannelPosts('@lomibingo_official', 60);

  console.log('Result:', result);
  if (result.success) {
    console.log(`\n🎉 Purge Completed: Deleted ${result.deletedCount} messages out of ${result.scannedCount} scanned in ${result.channel}!`);
  } else {
    console.warn(`\n⚠️ Notice: ${result.message}`);
  }

  process.exit(0);
}

runPurge().catch(err => {
  console.error('❌ Purge error:', err);
  process.exit(1);
});
