import { getBackendOrigin, getApiBase, LIVE_BACKEND_ORIGIN } from '../src/config/env.ts';

console.log('🧪 RUNNING ENVIRONMENT & API BASE RESOLUTION TEST');

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`   ✅ PASS: ${msg}`);
    passed++;
  } else {
    console.error(`   ❌ FAIL: ${msg}`);
    failed++;
  }
}

// 1. In Node environment (window is undefined)
console.log('\n1️⃣ Testing Node.js / SSR environment:');
const nodeOrigin = getBackendOrigin();
const nodeApi = getApiBase();
console.log(`   Node Backend Origin: ${nodeOrigin}`);
console.log(`   Node API Base: ${nodeApi}`);
assert(nodeOrigin === 'http://localhost:5000', 'Node origin defaults to http://localhost:5000');
assert(nodeApi === 'http://localhost:5000/api', 'Node API base defaults to http://localhost:5000/api');

// 2. Simulated Localhost Browser
console.log('\n2️⃣ Testing Localhost Browser environment:');
(global as any).window = {
  location: { hostname: 'localhost' }
};
const localOrigin = getBackendOrigin();
const localApi = getApiBase();
console.log(`   Localhost Origin: ${localOrigin}`);
console.log(`   Localhost API: ${localApi}`);
assert(localOrigin === 'http://localhost:5000', 'Localhost origin is http://localhost:5000');
assert(localApi === '/api', 'Localhost API base uses Vite proxy /api');

// 3. Simulated Telegram Mini App on custom / Render / Vercel domain
console.log('\n3️⃣ Testing Telegram Mini App Production environment:');
(global as any).window = {
  location: { hostname: 'tma.lomibingo.com' }
};
const tmaOrigin = getBackendOrigin();
const tmaApi = getApiBase();
console.log(`   TMA Origin: ${tmaOrigin}`);
console.log(`   TMA API Base: ${tmaApi}`);
assert(tmaOrigin === LIVE_BACKEND_ORIGIN, `TMA origin resolves to ${LIVE_BACKEND_ORIGIN}`);
assert(tmaApi === `${LIVE_BACKEND_ORIGIN}/api`, `TMA API base resolves to ${LIVE_BACKEND_ORIGIN}/api (fixes 404s!)`);

// 4. Simulated Netlify domain
console.log('\n4️⃣ Testing Netlify environment:');
(global as any).window = {
  location: { hostname: 'bingo-mini-app.netlify.app' }
};
const netlifyOrigin = getBackendOrigin();
const netlifyApi = getApiBase();
assert(netlifyOrigin === LIVE_BACKEND_ORIGIN, 'Netlify origin resolves to Render backend');
assert(netlifyApi === `${LIVE_BACKEND_ORIGIN}/api`, 'Netlify API base resolves to Render /api');

console.log(`\n🏁 ENV TEST RESULT: ${passed} Passed, ${failed} Failed\n`);
process.exit(failed === 0 ? 0 : 1);
