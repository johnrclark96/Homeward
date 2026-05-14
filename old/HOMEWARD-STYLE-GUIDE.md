# Homeward — Style Guide

> The visual bible for the game. Every sprite, tile, UI element, and color choice references this document. When in doubt, check here.

---

## 1. Resolution & Scale

### Display

| Property | Value | Rationale |
|----------|-------|-----------|
| Native resolution | **480 × 270 px** | The "pixel-perfect" canvas size. All art is created at this scale. |
| Scale factor | **4×** | Rendered at 1920 × 1080 on modern displays. Every game pixel = 4 screen pixels. |
| Fallback scale | **3× (1440×810), 2× (960×540)** | For smaller windows or lower-res screens. Engine handles this automatically. |
| Aspect ratio | **16:9** | Standard widescreen. No letterboxing needed on modern displays. |

### Why 480×270?

It's the largest native resolution that still scales cleanly to 1080p (×4) while keeping individual pixels visible and distinct. At this size with 32×32 tiles, you see approximately 15 × 8.4 tiles on screen — enough to explore comfortably without the world feeling cramped. Characters at 32×48 are clearly expressive, and environmental details read well.

### Tile Grid

| Property | Value |
|----------|-------|
| Tile size | **32 × 32 px** |
| Tiles visible (horizontal) | ~15 |
| Tiles visible (vertical) | ~8.4 |
| Map unit | 1 tile = 32px = one "step" of grid movement |

### Why 32×32 tiles (not 16×16)?

Three reasons:

1. **PixelLab quality.** AI generation at 32×32 produces significantly better results than 16×16 — more detail, fewer artifacts, better consistency across style-referenced batches.
2. **Character expression.** At 32×48, characters can have visible facial features, distinct clothing details, and readable emotional states from sprite alone — critical for a game where the characters' feelings ARE the point. At 16×16, faces are 4-5 pixels across and emotions are unreadable without portraits.
3. **Environmental richness.** 32×32 tiles can show wood grain, individual flowers, brick patterns, and furniture details. The game world needs to feel cozy and lived-in, not abstract.

---

## 2. Character Sprites

### Dimensions

| Character | Sprite size | Grid footprint | Notes |
|-----------|------------|----------------|-------|
| Annie | 32 × 48 px | 1 × 1.5 tiles | Standard human proportions, slightly chibi. Head is ~40% of body height. |
| John | 32 × 48 px | 1 × 1.5 tiles | Same proportions as Annie, slightly broader shoulders. |
| Obi | 32 × 32 px | 1 × 1 tile | Beagle proportions. Low to the ground, long ears. |
| Luna | 24 × 32 px | ~0.75 × 1 tile | Smaller than Obi. Cats are sleek. Bengal markings, tall ears. |
| NPCs | 32 × 48 px | 1 × 1.5 tiles | Same as player characters for visual consistency. |

### Proportions (Human Characters)

```
    ┌────┐
    │head│  ~14px tall (includes hair)
    ├────┤
    │body│  ~20px tall (torso + arms)
    ├────┤
    │legs│  ~14px tall (legs + feet)
    └────┘
    32px wide
```

- **Head:** Round-ish, ~14px tall including hair. Eyes are 2px dots or small ovals. Mouth is 1-2px. Hair defines the character silhouette — Annie's blonde hair and John's darker hair should read clearly even at distance.
- **Body:** Simplified torso. Annie's red sweater/top, John's characteristic shirt. Arms at sides or slightly animated.
- **Legs:** Simple 2-frame walk cycle minimum. 4-frame for smoother animation.

### Sprite Sheets Required (Per Character)

| Animation | Frames | Directions | Total frames |
|-----------|--------|------------|-------------|
| Idle | 2 | 8 | 16 |
| Walk | 4 | 8 | 32 |
| Interact | 2 | 4 (front/back/left/right) | 8 |
| Special ability | 3-4 | 4 | 12-16 |
| Battle idle | 2 | 1 (facing right) | 2 |
| Battle attack | 3-4 | 1 | 3-4 |
| Battle hurt | 2 | 1 | 2 |
| **Total per character** | | | **~75-80 frames** |

