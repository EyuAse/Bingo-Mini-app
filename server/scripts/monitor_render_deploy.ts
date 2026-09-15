/**
 * Monitor Render Production Deployment
 * Checks https://bingo-mini-app-30pe.onrender.com to determine if Render has
 * deployed the latest build containing the universal 302 redirect and client head guard.
 */

async function checkRenderDeployment(): Promise<{
  isDeployed: boolean;
  status: number;
  lastModified?: string;
  has302Redirect: boolean;
  hasHeadGuard: boolean;
  details: string;
}> {
  try {
    // 1. Check GET / without follow redirect to see if 302 redirect middleware is active
    const rawRes = await fetch('https://bingo-mini-app-30pe.onrender.com', {
      redirect: 'manual'
    });

    const status = rawRes.status;
    const location = rawRes.headers.get('location') || '';
    const lastModified = rawRes.headers.get('last-modified') || '';
    const has302Redirect = status === 302 && location.includes('v=20260915_2');

    // 2. Fetch the HTML content
    const htmlRes = await fetch('https://bingo-mini-app-30pe.onrender.com');
    const html = await htmlRes.text();
    const hasHeadGuard = html.includes('Cache-Busting Version Guard');

    const isDeployed = has302Redirect || hasHeadGuard;

    let details = '';
    if (isDeployed) {
      details = 'Render is serving the latest build with cache-busting protection!';
    } else {
      details = `Render is still serving stale build (Last-Modified: ${lastModified || 'unknown'}). Auto-deploy may be paused in Render Dashboard.`;
    }

    return {
      isDeployed,
      status,
      lastModified,
      has302Redirect,
      hasHeadGuard,
      details
    };
  } catch (err: any) {
    return {
      isDeployed: false,
      status: 0,
      has302Redirect: false,
      hasHeadGuard: false,
      details: `Failed to connect to Render: ${err.message}`
    };
  }
}

async function main() {
  console.log('================================================================');
  console.log('🔍 Phase A: Diagnostic - Checking Live Render Production Status');
  console.log('Target: https://bingo-mini-app-30pe.onrender.com');
  console.log('================================================================\n');

  const res = await checkRenderDeployment();
  console.log(`HTTP Status: ${res.status}`);
  console.log(`Last-Modified: ${res.lastModified || 'N/A'}`);
  console.log(`Server 302 Redirect Active: ${res.has302Redirect ? '✅ YES' : '❌ NO'}`);
  console.log(`Client <head> Guard Present: ${res.hasHeadGuard ? '✅ YES' : '❌ NO'}`);
  console.log(`\nDeployment Status: ${res.isDeployed ? '🎉 LIVE & UPDATED' : '⏳ PENDING DEPLOY'}`);
  console.log(`Details: ${res.details}\n`);

  if (!res.isDeployed) {
    console.log('----------------------------------------------------------------');
    console.log('📋 ACTION REQUIRED ON RENDER DASHBOARD:');
    console.log('1. Log in to https://dashboard.render.com');
    console.log('2. Open the "bingo-mini-app-30pe" Web Service');
    console.log('3. Click "Manual Deploy" -> "Clear build cache & deploy"');
    console.log('4. Once deployment starts, Render will pull commit 5bf6586.');
    console.log('----------------------------------------------------------------\n');
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
