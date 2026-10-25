import assert from 'assert';
import adminRouter from '../routes/admin.ts';
import { gameEngine } from '../game/BingoGameEngine.ts';

console.log('================================================================');
console.log('🧪 Starting Phase 6 Verification: Admin Bot Engine API & Controls');
console.log('================================================================\n');

// Helper to find route handler on adminRouter
function getRouteHandler(method: string, path: string) {
  const layer = (adminRouter as any).stack.find(
    (l: any) => l.route && l.route.path === path && l.route.methods[method.toLowerCase()]
  );
  assert(layer, `Could not find ${method.toUpperCase()} ${path} route on adminRouter`);
  return layer.route.stack[layer.route.stack.length - 1].handle;
}

// Helper to invoke route handler with mock req/res
async function callRoute(handler: Function, body: any = {}, query: any = {}) {
  let resData: any = null;
  const mockReq: any = {
    body,
    query,
    user: { id: 'admin-id', role: 'admin' }
  };
  const mockRes: any = {
    status: (code: number) => ({
      json: (data: any) => { resData = { code, ...data }; return resData; }
    }),
    json: (data: any) => { resData = { code: 200, ...data }; return resData; }
  };

  await handler(mockReq, mockRes);
  return resData;
}

async function runPhase6Tests() {
  const getBotConfigHandler = getRouteHandler('GET', '/bot-config');
  const postBotConfigHandler = getRouteHandler('POST', '/bot-config');

  console.log('--- Test 1: GET /api/admin/bot-config ---');
  const getRes = await callRoute(getBotConfigHandler);
  assert.strictEqual(getRes.code, 200, 'GET /bot-config must return 200');
  assert.strictEqual(getRes.success, true, 'GET /bot-config must return success: true');
  assert(getRes.botConfig, 'Response must include botConfig object');
  assert(typeof getRes.botConfig.minBots === 'number', 'minBots must be a number');
  assert(typeof getRes.botConfig.maxBots === 'number', 'maxBots must be a number');
  assert(getRes.telemetry, 'Response must include telemetry object');
  assert(typeof getRes.telemetry.activeBotCount === 'number', 'telemetry.activeBotCount must be a number');
  console.log('   ✅ GET /bot-config returned valid config and Room 10 telemetry:', getRes.botConfig);

  console.log('\n--- Test 2: POST /api/admin/bot-config with Fixed Count (35 Bots) ---');
  const postFixedRes = await callRoute(postBotConfigHandler, {
    mode: 'fixed',
    fixedCount: 35
  });
  assert.strictEqual(postFixedRes.code, 200, 'POST /bot-config must return 200');
  assert.strictEqual(postFixedRes.botConfig.mode, 'fixed', 'Mode must be updated to fixed');
  assert.strictEqual(postFixedRes.botConfig.fixedCount, 35, 'fixedCount must be updated to 35');

  const room10 = gameEngine.getRoom('room-10')!;
  (gameEngine as any).syncRoom10StandbyBots(room10, true);
  assert.strictEqual(room10.opponentCards.length, 35, 'Room 10 must synchronize to exactly 35 bots');
  console.log(`   ✅ Room 10 successfully adopted 35 bots in fixed mode`);

  console.log('\n--- Test 3: POST /api/admin/bot-config with Dynamic Range (6 to 14 Bots) ---');
  const postDynamicRes = await callRoute(postBotConfigHandler, {
    mode: 'dynamic',
    minBots: 6,
    maxBots: 14
  });
  assert.strictEqual(postDynamicRes.code, 200, 'POST /bot-config must return 200');
  assert.strictEqual(postDynamicRes.botConfig.mode, 'dynamic', 'Mode must be updated to dynamic');
  assert.strictEqual(postDynamicRes.botConfig.minBots, 6, 'minBots must be updated to 6');
  assert.strictEqual(postDynamicRes.botConfig.maxBots, 14, 'maxBots must be updated to 14');

  (gameEngine as any).syncRoom10StandbyBots(room10, true);
  assert(
    room10.opponentCards.length >= 6 && room10.opponentCards.length <= 14,
    `Room 10 bot count ${room10.opponentCards.length} must be within [6, 14]`
  );
  console.log(`   ✅ Room 10 dynamic target generated ${room10.opponentCards.length} bots within bounds [6, 14]`);

  console.log('\n--- Test 4: POST /api/admin/bot-config with Disabled Mode (0 Bots) ---');
  const postDisabledRes = await callRoute(postBotConfigHandler, {
    mode: 'disabled'
  });
  assert.strictEqual(postDisabledRes.code, 200, 'POST /bot-config must return 200');
  assert.strictEqual(postDisabledRes.botConfig.mode, 'disabled', 'Mode must be disabled');

  (gameEngine as any).syncRoom10StandbyBots(room10, true);
  assert.strictEqual(room10.opponentCards.length, 0, 'Room 10 must have strictly 0 bots when disabled');
  console.log(`   ✅ Room 10 successfully disabled bots (0 bots active)`);

  console.log('\n--- Test 5: Boundary & Validation Rejections (HTTP 400) ---');
  // Rejection A: fixedCount > 50
  const rej1 = await callRoute(postBotConfigHandler, { fixedCount: 75 });
  assert.strictEqual(rej1.code, 400, 'fixedCount > 50 must return 400');
  console.log('   ✅ Rejected fixedCount=75 with 400 Bad Request');

  // Rejection B: minBots < 0
  const rej2 = await callRoute(postBotConfigHandler, { minBots: -5 });
  assert.strictEqual(rej2.code, 400, 'minBots < 0 must return 400');
  console.log('   ✅ Rejected minBots=-5 with 400 Bad Request');

  // Rejection C: minBots > maxBots
  const rej3 = await callRoute(postBotConfigHandler, { minBots: 40, maxBots: 20 });
  assert.strictEqual(rej3.code, 400, 'minBots > maxBots must return 400');
  console.log('   ✅ Rejected minBots=40 > maxBots=20 with 400 Bad Request');

  // Rejection D: invalid mode
  const rej4 = await callRoute(postBotConfigHandler, { mode: 'super_bot_mode' });
  assert.strictEqual(rej4.code, 400, 'Invalid mode must return 400');
  console.log('   ✅ Rejected invalid mode with 400 Bad Request');

  console.log('\n--- Test 6: Strict Multi-Room Isolation Audit ---');
  for (const p2pId of ['room-20', 'room-50', 'room-100']) {
    const p2pRoom = gameEngine.getRoom(p2pId)!;
    assert.strictEqual(p2pRoom.opponentCards.length, 0, `${p2pId} must have strictly 0 bots`);
    (gameEngine as any).syncRoom10StandbyBots(p2pRoom, true);
    assert.strictEqual(p2pRoom.opponentCards.length, 0, `${p2pId} must remain strictly 0 bots after sync`);
  }
  console.log('   ✅ Rooms 20, 50, and 100 verified: strictly 0 bots, 100% human-only peer-to-peer');

  // Restore healthy default bot config
  await callRoute(postBotConfigHandler, {
    mode: 'dynamic',
    minBots: 0,
    maxBots: 50,
    fixedCount: 20,
    staggeredJoin: true,
    livingClock: true
  });
  (gameEngine as any).syncRoom10StandbyBots(room10, true);

  console.log('\n================================================================');
  console.log('🎉 PHASE 6 VERIFICATION COMPLETE: ALL ASSERTIONS PASSED (100%)');
  console.log('================================================================');
  process.exit(0);
}

runPhase6Tests().catch(err => {
  console.error('Phase 6 verification failed:', err);
  process.exit(1);
});
