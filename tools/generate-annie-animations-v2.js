// Annie animations v2 — walk + breathing-idle for ALL 8 directions, on the
// repaired character_id (ad0fdc16, generated via method=rotate_character so
// north is a true back view).
//
// Robustness lessons baked in from the v1 run:
//  - response field is `background_job_ids` (plural array)
//  - each POST creates a NEW animation_group; the same animation_type can
//    appear in multiple entries — sum directions across all of them
//  - 7-direction batch submissions silently dropped directions; submit
//    one direction per call instead
//  - concurrent slot limit ~14; 8 single-direction jobs per template is safe
//  - submit walking fully, wait, THEN idle (don't overlap and exhaust slots)
//  - Backblaze frame URLs: plain fetch(), no auth header
//
// Usage: PIXELLAB_TOKEN=<token> node tools/generate-annie-animations-v2.js

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
const ANIMATIONS = [
  { type: 'walking' },
  { type: 'breathing-idle' },
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

// Submit ONE direction for a template. Retry on 429 (slot exhaustion).
async function submitDirection(type, direction) {
  for (let attempt = 1; ; attempt++) {
    const r = await postJson('/characters/animations', {
      character_id: CHARACTER_ID,
      template_animation_id: type,
      mode: 'template',
      directions: [direction],
    });
    if (r.ok) {
      const ids = r.body.background_job_ids ?? unwrap(r.body).background_job_ids ?? [];
      return ids;
    }
    if (r.status === 429 && attempt <= 8) {
      console.log(`    [${type}/${direction}] 429 slot-full, waiting 20s (attempt ${attempt})`);
      await sleep(20000);
      continue;
    }
    throw new Error(`[${type}/${direction}] HTTP ${r.status}: ${JSON.stringify(r.body).slice(0, 300)}`);
  }
}

// Directions that have completed frames for a given template (summed across all entries).
async function presentDirections(type) {
  const r = await getJson(`/characters/${CHARACTER_ID}`);
  if (!r.ok) throw new Error(`GET character HTTP ${r.status}`);
  const anims = (unwrap(r.body).animations ?? r.body.animations ?? []);
  const present = new Set();
  for (const a of anims) {
    if (a.animation_type !== type) continue;
    for (const d of a.directions ?? []) {
      if ((d.frames ?? []).length > 0) present.add(d.direction);
    }
  }
  return present;
}

// Submit every wanted direction, then poll until all are present. Retry missing once.
async function ensureTemplate(type, wantDirs) {
  console.log(`\n=== ${type}: ensuring ${wantDirs.length} directions ===`);
  const already = await presentDirections(type);
  let toSubmit = wantDirs.filter((d) => !already.has(d));
  if (already.size) console.log(`  already present: ${[...already].join(', ') || '(none)'}`);

  for (let round = 1; round <= 3 && toSubmit.length; round++) {
    console.log(`  round ${round}: submitting ${toSubmit.join(', ')}`);
    for (const d of toSubmit) {
      const ids = await submitDirection(type, d);
      console.log(`    [${type}/${d}] job ${ids.join(',') || '(no id returned)'}`);
    }
    // Poll until presence covers everything we want, or it stalls.
    const start = Date.now();
    let lastCount = -1, stable = 0;
    for (;;) {
      const present = await presentDirections(type);
      const missing = wantDirs.filter((d) => !present.has(d));
      const elapsed = Math.round((Date.now() - start) / 1000);
      console.log(`    [+${elapsed}s] present ${present.size}/${wantDirs.length}` +
                  (missing.length ? ` (missing: ${missing.join(', ')})` : ''));
      if (missing.length === 0) { console.log(`  ${type}: all directions present.`); return; }
      if (present.size === lastCount) {
        if (++stable >= 4 && elapsed > 60) { toSubmit = missing; break; } // stalled — retry missing
      } else { stable = 0; lastCount = present.size; }
      if (elapsed > 480) { toSubmit = missing; break; }
      await sleep(10000);
    }
  }
  if (toSubmit.length) {
    console.log(`  WARNING: ${type} still missing after retries: ${toSubmit.join(', ')}`);
  }
}

async function downloadAll() {
  console.log('\n=== Downloading all animation frames ===');
  const r = await getJson(`/characters/${CHARACTER_ID}`);
  const char = unwrap(r.body).animations ? unwrap(r.body) : r.body;
  fs.writeFileSync(path.join(OUT_DIR, '_character-with-animations.json'), JSON.stringify(char, null, 2));

  const summary = [];
  for (const a of char.animations ?? []) {
    for (const d of a.directions ?? []) {
      const dir = path.join(OUT_DIR, a.animation_type, d.direction);
      fs.mkdirSync(dir, { recursive: true });
      let saved = 0;
      for (let i = 0; i < (d.frames ?? []).length; i++) {
        const res = await fetch(d.frames[i]); // Backblaze: plain fetch
        if (!res.ok) { console.log(`  ${a.animation_type}/${d.direction}/${i} HTTP ${res.status}`); continue; }
        fs.writeFileSync(path.join(dir, `${i}.png`), Buffer.from(await res.arrayBuffer()));
        saved++;
      }
      console.log(`  ${a.animation_type.padEnd(15)} ${d.direction.padEnd(11)} ${saved} frames`);
      summary.push({ type: a.animation_type, direction: d.direction, frames: saved });
    }
  }
  const total = summary.reduce((s, x) => s + x.frames, 0);
  console.log(`\nTotal frames: ${total}`);
  // Sanity: each template should have all 8 directions.
  for (const { type } of ANIMATIONS) {
    const dirs = new Set(summary.filter((s) => s.type === type).map((s) => s.direction));
    const missing = ALL_DIRS.filter((d) => !dirs.has(d));
    console.log(`  ${type}: ${dirs.size}/8 directions` + (missing.length ? ` — MISSING ${missing.join(', ')}` : ' — complete'));
  }
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  // Sequential: finish walking (8 slots) before starting idle (8 slots) — stays under the ~14 limit.
  for (const { type } of ANIMATIONS) {
    await ensureTemplate(type, ALL_DIRS);
  }
  await downloadAll();
  console.log('\nDone.');
}

main().catch((e) => { console.error('\nFATAL:', e.message); process.exit(1); });
