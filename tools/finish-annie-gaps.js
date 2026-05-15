// Fill the 2 genuinely-failed animation directions on character ad0fdc16,
// then download the full 16-direction set.
//
// State: ad0fdc16 has walking 7/8 (missing south-west) and breathing-idle
// 7/8 (missing west). Both gap jobs previously came back status=failed.
// These are ordinary side directions — unrelated to the north problem —
// they just errored during the earlier messy submission storm.
//
// Correct-usage notes applied here:
//  - one POST per animation type, directions list = exactly the gap(s) needed
//  - response is `background_job_ids` (plural array)
//  - poll the JOB IDs (deterministic), never resubmit while still processing
//  - retry a direction only if its job genuinely fails
//
// Usage: PIXELLAB_TOKEN=<token> node tools/finish-annie-gaps.js

const fs = require('fs');
const path = require('path');

const TOKEN = process.env.PIXELLAB_TOKEN;
if (!TOKEN) { console.error('Missing PIXELLAB_TOKEN'); process.exit(1); }

const BASE_URL = 'https://api.pixellab.ai/v2';
const PROJECT_ROOT = path.join(__dirname, '..');
const CHARACTER_ID = 'ad0fdc16-a374-4252-9209-c0750971c916';
const OUT_DIR = path.join(PROJECT_ROOT, 'assets', 'sprites', 'characters', 'annie', 'raw', 'rotate-v2');

const ALL_DIRS = ['south', 'south-east', 'east', 'north-east',
                  'north', 'north-west', 'west', 'south-west'];
// The genuine gaps (one per animation type).
const GAPS = [
  { type: 'walking', direction: 'south-west' },
  { type: 'breathing-idle', direction: 'west' },
];

const unwrap = (b) => b?.data ?? b ?? {};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function postJson(p, body) {
  const res = await fetch(`${BASE_URL}${p}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify(body),
  });
  return { status: res.status, ok: res.ok, body: await res.json().catch(() => ({})) };
}
async function getJson(p) {
  const res = await fetch(`${BASE_URL}${p}`, { headers: { Authorization: `Bearer ${TOKEN}` } });
  return { status: res.status, ok: res.ok, body: await res.json().catch(() => ({})) };
}

// Submit one animation type for exactly the directions in `dirs`.
async function submitGap(type, dirs) {
  for (let attempt = 1; ; attempt++) {
    const r = await postJson('/characters/animations', {
      character_id: CHARACTER_ID,
      template_animation_id: type,
      mode: 'template',
      directions: dirs,
    });
    if (r.ok) {
      const ids = r.body.background_job_ids ?? unwrap(r.body).background_job_ids ?? [];
      console.log(`  [${type}] submitted ${dirs.join(',')} -> job(s) ${ids.join(', ')}`);
      return ids;
    }
    if (r.status === 429 && attempt <= 6) {
      console.log(`  [${type}] 429 slot-full, wait 25s (attempt ${attempt})`);
      await sleep(25000);
      continue;
    }
    throw new Error(`[${type}] HTTP ${r.status}: ${JSON.stringify(r.body).slice(0, 300)}`);
  }
}

async function jobStatus(jobId) {
  const r = await getJson(`/background-jobs/${jobId}`);
  return unwrap(r.body).status ?? 'unknown';
}

// Submit a gap and poll its job to completion; retry once on failure.
async function fillGap(gap) {
  console.log(`\n=== ${gap.type} / ${gap.direction} ===`);
  for (let round = 1; round <= 2; round++) {
    const ids = await submitGap(gap.type, [gap.direction]);
    if (!ids.length) throw new Error(`no job id returned for ${gap.type}/${gap.direction}`);
    const jobId = ids[0];
    const start = Date.now();
    for (;;) {
      await sleep(10000);
      const st = await jobStatus(jobId);
      const elapsed = Math.round((Date.now() - start) / 1000);
      if (st === 'completed') { console.log(`  completed in ${elapsed}s`); return true; }
      if (st === 'failed') {
        console.log(`  job FAILED (round ${round})`);
        break; // retry in next round
      }
      console.log(`  status=${st} (${elapsed}s)`);
      if (elapsed > 600) { console.log('  poll cap hit'); break; }
    }
  }
  console.log(`  WARNING: ${gap.type}/${gap.direction} still failing after retry`);
  return false;
}

async function downloadAll() {
  console.log('\n=== Downloading all frames from ad0fdc16 ===');
  const r = await getJson(`/characters/${CHARACTER_ID}`);
  const char = unwrap(r.body).animations ? unwrap(r.body) : r.body;
  fs.writeFileSync(path.join(OUT_DIR, '_character-with-animations.json'), JSON.stringify(char, null, 2));

  const seen = new Set();
  const summary = [];
  for (const a of char.animations ?? []) {
    for (const d of a.directions ?? []) {
      const key = `${a.animation_type}/${d.direction}`;
      if (seen.has(key) || !(d.frames ?? []).length) continue;
      seen.add(key);
      const dir = path.join(OUT_DIR, a.animation_type, d.direction);
      fs.mkdirSync(dir, { recursive: true });
      let saved = 0;
      for (let i = 0; i < d.frames.length; i++) {
        const res = await fetch(d.frames[i]);
        if (!res.ok) { console.log(`  ${key}/${i} HTTP ${res.status}`); continue; }
        fs.writeFileSync(path.join(dir, `${i}.png`), Buffer.from(await res.arrayBuffer()));
        saved++;
      }
      console.log(`  ${a.animation_type.padEnd(15)} ${d.direction.padEnd(11)} ${saved} frames`);
      summary.push({ type: a.animation_type, direction: d.direction, frames: saved });
    }
  }
  console.log('\n=== VERIFY ===');
  let allComplete = true;
  for (const type of ['walking', 'breathing-idle']) {
    const dirs = new Set(summary.filter((s) => s.type === type).map((s) => s.direction));
    const missing = ALL_DIRS.filter((d) => !dirs.has(d));
    if (missing.length) allComplete = false;
    console.log(`  ${type}: ${dirs.size}/8` + (missing.length ? ` — MISSING ${missing.join(', ')}` : ' — COMPLETE'));
  }
  console.log(`  total frames: ${summary.reduce((s, x) => s + x.frames, 0)}`);
  return allComplete;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const gap of GAPS) {
    await fillGap(gap);
  }
  const complete = await downloadAll();
  console.log(complete ? '\nDone — full 16-direction set present.' : '\nDone — but set still incomplete (see above).');
}

main().catch((e) => { console.error('\nFATAL:', e.message); process.exit(1); });
