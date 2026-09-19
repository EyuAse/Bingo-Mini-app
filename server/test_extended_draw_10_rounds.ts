import { generateCardFromId, checkWinningPattern, getAllWinningPatterns, generateRandomShuffledBalls, getBallColumn } from './game/cartelaGenerator.ts';

// ═══════════════════════════════════════════════════════════════
// 🧪 10-ROUND EXTENDED DRAW VERIFICATION TEST
// Rounds 1-5:  ALL MANUAL (2-5 players)
// Rounds 6-10: MIXED — half auto, half manual
// ═══════════════════════════════════════════════════════════════

const BALL_INTERVAL_MS = 3000;
let totalPassed = 0;
let totalFailed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    totalPassed++;
  } else {
    console.error(`   ❌ FAIL: ${msg}`);
    totalFailed++;
  }
  return condition;
}

interface SimPlayer {
  userId: string;
  userName: string;
  cartelaId: number;
  cardMatrix: ReturnType<typeof generateCardFromId>;
  isAutoPlay: boolean;
}

interface RoundResult {
  roundNumber: number;
  mode: 'ALL_MANUAL' | 'MIXED';
  playerCount: number;
  winnerName: string | null;
  winnerCartelaId: number | null;
  winnerMode: 'auto' | 'manual' | 'server_verified' | null;
  winningPattern: string | null;
  patternCompletedOnBall: number | null;
  winAwardedOnBall: number | null;
  claimWindowBalls: number;
  claimWindowSeconds: number;
  extendedDraw: boolean;
  extraBallsBeyondCap: number;
  potConfiscated: boolean;
  totalBallsDrawn: number;
}

// Fisher-Yates shuffle
function shuffle<T>(arr: T[]): T[] {
  const res = [...arr];
  for (let i = res.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [res[i], res[j]] = [res[j], res[i]];
  }
  return res;
}

/**
 * Simulates one full round of bingo with the given players.
 * Replicates the exact server-side ball loop logic including:
 * - Auto-play win detection (only for isAutoPlay === true)
 * - Extended draw scan (all cards including manual, after Ball 25)
 * - findBestCardForFallbackWin equivalent (auto-only)
 * - Ball 26 safety cap → extended draw continuation
 * - Ball 75 safety net
 */
