import fs from 'fs';
import path from 'path';

console.log('═══════════════════════════════════════════════════════════════');
console.log('🚀 EXECUTING PHASE 2: MASTER RENAMING & NORMALIZATION');
console.log('═══════════════════════════════════════════════════════════════\n');

const audioNewDir = path.resolve('Audio-new');
const audioMasterDir = path.resolve('Audio');

if (!fs.existsSync(audioNewDir)) {
  console.error('❌ Audio-new directory not found!');
  process.exit(1);
}

// 1. Read files from Audio-new
const files = fs.readdirSync(audioNewDir).filter(f => !f.startsWith('.'));
console.log(`1️⃣ Processing ${files.length} files in Audio-new...`);

// Mapping of ball numbers 1-75
const ballItems = [];
for (const file of files) {
  const match = file.match(/^(\d+)/);
  if (!match) {
    console.error(`❌ Unexpected file in Audio-new: ${file}`);
    process.exit(1);
  }
  const num = parseInt(match[1], 10);
  let col = 'B';
  if (num >= 1 && num <= 15) col = 'B';
  else if (num >= 16 && num <= 30) col = 'I';
  else if (num >= 31 && num <= 45) col = 'N';
  else if (num >= 46 && num <= 60) col = 'G';
  else if (num >= 61 && num <= 75) col = 'O';

  const canonicalName = `${col}${num}.mp3`;
  ballItems.push({
    num,
    col,
    oldFilename: file,
    canonicalName,
    srcPath: path.join(audioNewDir, file)
  });
}

// Sort by ball number
ballItems.sort((a, b) => a.num - b.num);

// 2. Rename files in Audio-new to canonical names
console.log('2️⃣ Renaming files in Audio-new to canonical form (B1.mp3 - O75.mp3)...');
for (const item of ballItems) {
  const targetPath = path.join(audioNewDir, item.canonicalName);
  if (item.srcPath !== targetPath) {
    fs.renameSync(item.srcPath, targetPath);
  }
}
console.log('   ✓ All 75 files in Audio-new renamed to B1.mp3 through O75.mp3.');

// 3. Clear and update master Audio/ folder with new voice
console.log('3️⃣ Updating master Audio/ directory with normalized voice pack...');
fs.mkdirSync(audioMasterDir, { recursive: true });

// Clean previous files in Audio/
const oldAudioFiles = fs.readdirSync(audioMasterDir);
for (const f of oldAudioFiles) {
  fs.unlinkSync(path.join(audioMasterDir, f));
}

// Copy canonical files to Audio/
for (const item of ballItems) {
  const src = path.join(audioNewDir, item.canonicalName);
  const destCanonical = path.join(audioMasterDir, item.canonicalName);
  fs.copyFileSync(src, destCanonical);

  // Generate lowercase alias for Linux case sensitivity if letter is different
  const lowerAlias = `${item.col.toLowerCase()}${item.num}.mp3`;
  const destLower = path.join(audioMasterDir, lowerAlias);
  if (!fs.existsSync(destLower)) {
    fs.copyFileSync(src, destLower);
  }
}

const masterFiles = fs.readdirSync(audioMasterDir);
console.log(`   ✓ Master Audio/ populated with ${masterFiles.length} files (canonical + Linux case-safe aliases).`);

// 4. Verification Check
console.log('4️⃣ Verifying master Audio/ files for balls 1-75...');
for (let i = 1; i <= 75; i++) {
  let col = 'B';
  if (i > 15 && i <= 30) col = 'I';
  else if (i > 30 && i <= 45) col = 'N';
  else if (i > 45 && i <= 60) col = 'G';
  else if (i > 60 && i <= 75) col = 'O';

  const expectedName = `${col}${i}.mp3`;
  const filePath = path.join(audioMasterDir, expectedName);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Verification failed: missing ${expectedName} in Audio/`);
    process.exit(1);
  }
  const stat = fs.statSync(filePath);
  if (stat.size < 10000) {
    console.error(`❌ File suspiciously small: ${expectedName} (${stat.size} bytes)`);
    process.exit(1);
  }
}

console.log('   ✓ B1 (Ball 1):', fs.statSync(path.join(audioMasterDir, 'B1.mp3')).size, 'bytes');
console.log('   ✓ I16 (Ball 16):', fs.statSync(path.join(audioMasterDir, 'I16.mp3')).size, 'bytes');
console.log('   ✓ N31 (Ball 31):', fs.statSync(path.join(audioMasterDir, 'N31.mp3')).size, 'bytes');
console.log('   ✓ G46 (Ball 46):', fs.statSync(path.join(audioMasterDir, 'G46.mp3')).size, 'bytes');
console.log('   ✓ O75 (Ball 75):', fs.statSync(path.join(audioMasterDir, 'O75.mp3')).size, 'bytes');

console.log('\n======================================================');
console.log('✅ PHASE 2 COMPLETE: MASTER RENAMING & NORMALIZATION READY');
console.log('======================================================\n');

