import assert from 'assert';

console.log('================================================================');
console.log('🧪 Testing Phase 2: Client-Side Head Version Guard Logic');
console.log('================================================================\n');

const LATEST_V = '20260921_1';

function simulateHeadGuard(fullUrl: string): { redirected: boolean; target?: string } {
  const urlObj = new URL(fullUrl, 'https://bingo-mini-app-30pe.onrender.com');
  const params = urlObj.searchParams;
  const currentV = params.get('v');

  if (!currentV || currentV !== LATEST_V) {
    params.set('v', LATEST_V);
    const target = urlObj.pathname + '?' + params.toString() + (urlObj.hash || '');
    return { redirected: true, target };
  }
  return { redirected: false };
}

// Case 1: Unversioned root (e.g. from old bot promo message link)
const r1 = simulateHeadGuard('https://bingo-mini-app-30pe.onrender.com/');
assert.strictEqual(r1.redirected, true);
assert.strictEqual(r1.target, '/?v=20260921_1');
console.log('✅ PASS Case 1: Root / redirects to /?v=20260921_1');

// Case 2: Link with startapp parameter (e.g. referral from old post)
const r2 = simulateHeadGuard('https://bingo-mini-app-30pe.onrender.com/?startapp=ref_abc123');
assert.strictEqual(r2.redirected, true);
assert.strictEqual(r2.target, '/?startapp=ref_abc123&v=20260921_1');
console.log('✅ PASS Case 2: Preserves ?startapp and adds v=20260921_1');

// Case 3: Link with older version tag
const r3 = simulateHeadGuard('https://bingo-mini-app-30pe.onrender.com/?v=20260914_1');
assert.strictEqual(r3.redirected, true);
assert.strictEqual(r3.target, '/?v=20260921_1');
console.log('✅ PASS Case 3: Upgrades stale ?v=20260914_1 to v=20260921_1');

// Case 4: Link with Telegram webapp hash data
const r4 = simulateHeadGuard('https://bingo-mini-app-30pe.onrender.com/#tgWebAppData=user_xyz');
assert.strictEqual(r4.redirected, true);
assert.strictEqual(r4.target, '/?v=20260921_1#tgWebAppData=user_xyz');
console.log('✅ PASS Case 4: Preserves #tgWebAppData hash fragment on redirect');

// Case 5: Already on latest version
const r5 = simulateHeadGuard('https://bingo-mini-app-30pe.onrender.com/?v=20260921_1');
assert.strictEqual(r5.redirected, false);
console.log('✅ PASS Case 5: Already on latest version -> No redirect (200 execution)');

console.log('\n================================================================');
console.log('🎉 ALL PHASE 2 CLIENT HEAD GUARD TESTS PASSED (100%)');
console.log('================================================================\n');