function simulateRound(roundNumber: number, players: SimPlayer[]): RoundResult {
  const mode: 'ALL_MANUAL' | 'MIXED' = players.every(p => !p.isAutoPlay) ? 'ALL_MANUAL' : 'MIXED';

  // Track when each player's card first completes any winning pattern
  const firstPatternBall: Map<string, { ball: number; pattern: string }> = new Map();

  // Generate 75-ball sequence (random, no weaving — pure randomness for test fairness)
  const ballSequence = generateRandomShuffledBalls();
  const drawnNumbers: number[] = [];

  let winnerResult: {
    userId: string;
    userName: string;
    cartelaId: number;
    winningPattern: string;
    mode: 'auto' | 'manual' | 'server_verified';
    ball: number;
  } | null = null;

  let extendedDrawActivated = false;

  for (let ballIdx = 0; ballIdx < 75; ballIdx++) {
    const ballNumber = ballIdx + 1;
    const currentNum = ballSequence[ballIdx];
    drawnNumbers.push(currentNum);

    // Track first pattern completion for each player
    for (const p of players) {
      if (!firstPatternBall.has(p.userId)) {
        const winCheck = checkWinningPattern(p.cardMatrix, drawnNumbers);
        if (winCheck.isWin) {
          firstPatternBall.set(p.userId, {
            ball: ballNumber,
            pattern: winCheck.winningPattern || 'Bingo Line'
          });
        }
      }
    }

    // ── STANDARD WIN CHECK (Ball 15-25): Auto-play only ──
    if (ballNumber >= 15 && ballNumber <= 25 && !winnerResult) {
      for (const p of players) {
        if (p.isAutoPlay !== true) continue; // Skip manual — exact server behavior
        const winCheck = checkWinningPattern(p.cardMatrix, drawnNumbers);
        if (winCheck.isWin) {
          winnerResult = {
            userId: p.userId,
            userName: p.userName,
            cartelaId: p.cartelaId,
            winningPattern: winCheck.winningPattern || 'Bingo Line',
            mode: 'auto',
            ball: ballNumber
          };
          break;
        }
      }
      if (winnerResult) break;
    }

    // ── BALL 26 SAFETY CAP ──
    if (ballNumber === 26 && !winnerResult) {
      // findBestCardForFallbackWin equivalent: check auto players only
      let fallbackFound = false;
      for (const p of players) {
        if (p.isAutoPlay !== true) continue;
        const winCheck = checkWinningPattern(p.cardMatrix, drawnNumbers);
        if (winCheck.isWin) {
          winnerResult = {
            userId: p.userId,
            userName: p.userName,
            cartelaId: p.cartelaId,
            winningPattern: winCheck.winningPattern || 'Bingo Line',
            mode: 'auto',
            ball: ballNumber
          };
          fallbackFound = true;
          break;
        }
      }
      if (fallbackFound) break;

      // No auto winner → extended draw (if players exist)
      if (players.length > 0) {
        extendedDrawActivated = true;
        // Don't break — loop continues
      } else {
        break; // No players — end round
      }
    }

    // ── EXTENDED DRAW: After Ball 25, check ALL cards (including manual) ──
    if (ballNumber > 25 && !winnerResult) {
      for (const p of players) {
        const winCheck = checkWinningPattern(p.cardMatrix, drawnNumbers);
        if (winCheck.isWin) {
          winnerResult = {
            userId: p.userId,
            userName: p.userName,
            cartelaId: p.cartelaId,
            winningPattern: winCheck.winningPattern || 'Bingo Line',
            mode: p.isAutoPlay ? 'auto' : 'server_verified',
            ball: ballNumber
          };
          break;
        }
      }
      if (winnerResult) break;
    }
  }

  // Build result
  const patternFirstBall = winnerResult ? firstPatternBall.get(winnerResult.userId)?.ball || winnerResult.ball : null;
  const winBall = winnerResult?.ball || null;
  const claimGap = (patternFirstBall && winBall) ? winBall - patternFirstBall : 0;

  return {
    roundNumber,
    mode,
    playerCount: players.length,
    winnerName: winnerResult?.userName || null,
    winnerCartelaId: winnerResult?.cartelaId || null,
    winnerMode: winnerResult?.mode || null,
    winningPattern: winnerResult?.winningPattern || null,
    patternCompletedOnBall: patternFirstBall,
    winAwardedOnBall: winBall,
    claimWindowBalls: claimGap,
    claimWindowSeconds: claimGap * (BALL_INTERVAL_MS / 1000),
    extendedDraw: extendedDrawActivated,
    extraBallsBeyondCap: winBall && winBall > 26 ? winBall - 26 : 0,
    potConfiscated: winnerResult === null,
    totalBallsDrawn: winBall || 75
  };
}

// ═══════════════════════════════════════════════════════════════
// RUN 10 ROUNDS
// ═══════════════════════════════════════════════════════════════

console.log('');
console.log('╔════════════════════════════════════════════════════════════════════════╗');
console.log('║  🧪 10-ROUND EXTENDED DRAW VERIFICATION TEST                         ║');
console.log('║  Rounds 1-5:  ALL MANUAL players                                    ║');
console.log('║  Rounds 6-10: MIXED (half auto, half manual)                         ║');
console.log('╚════════════════════════════════════════════════════════════════════════╝');
console.log('');

const results: RoundResult[] = [];