For Obi and Luna, add: sit, sleep, run, sniff/perch, and reaction poses (happy, startled, etc.)

### Silhouette Test

Every character must be identifiable from their silhouette alone at 1× scale. This means:
- Annie: hair shape + sweater color
- John: build + hair + stance
- Obi: ear shape + body proportions + bandana color
- Luna: tall ears + tail + sleek body + smaller size

---

## 3. Color Palette

### Primary Palette — "The Cozy Ramp"

The game's base palette is warm and earthy. These are the colors that define the default mood.

| Name | Hex | Usage |
|------|-----|-------|
| Cream | `#FFF8F0` | Lightest background, UI panels, text boxes |
| Warm Sand | `#F0E0C8` | Secondary backgrounds, paths, light wood |
| Soft Tan | `#D4B896` | Dirt paths, wood furniture, warm shadows |
| Warm Brown | `#A07850` | Dark wood, tree trunks, outlines (warm areas) |
| Deep Brown | `#6B4830` | Darkest outlines, hair, deep shadows |
| Charcoal | `#3A2E28` | Text, darkest UI elements (never pure black) |

### Nature Palette

| Name | Hex | Usage |
|------|-----|-------|
| Pale Sage | `#D8E8C0` | Light grass, spring foliage |
| Soft Green | `#88B858` | Default grass, healthy plants |
| Forest | `#507838` | Trees, deep foliage, bushes |
| Deep Forest | `#305028` | Tree shadows, dense canopy |
| Sky Blue | `#88C8E8` | Daytime sky, water highlights |
| Water | `#5898C0` | Rivers, lakes, ocean |
| Deep Water | `#386888` | Deep water, ocean depths |

### Accent Palette — Character Colors

| Name | Hex | Character/Usage |
|------|-----|----------------|
| Annie Blonde | `#F0D070` | Annie's hair |
| Annie Red | `#D85040` | Annie's sweater/top |
| John Shirt | `#5878A0` | John's characteristic shirt (soft blue-gray) |
| John Hair | `#604830` | John's hair |
| Obi White | `#F0E8E0` | Obi's white patches |
| Obi Brown | `#A07048` | Obi's brown markings |
| Obi Tan | `#D0A878` | Obi's tan markings |
| Bandana Blue | `#4878B0` | Obi's signature bandana |
| Luna Gold | `#C89848` | Luna's bengal coat base |
| Luna Spots | `#806030` | Luna's bengal rosettes |
| Luna Eyes | `#88B848` | Luna's golden-green eyes |

### Time-of-Day Palette Shifts

The base palette shifts subtly based on time of day. This is a color overlay/tint applied to the entire scene.

| Time | Tint | Effect |
|------|------|--------|
| Morning | Warm yellow `#FFF0D0` at 10% | Everything slightly golden |
| Day | None (base palette) | Default |
| Evening | Warm orange `#F0C890` at 15% | Sunset warmth |
| Night | Cool blue `#6080A8` at 20% | Moonlit blue, reduced saturation |

### Palette Rules

1. **Never use pure black (`#000000`).** Darkest value is Charcoal (`#3A2E28`). This keeps everything warm.
2. **Never use pure white (`#FFFFFF`).** Lightest value is Cream (`#FFF8F0`). Even "white" things have warmth.
3. **Outlines are color-contextual.** Tree outlines use Deep Forest, not Charcoal. Skin outlines use Warm Brown. This is what gives pixel art depth rather than a "coloring book" look.
4. **Each chapter may add 3-5 local accent colors** (e.g., Kentucky adds deeper autumn oranges; Myrtle Beach adds brighter sand yellows and coral pinks). These supplement, never replace, the base palette.
5. **The Warmth system** gradually shifts an area's tint toward warmer values as the player helps people. This is independent of time-of-day — both apply simultaneously.

---

## 4. Tileset Design

### Tile Categories

Every area needs these base tile types:

