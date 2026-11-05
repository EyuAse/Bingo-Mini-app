import fs from 'fs';
import path from 'path';

console.log('═══════════════════════════════════════════════════════════════');
console.log('🚀 EXECUTING PHASE 1: PRE-FLIGHT INTEGRITY AUDIT & BACKUPS');
console.log('═══════════════════════════════════════════════════════════════\n');

// 1. Audit Audio-new
const srcDir = path.resolve('Audio-new');
if (!fs.existsSync(srcDir)) {
  console.error('❌ ERROR: Audio-new directory not found!');
  process.exit(1);
}

const files = fs.readdirSync(srcDir).filter(f => !f.startsWith('.'));
console.log('1️⃣ Auditing source files in Audio-new:');
console.log('   Total files found:', files.length);

if (files.length !== 75) {
  console.error(`❌ Expected exactly 75 files in Audio-new, found: ${files.length}`);
  process.exit(1);
}

const ballMap = new Map();
const invalidFiles = [];
for (const file of files) {
  const match = file.match(/^(\d+)/);
  if (!match) {
    invalidFiles.push(file);
    continue;
  }
  const num = parseInt(match[1], 10);
  if (num < 1 || num > 75) {
    invalidFiles.push(file);
    continue;
  }
  if (ballMap.has(num)) {
    console.error(`❌ Duplicate ball number detected: ${num} (${file} vs ${ballMap.get(num).file})`);
    process.exit(1);
  }
  const fullPath = path.join(srcDir, file);
  const stat = fs.statSync(fullPath);
  const buf = Buffer.alloc(10);
  const fd = fs.openSync(fullPath, 'r');
  fs.readSync(fd, buf, 0, 10, 0);
  fs.closeSync(fd);

  // Check MP3 header: ID3v2 ('ID3') or MPEG sync frame (0xFF 0xFB/0xF3/0xF2)
  const isId3 = buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33;
  const isSync = buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0;
  if (!isId3 && !isSync) {
    console.error(`❌ Invalid MP3 header for file: ${file}`);
    process.exit(1);
  }

  ballMap.set(num, { file, size: stat.size, isId3, isSync });
}

if (invalidFiles.length > 0) {
  console.error('❌ Invalid files found:', invalidFiles);
  process.exit(1);
}

const missingBalls = [];
for (let i = 1; i <= 75; i++) {
  if (!ballMap.has(i)) missingBalls.push(i);
}

if (missingBalls.length > 0) {
  console.error('❌ Missing balls in Audio-new:', missingBalls);
  process.exit(1);
}

const minSize = Math.min(...Array.from(ballMap.values()).map(b => b.size));
const maxSize = Math.max(...Array.from(ballMap.values()).map(b => b.size));

console.log('   ✓ 100% of balls (1 to 75) verified in Audio-new.');
console.log('   ✓ All 75 files have valid ID3v2/MPEG audio headers.');
console.log(`   ✓ File size range: ${minSize} bytes to ${maxSize} bytes (~1.0s brisk vocal cadence).\n`);

// 2. Create Dual Safety Backups
console.log('2️⃣ Creating Dual Timestamped Safety Backups...');
const backupBase = path.resolve('backups/audio_backup_v3_20261104');
const backupAudio = path.join(backupBase, 'Audio');
const backupPublicAm = path.join(backupBase, 'public_am');

fs.mkdirSync(backupAudio, { recursive: true });
fs.mkdirSync(backupPublicAm, { recursive: true });

// Backup Audio/
const legacyAudioDir = path.resolve('Audio');
const legacyFiles = fs.readdirSync(legacyAudioDir);
let audioCopied = 0;
for (const f of legacyFiles) {
  fs.copyFileSync(path.join(legacyAudioDir, f), path.join(backupAudio, f));
  audioCopied++;
}
console.log(`   ✓ Backed up ${audioCopied} files from Audio/ -> backups/audio_backup_v3_20261104/Audio/`);

// Backup public/assets/audio/am/
const publicAmDir = path.resolve('public/assets/audio/am');
const publicAmFiles = fs.readdirSync(publicAmDir);
let publicCopied = 0;
for (const f of publicAmFiles) {
  fs.copyFileSync(path.join(publicAmDir, f), path.join(backupPublicAm, f));
  publicCopied++;
}
console.log(`   ✓ Backed up ${publicCopied} files from public/assets/audio/am/ -> backups/audio_backup_v3_20261104/public_am/`);

console.log('\n======================================================');
console.log('✅ PHASE 1 COMPLETE: AUDIT 100% PASSED & DUAL BACKUPS SECURED');
console.log('======================================================\n');

