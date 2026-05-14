# Annie Overworld Sprite — Generation Log

This file records the exact PixelLab calls used to produce Annie's overworld sprite (8-direction static rotation + walk + idle animations), so we can reproduce the workflow for John, Obi, and Luna.

## Character Record

| Field | Value |
|---|---|
| `character_id` | `e7ac9162-76d6-4fce-8a9e-cfbaf35f046c` |
| Created | 2026-05-13 |
| Style anchor | `assets/portraits/annie/annie-neutral.png` (portrait, seed 1337) |
| Canvas size on PixelLab | 184 × 184 (auto-expanded from requested 64 × 96 to leave skeleton-rigging headroom) |
| Template | `mannequin` (bipedal humanoid) |
| View | `low top-down` |

## Step 1 — 8-Direction Static Rotation

**Endpoint:** `POST https://api.pixellab.ai/v2/create-character-pro`

**Request body:**

```json
{
  "description": "chibi girl with long warm honey-brown wavy hair past shoulders, NOT bright yellow, NOT anime yellow, warm brown undertones with subtle golden highlights, red sweater, dark pants, small boots, top-down RPG sprite, low top-down view, transparent background, warm cozy pixel art, soft warm-brown contextual outlines, no pure black, no pure white",
  "image_size": { "width": 64, "height": 96 },
  "method": "create_with_style",
  "reference_image": { "type": "base64", "base64": "<annie-neutral.png>", "format": "png" },
  "view": "low top-down",
  "template_id": "mannequin",
  "no_background": true,
  "seed": 1337
}
```

**Result:** background_job `93028b7c-46a6-4284-8fb3-4299b3135c1e`, completed in 191s. Cost ~20 generations (Pro). Output served as 8 PNG URLs under `rotation_urls.<direction>` (Backblaze CDN — fetch unauthenticated; PixelLab Bearer token returns HTTP 401).

**Saved to:** `raw/annie-overworld-<direction>.png` (8 files).

### North fix (manual repair via `/rotate`)

The 8-direction generation produced a **front-facing pose for the `north` slot** instead of a back view. Detected by file size (10,170 B for "north" matched south=10,177 B; correct back views were ~8 KB) and confirmed visually.

**Endpoint:** `POST /v2/rotate`

**Constraints discovered:**
- `view` field is **not accepted** (HTTP 422 `extra_forbidden`).
- `image_size` must be one of **128×128, 64×64, 32×32, 16×16** (square only). 184×184 source was rejected.

**Workaround:** Center-crop the 184×184 north-east source to 128×128 with PIL (preserves pixel scale, trims animation-padding border only), POST to `/rotate`, then center-pad the 128×128 result back to 184×184. Implemented in `tools/rotate_annie_north.py`.

**Request body (after workaround):**

```json
{
  "image_size": { "width": 128, "height": 128 },
  "from_image": { "type": "base64", "base64": "<north-east cropped to 128>", "format": "png" },
  "from_direction": "north-east",
  "to_direction": "north",
  "image_guidance_scale": 3.0,
  "seed": 7
}
```

**Picked seed 7** (cleanest of three candidates — 1337, 7, 42; seed 1337 had a visible crown part, seed 42 had specks at the top). Saved as `raw/annie-overworld-north.png` (5,125 bytes).

**Aseprite cleanup needed:** the corrected north sprite is at a slightly different position within the 184×184 canvas than the other 7 (because of the crop+pad cycle). Aseprite needs to align it to the same anchor point as the other 7. Other rotations are unaffected.

## Step 2 — Walk + Idle Animations

**Endpoint:** `POST https://api.pixellab.ai/v2/characters/animations`

**Request body (one per animation):**

```json
{
  "character_id": "e7ac9162-76d6-4fce-8a9e-cfbaf35f046c",
  "template_animation_id": "walking" | "breathing-idle",
  "mode": "template",
  "directions": ["south","south-east","east","north-east","north-west","west","south-west"]
}
```

**`north` was deliberately excluded.** The PixelLab character record still has the broken (front-facing) north rotation that `/create-character-pro` produced. Animation frames generated for "north" would also face the wrong way because the animator uses the stored rotation as its reference. North walk + idle frames will be reconstructed in Aseprite using the corrected static `annie-overworld-north.png` plus walk frames from north-east and north-west as motion reference.

**Response shape (important — different from docs):**

```json
{
  "background_job_ids": ["...", "...", "..."],   // ← plural, one ID per direction
  "directions": ["south", "south-east", ...],
  "status": "processing"
}
```

The docs (and our other endpoints) suggested `background_job_id` (singular) at the top level. Real shape is `background_job_ids` (plural array).

**Result:** all 14 direction-jobs (7 walk + 7 idle) completed successfully.

**Frames saved to:** `raw/<animation_type>/<direction>/<frame_index>.png`

| Animation | Frame count per direction | Directions | Total frames |
|---|---|---|---|
| `walking` | 6 | south, south-east, east, north-east, north-west, west, south-west | 42 |
| `breathing-idle` | 4 | south, south-east, east, north-east, north-west, west, south-west | 28 |
| **Total** | | 14 | **70** |

## Animation Entry Topology (lesson learned)

Each `POST /characters/animations` call creates a **new `animation_group_id`** — a new entry in the character's `animations` list. It does NOT append to an existing entry of the same `animation_type`. So a retry for missing directions creates a separate entry, and the character record ends up with multiple entries sharing the same `animation_type`.

In our case, the original 7-direction submissions silently completed only 5 directions each. A retry for the missing `["south-west", "west"]` produced two new entries. Final state: **4 animation entries** (2 `walking` + 2 `breathing-idle`), each containing the directions from its respective submission.

