// Resume downloader for PixelLab background jobs that already completed.
// Used when the main generation script crashed after submission but before
// the download step — re-downloading is free, re-submitting costs credits.
// Usage: PIXELLAB_TOKEN=<token> node tools/resume-portrait-download.js

const fs = require('fs');
const path = require('path');

const TOKEN = process.env.PIXELLAB_TOKEN;
if (!TOKEN) {
  console.error('Missing PIXELLAB_TOKEN env var');
  process.exit(1);
}

const BASE_URL = 'https://api.pixellab.ai/v2';
const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'portraits', 'annie', 'raw');

// Job IDs from the in-progress generation run (seeds 0, 42, 1337, 2024).
const JOBS = [
  { seed: 0,    jobId: '2db3bf0b-e65e-4feb-a704-2d2a68588cf4' },
  { seed: 42,   jobId: '6df77b11-06e1-40b4-951b-040ad6ec2194' },
  { seed: 1337, jobId: 'ae52e176-ab5b-4601-8686-62d7641d45cc' },
  { seed: 2024, jobId: 'aa8b3171-2a60-4610-8f61-ab93760636f0' },
];

async function fetchJob(jobId) {
  const res = await fetch(`${BASE_URL}/background-jobs/${jobId}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(body)}`);
  return body?.data ?? body;
}

async function saveOne({ seed, jobId }) {
  const data = await fetchJob(jobId);
  if (data.status !== 'completed') {
    throw new Error(`seed=${seed} job ${jobId} status=${data.status}, expected completed`);
  }
  const img = data.last_response?.images?.[0];
  if (!img) throw new Error(`seed=${seed} no image: ${JSON.stringify(data).slice(0, 300)}`);

  let buf;
  if (img.base64) {
    buf = Buffer.from(img.base64, 'base64');
  } else if (img.url) {
    const r = await fetch(img.url);
    if (!r.ok) throw new Error(`download seed=${seed} HTTP ${r.status}`);
    buf = Buffer.from(await r.arrayBuffer());
  } else {
    throw new Error(`seed=${seed} image has neither url nor base64`);
  }

  const outPath = path.join(OUTPUT_DIR, `annie-portrait-candidate-${seed}.png`);
  fs.writeFileSync(outPath, buf);
  console.log(`  seed=${seed} saved ${path.relative(process.cwd(), outPath)} (${buf.length} bytes)`);
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`Resuming download for ${JOBS.length} jobs...`);
  for (const j of JOBS) {
    await saveOne(j);
  }
  console.log('done.');
}

main().catch((err) => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