| Category | Examples | Notes |
|----------|----------|-------|
| Ground | Grass, dirt, sand, floor, road | Most tiles. Must tile seamlessly in all directions. |
| Water | Shallow, deep, shore edges | Animated (2-3 frame gentle ripple). Shore tiles need 4+ edge variants. |
| Walls/obstacles | Fences, walls, building edges, rocks | Collision-enabled. Need top-edge variants for depth. |
| Decoration (walkable) | Flowers, cracks, leaves, rugs | Overlaid on ground tiles. No collision. |
| Decoration (blocking) | Furniture, trees, signposts, mailboxes | Collision-enabled. Usually taller than 1 tile (drawn with overlap). |
| Transitions | Grass-to-dirt edges, indoor-to-outdoor | Need full 4-directional + corner variants (auto-tiling). |

### Auto-Tiling

Use **Wang tiles** or **47-tile blob** format for ground transitions (grass edges meeting dirt, water shores). PixelLab supports Wang tileset generation. This is critical for making the world look natural rather than grid-like.

### Depth & Layering

The top-down view uses a painter's algorithm with 3 layers:

1. **Ground layer** — flat tiles (grass, floor, path)
2. **Entity layer** — characters, NPCs, objects (sorted by Y position for depth)
3. **Overlay layer** — tree canopies, roof overhangs, awnings (drawn on top of characters, fade when character is underneath)

Objects taller than 1 tile (trees, buildings, tall furniture) have their base on the entity layer and their top on the overlay layer. This creates the illusion of walking behind things.

---

## 5. UI Design

### Font

| Context | Font | Size (native) | Notes |
|---------|------|---------------|-------|
| Dialogue text | Pixel font (e.g., Press Start 2P, m5x7, or custom) | 8-10px | Must be readable at 4× scale. |
| UI labels | Fredoka One (from ACD) or similar rounded sans | 8px | Menu items, button labels, stat names |
| Numbers/stats | Pixel font | 8px | HP, coins, damage numbers |
| Title screen | Custom / Fredoka One | 16-24px | "HOMEWARD" — warm, inviting |

### Dialogue Box

```
┌─────────────────────────────────────────────┐
│ ┌──────┐                                    │
│ │      │  Character Name                    │
│ │portrait│                                  │
│ │      │  Dialogue text goes here and       │
│ │      │  wraps to multiple lines as        │
│ └──────┘  needed. ▼                         │
└─────────────────────────────────────────────┘
```

- Box fills bottom ~25% of screen
- Semi-transparent warm background (`#3A2E28` at 85% opacity)
- Portrait is 64×64 (or 48×48) — larger, more detailed than the overworld sprite
- Character name in accent color matching the character
- Text reveals character-by-character (typewriter effect) with SFX
- ▼ indicator pulses when waiting for input

### Dialogue Portraits

Separate from overworld sprites. Portraits are **64×64** (rendered at 256×256 on screen at 4× scale). They show:
- Clear facial expression
- Upper body (head + shoulders)
- Character-identifying details (Annie's hair, John's shirt, Obi's bandana, Luna's eyes)
- **4-6 expression variants per character:** neutral, happy, sad, surprised, thinking, and one unique one (Annie: determined, John: dry humor, Obi: excited, Luna: unimpressed)

### HUD

Minimal. The cozy philosophy means the screen shouldn't be cluttered with UI.

```
┌─────────────────────────────────────────────┐
│ [♥♥♥♡]  [🪙 45]                    [☰]     │
│                                             │
│                                             │
│              (game world)                   │
│                                             │
│                                             │
│ [Active: Annie]  [Switch: Tab]              │
└─────────────────────────────────────────────┘
```

- **Top-left:** Party health (small hearts per character, color-coded)
- **Top-left adjacent:** Coin counter
- **Top-right:** Menu button (hamburger or equivalent)
- **Bottom-left:** Active character indicator + switch hint
- **All HUD elements** fade to 30% opacity after 3 seconds of no input, reappear on any action
- HUD uses the Cream/Charcoal palette with semi-transparent backgrounds

### Battle Screen Layout

