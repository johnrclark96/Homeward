# Homeward — PixelLab MCP Workflow

> The operational manual for using PixelLab from Claude Code to generate, iterate, and validate game art. Style decisions live in **HOMEWARD-STYLE-GUIDE.md** §2, §3, §8 — this doc is about *driving the MCP* once those rules are set. Read both before touching art.

---

## 0. Quick Status Check

Before doing any PixelLab work in a session, run these checks. They take 5 seconds and prevent a lot of wasted context.

```sh
# Is the server registered?
claude mcp list

# Are the tools loaded in this session? Look for any tool starting with mcp__pixellab__.
# If the deferred-tools list shows them, load schemas with:
#   ToolSearch({ query: "pixellab", max_results: 30 })
```

If `claude mcp list` shows `pixellab — Connected ✓`, you're set. If it shows `Needs authentication` or is missing entirely, see §1.

---

## 1. One-Time Setup

PixelLab MCP is a remote HTTP server. You authenticate with a bearer token from your PixelLab account.

### 1a. Get your token

1. Sign in at https://www.pixellab.ai/mcp
2. Copy your API token from the MCP install page.

### 1b. Register the server

Run **one** of these. `user` scope is recommended — the token then works across all projects on this machine and the secret is stored once.

```sh
# User scope — recommended (one token, all projects)
claude mcp add -s user -t http pixellab https://api.pixellab.ai/mcp -H "Authorization: Bearer YOUR_PIXELLAB_TOKEN"

# Or project-local scope (only this repo, secret stored in user-level config — does NOT commit to git)
claude mcp add -t http pixellab https://api.pixellab.ai/mcp -H "Authorization: Bearer YOUR_PIXELLAB_TOKEN"
```

> **Do not commit the token.** Neither scope writes the secret to a checked-in file (project scope uses `.claude.json` in the user dir, not `.mcp.json`). If you ever paste it into a doc or commit, rotate it.

### 1c. Restart Claude Code

