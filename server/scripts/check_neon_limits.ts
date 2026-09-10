import dotenv from 'dotenv';
import { getDatabaseStorageStats } from '../db.js';

dotenv.config();

async function runCheck() {
  console.log('\n======================================================');
  console.log('      🐘 NEON POSTGRESQL FREE-TIER HEALTH REPORT      ');
  console.log('======================================================\n');

  try {
    const stats = await getDatabaseStorageStats();

    const statusIcon = stats.status === 'healthy' ? '🟢' : stats.status === 'warning' ? '🟡' : '🔴';
    console.log(`Status:               ${statusIcon} ${stats.status.toUpperCase()}`);
    console.log(`Disk Storage Used:    ${stats.totalFormatted} / ${stats.quotaFormatted} (${stats.usagePercent}%)`);
    console.log(`Disk Space Free:      ${((stats.quotaBytes - stats.totalBytes) / (1024 * 1024)).toFixed(2)} MB remaining`);
    console.log(`Checked At:           ${stats.checkedAt}`);
    console.log('------------------------------------------------------');
    console.log('⚡ Free-Tier Compute Rules:');
    console.log('  • Monthly Quota:     100 CU-hrs (Resets to 0 on 1st of every month)');
    console.log('  • Sleep (Autosuspend): Neon automatically sleeps after 5 min of inactivity');
    console.log('  • Network Transfer:  5.0 GB per month');
    console.log('------------------------------------------------------');
    console.log('📋 Per-Table Breakdown (Sorted by Size):');
    console.log('  Table Name                  Rows       Storage');
    console.log('  ----------------------------------------------');
    for (const t of stats.tables) {
      const name = t.tableName.padEnd(26, ' ');
      const rows = String(t.rowCount).padStart(6, ' ');
      const size = t.totalFormatted.padStart(12, ' ');
      console.log(`  ${name} ${rows} ${size}`);
    }
    console.log('======================================================\n');
    process.exit(0);
  } catch (err: any) {
    console.error('❌ Failed to check database status:', err.message);
    process.exit(1);
  }
}

runCheck();
