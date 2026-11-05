import fs from 'fs';
import path from 'path';

console.log('═══════════════════════════════════════════════════════════════');
console.log('🚀 EXECUTING PHASE 3: PUBLIC ASSET SYNCHRONIZATION');
console.log('═══════════════════════════════════════════════════════════════\n');

const masterAudioDir = path.resolve('Audio');
const publicAmDir = path.resolve('public/assets/audio/am');
const publicEnDir = path.resolve('public/assets/audio/en');

fs.mkdirSync(publicAmDir, { recursive: true });
fs.mkdirSync(publicEnDir, { recursive: true });

// 1. Read files from master Audio/
const files = fs.readdirSync(masterAudioDir).filter(f => f.endsWith('.mp3'));
console.log(`1️⃣ Found ${files.length} MP3 files in master Audio/ folder.`);

// Map 1-75
const ballMap = new Map();
for (let i = 1; i <= 75; i++) {
  let col = 'B';
  if (i > 15 && i <= 30) col = 'I';
  else if (i > 30 && i <= 45) col = 'N';
  else if (i > 45 && i <= 60) col = 'G';
  else if (i > 60 && i <= 75) col = 'O';

  const canonicalName = `${col}${i}.mp3`;
  const fullPath = path.join(masterAudioDir, canonicalName);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Missing canonical audio file: ${canonicalName}`);
    process.exit(1);
  }
  ballMap.set(i, { col, num: i, fullPath });
}
console.log(`   ✓ All 75 canonical master ball files confirmed present.`);

// 2. Synchronize to public directories with triple alias formats + case-safe aliases
console.log('2️⃣ Writing triple alias formats + case-safe aliases to public folders...');
const targetDirs = [
  { name: 'am', dir: publicAmDir },
  { name: 'en', dir: publicEnDir }
];

let totalWrites = 0;
for (const target of targetDirs) {
  let dirWrites = 0;
  for (let i = 1; i <= 75; i++) {
    const item = ballMap.get(i);
    const buffer = fs.readFileSync(item.fullPath);

    // Format 1: {num}.mp3 (PRIMARY used by soundEngine.getBallAudioUrl)
    fs.writeFileSync(path.join(target.dir, `${i}.mp3`), buffer);
    dirWrites++;

    // Format 2: {col}{num}.mp3 (e.g. B1.mp3, O75.mp3)
    fs.writeFileSync(path.join(target.dir, `${item.col}${i}.mp3`), buffer);
    dirWrites++;

    // Format 3: {col}-{num}.mp3 (e.g. B-1.mp3, O-75.mp3)
    fs.writeFileSync(path.join(target.dir, `${item.col}-${i}.mp3`), buffer);
    dirWrites++;

    // Format 4: Lowercase alias for Linux case sensitivity (e.g. o61.mp3, i17.mp3, n43.mp3)
    const lowerCol = item.col.toLowerCase();
    if (lowerCol !== item.col) {
      fs.writeFileSync(path.join(target.dir, `${lowerCol}${i}.mp3`), buffer);
      dirWrites++;
    }
  }
  console.log(`   ✓ Successfully wrote ${dirWrites} files to public/assets/audio/${target.name}/`);
  totalWrites += dirWrites;
}

// 3. Preserve non-ball audio
console.log('3️⃣ Verifying non-ball sound assets...');
const preserveFiles = ['start.mp3', 'start.webm'];
for (const p of preserveFiles) {
  const pPath = path.join(publicAmDir, p);
  if (fs.existsSync(pPath)) {
    console.log(`   ✓ Preserved: ${p} in public/assets/audio/am/`);
  }
}

// 4. Verify Ball 1, Ball 16, Ball 31, Ball 46, Ball 71, Ball 75
console.log('4️⃣ Verifying public asset integrity & file sizes...');
const testBalls = [1, 16, 31, 46, 71, 75];
for (const b of testBalls) {
  const numFile = path.join(publicAmDir, `${b}.mp3`);
  const masterFile = ballMap.get(b).fullPath;
  const numSize = fs.statSync(numFile).size;
  const masterSize = fs.statSync(masterFile).size;
  if (numSize !== masterSize) {
    console.error(`❌ File size mismatch for ball ${b}: ${numSize} vs ${masterSize}`);
    process.exit(1);
  }
  console.log(`   ✓ Ball ${b} verified: ${numSize} bytes matches master exactly.`);
}

console.log('\n======================================================');
console.log('✅ PHASE 3 COMPLETE: PUBLIC ASSETS SYNCHRONIZED');
console.log('======================================================\n');

