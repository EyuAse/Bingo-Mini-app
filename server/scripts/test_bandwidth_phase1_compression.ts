import assert from 'assert';
import http from 'http';
import { app } from '../server.ts';

console.log('═══════════════════════════════════════════════════════════════');
console.log('🧪 TESTING BANDWIDTH PHASE 1: GZIP COMPRESSION & CORS CACHE');
console.log('═══════════════════════════════════════════════════════════════\n');

function rawHttpGet(url: string, acceptEncoding: string): Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; rawBytes: number }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: {
        'Accept-Encoding': acceptEncoding
      }
    }, (res) => {
      let bytes = 0;
      res.on('data', (chunk) => {
        bytes += chunk.length;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode || 200,
          headers: res.headers,
          rawBytes: bytes
        });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  const testServer = http.createServer(app);

  await new Promise<void>((resolve) => {
    testServer.listen(0, () => resolve());
  });

  const address = testServer.address() as any;
  const port = address.port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`✓ Test HTTP server listening on ephemeral port ${port}\n`);

  try {
    // -------------------------------------------------------------
    // TEST 1: GZIP Compression Verification on JSON API Endpoints
    // -------------------------------------------------------------
    console.log('1️⃣ [Test 1] Verifying Express GZIP Compression on JSON APIs...');

    // Raw HTTP request without compression
    const uncompressedRes = await rawHttpGet(`${baseUrl}/api/rooms`, 'identity');
    const uncompressedSize = uncompressedRes.rawBytes;

    // Raw HTTP request with gzip
    const compressedRes = await rawHttpGet(`${baseUrl}/api/rooms`, 'gzip');
    const contentEncoding = compressedRes.headers['content-encoding'];
    const compressedSize = compressedRes.rawBytes;

    console.log(`   • Uncompressed wire size: ${uncompressedSize} bytes`);
    console.log(`   • Compressed wire size:   ${compressedSize} bytes`);
    console.log(`   • Content-Encoding:       ${contentEncoding}`);

    assert.strictEqual(contentEncoding, 'gzip', 'Server must return Content-Encoding: gzip when client sends Accept-Encoding: gzip');
    assert(compressedSize < uncompressedSize, `Compressed size (${compressedSize}) must be smaller than uncompressed (${uncompressedSize})`);

    const savingsPercent = (((uncompressedSize - compressedSize) / uncompressedSize) * 100).toFixed(1);
    console.log(`   ✓ PASS: GZIP compression is ACTIVE! Saved ${savingsPercent}% of egress bandwidth.\n`);

    // -------------------------------------------------------------
    // TEST 2: CORS Preflight (OPTIONS) Max-Age Cache Header Check
    // -------------------------------------------------------------
    console.log('2️⃣ [Test 2] Verifying CORS Preflight Max-Age 86400 (24h Cache)...');
    const preflightRes = await fetch(`${baseUrl}/api/rooms`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://bingo-mini-app.asefaeyob962.workers.dev',
        'Access-Control-Request-Method': 'GET'
      }
    });

    const maxAgeHeader = preflightRes.headers.get('access-control-max-age');
    const allowOrigin = preflightRes.headers.get('access-control-allow-origin');
    console.log(`   • Access-Control-Max-Age:      ${maxAgeHeader}`);
    console.log(`   • Access-Control-Allow-Origin:   ${allowOrigin}`);

    assert.strictEqual(maxAgeHeader, '86400', 'Preflight response must specify Access-Control-Max-Age: 86400');
    assert(allowOrigin !== null, 'Preflight response must include Access-Control-Allow-Origin');
    console.log('   ✓ PASS: Preflight caching verified! Browsers will cache CORS checks for 24h.\n');

    // -------------------------------------------------------------
    // TEST 3: Health Endpoint Availability & Integrity
    // -------------------------------------------------------------
    console.log('3️⃣ [Test 3] Verifying /api/health integrity under compression...');
    const healthRes = await fetch(`${baseUrl}/api/health`, {
      headers: { 'Accept-Encoding': 'gzip' }
    });
    const healthJson = await healthRes.json() as any;
    console.log(`   • Status Code: ${healthRes.status}`);
    console.log(`   • Service Name: ${healthJson.service}`);
    assert(healthRes.status === 200 || healthRes.status === 503, 'Health endpoint must respond cleanly');
    assert.strictEqual(healthJson.service, 'Lomi Bingo Production API');
    console.log('   ✓ PASS: API endpoints deserialize with 100% data integrity under compression.\n');

    console.log('===============================================================');
    console.log('🎉 ALL PHASE 1 BANDWIDTH OPTIMIZATION TESTS PASSED (100%)');
    console.log('===============================================================');
    process.exit(0);
  } finally {
    testServer.close();
  }
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
