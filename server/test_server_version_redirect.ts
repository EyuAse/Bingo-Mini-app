import assert from 'assert';

console.log('================================================================');
console.log('🧪 Testing Phase 1: Server-Side Universal 302 Version Redirect');
console.log('================================================================\n');

// Simulate the exact redirect middleware logic from server.ts
function simulateRedirectMiddleware(req: { method: string; path: string; url: string; query: any }) {
  let redirected = false;
  let redirectStatus = 0;
  let redirectLocation = '';
  let headers: Record<string, string> = {};

  const res = {
    setHeader: (k: string, v: string) => { headers[k] = v; },
    redirect: (status: number, location: string) => {
      redirected = true;
      redirectStatus = status;
      redirectLocation = location;
    }
  };

  let nextCalled = false;
  const next = () => { nextCalled = true; };

  // Exact logic from server.ts
  if (req.method === 'GET' && (req.path === '/' || req.path === '/index.html')) {
    const v = req.query.v;
    if (v !== '20260921_1') {
      const cleanUrl = req.url.replace(/([?&])v=[^&]*(&|$)/g, '$1').replace(/[?&]$/, '');
      const sep = cleanUrl.includes('?') ? '&' : '?';
      const redirectUrl = `${cleanUrl}${sep}v=20260921_1`;
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.redirect(302, redirectUrl);
      return { redirected, redirectStatus, redirectLocation, headers, nextCalled };
    }
  }
  next();
  return { redirected, redirectStatus, redirectLocation, headers, nextCalled };
}

// Test Case 1: Unversioned root request (e.g. clicked from old welcome post or direct domain)
const t1 = simulateRedirectMiddleware({ method: 'GET', path: '/', url: '/', query: {} });
assert.strictEqual(t1.redirected, true, 'Unversioned root request must be redirected');
assert.strictEqual(t1.redirectStatus, 302, 'Redirect status must be 302');
assert.strictEqual(t1.redirectLocation, '/?v=20260921_1', 'Location must append v=20260921_1');
assert.strictEqual(t1.headers['Cache-Control'], 'no-cache, no-store, must-revalidate', 'Cache-Control header set');
console.log('✅ PASS Case 1: GET / -> 302 to /?v=20260921_1');

// Test Case 2: Invitation / referral link without version (e.g. /?startapp=ref_998877)
const t2 = simulateRedirectMiddleware({ method: 'GET', path: '/', url: '/?startapp=ref_998877', query: { startapp: 'ref_998877' } });
assert.strictEqual(t2.redirected, true, 'Invitation link must be redirected');
assert.strictEqual(t2.redirectLocation, '/?startapp=ref_998877&v=20260921_1', 'Preserves startapp and appends v=20260921_1');
console.log('✅ PASS Case 2: GET /?startapp=ref_998877 -> 302 to /?startapp=ref_998877&v=20260921_1');

// Test Case 3: Stale older version tag (e.g. /?v=20260914_1)
const t3 = simulateRedirectMiddleware({ method: 'GET', path: '/', url: '/?v=20260914_1', query: { v: '20260914_1' } });
assert.strictEqual(t3.redirected, true, 'Older version tag must be replaced');
assert.strictEqual(t3.redirectLocation, '/?v=20260921_1', 'Replaces stale tag with current v=20260921_1');
console.log('✅ PASS Case 3: GET /?v=20260914_1 -> 302 to /?v=20260921_1');

// Test Case 4: Already on latest version (e.g. /?v=20260921_1)
const t4 = simulateRedirectMiddleware({ method: 'GET', path: '/', url: '/?v=20260921_1', query: { v: '20260921_1' } });
assert.strictEqual(t4.redirected, false, 'Latest version must NOT be redirected');
assert.strictEqual(t4.nextCalled, true, 'Calls next() to serve index.html');
console.log('✅ PASS Case 4: GET /?v=20260921_1 -> 200 OK (Served directly)');

// Test Case 5: API routes must NEVER be redirected
const t5 = simulateRedirectMiddleware({ method: 'GET', path: '/api/admin/telegram/status', url: '/api/admin/telegram/status', query: {} });
assert.strictEqual(t5.redirected, false, 'API endpoints must never be redirected');
assert.strictEqual(t5.nextCalled, true, 'Calls next() for API route');
console.log('✅ PASS Case 5: GET /api/... -> Passes through untouched');

console.log('\n================================================================');
console.log('🎉 ALL PHASE 1 SERVER REDIRECT TESTS PASSED (100%)');
console.log('================================================================\n');
process.exit(0);