Tool schemas are loaded on session start. Quit Claude Code and reopen this directory. In the new session the deferred-tools list will include `mcp__pixellab__*` entries. Load them with `ToolSearch({ query: "pixellab", max_results: 30 })` in one call (don't `select:` one tool at a time).

### 1d. Verify end-to-end

Run `mcp__pixellab__list_characters` with `limit: 1`. A successful empty-list response (or a list of past characters) confirms the token is good and quota is available. If you get a 401, the token is wrong or expired.

---

## 2. How PixelLab Actually Works

This is the mental model. Every recipe in §5 assumes you understand this.

### 2a. Credit math (verified against live schemas)

PixelLab does NOT have a flat "basic vs pro tier" applied to every tool. Cost varies per *call and parameters*. The real numbers from the live MCP schemas:

| Operation | Generations |
|-----------|-------------|
| `create_character` with `mode: "standard"` | **1** (regardless of 4 or 8 directions) |
| `create_character` with `mode: "pro"` | **20–40** (depending on size; smaller = cheaper; always 8 directions; ignores outline/shading/detail/proportions/ai_freedom) |
| `create_character_state` | ~1 (standard) or pro cost (matches source mode) |
| `animate_character` with `template_animation_id` | **1 per direction** (so 4 or 8) |
| `animate_character` with `action_description` (custom, no template) | **20–40 per direction** — schema explicitly requires user-confirmed `confirm_cost: true` |
| `animate_object` | ~30–60 seconds wallclock per direction; cost similar to template animations |
| `create_topdown_tileset`, `create_sidescroller_tileset` | Single job, ~100 seconds wallclock |
| `create_isometric_tile`, `create_map_object`, `create_tiles_pro` | Single job each |

**Implication for Homeward:** Most of our work is **standard mode** (1 generation per character). Pro mode is reserved for *production-final* characters where we feed Annie's portrait as `reference_image_base64` to lock the style. Iteration and validation tests should default to standard mode.

- **Tier 2 ("Pixel Artisan") allowance:** ~5,000 images/month worth of credits.
- **Revised Homeward budget:** dramatically below the earlier estimate. Most chapters of NPCs and props can be generated in standard mode (1 gen each) and only the four mains + a handful of hero enemies need pro mode treatment.

> Always pass `confirm_cost: true` on `animate_character` ONLY after the user has explicitly approved the cost. Schema mandates this — never set it on first call.

### 2b. Non-blocking jobs

`create_character`, `animate_character`, `create_topdown_tileset`, etc. **return immediately with a job ID.** The actual generation runs in the background. Approximate wallclock:

| Tool | Time |
|------|------|
| `create_character` 4-dir standard | 2–3 min |
| `create_character` 8-dir standard or pro | 3–5 min |
| `create_topdown_tileset`, `create_sidescroller_tileset` | ~100s |
| `create_isometric_tile`, `create_tiles_pro` | 10–30s |
| `create_map_object` | 30–90s |
| `animate_character` (per direction, template) | ~60s |

The pattern is always:

```
1. create_*           → returns { id, status: "processing" }
2. wait (do other work, or sleep 60-120s)
3. get_* (by id)      → returns status: "ready" + URLs, or still "processing"
4. download PNGs       → assets/...
```

Don't poll in a tight loop. Either do other work in between, or wait at least ~90 seconds before the first `get_*` call.

### 2b-bis. Canvas auto-expansion

`create_character` adds ~40% padding around the requested `size` to make room for animation frames. A `size: 48` request produces a **68×68 canvas** with the character centered at ~48px tall. This matters for ingestion — the raw PNG is NOT 32×48; it's a larger canvas with transparency. Aseprite cleanup includes cropping to our target dimensions (32×48 for humans, 32×32 for Obi, 24×32 for Luna).

### 2b-ter. Inline previews

`get_character`, `get_object`, `get_map_object`, etc. with `include_preview: true` (the default) return an actual preview image inline in the response. You can visually evaluate output without downloading first — useful for fast iteration. Download only when you decide to keep an asset.

### 2c. Downloads are unauthenticated

Once you have a download URL, you can fetch the PNG/ZIP with plain `Invoke-WebRequest` or `curl`. No bearer header needed — the UUID in the URL is the access key. This means future Claude sessions can pull asset files directly via Bash, no MCP call required.

**Two gotchas for ZIP downloads:**

1. **Use `curl --fail`** (or check that the file is >1KB). If you request a ZIP while animations are still rendering, the endpoint returns HTTP 423 with a JSON body. Plain `curl` will save the JSON to your `.zip` filename and you won't notice the corruption.
2. **Rotation PNGs always work.** If you only need individual direction PNGs (not the bundled ZIP), download them directly from the `Rotation Images` URLs returned by `get_character` — those don't have the pending-animation gating.

### 2d. Cloud storage is ephemeral

`create_map_object` artifacts are auto-deleted after 8 hours. Characters and tilesets persist longer but are not a backup. **Save every PNG to `assets/` locally the moment a job reports ready.** PixelLab's cloud is not our archive.

---

## 3. Tool Catalog

Naming in Claude Code: `mcp__pixellab__<tool>`. Costs are *approximate Pro-call estimates* — verify with `confirm_cost: true` on first use of each tool in a session.

### 3a. Characters & rotations

| Tool | Use when | Cost class |
|------|----------|------------|
| `create_character` | New character from text + reference. 4 or 8 directions in one shot. | Pro |
| `create_character_state` | New outfit/expression/pose variant of an existing character, preserving identity. | Pro |
| `animate_character` | Add walk/idle/attack cycle to an existing character. Skeleton animation. | Pro |
| `get_character` | Poll job status; get rotation URLs, animation list, ZIP download. | Free |
| `list_characters` | Browse what's already in your account. | Free |
| `delete_character` | Clean up failed experiments. Requires `confirm: true`. | Free |

### 3b. Top-down tilesets (Wang, 16-tile)

| Tool | Use when | Cost class |
|------|----------|------------|
| `create_topdown_tileset` | Two-terrain seamless transition (e.g., grass↔dirt). Pass `lower_base_tile_id` / `upper_base_tile_id` to chain with a previous tileset for cross-area consistency. | Pro |
| `get_topdown_tileset` | Poll, retrieve PNG + base tile IDs. | Free |
| `list_topdown_tilesets` | Browse. | Free |
| `delete_topdown_tileset` | Clean up. | Free |

### 3c. Sidescroller tilesets

| Tool | Use when | Cost class |
|------|----------|------------|
| `create_sidescroller_tileset` | We **don't ship sidescroller content** — Homeward is top-down. Skip unless we ever do a sidescroller flashback. | Pro |
| `get_sidescroller_tileset` | (n/a for now) | Free |

### 3d. Isometric tiles

| Tool | Use when | Cost class |
|------|----------|------------|
| `create_isometric_tile`, etc. | **n/a for Homeward** — we are pure top-down. Do not use without a design change. | Pro |

### 3e. Map objects & general objects

| Tool | Use when | Cost class |
|------|----------|------------|
| `create_map_object` | Single decoration with transparent background (mailbox, sign, bench, lamppost, bush). Auto-deleted in 8h → download immediately. | Basic-to-Pro |
| `create_object` | Multi-frame / multi-directional prop (animated fountain, rotating fan, interactable that has open/closed states). | Pro |
| `animate_object` | Add animation cycle to existing object. | Pro |
| `create_object_state` | Variant preserving style (e.g., closed mailbox → open mailbox with flag up). | Pro |
| `select_object_frames` | Promote chosen frames from a multi-frame generation into separate canonical objects. | Free |
| `get_*` / `list_*` / `delete_*` / `dismiss_review` | Standard management. | Free |

### 3f. Pro tiles (advanced)

| Tool | Use when | Cost class |
|------|----------|------------|
| `create_tiles_pro` | Advanced tile generation with style images and view-angle control. Probably overkill for v1; revisit if standard `create_topdown_tileset` outputs aren't matching style. | Pro |

---

## 4. Homeward Parameter Defaults

Use these defaults on every call unless you have a specific reason to deviate. They encode our style decisions so we don't have to re-argue them per generation.

### 4a. Universal prompt suffix and negative

```
suffix:   warm cozy pixel art, soft outlines, no pure black, earthy tones
negative: pure black, pure white, harsh outlines, neon colors, anime style, gradient shading
```

### 4b. Character calls — `create_character`

| Parameter | Default for Homeward | Why |
|-----------|----------------------|-----|
| `mode` | `standard` for iteration & NPCs; `pro` only for final production mains with `reference_image_base64` set to Annie's portrait | Standard = 1 generation. Pro = 20–40. See §2a. |
| `body_type` | `humanoid` (Annie/John/NPCs), `quadruped` (Obi → `template: "dog"`, Luna → `template: "cat"`) | |
| `n_directions` | `4` for prototyping, `8` for production mains and NPCs you'll actually animate | 4-dir is faster + same 1-gen cost in standard mode. Style guide §2 requires 8-dir for shipped player characters. |
| `size` | `48` for Annie/John/NPCs, `32` for Obi, **`32` for Luna** (re-canvas to 24×32 in Aseprite — see §7c) | Remember canvas auto-expands ~40% (size 48 → 68px canvas, §2b-bis). |
| `proportions` | `{"type": "preset", "name": "chibi"}` (humanoid only; ignored for quadrupeds and pro mode) | Matches the GDD character feel |
| `outline` | **`single color outline`** — explicitly override; the API default is `single color black outline` which violates Style Guide §3 | Outlines must be color-contextual, never pure black. Ignored in pro mode. |
| `shading` | `basic shading` | Cozy aesthetic, no gradients. Ignored in pro mode. |
| `detail` | `medium detail` | Ignored in pro mode. |
| `view` | `low top-down` | Matches our overworld camera (NOT `high top-down` which is RTS-style) |
| `reference_image_base64` | (pro mode only) Base64 of Annie's master south-facing PNG | Locks style consistency across the cast. |

### 4c. Tileset calls — `create_topdown_tileset`

| Parameter | Default for Homeward | Why |
|-----------|----------------------|-----|
| `tile_size` | **`{ width: 32, height: 32 }`** — explicitly override; the API default is 16×16 | Style guide §1. 16×16 is too small for our cozy detail level. |
| `view` | **`low top-down`** — explicitly override; the API default is `high top-down` (RTS angle) | Style guide §4. RPG camera. |
| `outline` | `lineless` for grass/water; `single color outline` for paths/floors | Match how we want edges to read |
| `shading` | `basic shading` | |
| `detail` | `medium detail` | |
| `transition_size` | **discrete values only**: `0.0`, `0.25`, `0.5`, or `1.0`. `0.25` for natural terrain blends; `0.5` for wider blends; `0.0` for sharp man-made edges (wall meets floor); `1.0` produces 23 tiles instead of 16. | API rejects arbitrary floats. |
| `transition_description` | Required whenever `transition_size > 0` | |
| `text_guidance_scale` | leave default (`8.0`) | Higher = more literal to prompt, less style consistency. Don't tune unless reroll fails. |

### 4d. Map object calls — `create_map_object`

| Parameter | Default | Why |
|-----------|---------|-----|
| `view` | `high top-down` for small props (flowers, signs); `low top-down` for tall props (lampposts, trees) | Matches camera |
| `outline` | `single color outline` | |
| `shading` | `medium shading` | |
| `detail` | `medium detail` | |

### 4d. Known existing assets (account state — refresh with `list_characters` if stale)

As of the last verified check, the PixelLab account has at least one character on it:

| ID | Description | Specs | Notes |
|----|-------------|-------|-------|
| `0f0f4956-f824-4d30-9a93-b0ff3366ca6c` | chibi girl with long warm honey-blonde wavy hair, kind round face, red sweater — created with standard mode, selective outline | 4 directions (S/E/N/W), 68×68 canvas, ~48px tall, low top-down | **Annie prototype.** Visually reads as Annie. Decide before any new generation: promote to working anchor, or regenerate as 8-direction pro-mode for true production anchor. Either decision is valid; document the choice in CLAUDE.md so future sessions don't re-debate. |

Always run `mcp__pixellab__list_characters` at session start. Treat this table as a hint, not gospel.

### 4e. Required style anchor

Almost every character/object generation should reference Annie's master 64×64 portrait as the style anchor (style guide §8 — "Portrait-First"). Workflow:

1. The first time in any session you generate a character, check `list_characters` for an entry tagged `master-anchor-annie-portrait` or similar.
2. If it doesn't exist yet, **stop and tell the user.** The portrait must be hand-validated before it can anchor anything. Do not auto-generate the anchor.
3. Once it exists, pass its ID as the style reference in subsequent calls (specific parameter name depends on the tool — `style_images` for `create_tiles_pro`, `state_of` for object variants, character-id linking for `create_character_state`).

---

## 5. Recipe Book

Step-by-step procedures for the iteration loops a Claude Code session will actually run.

### 5a. Recipe — "Test how a new NPC looks in-game"

Use case: GDD specifies a new NPC; we want a placeholder sprite running around the test map ASAP, polish later.

```
1. Check the GDD section for the NPC's description and signature look.
2. mcp__pixellab__create_character with:
     description: "<GDD description> + universal suffix"
     n_directions: 4   # fast mode — 4 dirs is enough for placeholder
     size: 48
     body_type: humanoid
     proportions: chibi
     outline: "single color outline"
     view: "low top-down"
     style_reference: <Annie portrait anchor ID>
3. Note the returned character_id. Set a 90-second timer or do other work.
4. mcp__pixellab__get_character(character_id) — repeat until status: "ready".
5. Download the ZIP from the returned URL into assets/sprites/npc/<name>/raw/.
6. Unzip; preview the front-facing PNG to confirm it's roughly right.
7. If acceptable: drop into the test map. Skip Aseprite cleanup for placeholder status.
8. If wrong: try create_character_state with edit_description, or full reroll with refined prompt.
```

> **For production NPCs**, use `n_directions: 8` and follow §7 ingestion fully (Aseprite palette snap, frame cleanup, tagged export).

### 5b. Recipe — "Generate a placeholder tileset for a new area"

Use case: We're building out Chapter 1 (Kentucky). We need a grass/dirt-path tileset to lay down a map.

```
1. mcp__pixellab__create_topdown_tileset:
     lower_description: "soft green grass, cozy meadow, small flower specks"
     upper_description: "warm sand dirt path, well-worn earth"
     transition_size: 0.3
     transition_description: "scattered pebbles and small grass tufts at edge"
     tile_size: { width: 32, height: 32 }
     view: "low top-down"
     outline: "lineless"
     shading: "basic shading"
     + universal suffix
2. Capture the returned tileset_id AND base_tile_ids — you need both for chaining.
3. Wait ~2 min. mcp__pixellab__get_topdown_tileset(tileset_id) to confirm ready.
4. Download to assets/tiles/<area>/raw/<area>-grass-dirt.png.
5. For a related tileset in the same area (e.g., grass→stone path), call create_topdown_tileset AGAIN passing the previous grass base_tile_id as lower_base_tile_id — this chains the new tileset to look stylistically continuous with the first.
6. Repeat for every terrain pairing the area needs (style guide §4 lists categories).
```

### 5c. Recipe — "Add a single decoration (mailbox, sign, lamppost)"

```
1. mcp__pixellab__create_map_object:
     description: "<object> + style suffix"
     width: 32, height: 32  (or 32×48 for tall props)
     view: "high top-down" for short props, "low top-down" for tall props
     outline: "single color outline"
2. Wait ~90s, get_map_object, download to assets/sprites/objects/<area>/raw/.
3. Object auto-deletes from PixelLab cloud in 8h — local save is mandatory.
```

### 5d. Recipe — "Regenerate one bad direction in a rotation"

When 7 of 8 directions look fine but one is broken (common with accessory items like Obi's bandana).

```
1. Identify the bad direction — visually inspect each PNG in the rotation.
2. mcp__pixellab__create_character_state:
     character_id: <existing character>
     edit_description: "fix west-facing view: <specific issue, e.g. 'bandana clips through neck'>"
3. Crop the corrected direction into the rotation sheet manually in Aseprite (or via tools/ script).
```

> If 3+ directions are bad, it's cheaper to reroll the whole character with a refined prompt than to patch.

### 5e. Recipe — "Iterate on a sprite that's 90% right"

The cheap-iteration path. Avoid full rerolls when possible.

```
- Use create_character_state with a precise edit_description. Costs 1 Pro call instead of N.
- For multi-frame objects, use create_object_state similarly.
- For tilesets that look 90% right but the transition is wrong, regenerate the tileset with the same base_tile_ids but a different transition_description — keeps base tiles, only re-paints transitions.
```

### 5f. Recipe — "Cost-check before a batch run"

Before kicking off a sweep (e.g., "generate all 18 NPCs"), confirm budget:

```
1. mcp__pixellab__list_characters with limit: 100 — count what already exists; don't regenerate accidentally.
2. Estimate: 18 NPCs × 40 credits × 1.3 overhead = ~940 credits. State this to the user.
3. Always pass confirm_cost: true on first call of a batch — let the API return its actual estimate and surface it.
4. Get user OK before launching the rest.
```

---

## 6. Asset Ingestion (Where Files Go)

```
assets/
├── palette/
│   └── homeward.gpl            # canonical palette (already exists)
├── sprites/
│   ├── characters/
│   │   ├── annie/
│   │   │   ├── raw/            # untouched downloads from PixelLab
│   │   │   ├── annie.aseprite  # master file with tagged frames
│   │   │   └── exports/        # final sprite sheet PNGs + JSON
│   │   ├── john/   …
│   │   ├── obi/    …
│   │   └── luna/   …
│   ├── npc/<name>/{raw,exports}
│   ├── enemies/<name>/{raw,exports}
│   └── objects/<area>/{raw,exports}
├── tiles/
│   └── <area>/{raw,exports}
└── portraits/
    └── <character>-<expression>.png
```

### Rules

- **Always save raw PixelLab downloads to `raw/`** — never overwrite, never edit. They are the source of truth in case Aseprite cleanup goes wrong.
- **`raw/` is committed to git.** Generation isn't free; we treat downloads as project assets.
- **`exports/` is what the game engine loads.** The engine never reads `raw/`.
- **The `.aseprite` master file is the canonical mid-step.** All tags, frame timing, palette snapping live there. PNGs in `exports/` are produced by `File > Export Sprite Sheet` with Split Tags.
- **Naming follows style guide §9.** Don't invent new conventions.

### Aseprite gate

For *production* assets (anything actually shipped in a chapter), every raw download MUST go through the Aseprite cleanup gate before becoming an `exports/` file:

1. Open raw PNG.
2. `Sprite > Color Mode > Indexed` with `assets/palette/homeward.gpl` loaded. Pixels off-palette get snapped — visually scan for any unintended color shifts after the snap.
3. Manually repair drifted pixels, broken accessories, semi-transparent edge artifacts.
4. Set frame timings + tags (`idle`, `walk_n`, `walk_s`, etc.).
5. Save the `.aseprite` file.
6. `File > Export Sprite Sheet` → PNG + JSON into `exports/`.

For *placeholder* assets (test sprites used during prototyping), you can skip the gate and ship the raw PNG. Mark them with a comment in the game data so we know they need replacement before the chapter ships.

---

## 7. Anti-Patterns (DO NOT)

These mistakes are expensive in credits, time, or quality. Style guide §8 has more — these are the ones specific to running the MCP from Claude Code.

### 7a. Never re-anchor on AI output

The style reference for new generations is **always the original hand-validated Annie portrait**, not the most recent generation. Drift compounds; using the last batch as the anchor for the next batch produces visible style decay after ~20 hops.

### 7b. Never say "beagle" for Obi

He is 50% beagle + Aussie Shepherd + Cattle Dog. AI will hallucinate a stocky tricolor hound if you say "beagle." Use the exact prompt template in style guide §2 ("Obi"). Always include the negative: `beagle, hound, stocky, barrel-chested, tricolor, black patches`.

### 7c. Never generate Luna at her final size (24×32)

PixelLab degrades sharply below 32×32. Generate Luna at 32×32 with the cat filling the frame, then re-canvas to 24×32 in Aseprite. Style guide §2 ("Luna") and §8 cover this.

### 7d. Never assume cloud retention

`create_map_object` artifacts vanish after 8 hours. Even longer-lived asset types are not a backup. Download immediately, commit to git after the Aseprite gate (or to `raw/` for placeholders).

### 7e. Never run a batch >5 generations without user confirmation

5 generations in standard mode = ~5 credits (cheap). 5 generations in pro mode = ~100–200 credits = real money. Always state the mode and estimated cost before launching a batch, then get a "go."

### 7e-bis. Never set `confirm_cost: true` on first call to `animate_character` with a custom (non-template) animation

The schema explicitly mandates this. First call without `confirm_cost`, surface the cost to the user, get explicit approval, then call again with `confirm_cost: true`. Template animations don't need this; custom (`action_description` only) animations cost 20–40 generations per direction.

### 7f. Never commit the API token

Not in CLAUDE.md, not in this doc, not in a config file in the repo, not in a commit message. If you ever see one anywhere checked-in, rotate it immediately and tell the user.

### 7g. Never use pure black or pure white in any prompt

The universal negative prevents this, but if you find yourself writing `pure black outline` or `pure white background`, stop — use `Charcoal outline (#3A2E28)` and `Cream background (#FFF8F0)` or `transparent background`. Style guide §3.

### 7h. Don't poll in a tight loop

`get_character` immediately after `create_character` will say "processing." Wait ~90 seconds at minimum. If you have other work, do it first. Repeated rapid polls waste context and don't speed up generation.

---

## 8. Verifying Setup Health

Run this as a smoke test once per session if you're going to do real PixelLab work:

```
1. claude mcp list                              → confirms server registered + connected
2. ToolSearch({ query: "pixellab", max_results: 30 })  → loads all schemas
3. mcp__pixellab__list_characters with limit: 5 → confirms auth + quota
4. (Optional) mcp__pixellab__get_character(<known good ID>) → confirms reads work
```

If step 3 returns a 401, the token is stale — re-run `claude mcp add` with a fresh token from pixellab.ai.

If step 1 shows the server but step 3 errors with a transport issue, the URL may have changed — verify against https://www.pixellab.ai/mcp.

---

## 9. Cross-References

- **Visual decisions** (palette, sizes, character looks, prompt content, style anchor strategy): **HOMEWARD-STYLE-GUIDE.md §1–§8.** When this doc and the style guide disagree, the style guide wins.
- **Character lore & enemy roster** (what to generate for which chapter): **HOMEWARD-GDD.md.**
- **How sprite sheets are loaded by the engine** (what format `exports/` needs to be in): **HOMEWARD-ARCHITECTURE.md.**
- **PixelLab MCP source docs** (when this file is out of date): https://www.pixellab.ai/mcp and https://api.pixellab.ai/mcp/docs

---

## 10. Maintenance

This doc was written 2026-05-13. Update it when:

- PixelLab adds or removes tools (compare against api.pixellab.ai/mcp/docs).
- Credit pricing changes — update §2a.
- The Annie portrait master anchor is regenerated — note the new asset ID somewhere stable.
- The Aseprite cleanup gate changes (new linter, new palette validation script in `tools/`).
- We find a new anti-pattern by burning credits on it.

The style guide gets updated for visual decisions; this doc gets updated for tool/process changes. Don't mix them.
