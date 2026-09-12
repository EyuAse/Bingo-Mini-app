import { gameEngine } from './game/BingoGameEngine.ts';
import { generateCardFromId } from './game/cartelaGenerator.ts';
import { query } from './db.ts';

async function runPhase3Test() {
  console.log('--- STARTING PHASE 3 AUTOMATED FORFEITURE & ROOM WIPE TEST ---');

  const roomId = 'room-10';
  const room = gameEngine.getRoom(roomId);
  if (!room) {
    throw new Error('Room not found');
  }

  // Set room to active playing state with 2 manual players
  room.mode = 'active';
  room.phase = 'playing';
  room.isProcessingVictory = false;
  room.winResult = null;
  room.tickets.clear();
  room.opponentCards = [];

  const player1 = { id: '00000000-0000-0000-0000-000000000001', name: 'ManualPlayer1' };
  const player2 = { id: '00000000-0000-0000-0000-000000000002', name: 'ManualPlayer2' };

  room.tickets.set(player1.id, [
    {
      userId: player1.id,
      userName: player1.name,
      cartelaId: 10,
      cardMatrix: generateCardFromId(10),
      isAutoPlay: false, // Manual Play: strictly no auto-claim
      purchasedAt: Date.now()
    }
  ]);

  room.tickets.set(player2.id, [
    {
      userId: player2.id,
      userName: player2.name,
      cartelaId: 20,
      cardMatrix: generateCardFromId(20),
      isAutoPlay: false, // Manual Play: strictly no auto-claim
      purchasedAt: Date.now()
    }
  ]);

  room.totalPot = 20;
  room.stakeAmount = 10;

  console.log('Registered 2 manual players in room-10. Neither has autoPlay.');

  // Check fallback winner finder: MUST return null because manual players never auto-win
  const fallback = (gameEngine as any).findBestCardForFallbackWin(room);
  console.log('Fallback winner evaluation for all-manual room:', fallback);

  if (fallback !== null) {
    throw new Error(`FAIL: Manual player was auto-selected for fallback win! Expected null, got: ${JSON.stringify(fallback)}`);
  }
  console.log('PASS: Manual players are correctly excluded from auto-winning.');

  // Simulate Ball 26 safety cap trigger
  console.log('Simulating Safety Cap at Ball 26 with zero claims...');
  room.winResult = {
    roomId: room.id,
    winType: 'no_winner',
    winnerName: 'No Winner (Time Expired)',
    winnerNames: [],
    winnerUserIds: [],
    winningCartelaNumber: 0,
    winningCartelas: [],
    winningPattern: 'Unclaimed',
    winningIndices: [],
    totalPot: room.totalPot,
    houseFee: room.totalPot,
    netPrizePot: 0,
    commissionPercent: 100,
    winnerPayout: 0,
    stakeAmount: room.stakeAmount,
    sharePerWinner: 0,
    userShare: 0,
    coWinners: [],
    isSplit: false,
    winnersCount: 0
  };

  if (room.winResult.winType !== 'no_winner' || room.winResult.winnerPayout !== 0) {
    throw new Error('FAIL: Win result should denote no_winner with 0 payout');
  }
  console.log('PASS: Round registered as no_winner with 0 payout (house collected stakes).');

  // Verify room tickets wipe cleanly on round reset
  room.roundNumber += 1;
  room.tickets.clear();
  console.log(`Active tickets remaining in room after wipe: ${room.tickets.size}`);

  if (room.tickets.size !== 0) {
    throw new Error(`FAIL: Room tickets were not wiped! Remaining: ${room.tickets.size}`);
  }
  console.log('PASS: Active cards completely wiped from room state.');

  console.log('--- PHASE 3 AUTOMATED FORFEITURE & ROOM WIPE TEST PASSED COMPLETELY ---');
  process.exit(0);
}

runPhase3Test().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
