const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('ffmpeg-static');

console.log('Using ffmpeg binary:', ffmpeg);

const folders = ['am', 'en'];

for (const folder of folders) {
  const dir = path.join(__dirname, '..', 'public', 'assets', 'audio', folder);
  if (!fs.existsSync(dir)) continue;

  console.log(`\n=== Processing folder: ${folder} ===`);

  for (let i = 1; i <= 15; i++) {
    const webmFile = path.join(dir, `${i}.webm`);
    const mp3File = path.join(dir, `${i}.mp3`);
    const wavFile = path.join(dir, `${i}.wav`);

    const colWebm = path.join(dir, `B-${i}.webm`);
    const colMp3 = path.join(dir, `B-${i}.mp3`);
    const colWav = path.join(dir, `B-${i}.wav`);

    if (fs.existsSync(webmFile)) {
      // Convert to MP3 (128kbps, universal mobile support)
      execSync(`"${ffmpeg}" -y -i "${webmFile}" -c:a libmp3lame -b:a 128k -ar 44100 "${mp3File}"`, { stdio: 'ignore' });
      // Convert to WAV (PCM 16-bit, 0ms latency)
      execSync(`"${ffmpeg}" -y -i "${webmFile}" -c:a pcm_s16le -ar 44100 "${wavFile}"`, { stdio: 'ignore' });

      // Duplicate to B-i format as well
      fs.copyFileSync(mp3File, colMp3);
      fs.copyFileSync(wavFile, colWav);

      console.log(`✓ Converted Ball ${i}: MP3 (${fs.statSync(mp3File).size}b) | WAV (${fs.statSync(wavFile).size}b)`);
    }
  }
}

console.log('\nAll 15 voice files converted to MP3 and WAV successfully!');
