// Fix the broken Annie north sprite by rotating north-east → north (45°).
// The original /create-character-pro generated a front-facing pose for the
// "north" slot — visible on inspection and confirmed by file size (10,170 B,
// matching south=10,177 B; correct back views are ~8 KB).
//
// Tries multiple seeds, saves each to north-fix-candidates/, lets the human
// pick the best.
//
// Usage: PIXELLAB_TOKEN=<token> node tools/rotate-annie-north.js

const fs = require('fs');
const path = require('path');

const TOKEN = process.env.PIXELLAB_TOKEN;
if (!TOKEN) {
  console.error('Missing PIXELLAB_TOKEN env var');
  process.exit(1);
}

const BASE_URL = 'https://api.pixellab.ai/v2';
const PROJECT_ROOT = path.join(__dirname, '..');
const SRC_PATH = path.join(PROJECT_ROOT, 'assets', 'sprites', 'characters', 'annie', 'raw', 'annie-overworld-north-east.png');
const OUT_DIR = path.join(PROJECT_ROOT, 'assets', 'sprites', 'characters', 'annie', 'raw', 'north-fix-candidates');

const SEEDS = [1337, 7, 42];
const FROM_DIR = 'north-east';
const TO_DIR = 'north';

function unwrap(b) { return b?.data ?? b ?? {}; }
const isLikelyBase64 = (s) => typeof s === 'string' && !/^https?:\/\//.test(s) && s.length > 200;

async function rotateOne(seed) {
  const fromBase64 = fs.readFileSync(SRC_PATH).toString('base64');
  // Note: /rotate does NOT accept the `view` field (HTTP 422 — extra_forbidden).
  // The view is implied by the from_image. Other endpoints take `view`; this one doesn't.
  const body = {
    image_size: { width: 184, height: 184 },
    from_image: { type: 'base64', base64: fromBase64, format: 'png' },
    from_direction: FROM_DIR,
    to_direction: TO_DIR,
    image_guidance_scale: 3.0,
    seed,
  };
  console.log(`\n[seed=${seed}] POST /rotate ${FROM_DIR} -> ${TO_DIR}...`);
  const res = await fetch(`${BASE_URL}/rotate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify(body),
  });
  const respBody = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`seed=${seed} HTTP ${res.status}: ${JSON.stringify(respBody).slice(0, 400)}`);
  }
  const data = unwrap(respBody);

  // Sync OR async — handle both shapes.
  let imgRef = data?.image?.base64 ?? data?.image?.url ?? data?.images?.[0]?.base64 ?? data?.images?.[0]?.url;
  if (!imgRef && data?.background_job_id) {
    console.log(`  async — polling job ${data.background_job_id}`);
    const start = Date.now();
    while (true) {
      const pr = await fetch(`${BASE_URL}/background-jobs/${data.background_job_id}`, {
        headers: { Authorization: `Bearer ${TOKEN}` },
      });
      const pb = await pr.json().catch(() => ({}));
      if (!pr.ok) throw new Error(`poll HTTP ${pr.status}: ${JSON.stringify(pb)}`);
      const pd = unwrap(pb);
      const elapsed = Math.round((Date.now() - start) / 1000);
      if (pd.status === 'completed') {
        console.log(`  completed in ${elapsed}s`);
        const last = pd.last_response;
        imgRef = last?.images?.[0]?.base64 ?? last?.images?.[0]?.url ?? last?.image?.base64 ?? last?.image?.url;
        break;
      }
      if (pd.status === 'failed') throw new Error(`seed=${seed} failed: ${JSON.stringify(pb.error ?? pd)}`);
      console.log(`  status=${pd.status} (${elapsed}s)`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  if (!imgRef) {
    throw new Error(`seed=${seed} no image in response: ${JSON.stringify(respBody).slice(0, 500)}`);
  }

  let buf;
  if (isLikelyBase64(imgRef)) {
    buf = Buffer.from(imgRef, 'base64');
  } else {
    const r = await fetch(imgRef);
    if (!r.ok) throw new Error(`seed=${seed} download HTTP ${r.status}`);
    buf = Buffer.from(await r.arrayBuffer());
  }
  const outPath = path.join(OUT_DIR, `annie-overworld-north-seed-${seed}.png`);
  fs.writeFileSync(outPath, buf);
  console.log(`  saved ${path.relative(PROJECT_ROOT, outPath)} (${buf.length} bytes)`);
  return { seed, path: outPath, bytes: buf.length };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log(`Source (${FROM_DIR}): ${path.relative(PROJECT_ROOT, SRC_PATH)} (${fs.statSync(SRC_PATH).size} bytes)`);
  console.log(`Trying seeds: ${SEEDS.join(', ')}`);
  const results = [];
  for (const seed of SEEDS) {
    try {
      results.push(await rotateOne(seed));
    } catch (err) {
      console.log(`  FAILED: ${err.message}`);
      results.push({ seed, error: err.message });
    }
  }
  console.log('\n=== Candidates ===');
  for (const r of results) {
    if (r.path) {
      const tag = r.bytes < 9000 ? '(likely back view)' : r.bytes > 9500 ? '(likely front view — broken)' : '(?)';
      console.log(`  seed=${r.seed} ${r.bytes} bytes ${tag}`);
    } else {
      console.log(`  seed=${r.seed} ERROR ${r.error}`);
    }
  }
}

main().catch((err) => { console.error('FATAL:', err.message); process.exit(1); });
