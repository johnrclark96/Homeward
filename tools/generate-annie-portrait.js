// Annie portrait candidates — Homeward style anchor generation.
// Usage:  PIXELLAB_TOKEN=<token> node tools/generate-annie-portrait.js
// Submits 4 portrait jobs (seeds 0/42/1337/2024) to PixelLab API v2, polls
// each to completion, and saves PNGs into assets/portraits/annie/raw/.

const fs = require('fs');
const path = require('path');

const TOKEN = process.env.PIXELLAB_TOKEN;
if (!TOKEN) {
  console.error('Missing PIXELLAB_TOKEN env var');
  process.exit(1);
}

const BASE_URL = 'https://api.pixellab.ai/v2';
const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'portraits', 'annie', 'raw');
const SEEDS = [0, 42, 1337, 2024];

const DESCRIPTION = [
  'chibi pixel art girl portrait, head and shoulders',
  'long warm honey-brown wavy hair past shoulders with subtle golden highlights',
  'NOT bright yellow, NOT anime yellow, warm brown undertones',
  'kind round face, big warm hazel eyes, genuine warm smile, rosy cheeks',
  'red sweater visible at shoulders',
  'cozy warm lighting, facing forward',
  'pixel art style with clear individual pixels visible, retro RPG portrait',
  'warm earthy tones, soft warm-brown contextual outlines, NO black outlines, no pure black, no pure white',
].join(', ');

// API returns fields either at top level OR inside a `data` wrapper, depending
// on endpoint and version. Tolerate both.
function unwrap(body) {
  return body?.data ?? body ?? {};
}

async function submitJob(seed) {
  const res = await fetch(`${BASE_URL}/generate-image-v2`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({
      description: DESCRIPTION,
      image_size: { width: 128, height: 128 },
      no_background: true,
      seed,
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`submit seed=${seed} HTTP ${res.status}: ${JSON.stringify(body)}`);
  }
  const data = unwrap(body);
  const jobId = data.background_job_id;
  if (!jobId) {
    throw new Error(`submit seed=${seed} no background_job_id in response: ${JSON.stringify(body)}`);
  }
  return { seed, jobId, imageId: data.image_id };
}

async function pollJob(seed, jobId) {
  const start = Date.now();
  let firstPollLogged = false;
  for (;;) {
    const res = await fetch(`${BASE_URL}/background-jobs/${jobId}`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(`poll seed=${seed} HTTP ${res.status}: ${JSON.stringify(body)}`);
    }
    const data = unwrap(body);
    if (!firstPollLogged) {
      console.log(`  seed=${seed} first-poll keys: ${Object.keys(data).join(',')}`);
      firstPollLogged = true;
    }
    const status = data.status;
    const elapsed = Math.round((Date.now() - start) / 1000);
    if (status === 'completed') {
      console.log(`  seed=${seed} completed in ${elapsed}s`);
      return data;
    }
    if (status === 'failed') {
      throw new Error(`seed=${seed} job failed: ${JSON.stringify(body.error || data)}`);
    }
    console.log(`  seed=${seed} status=${status} (${elapsed}s)`);
    await new Promise((r) => setTimeout(r, 3000));
  }
}

async function downloadAndSave(seed, result) {
  // Real shape from /background-jobs/{id} when completed:
  //   { last_response: { images: [{ type: "base64", width, base64 }] } }
  // Also tolerate { images: [{ url, base64 }] } and sync-style { image }.
  let img = result?.last_response?.images?.[0]
          ?? result?.images?.[0];
  if (!img) {
    if (result?.url || result?.base64 || result?.image) {
      img = { url: result.url, base64: result.base64 ?? result.image };
    } else {
      throw new Error(`seed=${seed} cannot find image in result: ${JSON.stringify(result).slice(0, 500)}`);
    }
  }
  let buf;
  if (img.base64) {
    buf = Buffer.from(img.base64, 'base64');
  } else if (img.url) {
    const r = await fetch(img.url);
    if (!r.ok) throw new Error(`download seed=${seed} HTTP ${r.status}`);
    buf = Buffer.from(await r.arrayBuffer());
  } else {
    throw new Error(`seed=${seed} image has no url or base64: ${JSON.stringify(img)}`);
  }
  const outPath = path.join(OUTPUT_DIR, `annie-portrait-candidate-${seed}.png`);
  fs.writeFileSync(outPath, buf);
  console.log(`  seed=${seed} saved ${path.relative(process.cwd(), outPath)} (${buf.length} bytes)`);
  return outPath;
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`Output dir: ${OUTPUT_DIR}`);
  console.log(`Description: ${DESCRIPTION}\n`);

  console.log(`Submitting ${SEEDS.length} jobs (seeds: ${SEEDS.join(', ')})...`);
  const jobs = await Promise.all(SEEDS.map(submitJob));
  jobs.forEach((j) => console.log(`  seed=${j.seed} -> job ${j.jobId}`));

  console.log('\nPolling for completion...');
  const completed = await Promise.all(
    jobs.map(async (j) => ({ ...j, result: await pollJob(j.seed, j.jobId) }))
  );

  console.log('\nDownloading images...');
  const paths = await Promise.all(completed.map((j) => downloadAndSave(j.seed, j.result)));

  console.log('\nDone. Candidates:');
  paths.forEach((p) => console.log(' -', path.relative(process.cwd(), p)));
}

main().catch((err) => {
  console.error('\nFATAL:', err.message);
  process.exit(1);
});
