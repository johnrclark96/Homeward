// Finish Annie v2 animations — recovers from the aborted run.
//
// State when this script starts: 8 walking jobs from "round 1" are in flight
// (2 already completed: south, south-east). The earlier script wrongly
// re-submitted on a too-short stall timeout; this one does NOT re-submit
// while jobs are legitimately processing.
//
// Phase 1: WAIT (poll only, never resubmit) for walking to reach 8/8.
//          Animation jobs take 60-180s each; patience is the whole point.
// Phase 2: idle — submit missing directions one per call, track each job ID,
//          poll the JOB IDs (deterministic), resubmit only genuinely-failed.
// Phase 3: download every frame, verify 8/8 per template.
//
// Usage: PIXELLAB_TOKEN=<token> node tools/finish-annie-animations-v2.js

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

const unwrap = (b) => b?.data ?? b ?? {};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(p) {
  const res = await fetch(`${BASE_URL}${p}`, { headers: { Authorization: `Bearer ${TOKEN}` } });
  return { status: res.status, ok: res.ok, body: await res.json().catch(() => ({})) };
}
async function postJson(p, body) {
  const res = await fetch(`${BASE_URL}${p}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify(body),
  });
  return { status: res.status, ok: res.ok, body: await res.json().catch(() => ({})) };
}

async function presentDirections(type) {
  const r = await getJson(`/characters/${CHARACTER_ID}`);
  if (!r.ok) throw new Error(`GET character HTTP ${r.status}`);
  const anims = unwrap(r.body).animations ?? r.body.animations ?? [];
  const present = new Set();
  for (const a of anims) {
    if (a.animation_type !== type) continue;
    for (const d of a.directions ?? []) {
      if ((d.frames ?? []).length > 0) present.add(d.direction);
    }
  }
  return present;
}

async function jobStatus(jobId) {
  const r = await getJson(`/background-jobs/${jobId}`);
  return unwrap(r.body).status ?? 'unknown';
}

// PHASE 1 — wait for walking to finish. Jobs are already in flight; just poll.
async function waitWalking() {
  console.log('=== PHASE 1: waiting for walking 8/8 (no resubmits) ===');
  const start = Date.now();
  const HARD_CAP_S = 1500;          // 25 min
  for (;;) {
    const present = await presentDirections('walking');
    const elapsed = Math.round((Date.now() - start) / 1000);
    const missing = ALL_DIRS.filter((d) => !present.has(d));
    console.log(`  [+${elapsed}s] walking ${present.size}/8` + (missing.length ? ` (missing: ${missing.join(', ')})` : ''));
    if (missing.length === 0) { console.log('  walking complete.'); return; }
    if (elapsed > HARD_CAP_S) {
      console.log(`  WARNING: hard cap hit, walking still missing: ${missing.join(', ')}`);
      return;
    }
    await sleep(15000);
  }
}

// PHASE 2 — idle, with deterministic job-ID tracking.
async function doIdle() {
  console.log('\n=== PHASE 2: breathing-idle ===');
  const present = await presentDirections('breathing-idle');
  let missing = ALL_DIRS.filter((d) => !present.has(d));
  if (present.size) console.log(`  already present: ${[...present].join(', ')}`);

  for (let round = 1; round <= 3 && missing.length; round++) {
    console.log(`  round ${round}: submitting ${missing.join(', ')}`);
    const jobByDir = {};
    for (const d of missing) {
      let ids = null;
      for (let attempt = 1; attempt <= 10 && !ids; attempt++) {
        const r = await postJson('/characters/animations', {
          character_id: CHARACTER_ID,
          template_animation_id: 'breathing-idle',
          mode: 'template',
          directions: [d],
        });
        if (r.ok) {
          ids = r.body.background_job_ids ?? unwrap(r.body).background_job_ids ?? [];
        } else if (r.status === 429) {
          console.log(`    [idle/${d}] 429 slot-full, wait 25s (attempt ${attempt})`);
          await sleep(25000);
        } else {
          throw new Error(`[idle/${d}] HTTP ${r.status}: ${JSON.stringify(r.body).slice(0, 200)}`);
        }
      }
      if (!ids || !ids.length) throw new Error(`[idle/${d}] could not submit after retries`);
      jobByDir[d] = ids[0];
      console.log(`    [idle/${d}] job ${ids[0]}`);
    }

    // Poll the submitted job IDs — deterministic, not a guess.
    console.log('  polling idle jobs...');
    const start = Date.now();
    const pending = new Set(Object.keys(jobByDir));
    const failed = [];
    while (pending.size) {
      await sleep(12000);
      for (const d of [...pending]) {
        const st = await jobStatus(jobByDir[d]);
        if (st === 'completed') { pending.delete(d); }
        else if (st === 'failed') { pending.delete(d); failed.push(d); }
      }
      const elapsed = Math.round((Date.now() - start) / 1000);
      console.log(`    [+${elapsed}s] idle pending: ${[...pending].join(', ') || '(none)'}`);
      if (elapsed > 1500) { console.log('    idle poll hard cap hit'); break; }
    }
    // Re-check the character record for ground truth.
    const nowPresent = await presentDirections('breathing-idle');
    missing = ALL_DIRS.filter((d) => !nowPresent.has(d));
    if (failed.length) console.log(`  failed jobs: ${failed.join(', ')}`);
    if (missing.length) console.log(`  still missing after round ${round}: ${missing.join(', ')}`);
  }
  if (missing.length) console.log(`  WARNING: idle still missing: ${missing.join(', ')}`);
  else console.log('  breathing-idle complete.');
}

// PHASE 3 — download all frames.
async function downloadAll() {
  console.log('\n=== PHASE 3: downloading frames ===');
  const r = await getJson(`/characters/${CHARACTER_ID}`);
  const char = unwrap(r.body).animations ? unwrap(r.body) : r.body;
  fs.writeFileSync(path.join(OUT_DIR, '_character-with-animations.json'), JSON.stringify(char, null, 2));

  // For each (type, direction) keep the first entry that actually has frames.
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
  for (const type of ['walking', 'breathing-idle']) {
    const dirs = new Set(summary.filter((s) => s.type === type).map((s) => s.direction));
    const missing = ALL_DIRS.filter((d) => !dirs.has(d));
    console.log(`  ${type}: ${dirs.size}/8` + (missing.length ? ` — MISSING ${missing.join(', ')}` : ' — COMPLETE'));
  }
  console.log(`  total frames: ${summary.reduce((s, x) => s + x.frames, 0)}`);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  await waitWalking();
  await doIdle();
  await downloadAll();
  console.log('\nDone.');
}

main().catch((e) => { console.error('\nFATAL:', e.message); process.exit(1); });
