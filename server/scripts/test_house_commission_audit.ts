import { query } from '../db.ts';

async function main() {
  console.log('🔍 [Audit]: Investigating House Commission in Neon DB...');

  const roundsRes = await query(`
    SELECT 
      COUNT(*) as total_rounds,
      COALESCE(SUM(platform_fee), 0) as total_house_commission,
      COALESCE(SUM(total_pot), 0) as total_pot_volume,
      COALESCE(SUM(winner_payout), 0) as total_winner_payout
    FROM game_rounds
  `);

  const depositsRes = await query(`
    SELECT COALESCE(SUM(amount), 0) as total_deposits 
    FROM deposit_requests 
    WHERE status = 'approved'
  `);

  const r = roundsRes.rows[0];
  const totalRounds = parseInt(r.total_rounds, 10);
  const totalHouseCommission = parseFloat(r.total_house_commission);
  const totalPot = parseFloat(r.total_pot_volume);
  const totalPayout = parseFloat(r.total_winner_payout);

  const deposits = parseFloat(depositsRes.rows[0].total_deposits);
  const fakeCommission = Math.round(deposits * 0.15);

  console.log('\n--- 📊 Live Neon DB Results ---');
  console.log('Total Completed Rounds:', totalRounds);
  console.log('REAL House Commission (SUM of platform_fee):', totalHouseCommission, 'ETB');
  console.log('Total Pot Volume:', totalPot, 'ETB');
  console.log('Total Winner Payouts:', totalPayout, 'ETB');
  console.log('Total Approved Deposits in DB:', deposits, 'ETB');
  console.log('\n--- ⚠️ The Disconnected Frontend Formula ---');
  console.log('Fake Formula: Math.round(deposits * 0.15)');
  console.log(`Calculation: Math.round(${deposits} * 0.15) =`, fakeCommission, 'ETB');

  console.log('\n🎯 VERDICT:');
  console.log(`The displayed 1,433.00 ETB comes exactly from ${deposits} * 0.15 = ${fakeCommission}.`);
  console.log(`The REAL house commission in the database is ${totalHouseCommission.toFixed(2)} ETB!`);

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