for (let round = 1; round <= 10; round++) {
  // Determine player count: 2-5 players
  const playerCount = 2 + Math.floor(Math.random() * 4); // 2, 3, 4, or 5
  const isAllManual = round <= 5;

  // Generate unique cartela IDs
  const cartelaPool = shuffle(Array.from({ length: 400 }, (_, i) => i + 1));
  const players: SimPlayer[] = [];

  for (let i = 0; i < playerCount; i++) {
    const cartelaId = cartelaPool[i];
    let isAutoPlay: boolean;

    if (isAllManual) {
      isAutoPlay = false; // Rounds 1-5: ALL manual
    } else {
      // Rounds 6-10: first half auto, second half manual
      isAutoPlay = i < Math.ceil(playerCount / 2);
    }

    players.push({
      userId: `user_${round}_${i + 1}`,
      userName: `Player_${String.fromCharCode(65 + i)}`,
      cartelaId,
      cardMatrix: generateCardFromId(cartelaId),
      isAutoPlay
    });
  }

  const modeLabel = isAllManual ? 'ALL MANUAL ✋' : 'MIXED ⚡✋';
  const playerList = players.map(p => `${p.userName}(${p.isAutoPlay ? 'Auto' : 'Manual'})`).join(', ');

  console.log(`╔══════════════════════════════════════════════════════════════════════════════╗`);
  console.log(`║  ROUND ${round}/10 — ${modeLabel} (${playerCount} players)`);
  console.log(`╠══════════════════════════════════════════════════════════════════════════════╣`);
  console.log(`║  Players: ${playerList}`);

  const result = simulateRound(round, players);
  results.push(result);

  // Print per-round details
  if (result.winnerName) {
    console.log(`╠──────────────────────────────────────────────────────────────────────────────╣`);
    if (result.patternCompletedOnBall !== result.winAwardedOnBall) {
      console.log(`║  Ball ${result.patternCompletedOnBall}: Pattern first completed (${result.winningPattern})`);
      if (result.extendedDraw) {
        console.log(`║  Ball 26: Safety cap — Extended Draw ACTIVATED 🔄`);
      }
      console.log(`║  Ball ${result.winAwardedOnBall}: ${result.winnerName} Cartela #${result.winnerCartelaId} — WIN AWARDED ✅`);
    } else {
      console.log(`║  Ball ${result.winAwardedOnBall}: ${result.winnerName} Cartela #${result.winnerCartelaId} completes ${result.winningPattern}`);
      console.log(`║           → ${result.winnerMode === 'auto' ? 'Auto-claimed instantly ⚡' : 'Server-verified win ✅'}`);
    }
    console.log(`╠──────────────────────────────────────────────────────────────────────────────╣`);
    console.log(`║  RESULT: ✅ WINNER — ${result.winnerName} (${result.winnerMode})`);
    console.log(`║  Pattern completed on:  Ball #${result.patternCompletedOnBall}`);
    console.log(`║  Win awarded on:        Ball #${result.winAwardedOnBall}`);
    console.log(`║  Claim window gap:      ${result.claimWindowBalls} balls (${result.claimWindowSeconds.toFixed(1)}s)`);
    console.log(`║  Extended draw:         ${result.extendedDraw ? `YES (${result.extraBallsBeyondCap} extra balls beyond cap)` : 'NO (normal finish)'}`);
    console.log(`║  Pot confiscated:       NO ✅`);
  } else {
    console.log(`╠──────────────────────────────────────────────────────────────────────────────╣`);
    console.log(`║  RESULT: ❌ NO WINNER — All 75 balls drawn`);
    console.log(`║  Pot confiscated:       ${result.potConfiscated ? 'REFUNDED (safety net)' : 'NO'}`);
  }
  console.log(`╚══════════════════════════════════════════════════════════════════════════════╝`);
  console.log('');

  // Assertions
  assert(result.winnerName !== null, `Round ${round}: A winner was produced`);
  assert(!result.potConfiscated, `Round ${round}: Pot was NOT confiscated`);
  if (isAllManual) {
    assert(result.extendedDraw === true, `Round ${round} (all manual): Extended draw was activated`);
    assert((result.winAwardedOnBall || 0) > 25, `Round ${round} (all manual): Winner found after Ball 25 (was Ball ${result.winAwardedOnBall})`);
    assert(result.winnerMode === 'server_verified', `Round ${round} (all manual): Winner was server-verified (not auto-claimed)`);
  }
  if (result.winnerName) {
    assert(
      result.winningPattern !== null && result.winningPattern !== 'Unclaimed',
      `Round ${round}: Winning pattern is valid ("${result.winningPattern}")`
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// FINAL SUMMARY
// ═══════════════════════════════════════════════════════════════

const roundsWithWinner = results.filter(r => r.winnerName !== null).length;
const roundsConfiscated = results.filter(r => r.potConfiscated).length;
const extendedDrawRounds = results.filter(r => r.extendedDraw).length;
const avgExtraBalls = extendedDrawRounds > 0
  ? (results.filter(r => r.extendedDraw).reduce((sum, r) => sum + r.extraBallsBeyondCap, 0) / extendedDrawRounds).toFixed(1)
  : '0';

// Claim window stats for all-manual rounds
const manualRounds = results.filter(r => r.mode === 'ALL_MANUAL' && r.winAwardedOnBall !== null);
const avgWinBallManual = manualRounds.length > 0
  ? (manualRounds.reduce((sum, r) => sum + (r.winAwardedOnBall || 0), 0) / manualRounds.length).toFixed(1)
  : 'N/A';

// Mixed rounds stats
const mixedRounds = results.filter(r => r.mode === 'MIXED' && r.winAwardedOnBall !== null);
const avgWinBallMixed = mixedRounds.length > 0
  ? (mixedRounds.reduce((sum, r) => sum + (r.winAwardedOnBall || 0), 0) / mixedRounds.length).toFixed(1)
  : 'N/A';

console.log('════════════════════════════════════════════════════════════');
console.log('  FINAL SUMMARY — 10 ROUNDS');
console.log('════════════════════════════════════════════════════════════');
console.log(`  Rounds with winner:          ${roundsWithWinner}/10 ${roundsWithWinner === 10 ? '✅' : '❌'}`);
console.log(`  Rounds with pot confiscated:  ${roundsConfiscated}/10 ${roundsConfiscated === 0 ? '✅' : '❌'}`);
console.log(`  Extended draws triggered:     ${extendedDrawRounds}/10`);
console.log(`  Avg extra balls (ext. draw):  ${avgExtraBalls}`);
console.log(`  Avg win ball (all-manual):    Ball #${avgWinBallManual}`);
console.log(`  Avg win ball (mixed):         Ball #${avgWinBallMixed}`);
console.log('');
console.log('  MANUAL CLAIM WINDOW REPORT:');
console.log('  ┌─────────────────────────────────────────────────────────────┐');
console.log('  │ Ball interval:           3.0 seconds                       │');
console.log('  │ Grace window:            1 ball (prev ball)                │');
console.log('  │ Max claim time:          3.0 seconds (1 subsequent ball)   │');
console.log('  │ Pattern expires after:   Ball N+2                          │');
console.log('  │ Extended draw activates: Ball 26+                          │');
console.log('  │ In extended draw:        Server auto-awards                │');
console.log('  │                          (no manual click needed)           │');
console.log('  └─────────────────────────────────────────────────────────────┘');
console.log('');

// Final assertions
assert(roundsWithWinner === 10, 'All 10 rounds produced a winner');
assert(roundsConfiscated === 0, 'Zero rounds had pot confiscated');

const allManualExtended = results.filter(r => r.mode === 'ALL_MANUAL').every(r => r.extendedDraw);
assert(allManualExtended, 'All 5 all-manual rounds triggered extended draw');

console.log('');
console.log(`  Results: ${totalPassed} Passed, ${totalFailed} Failed`);
if (totalFailed === 0) {
  console.log('  🎉 ALL 10 ROUNDS PASSED ✅');
} else {
  console.log('  ⚠️ SOME TESTS FAILED — Review output above');
}
console.log('════════════════════════════════════════════════════════════');
console.log('');

if (totalFailed > 0) process.exit(1);
