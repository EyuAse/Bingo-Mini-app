import adminRouter from '../routes/admin.ts';

async function executeMockRequest(query: any) {
  let resData: any = null;
  const mockReq: any = {
    query,
    user: { id: 'admin-id', role: 'admin' }
  };
  const mockRes: any = {
    status: (code: number) => ({
      json: (data: any) => { resData = { code, ...data }; return resData; }
    }),
    json: (data: any) => { resData = { code: 200, ...data }; return resData; }
  };

  const routeLayer = (adminRouter as any).stack.find((layer: any) => layer.route && layer.route.path === '/users');
  if (!routeLayer) throw new Error('Could not find /users route on adminRouter');
  const handler = routeLayer.route.stack[routeLayer.route.stack.length - 1].handle;
  await handler(mockReq, mockRes);
  return resData;
}

async function testPhase1() {
  console.log('🧪 [Test Phase 1]: Verifying Paginated & Searchable /api/admin/users API...\n');

  // Test 1: Default Page 1 (limit 50)
  console.log('1️⃣ Testing Default Call (Page 1, Limit 50)...');
  const page1 = await executeMockRequest({});
  console.log(`   ✓ Success: ${page1.success}`);
  console.log(`   ✓ Users returned: ${page1.users?.length} (Expected 50)`);
  console.log(`   ✓ Total Registered Players: ${page1.totalPlayers}`);
  console.log(`   ✓ Total Pages: ${page1.totalPages}`);
  console.log(`   ✓ Page: ${page1.page}, Limit: ${page1.limit}`);
  if (page1.users?.length !== 50 || page1.totalPlayers < 1300) {
    throw new Error('Default pagination failed');
  }

  // Test 2: Search for 'Eyu' across whole database
  console.log('\n2️⃣ Testing Database-Wide Search for "Eyu"...');
  const searchEyu = await executeMockRequest({ search: 'Eyu' });
  console.log(`   ✓ Matching count: ${searchEyu.totalCount}`);
  console.log(`   ✓ Total platform players: ${searchEyu.totalPlayers}`);
  const eyuUser = searchEyu.users.find((u: any) => u.name.toLowerCase().includes('eyu'));
  console.log(`   ✓ Found target user: ${eyuUser?.name} (ID: ${eyuUser?.id})`);
  if (!eyuUser) throw new Error('Failed to find Eyu via database search');

  // Test 3: Search for 'Bleach' across whole database
  console.log('\n3️⃣ Testing Database-Wide Search for "Bleach"...');
  const searchBleach = await executeMockRequest({ search: 'Bleach' });
  console.log(`   ✓ Matching count: ${searchBleach.totalCount}`);
  const bleachUser = searchBleach.users.find((u: any) => u.name.toLowerCase().includes('bleach'));
  console.log(`   ✓ Found target user: ${bleachUser?.name} (ID: ${bleachUser?.id})`);
  if (!bleachUser) throw new Error('Failed to find Bleach via database search');

  // Test 4: Jump to Last Page (Page 27)
  console.log(`\n4️⃣ Testing Jump to Last Page (${page1.totalPages})...`);
  const lastPage = await executeMockRequest({ page: page1.totalPages, limit: 50 });
  console.log(`   ✓ Users on last page: ${lastPage.users?.length}`);
  console.log(`   ✓ Oldest user on last page: ${lastPage.users[lastPage.users.length - 1]?.name} (Joined: ${lastPage.users[lastPage.users.length - 1]?.createdAt})`);

  console.log('\n══════════════════════════════════════════════════════════════════════════════');
  console.log('✅ ALL PHASE 1 TESTS PASSED! Backend pagination and database search verified.');
  console.log('══════════════════════════════════════════════════════════════════════════════\n');

  process.exit(0);
}

testPhase1().catch(err => {
  console.error('❌ Phase 1 test error:', err);
  process.exit(1);
});
