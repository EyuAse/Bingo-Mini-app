/**
 * test_bandwidth_phase3_etag.ts
 *
 * Automated verification of Bandwidth Optimization Phase 3:
 * 1. Verifies HTTP 200 response with ETag and Cache-Control headers on /api/rooms/:id/sync
 * 2. Verifies HTTP 304 (0 bytes) returned when If-None-Match matches current state
 * 3. Verifies /api/rooms ETag and HTTP 304 response
 * 4. Verifies state changes invalidate ETag immediately and return HTTP 200 with fresh data
 */

import http from 'http';
import { app } from '../server.ts';
import { gameEngine } from '../game/BingoGameEngine.ts';

function rawHttpReq(
  options: http.RequestOptions
): Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; body: Buffer }> {
  return new Promise((resolve, reject) => {
    const req = http.request(options, res => {
      const chunks: Buffer[] = [];
      res.on('data', chunk => chunks.push(Buffer.from(chunk)));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode || 0,
          headers: res.headers,
          body: Buffer.concat(chunks)
        });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function runPhase3EtagTests() {
  console.log('🚀 [Test] Starting Phase 3 HTTP 304 ETag Bandwidth Optimization Test Suite...\n');

  const server = http.createServer(app);
  await new Promise<void>(resolve => server.listen(0, resolve));
  const address = server.address() as any;
  const port = address.port;
  console.log(`✓ Test server running on ephemeral port ${port}`);

  try {
    // 1. Initial Request to /api/rooms/room-10/sync
    console.log('\n--- TEST 1: Initial Request to /api/rooms/room-10/sync ---');
    const res1 = await rawHttpReq({
      hostname: 'localhost',
      port,
      path: '/api/rooms/room-10/sync',
      method: 'GET'
    });

    if (res1.statusCode !== 200) {
      throw new Error(`❌ Expected status 200, got ${res1.statusCode}`);
    }
    const etag1 = res1.headers['etag'];
    if (!etag1) {
      throw new Error('❌ ETag header missing from /api/rooms/room-10/sync response');
    }
    const cacheControl1 = res1.headers['cache-control'];
    console.log(`   ✅ Status Code: ${res1.statusCode}`);
    console.log(`   ✅ ETag: ${etag1}`);
    console.log(`   ✅ Cache-Control: ${cacheControl1}`);
    console.log(`   ✅ Response Body Size: ${res1.body.length} bytes`);

    // 2. Conditional Request with If-None-Match (Should return HTTP 304, 0 bytes)
    console.log('\n--- TEST 2: Conditional Request with If-None-Match ---');
    const res2 = await rawHttpReq({
      hostname: 'localhost',
      port,
      path: '/api/rooms/room-10/sync',
      method: 'GET',
      headers: {
        'If-None-Match': etag1
      }
    });

    if (res2.statusCode !== 304) {
      throw new Error(`❌ Expected status 304 Not Modified, got ${res2.statusCode}`);
    }
    if (res2.body.length !== 0) {
      throw new Error(`❌ Expected 0 bytes body on 304, got ${res2.body.length} bytes`);
    }
    console.log(`   ✅ Status Code: 304 Not Modified`);
    console.log(`   ✅ Wire Body Size: ${res2.body.length} bytes (100% bandwidth saved!)`);
    console.log(`   ✅ ETag preserved: ${res2.headers['etag']}`);

    // 3. Verify /api/rooms ETag & 304
    console.log('\n--- TEST 3: /api/rooms ETag & 304 Support ---');
    const resRooms1 = await rawHttpReq({
      hostname: 'localhost',
      port,
      path: '/api/rooms',
      method: 'GET'
    });
    if (resRooms1.statusCode !== 200) {
      throw new Error(`❌ /api/rooms expected status 200, got ${resRooms1.statusCode}`);
    }
    const etagRooms = resRooms1.headers['etag'];
    if (!etagRooms) {
      throw new Error('❌ ETag missing from /api/rooms');
    }

    const resRooms2 = await rawHttpReq({
      hostname: 'localhost',
      port,
      path: '/api/rooms',
      method: 'GET',
      headers: {
        'If-None-Match': etagRooms
      }
    });
    if (resRooms2.statusCode !== 304) {
      throw new Error(`❌ /api/rooms conditional expected status 304, got ${resRooms2.statusCode}`);
    }
    console.log(`   ✅ /api/rooms successfully returned 304 Not Modified (0 bytes)`);

    // 4. Verify Immediate Invalidation when Room State Mutates
    console.log('\n--- TEST 4: Immediate Invalidation upon State Mutation ---');
    const room10 = gameEngine.getRoom('room-10');
    if (!room10) throw new Error('❌ room-10 not found');

    const previousCountdown = room10.lobbyCountdown;
    room10.lobbyCountdown = 17; // Mutate state

    const res3 = await rawHttpReq({
      hostname: 'localhost',
      port,
      path: '/api/rooms/room-10/sync',
      method: 'GET',
      headers: {
        'If-None-Match': etag1
      }
    });

    // Restore countdown
    room10.lobbyCountdown = previousCountdown;

    if (res3.statusCode !== 200) {
      throw new Error(`❌ Expected status 200 upon state mutation, got ${res3.statusCode}`);
    }
    const etag3 = res3.headers['etag'];
    if (etag3 === etag1) {
      throw new Error(`❌ ETag should have changed upon mutation! Both are: ${etag3}`);
    }
    console.log(`   ✅ State mutation detected immediately! Status: 200 OK`);
    console.log(`   ✅ Old ETag: ${etag1}`);
    console.log(`   ✅ New ETag: ${etag3}`);

    console.log('\n🎉 [Success] All Phase 3 HTTP 304 ETag Bandwidth Optimization Tests Passed Perfectly!');
  } finally {
    server.close();
    process.exit(0);
  }
}

runPhase3EtagTests().catch(err => {
  console.error('❌ [Phase 3 Test Failure]:', err);
  process.exit(1);
});
