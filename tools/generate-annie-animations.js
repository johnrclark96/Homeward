// Annie animations — walk + breathing-idle templates for 7 directions.
// Skips "north" because the server-side north rotation is the broken
// front-facing one (we fixed our local north.png via /rotate, but the
// PixelLab character record still has the broken rotation, so animation
// frames generated for "north" would also face the wrong way). The north
// walk/idle frames will be reconstructed in Aseprite using the corrected
// static north sprite + neighbor frames as motion reference.
//
// Usage: PIXELLAB_TOKEN=<token> node tools/generate-annie-animations.js

const fs = require('fs');
const path = require('path');

const TOKEN = process.env.PIXELLAB_TOKEN;
if (!TOKEN) { console.error('Missing PIXELLAB_TOKEN'); process.exit(1); }

const BASE_URL = 'https://api.pixellab.ai/v2';
const PROJECT_ROOT = path.join(__dirname, '..');
const CHARACTER_ID = 'e7ac9162-76d6-4fce-8a9e-cfbaf35f046c';
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'assets', 'sprites', 'characters', 'annie', 'raw');
const STATE_FILE = path.join(PROJECT_ROOT, 'tools', '.annie-animations-state.json');
const ZIP_PATH = path.join(OUTPUT_DIR, 'annie-overworld-full.zip');

// 7 directions — north is excluded; the broken server-side rotation would
// produce front-facing walk frames there.
const DIRECTIONS = [
  'south', 'south-east', 'east', 'north-east',
  'north-west', 'west', 'south-west',
];

const ANIMATIONS = [
  { name: 'walk',  template_animation_id: 'walking' },
  { name: 'idle',  template_animation_id: 'breathing-idle' },
];

const unwrap = (b) => b?.data ?? b ?? {};

async function postJson(pathPart, body) {
  const res = await fetch(`${BASE_URL}${pathPart}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify(body),
  });
  const respBody = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, body: respBody };
}

async function getJson(pathPart) {
  const res = await fetch(`${BASE_URL}${pathPart}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  const respBody = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, body: respBody };
}

async function queueAnimation(anim) {
  const body = {
    character_id: CHARACTER_ID,
    template_animation_id: anim.template_animation_id,
    mode: 'template',
    directions: DIRECTIONS,
  };
  console.log(`\n[${anim.name}] POST /characters/animations  template=${anim.template_animation_id}  dirs=${DIRECTIONS.length}`);
  const r = await postJson('/characters/animations', body);
  if (!r.ok) throw new Error(`[${anim.name}] HTTP ${r.status}: ${JSON.stringify(r.body).slice(0, 400)}`);
  const data = unwrap(r.body);
  console.log(`  response keys: top=${Object.keys(r.body).join(',')} | data=${Object.keys(data).join(',')}`);
  console.log(`  full response: ${JSON.stringify(r.body).slice(0, 800)}`);
  const jobId = data.background_job_id ?? data.job_id ?? r.body.background_job_id ?? r.body.job_id;
  const animationId = data.animation_id ?? data.id ?? r.body.animation_id ?? r.body.id;
  return { ...anim, jobId, animationId };
}

async function pollJob(label, jobId) {
  const start = Date.now();
  for (;;) {
    const r = await getJson(`/background-jobs/${jobId}`);
    if (!r.ok) throw new Error(`[${label}] poll HTTP ${r.status}: ${JSON.stringify(r.body)}`);
    const data = unwrap(r.body);
    const elapsed = Math.round((Date.now() - start) / 1000);
    if (data.status === 'completed') {
      console.log(`  [${label}] completed in ${elapsed}s`);
      return data;
    }
    if (data.status === 'failed') {
      throw new Error(`[${label}] failed: ${JSON.stringify(r.body.error ?? data)}`);
    }
    console.log(`  [${label}] status=${data.status} (${elapsed}s)`);
    await new Promise((res) => setTimeout(res, 5000));
  }
}

async function downloadZip() {
  console.log(`\nDownloading character ZIP GET /characters/${CHARACTER_ID}/zip ...`);
  const res = await fetch(`${BASE_URL}/characters/${CHARACTER_ID}/zip`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  if (res.status === 423) {
    const txt = await res.text().catch(() => '');
    throw new Error(`HTTP 423 — character/animations still rendering: ${txt.slice(0, 200)}`);
  }
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${txt.slice(0, 400)}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 1024) {
    throw new Error(`ZIP suspiciously small (${buf.length} bytes); likely a JSON error body. First 200B: ${buf.slice(0, 200).toString()}`);
  }
  fs.writeFileSync(ZIP_PATH, buf);
  console.log(`  saved ${path.relative(PROJECT_ROOT, ZIP_PATH)} (${buf.length} bytes)`);
  return ZIP_PATH;
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  let queued;
  if (fs.existsSync(STATE_FILE)) {
    queued = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    console.log(`Resuming from state file. Jobs: ${queued.map((q) => `${q.name}=${q.jobId}`).join(', ')}`);
  } else {
    console.log('Queuing walk + idle in parallel...');
    queued = await Promise.all(ANIMATIONS.map(queueAnimation));
    fs.writeFileSync(STATE_FILE, JSON.stringify(queued, null, 2));
    console.log(`State saved to ${path.relative(PROJECT_ROOT, STATE_FILE)}`);
  }

  console.log('\nPolling both jobs to completion...');
  await Promise.all(queued.map((q) => pollJob(q.name, q.jobId)));

  await downloadZip();

  console.log('\nDone. Next: unzip and inspect frames.');
}

main().catch((err) => { console.error('\nFATAL:', err.message); process.exit(1); });
