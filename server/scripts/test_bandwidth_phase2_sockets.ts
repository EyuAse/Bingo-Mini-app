/**
 * test_bandwidth_phase2_sockets.ts
 *
 * Automated verification of Bandwidth Optimization Phase 2:
 * 1. Verifies WebSocket RFC 7692 perMessageDeflate configuration and ping intervals in server/io.ts
 * 2. Verifies BingoGameEngine.broadcastStakeRoomsSummary state-diffing suppresses redundant packets
 * 3. Verifies forced broadcast immediately fires on ticket mutation
 * 4. Verifies 5s heartbeat fallback when state remains unchanged
 */

import { initSocketIO } from '../io.ts';
import { createServer } from 'http';
import { gameEngine, ARENA_ROOM_ID } from '../game/BingoGameEngine.ts';

async function runPhase2SocketTests() {
  console.log('🚀 [Test] Starting Phase 2 WebSocket Bandwidth Optimization Test Suite...\n');

  // 1. Verify Socket.IO server configuration
  console.log('--- TEST 1: Socket.IO perMessageDeflate & Ping Intervals Configuration ---');
  const dummyHttp = createServer();
  const testIO = initSocketIO(dummyHttp);
  const opts: any = (testIO as any).opts;

  if (!opts.perMessageDeflate) {
    throw new Error('❌ perMessageDeflate is not defined on Socket.IO server instance!');
  }
  console.log('   ✅ perMessageDeflate is enabled:', opts.perMessageDeflate);

  if (opts.perMessageDeflate.threshold !== 1024) {
    throw new Error(`❌ Expected perMessageDeflate threshold 1024, got ${opts.perMessageDeflate.threshold}`);
  }
  console.log('   ✅ Deflate threshold is 1024 bytes (small ticks uncompressed, large states compressed)');

  if (opts.pingInterval !== 20000 || opts.pingTimeout !== 20000) {
    throw new Error(`❌ Expected pingInterval 20000 and pingTimeout 20000, got ${opts.pingInterval}/${opts.pingTimeout}`);
  }
  console.log('   ✅ Ping interval/timeout successfully set to 20s (slashes ping packet frequency by 50%)');
  // 2. Verify State-Diffing and packet suppression in BingoGameEngine
  console.log('\n--- TEST 2: BingoGameEngine State-Diffing Packet Suppression ---');
  const engine = gameEngine;

  let emitCount = 0;
  let lastEmittedPayload: any = null;

  // Spy on testIO.emit directly
  const originalIoEmit = testIO.emit.bind(testIO);
  testIO.emit = (ev: string, ...args: any[]): any => {
    if (ev === 'stake_rooms_summary') {
      emitCount++;
      lastEmittedPayload = args[0];
    }
    return (originalIoEmit as any)(ev, ...args);
  };

  try {
    // Reset engine tracking to clean initial test state
    (engine as any).lastBroadcastSummaryStr = '';
    (engine as any).lastSummaryBroadcastTimestamp = 0;

    // Initial call: has changed from '' to summary JSON -> should emit 1 time
    emitCount = 0;
    engine.broadcastStakeRoomsSummary(false);
    if (emitCount !== 1) {
      throw new Error(`❌ Expected 1 initial emit on first broadcast, got ${emitCount}`);
    }
    console.log('   ✅ Initial state broadcast emitted exactly 1 packet:', lastEmittedPayload);

    // Call 100 times consecutively without state change -> should emit 0 additional packets!
    for (let i = 0; i < 100; i++) {
      engine.broadcastStakeRoomsSummary(false);
    }
    if (emitCount !== 1) {
      throw new Error(`❌ Suppressed broadcast failed! Expected emitCount to stay 1, but got ${emitCount}`);
    }
    console.log('   ✅ 100 consecutive ticks with unchanged state resulted in 0 redundant packets (100% suppressed)!');

    // Force call -> should emit immediately
    engine.broadcastStakeRoomsSummary(true);
    if (emitCount !== 2) {
      throw new Error(`❌ Force broadcast failed! Expected emitCount to become 2, got ${emitCount}`);
    }
    console.log('   ✅ Forced broadcast (e.g. ticket purchase/cancel) emitted immediately (emitCount: 2)');

    // Simulate 5001ms time passage for heartbeat
    const lastTime = (engine as any).lastSummaryBroadcastTimestamp;
    (engine as any).lastSummaryBroadcastTimestamp = lastTime - 5005;

    engine.broadcastStakeRoomsSummary(false);
    if (emitCount !== 3) {
      throw new Error(`❌ Heartbeat broadcast failed! Expected emitCount 3 after 5s passage, got ${emitCount}`);
    }
    console.log('   ✅ Heartbeat broadcast emitted after 5s interval (emitCount: 3)');

    // 3. Verify Empty Adapter Guard for ARENA_ROOM_ID and 'default'
    console.log('\n--- TEST 3: ARENA_ROOM_ID & "default" Empty Adapter Room Guard ---');
    const room10 = engine.getRoom('room-10');
    if (!room10) {
      throw new Error('❌ room-10 not found in BingoGameEngine');
    }

    let arenaEmits = 0;
    const originalTo = testIO.to.bind(testIO);
    testIO.to = (target: string): any => {
      if (target === ARENA_ROOM_ID || target === 'default') {
        arenaEmits++;
      }
      return (originalTo as any)(target);
    };

    // When adapter has no sockets in ARENA_ROOM_ID or default, broadcastRoomState should NOT emit to them
    engine.broadcastRoomState(room10);
    if (arenaEmits !== 0) {
      throw new Error(`❌ Expected 0 emits to empty arena/default rooms, but got ${arenaEmits}`);
    }
    console.log('   ✅ Empty adapter rooms ARENA_ROOM_ID & "default" correctly skipped during broadcastRoomState');

    testIO.to = originalTo;

    console.log('\n🎉 [Success] All Phase 2 WebSocket Bandwidth Optimization Tests Passed Perfectly!');
    process.exit(0);
  } finally {
    testIO.emit = originalIoEmit;
    testIO.close();
  }
}

runPhase2SocketTests().catch(err => {
  console.error('❌ [Phase 2 Test Failure]:', err);
  process.exit(1);
});
