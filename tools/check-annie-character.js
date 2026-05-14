// Inspect Annie's character record on PixelLab — show animations list and counts.
// Usage: PIXELLAB_TOKEN=<token> node tools/check-annie-character.js

const TOKEN = process.env.PIXELLAB_TOKEN;
if (!TOKEN) { console.error('Missing PIXELLAB_TOKEN'); process.exit(1); }

const CHARACTER_ID = 'e7ac9162-76d6-4fce-8a9e-cfbaf35f046c';

(async () => {
  const r = await fetch(`https://api.pixellab.ai/v2/characters/${CHARACTER_ID}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  const body = await r.json();
  console.log(`HTTP ${r.status}`);
  console.log(`character_id  = ${body.id}`);
  console.log(`animation_count = ${body.animation_count}`);
  console.log(`animations field type: ${Array.isArray(body.animations) ? 'array' : typeof body.animations}`);
  if (Array.isArray(body.animations)) {
    console.log(`animations.length = ${body.animations.length}`);
    body.animations.slice(0, 20).forEach((a, i) => {
      console.log(`  [${i}] keys=${Object.keys(a).join(',')}`);
      console.log(`      ${JSON.stringify(a).slice(0, 300)}`);
    });
  } else {
    console.log(`animations: ${JSON.stringify(body.animations).slice(0, 500)}`);
  }
})().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });
