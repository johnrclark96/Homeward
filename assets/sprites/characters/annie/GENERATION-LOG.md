# Annie Overworld Sprite — Generation Log

Canonical record of how Annie's overworld sprite (8-direction static rotation +
walk + idle animations) was generated, and the mistakes made along the way.
Read this before generating John, Obi, or Luna — the lessons here are the whole
point.

---

## Final Approved Assets

| Item | Value |
|---|---|
| Active `character_id` | `ad0fdc16-a374-4252-9209-c0750971c916` |
| Style anchor | `assets/portraits/annie/annie-neutral.png` (portrait, seed 1337) |
| Canvas size | 184 × 184 (PixelLab auto-expands; character ≈ 64 × 96 inside) |
| Template | `mannequin` · View `low top-down` · Seed `1337` |

Files in `raw/` (the good set):

```
annie-overworld-{south,south-east,east,north-east,north,north-west,west,south-west}.png   8 static rotations
walking/<direction>/{0..5}.png            8 directions × 6 frames = 48
breathing-idle/<direction>/{0..3}.png     8 directions × 4 frames = 32
_reference-south-cropped.png              the 168×168 input fed to rotate_character
_character-response.json                  rotate_character response
_character-with-animations.json           full character record after animations
```

All 8 directions are clean and consistent, **including `north` (a true back
view)**. Total: 8 rotations + 80 animation frames.

The superseded broken assets live in `raw/_archive-v1-broken/` — see "What went
wrong" below. They are kept for reference; do not use them.

---

## The Correct Workflow (use this for John, Obi, Luna)

The Style Guide (HOMEWARD-STYLE-GUIDE.md:391-393) defines a **three-step**
pipeline. Each step is a distinct PixelLab call. Do not collapse them.

### Step 1 — Portrait (done earlier)
`POST /generate-image-v2` → `assets/portraits/annie/annie-neutral.png`.
The portrait is the style anchor. It is NOT a rotation input.

### Step 2 — 8-direction static rotation
`POST /create-character-pro` with **`method: "rotate_character"`** and a
**full-body south-facing sprite** as `reference_image`.

```json
{
  "description": "chibi girl with long warm honey-brown wavy hair past shoulders, NOT bright yellow, NOT anime yellow, warm brown undertones with subtle golden highlights, red sweater, dark pants, small boots, top-down RPG sprite, low top-down view, transparent background, warm cozy pixel art, soft warm-brown contextual outlines, no pure black, no pure white",
  "image_size": { "width": 64, "height": 96 },
  "method": "rotate_character",
  "reference_image": { "type": "base64", "base64": "<full-body south sprite, ≤168×168>", "format": "png" },
  "view": "low top-down",
  "template_id": "mannequin",
  "no_background": true,
  "seed": 1337
}
```

- `reference_image` max size is **168×168**. Our south sprite was 184×184, so
  it is center-cropped to 168×168 first (PIL — trims transparent padding only,
  preserves pixel scale). See `tools/regenerate_annie_rotations.py`.
- Response: `data.character_id` + `data.background_job_id`. Poll
  `GET /background-jobs/{id}`; when `completed`, `GET /characters/{id}` returns
  `rotation_urls.<direction>` (8 Backblaze URLs).
- Backblaze URLs: fetch with a normal `User-Agent`, **no** Authorization header
  (the PixelLab Bearer token returns 401; the default Python urllib UA returns
  403).

### Step 3 — Walk + idle animations
`POST /characters/animations` — **one request per animation type, with every
direction in the `directions` list**.

```json
{
  "character_id": "<id>",
  "template_animation_id": "walking",          // then "breathing-idle"
  "mode": "template",
  "directions": ["south","south-east","east","north-east","north","north-west","west","south-west"]
}
```

- One request → ONE animation entry containing all 8 directions. The `directions`
  list is what makes it multi-direction; in template mode it even defaults to
  "all character directions" if omitted.
- Response field is **`background_job_ids`** (plural array) — one job ID per
  direction; all belong to the single animation entry.
- An N-direction request consumes **N concurrent slots** (account limit ≈ 14).
  Submit `walking` (8 slots), let it fully finish, **then** `breathing-idle`.
  Never overlap two 8-direction requests.
- Directions populate **incrementally** as each direction's job completes — a
  full 8-direction animation can take 5-15 min. "Not all 8 yet" during that
  window is normal; do not resubmit.
- Frame URLs are under `animations[].directions[].frames[]` on the character
  record. `walking` = 6 frames/direction, `breathing-idle` = 4.

---

## What Went Wrong (the v1 character, now archived)

The first attempt produced a character (`e7ac9162-…`) whose **`north` rotation
was a second, subtly different front-facing face** instead of a back-of-head
view. Everything downstream (walk-north, idle-north) was therefore corrupted.

