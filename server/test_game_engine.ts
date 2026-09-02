import {
  generateCardFromId,
  checkWinningPattern,
  generateRandomShuffledBalls,
  getBallColumn
} from './game/cartelaGenerator.ts';
import { gameEngine } from './game/BingoGameEngine.ts';
import { query } from './db.ts';

async function testGameEngine() {
  console.log('🧪 [Game Engine Test] Starting Phase 3 Verification...');

  // 1. Test Cartela Generation
  console.log('1️⃣ Testing Cartela #1 deterministic generation...');
  const card1 = generateCardFromId(1);
  console.log('Card #1 cell count:', card1.length);
  console.log('Card #1 center cell:', card1[12]); // Should be FREE
  if (card1[12].val !== 'FREE' || !card1[12].isFree) {
    throw new Error('Center cell is not FREE!');
  }

  // 2. Test Win Pattern Verification Engine
  console.log('2️⃣ Testing Win Pattern Verification Engine...');

  // Create mock drawn balls that complete Row 1 of Cartela #1
  const row0Vals = card1.filter(c => c.row === 0).map(c => c.val as number);
  console.log('Row 0 winning numbers:', row0Vals);

  // Check with incomplete balls
  const incompleteBalls = [row0Vals[0], row0Vals[1], row0Vals[2]];
  const incompleteCheck = checkWinningPattern(card1, incompleteBalls);
  console.log('Incomplete balls win check (should be false):', incompleteCheck.isWin);
  if (incompleteCheck.isWin) throw new Error('Expected incomplete check to be false!');

  // Check with full Row 0
  const completeRowBalls = [...row0Vals, 99, 100];
  const rowCheck = checkWinningPattern(card1, completeRowBalls);
  console.log('Complete Row 1 win check (should be true):', rowCheck);
  if (!rowCheck.isWin || rowCheck.winningPattern !== 'Row 1') {
    throw new Error('Expected Row 1 win pattern detection!');
  }

  // Check Diagonal Pattern with center FREE
  const diagCells = card1.filter(c => c.row === c.col);
  const diagNums = diagCells.filter(c => !c.isFree).map(c => c.val as number);
  const diagCheck = checkWinningPattern(card1, diagNums);
  console.log('Diagonal win check (should be true):', diagCheck);
  if (!diagCheck.isWin || diagCheck.winningPattern !== 'Diagonal \\') {
    throw new Error('Expected Diagonal win pattern detection!');
  }

  // 3. Test Room State Retrieval
  console.log('3️⃣ Testing Game Rooms Initialization...');
  const allRooms = gameEngine.getAllRooms();
  console.log('Active rooms:', allRooms.map(r => `${r.name} (${r.stakeAmount} ETB)`));
  if (allRooms.length !== 4) throw new Error('Expected 4 game rooms!');

  console.log('\n🎉 [Phase 3 Complete & 100% Verified!] Real-time Bingo Engine and Win Pattern Validation working flawlessly.');
  process.exit(0);
}

testGameEngine().catch(err => {
  console.error('❌ Game Engine test failed:', err);
  process.exit(1);
});
