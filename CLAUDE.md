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
TICK_RATE = 1000/30   // 30 Hz logic update
TILES_X = 15          // visible tiles horizontal
TILES_Y ≈ 8.4         // visible tiles vertical
```

Characters: Annie/John = 32×48 px, Obi = 32×32 px, Luna = 24×32 px. All move on the 32×32 grid.

## Project Structure

```
homeward/
├── index.html
├── src/
│   ├── main.js
│   ├── constants.js
│   ├── engine/        # game-loop, canvas, input, camera, assets, audio, save, events, transitions
│   ├── state/         # game-state, mode-machine, flags, warmth, time-of-day
│   ├── world/         # tilemap, entity, player, party, npc, interactable, little-things, overworld
│   ├── battle/        # battle state machine, actions, befriend, enemy-ai, rewards, renderer
│   ├── ui/            # hud, dialogue, menu, inventory, journal, bestiary, party-stats, save-menu
│   ├── cutscene/      # cutscene controller + action primitives
│   ├── screens/       # title, loading, credits
│   ├── activities/    # fishing, cooking, photography, foraging
│   ├── characters/    # stats, annie, john, obi, luna
│   └── data/          # chapter data bundles, global JSON data files
├── assets/
│   ├── sprites/
│   ├── tiles/
│   ├── portraits/
│   ├── ui/
│   └── audio/
└── tools/
```

## Reference Documents

Three docs in this directory define the full project. Read them when you need specifics:

- **HOMEWARD-GDD.md** — Game design. Story, characters, abilities, combat, chapter structure, the Little Things collectible system, mini-activities, progression. Read for *what* the game does.
- **HOMEWARD-STYLE-GUIDE.md** — Visual bible. Resolution, palette (hex values), character dimensions, sprite sheet specs, UI layout, animation frame rates, art pipeline. Read for *what it looks like*.
- **HOMEWARD-ARCHITECTURE.md** — Technical architecture. Game loop, mode machine, state schema, rendering pipeline, entity system, movement/collision, dialogue data format, battle state machine, asset loading, all data schemas. Read for *how the code works*. This is the primary implementation reference.

## Coding Conventions

- **ES modules everywhere.** Every file uses `export`/`import`. No globals except the canvas context during render.
- **Factory functions, not classes.** Entities are plain objects returned by factory functions (`createNPC(data)` returns an object with `update`, `render`, `onInteract`).
- **Single state object.** All mutable game data lives in one `state` object (defined in `game-state.js`). Systems read/write through a thin API that emits events.
- **Event bus for cross-system communication.** Systems don't import each other to communicate — they emit and subscribe to events.
- **Pixel-perfect rendering.** Always `Math.round()` positions before drawing. Canvas `imageSmoothingEnabled = false`. CSS scaling only via integer multiples.
- **No floating point grid positions.** Characters have integer `gridX`/`gridY` (tile coordinates). Visual `pixelX`/`pixelY` interpolate smoothly between grid cells during movement but snap to exact tile boundaries when movement completes.
- **Mode machine pattern.** The game is always in one mode (OVERWORLD, BATTLE, DIALOGUE, CUTSCENE, MENU, ACTIVITY, TITLE, LOADING, CREDITS). Each mode has `enter()`, `exit()`, `update(dt)`, `render(ctx, alpha)`.

## Current State

Pre-production. The three design docs are complete. No game code exists yet. Milestone 0 (the vertical slice) is the current target: Annie walks around a tile map, switches characters, talks to an NPC, finds a Little Thing, transitions between areas.

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