### Root cause

Step 2 was done wrong: the **128×128 portrait** (head + shoulders) was fed
directly into `/create-character-pro` with **`method: "create_with_style"`**.
That mode is text-driven; the reference image is style-only. With no body or
back-of-head pixels to work from, the model invented everything below the
shoulders and, for the pure-back `north` slot, fell back to a learned prior and
generated a *second front-facing chibi*.

The Style Guide's Step 2 — derive a full-body south sprite first, then rotate
from THAT — was skipped. The portrait was used where a sprite belonged.

### The fix (Option F1)

Re-did Step 2 correctly: used the canonical full-body south sprite as the
`reference_image` with `method: "rotate_character"`. Result: all 8 rotations
consistent, `north` a proper back view. New `character_id` = `ad0fdc16-…`.

### Second mistake — animation request fragmentation

While animating, `POST /characters/animations` was wrongly called **once per
direction** (`directions: ["north"]`, etc.). Each call creates a *separate*
animation entry, so 8 per-direction calls produced 8 fragmented animations each
1/8 populated, instead of one clean 8-direction animation. Compounded by a
too-short stall timeout that triggered duplicate resubmissions and exhausted the
concurrent-slot limit.

Why it happened: an early run submitted a correct multi-direction request, but
only 5/8 directions had populated when it was checked. That incremental
population was misread as "batches silently drop directions," and the bogus
"fix" was to submit per-direction. There is no batch-drop problem — directions
just populate over several minutes.

There is **no API endpoint to delete a single animation** or to merge entries,
so once fragmented a character can only be fully cleaned by `DELETE`-ing it and
regenerating. The final `ad0fdc16` animations were completed pragmatically
(the frames themselves are correct regardless of entry fragmentation; we extract
PNGs into the repo, so server-side entry layout does not ship).

---

## `raw/_archive-v1-broken/` Contents

Superseded, kept for reference only:

- `annie-overworld-*.png` — v1 rotations (broken/patched `north`).
- `walking/`, `breathing-idle/` — v1 animations from the broken character.
- `north-fix-candidates/` — `/rotate` experiments (north-east → north).
- `_diagnostic-idle-north/` — the front-facing / head-on-backwards idle attempts.
- `_pixellab-export/` — the web-UI export of the broken character (used to
  diagnose the two-faced `north`).
- `_character-response.json`, `_character-with-animations.json` — v1 records.

---

## Cost (approximate)

| Phase | Generations |
|---|---|
| Portrait candidates (4 seeds) | ~4 |
| v1 rotations + animations + north-fix attempts (all archived) | ~49 |
| v2 `rotate_character` rotation | ~20 |
| v2 animations (incl. duplicate-submission waste + 2 gap retries) | ~23 |
| **Total** | **~95** of the 5,000 / month allowance |

The duplicate-submission waste (~5-8 generations) is the cost of the
fragmentation mistake. Doing Step 3 correctly the first time would have cost
exactly 16 generations for the 16 animation directions.

---

## Aseprite Cleanup Punch List

Before these assets enter the engine:

1. **Normalize the 8 static rotation canvases** to a single foot/center anchor
   so the character does not jitter between facings.
2. **Palette-snap** to `assets/palette/homeward.gpl` (indexed color) to catch
   any off-palette drift.
3. **Sweater shade consistency** — the red reads slightly punchier from the
   front than from the side/back across rotations; lock to `#D85040` if it
   bothers in motion.
4. **Pants/boots separation** — both very dark; a 1-px lighter band helps
   readability at scale.
5. **Onion-skin each walk cycle** — confirm no foot-slip on the frame-5→0 loop,
   no excessive head bob.
6. Tag everything in one `.aseprite` master file per the Style Guide §8.

No direction needs to be hand-drawn — all 16 animation directions and 8
rotations are clean PixelLab output.

---

## Tooling

| Script | Purpose |
|---|---|
| `tools/regenerate_annie_rotations.py` | Step 2 done right — crop south to 168, `rotate_character` |
| `tools/finish-annie-gaps.js` | Submit specific missing directions, download full set |
| `tools/check-annie-character.js` | One-shot character-record diagnostic |
| `tools/generate-annie-overworld.js` | v1 rotation script (`create_with_style` — the wrong method; kept as a record) |
| `tools/generate-annie-animations*.js`, `tools/download-annie-*.js`, etc. | v1-era animation scripts (superseded; kept as a record) |

For John / Obi / Luna: use `regenerate_annie_rotations.py` as the rotation
template and the Step 3 pattern above (one multi-direction request per
animation type). Do not reuse the v1 scripts.
