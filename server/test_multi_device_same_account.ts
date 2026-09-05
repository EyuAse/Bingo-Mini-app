import { gameEngine } from './game/BingoGameEngine.ts';
import { query } from './db.ts';

async function runMultiDeviceAndSplitTests() {
  console.log('🧪 Starting Multi-Device & Single-Entity Split Tests...\n');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      process.exitCode = 1;
    }
  }

  try {
    const testUserId = 'a1b2c3d4-e5f6-4a8b-9c0d-1e2f3a4b5c6d';
    const testUserName = 'Eyu Ase';

    // Seed test wallet with 500 ETB
    const testPhone = `09${Math.floor(10000000 + Math.random() * 89999999)}`;
    await query(
      `INSERT INTO users (id, phone, full_name, role, status) 
       VALUES ($1, $2, $3, 'player', 'active')
       ON CONFLICT (id) DO UPDATE SET full_name = $3`,
      [testUserId, testPhone, testUserName]
    );
    await query(
      `INSERT INTO wallets (user_id, balance, bonus)
       VALUES ($1, 500, 0)
       ON CONFLICT (user_id) DO UPDATE SET balance = 500, bonus = 0`,
      [testUserId]
    );

    const room = gameEngine.getRoom('lomi-arena')!;
    room.phase = 'lobby';
    room.tickets.clear();
    if (room.nextRoundTickets) room.nextRoundTickets.clear();

    // -------------------------------------------------------------
    // Test 1: Phone A buys tickets (2 cartelas -> 3 cards with bonus)
    // -------------------------------------------------------------
    const buyResult1 = await gameEngine.handleBuyTicket(
      testUserId,
      testUserName,
      'lomi-arena',
      2, // Quantity 2
      'socket_phone_a_123',
      10 // 10 ETB stake
    );

    assert(buyResult1.success === true, 'Test 1: Phone A buys 2 cartelas (+ 1 bonus) successfully');
    assert(buyResult1.tickets?.length === 3, 'Test 1: Returns 3 cards (2 bought + 1 promo bonus)');
    assert(buyResult1.remainingBalance === 480, 'Test 1: Balance deducted by 20 ETB (500 -> 480 ETB)');

    // -------------------------------------------------------------
    // Test 2: Phone B attempts to buy while Phone A already has tickets
    // -------------------------------------------------------------
    const buyResult2 = await gameEngine.handleBuyTicket(
      testUserId,
      testUserName,
      'lomi-arena',
      1,
      'socket_phone_b_456',
      10
    );

    assert(buyResult2.success === true, 'Test 2: Phone B receives successful ticket confirmation');
    assert(buyResult2.tickets?.length === 3, 'Test 2: Phone B returns exact same 3 tickets from Phone A');
    // Balance must NOT have been deducted again
    const walletRes = await query('SELECT balance FROM wallets WHERE user_id = $1', [testUserId]);
    const currentBal = parseFloat(walletRes.rows[0].balance);
    assert(currentBal === 480, 'Test 2: Balance was NOT deducted again (remains 480 ETB)');

    // -------------------------------------------------------------
    // Test 3: Multi-Card Same-User Win (The Self-Split Bug Fix)
    // -------------------------------------------------------------
    // Simulate Card 1 and Card 2 of Eyu Ase both completing BINGO on Ball 16
    const winningCardsSameUser = [
      {
        userId: testUserId,
        userName: testUserName,
        cartelaId: buyResult1.tickets![0].cartelaId,
        isReal: true,
        winningPattern: 'Top Row',
        winningIndices: [0, 1, 2, 3, 4]
      },
      {
        userId: testUserId,
        userName: testUserName,
        cartelaId: buyResult1.tickets![1].cartelaId,
        isReal: true,
        winningPattern: 'Bottom Row',
        winningIndices: [20, 21, 22, 23, 24]
      }
    ];

    await (gameEngine as any).processRoundVictory(room, winningCardsSameUser);

    const winResultSameUser = room.winResult;
    assert(winResultSameUser.isSplit === false, 'Test 3: Same player with 2 winning cards is NOT marked as Split (isSplit === false)');
    assert(winResultSameUser.winType === 'user_solo', 'Test 3: winType is user_solo (not user_split)');
    assert(winResultSameUser.userShare === 450, 'Test 3: Player receives 100% of the pot (450 ETB, NOT halved to 225)');
    assert(winResultSameUser.winnerPayout === 450, 'Test 3: Winner payout displays full 450 ETB');
    assert(winResultSameUser.coWinners.length === 0, 'Test 3: coWinners is empty (does not list Eyu Ase as his own opponent)');

    // Verify wallet received the full 450 ETB (480 + 450 = 930 ETB)
    const walletAfterSolo = await query('SELECT balance FROM wallets WHERE user_id = $1', [testUserId]);
    const balAfterSolo = parseFloat(walletAfterSolo.rows[0].balance);
    assert(balAfterSolo === 930, `Test 3: Wallet credited full 450 ETB (480 -> ${balAfterSolo} ETB)`);

    // -------------------------------------------------------------
    // Test 4: Genuine Multiplayer Split Pot (Eyu Ase vs Bot Opponent)
    // -------------------------------------------------------------
    (gameEngine as any).isProcessingVictory = false;
    room.phase = 'playing';

    const winningCardsMultiSplit = [
      {
        userId: testUserId,
        userName: testUserName,
        cartelaId: buyResult1.tickets![0].cartelaId,
        isReal: true,
        winningPattern: 'Diagonal',
        winningIndices: [0, 6, 12, 18, 24]
      },
      {
        userId: 'bot_cartela_77',
        userName: 'Abebe_B',
        cartelaId: 77,
        isReal: false,
        winningPattern: 'Diagonal',
        winningIndices: [4, 8, 12, 16, 20]
      }
    ];

    await (gameEngine as any).processRoundVictory(room, winningCardsMultiSplit);

    const winResultMultiSplit = room.winResult;
    assert(winResultMultiSplit.isSplit === true, 'Test 4: Real player + Bot opponent IS marked as Split (isSplit === true)');
    assert(winResultMultiSplit.winType === 'user_split', 'Test 4: winType is user_split');
    assert(winResultMultiSplit.userShare === 225, 'Test 4: Pot is divided 50/50 (225 ETB each)');
    assert(winResultMultiSplit.coWinners.includes('Abebe_B'), 'Test 4: coWinners contains external opponent "Abebe_B"');
    assert(!winResultMultiSplit.coWinners.includes(testUserName), 'Test 4: coWinners DOES NOT contain the player himself');

    console.log(`\n🎉 Test Suite Completed: ${passed}/${total} assertions passed!`);
  } catch (err) {
    console.error('❌ Test execution error:', err);
    process.exitCode = 1;
  } finally {
    process.exit(process.exitCode || 0);
  }
}

runMultiDeviceAndSplitTests();
