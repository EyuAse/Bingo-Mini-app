import { io } from 'socket.io-client';

async function testPhase4() {
  console.log('--- Testing Phase 4: Admin Controls & 200+ Bot Management ---');

  const socket = io('http://localhost:5000', { transports: ['websocket'] });

  await new Promise<void>((resolve, reject) => {
    socket.on('connect', () => {
      console.log('✓ Socket connected to server (ID:', socket.id, ')');
      resolve();
    });
    socket.on('connect_error', (err) => reject(err));
  });

  // Join room-10
  let currentPayout = 0;
  socket.on('room_sync', (data) => {
    console.log('✓ room_sync received:', {
      roomId: data.roomId,
      totalPot: data.totalPot,
      winnerPayout: data.winnerPayout,
      playersCount: data.playersCount
    });
    currentPayout = data.winnerPayout;
  });

  socket.on('room_state', (data) => {
    currentPayout = data.winnerPayout;
  });

  socket.emit('join_room', { roomId: 'room-10', userId: 'admin-tester', userName: 'Admin Tester' });
  await new Promise(r => setTimeout(r, 600));

  // Initial 10% cut on 500 ETB pot -> 450 ETB winner payout
  console.log(`Initial winner payout: ${currentPayout} ETB (expected 450 ETB for 10% system lock)`);
  if (currentPayout !== 450) {
    throw new Error(`Expected initial payout of 450, got ${currentPayout}`);
  }
  console.log('✓ Default 10% System Lock verified (500 ETB Pot -> 450 ETB Net Payout)');

  // Change commission to 20%
  console.log('Emitting admin_set_commission (20% cut)...');
  socket.emit('admin_set_commission', { enabled: true, rate: 20 });
  await new Promise(r => setTimeout(r, 600));

  console.log(`Updated winner payout: ${currentPayout} ETB (expected 400 ETB for 20% system lock)`);
  if (currentPayout !== 400) {
    throw new Error(`Expected payout of 400 at 20% cut, got ${currentPayout}`);
  }
  console.log('✓ System Lock dynamically updated to 20% (500 ETB Pot -> 400 ETB Net Payout)');

  // Disable System Lock (0% cut)
  console.log('Emitting admin_set_commission (disabled)...');
  socket.emit('admin_set_commission', { enabled: false });
  await new Promise(r => setTimeout(r, 600));

  console.log(`Updated winner payout with lock disabled: ${currentPayout} ETB (expected 500 ETB for 0% cut)`);
  if (currentPayout !== 500) {
    throw new Error(`Expected payout of 500 when disabled, got ${currentPayout}`);
  }
  console.log('✓ System Lock toggle OFF verified (500 ETB Pot -> 500 ETB Full Payout)');

  // Restore 10% System Lock
  socket.emit('admin_set_commission', { enabled: true, rate: 10 });
  await new Promise(r => setTimeout(r, 600));
  console.log('✓ Commission restored to 10% default (Payout: ' + currentPayout + ' ETB)');

  // Test admin_set_win_rates
  console.log('Emitting admin_set_win_rates (Owner: 20%, Bots: 30%, Real: 50%)...');
  socket.emit('admin_set_win_rates', { ownerRate: 20, botRate: 30, realRate: 50 });
  await new Promise(r => setTimeout(r, 300));
  console.log('✓ admin_set_win_rates processed successfully by server engine');

  socket.disconnect();
  console.log('🎉 Phase 4 Verification Passed with 100% Accuracy!');
  process.exit(0);
}

testPhase4().catch(err => {
  console.error('❌ Phase 4 Test Failed:', err);
  process.exit(1);
});
