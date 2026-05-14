// Annie overworld sprite — 8-direction rotation derived from the approved
// portrait anchor. Costs ~20-40 generations (Pro endpoint).
//
// Usage: PIXELLAB_TOKEN=<token> node tools/generate-annie-overworld.js
//
// On submit, writes character_id + background_job_id to a state file so the
// download step can resume without re-spending credits if anything crashes.

const fs = require('fs');
const path = require('path');

const TOKEN = process.env.PIXELLAB_TOKEN;
if (!TOKEN) {
  console.error('Missing PIXELLAB_TOKEN env var');
  process.exit(1);
}

const BASE_URL = 'https://api.pixellab.ai/v2';
const PROJECT_ROOT = path.join(__dirname, '..');
const PORTRAIT_PATH = path.join(PROJECT_ROOT, 'assets', 'portraits', 'annie', 'annie-neutral.png');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'assets', 'sprites', 'characters', 'annie', 'raw');
const STATE_FILE = path.join(PROJECT_ROOT, 'tools', '.annie-overworld-state.json');

const DIRECTIONS = [
  'south', 'south-east', 'east', 'north-east',
  'north', 'north-west', 'west', 'south-west',
];

const DESCRIPTION = [
  'chibi girl with long warm honey-brown wavy hair past shoulders',
  'NOT bright yellow, NOT anime yellow, warm brown undertones with subtle golden highlights',
  'red sweater, dark pants, small boots',
  'top-down RPG sprite, low top-down view',
  'transparent background',
  'warm cozy pixel art, soft warm-brown contextual outlines',
  'no pure black, no pure white',
].join(', ');

function unwrap(body) {
  return body?.data ?? body ?? {};
}

async function submitJob() {
  const portraitBase64 = fs.readFileSync(PORTRAIT_PATH).toString('base64');
  console.log(`Read portrait: ${path.relative(PROJECT_ROOT, PORTRAIT_PATH)} (${portraitBase64.length} base64 chars)`);

  const requestBody = {
    description: DESCRIPTION,
    image_size: { width: 64, height: 96 },
    method: 'create_with_style',
    reference_image: {
      type: 'base64',
      base64: portraitBase64,
      format: 'png',
    },
    view: 'low top-down',
    template_id: 'mannequin',
    no_background: true,
    seed: 1337,
  };

  console.log('\nSubmitting POST /create-character-pro...');
  const res = await fetch(`${BASE_URL}/create-character-pro`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify(requestBody),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`submit HTTP ${res.status}: ${JSON.stringify(body)}`);
  }
  const data = unwrap(body);
  const characterId = data.character_id;
  const jobId = data.background_job_id;
  if (!characterId || !jobId) {
    throw new Error(`submit response missing character_id or background_job_id: ${JSON.stringify(body)}`);
  }
  const usage = body.usage ?? data.usage;
  console.log(`  character_id     = ${characterId}`);
  console.log(`  background_job_id = ${jobId}`);
  console.log(`  usage            = ${JSON.stringify(usage)}`);

  fs.writeFileSync(STATE_FILE, JSON.stringify({ characterId, jobId, usage, submittedAt: new Date().toISOString() }, null, 2));
  console.log(`  state saved to ${path.relative(PROJECT_ROOT, STATE_FILE)}`);

  return { characterId, jobId };
}

async function pollJob(jobId) {
  const start = Date.now();
  console.log('\nPolling background job...');
  for (;;) {
    const res = await fetch(`${BASE_URL}/background-jobs/${jobId}`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(`poll HTTP ${res.status}: ${JSON.stringify(body)}`);
    }
    const data = unwrap(body);
    const status = data.status;
    const elapsed = Math.round((Date.now() - start) / 1000);
    if (status === 'completed') {
      console.log(`  completed in ${elapsed}s`);
      return data;
    }
    if (status === 'failed') {
      throw new Error(`job failed: ${JSON.stringify(body.error ?? data)}`);
    }
    console.log(`  status=${status} (${elapsed}s)`);
    await new Promise((r) => setTimeout(r, 5000));
  }
}

async function fetchCharacter(characterId) {
  console.log(`\nFetching character details GET /characters/${characterId}...`);
  const res = await fetch(`${BASE_URL}/characters/${characterId}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`fetch character HTTP ${res.status}: ${JSON.stringify(body)}`);
  }
  const data = unwrap(body);
  console.log(`  character keys: ${Object.keys(data).join(',')}`);
  return data;
}

function findDirectionImage(charData, direction) {
  // Possible shapes:
  //   data.directions[dir].url
  //   data.directions[dir].image.url
  //   data.rotations[dir].url
  //   data.rotations: array of {direction, url}
  //   data.specs.directions etc.
  const tryPaths = [
    charData?.directions?.[direction]?.url,
    charData?.directions?.[direction]?.image?.url,
    charData?.directions?.[direction]?.base64,
    charData?.rotations?.[direction]?.url,
    charData?.images?.[direction]?.url,
    charData?.images?.[direction]?.base64,
  ];
  for (const v of tryPaths) {
    if (v) return v;
  }
  if (Array.isArray(charData?.rotations)) {
    const m = charData.rotations.find((r) => r.direction === direction);
    if (m?.url) return m.url;
    if (m?.base64) return m.base64;
  }
  if (Array.isArray(charData?.images)) {
    const m = charData.images.find((r) => r.direction === direction);
    if (m?.url) return m.url;
    if (m?.base64) return m.base64;
  }
  return null;
}

function isLikelyBase64(s) {
  return typeof s === 'string' && !/^https?:\/\//.test(s) && s.length > 200;
}

async function downloadDirection(charData, direction) {
  const ref = findDirectionImage(charData, direction);
  if (!ref) {
    return { direction, skipped: true, reason: 'no url/base64 in character payload' };
  }
  let buf;
  if (isLikelyBase64(ref)) {
    buf = Buffer.from(ref, 'base64');
  } else {
    const r = await fetch(ref, { headers: { Authorization: `Bearer ${TOKEN}` } });
    if (!r.ok) throw new Error(`download ${direction} HTTP ${r.status}`);
    buf = Buffer.from(await r.arrayBuffer());
  }
  const outPath = path.join(OUTPUT_DIR, `annie-overworld-${direction}.png`);
  fs.writeFileSync(outPath, buf);
  return { direction, path: outPath, bytes: buf.length };
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });

  let characterId, jobId;
  if (fs.existsSync(STATE_FILE)) {
    const saved = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    console.log(`Found existing state file → resuming. character_id=${saved.characterId}`);
    characterId = saved.characterId;
    jobId = saved.jobId;
  } else {
    const submitted = await submitJob();
    characterId = submitted.characterId;
    jobId = submitted.jobId;
  }

  await pollJob(jobId);
  const charData = await fetchCharacter(characterId);

  // Save the raw character JSON for inspection.
  const debugPath = path.join(OUTPUT_DIR, '_character-response.json');
  fs.writeFileSync(debugPath, JSON.stringify(charData, null, 2));
  console.log(`  raw character JSON saved to ${path.relative(PROJECT_ROOT, debugPath)}`);

  console.log('\nDownloading direction images...');
  const results = [];
  for (const dir of DIRECTIONS) {
    try {
      const r = await downloadDirection(charData, dir);
      if (r.skipped) {
        console.log(`  ${dir.padEnd(11)} SKIPPED — ${r.reason}`);
      } else {
        console.log(`  ${dir.padEnd(11)} ${path.relative(PROJECT_ROOT, r.path)} (${r.bytes} bytes)`);
      }
      results.push(r);
    } catch (err) {
      console.log(`  ${dir.padEnd(11)} FAILED — ${err.message}`);
      results.push({ direction: dir, error: err.message });
    }
  }

  const ok = results.filter((r) => r.path).length;
  console.log(`\nDone. ${ok}/${DIRECTIONS.length} directions downloaded.`);
  if (ok < DIRECTIONS.length) {
    console.log(`Inspect ${path.relative(PROJECT_ROOT, debugPath)} to find the actual image URL shape.`);
  }
}

main().catch((err) => {
  console.error('\nFATAL:', err.message);
  process.exit(1);
});
