import { generateCardFromId, checkWinningPattern, generateRandomShuffledBalls, BingoCell } from './game/cartelaGenerator.ts';

// Replicate prepareBallSequence with current positions [12, 18, 24, 30, 34]
function prepareBallSequenceCurrent(targetCardMatrix: BingoCell[]): number[] {
  const baseBalls = generateRandomShuffledBalls();
  const winningPatternsIndices = [
    [0, 1, 2, 3, 4],
    [5, 6, 7, 8, 9],
    [0, 5, 10, 15, 20],
    [0, 6, 12, 18, 24]
  ];
  const chosenPattern = winningPatternsIndices[Math.floor(Math.random() * winningPatternsIndices.length)];
  const targetNumbers = chosenPattern
    .map(idx => targetCardMatrix[idx]?.val)
    .filter((v): v is number => typeof v === 'number');

  const otherBalls = baseBalls.filter(b => !targetNumbers.includes(b));
  const finalSequence: number[] = [];

  const insertPositions = [12, 18, 24, 30, 34];
  for (let i = 0; i < 75; i++) {
    if (insertPositions.includes(i) && targetNumbers.length > 0) {
      finalSequence.push(targetNumbers.shift()!);
    } else if (otherBalls.length > 0) {
      finalSequence.push(otherBalls.shift()!);
    }
  }

  return finalSequence.reverse();
}

// Replicate prepareBallSequence with Natural Fast Cadence [2, 5, 8, 11, 14]
function prepareBallSequenceFast(targetCardMatrix: BingoCell[]): number[] {
  const baseBalls = generateRandomShuffledBalls();
  const winningPatternsIndices = [
    [0, 1, 2, 3, 4],
    [5, 6, 7, 8, 9],
    [0, 5, 10, 15, 20],
    [0, 6, 12, 18, 24]
  ];
  const chosenPattern = winningPatternsIndices[Math.floor(Math.random() * winningPatternsIndices.length)];
  const targetNumbers = chosenPattern
    .map(idx => targetCardMatrix[idx]?.val)
    .filter((v): v is number => typeof v === 'number');

  const otherBalls = baseBalls.filter(b => !targetNumbers.includes(b));
  const finalSequence: number[] = [];

  const insertPositions = [2, 5, 8, 11, 14]; // Completes at ball 15!
  for (let i = 0; i < 75; i++) {
    if (insertPositions.includes(i) && targetNumbers.length > 0) {
      finalSequence.push(targetNumbers.shift()!);
    } else if (otherBalls.length > 0) {
      finalSequence.push(otherBalls.shift()!);
    }
  }

  return finalSequence.reverse();
}

function runSimulation(mode: 'CURRENT' | 'FAST_CADENCE', rounds: number) {
  let realTargeted = 0;
  let realWonSolo = 0;
  let realWonSplit = 0;
  let botWon = 0;
  const winningBalls: number[] = [];

  for (let r = 0; r < rounds; r++) {
    // 1 Real Player (Card #42) + 49 Bots (Cards #100..148)
    const realCard = generateCardFromId(42);
    const botCards: Array<{ id: number; matrix: BingoCell[] }> = [];
    for (let b = 1; b <= 49; b++) {
      botCards.push({ id: 100 + b, matrix: generateCardFromId(100 + b) });
    }

    // Engine: 20% owner, 30% bot, 50% real player
    const roll = Math.random() * 100;
    const isTargetReal = roll >= 50;
    if (isTargetReal) realTargeted++;

    const targetMatrix = isTargetReal ? realCard : botCards[Math.floor(Math.random() * botCards.length)].matrix;

    const ballSequence = mode === 'CURRENT' 
      ? prepareBallSequenceCurrent(targetMatrix)
      : prepareBallSequenceFast(targetMatrix);

    const drawnNumbers: number[] = [];
    let roundEnded = false;
    const minEvaluation = mode === 'CURRENT' ? 20 : 15;

    while (ballSequence.length > 0) {
      const nextNum = ballSequence.pop()!;
      drawnNumbers.push(nextNum);

      if (drawnNumbers.length >= minEvaluation) {
        const winningCards: Array<{ isReal: boolean; id: number }> = [];

        // Check real card
        if (checkWinningPattern(realCard, drawnNumbers).isWin) {
          winningCards.push({ isReal: true, id: 42 });
        }

        // Check bot cards
        for (const bot of botCards) {
          if (checkWinningPattern(bot.matrix, drawnNumbers).isWin) {
            winningCards.push({ isReal: false, id: bot.id });
          }
        }

        if (winningCards.length > 0) {
          winningBalls.push(drawnNumbers.length);
          const hasReal = winningCards.some(w => w.isReal);
          const hasBot = winningCards.some(w => !w.isReal);

          if (hasReal && !hasBot) {
            realWonSolo++;
          } else if (hasReal && hasBot) {
            realWonSplit++;
          } else {
            botWon++;
          }

          roundEnded = true;
          break;
        }
      }
    }
  }

  const avgBall = winningBalls.reduce((a, b) => a + b, 0) / winningBalls.length;
  console.log(`\n=== RESULTS FOR ${mode} (Total Rounds: ${rounds}) ===`);
  console.log(`Real Player Target Frequency: ${realTargeted}/${rounds} (${(realTargeted/rounds*100).toFixed(1)}%)`);
  console.log(`Real Solo Wins: ${realWonSolo} (${(realWonSolo/rounds*100).toFixed(1)}%)`);
  console.log(`Real Split Wins: ${realWonSplit} (${(realWonSplit/rounds*100).toFixed(1)}%)`);
  console.log(`Total Real Wins (Solo + Split): ${realWonSolo + realWonSplit} (${((realWonSolo+realWonSplit)/rounds*100).toFixed(1)}%)`);
  console.log(`Bot Wins: ${botWon} (${(botWon/rounds*100).toFixed(1)}%)`);
  console.log(`Average Ball When Round Ends: ${avgBall.toFixed(2)}`);
}

console.log('Running 500-round fairness audit...');
runSimulation('CURRENT', 500);
runSimulation('FAST_CADENCE', 500);
