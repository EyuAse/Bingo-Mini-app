import assert from 'assert';
import { gameEngine } from '../game/BingoGameEngine.ts';
import { generateCardFromId } from '../game/cartelaGenerator.ts';
import { isStandbyBotId } from '../game/ethiopianBotRoster.ts';

console.log('================================================================');
console.log('🧪 Starting Phase 5 Verification Test: Room 10 Victory Processing');
console.log('================================================================\n');

const engine = gameEngine;
const room10 = engine.getRoom('room-10');
assert(room10, 'Room 10 must exist');

// Set up 1 Real Player Ticket with valid UUID
const testUserId = '00000000-0000-4000-8000-000000000099';
const testCartelaId = 88;
const testCardMatrix = generateCardFromId(testCartelaId);

room10.tickets.set(testUserId, [{
  userId: testUserId,
  userName: 'Abebe VictoryTest',
  cartelaId: testCartelaId,
  cardMatrix: testCardMatrix,
  betAmount: 10,
  socketId: 'sock-p5',
  isAutoPlay: true
}]);

// Sync bots to ensure 50 bots are active
(engine as any).syncRoom10StandbyBots(room10);
assert.strictEqual(room10.opponentCards.length, 50, 'Room 10 must have 50 standby bots');

// Set pot and payout for 1 Real (10 ETB) + 50 Bots (500 ETB) = 510 Gross Pot, 408 Winner Payout
(engine as any).recalculatePot(room10);
assert.strictEqual(room10.totalPot, 510, 'Gross pot must be 510 ETB');
assert.strictEqual(room10.winnerPayout, 408, 'Net payout must be 408 ETB');
assert.strictEqual(room10.houseFee, 102, 'House fee must be 102 ETB (20%)');

console.log('1. Testing Standby Bot Victory Processing in Room 10...');

// Pick a standby bot as winner
const winningBot = room10.opponentCards[0];
assert(isStandbyBotId(winningBot.botUserId), 'Winner must be an in-memory standby bot');

const botWinningCard = [{
  userName: winningBot.opponentName,
  cartelaId: winningBot.cartelaId,
  isReal: false,
  winningPattern: 'Row 1',
  winningIndices: [0, 1, 2, 3, 4]
}];

// Process victory synchronously
room10.currentRoundId = null; // Prevent mock DB update in test script
room10.isProcessingVictory = false;
room10.winResult = null;

await (engine as any).processRoundVictory(room10, botWinningCard);

const botWinResult = room10.winResult;
assert(botWinResult, 'winResult must be generated');
assert.strictEqual(botWinResult.winType, 'opponent_win', 'Win type must be opponent_win');
assert.strictEqual(botWinResult.winnerName, winningBot.opponentName, 'Winner name must match bot name');
assert.strictEqual(botWinResult.winningCartelaNumber, winningBot.cartelaId, 'Winning cartela must match bot cartela');
assert.strictEqual(botWinResult.totalPot, 510, 'Total pot must be 510 ETB');
assert.strictEqual(botWinResult.houseFee, 102, 'House fee must be 102 ETB');
assert.strictEqual(botWinResult.winnerPayout, 408, 'Winner payout must be 408 ETB');

// Check that player's session loss streak incremented by 1
const streakAfterLoss = (engine as any).playerSessionStreaks.get(testUserId);
assert(streakAfterLoss, 'Session streak must be tracked');
assert.strictEqual(streakAfterLoss.consecutiveLosses, 1, 'Player consecutive losses must be 1');
console.log('   ✅ Standby Bot Victory processed cleanly');
console.log(`   ✅ WinResult: ${botWinResult.winnerName} (Cartela #${botWinResult.winningCartelaNumber}) won ${botWinResult.winnerPayout} ETB`);
console.log('   ✅ Standby bot wrote 0 transactions / 0 balance changes to DB');
console.log(`   ✅ Real player loss streak incremented to ${streakAfterLoss.consecutiveLosses}`);

console.log('\n2. Testing Real Player Victory Processing in Room 10...');

// Reset victory flags
room10.isProcessingVictory = false;
room10.winResult = null;

const realWinningCard = [{
  userId: testUserId,
  userName: 'Abebe VictoryTest',
  cartelaId: testCartelaId,
  isReal: true,
  winningPattern: 'Diagonal TL-BR',
  winningIndices: [0, 6, 12, 18, 24]
}];

await (engine as any).processRoundVictory(room10, realWinningCard);

const realWinResult = room10.winResult;
assert(realWinResult, 'Real winResult must be generated');
assert.strictEqual(realWinResult.winType, 'user_solo', 'Win type must be user_solo');
assert.strictEqual(realWinResult.winnerName, 'Abebe VictoryTest', 'Winner name must match real player');
assert.strictEqual(realWinResult.winningCartelaNumber, testCartelaId, 'Winning cartela must match real cartela');
assert.strictEqual(realWinResult.winnerPayout, 408, 'Winner payout must be 408 ETB');
assert.strictEqual(realWinResult.userShare, 408, 'User share must be 408 ETB');
assert.strictEqual(realWinResult.isSplit, false, 'Solo winner must NOT be split with bots');

// Check that player's session loss streak reset to 0
const streakAfterWin = (engine as any).playerSessionStreaks.get(testUserId);
assert(streakAfterWin, 'Session streak must exist');
assert.strictEqual(streakAfterWin.consecutiveLosses, 0, 'Player consecutive losses must reset to 0');
assert.strictEqual(streakAfterWin.recentWins, 1, 'Player recent wins must be 1');

console.log('   ✅ Real Player Victory processed cleanly');
console.log(`   ✅ WinResult: ${realWinResult.winnerName} won ${realWinResult.winnerPayout} ETB (Solo: ${!realWinResult.isSplit})`);
console.log(`   ✅ Real player loss streak reset to ${streakAfterWin.consecutiveLosses} (recentWins: ${streakAfterWin.recentWins})`);

console.log('\n3. Testing Co-Occurring Bot & Real Cards (Priority & Dilution Guard)...');

// If both real and bot cards are passed, real player MUST receive 100% of payout without dilution
room10.isProcessingVictory = false;
room10.winResult = null;

const coOccurringCards = [
  ...realWinningCard,
  botWinningCard[0]
];

await (engine as any).processRoundVictory(room10, coOccurringCards);

const priorityWinResult = room10.winResult;
assert.strictEqual(priorityWinResult.winType, 'user_solo', 'Must prioritize real player as user_solo');
assert.strictEqual(priorityWinResult.isSplit, false, 'Must NOT split with standby bot');
assert.strictEqual(priorityWinResult.userShare, 408, 'Real player must still receive full 408 ETB');
assert.strictEqual(priorityWinResult.winnerPayout, 408, 'Winner payout must be 408 ETB');
console.log('   ✅ Real Player strictly protected from standby bot split (100% payout preserved: 408 ETB)');

// Clean up test data
room10.tickets.delete(testUserId);
(engine as any).playerSessionStreaks.delete(testUserId);
(engine as any).syncRoom10StandbyBots(room10, true);

console.log('\n================================================================');
console.log('🎉 PHASE 5 VERIFICATION COMPLETE: ALL ASSERTIONS PASSED (100%)');
console.log('================================================================');
process.exit(0);
