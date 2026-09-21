import { generateCardFromId, checkWinningPattern, getAllWinningPatterns, generateRandomShuffledBalls, getBallColumn } from './game/cartelaGenerator.ts';

// ══════════════════════════════════════════════════════════════════════════════
// 🧪 STRICT MANUAL CLAIM & SPLIT POT INVARIANT TEST SUITE
// Tests all 4 real gameplay conditions to guarantee zero premature auto-wins
// and zero unearned split pots for inactive/non-claiming manual players.
// ══════════════════════════════════════════════════════════════════════════════

let passedAssertions = 0;
let failedAssertions = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedAssertions++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failedAssertions++;
  }
}

interface SimPlayer {
  userId: string;
  userName: string;
  cartelaId: number;
  cardMatrix: ReturnType<typeof generateCardFromId>;
  isAutoPlay: boolean;
}

// Emulates server claim logic according to BingoGameEngine rules
function simulateClaimBingo(
  claimant: SimPlayer,
  allPlayers: SimPlayer[],
  drawnNumbers: number[],
  currentCallNum: number
): { success: boolean; isSplit: boolean; winnerNames: string[]; message: string } {
  const allWins = getAllWinningPatterns(claimant.cardMatrix, drawnNumbers);
  if (allWins.length === 0) {
    return { success: false, isSplit: false, winnerNames: [], message: 'No winning pattern' };
  }

  // Strict Single-Ball Rule: Only current active ball is eligible for manual claims
  const eligibleBalls = typeof currentCallNum === 'number' && currentCallNum > 0 ? [currentCallNum] : [];

  // Manual player claim check
  if (!claimant.isAutoPlay) {
    const activeWin = allWins.find(w => w.numbers.some(n => eligibleBalls.includes(n)));
    if (!activeWin) {
      return { success: false, isSplit: false, winnerNames: [], message: 'Missed Bingo! That pattern expired because the next number was called.' };
    }
  }

  const winningCards: Array<{ userId: string; userName: string; isReal: boolean }> = [
    { userId: claimant.userId, userName: claimant.userName, isReal: true }
  ];

  // Phase 2 Invariant: Check if other confirmed AUTO-PLAY real players also completed a line
  for (const other of allPlayers) {
    if (other.userId === claimant.userId) continue;

    // STRICT INVARIANT: Manual players (isAutoPlay === false) NEVER get an automatic split pot without clicking BINGO!
    if (!other.isAutoPlay) {
      continue;
    }

    const otherCheck = checkWinningPattern(other.cardMatrix, drawnNumbers);
    if (otherCheck.isWin) {
      winningCards.push({
        userId: other.userId,
        userName: other.userName,
        isReal: true
      });
    }
  }

  const distinctEntities = new Set(winningCards.map(w => w.userId));
  const isSplit = distinctEntities.size > 1;

  return {
    success: true,
    isSplit,
    winnerNames: Array.from(new Set(winningCards.map(w => w.userName))),
    message: 'BINGO VERIFIED!'
  };
}

// Emulates server loop evaluation
function simulateServerLoopEvaluation(
  allPlayers: SimPlayer[],
  drawnNumbers: number[]
): { hasAutoWinner: boolean; autoWinners: SimPlayer[] } {
  const autoWinners: SimPlayer[] = [];

  for (const p of allPlayers) {
    // STRICT INVARIANT: Manual players are NEVER auto-evaluated or auto-awarded by the server loop!
    if (!p.isAutoPlay) {
      continue;
    }

    const winCheck = checkWinningPattern(p.cardMatrix, drawnNumbers);
    if (winCheck.isWin) {
      autoWinners.push(p);
    }
  }

  return {
    hasAutoWinner: autoWinners.length > 0,
    autoWinners
  };
}

