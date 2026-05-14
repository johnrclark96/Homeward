# Homeward — PixelLab Validation Tests, 2026-05-13

Four standard-mode generations validating the new 960×540 / 64×64-tile resolution against PixelLab's
output quality. All tests ran at 1 generation each (~4 credits total).

---

## Test 1 — Annie south-facing overworld sprite (baseline) — **PASS**

- **ID:** `3b01fdb5-21d8-4bd4-bc12-a49e70e1d2d3`
- **Files:** `annie-test1-size96-{south,east,north,west}.png`
- **Params:** mode=standard, body_type=humanoid, n_directions=4, size=96,
  proportions=chibi, outline=single-color, shading=basic, detail=medium, view=low top-down
- **Actual canvas:** 136×136, character ~81px tall × ~61px wide
  (Workflow §2b-bis was right; the create-response message saying "96×96" is misleading —
  the returned size is the auto-expanded canvas, ~40% larger than the request)
- **Visual:** long flowing blonde hair past shoulders, readable big eyes, red sweater,
  dark legs, chibi proportions (head ~38% of body)
- **vs existing anchor `0f0f4956` (68×68):** dramatic detail improvement; face actually
  readable; hair trends honey-blonde rather than the orange-yellow drift §4d warns about —
  organic improvement, no prompt change needed
- **Palette compliance:** no pure black/white visible, soft contextual outlines
- **Concern for production:** character at 81px tall vs. 96px target. Final 64×96 crop will
  work via Aseprite, but for cleaner downsamples we may want `size: 128` (canvas ~180×180,
  character ~108 tall) in production.
- **Recommendation:** Keep this prompt for now. For the production-anchor portrait pass,
  generate at `size: 128` and use `mode: pro` once the master 128×128 portrait exists.

---

## Test 2 — Obi (animal quality gate) — **PASS WITH ITERATION NEEDED**

- **ID:** `f30563b6-29a5-4a71-8935-cf9354fc650c`
- **Files:** `obi-test2-size64-{south,east,north,west}.png`
- **Params:** mode=standard, body_type=quadruped, template=dog, n_directions=4, size=64,
  outline=single-color, shading=basic, detail=medium, view=low top-down
- **Actual canvas:** 92×92, character ~55px tall × ~41px wide (size 64 → ~92×92 canvas)
- **South view:** brown head + floppy brown ears ✅, body white ✅, but **blue bandana barely
  readable** (appears as a pale cream/white shape; signature blue identifier is missing).
  Speckling minimal from this angle. Chibi-skewed head looks "puppyish."
- **East/West profile views (much stronger):** clear lean athletic mid-size dog silhouette ✅,
  long legs ✅, floppy brown ears ✅, visible dark speckling on white back/flanks ✅. This is
  the silhouette the Style Guide asks for.
