// Poll Annie's character record until animation_count stabilizes, then exit.
// Helps when we know jobs are queued (e.g., after a 429 telling us slots
// are full) but the animations haven't yet propagated to the character record.
//
// Usage: PIXELLAB_TOKEN=<token> node tools/wait-annie-animations.js [target_count]

const TOKEN = process.env.PIXELLAB_TOKEN;
if (!TOKEN) { console.error('Missing PIXELLAB_TOKEN'); process.exit(1); }

const CHARACTER_ID = 'e7ac9162-76d6-4fce-8a9e-cfbaf35f046c';
const TARGET_COUNT = parseInt(process.argv[2] ?? '2', 10); // 2 animations: walk + idle
const MAX_WAIT_S = 600;  // 10 min hard cap
const POLL_S = 15;

(async () => {
  const start = Date.now();
  let lastCount = -1;
  let lastChangeAt = start;

  for (;;) {
    const r = await fetch(`https://api.pixellab.ai/v2/characters/${CHARACTER_ID}`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    const body = await r.json().catch(() => ({}));
    const count = body.animation_count ?? 0;
    const elapsed = Math.round((Date.now() - start) / 1000);

    if (count !== lastCount) {
      console.log(`[+${elapsed}s] animation_count = ${count}` + (Array.isArray(body.animations) ? ` (animations.length = ${body.animations.length})` : ''));
      if (Array.isArray(body.animations)) {
        body.animations.forEach((a, i) => {
          console.log(`     [${i}] ${a.name ?? '?'} (id=${a.id ?? '?'}, status=${a.status ?? '?'})`);
        });
      }
      lastCount = count;
      lastChangeAt = Date.now();
    } else {
      console.log(`[+${elapsed}s] still ${count}`);
    }

    if (count >= TARGET_COUNT) {
      console.log(`\nReached target ${TARGET_COUNT}.`);
      return;
    }
    if (elapsed > MAX_WAIT_S) {
      console.log(`\nMax wait (${MAX_WAIT_S}s) exceeded; stopping.`);
      return;
    }
    await new Promise((res) => setTimeout(res, POLL_S * 1000));
  }
})().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });
