// One-shot downloader for the 8 rotation PNGs from a completed character.
// Reads the cached character JSON saved by generate-annie-overworld.js and
// downloads each rotation URL into raw/.
//
// Usage: PIXELLAB_TOKEN=<token> node tools/download-annie-rotations.js

const fs = require('fs');
const path = require('path');

const TOKEN = process.env.PIXELLAB_TOKEN;
if (!TOKEN) {
  console.error('Missing PIXELLAB_TOKEN env var');
  process.exit(1);
}

const PROJECT_ROOT = path.join(__dirname, '..');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'assets', 'sprites', 'characters', 'annie', 'raw');
const CHAR_JSON = path.join(OUTPUT_DIR, '_character-response.json');

const DIRECTIONS = [
  'south', 'south-east', 'east', 'north-east',
  'north', 'north-west', 'west', 'south-west',
];

async function main() {
  const charData = JSON.parse(fs.readFileSync(CHAR_JSON, 'utf8'));
  const urls = charData.rotation_urls;
  if (!urls) throw new Error('no rotation_urls in cached character JSON');
  console.log(`Character ${charData.id}, canvas ${charData.size.width}x${charData.size.height}`);

  for (const dir of DIRECTIONS) {
    const url = urls[dir];
    if (!url) {
      console.log(`  ${dir.padEnd(11)} MISSING url`);
      continue;
    }
    // Backblaze URLs reject the PixelLab Bearer token (HTTP 401) — fetch unauthenticated.
    const r = await fetch(url);
    if (!r.ok) {
      console.log(`  ${dir.padEnd(11)} HTTP ${r.status}`);
      continue;
    }
    const buf = Buffer.from(await r.arrayBuffer());
    const out = path.join(OUTPUT_DIR, `annie-overworld-${dir}.png`);
    fs.writeFileSync(out, buf);
    console.log(`  ${dir.padEnd(11)} ${path.relative(PROJECT_ROOT, out)} (${buf.length} bytes)`);
  }
}

main().catch((err) => { console.error('FATAL:', err.message); process.exit(1); });
