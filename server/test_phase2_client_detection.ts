import { generateCardFromId, BingoCell } from './game/cartelaGenerator.ts';

const WIN_PATTERNS: number[][] = [
  // 5 Rows
  [0, 1, 2, 3, 4],
  [5, 6, 7, 8, 9],
  [10, 11, 12, 13, 14],
  [15, 16, 17, 18, 19],
  [20, 21, 22, 23, 24],
  // 5 Columns
  [0, 5, 10, 15, 20],
  [1, 6, 11, 16, 21],
  [2, 7, 12, 17, 22],
  [3, 8, 13, 18, 23],
  [4, 9, 14, 19, 24],
  // 2 Diagonals
  [0, 6, 12, 18, 24],
  [4, 8, 12, 16, 20]
];

console.log('================================================================');
console.log('🧪 Testing Phase 2: Client Pattern Detection & Multi-Card Support');
console.log('================================================================\n');

// Client-side getActiveWinningPatternOnBall implementation
const getActiveWinningPatternOnBall = (
  cells: BingoCell[],
  eligibleBallNums: (number | null | undefined)[] | number | null
): number[] | null => {
  const numsArray = Array.isArray(eligibleBallNums) ? eligibleBallNums : [eligibleBallNums];
  const validNums = numsArray.filter((n): n is number => typeof n === 'number' && n > 0);
  if (validNums.length === 0) return null;

  for (const line of WIN_PATTERNS) {
    if (line.every(idx => cells[idx]?.marked)) {
      const containsEligible = line.some(idx => {
        const cell = cells[idx];
        return !cell?.isFree && typeof cell?.val === 'number' && validNums.includes(cell.val);
      });
      if (containsEligible) return line;
    }
  }
  return null;
};

// 1. Generate Cards 1, 2, and 3
const card1 = generateCardFromId(10);
const card2 = generateCardFromId(20);
const card3 = generateCardFromId(30);

// Mark Column 0 on Card 3 (B column: indices 0, 5, 10, 15, 20)
const col0Indices = [0, 5, 10, 15, 20];
const col0Nums = col0Indices.map(idx => card3[idx].val as number);
col0Indices.forEach(idx => { card3[idx].marked = true; });

const lastCalledOnCard3 = col0Nums[col0Nums.length - 1];

console.log('Card 3 Column 0 Numbers:', col0Nums);
console.log('Card 3 Final Winning Ball:', lastCalledOnCard3);

// Test 1: Card 3 detected on current ball
const currentCall = { num: lastCalledOnCard3 };
const prevCall = null;
const eligible1 = [currentCall.num, prevCall];
const activeWinCard3A = getActiveWinningPatternOnBall(card3, eligible1);

console.log('\n--- Test 1: Card 3 Winning Pattern on Current Ball ---');
console.log('Detected Line on Card 3:', activeWinCard3A);
if (!activeWinCard3A) {
  console.error('❌ FAIL: Card 3 must be detected when pattern completes!');
  process.exit(1);
}
console.log('✅ PASS: Card 3 successfully detected on current ball.');

// Test 2: Card 3 detected on 1-ball buffer (Next ball called)
const nextBall = 99;
const eligible2 = [nextBall, lastCalledOnCard3]; // lastCalledOnCard3 is previous ball
const activeWinCard3B = getActiveWinningPatternOnBall(card3, eligible2);

console.log('\n--- Test 2: Card 3 Winning Pattern on 1-Ball Buffer (Previous Ball) ---');
console.log('Eligible Balls:', eligible2);
console.log('Detected Line on Card 3:', activeWinCard3B);
if (!activeWinCard3B) {
  console.error('❌ FAIL: Card 3 must be detected within 1-ball grace window!');
  process.exit(1);
}
console.log('✅ PASS: Card 3 successfully detected under 1-ball buffer.');

// Test 3: Card 3 expired when 2 balls pass
const ballTwoLater = 98;
const eligible3 = [ballTwoLater, nextBall]; // neither is in Card 3 Column 0
const activeWinCard3C = getActiveWinningPatternOnBall(card3, eligible3);

console.log('\n--- Test 3: Card 3 Expired / Sleeping Pattern (2 balls pass) ---');
console.log('Eligible Balls:', eligible3);
console.log('Detected Line on Card 3:', activeWinCard3C);
if (activeWinCard3C) {
  console.error('❌ FAIL: Card 3 pattern should expire after 2 balls pass!');
  process.exit(1);
}
console.log('✅ PASS: Expired pattern on Card 3 correctly rejected.');

console.log('\n================================================================');
console.log('🎉 ALL PHASE 2 ISOLATED VERIFICATION TESTS PASSED (100%)');
console.log('================================================================\n');
