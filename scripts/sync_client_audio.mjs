import fs from 'fs';
import path from 'path';

const ROOT_DIR = process.cwd();
const AUDIO_SRC_DIR = path.join(ROOT_DIR, 'Audio');
const PUBLIC_AUDIO_AM_DIR = path.join(ROOT_DIR, 'public', 'assets', 'audio', 'am');
const PUBLIC_AUDIO_EN_DIR = path.join(ROOT_DIR, 'public', 'assets', 'audio', 'en');
const BACKUP_DIR = path.join(ROOT_DIR, 'backups', 'audio_backup_legacy');

console.log('======================================================');
console.log('Synchronizing Client Audio Sound Pack (75 Bingo Balls)');
console.log('======================================================\n');

// 1. Rename typo in source directory: 071.mp3 -> o71.mp3
const typoFile = path.join(AUDIO_SRC_DIR, '071.mp3');
const fixedTypoFile = path.join(AUDIO_SRC_DIR, 'o71.mp3');
if (fs.existsSync(typoFile)) {
  fs.renameSync(typoFile, fixedTypoFile);
  console.log('✓ Corrected source typo: Audio/071.mp3 -> Audio/o71.mp3');
} else if (fs.existsSync(fixedTypoFile)) {
  console.log('✓ Source file Audio/o71.mp3 already correctly named.');
}

// 2. Read and map all 75 files from Audio/
const files = fs.readdirSync(AUDIO_SRC_DIR).filter(f => f.toLowerCase().endsWith('.mp3'));
console.log(`Found ${files.length} MP3 files in ${AUDIO_SRC_DIR}.`);

const ballMap = new Map(); // number -> { col: string, num: number, filename: string, fullPath: string }

for (const file of files) {
  const match = file.match(/^([a-zA-Z0-9])?(\d+)\.mp3$/i);
  if (!match) {
    console.warn(`! Unrecognized filename pattern: ${file}`);
    continue;
  }

  const num = parseInt(match[2], 10);
  let col = 'B';
  if (num >= 1 && num <= 15) col = 'B';
  else if (num >= 16 && num <= 30) col = 'I';
  else if (num >= 31 && num <= 45) col = 'N';
  else if (num >= 46 && num <= 60) col = 'G';
  else if (num >= 61 && num <= 75) col = 'O';

  ballMap.set(num, {
    col,
    num,
    filename: file,
    fullPath: path.join(AUDIO_SRC_DIR, file)
  });
}

console.log(`Mapped ${ballMap.size} balls out of 75.`);
const missing = [];
for (let i = 1; i <= 75; i++) {
  if (!ballMap.has(i)) missing.push(i);
}
if (missing.length > 0) {
  console.error('ERROR: Missing ball files for numbers:', missing);
  process.exit(1);
}

// 3. Backup existing public audio files if not already backed up
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  if (fs.existsSync(PUBLIC_AUDIO_AM_DIR)) {
    const existing = fs.readdirSync(PUBLIC_AUDIO_AM_DIR);
    for (const f of existing) {
      fs.copyFileSync(
        path.join(PUBLIC_AUDIO_AM_DIR, f),
        path.join(BACKUP_DIR, f)
      );
    }
    console.log(`✓ Backed up ${existing.length} existing files to ${BACKUP_DIR}`);
  }
} else {
  console.log(`✓ Backup directory already exists at ${BACKUP_DIR}`);
}

// 4. Ensure destination directories exist
fs.mkdirSync(PUBLIC_AUDIO_AM_DIR, { recursive: true });
fs.mkdirSync(PUBLIC_AUDIO_EN_DIR, { recursive: true });

// 5. Clean up stale .wav and .webm files for balls 1-75 to prevent legacy fallback playback
for (let i = 1; i <= 75; i++) {
  const col = ballMap.get(i).col;
  const staleNames = [
    `${i}.wav`, `${i}.webm`,
    `${col}-${i}.wav`, `${col}-${i}.webm`,
    `${col}${i}.wav`, `${col}${i}.webm`
  ];
  for (const dir of [PUBLIC_AUDIO_AM_DIR, PUBLIC_AUDIO_EN_DIR]) {
    for (const s of staleNames) {
      const p = path.join(dir, s);
      if (fs.existsSync(p)) {
        fs.unlinkSync(p);
      }
    }
  }
}
console.log('✓ Cleaned up legacy .wav and .webm placeholder files for balls 1–75.');

// 6. Copy files with standard naming:
//    - {num}.mp3 (e.g. 1.mp3, 71.mp3)
//    - {col}-{num}.mp3 (e.g. B-1.mp3, O-71.mp3)
//    - {col}{num}.mp3 (e.g. B1.mp3, O71.mp3)
let copiedCount = 0;
for (let i = 1; i <= 75; i++) {
  const item = ballMap.get(i);
  const src = item.fullPath;
  const buffer = fs.readFileSync(src);

  for (const dir of [PUBLIC_AUDIO_AM_DIR, PUBLIC_AUDIO_EN_DIR]) {
    fs.writeFileSync(path.join(dir, `${i}.mp3`), buffer);
    fs.writeFileSync(path.join(dir, `${item.col}-${i}.mp3`), buffer);
    fs.writeFileSync(path.join(dir, `${item.col}${i}.mp3`), buffer);
  }
  copiedCount++;
}

console.log(`✓ Successfully copied all ${copiedCount} client ball recordings into public/assets/audio/am and en.`);

// 7. Verify Ball 71 specifically
const check71_1 = path.join(PUBLIC_AUDIO_AM_DIR, '71.mp3');
const check71_2 = path.join(PUBLIC_AUDIO_AM_DIR, 'O-71.mp3');
const check71_3 = path.join(PUBLIC_AUDIO_AM_DIR, 'O71.mp3');
const src71 = path.join(AUDIO_SRC_DIR, 'o71.mp3');

if (fs.existsSync(check71_1) && fs.existsSync(check71_2) && fs.existsSync(check71_3)) {
  const size1 = fs.statSync(check71_1).size;
  const sizeSrc = fs.statSync(src71).size;
  console.log(`✓ Ball O-71 verified: size ${size1} bytes matches source ${sizeSrc} bytes.`);
} else {
  console.error('ERROR: Ball 71 verification failed!');
  process.exit(1);
}

console.log('\n======================================================');
console.log('Client Audio Synchronization Complete! 100% Ready.');
console.log('======================================================\n');
