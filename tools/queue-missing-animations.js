// Queue the 4 missing directions (south-west + west, for both walk and idle).
// Usage: PIXELLAB_TOKEN=<token> node tools/queue-missing-animations.js

const TOKEN = process.env.PIXELLAB_TOKEN;
if (!TOKEN) { console.error('Missing PIXELLAB_TOKEN'); process.exit(1); }

const CHARACTER_ID = 'e7ac9162-76d6-4fce-8a9e-cfbaf35f046c';
const MISSING = ['south-west', 'west'];

(async () => {
  for (const tpl of ['walking', 'breathing-idle']) {
    const body = {
      character_id: CHARACTER_ID,
      template_animation_id: tpl,
      mode: 'template',
      directions: MISSING,
    };
    console.log(`POST /characters/animations  ${tpl}  dirs=${MISSING.join(',')}`);
    const r = await fetch('https://api.pixellab.ai/v2/characters/animations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
      body: JSON.stringify(body),
    });
    const text = await r.text();
    console.log(`  HTTP ${r.status}: ${text.slice(0, 400)}`);
  }
})().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });
