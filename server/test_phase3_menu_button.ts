import assert from 'assert';
import { telegramBotService } from './services/telegramBotService';

console.log('================================================================');
console.log('🧪 Testing Phase 3: Persistent [ ☰ Menu ] Button & Commands');
console.log('================================================================\n');

async function runPhase3Tests() {
  // Test 1: Register Commands
  console.log('Step 1: Registering Official Bot Commands (/play, /bonus, /promo, /help, /start)...');
  const commandsResult = await telegramBotService.setMyCommands();
  console.log('Commands Registration Result:', commandsResult);
  assert.strictEqual(commandsResult.success, true, 'setMyCommands must return success: true');
  console.log('✅ PASS Step 1: Commands registered successfully\n');

  // Test 2: Fetch Registered Commands from Telegram
  console.log('Step 2: Verifying Commands registered on Telegram Bot API...');
  const registeredCommands = await telegramBotService.getMyCommands();
  console.log('Registered Commands on Telegram:', registeredCommands);
  assert.strictEqual(registeredCommands.ok, true, 'getMyCommands must return ok: true');
  assert(Array.isArray(registeredCommands.commands), 'Registered commands must be an array');
  const playCmd = registeredCommands.commands.find((c: any) => c.command === 'play');
  assert(playCmd, 'Play command must be present in registered commands');
  console.log('✅ PASS Step 2: Registered commands verified on Telegram API\n');

  // Test 3: Set Chat Menu Button to type: 'commands' (Persistent Blue [ ☰ Menu ] Button)
  console.log('Step 3: Setting Chat Menu Button to type: "commands"...');
  const menuResult = await telegramBotService.setChatMenuButton('commands');
  console.log('Menu Button Result:', menuResult);
  assert.strictEqual(menuResult.success, true, 'setChatMenuButton must return success: true');
  console.log('✅ PASS Step 3: Persistent [ ☰ Menu ] Button activated on Telegram\n');

  // Test 4: Verify Chat Menu Button via Telegram API
  console.log('Step 4: Verifying Chat Menu Button type via Telegram API...');
  const menuButtonCheck = await telegramBotService.callApi('getChatMenuButton', {});
  console.log('Current Chat Menu Button on Telegram:', menuButtonCheck);
  assert.strictEqual(menuButtonCheck.ok, true, 'getChatMenuButton must return ok: true');
  assert.strictEqual(menuButtonCheck.result?.type, 'commands', 'Menu button type must be "commands"');
  console.log('✅ PASS Step 4: Menu button is confirmed active as "commands" type on Telegram\n');

  console.log('================================================================');
  console.log('🎉 ALL PHASE 3 TESTS PASSED (100%) - MENU BUTTON IS LIVE!');
  console.log('================================================================\n');
}

runPhase3Tests().catch(err => {
  console.error('❌ Phase 3 Test Failed:', err);
  process.exit(1);
});
