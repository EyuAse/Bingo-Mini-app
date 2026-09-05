import { gameEngine } from './game/BingoGameEngine.ts';

async function testEngineFairness() {
  console.log('🧪 Testing Live BingoGameEngine Fairness & Win Mechanics...');

  // 1. Verify Default Fairness Config
  const cfg = gameEngine.getFairnessConfig();
  console.log('Engine Fairness Config:', cfg);
  if (cfg.ownerWinRate !== 20 || cfg.botWinRate !== 30 || cfg.realPlayerWinRate !== 50) {
    throw new Error(`Unexpected default win rates: ${JSON.stringify(cfg)}`);
  }
  if (cfg.roomCapacity !== 50) {
    throw new Error(`Unexpected default roomCapacity: ${cfg.roomCapacity}`);
  }
  console.log('✅ Default 20% Owner, 30% Bot, 50% Real Player confirmed!');

  // 2. Test updating room capacity and win rates
  gameEngine.setFairnessConfig({ roomCapacity: 60, ownerWinRate: 15, botWinRate: 35 });
  const updatedCfg = gameEngine.getFairnessConfig();
  console.log('Updated Engine Config:', updatedCfg);
  if (updatedCfg.roomCapacity !== 60 || updatedCfg.ownerWinRate !== 15 || updatedCfg.botWinRate !== 35 || updatedCfg.realPlayerWinRate !== 50) {
    throw new Error(`Config update failed: ${JSON.stringify(updatedCfg)}`);
  }
  console.log('✅ Admin configuration update verified!');

  // Reset to client spec: 20% Owner, 30% Bot, 50% Real Player, 50 capacity
  gameEngine.setFairnessConfig({ roomCapacity: 50, ownerWinRate: 20, botWinRate: 30 });
  const finalCfg = gameEngine.getFairnessConfig();
  console.log('Final Client Config:', finalCfg);

  console.log('🎉 ALL ENGINE FAIRNESS TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
}

testEngineFairness().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