```
┌─────────────────────────────────────────────┐
│            (scenic background)              │
│                                             │
│  [Annie]  [John]        [Raccoon 1]         │
│  [Obi]    [Luna]        [Raccoon 2]         │
│                                             │
│─────────────────────────────────────────────│
│ Annie's turn                                │
│ [Attack] [Special] [Befriend] [Item] [Flee] │
│                                             │
│ HP: ♥♥♥♡  ATK: 12  DEF: 8  SPD: 10        │
└─────────────────────────────────────────────┘
```

- Party on left, enemies on right (classic JRPG layout)
- Background is a stylized version of the current area
- Menu bar at bottom with action options
- Active character highlighted with a subtle glow
- Befriended enemies show a friendliness meter (hidden percentage, shown as expression change)

---

## 6. Animation Guidelines

### Frame Rates

| Animation | FPS | Notes |
|-----------|-----|-------|
| Character walk cycle | 8 FPS | 4 frames per direction |
| Character idle | 4 FPS | Gentle breathing/sway, 2 frames |
| Water/environmental | 4 FPS | Subtle ripple, 2-3 frames |
| UI/text | 30 FPS | Smooth typewriter text, cursor blink |
| Battle animations | 12 FPS | Snappier for impact |

### Movement Speed

| Action | Speed |
|--------|-------|
| Walk | 3 tiles/second (96px/s at native res) |
| Run (if implemented) | 5 tiles/second |
| Grid snap | Movement tweens smoothly between tiles, 0.33s per tile |

---

## 7. Mood & Tone Reference

### Visual Inspirations

| Game | What to borrow | What NOT to borrow |
|------|---------------|-------------------|
| Stardew Valley | Character proportions, warm palette, environmental detail | The farming grid system, seasonal color extremes |
| Earthbound | Quirky enemy design, absurd humor in visual design | The psychedelic battle backgrounds |
| Undertale | Expressive faces at small sizes, personality through animation | The darkness and horror undertones |
| Celeste (overworld) | Clean pixel art, readable at small sizes, emotional color use | The platforming precision aesthetic |

### The "Cozy Test"

