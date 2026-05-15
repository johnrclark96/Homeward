# Homeward — PixelLab Workflow

> The operational manual for generating game art with PixelLab. Visual
> decisions (palette, sizes, character looks, prompt content) live in
> **HOMEWARD-STYLE-GUIDE.md** §2/§3/§8. This doc is *how to drive PixelLab*
> without repeating mistakes that have already cost real credits.
>
> Last verified end-to-end: 2026-05-15 (Annie's full overworld pipeline).

---

## 0. TL;DR — the rules that matter most

If you read nothing else, read this. Each line is a mistake someone already made.

1. **Use the REST API v2** (`https://api.pixellab.ai/v2`), not the MCP tools. The
   MCP has no standalone image-generation endpoint — you need it for portraits.
2. **The character pipeline is THREE separate steps, in order:** portrait →
   full-body south sprite → 8-direction rotation. Never collapse them.
3. **Never feed a portrait into 8-direction generation.** A head-and-shoulders
   portrait has no body or back-of-head data; the model invents a second
   front-facing face for the `north` slot. Use a *full-body south sprite* as the
   rotation input with `method: "rotate_character"`.
4. **Animations: ONE request per animation type, with every direction in the
   `directions` list.** One request → one clean 8-direction animation. Submitting
   one direction per call fragments one animation into eight, and there is no API
   to merge or delete the fragments.
5. **Be patient when polling.** An 8-direction animation takes 5–15 minutes;
   directions populate one at a time. "Not all 8 yet" is normal, not a failure.
   Never resubmit while jobs are still `processing`.
6. **Submit `walking`, let it fully finish, THEN `breathing-idle`.** Each
   8-direction request consumes 8 concurrent job slots; the account cap is ~14.
   Overlapping two of them triggers 429s.
7. **Backblaze download URLs take no auth.** The Bearer token returns 401 on
   them. Python's default urllib User-Agent returns 403 — send a normal UA.
8. **Never commit the API token.** It lives in `~/.claude.json`; pass it via an
   environment variable to scripts.

---

## 1. Two ways in: REST API v2 vs the MCP

PixelLab is reachable two ways. **Homeward uses the REST API v2.**

| | REST API v2 (`api.pixellab.ai/v2`) | MCP server (`mcp__pixellab__*` tools) |
|---|---|---|
| Plain image generation (portraits) | ✅ `/generate-image-v2` | ❌ none — only character/tileset/object tools |
| 8-direction characters | ✅ `/create-character-pro` | ✅ `create_character` |
| Animations | ✅ `/characters/animations` | ✅ `animate_character` |
| Single-image rotation | ✅ `/rotate` | — |
| Interface | HTTP from a Node/Python script | Tool calls in the session |

**Why REST:** the portrait is Step 1 of every character and only the REST API
can generate it. Using one interface for the whole pipeline beats mixing MCP
calls and HTTP. Every recipe in this doc is REST. The MCP remains installed
(see CLAUDE.md "Tooling") and is fine for quick experiments, but it is not the
documented Homeward path.

Full REST docs: `https://api.pixellab.ai/v2/llms.txt`. **The published docs are
incomplete and occasionally wrong about response shapes** — §4 below records the
shapes actually observed in production.

---

## 2. Authentication

- The API token is the same bearer token the PixelLab MCP server uses. It is
  stored in `~/.claude.json` under `mcpServers.pixellab.headers.Authorization`
  (the value after `Bearer `).
- **Never echo, log, commit, or paste the token.** Read it once, pass it to
  scripts via an environment variable:
  ```sh
  PIXELLAB_TOKEN=<token> node tools/<script>.js
  ```
  Every Homeward tool script reads `process.env.PIXELLAB_TOKEN` / `os.environ`.
- Every API request needs the header `Authorization: Bearer <token>` —
  **except** Backblaze CDN download URLs (see §4h).
- If a request 401s, the token is stale; the user must refresh it.

---

## 3. The mental model

### 3a. Async jobs

Generation endpoints (`/generate-image-v2`, `/create-character-pro`,
`/characters/animations`, `/rotate`) **return immediately with a job ID** and
run in the background. The pattern is always:

```
submit  → returns a job id (or job ids)
poll    GET /background-jobs/{id} until status == "completed" | "failed"
fetch   GET /characters/{id}  (or read the job's last_response) for image URLs
download the PNGs to assets/...
```

Approximate wallclock:

| Operation | Time |
|---|---|
| `/generate-image-v2` (one 128×128 image) | ~1–2 min |
| `/create-character-pro` (8-direction rotation) | ~3 min |
| `/characters/animations` (per direction) | ~60–180 s |
| `/rotate` (one image) | ~60–90 s |

Poll on a sane interval (every 5–15 s). Do **not** set a short "stall timeout"
and resubmit — jobs legitimately take minutes. (That mistake oversubscribed the
slot limit and created duplicate animations — see §7.)

### 3b. The three-step character pipeline

This is the heart of the doc. The Style Guide (§8) mandates it; skipping a step
is what produced the two-faced Annie. Each step is a distinct API call.

```
Step 1  PORTRAIT          /generate-image-v2          128×128, the style anchor
           │
           ▼  (portrait as style reference)
Step 2  SOUTH SPRITE      /generate-image-v2          one full-body 64×96 south-facing sprite
           │
           ▼  (south sprite as reference_image, method=rotate_character)
Step 3  8-DIR ROTATION    /create-character-pro       8 static directional sprites
           │
           ▼  (the character_id from Step 3)
Step 4  ANIMATIONS        /characters/animations      walk + idle, 8 directions each
```

**Why the south sprite is non-negotiable:** `/create-character-pro` needs a
full-body image to rotate. A portrait shows only head + shoulders — the model
has nothing to extrapolate the body or the back of the head from, so for the
pure-back `north` view it falls back to "draw a front-facing chibi" and you get
a second, subtly different face. Step 2 produces the body the rotator needs.

### 3c. Canvas auto-expansion

`/create-character-pro` auto-expands the canvas well beyond the requested
`image_size` to leave room for animation rigging. A `64×96` request came back as
a **184×184** canvas with the character ≈ 64×96 centred inside. Plan for this:
the raw PNGs are large-canvas with transparent padding; Aseprite cleanup crops
to the target dimensions and normalises the anchor point.

### 3d. Concurrent job slots

The account has roughly **14 concurrent job slots**. An N-direction animation
request consumes **N slots** (it fans out into one job per direction). So:

- One 8-direction `walking` request = 8 slots. Fine.
- `walking` (8) + `breathing-idle` (8) at once = 16 > 14 → 429 errors.
- **Submit `walking`, wait for it to fully complete, then `breathing-idle`.**

A 429 response body literally says `Available: 0, needed: N` — that is slot
exhaustion, not a real failure. Wait and retry.

---

## 4. Endpoint reference (shapes verified in production)

The published docs are unreliable on response shapes. These are what the API
actually returns. Unwrap defensively: a response may or may not have a `data`
wrapper — `body.data ?? body` handles both.

### 4a. `POST /generate-image-v2` — plain image generation (portraits, sprites)

```json
{
  "description": "<prompt>",
  "image_size": { "width": 128, "height": 128 },
  "no_background": true,
  "seed": 1337
}
```
- Optional: `reference_images` (array, up to 4), `style_image`, `style_options`.
- There is **no `negative_description`** on this endpoint — steer with "NOT x"
  phrasing inside `description`.
- Response (HTTP 202), fields at **top level**: `{ background_job_id, status }`.
- Poll `/background-jobs/{id}`; the completed image is at
  `last_response.images[0]` as `{ type: "base64", width, base64 }`.

### 4b. `GET /background-jobs/{job_id}`

Returns a job object: `status` is `pending` | `processing` | `completed` |
`failed`. On `completed`, image data is under `last_response.images[]`. On
`failed`, `last_response.type` is `error`.

### 4c. `POST /create-character-pro` — 8-direction rotation

```json
{
  "description": "<prompt>",
  "image_size": { "width": 64, "height": 96 },
  "method": "rotate_character",
  "reference_image": { "type": "base64", "base64": "<full-body south sprite>", "format": "png" },
  "view": "low top-down",
  "template_id": "mannequin",
  "no_background": true,
  "seed": 1337
}
```
- `method`: **`rotate_character`** for Homeward — rotates the `reference_image`
  (treated as the south view) into 8 directions. `create_with_style` is
  text/style-driven and must NOT be used with a portrait (see §7a).
- `reference_image` max size **168×168**. Our sprites are 184×184, so
  centre-crop to 168 first (trims transparent padding only — see
  `tools/regenerate_annie_rotations.py`).
- `image_size` accepts 32–168 per side; the output canvas auto-expands (§3c).
- `template_id`: `mannequin` (bipedal), or `dog`/`cat`/etc. for quadrupeds.
- Response: `data.character_id` + `data.background_job_id`. The `character_id`
  is persistent — it is what animations attach to.

### 4d. `GET /characters/{character_id}`

The character record. Key fields:
- `rotation_urls`: `{ "<direction>": "<Backblaze url>" }` — the 8 static sprites.
- `animations[]`: each entry is `{ animation_type, animation_group_id,
  directions: [ { direction, frame_count, frames: ["<url>", ...] } ] }`.
- `animation_count`: total directions across **all** animation entries (not the
  number of entries).
- `size`, `template_id`, `view`, `skeletons` (2D + 3D keypoints).

### 4e. `POST /characters/animations` — walk / idle / etc.

```json
{
  "character_id": "<id>",
  "template_animation_id": "walking",
  "mode": "template",
  "directions": ["south","south-east","east","north-east","north","north-west","west","south-west"]
}
```
- **One request per animation type, all directions in the `directions` list.**
  This produces ONE animation entry holding all 8 directions. In template mode
  `directions` defaults to all character directions if omitted.
- Response: `{ background_job_ids: [...], directions: [...], status }` —
  **`background_job_ids` is a plural array**, one job ID per direction; they all
  belong to the single animation entry.
- `template_animation_id`: `walking`, `breathing-idle`, `attack`, etc. Template
  mode = 1 generation per direction.
- **Each `POST` creates a new `animation_group_id`.** Re-submitting (e.g. to
  fill a failed direction) makes a *separate* entry of the same
  `animation_type`. When reading the character record, sum directions across all
  entries of a type — do not index by `animation_type` alone.
- Frame counts: `walking` = 6 frames/direction, `breathing-idle` = 4.

### 4f. `POST /rotate` — rotate a single image

Used to repair one bad direction by rotating a known-good neighbour.

```json
{
  "image_size": { "width": 128, "height": 128 },
  "from_image": { "type": "base64", "base64": "<png>", "format": "png" },
  "from_direction": "north-east",
  "to_direction": "north",
  "image_guidance_scale": 3.0,
  "seed": 7
}
```
- **Does NOT accept a `view` field** (HTTP 422 `extra_forbidden`).
- **Canvas must be exactly 128×128, 64×64, 32×32, or 16×16** (square). A 184×184
  input is rejected — centre-crop to 128 first, then pad the result back.

### 4g. ZIP and delete

- `GET /characters/{id}/zip` — bundles rotations + animations. Returns **HTTP
  423** if anything is still rendering; check the status code (or that the body
  is > 1 KB) before saving, or you save a JSON error as a `.zip`.
- `DELETE /characters/{id}` — deletes the **whole** character. There is **no
  endpoint to delete or replace a single rotation or a single animation**, and
  none to update a character in place (only `PATCH /characters/{id}/tags`).

### 4h. Downloading from Backblaze

`rotation_urls` and animation `frames` are `backblaze.pixellab.ai/...` CDN URLs.

- **Do NOT send the `Authorization` header** — the Bearer token returns 401.
- Python `urllib`'s default `User-Agent` returns **403** — send
  `User-Agent: Mozilla/5.0`. Node `fetch()` works with no special headers.

---

## 5. The canonical character pipeline (step by step)

Reference implementation for Annie; repeat for John, Obi, Luna. Scripts live in
`tools/` — `regenerate_annie_rotations.py` is the cleanest Step-3 template.

### Step 1 — Portrait

`POST /generate-image-v2`, `image_size` 128×128, `no_background: true`. Generate
3–4 candidates with different seeds (`0`, `42`, `1337`, `2024`). Present them;
the user hand-picks one. The chosen portrait is the master style anchor for the
**entire game** — every other character references it. Save to
`assets/portraits/<char>/<char>-neutral.png`.

### Step 2 — Full-body south sprite

The rotation input. A full-body, south-facing (facing the camera) 64×96 sprite.
Generate with `/generate-image-v2` using the portrait as a `style_image` /
`reference_images` entry so the body matches the portrait's style. Description
should specify a full body: hair, top, legs, footwear.

> Shortcut used in Annie's repair: an already-good south *rotation* can serve as
> the Step-2 sprite directly. But the clean path is to generate the south sprite
> explicitly from the portrait.

### Step 3 — 8-direction rotation

`POST /create-character-pro`, `method: "rotate_character"`, `reference_image` =
the Step-2 south sprite (centre-cropped to ≤168×168). Poll the job, then
`GET /characters/{id}` for `rotation_urls`. Download all 8.

**Verify before continuing:** open all 8. `north` must be a back-of-head view.
A quick tell — back views compress small (~5–8 KB), front views large (~10 KB);
a `north` PNG the same size as `south` is a red flag. If a direction is wrong,
either re-roll Step 3 with a different seed, or repair that one direction with
`/rotate` from a good neighbour (§4f).

### Step 4 — Walk + idle animations

`POST /characters/animations` **once for `walking`** with all 8 directions.
Poll patiently (5–15 min; directions populate incrementally). When `walking` is
fully done, `POST` **once for `breathing-idle`** with all 8 directions. Poll.
Then `GET /characters/{id}` and download every frame from
`animations[].directions[].frames[]`.

If a direction's job comes back `failed`, re-submit just that direction — accept
that it lands in a small separate animation entry (there is no merge API).

---

## 6. Prompt defaults

### Universal suffix (append to every character prompt)
```
warm cozy pixel art, soft outlines, no pure black, earthy tones
```
### Universal steering (this endpoint has no negative field — phrase inline)
```
NOT pure black, NOT pure white, NOT harsh outlines, NOT neon, NOT anime style, NOT gradient shading
```
### Character prompt templates
Live in **HOMEWARD-STYLE-GUIDE.md §8** ("Character Prompt Templates"). Notable
hard rules from §2:
- **Obi: never write the word "beagle."** He is a beagle/Aussie-Shepherd/Cattle-
  Dog mix; "beagle" makes the model draw a stocky tricolor hound. Use the §2
  template and steer with `NOT a beagle, NOT stocky, NOT barrel-chested`.
- **Annie's hair** is "warm honey-brown with subtle golden highlights" — steer
  away from bright/anime yellow explicitly.
- **Luna** generates natively at 48–64 px now (the old 32-px-floor risk is
  retired).

---

## 7. Anti-patterns (the expensive lessons)

Every item here is a mistake made during Annie's generation. Re-reading this
section before generating John/Obi/Luna is the whole point of the doc.

### 7a. Never feed a portrait into `/create-character-pro`
The portrait is head + shoulders only. With `method: "create_with_style"` and a
portrait reference, the model has no body/back-of-head information and generates
a **second front-facing face** for the `north` slot — a character with two
different faces. Always do Step 2 (full-body south sprite) first, then Step 3
with `method: "rotate_character"`.

### 7b. Never submit animations one direction per call
`POST /characters/animations` with `directions: ["north"]` creates a whole
animation entry containing only `north` — 7 empty slots. Eight such calls = eight
fragmented animations. There is no API to merge or delete them. **One request,
all directions in the list.**

### 7c. Never misread incremental population as "dropped directions"
A multi-direction request fills directions one at a time over 5–15 minutes.
Seeing 5/8 after a few minutes is normal. It is NOT a batch-drop bug. Wait.

### 7d. Never resubmit while jobs are `processing`
Animation jobs take 60–180 s each. A short stall timeout that resubmits "because
nothing changed in 60 s" doubles the slot demand, causes 429s, and creates
duplicate animation entries. Poll the **job IDs** for deterministic status;
only resubmit a direction whose job is genuinely `failed`.

### 7e. Never overlap two 8-direction animation requests
8 + 8 slots > the ~14 cap. Finish `walking` before starting `breathing-idle`.

### 7f. Never send the Bearer token to a Backblaze URL
It returns 401. Backblaze download URLs are unauthenticated (§4h).

### 7g. Never send `view` to `/rotate`
HTTP 422. And remember `/rotate` only accepts 128/64/32/16 square canvases.

### 7h. Never re-anchor on AI output
New generations always reference the original hand-validated portrait, never the
most recent generation. Drift compounds after ~20 hops.

### 7i. Never commit the API token
Not in any doc, config, or commit message. If you see one checked in, tell the
user to rotate it.

### 7j. Never assume cloud retention
Download every PNG locally the moment a job is ready. PixelLab's cloud is not a
backup. `raw/` is committed to git.

---

## 8. Asset ingestion (where files go)

```
assets/
├── palette/homeward.gpl                      canonical palette
├── portraits/<char>/
│   ├── <char>-neutral.png                    approved portrait anchor
│   ├── raw/                                  all portrait candidates
│   └── GENERATION-LOG.md                     reproduction parameters
└── sprites/characters/<char>/
    ├── raw/                                  untouched PixelLab downloads
    │   ├── annie-overworld-<direction>.png   8 static rotations
    │   ├── walking/<direction>/<i>.png       animation frames
    │   ├── breathing-idle/<direction>/<i>.png
    │   └── _archive-*/                       superseded/broken sets, kept for reference
    ├── <char>.aseprite                       master file, tagged frames (cleanup step)
    ├── exports/                              final sprite sheets the engine loads
    └── GENERATION-LOG.md                     reproduction parameters + lessons
```

### Rules
- **`raw/` is committed to git** — generation costs credits; downloads are
  project assets. Never overwrite or hand-edit a `raw/` file.
- Keep a `GENERATION-LOG.md` per character: endpoints, methods, seeds,
  `character_id`, and what went wrong. Future sessions read it first.
- Superseded/broken generations go in a clearly-named `_archive-*/` subfolder,
  not deleted — the project keeps raw outputs for reference.
- `exports/` is what the engine loads; it never reads `raw/`.

### Aseprite cleanup gate (for shipped assets)
1. Open the raw PNG(s).
2. `Sprite > Color Mode > Indexed` with `homeward.gpl` loaded — snaps off-palette
   pixels; scan for unintended shifts.
3. Normalise canvases to a common anchor; repair drifted pixels / edge artifacts.
4. Set frame timings + tags (`idle`, `walk_n`, …).
5. Onion-skin walk cycles to check for foot-slip on the loop.
6. `File > Export Sprite Sheet` with Split Tags → PNG + JSON into `exports/`.

Placeholder/test assets may skip the gate; mark them for later replacement.

---

## 9. Account state (refresh with care)

As of 2026-05-15, the PixelLab account holds (among older experiments):

| `character_id` | Role | Status |
|---|---|---|
| `ad0fdc16-a374-4252-9209-c0750971c916` | **Annie — active overworld character.** 8 rotations + walk + idle, all 8 directions, `north` correct. | **Current.** Use this. |
| `e7ac9162-76d6-4fce-8a9e-cfbaf35f046c` | Annie v1 — the two-faced-`north` character. | Broken. Superseded; safe to `DELETE`. |
| `0f0f4956-…`, validation-test characters (`3b01fdb5`, `f30563b6`, `fe3dea3b`) | Pre-portrait prototypes / resolution-validation tests. | Superseded. |

Annie's master portrait: `assets/portraits/annie/annie-neutral.png`
(`/generate-image-v2`, seed 1337). It is the style anchor for John, Obi, Luna.

Local source of truth is the repo, not the account — `assets/.../raw/` plus the
`GENERATION-LOG.md` files. Treat this table as a hint; the account may have
stale experiments worth deleting.

---

## 10. Cross-references & maintenance

- **Visual decisions** (palette, sizes, character looks, prompt content):
  **HOMEWARD-STYLE-GUIDE.md §1–§8.** If this doc and the Style Guide disagree,
  the Style Guide wins.
- **Character lore & roster:** **HOMEWARD-GDD.md.**
- **How `exports/` sprite sheets are loaded:** **HOMEWARD-ARCHITECTURE.md.**
- **Per-character generation records:** the `GENERATION-LOG.md` files under
  `assets/portraits/` and `assets/sprites/characters/`.
- **Live REST docs:** `https://api.pixellab.ai/v2/llms.txt` (incomplete — trust
  §4 here over the published response shapes).

Update this doc when: PixelLab changes an endpoint or response shape; a new
anti-pattern is discovered; or the account's active character set changes. The
Style Guide gets visual-decision changes; this doc gets tool/process changes.

> **Tilesets and objects** were not exercised via REST this session. Earlier
> MCP-based tileset findings live in `assets/VALIDATION-TESTS-2026-05-13.md`.
> When the tileset pipeline is built out, document its REST recipe here.
