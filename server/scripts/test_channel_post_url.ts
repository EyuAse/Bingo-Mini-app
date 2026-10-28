import { telegramBotService } from '../services/telegramBotService.ts';

async function testChannelPostUrlResolution() {
  console.log('══════════════════════════════════════════════════════════════════════════════');
  console.log('🧪 [TEST]: TELEGRAM CHANNEL POST URL RESOLUTION VERIFICATION');
  console.log('══════════════════════════════════════════════════════════════════════════════\n');

  const cfg = await telegramBotService.getConfig();
  console.log(`1️⃣ Current Configured WebApp URL: ${cfg.webAppUrl}`);
  if (!cfg.webAppUrl.includes('workers.dev') && !cfg.webAppUrl.includes('pages.dev')) {
    console.warn(`   ⚠️ Warning: webAppUrl is currently '${cfg.webAppUrl}'. Expected Cloudflare domain.`);
  } else {
    console.log(`   ✓ PASS: Configured WebApp URL is active on Cloudflare CDN.\n`);
  }

  // ---------------------------------------------------------------------------
  // TEST SCENARIO 1: Channel broadcast with NO buttonUrl provided (Default behavior)
  // ---------------------------------------------------------------------------
  console.log('2️⃣ [Test 1] Channel Post with default / empty button URL...');
  // Intercept callApi to inspect the exact payload sent to Telegram API
  let capturedPayload: any = null;
  const originalCallApi = (telegramBotService as any).callApi.bind(telegramBotService);
  (telegramBotService as any).callApi = async (method: string, payload: any) => {
    if (method === 'sendMessage' || method === 'sendPhoto') {
      capturedPayload = payload;
      return { ok: true, result: { message_id: 999999 } };
    }
    return originalCallApi(method, payload);
  };

  // Test broadcast with channel target and empty buttonUrl
  await telegramBotService.broadcast({
    title: 'Test Channel Broadcast',
    messageText: 'Test message body',
    buttonText: '🎮 Play Bingo Now',
    buttonUrl: undefined,
    targetType: 'channel',
    targetId: '@lomibingo_official'
  });

  const btnUrl1 = capturedPayload?.reply_markup?.inline_keyboard?.[0]?.[0]?.url;
  console.log(`   • Resulting Button URL: ${btnUrl1}`);

  if (!btnUrl1) {
    throw new Error('No button URL was generated for channel post!');
  }
  if (btnUrl1.includes('onrender.com')) {
    throw new Error(`CRITICAL: Channel post button contains old render link: ${btnUrl1}`);
  }
  if (!btnUrl1.includes('workers.dev') && !btnUrl1.includes('pages.dev')) {
    throw new Error(`Expected Cloudflare URL in channel button, got: ${btnUrl1}`);
  }
  console.log('   ✓ PASS: Default channel post successfully generates Cloudflare URL with 0 render links!\n');

  // ---------------------------------------------------------------------------
  // TEST SCENARIO 2: Channel post where admin accidentally entered an old onrender link
  // ---------------------------------------------------------------------------
  console.log('3️⃣ [Test 2] Channel Post with accidental legacy onrender.com URL in buttonUrl...');
  capturedPayload = null;
  await telegramBotService.broadcast({
    title: 'Test Old Render Protection',
    messageText: 'Test message body',
    buttonText: '🎮 Play Bingo Now',
    buttonUrl: 'https://bingo-mini-app-30pe.onrender.com',
    targetType: 'channel',
    targetId: '@lomibingo_official'
  });

  const btnUrl2 = capturedPayload?.reply_markup?.inline_keyboard?.[0]?.[0]?.url;
  console.log(`   • Resulting Button URL: ${btnUrl2}`);

  if (btnUrl2.includes('onrender.com')) {
    throw new Error(`CRITICAL: Legacy onrender.com URL was not sanitized: ${btnUrl2}`);
  }
  if (!btnUrl2.includes('workers.dev') && !btnUrl2.includes('pages.dev')) {
    throw new Error(`Expected Cloudflare URL after sanitizing onrender link, got: ${btnUrl2}`);
  }
  console.log('   ✓ PASS: Accidental onrender.com URL automatically replaced with Cloudflare WebApp URL!\n');

  // ---------------------------------------------------------------------------
  // TEST SCENARIO 3: Channel post with explicit valid Cloudflare link
  // ---------------------------------------------------------------------------
  console.log('4️⃣ [Test 3] Channel Post with explicit Cloudflare workers.dev URL...');
  capturedPayload = null;
  await telegramBotService.broadcast({
    title: 'Test Explicit Cloudflare URL',
    messageText: 'Test message body',
    buttonText: '🎮 Play Bingo Now',
    buttonUrl: 'https://bingo-mini-app.asefaeyob962.workers.dev',
    targetType: 'channel',
    targetId: '@lomibingo_official'
  });

  const btnUrl3 = capturedPayload?.reply_markup?.inline_keyboard?.[0]?.[0]?.url;
  console.log(`   • Resulting Button URL: ${btnUrl3}`);

  if (btnUrl3.includes('onrender.com')) {
    throw new Error(`CRITICAL: Old render link appeared: ${btnUrl3}`);
  }
  if (!btnUrl3.startsWith('https://bingo-mini-app.asefaeyob962.workers.dev')) {
    throw new Error(`Expected explicit Cloudflare URL preserved, got: ${btnUrl3}`);
  }
  console.log('   ✓ PASS: Explicit Cloudflare link preserved with versioning!\n');

  // ---------------------------------------------------------------------------
  // TEST SCENARIO 4: Restore callApi and finish
  // ---------------------------------------------------------------------------
  (telegramBotService as any).callApi = originalCallApi;

  console.log('══════════════════════════════════════════════════════════════════════════════');
  console.log('🎉 ALL CHANNEL POST LINK TESTS PASSED (100% SUCCESS)');
  console.log('══════════════════════════════════════════════════════════════════════════════\n');

  process.exit(0);
}

testChannelPostUrlResolution().catch(err => {
  console.error('❌ Channel Post URL Test Failed:', err);
  process.exit(1);
});
