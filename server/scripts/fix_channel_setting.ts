import { query } from '../db.ts';

async function updateChannel() {
  await query(
    `INSERT INTO admin_settings (key, value, updated_at)
     VALUES ('telegram_channel_id', '@lomibingo_official', NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`
  );
  console.log('✅ Successfully set telegram_channel_id to @lomibingo_official in Neon DB!');
  process.exit(0);
}

updateChannel().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
