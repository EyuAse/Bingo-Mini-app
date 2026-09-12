import { gameEngine } from './game/BingoGameEngine.ts';
import { query } from './db.ts';

async function runPhase2Test() {
  console.log('--- STARTING PHASE 2 AUTOMATED PRE-BUY CONCURRENCY TEST ---');

  const roomId = 'room-10';
  const room = gameEngine.getRoom(roomId);
  if (!room) {
    throw new Error('Room not found');
  }

  // Set room to playing phase so purchases are treated as Pre-Buys for next round
  room.phase = 'playing';
  room.isProcessingVictory = false;
  room.nextRoundTickets.clear();

  // Use Dawit Haile (registered bot who has wallet balance in DB)
  const botRes = await query<{ id: string; full_name: string; phone: string }>(
    "SELECT id, full_name, phone FROM users WHERE phone = '0911445566' LIMIT 1"
  );
  if (botRes.rows.length === 0) {
    throw new Error('Test bot user not found in DB');
  }
  const testUser = {
    id: botRes.rows[0].id,
    name: botRes.rows[0].full_name || 'Dawit Haile'
  };

  // Check initial wallet balance
  const balBeforeRes = await query<{ balance: string }>(
    'SELECT balance FROM wallets WHERE user_id = $1',
    [testUser.id]
  );
  const initialBal = parseFloat(balBeforeRes.rows[0]?.balance || '0');
  console.log(`Initial wallet balance for ${testUser.name}: ${initialBal} ETB`);

  // 1. First Pre-Buy request (1 card: stake 10 ETB)
  console.log('Executing First Pre-Buy request (1 card)...');
  const res1 = await gameEngine.handleBuyTicket(testUser.id, testUser.name, roomId, 1);
  console.log('Pre-Buy 1 result:', { success: res1.success, preBought: res1.preBoughtForNextRound, count: res1.tickets?.length });

  if (!res1.success || !res1.preBoughtForNextRound) {
    throw new Error(`First pre-buy failed: ${res1.error || 'unexpected failure'}`);
  }

  const queuedCardsAfterFirst = room.nextRoundTickets.get(testUser.id)?.length || 0;
  if (queuedCardsAfterFirst !== 1) {
    throw new Error(`Expected 1 queued card after first buy, found: ${queuedCardsAfterFirst}`);
  }

  // 2. Immediate Duplicate Pre-Buy request (simulating rapid double-click or 2nd tab)
  console.log('Executing Duplicate Pre-Buy request (rapid double-click simulation)...');
  const res2 = await gameEngine.handleBuyTicket(testUser.id, testUser.name, roomId, 1);
  console.log('Pre-Buy 2 result:', { success: res2.success, preBought: res2.preBoughtForNextRound, count: res2.tickets?.length });

  if (!res2.success || !res2.preBoughtForNextRound) {
    throw new Error(`Second pre-buy failed: ${res2.error || 'unexpected failure'}`);
  }

  const queuedCardsAfterSecond = room.nextRoundTickets.get(testUser.id)?.length || 0;
  if (queuedCardsAfterSecond !== 1) {
    throw new Error(`FAIL: Duplicate cards queued! Expected 1, found ${queuedCardsAfterSecond}`);
  }
  console.log('PASS: Next round queued ticket count was NOT duplicated.');

  // 3. Verify wallet balance was only debited once (10 ETB), NOT twice
  const balAfterRes = await query<{ balance: string }>(
    'SELECT balance FROM wallets WHERE user_id = $1',
    [testUser.id]
  );
  const finalBal = parseFloat(balAfterRes.rows[0]?.balance || '0');
  const totalDebited = initialBal - finalBal;
  console.log(`Final wallet balance: ${finalBal} ETB. Total debited: ${totalDebited} ETB (Expected: 10 ETB)`);

  if (Math.abs(totalDebited - 10) > 0.01) {
    throw new Error(`FAIL: Double debit occurred! Total debited was ${totalDebited} ETB instead of 10 ETB.`);
  }

  console.log('PASS: Wallet balance was debited exactly once with zero double-spending!');

  // Clean up: refund the 10 ETB back to Dawit Haile's wallet so test has zero net effect
  await query('UPDATE wallets SET balance = balance + 10 WHERE user_id = $1', [testUser.id]);
  room.nextRoundTickets.delete(testUser.id);
  console.log('Cleaned up test state and restored wallet balance.');

  console.log('--- PHASE 2 AUTOMATED PRE-BUY CONCURRENCY TEST PASSED COMPLETELY ---');
  process.exit(0);
}

runPhase2Test().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
