# Homeward — Claude Code Project Context

## What This Is

**Homeward** is a top-down pixel art RPG built as a personal gift. Four characters — Annie, John, Obi (dog), Luna (cat) — drive from Chicago to Wilmington, NC. It's a love letter disguised as a game. The player discovers "Little Things" (glowing collectibles revealing unspoken thoughts), befriends enemies instead of fighting them, and watches the world grow warmer as they're kind to it.

## Tech Stack

- **Rendering:** HTML5 Canvas 2D Context
- **Language:** Vanilla JavaScript, ES2022+, native ES `import`/`export`
- **No build step.** No bundler, no framework, no transpilation. Just files served over HTTP.
- **Hosting:** GitHub Pages (static HTTPS)
- **Dev server:** `npx serve .` or VS Code Live Server
- **Maps:** Tiled editor → JSON export
- **Sprites:** Aseprite → PNG sprite sheets + JSON metadata
- **Audio:** Web Audio API (procedural)
- **Persistence:** localStorage, 3 save slots

## Key Constants

```
CANVAS_W = 480        // native pixels
CANVAS_H = 270        // native pixels
TILE_SIZE = 32        // pixels per tile
SCALE = 4             // CSS scale factor → 1920×1080
TICK_RATE = 1000/60   // 60 Hz logic update
TILES_X = 15          // visible tiles horizontal
TILES_Y ≈ 8.4         // visible tiles vertical
```

Characters: Annie/John = 32×48 px, Obi = 32×32 px, Luna = 24×32 px. All move on the 32×32 grid.

## Project Structure

The block below is the **target** structure for the finished game. Directories marked **(exists)** are built today; the rest are aspirational. Don't create empty directories speculatively — add them as code lands.

```
homeward/
├── index.html                          (exists)
├── README.md                           (exists)
├── CLAUDE.md, HOMEWARD-*.md            (exists — reference docs at repo root)
├── src/
│   ├── main.js                         (exists)
│   ├── constants.js                    (exists)
│   ├── engine/        # camera, canvas, events, game-loop, input, transitions   (partial)
│   │                  # eventual additions: assets, audio, save
│   ├── state/         # game-state, mode-machine                                (partial)
│   │                  # eventual additions: flags, warmth, time-of-day
│   ├── world/         # entity, entity-registry, little-things, npc, overworld, party,
│   │                  # player, tilemap, trigger-zone, data/                    (partial)
│   │                  # eventual additions: interactable
│   ├── ui/            # dialogue, hud, little-thing-overlay                     (partial)
│   │                  # eventual additions: menu, inventory, journal, bestiary,
│   │                  # party-stats, save-menu
│   ├── battle/        # battle state machine, actions, befriend, enemy-ai,
│   │                  # rewards, renderer                                       (not yet)
│   ├── cutscene/      # cutscene controller + action primitives                 (not yet)
│   ├── screens/       # title, loading, credits                                 (not yet)
│   ├── activities/    # fishing, cooking, photography, foraging                 (not yet)
│   ├── characters/    # stats, annie, john, obi, luna                           (not yet)
│   └── data/          # chapter data bundles, global JSON data files            (not yet)
├── assets/
│   ├── palette/homeward.gpl            (exists — canonical Homeward palette)
│   ├── sprites/                        (not yet — first PixelLab outputs land here)
│   ├── tiles/                          (not yet)
│   ├── portraits/                      (not yet)
│   ├── ui/                             (not yet)
│   └── audio/                          (not yet)
├── test sprites/                       (exists — early Aseprite experiments)
├── old/                                (exists — archived prior versions of GDD/Style Guide)
└── tools/                              (not yet)
```

## Reference Documents

Four docs in this directory define the full project. Read them when you need specifics:

- **HOMEWARD-GDD.md** — Game design. Story, characters, abilities, combat, chapter structure, the Little Things collectible system, mini-activities, progression. Read for *what* the game does.
- **HOMEWARD-STYLE-GUIDE.md** — Visual bible. Resolution, palette (hex values), character dimensions, sprite sheet specs, UI layout, animation frame rates, art pipeline. Read for *what it looks like*.
- **HOMEWARD-ARCHITECTURE.md** — Technical architecture. Game loop, mode machine, state schema, rendering pipeline, entity system, movement/collision, dialogue data format, battle state machine, asset loading, all data schemas. Read for *how the code works*. This is the primary implementation reference.
- **HOMEWARD-PIXELLAB-WORKFLOW.md** — Operational manual for the PixelLab MCP. Tool catalog, parameter defaults, recipes for common iteration loops, asset ingestion paths, anti-patterns, cost guardrails. Read *before generating any art from this session*. Visual decisions still live in the Style Guide; this doc covers driving the MCP.

## Coding Conventions

- **ES modules everywhere.** Every file uses `export`/`import`. No globals except the canvas context during render.
- **Factory functions, not classes.** Entities are plain objects returned by factory functions (`createNPC(data)` returns an object with `update`, `render`, `onInteract`).
- **Single state object.** All mutable game data lives in one `state` object (defined in `game-state.js`). Systems read/write through a thin API that emits events.
- **Event bus for cross-system communication.** Systems don't import each other to communicate — they emit and subscribe to events.
- **Pixel-perfect rendering.** Always `Math.round()` positions before drawing. Canvas `imageSmoothingEnabled = false`. CSS scaling only via integer multiples.
- **No floating point grid positions.** Characters have integer `gridX`/`gridY` (tile coordinates). Visual `pixelX`/`pixelY` interpolate smoothly between grid cells during movement but snap to exact tile boundaries when movement completes.
- **Mode machine pattern.** The game is always in one mode (OVERWORLD, BATTLE, DIALOGUE, CUTSCENE, MENU, ACTIVITY, TITLE, LOADING, CREDITS). Each mode has `enter()`, `exit()`, `update(dt)`, `render(ctx, alpha)`.

## Current State

**Milestone 0 vertical slice is running with placeholder graphics.** The engine boots, the mode machine drives the overworld, the party walks the tile map, dialogue plays, Little Things glow and surface their overlay, area transitions work. Characters are drawn as colored rectangles (see `CHARACTER_DIMS` in `src/constants.js`) waiting for real sprites.

**Current focus: visual asset pipeline.** PixelLab MCP is installed and operational (see Tooling below). The Style Guide and HOMEWARD-PIXELLAB-WORKFLOW.md define the pipeline. The four player characters, Wicker Park apartment + street tilesets, and NPC sprites are the immediate generation queue.

**Next code milestones** (after baseline art exists): battle mode (`src/battle/`), save system (`src/engine/save.js`), assets/audio loaders, time-of-day + warmth state, and full character stats data in `src/characters/`.

## Tooling

- **PixelLab MCP server** is installed at user scope (`claude mcp add -s user -t http pixellab https://api.pixellab.ai/mcp -H "Authorization: Bearer <token>"`). API token lives only in user-level Claude config — never commit it. Verify with `claude mcp list`; smoke-test with `mcp__pixellab__list_characters`. Account state and one existing Annie prototype character are documented in HOMEWARD-PIXELLAB-WORKFLOW.md §4d.
- **Aseprite** is the cleanup-and-export tool. Master `.aseprite` files live alongside their `raw/` and `exports/` siblings under `assets/sprites/<category>/<name>/` per the workflow doc §6.
- **Static dev server** is whatever serves the repo (`npx serve .` or VS Code Live Server). No build, no bundler.

## Color Palette (Key Values)

```
Cream:       #FFF8F0    (lightest background)
Warm Sand:   #F0E0C8    (paths, light wood)
Charcoal:    #3A2E28    (text, darkest UI — never pure black)
Soft Green:  #88B858    (grass)
Forest:      #507838    (trees)
Annie Red:   #D85040    (Annie's sweater)
Annie Blonde:#F0D070    (Annie's hair)
John Shirt:  #5878A0    (John's shirt)
Bandana Blue:#4878B0    (Obi's bandana)
Luna Gold:   #C89848    (Luna's coat)
```

No pure black (`#000000`). No pure white (`#FFFFFF`). Outlines use contextual color, not uniform dark.