- **North view (back):** speckling visible, dark band at neck (could be collar or bandana,
  but doesn't read as the bright `#4878B0` blue).
- **vs old Obi v1 size 32:** quality jump is **dramatic.** Old Obi was a tiny indistinguishable
  head+blob; new Obi reads as a specific kind of dog. The doubled resolution did exactly what
  we hoped.
- **Production iteration list:**
  - Bandana: prompt with explicit color, e.g. `bright royal blue bandana around neck,
    blue color #4878B0, clearly tied at throat`
  - Speckling: emphasize count, e.g. `8-12 dark brown ticking spots scattered across white back`
  - Head/body proportions: front views skew puppy-like — try without `chibi`-implying language
    for adult-runner build
  - 1-2 standard-mode rerolls before any pro-mode investment

---

## Test 3 — Luna (former highest-risk asset) — **PASS (headline win)**

- **ID:** `fe3dea3b-003b-45c4-9331-a41fb867c0f1`
- **Files:** `luna-test3-size64-{south,east,north,west}.png`
- **Params:** mode=standard, body_type=quadruped, template=cat, n_directions=4, size=64,
  outline=single-color, shading=basic, detail=medium, view=low top-down
- **Actual canvas:** 92×92, character ~55px tall × ~41px wide
- **South view:** tall pointed ears ✅ (clear silhouette feature), warm tabby coat ✅,
  face M-pattern, pink nose visible. Upright/frontal pose reads slightly chunky/round —
  not "sleek."
- **East/West profile views (excellent):** strong vertical tabby stripes across body ✅,
  tall pointed ears ✅, long upright tail ✅, lean muscular bengal silhouette ✅. Exactly
  the §2 spec.
- **vs old Luna v1 size 32:** old Luna was barely distinguishable detail. The May 2026
  resolution doubling **resolves the "highest-risk asset" concern completely** — no need
  for Retro Diffusion fallback, no need for re-canvasing. Luna can be generated natively
  in the same standard-mode pipeline as the others.
- **Production iteration list:** mostly fine. South view could be pulled away from
  chibi-front. Body stripe color is dark warm brown ✅ (matches the §2 updated guidance to
  use `#503020`-style dark brown, not nearly-black).

---

## Test 4 — Wicker Park apartment tileset — **PASS WITH CRITICAL PIPELINE FINDINGS**

- **ID:** `a639c748-4b19-4f56-9cab-d01f2ec54f6d`
- **Files:** `wicker-park-test4-32px.png` (128×128, 4×4 grid of 16 tiles at 32×32 each),
  `wicker-park-test4-32px.json` (Wang metadata)
- **Params:** transition_size=0 (sharp wall/floor edge), tile_size=32×32, view=low top-down,
  outline=lineless, shading=basic, detail=medium
- **Visual:** honey-warm wood plank floor ✅, cream wall area ✅, no pure black ✅, clean
  Wang corner combinations. **Wall doesn't show clear baseboards** despite being in the
  prompt. Tiles feel a bit flat overall.

### Two critical workflow-doc bugs surfaced

1. **`create_topdown_tileset` accepts only `width/height: 16 or 32` — not 64.** Workflow §4c
   instructs to override the default with 64×64; this fails with `pydantic literal_error`.
   Either we (a) generate at 32 and upscale 2× in Aseprite to reach our 64-game-px target,
   or (b) switch to `create_tiles_pro` (max tile 128px) for native 64-px tiles. For (b) we
   trade Wang autotiling format for numbered-tile pro generation — fine for sharp-edge
   indoor tiles where Wang isn't necessary, but blocks the clean grass↔dirt outdoor Wang flow.
2. **The PNG download URL documented in `get_topdown_tileset`'s response is wrong** —
   `https://api.pixellab.ai/mcp/tilesets/{id}/image` returns 404. The actual CDN URL is in
   the metadata JSON's `spritesheet_url` field (`backblaze.pixellab.ai/file/pixellab-tiles/...`).
   Save the JSON, parse it, then download from `spritesheet_url`.

---

## Overall Assessment

**Does 64×64 solve the detail problem? Yes, dramatically.** The resolution doubling delivered
what it was supposed to:
- Annie's hair runs honey-blonde (not orange-yellow) for free
- Obi reads as a specific lean-athletic dog, not "generic puppy blob"
- Luna's profile views are strong; the "highest-risk asset" label is fully retired

**Most-iteration character:** Obi. South view bandana clarity is the weakest single failure.
Profile views are already good. 2-3 standard rerolls with sharper bandana/speckling language
should get him production-ready without pro mode.

**Ready for production generation? Not quite.** We need to clear two gates first:

1. **Generate the master Annie 128×128 portrait** (Style Guide §8 "Portrait-First"). All four
   tests today were the overworld sprite path; production wants portrait → overworld via
   style reference (pro mode). The portrait must be hand-validated before it anchors anything
   (Workflow §4e). This is the next step.
2. **Decide tileset pipeline:** 32px Wang + 2× upscale, or 64px `create_tiles_pro` losing
   Wang format. Recommendation: `create_tiles_pro` for indoor tilesets (sharp edges, no Wang
   needed) and 32→upscale for outdoor terrain Wang transitions. Both warrant a small follow-up test.

### Credit budget for four main characters at production quality

| Asset | Mode | Credits |
|---|---|---|
| Annie master portrait (pro, 128×128) | pro | ~40 |
| Annie overworld 8-dir (pro w/ portrait ref, size 128) | pro | ~40 |
| John overworld 8-dir (pro w/ Annie ref, size 128) | pro | ~40 |
| Obi overworld 8-dir (pro w/ Annie ref, size 64) | pro | ~20 |
| Luna overworld 8-dir (pro w/ Annie ref, size 64) | pro | ~20 |
| Walk + idle skeleton animations (4 chars × ~2 templates × 8 dirs × 1) | standard | ~64 |
| Iteration overhead (~40% — Obi bandana, etc.) | mixed | ~100 |
| **Total** | | **~325 credits** |

Well within Tier 2's monthly allowance.

---

## Documentation bugs to fix in HOMEWARD-PIXELLAB-WORKFLOW.md

1. **§4c** — change tileset `tile_size` default from 64×64 to 32×32, document that 64 is
   rejected, and add a "64-px pipeline" note (Pro tiles vs upscale).
2. **§2c / §3b** — note that `get_topdown_tileset`'s shown PNG URL 404s; use `spritesheet_url`
   from the metadata JSON.
3. **§2b-bis** — confirm the auto-expand math (~40% canvas padding) is still correct;
   size 64 → 92, size 96 → 136. The create-response's "Canvas size" line in the API output
   is misleadingly the *request* size, not the actual auto-expanded canvas.

---

## Operational lesson

The Workflow doc's "wait 90+ seconds before first get_*" guidance encouraged a habit of
queueing an explicit 120s background sleep before polling. In practice the API only documents
"typically 2-5 minutes" as a single broad range, my own reasoning + tool-call latency between
requests eats 20-60s of wall clock anyway, and polling `get_character` is free. Better pattern
going forward: queue → continue with productive work (next test, doc reading, downloads) →
poll directly when I naturally circle back. Only sleep if the first poll returns "still
processing."
