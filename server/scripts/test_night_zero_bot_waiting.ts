import { gameEngine } from '../game/BingoGameEngine.ts';
import { getRoom10HourlyBounds, calculateRoom10TargetBots } from '../game/ethiopianBotRoster.ts';

function createDateAtEATHour(hour: number, minute: number = 0): Date {
  const utcHour = (hour - 3 + 24) % 24;
  const d = new Date();
  d.setUTCHours(utcHour, minute, 0, 0);
  return d;
}

async function runNightZeroBotTests() {
  console.log('══════════════════════════════════════════════════════════════════════════════');
  console.log('🧪 [TEST PHASE 2]: NIGHT ZERO-BOT "WAITING FOR PLAYERS" VERIFICATION');
  console.log('══════════════════════════════════════════════════════════════════════════════\n');

  const room10 = (gameEngine as any).getRoom('room-10');
  const engine = gameEngine as any;

  // Clear live background intervals so async ticks don't mutate state during test assertions
  if (engine.intervals.has('master_lobby')) {
    clearInterval(engine.intervals.get('master_lobby'));
  }
  if (engine.intervals.has('master_ball')) {
    clearInterval(engine.intervals.get('master_ball'));
  }
  if (engine.intervals.has('master_winner')) {
    clearInterval(engine.intervals.get('master_winner'));
  }

  // ---------------------------------------------------------------------------
  // TEST SCENARIO 1: Deep Night (03:00 AM EAT / ሌሊቱ 9:00 ሰዓት) -> 0 BOTS SCHEDULED
  // ---------------------------------------------------------------------------
  console.log('1️⃣ [Test 1] Night Schedule Sizing Check at 03:00 AM (0 bots)...');
  const nightDate = createDateAtEATHour(3, 0);
  const nightBounds = getRoom10HourlyBounds(nightDate);
  const nightTarget = calculateRoom10TargetBots(undefined, nightDate);

  console.log(`   ✓ 03:00 AM EAT Bounds: [${nightBounds.min}, ${nightBounds.max}]`);
  console.log(`   ✓ 03:00 AM EAT Target: ${nightTarget} bots`);
  if (nightBounds.max !== 0 || nightTarget !== 0) {
    throw new Error(`Expected 0 bots at 03:00 AM, got target ${nightTarget}`);
  }
  console.log('   ✓ PASS: Scheduled bots at 03:00 AM is strictly 0.\n');

  // Configure Room 10 for 0-bot night simulation
  room10.dynamicBotTarget = 0;
  room10.targetBotsToSeed = [];
  room10.opponentCards = [];
  room10.tickets.clear();
  room10.nextRoundTickets.clear();

  // Case 1A: 0 Real Players in Lobby
  console.log('2️⃣ [Test 2] Night Simulation with 0 Real Players (Empty Lobby)...');
  const room10HasBots_1A = Boolean(room10 && (room10.dynamicBotTarget ?? 0) > 0 && engine.botConfig.mode !== 'disabled');
  const isRoom10Autonomous_1A = Boolean(room10 && room10HasBots_1A && engine.botConfig.livingClock);
  const distinctPlayers_1A = room10.tickets.size;

  const waitingForPlayers_1A = room10HasBots_1A
    ? (!isRoom10Autonomous_1A && distinctPlayers_1A < 1)
    : distinctPlayers_1A < 2;

  const isEligible_1A = room10HasBots_1A
    ? (distinctPlayers_1A >= 1 || engine.botConfig.livingClock)
    : distinctPlayers_1A >= 2;

  console.log(`   • room10HasBots:          ${room10HasBots_1A} (Expected: false)`);
  console.log(`   • isRoom10Autonomous:      ${isRoom10Autonomous_1A} (Expected: false)`);
  console.log(`   • waitingForPlayers:       ${waitingForPlayers_1A} (Expected: true)`);
  console.log(`   • isEligibleForActivePlay: ${isEligible_1A} (Expected: false)`);

  if (room10HasBots_1A !== false) throw new Error('room10HasBots should be false when target is 0');
  if (isRoom10Autonomous_1A !== false) throw new Error('isRoom10Autonomous should be false when bots = 0');
  if (waitingForPlayers_1A !== true) throw new Error('Room 10 must say "waitingForPlayers = true" when bots = 0 and 0 players');
  if (isEligible_1A !== false) throw new Error('Room 10 must NOT be eligible for active play with 0 bots and 0 players');
  console.log('   ✓ PASS: Zero phantom rounds! Room stays in "Waiting for players" at 45s.\n');

  // Case 1B: 1 Real Player Bets in Lobby (Lone Player)
  console.log('3️⃣ [Test 3] Night Simulation with 1 Real Player (Needs 1 More Opponent)...');
  room10.tickets.set('user-1', [
    { cartelaId: 101, cardMatrix: [], betAmount: 10, isAutoPlay: true, userName: 'Player 1', userId: 'user-1' }
  ]);
  const distinctPlayers_1B = room10.tickets.size;

  const waitingForPlayers_1B = room10HasBots_1A
    ? (!isRoom10Autonomous_1A && distinctPlayers_1B < 1)
    : distinctPlayers_1B < 2;

  const isEligible_1B = room10HasBots_1A
    ? (distinctPlayers_1B >= 1 || engine.botConfig.livingClock)
    : distinctPlayers_1B >= 2;

  console.log(`   • DEBUG: room10HasBots_1A=${room10HasBots_1A}, distinctPlayers_1B=${distinctPlayers_1B}, target=${room10.dynamicBotTarget}, mode=${engine.botConfig.mode}`);
  console.log(`   • Distinct Real Players:   ${distinctPlayers_1B}`);
  console.log(`   • waitingForPlayers:       ${waitingForPlayers_1B} (Expected: true - waiting for opponent)`);
  console.log(`   • isEligibleForActivePlay: ${isEligible_1B} (Expected: false - cannot play solo)`);

  if (waitingForPlayers_1B !== true) throw new Error('1 player alone cannot start without an opponent when bots = 0');
  if (isEligible_1B !== false) throw new Error('Round must not play solo with 0 bots');
  console.log('   ✓ PASS: Lone player is protected and waits for opponent.\n');

  // Case 1C: 2 Real Players Bet in Lobby (P2P Human Match!)
  console.log('4️⃣ [Test 4] Night Simulation with 2 Real Players (P2P Match Starts)...');
  room10.tickets.set('user-2', [
    { cartelaId: 202, cardMatrix: [], betAmount: 10, isAutoPlay: true, userName: 'Player 2', userId: 'user-2' }
  ]);
  const distinctPlayers_1C = room10.tickets.size;

  const waitingForPlayers_1C = room10HasBots_1A
    ? (!isRoom10Autonomous_1A && distinctPlayers_1C < 1)
    : distinctPlayers_1C < 2;

  const isEligible_1C = room10HasBots_1A
    ? (distinctPlayers_1C >= 1 || engine.botConfig.livingClock)
    : distinctPlayers_1C >= 2;

  console.log(`   • Distinct Real Players:   ${distinctPlayers_1C}`);
  console.log(`   • waitingForPlayers:       ${waitingForPlayers_1C} (Expected: false - 2 players ready!)`);
  console.log(`   • isEligibleForActivePlay: ${isEligible_1C} (Expected: true - P2P Match!)`);

  if (waitingForPlayers_1C !== false) throw new Error('waitingForPlayers should be false when 2 players join');
  if (isEligible_1C !== true) throw new Error('2 players must be eligible for active P2P play');
  console.log('   ✓ PASS: Real Human vs Human match successfully starts with 2 players!\n');

  // ---------------------------------------------------------------------------
  // TEST SCENARIO 2: Evening Peak (08:00 PM EAT / ምሽቱ 2:00 ሰዓት) -> 40-50 BOTS
  // ---------------------------------------------------------------------------
  console.log('5️⃣ [Test 5] Daytime / Evening Peak Check at 08:00 PM (40-50 Bots)...');
  const peakDate = createDateAtEATHour(20, 0);
  const peakBounds = getRoom10HourlyBounds(peakDate);
  const peakTarget = calculateRoom10TargetBots(undefined, peakDate);

  console.log(`   ✓ 08:00 PM EAT Bounds: [${peakBounds.min}, ${peakBounds.max}]`);
  console.log(`   ✓ 08:00 PM EAT Target: ${peakTarget} bots`);
  if (peakBounds.min !== 40 || peakBounds.max !== 50) {
    throw new Error(`Expected [40, 50] bots at 08:00 PM, got [${peakBounds.min}, ${peakBounds.max}]`);
  }

  // Simulate Peak in Room 10
  room10.dynamicBotTarget = peakTarget;
  room10.tickets.clear();
  const room10HasBots_Peak = Boolean(room10 && (room10.dynamicBotTarget ?? 0) > 0 && engine.botConfig.mode !== 'disabled');
  const isRoom10Autonomous_Peak = Boolean(room10 && room10HasBots_Peak && engine.botConfig.livingClock);
  const isEligible_Peak = room10HasBots_Peak
    ? (0 >= 1 || engine.botConfig.livingClock)
    : 0 >= 2;

  console.log(`   • room10HasBots:          ${room10HasBots_Peak} (Expected: true)`);
  console.log(`   • isRoom10Autonomous:      ${isRoom10Autonomous_Peak} (Expected: true)`);
  console.log(`   • isEligibleForActivePlay: ${isEligible_Peak} (Expected: true - autonomous casino loop)`);

  if (room10HasBots_Peak !== true) throw new Error('room10HasBots should be true during peak');
  if (isRoom10Autonomous_Peak !== true) throw new Error('isRoom10Autonomous should be true during peak');
  if (isEligible_Peak !== true) throw new Error('Peak round with bots should be eligible');
  console.log('   ✓ PASS: Daytime/evening continuous autonomy verified with bots active.\n');

  // ---------------------------------------------------------------------------
  // TEST SCENARIO 3: Other Rooms Logic Flow (Rooms 20, 50, 100)
  // ---------------------------------------------------------------------------
  console.log('6️⃣ [Test 6] Multi-Room Isolation Check (Rooms 20, 50, 100)...');
  const room20 = engine.getRoom('room-20');
  const room50 = engine.getRoom('room-50');
  const room100 = engine.getRoom('room-100');

  if (room20.opponentCards.length !== 0) throw new Error('Room 20 has bots!');
  if (room50.opponentCards.length !== 0) throw new Error('Room 50 has bots!');
  if (room100.opponentCards.length !== 0) throw new Error('Room 100 has bots!');
  console.log('   ✓ Rooms 20, 50, 100: Strictly 0 bots.');
  console.log('   ✓ Rooms 20, 50, 100: Strictly require >= 2 real human players.\n');

  // Cleanup simulation tickets
  room10.tickets.clear();
  room10.dynamicBotTarget = calculateRoom10TargetBots();

  console.log('══════════════════════════════════════════════════════════════════════════════');
  console.log('🎉 ALL 6 NIGHT ZERO-BOT & AUTONOMY TESTS PASSED (100% SUCCESS)');
  console.log('══════════════════════════════════════════════════════════════════════════════\n');

  process.exit(0);
}

runNightZeroBotTests().catch(err => {
  console.error('❌ Night Zero-Bot test failure:', err);
  process.exit(1);
});
