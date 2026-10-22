import adminRouter from '../routes/admin.ts';

async function testPhase1() {
  console.log('🧪 [Test Phase 1]: Testing /api/admin/users route logic directly...');

  // Mock Request & Response for Express
  let resData: any = null;
  const mockReq: any = {
    query: {},
    user: { id: 'admin-id', role: 'admin' }
  };
  const mockRes: any = {
    status: (code: number) => ({
      json: (data: any) => { resData = { code, ...data }; return resData; }
    }),
    json: (data: any) => { resData = { code: 200, ...data }; return resData; }
  };

  // Find the /users route handler
  const routeLayer = (adminRouter as any).stack.find((layer: any) => layer.route && layer.route.path === '/users');
  if (!routeLayer) {
    throw new Error('Could not find /users route on adminRouter');
  }

  // The last handler in stack is the main route handler
  const handler = routeLayer.route.stack[routeLayer.route.stack.length - 1].handle;

  // Run handler
  await handler(mockReq, mockRes);

  console.log('\n--- Route Execution Results ---');
  console.log('Success:', resData.success);
  console.log('Total Count from DB:', resData.totalCount);
  console.log('Users Array Length:', resData.users?.length);
  console.log('Platform Stats:', resData.stats);

  if (resData.totalCount > 200 && resData.users?.length > 200) {
    console.log(`\n🎉 SUCCESS! Count is ${resData.totalCount} (NO LONGER STUCK AT 200).`);
  } else {
    console.error('\n❌ FAILURE: Users count is still capped.');
  }

  process.exit(0);
}

testPhase1().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
