# Annie Portrait — Generation Log

This file records the exact parameters used to generate Annie's master portrait. Future character generations (John, Obi, Luna) chain off this anchor — they should match its pixel style, palette, outline treatment, and overall warmth.

## Approved Anchor: `annie-neutral.png`

| Field | Value |
|---|---|
| Source candidate | `raw/annie-portrait-candidate-1337.png` |
| Approved on | 2026-05-13 |
| Approved by | John (project owner) |
| Endpoint | `POST https://api.pixellab.ai/v2/generate-image-v2` |
| Method | Async background job (poll `GET /background-jobs/{id}`) |
| `image_size` | `{ "width": 128, "height": 128 }` |
| `no_background` | `true` |
| `seed` | `1337` |
| Background job ID | `ae52e176-ab5b-4601-8686-62d7641d45cc` |
| Cost | ~1 generation (basic image-gen, not Pro) |

### Description (verbatim)

```
chibi pixel art girl portrait, head and shoulders, long warm honey-brown wavy hair past shoulders with subtle golden highlights, NOT bright yellow, NOT anime yellow, warm brown undertones, kind round face, big warm hazel eyes, genuine warm smile, rosy cheeks, red sweater visible at shoulders, cozy warm lighting, facing forward, pixel art style with clear individual pixels visible, retro RPG portrait, warm earthy tones, soft warm-brown contextual outlines, NO black outlines, no pure black, no pure white
```

### Why this candidate won

Compared against the other three candidates (seeds 0, 42, 2024), seed 1337:

1. **Genuine warm smile** — open, kind, approachable. This is the neutral-warm anchor expression all other portraits (happy / determined / etc.) chain from, so it must read canonically warm without being flat or posed.
2. **Cleanest Annie Red** sweater — closest to spec `#D85040`. seed 2024 drifted toward terracotta.
3. **Hair tone squarely honey-brown** — no drift toward the anime-yellow risk the Style Guide warns about (seed 2024 leaned that way). No drift toward auburn (seed 0 leaned that way).
4. Visible hair wave; chibi proportions; soft contextual outlines; warm earthy palette; passes the Cozy Test.

## Generation Run Context

All 4 candidates were generated in a single batch via `tools/generate-annie-portrait.js` on 2026-05-13. The other three raw PNGs are retained in `raw/` for future reference (e.g., if we ever need an expression variant that fits one of those compositions better).

| Seed | Job ID | Saved to |
|---|---|---|
| 0    | `2db3bf0b-e65e-4feb-a704-2d2a68588cf4` | `raw/annie-portrait-candidate-0.png` |
| 42   | `6df77b11-06e1-40b4-951b-040ad6ec2194` | `raw/annie-portrait-candidate-42.png` |
| **1337** | `ae52e176-ab5b-4601-8686-62d7641d45cc` | `raw/annie-portrait-candidate-1337.png` → **`annie-neutral.png`** |
| 2024 | `aa8b3171-2a60-4610-8f61-ab93760636f0` | `raw/annie-portrait-candidate-2024.png` |

## Reproducing the Style

To generate a new character (John, Obi, Luna, NPCs) in this same visual language:

1. Pass `annie-neutral.png` as a style reference (base64-encoded under the appropriate field — e.g., `reference_image` on `/create-character-pro`, or `style_image` on `/generate-image-v2`).
2. Keep the universal prompt suffix consistent: `warm cozy pixel art, soft outlines, no pure black, earthy tones`.
3. Keep the universal negative cues consistent: `pure black, pure white, harsh outlines, neon colors, anime style, gradient shading`.
4. Re-anchor against this file every ~20 generations to catch style drift before it compounds.

## Downstream Assets That Chain From This Anchor

- Annie overworld sprite (64×96, 8-direction) — generated next via `/create-character-pro` with this portrait as style reference.
- Annie walk + idle animations — derived from the overworld sprite.
- Annie expression variants (happy, sad, surprised, thinking, determined) — likely inpainted off this portrait rather than re-generated from scratch.
- John, Obi, Luna portraits — generated fresh but using this file as the style anchor to keep palette/outline treatment/warmth consistent.
