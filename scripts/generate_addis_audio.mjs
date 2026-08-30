import fs from 'fs';
import path from 'path';
import https from 'https';
import crypto from 'crypto';
import { addisAiBallPrompts, addisAiEventPrompts } from '../src/services/addisAiPrompts.ts';

const API_KEY = 'sk_f95bbb06-51ef-4f05-aa0f-717c1319158a_a7440c32d2fd229d00914b33ecdcdfde64bf15f4c5c824274dcd5f2c5da4ae60';
const VOICE_ID = 'am-simon'; // Simon - Male Voice

function httpsPost(urlStr, data) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const postData = JSON.stringify(data);

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      timeout: 30000,
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'BetikaBingo/1.0'
      }
    };

    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const body = Buffer.concat(chunks);
        resolve({
          status: res.statusCode,
          statusText: res.statusMessage,
          body
        });
      });
    });

    req.on('timeout', () => req.destroy(new Error('HTTPS Request Timeout after 30s')));
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function generateAllVoices() {
  console.log(`\n======================================================`);
  console.log(`Starting Batch Audio Generation with Simon ("${VOICE_ID}")`);
  console.log(`======================================================\n`);

  const publicDir = path.resolve('public/assets/audio/am');
  const assetsDir = path.resolve('assets/audio/am');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

  const allItems = [
    ...addisAiEventPrompts.map(p => ({ file: p.file, script: p.amharicScript, label: p.englishLabel })),
    ...addisAiBallPrompts.map(p => ({ file: p.file, script: p.amharicScript, label: `${p.col}-${p.num}` }))
  ];

  let completed = 0;
  let failed = 0;

  for (let i = 0; i < allItems.length; i++) {
    const item = allItems[i];
    const targetPath = path.join(publicDir, item.file);

    console.log(`[${i + 1}/${allItems.length}] Generating ${item.file} (${item.label}: "${item.script}")...`);

    try {
      const requestId = crypto.randomUUID();
      const res = await httpsPost('https://api.addisassistant.com/api/v1/voice/generations', {
        client_request_id: requestId,
        voice_id: VOICE_ID,
        text: item.script,
        language: 'am'
      });

      if (res.status === 201 || res.status === 200) {
        const resJson = JSON.parse(res.body.toString('utf8'));
        if (resJson.data?.audio) {
          const base64Data = resJson.data.audio.replace(/^data:audio\/\w+;base64,/, '');
          const audioBuffer = Buffer.from(base64Data, 'base64');

          fs.writeFileSync(targetPath, audioBuffer);
          fs.writeFileSync(path.join(assetsDir, item.file), audioBuffer);

          console.log(`  ✓ Saved ${item.file} (${audioBuffer.length} bytes, duration: ${resJson.data.duration_seconds}s)`);
          completed++;
        } else {
          console.log(`  ✗ No audio returned for ${item.file}:`, resJson);
          failed++;
        }
      } else {
        console.log(`  ✗ Failed with status ${res.status}: ${res.body.toString('utf8')}`);
        failed++;
      }
    } catch (e) {
      console.log(`  ✗ Error on ${item.file}:`, e.message);
      failed++;
    }

    // Friendly 250ms rate limit gap
    await new Promise(r => setTimeout(r, 250));
  }

  console.log(`\n======================================================`);
  console.log(`🎉 BATCH GENERATION FINISHED!`);
  console.log(`- Completed: ${completed}`);
  console.log(`- Failed: ${failed}`);
  console.log(`- Saved directory: ${publicDir}`);
  console.log(`======================================================\n`);
}

generateAllVoices();