Before finalizing any visual asset, apply this test:
1. Does it make you feel warm? (If it feels cold, clinical, or sterile — adjust the palette.)
2. Could you imagine it on a greeting card or a children's book page? (Good.)
3. Does it feel threatening or hostile? (Bad. Even enemies should look mischievous, not scary.)
4. Is it readable at 1× scale? (If you can't tell what it is at 32×48 actual pixels, simplify.)

---

## 8. Art Pipeline — PixelLab + Aseprite (Research-Validated)

> Based on deep research conducted May 2026 covering PixelLab docs, community reviews, competitor analysis, and real production usage patterns.

### Tool Stack

| Tool | Role | Cost | Interface |
|------|------|------|-----------|
| **PixelLab** (Tier 2 "Pixel Artisan") | Primary AI generation | $24/mo × 3 months = ~$72 | Aseprite plugin (primary), API/MCP (batch jobs) |
| **Aseprite** | Manual cleanup, palette enforcement, animation editing, sprite sheet export | $19.99 one-time (Steam) | Desktop app |
| **Retro Diffusion** (Lite) | Backup for portraits and small sprites if PixelLab underdelivers | $20 one-time (Aseprite extension) | Aseprite plugin |
| **Sprite Fusion** | Tilemap assembly from Wang tilesets | Free | Web app |
| **Total budget** | | **~$112 ceiling** | |

### Why the Aseprite Plugin, Not the Web App

The Aseprite plugin gets updates every few days and always has the latest features. The web app is a subset — most Pro tools (skeleton animation, style-reference generation, 8-directional rotation) are only in the plugin. The web app is fine for quick experiments, but production work happens in the plugin.

### The MCP / API Integration

PixelLab's MCP server (`create_character`, `animate_character`, `create_tileset`) plugs into Claude Code. This is nice-to-have for batch jobs (e.g., "generate all 12 enemy idle sprites overnight" via a Node.js script), but the primary creative workflow is the Aseprite plugin where you can iterate visually.

### Credit Math

- Basic models: 1 credit/request
- Pro models (style-reference, skeleton animation, 8-direction): 40 credits/request
- Tier 2 = 5,000 images/month (math may need revisiting under this pricing model)
- **Virtually every Homeward generation will be a Pro call** (because we need style-reference anchoring on everything)
- Estimated total project: ~8,600 credits = ~3 months of Tier 2
- Budget 30% overhead for failed generations and prompt experimentation

### Style Anchor Process (REVISED — Portrait-First)

The research revealed that the anchor should be the **portrait**, not the overworld sprite. Detail can be downsampled (portrait → sprite) but not invented (sprite → portrait). This changes the order:

1. **Day 1: Generate Annie's 64×64 portrait (neutral expression).** This is the true style anchor for the entire game. Iterate until the palette, proportions, warmth, and personality are exactly right. Use forced-palette parameter to lock to our defined color palette.
2. **Day 1-2: Derive Annie's 32×48 overworld sprite** using the portrait as style reference. The "Create S-M image (style)" tool takes the portrait as reference and generates the smaller sprite in matching style.
3. **Day 2: Generate Annie's 8-directional rotation** using "Create 8-directional sprite (Pro) → Rotate character" — feed it the front-facing overworld sprite, get all 8 directions back in a 3×3 grid.
4. **Day 2-3: Generate Annie's walk cycle** using "Animate with skeleton" tool (NOT text-based animation). Set `fixed head → always` so the face copies from the reference for consistency. Skeleton animation is PixelLab's own recommendation for character walk cycles.
5. **Day 3: Generate remaining Annie animations** (idle, battle poses, interact) using the same skeleton + reference pipeline.
6. **Day 3: RISK TEST — Generate Luna at 32×32.** Luna is 24×32 in our spec, but PixelLab is documented as weak below 32×32. Generate her at 32×32 with the body filling the frame, then re-canvas to 24×32 in Aseprite. If the result is bad, pivot Luna to Retro Diffusion or hand-drawn.
7. **Day 4-7: Generate John, Obi, and Luna** using Annie's portrait as the style reference anchor. Same pipeline per character.
8. **Decision gate (end of Week 1):** If all four characters + one test tileset look production-grade after Aseprite cleanup, proceed to bulk generation. If not, evaluate alternatives before committing further.

### Style Consistency Rules

PixelLab's style reference system works well for ~20 generations, then drifts. Mitigate with discipline:

- **ALWAYS anchor to the original hand-curated portrait set.** Never use a recently-generated asset as the next style anchor — drift compounds.
- **Use the forced-palette parameter** on every generation to lock colors to our defined palette.
- **Use the same prompt suffix** on every generation: `warm cozy pixel art, soft outlines, no pure black, earthy tones`
- **Re-anchor every 20 generations:** manually compare the latest output against the master portrait. Regenerate outliers.
- **Use inpainting** rather than full re-rolls when something is 90% right. Cheaper (credit-wise) and preserves what's already working.
- **Export every generated PNG to local disk immediately.** Never rely on PixelLab's cloud as your archive.

### Character Prompt Template
```
[character description], 32x48 pixel art, top-down RPG style,
warm cozy color palette, no pure black outlines, chibi proportions,
[specific pose/direction], transparent background,
style reference: [Annie portrait anchor]
```

### Tileset Prompt Template
```
[environment description] tileset, 32x32 tiles, top-down RPG,
warm earthy colors, cozy aesthetic, seamless tiling,
inner tile: [e.g., grass], outer tile: [e.g., dirt path]
```
Use the Wang tileset export → Sprite Fusion → JSON/TMX export pipeline for all ground transitions.

### Known Limitations to Plan Around

| Limitation | Impact | Mitigation |
|-----------|--------|------------|
| Weak below 32×32 | Luna (24×32) may look rough | Generate at 32×32, re-canvas in Aseprite |
| Style drift after ~20 gens | Later assets may not match early ones | Always re-anchor to original portrait; forced palette |
| ~10-20% of frames need manual repair | Walk cycles may have head-bobbing, foot-slipping, color flicker | Aseprite onion skinning + manual pixel editing |
| Rotation struggles with accessories | Obi's bandana, hats, held items may not rotate cleanly | Regenerate problem directions; inpainting fixes |
| No shipped game publicly credits PixelLab | Unproven at commercial scale | Acceptable for a personal gift game; mitigate by validating early |
| Cloud-only generation | Service outage = blocked | Export all PNGs to local immediately; keep Aseprite master files |

### Aseprite Workflow (Post-Generation)

For every generated asset, before it enters the game:

1. **Import** generated PNG/grid into Aseprite
2. **Palette snap** — `Sprite > Color Mode > Indexed` with Homeward palette loaded. This forces every pixel onto our defined colors and catches any off-palette drift.
3. **Manual cleanup** — fix drifted pixels, semi-transparent edge artifacts, broken accessories, inconsistent eyes
4. **Animation timeline** — set per-frame timing, add tags (`idle`, `walk_n`, `walk_s`, `attack`, etc.)
5. **Onion skinning review** — overlay adjacent frames to verify walk cycle continuity
6. **All frames for one character live in ONE `.aseprite` master file** with named tags, not 80 separate PNGs
7. **Export** — `File > Export Sprite Sheet` with `Split Tags` → produces grid PNG + JSON metadata with frame coordinates, durations, and tag boundaries. This is exactly what our HTML5 Canvas engine loader needs.

### Production Timeline

| Phase | Duration | Assets Produced | Credits Used |
|-------|----------|----------------|-------------|
| **Stage 1: Style anchor + risk test** | Days 1-7 | Annie full pipeline, Luna risk test, 1 tileset | ~300 |
| **Stage 2: Bulk character generation** | Weeks 2-4 | 4 mains complete, 18 NPCs, 11 enemies | ~3,700 |
| **Stage 3: Environments + UI** | Weeks 4-6 | 8-10 biome tilesets, UI suite, map backgrounds | ~1,500 |
| **Stage 4: Portraits + polish** | Weeks 6-8 | 20 portraits (4×5 expressions), Aseprite cleanup pass | ~1,600 |
| **Iteration overhead (~30%)** | Throughout | Failed gens, re-anchoring, experimentation | ~1,500 |
| **Total** | ~8 weeks | ~200+ final assets | ~8,600 credits |

---

## 9. File Naming & Export

### Sprites
```
characters/annie/annie-walk-south-01.png
characters/annie/annie-walk-south-02.png
characters/annie/annie-idle-east-01.png
characters/obi/obi-sniff-west-01.png
enemies/raccoon/raccoon-idle-01.png
```

Or as sprite sheets:
```
characters/annie-walk.png       (8 directions × 4 frames = 32 frames in grid)
characters/annie-idle.png       (8 directions × 2 frames = 16 frames in grid)
characters/obi-walk.png
```

### Tilesets
```
tiles/ch0-wicker-park-ground.png
tiles/ch0-wicker-park-walls.png
tiles/ch0-wicker-park-furniture.png
tiles/ch3-kentucky-ground.png
```

### Portraits
```
portraits/annie-neutral.png
portraits/annie-happy.png
portraits/john-dry-humor.png
portraits/obi-excited.png
portraits/luna-unimpressed.png
```

### Maps (Tiled export)
```
maps/ch0-apartment.json
maps/ch0-wicker-park-street.json
maps/ch1-rest-stop.json
```

---

## 10. Checklist — Before Any Art is Final

- [ ] Passes the silhouette test (identifiable as solid black shape)
- [ ] Uses only palette colors — verified via Aseprite indexed-color snap
- [ ] No pure black (`#000000`) or pure white (`#FFFFFF`)
- [ ] Readable at 1× native resolution (32×48 for characters, 32×32 for tiles)
- [ ] Consistent with the master portrait anchor (compare side-by-side every 20 gens)
- [ ] Outlines use contextual color, not uniform black
- [ ] Transparent background (for sprites) or seamless tiling (for tiles)
- [ ] Exported as PNG with no anti-aliasing / no smoothing
- [ ] Named according to the file naming convention
- [ ] Saved to local disk immediately after generation (never rely on PixelLab cloud)
- [ ] Master `.aseprite` file exists with all frames tagged
