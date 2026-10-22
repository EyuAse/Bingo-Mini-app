import adminRouter from '../routes/admin.ts';

async function testPhase1Stats() {
  console.log('🧪 [Test Phase 1]: Testing /api/admin/stats route directly...');

  let resData: any = null;
  const mockReq: any = {
    user: { id: 'admin-id', role: 'admin' }
  };
  const mockRes: any = {
    status: (code: number) => ({
      json: (data: any) => { resData = { code, ...data }; return resData; }
    }),
    json: (data: any) => { resData = { code: 200, ...data }; return resData; }
  };

  const routeLayer = (adminRouter as any).stack.find((layer: any) => layer.route && layer.route.path === '/stats');
  if (!routeLayer) {
    throw new Error('Could not find /stats route on adminRouter');
  }

  const handler = routeLayer.route.stack[routeLayer.route.stack.length - 1].handle;
  await handler(mockReq, mockRes);

  console.log('\n--- Route Execution Results ---');
  console.log('Success:', resData.success);
  console.log('Stats Payload:', resData.stats);

  const s = resData.stats;
  if (
    typeof s.totalHouseRevenue === 'number' &&
    typeof s.todayHouseRevenue === 'number' &&
    typeof s.todayGamesPlayed === 'number' &&
    s.defaultCommissionRate === 20
  ) {
    console.log('\n🎉 SUCCESS! /api/admin/stats returns both today and total commission revenue dynamically:');
    console.log(`  - Today House Revenue: ${s.todayHouseRevenue} ETB`);
    console.log(`  - Total House Revenue: ${s.totalHouseRevenue} ETB`);
    console.log(`  - Today Games Played: ${s.todayGamesPlayed} rounds`);
    console.log(`  - Net Cash Profit Today: ${s.todayNetCashProfit} ETB`);
  } else {
    console.error('\n❌ FAILURE: Missing expected fields in stats payload');
    process.exit(1);
  }

  process.exit(0);
}

testPhase1Stats().catch(err => {
  console.error(err);
  process.exit(1);
});