```
[0] breathing-idle  group=1b80e959  dirs: south-east, south, north-east, north-west, east  (original)
[1] breathing-idle  group=fc7307f0  dirs: south-west, west                                  (retry)
[2] walking         group=c6f93f64  dirs: south-west, west                                  (retry)
[3] walking         group=61fd17bd  dirs: east, south, south-east, north-east, north-west   (original)
```

**Implications when iterating the character record:**
- Don't index animations by `animation_type` (overwrites).
- To get all directions for an animation, **sum across all entries** of that type.
- `animation_count` field returns the **total number of directions across all entries** (we saw 14), not the number of entries.

## Why the original 7-direction submission only completed 5

Unknown — no error was returned, just 5 of 7 directions persisted to the character record. Hypothesis: a soft per-account concurrent slot limit silently drops directions exceeding it. **For future characters: prefer 1-direction-per-request submissions over 7-direction batches**, even though it means more HTTP calls. Alternatively: submit a 7-direction batch, then check the resulting entry's `directions.length` and re-submit any missing direction names.

## Cost This Session (Annie character pipeline)

| Step | Calls | Estimated cost |
|---|---|---|
| Portrait candidate batch (4 seeds) | 4 | ~4 generations |
| `/create-character-pro` (8-dir static rotation) | 1 | ~20 generations |
| `/rotate` north fix (3 seed candidates) | 3 | ~3 generations |
| `/characters/animations` walk (original 7-dir batch — 5 succeeded) | 1 (×7 dirs) | 5 generations realized |
| `/characters/animations` idle (original 7-dir batch — 5 succeeded) | 1 (×7 dirs) | 5 generations realized |
| `/characters/animations` walk (retry, 2 dirs) | 1 (×2 dirs) | 2 generations |
| `/characters/animations` idle (retry, 2 dirs) | 1 (×2 dirs) | 2 generations |
| **Total** | | **~41 generations** of the 5,000/month allowance |

## Aseprite Cleanup Punch List

Hand off to Aseprite for these fixes before the sprite goes into the engine:

1. **Normalize all 8 static rotation canvases to a single anchor point.** The `north` fix landed at a slightly different position within 184×184 than the other 7 (due to crop+pad). Re-anchor all 8 to a consistent foot/center reference.
2. **Reconstruct walk + idle frames for the `north` direction.** Use `annie-overworld-north.png` as the canonical pose; reference walk-north-east and walk-north-west frame timings to build a 6-frame walk; reference idle-north-east for the 4-frame idle. Estimated effort: 30–60 min.
3. **Snap palette to indexed-color** with `assets/palette/homeward.gpl` loaded. Catches any drift from the warm-brown contextual outline spec.
4. **Sweater color consistency.** Across the 8 static rotations the sweater shades slightly differently from "Annie Red `#D85040`" (front views) to a more burgundy tone (side/back views). If it bothers in motion, lock to the spec hex.
5. **Pants/boots separator.** Pants and boots are both very dark and merge slightly at this scale. A 1-px lighter band or a slight outline shift between them would help readability.
6. **Onion-skin walk cycles for each direction** — confirm continuity (no foot-slipping between frame 5 → frame 0 loop, no head bob beyond a 1-2 px sway).

## Files Produced

```
assets/sprites/characters/annie/raw/
├── annie-overworld-south.png              ← static rotation (original /create-character-pro)
├── annie-overworld-south-east.png         ← static rotation
├── annie-overworld-east.png               ← static rotation
├── annie-overworld-north-east.png         ← static rotation
├── annie-overworld-north.png              ← static rotation (FIXED via /rotate from north-east, seed 7)
├── annie-overworld-north-west.png         ← static rotation
├── annie-overworld-west.png               ← static rotation
├── annie-overworld-south-west.png         ← static rotation
├── _character-response.json               ← raw response from GET /characters/{id} after Pro generation
├── _character-with-animations.json        ← raw response after animations completed
├── north-fix-candidates/
│   ├── _source-128.png                    ← 184→128 center-crop of north-east (input to /rotate)
│   ├── annie-overworld-north-seed-7.png   ← APPROVED candidate
│   ├── annie-overworld-north-seed-1337.png
│   └── annie-overworld-north-seed-42.png
├── breathing-idle/
│   ├── south/{0,1,2,3}.png                ← 4 frames per direction × 7 directions = 28 frames
│   ├── south-east/{0,1,2,3}.png
│   ├── east/{0,1,2,3}.png
│   ├── north-east/{0,1,2,3}.png
│   ├── north-west/{0,1,2,3}.png
│   ├── west/{0,1,2,3}.png
│   └── south-west/{0,1,2,3}.png
└── walking/
    ├── south/{0..5}.png                   ← 6 frames per direction × 7 directions = 42 frames
    ├── south-east/{0..5}.png
    ├── east/{0..5}.png
    ├── north-east/{0..5}.png
    ├── north-west/{0..5}.png
    ├── west/{0..5}.png
    └── south-west/{0..5}.png
```

## Tooling

| Script | Purpose |
|---|---|
| `tools/generate-annie-overworld.js` | Submits `/create-character-pro` and downloads 8-dir static rotations |
| `tools/rotate_annie_north.py` | Fixes a broken rotation via `/rotate` (handles `view` rejection + 128×128 size constraint via PIL crop/pad) |
| `tools/generate-annie-animations.js` | Submits walk + idle template animations (note: response field is `background_job_ids` plural) |
| `tools/queue-missing-animations.js` | Submits a targeted retry for specific missing directions |
| `tools/download-annie-animations.js` | Polls character record + downloads all frames; sums direction counts across entries of the same `animation_type` |
| `tools/check-annie-character.js` | One-shot diagnostic for the character record |
| `tools/wait-annie-animations.js` | Polls animation_count (DEPRECATED — use the directional-count summary in `download-annie-animations.js` instead) |
