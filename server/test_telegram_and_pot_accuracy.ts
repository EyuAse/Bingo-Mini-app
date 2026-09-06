import { gameEngine } from './game/BingoGameEngine.ts';
import { io as serverIo } from './server.ts';
import { io as ClientIO } from 'socket.io-client';

async function runTests() {
  console.log('🧪 RUNNING VERIFICATION SUITE: TELEGRAM MINI APP NETWORK & POT ACCURACY\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`   ✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`   ❌ FAIL: ${msg}`);
      failed++;
    }
  }

  // TEST 1: Pot Calculation & House Commission Tier (<= 5 players -> 0% fee)
  console.log('1️⃣ Testing Multi-Cartela Pot Calculation & Commission Rules:');
  const room10 = gameEngine.getRoom('room-10')!;
  room10.tickets.clear();
  room10.opponentCards = [];

  // User A buys 2 cartelas for 10 ETB each (= 20 ETB) + 1 free promo card (= 0 ETB)
  const userATickets = [
    { userId: 'user-a', userName: 'User A', cartelaId: 101, cardMatrix: [] as any, betAmount: 10, socketId: 'sock-a' },
    { userId: 'user-a', userName: 'User A', cartelaId: 102, cardMatrix: [] as any, betAmount: 10, socketId: 'sock-a' },
    { userId: 'user-a', userName: 'User A', cartelaId: 103, cardMatrix: [] as any, betAmount: 0, socketId: 'sock-a', isBonus: true }
  ];
  // User B buys 1 cartela for 10 ETB (= 10 ETB)
  const userBTickets = [
    { userId: 'user-b', userName: 'User B', cartelaId: 201, cardMatrix: [] as any, betAmount: 10, socketId: 'sock-b' }
  ];

  room10.tickets.set('user-a', userATickets);
  room10.tickets.set('user-b', userBTickets);
  room10.realPlayerCount = 2;

  // Trigger recalculatePot
  (gameEngine as any).recalculatePot(room10);

  console.log('   User A bets 2 cards @ 10 ETB (20 ETB) + User B bets 1 card @ 10 ETB (10 ETB):');
  console.log(`   Total Pot: ${room10.totalPot} ETB`);
  console.log(`   House Fee: ${room10.houseFee} ETB (Commission Enabled: ${room10.commissionEnabled}, Percent: ${room10.commissionPercent}%)`);
  console.log(`   Winner Payout: ${room10.winnerPayout} ETB`);

  assert(room10.totalPot === 30, 'Total Pot is exactly 30.00 ETB (20 + 10)');
  assert(room10.houseFee === 0, 'House Fee is 0.00 ETB (0% fee for <= 5 real players)');
  assert(room10.winnerPayout === 30, 'Winner Payout is 100% of pot (30.00 ETB)');

  // TEST 2: Commission Tier (> 5 players -> 20% fee)
  console.log('\n2️⃣ Testing High-Volume Commission Tier (> 5 real players -> 20% cut):');
  for (let i = 3; i <= 6; i++) {
    room10.tickets.set(`user-${i}`, [
      { userId: `user-${i}`, userName: `User ${i}`, cartelaId: 300 + i, cardMatrix: [] as any, betAmount: 10, socketId: `sock-${i}` }
    ]);
  }
  room10.realPlayerCount = room10.tickets.size;
  (gameEngine as any).recalculatePot(room10);

  console.log(`   6 Real Players (User A 2 cards = 20 ETB + 5 users 1 card each = 50 ETB -> 70 ETB total):`);
  console.log(`   Total Pot: ${room10.totalPot} ETB`);
  console.log(`   House Fee: ${room10.houseFee} ETB (Commission: ${room10.commissionPercent}%)`);
  console.log(`   Winner Payout: ${room10.winnerPayout} ETB`);

  assert(room10.totalPot === 70, 'Total Pot is 70.00 ETB (20 ETB + 50 ETB)');
  assert(room10.commissionPercent === 20, 'Commission tier elevated to 20% for > 5 players');
  assert(room10.houseFee === 14, 'House Fee is exactly 14.00 ETB (20% of 70 ETB)');
  assert(room10.winnerPayout === 56, 'Winner Payout is 56.00 ETB (80% of 70 ETB)');

  // TEST 3: Room Isolation & Socket Crosstalk Elimination
  console.log('\n3️⃣ Testing Socket Room Isolation (No bleeding between room-10 and room-50):');
  const client50 = ClientIO('http://localhost:5000', { transports: ['websocket'] });
  
  let receivedLeakedEvent = false;

  await new Promise<void>((resolve) => {
    client50.on('connect', () => {
      // Client joins room-50
      client50.emit('join_room', { roomId: 'room-50', userId: 'test-user-50', userName: 'Tester 50' });

      client50.on('room_state', (payload: any) => {
        if (payload.roomId === 'room-10' || payload.roomId === 'lomi-arena') {
          receivedLeakedEvent = true;
        }
      });

      // Server emits event to room-10
      serverIo.to('room-10').emit('room_state', { roomId: 'room-10', lobbyCountdown: 42, phase: 'lobby' });

      setTimeout(() => {
        resolve();
      }, 1000);
    });
  });

  client50.disconnect();

  assert(!receivedLeakedEvent, 'Client in room-50 received ZERO packets from room-10 (No crosstalk/blinking glitch)');

  console.log(`\n🏁 TEST SUMMARY: ${passed} Passed, ${failed} Failed\n`);
  process.exit(failed === 0 ? 0 : 1);
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