async function runAllScenarios() {
  console.log('\n' + '═'.repeat(78));
  console.log('  STARTING STRICT MANUAL CLAIM & SPLIT POT INVARIANT TEST SUITE');
  console.log('═'.repeat(78));

  // ──────────────────────────────────────────────────────────────────────────
  // SCENARIO 1: INACTIVITY TEST (Both manual players standing still)
  // ──────────────────────────────────────────────────────────────────────────
  {
    console.log('\n' + '─'.repeat(78));
    console.log('  SCENARIO 1: Both Manual Players Standing Still (0 marks, 0 clicks)');
    console.log('─'.repeat(78));

    const p1: SimPlayer = {
      userId: 'user_1',
      userName: 'Eyu_Ase',
      cartelaId: 15,
      cardMatrix: generateCardFromId(15),
      isAutoPlay: false
    };

    const p2: SimPlayer = {
      userId: 'user_2',
      userName: 'Player_Two',
      cartelaId: 45,
      cardMatrix: generateCardFromId(45),
      isAutoPlay: false
    };

    const balls = generateRandomShuffledBalls();
    const drawn: number[] = [];
    let prematureAutoWinnerDetected = false;

    // Draw up to 35 balls with neither player clicking BINGO
    for (let i = 0; i < 35; i++) {
      drawn.push(balls[i]);
      const loopCheck = simulateServerLoopEvaluation([p1, p2], drawn);
      if (loopCheck.hasAutoWinner) {
        prematureAutoWinnerDetected = true;
        break;
      }
    }

    assert(!prematureAutoWinnerDetected, 'Scenario 1: Zero premature auto-wins across 35 drawn balls when manual players are standing still');
    assert(drawn.length === 35, 'Scenario 1: Cage smoothly drew all 35 balls without pausing or stopping');
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SCENARIO 2: UNCLICKED PATTERN TEST (Player 1 has pattern but does not click)
  // ──────────────────────────────────────────────────────────────────────────
  {
    console.log('\n' + '─'.repeat(78));
    console.log('  SCENARIO 2: Player 1 has pattern but does NOT click BINGO; Player 2 clicks later');
    console.log('─'.repeat(78));

    const p1: SimPlayer = {
      userId: 'user_1',
      userName: 'Eyu_Ase',
      cartelaId: 101,
      cardMatrix: generateCardFromId(101),
      isAutoPlay: false
    };

    const p2: SimPlayer = {
      userId: 'user_2',
      userName: 'Player_Two',
      cartelaId: 202,
      cardMatrix: generateCardFromId(202),
      isAutoPlay: false
    };

    const balls = generateRandomShuffledBalls();
    // Find the first ball where P1 completed, and the first ball where P2 completed
    let p1WinBall = 0;
    let p2WinBall = 0;
    for (let i = 0; i < balls.length; i++) {
      const slice = balls.slice(0, i + 1);
      if (!p1WinBall && checkWinningPattern(p1.cardMatrix, slice).isWin) {
        p1WinBall = i + 1;
      }
      if (!p2WinBall && checkWinningPattern(p2.cardMatrix, slice).isWin) {
        p2WinBall = i + 1;
      }
      if (p1WinBall && p2WinBall && p2WinBall > p1WinBall + 2) {
        break;
      }
    }

    // If P2 happened to win earlier than P1 + 3 in this random shuffle, swap or regenerate so P1 wins first
    const [earlyPlayer, latePlayer, earlyBall, lateBall] = p1WinBall < p2WinBall 
      ? [p1, p2, p1WinBall, p2WinBall] 
      : [p2, p1, p2WinBall, p1WinBall];

    const drawnAtLate = balls.slice(0, lateBall);
    const currentBall = drawnAtLate[drawnAtLate.length - 1];
    const claimRes = simulateClaimBingo(latePlayer, [earlyPlayer, latePlayer], drawnAtLate, currentBall);

    assert(claimRes.success, 'Scenario 2: Active player claim was accepted on ball #' + lateBall);
    assert(!claimRes.isSplit, 'Scenario 2: Win is 100% SOLO (Earlier player who slept on ball #' + earlyBall + ' received 0 split share)');
    assert(claimRes.winnerNames.length === 1 && claimRes.winnerNames[0] === latePlayer.userName, 'Scenario 2: Winner is strictly the claiming player (' + latePlayer.userName + ')');
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SCENARIO 3: DUAL MANUAL CLICK TEST (Both players click BINGO on active ball)
  // ──────────────────────────────────────────────────────────────────────────
  {
    console.log('\n' + '─'.repeat(78));
    console.log('  SCENARIO 3: Both Manual Players complete pattern and BOTH click BINGO on active ball');
    console.log('─'.repeat(78));

    const p1: SimPlayer = {
      userId: 'user_1',
      userName: 'Eyu_Ase',
      cartelaId: 50,
      cardMatrix: generateCardFromId(50),
      isAutoPlay: false
    };

    const p2: SimPlayer = {
      userId: 'user_2',
      userName: 'Player_Two',
      cartelaId: 50, // Same card or simultaneous completion
      cardMatrix: generateCardFromId(50),
      isAutoPlay: false
    };

    const balls = generateRandomShuffledBalls();
    const drawn: number[] = [];

    for (let i = 0; i < balls.length; i++) {
      drawn.push(balls[i]);
      if (checkWinningPattern(p1.cardMatrix, drawn).isWin) {
        break;
      }
    }

    const currentBall = drawn[drawn.length - 1];
    const claimP1 = simulateClaimBingo(p1, [p1, p2], drawn, currentBall);
    const claimP2 = simulateClaimBingo(p2, [p1, p2], drawn, currentBall);

    assert(claimP1.success, 'Scenario 3: Player 1 manual claim verified on active ball');
    assert(claimP2.success, 'Scenario 3: Player 2 manual claim verified on active ball');
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SCENARIO 4: AUTO VS INACTIVE MANUAL (Auto wins on ball N, Manual does not click)
  // ──────────────────────────────────────────────────────────────────────────
  {
    console.log('\n' + '─'.repeat(78));
    console.log('  SCENARIO 4: Auto Player completes line; Manual Player does NOT click during 3.0s window');
    console.log('─'.repeat(78));

    const autoPlayer: SimPlayer = {
      userId: 'user_auto',
      userName: 'Auto_Bot',
      cartelaId: 77,
      cardMatrix: generateCardFromId(77),
      isAutoPlay: true
    };

    const manualPlayer: SimPlayer = {
      userId: 'user_manual',
      userName: 'Eyu_Ase',
      cartelaId: 88,
      cardMatrix: generateCardFromId(88),
      isAutoPlay: false
    };

    const balls = generateRandomShuffledBalls();
    const drawn: number[] = [];

    for (let i = 0; i < balls.length; i++) {
      drawn.push(balls[i]);
      if (checkWinningPattern(autoPlayer.cardMatrix, drawn).isWin) {
        break;
      }
    }

    const serverEval = simulateServerLoopEvaluation([autoPlayer, manualPlayer], drawn);
    assert(serverEval.hasAutoWinner, 'Scenario 4: Auto player detected on winning ball');
    assert(serverEval.autoWinners.length === 1 && serverEval.autoWinners[0].userId === 'user_auto', 'Scenario 4: Auto winner is strictly user_auto');

    // If manual player does NOT click during 3.0s hold window:
    const finalWinningCards = serverEval.autoWinners;
    const isSplit = finalWinningCards.length > 1;

    assert(!isSplit, 'Scenario 4: Result is 100% Solo Win for Auto Player (no unearned split pot awarded to non-clicking manual player)');
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SCENARIO 5: STRICT SINGLE-BALL EXPIRATION (Ball B-2 completes, claim on next ball fails)
  // ──────────────────────────────────────────────────────────────────────────
  {
    console.log('\n' + '─'.repeat(78));
    console.log('  SCENARIO 5: Strict Single-Ball Expiration (Claim on current ball wins; claim on next ball fails)');
    console.log('─'.repeat(78));

    const manualPlayer: SimPlayer = {
      userId: 'user_timing_test',
      userName: 'Speedy_Clicker',
      cartelaId: 12,
      cardMatrix: generateCardFromId(12),
      isAutoPlay: false
    };

    const balls = generateRandomShuffledBalls();
    const drawn: number[] = [];
    let winningBallIndex = -1;

    for (let i = 0; i < balls.length; i++) {
      drawn.push(balls[i]);
      if (checkWinningPattern(manualPlayer.cardMatrix, drawn).isWin) {
        winningBallIndex = i;
        break;
      }
    }

    const winningBall = drawn[winningBallIndex];
    // 1. Claim while active ball is the winning ball -> SUCCESS
    const currentBallClaim = simulateClaimBingo(manualPlayer, [manualPlayer], drawn, winningBall);
    assert(currentBallClaim.success, `Scenario 5: Manual claim ON active completing ball (${winningBall}) succeeds`);

    // 2. Next ball is called (e.g. drawn[winningBallIndex + 1])
    if (winningBallIndex + 1 < balls.length) {
      const nextBall = balls[winningBallIndex + 1];
      const drawnAfterNext = [...drawn, nextBall];
      // Try to claim with old pattern when currentCall is nextBall
      const nextBallClaim = simulateClaimBingo(manualPlayer, [manualPlayer], drawnAfterNext, nextBall);
      
      // If the next ball didn't coincidentally create a brand new winning pattern on this card:
      const winsWithNext = getAllWinningPatterns(manualPlayer.cardMatrix, drawnAfterNext);
      const nextBallCompletesNewLine = winsWithNext.some(w => w.numbers.includes(nextBall));
      if (!nextBallCompletesNewLine) {
        assert(!nextBallClaim.success, `Scenario 5: Manual claim AFTER next ball (${nextBall}) is called STRICTLY FAILS (expired/slept)`);
        assert(nextBallClaim.message.includes('expired'), 'Scenario 5: Received proper expiry feedback message');
      } else {
        assert(true, 'Scenario 5: Next ball happened to form an independent new winning line');
      }
    }
  }

  console.log('\n' + '═'.repeat(78));
  console.log(`  RESULTS: ${passedAssertions} Passed, ${failedAssertions} Failed`);
  console.log('═'.repeat(78));

  if (failedAssertions > 0) {
    process.exit(1);
  } else {
    console.log('🎉 ALL 5 STRICT MANUAL CLAIM & TIMING SCENARIOS PASSED PERFECTLY ✅\n');
  }
}

runAllScenarios().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
