import { telegramBotService } from '../services/telegramBotService.ts';

async function main() {
  console.log('--- 1. Testing normalizeChannelIdentifier ---');
  console.log('https://t.me/lomibingo_official ->', telegramBotService.normalizeChannelIdentifier('https://t.me/lomibingo_official'));
  console.log('t.me/lomibingo_official ->', telegramBotService.normalizeChannelIdentifier('t.me/lomibingo_official'));
  console.log('lomibingo_official ->', telegramBotService.normalizeChannelIdentifier('lomibingo_official'));
  console.log('@lomibingo_official ->', telegramBotService.normalizeChannelIdentifier('@lomibingo_official'));

  console.log('\n--- 2. Testing verifyChannelStatus ---');
  const healthWithUrl = await telegramBotService.verifyChannelStatus('https://t.me/lomibingo_official');
  console.log('Health with full URL:', healthWithUrl);

  const healthWithHandle = await telegramBotService.verifyChannelStatus('@lomibingo_official');
  console.log('Health with handle:', healthWithHandle);

  console.log('\n--- 3. Testing Channel Broadcast with URL input ---');
  const postRes = await telegramBotService.broadcast({
    title: '🍋 Live Verification Post',
    messageText: '🎉 Test announcement to verify channel integration works directly with https://t.me/lomibingo_official!',
    buttonText: '🎮 Play Bingo',
    buttonUrl: 'https://t.me/LomiBingobot/play',
    targetType: 'channel',
    targetId: 'https://t.me/lomibingo_official',
    pinMessage: false
  });
  console.log('Broadcast Result:', postRes);

  if (postRes.success) {
    console.log('✅ Successfully posted to channel using raw link input!');
  } else {
    console.error('❌ Failed:', postRes.message);
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
