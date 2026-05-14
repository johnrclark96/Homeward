// Wait for Annie's walk + idle to fully populate, then download every frame.
// Each animation has up to 7 directions (north skipped); each direction has
// 4-6 frames. Saves to assets/sprites/characters/annie/raw/<anim>/<dir>/<frame>.png
//
// Usage: PIXELLAB_TOKEN=<token> node tools/download-annie-animations.js

const fs = require('fs');
const path = require('path');

const TOKEN = process.env.PIXELLAB_TOKEN;
if (!TOKEN) { console.error('Missing PIXELLAB_TOKEN'); process.exit(1); }

const CHARACTER_ID = 'e7ac9162-76d6-4fce-8a9e-cfbaf35f046c';
const PROJECT_ROOT = path.join(__dirname, '..');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'assets', 'sprites', 'characters', 'annie', 'raw');
const EXPECTED_DIR_COUNT = 7; // 7 directions per animation (north skipped)
const POLL_S = 15;
const STABILITY_POLLS = 2;
const MAX_WAIT_S = 600;

async function fetchCharacter() {
  const r = await fetch(`https://api.pixellab.ai/v2/characters/${CHARACTER_ID}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  if (!r.ok) throw new Error(`fetch HTTP ${r.status}`);
  return r.json();
}

function summarize(char) {
  // SUM directions across all entries of a given animation_type. Each
  // POST /characters/animations creates a new animation_group_id (a new
  // entry), so retries / split submissions produce multiple entries with
  // the same animation_type. Overwriting by type would underreport.
  const out = {};
  for (const a of char.animations ?? []) {
    out[a.animation_type] = (out[a.animation_type] ?? 0) + (a.directions?.length ?? 0);
  }
  return out;
}

async function waitForCompletion() {
  const start = Date.now();
  let stableFor = 0;
  let lastSig = '';
  while (true) {
    const char = await fetchCharacter();
    const sum = summarize(char);
    const elapsed = Math.round((Date.now() - start) / 1000);
    const sig = JSON.stringify(sum);
    const total = Object.values(sum).reduce((a, b) => a + b, 0);
    console.log(`[+${elapsed}s] ${sig} (total dirs: ${total})`);

    const allFull = Object.values(sum).every((v) => v >= EXPECTED_DIR_COUNT) && Object.keys(sum).length >= 2;
    if (allFull) {
      console.log('All directions populated.');
      return char;
    }
    if (sig === lastSig) {
      stableFor++;
      if (stableFor >= STABILITY_POLLS && total > 0) {
        console.log(`Counts stable at ${sig} for ${stableFor} polls — proceeding with what we have.`);
        return char;
      }
    } else {
      stableFor = 0;
      lastSig = sig;
    }
    if (elapsed > MAX_WAIT_S) {
      console.log(`Max wait (${MAX_WAIT_S}s) exceeded.`);
      return char;
    }
    await new Promise((r) => setTimeout(r, POLL_S * 1000));
  }
}

async function downloadFrames(char) {
  const summary = [];
  for (const anim of char.animations ?? []) {
    const animLabel = anim.animation_type;
    for (const d of anim.directions ?? []) {
      const dirLabel = d.direction;
      const dir = path.join(OUTPUT_DIR, animLabel, dirLabel);
      fs.mkdirSync(dir, { recursive: true });
      let saved = 0;
      for (let i = 0; i < (d.frames ?? []).length; i++) {
        const url = d.frames[i];
        const r = await fetch(url);
        if (!r.ok) {
          console.log(`  [${animLabel}/${dirLabel}/${i}] HTTP ${r.status}`);
          continue;
        }
        const buf = Buffer.from(await r.arrayBuffer());
        const out = path.join(dir, `${i}.png`);
        fs.writeFileSync(out, buf);
        saved++;
      }
      console.log(`  [${animLabel}/${dirLabel}] ${saved} frames -> ${path.relative(PROJECT_ROOT, dir)}/`);
      summary.push({ animation: animLabel, direction: dirLabel, frame_count: d.frame_count, saved });
    }
  }
  return summary;
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log('Waiting for animations to complete...');
  const char = await waitForCompletion();

  // Save the full character JSON for reference.
  const debugPath = path.join(OUTPUT_DIR, '_character-with-animations.json');
  fs.writeFileSync(debugPath, JSON.stringify(char, null, 2));
  console.log(`\nSaved character JSON: ${path.relative(PROJECT_ROOT, debugPath)}`);

  console.log('\nDownloading frames...');
  const summary = await downloadFrames(char);

  console.log('\n=== Summary ===');
  for (const s of summary) {
    console.log(`  ${s.animation.padEnd(15)} ${s.direction.padEnd(11)} ${s.saved}/${s.frame_count} frames`);
  }
  const totalFrames = summary.reduce((a, b) => a + b.saved, 0);
  console.log(`\nTotal frames downloaded: ${totalFrames}`);
}

main().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });
