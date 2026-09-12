import { gameEngine } from './game/BingoGameEngine.ts';
import { generateCardFromId } from './game/cartelaGenerator.ts';

async function runPhase1Test() {
  console.log('--- STARTING PHASE 1 AUTOMATED SECURITY TEST ---');

  const roomId = 'room-10';
  const room = gameEngine.getRoom(roomId);
  if (!room) {
    throw new Error('Room not found');
  }

  // Force room into playing state for controlled test
  room.phase = 'playing';
  room.isProcessingVictory = false;
  room.winResult = null;
  room.tickets.clear();

  const cartelaId = 15;
  const cardMatrix = generateCardFromId(cartelaId);

  // Player A buys Cartela #15 (Manual Play)
  const playerA = { id: '00000000-0000-0000-0000-000000000001', name: 'Alice' };
  const playerB = { id: '00000000-0000-0000-0000-000000000002', name: 'BobTheAttacker' };

  room.tickets.set(playerA.id, [
    {
      userId: playerA.id,
      userName: playerA.name,
      cartelaId,
      cardMatrix,
      isAutoPlay: false,
      purchasedAt: Date.now()
    }
  ]);

  // Find a horizontal winning row on Cartela #15
  const row0Numbers = [
    cardMatrix[0].val as number,
    cardMatrix[1].val as number,
    cardMatrix[2].val as number,
    cardMatrix[3].val as number,
    cardMatrix[4].val as number
  ];

  // Populate drawn numbers with the winning row
  room.drawnNumbers = [...row0Numbers];
  room.currentCall = { num: row0Numbers[row0Numbers.length - 1], letter: 'B', timestamp: Date.now() };

  console.log(`Simulated winning numbers for Cartela #${cartelaId}:`, row0Numbers);

  // 1. BobTheAttacker (who does NOT own Cartela #15) tries to claim it
  console.log('Testing unauthorized claim by BobTheAttacker (imposter)...');
  const imposterResult = await gameEngine.handleClaimBingo(playerB.id, playerB.name, roomId, cartelaId);
  console.log('Imposter Claim Result:', imposterResult);

  if (imposterResult.success) {
    throw new Error('FAIL: Imposter was able to claim a cartela they do not own!');
  }
  if (!imposterResult.message.includes('You do not hold an active ticket')) {
    throw new Error(`FAIL: Expected ticket ownership error message, got: ${imposterResult.message}`);
  }
  console.log('PASS: Imposter claim was successfully blocked by ticket ownership guard.');

  // 2. Alice (the genuine owner) claims Cartela #15
  console.log('Testing legitimate claim by Alice (owner)...');
  const legitimateResult = await gameEngine.handleClaimBingo(playerA.id, playerA.name, roomId, cartelaId);
  console.log('Legitimate Claim Result:', legitimateResult);

  if (!legitimateResult.success) {
    throw new Error(`FAIL: Legitimate owner was rejected: ${legitimateResult.message}`);
  }
  console.log('PASS: Legitimate owner successfully claimed Bingo!');

  console.log('--- PHASE 1 AUTOMATED SECURITY TEST PASSED COMPLETELY ---');
  process.exit(0);
}

runPhase1Test().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
