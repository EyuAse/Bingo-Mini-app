import { setup3RegisteredBots } from './setup_3_registered_bots.ts';

export async function setupBotAccounts() {
  await setup3RegisteredBots();
}

// Self-run if called directly
if (process.argv[1]?.includes('setup_bot_accounts')) {
  setupBotAccounts()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ [Bot Database Setup Error]:', err);
      process.exit(1);
    });
}
