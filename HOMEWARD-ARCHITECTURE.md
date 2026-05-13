# Homeward — Technical Architecture Document

> The engineering blueprint. The GDD says *what* the game does. The Style Guide says *what it looks like*. This document says *how the code does it*. Any developer — or Claude Code session — should be able to implement a system from this document alone without design ambiguity.

---

## 1. Runtime Environment

| Property | Value |
|----------|-------|
| Platform | Modern browsers (Chrome, Firefox, Safari, Edge) |
| Rendering | HTML5 Canvas 2D Context |
| Language | Vanilla JavaScript (ES2022+, ES modules) |
| Module system | Native ES `import`/`export` — no bundler, no build step |
| Hosting | GitHub Pages (static HTTPS) |
| Dev server | `npx serve .` or VS Code Live Server for local testing |
| Target framerate | 60 FPS render, 30 FPS logic tick |
| Resolution | 480×270 native canvas, CSS-scaled to fill viewport at integer multiples (4× → 1920×1080) |
| Input | Keyboard (primary), mouse (menus), touch (future) |
| Persistence | localStorage |
| Audio | Web Audio API (procedural, evolved from ACD) |

---

## 2. Project Structure

```
homeward/
├── index.html                  # Entry point. Single <canvas>, single <script type="module">
├── src/
│   ├── main.js                 # Bootstrap: canvas init, asset preload, start game loop
│   ├── constants.js            # TILE_SIZE, CANVAS_W, CANVAS_H, scale factors, key bindings
│   │
│   ├── engine/
│   │   ├── game-loop.js        # requestAnimationFrame, fixed-step update, variable render
│   │   ├── canvas.js           # Canvas setup, context helpers, pixel-perfect scaling
│   │   ├── input.js            # Keyboard state, buffered actions, touch adapter
│   │   ├── camera.js           # Viewport position, smooth follow, bounds clamping, shake
│   │   ├── assets.js           # Image/audio loader, manifest system, chapter preloading
│   │   ├── audio.js            # Web Audio procedural music + SFX system
│   │   ├── save.js             # localStorage read/write, 3 slots, auto-save triggers
│   │   ├── events.js           # Pub/sub event bus for cross-system communication
│   │   └── transitions.js      # Fade-to-black, screen wipes, letterbox effects
│   │
│   ├── state/
│   │   ├── game-state.js       # Master state object + getter/setter API
│   │   ├── mode-machine.js     # Top-level finite state machine (overworld/battle/dialogue/etc.)
│   │   ├── flags.js            # Story progression flags, quest completion, befriend registry
│   │   ├── warmth.js           # Per-area warmth tracking, threshold effects, ambient triggers
│   │   └── time-of-day.js      # Time state, palette tint calculation, NPC schedule triggers
│   │
│   ├── world/
│   │   ├── tilemap.js          # Load Tiled JSON, render tile layers, collision lookup
│   │   ├── entity.js           # Base entity: position, sprite, update(), render()
│   │   ├── player.js           # Active character control, grid movement, ability dispatch
│   │   ├── party.js            # Party composition, follow chain, switching logic
│   │   ├── npc.js              # NPC behavior: patrol routes, interaction triggers, schedules
│   │   ├── interactable.js     # Objects: signs, chests, ability spots (dig/climb/sniff targets)
│   │   ├── trigger-zone.js     # Invisible zones: area transitions, encounter areas, cutscene starts
│   │   ├── little-things.js    # Collectible system: visibility (Annie-only), collection, journal link
│   │   ├── encounter.js        # Random/scripted battle encounter spawning
│   │   ├── effects.js          # Ambient particles: butterflies, fireflies, flowers, weather
│   │   ├── perspective-overlays.js  # Character-specific visual highlights (scent trails, climb spots)
│   │   └── overworld.js        # Overworld mode controller: wires everything above together
│   │
│   ├── battle/
│   │   ├── battle.js           # Battle mode controller + state machine
│   │   ├── battle-state.js     # Turn queue, active character, enemy list, phase tracking
│   │   ├── actions.js          # Attack, Special, Item, Flee — damage calc, effects
│   │   ├── befriend.js         # Befriend actions per character, friendliness meter, outcomes
│   │   ├── enemy-ai.js         # Enemy turn logic: target selection, move choice
│   │   ├── rewards.js          # XP distribution, leveling, coin drops, item drops
│   │   └── battle-renderer.js  # Battle scene drawing: backgrounds, sprites, UI, animations
│   │
│   ├── ui/
│   │   ├── hud.js              # In-game overlay: hearts, coins, active character, fade behavior
│   │   ├── dialogue.js         # Text box: portrait, name, typewriter text, choices, character variants
│   │   ├── menu.js             # Pause menu: submenus, navigation, input handling
│   │   ├── inventory.js        # Item grid: categories, use/equip, descriptions
│   │   ├── journal.js          # Quest log + Little Things viewer + Fish/Collection logs
│   │   ├── bestiary.js         # Creature entries (Obi/Luna voice), befriend status
│   │   ├── party-stats.js      # Character stat sheets, equipped accessories, moves
│   │   └── save-menu.js        # Save/load slot selection, slot preview
│   │
│   ├── cutscene/
│   │   ├── cutscene.js         # Cutscene mode controller: runs scripted sequences
│   │   └── cutscene-actions.js # Primitives: walk-to, face, say, wait, fade, camera-pan, letterbox
│   │
│   ├── screens/
│   │   ├── title.js            # Title screen mode: New Game / Continue / Settings
│   │   ├── loading.js          # Loading screen: progress bar, chapter title card
│   │   └── credits.js          # Credits mode: montage + scroll, warmth-driven length
│   │
│   ├── activities/
│   │   ├── fishing.js          # Timing minigame at water tiles
│   │   ├── cooking.js          # Recipe combine at campfire spots
│   │   ├── photography.js      # Screenshot capture at scenic spots
│   │   └── foraging.js         # Regional collectible tracking
│   │
│   ├── characters/
│   │   ├── stats.js            # Base stat definitions, level-up curves, move unlock table
│   │   ├── annie.js            # Annie: ability logic (warmth sense, Little Things visibility)
│   │   ├── john.js             # John: ability logic (fix, carry, heavy push)
│   │   ├── obi.js              # Obi: ability logic (sniff overlay, dig, squeeze)
│   │   └── luna.js             # Luna: ability logic (climb, stealth, dark vision)
│   │
│   └── data/
│       ├── chapters/           # Per-chapter data bundles
│       │   ├── ch0/
│       │   │   ├── maps/       # Tiled JSON exports
│       │   │   ├── dialogue.json
│       │   │   ├── npcs.json
│       │   │   ├── quests.json
│       │   │   ├── encounters.json
│       │   │   ├── little-things.json
│       │   │   └── cutscenes.json
│       │   ├── ch1/
│       │   │   └── ...
│       │   └── ...
│       ├── enemies.json        # Global enemy definitions (stats, moves, befriend thresholds)
│       ├── items.json          # All items (consumables, key items, accessories, treasures, gifts)
│       ├── recipes.json        # Cooking recipes
│       ├── fish.json           # Fish species per region
│       ├── collectibles.json   # Regional collectible sets
│       └── party.json          # Base stats, move lists, level-up tables for all 4 characters
│
├── assets/
│   ├── sprites/                # Character sprite sheets (PNG)
│   ├── tiles/                  # Tileset images (PNG)
│   ├── portraits/              # 64×64 dialogue portraits (PNG)
│   ├── ui/                     # Menu/HUD sprite elements (PNG)
│   └── audio/                  # Sound effect samples (if any non-procedural)
│
└── tools/
    └── (future: map preview, dialogue tester, etc.)
```

---

## 3. Game Loop

```
┌──────────────────────────────────────────────────────────────┐
│                    requestAnimationFrame                      │
│                                                              │
│   accumulator += deltaTime                                   │
│                                                              │
│   while (accumulator >= TICK_RATE) {                         │
│       input.poll()            // capture key state           │
│       mode.update(TICK_RATE)  // fixed-step game logic       │
│       accumulator -= TICK_RATE                               │
│   }                                                          │
│                                                              │
│   mode.render(ctx, alpha)     // draw with interpolation     │
│   hud.render(ctx)             // HUD always on top           │
│   transition.render(ctx)      // fade/wipe overlay           │
└──────────────────────────────────────────────────────────────┘
```

### Constants

```javascript
export const TICK_RATE = 1000 / 30;    // 30 updates/second (33.33ms per tick)
export const CANVAS_W = 480;            // native pixels
export const CANVAS_H = 270;            // native pixels
export const TILE_SIZE = 32;            // pixels per tile
export const TILES_X = 15;              // visible tiles horizontal
export const TILES_Y = Math.ceil(CANVAS_H / TILE_SIZE); // ~8.4
```

### Why 30 Hz Update, 60 Hz Render?

Game logic (movement, collision, AI, timers) runs at a fixed 30 Hz. This is plenty for a tile-based RPG where movement is discrete grid steps — there's no physics or fast action that needs 60 Hz precision. Rendering runs at the display's refresh rate (typically 60 Hz) with interpolation for smooth movement tweens between logical positions. This halves the logic cost and makes the game run well on weaker hardware.

### game-loop.js Exports

```javascript
export function startLoop(canvas, initialMode) { ... }
export function setMode(newMode) { ... }  // delegates to mode-machine
export function getCtx() { ... }           // canvas 2D context
```

---

## 4. Mode Machine (Top-Level State)

The game is always in exactly one **mode**. Each mode is an object with `enter()`, `exit()`, `update(dt)`, and `render(ctx, alpha)` methods. The mode machine handles transitions between them.

```
    ┌──────────┐
    │  TITLE   │  New Game / Continue / Settings
    └──────────┘
         │
         ▼
    ┌──────────┐
    │ LOADING  │  (preload chapter assets, show progress)
    └──────────┘
         │
         ▼
    ┌──────────┐  encounter   ┌──────────────┐
    │OVERWORLD │─────────────▶│   BATTLE     │
    │          │◀─────────────│              │
    └──────────┘  victory/    └──────────────┘
       │    ▲     defeat
       │    │
  talk │    │ close
       │    │
       ▼    │
    ┌──────────┐
    │ DIALOGUE │
    └──────────┘
       │    ▲
       │    │
       ▼    │
    ┌──────────┐
    │ CUTSCENE │  (includes regular, John's Moments, and comedy variants)
    └──────────┘

    ┌──────────┐
    │   MENU   │  (overlay — pauses the current mode, doesn't replace it)
    └──────────┘

    ┌──────────┐
    │ ACTIVITY │  (fishing, cooking, etc. — replaces overworld temporarily)
    └──────────┘

    ┌──────────┐
    │ CREDITS  │  (montage + scroll, triggered after epilogue)
    └──────────┘
```

### Mode Interface

```javascript
// Every mode implements this interface
const mode = {
    enter(params) { },   // called when switching TO this mode. params carry context.
    exit() { },          // called when switching AWAY from this mode. cleanup.
    update(dt) { },      // fixed-step logic. dt = TICK_RATE in ms.
    render(ctx, alpha) { }, // draw. alpha = interpolation factor [0, 1].
};
```

### Mode Transition Rules

| From | To | Trigger | Params Passed |
|------|----|---------|--------------|
| (boot) | TITLE | game starts | none |
| TITLE | LOADING | "New Game" selected | `{ newGame: true }` |
| TITLE | LOADING | "Continue" selected | `{ slot: 1 }` |
| LOADING | OVERWORLD | assets loaded | `{ chapter: 0, spawn: 'apartment_door' }` |
| OVERWORLD | LOADING | area transition (new chapter) | `{ chapter: 1, spawn: 'from_south' }` (preload next chapter) |
| OVERWORLD | OVERWORLD | area transition (same chapter) | `{ map: 'ch0-street', spawn: 'from_apartment' }` (fade → swap map → fade in) |
| OVERWORLD | BATTLE | encounter zone / scripted | `{ enemies: [...], backdrop: 'rest_stop', canFlee: true }` |
| BATTLE | OVERWORLD | victory or defeat | `{ rewards: {...} }` or `{ defeat: true }` |
| OVERWORLD | DIALOGUE | interact with NPC/sign | `{ dialogueId: 'ch0_neighbor_01', speaker: 'annie' }` |
| DIALOGUE | OVERWORLD | dialogue ends | `{ questStarted: 'find_keys' }` (optional side effects) |
| DIALOGUE | CUTSCENE | dialogue triggers cutscene | `{ cutsceneId: 'ch0_leaving_home' }` |
| OVERWORLD | CUTSCENE | trigger zone | `{ cutsceneId: '...' }` |
| CUTSCENE | OVERWORLD | cutscene ends | `{ nextSpawn: '...' }` (optional area transition) |
| CUTSCENE | CREDITS | epilogue cutscene ends | `{ warmthTotal: 45 }` |
| ANY | MENU | pause key pressed | `{ returnMode: currentMode }` |
| MENU | (previous) | unpause | restores previous mode |
| OVERWORLD | ACTIVITY | interact with activity spot | `{ type: 'fishing', location: '...' }` |
| ACTIVITY | OVERWORLD | activity complete / cancelled | `{ result: {...} }` |
| CREDITS | TITLE | credits finish | none |

### Area Transition Flow (detailed)

Area transitions are the most complex mode operation because they involve asset loading mid-game.

```
1. Player steps on trigger zone with type="transition"
2. Input locks immediately
3. Fade-to-black (500ms)
4. If new chapter: enter LOADING mode, preload new chapter manifest
   If same chapter: swap map in-place (synchronous — assets already loaded)
5. Unload entities from old map
6. Load new map JSON, spawn entities from object layer
7. Position party at target spawn point
8. Camera snaps to new player position (no lerp)
9. Auto-save
10. Fade-in (500ms)
11. Input unlocks
```

### Menu as Overlay

MENU is special — it doesn't replace the underlying mode, it pauses it. The overworld (or battle) stays rendered as a frozen background behind the menu. This means MENU needs a reference to the paused mode so it can re-render it as a backdrop.

```javascript
function openMenu() {
    pausedMode = currentMode;
    currentMode = menuMode;
    menuMode.enter({ backdrop: pausedMode });
}

function closeMenu() {
    currentMode = pausedMode;
    pausedMode = null;
}
```

---

## 5. Game State

### 5a. Master State Object

A single `state` object holds all mutable game data. Every system reads from and writes to this object. It is the single source of truth and the thing that gets serialized to localStorage on save.

```javascript
const state = {
    // Meta
    chapter: 0,
    currentMap: 'ch0-apartment',
    playTime: 0,              // total ms played
    timeOfDay: 'morning',     // 'morning' | 'day' | 'evening' | 'night' — advances via story flags

    // Party
    party: {
        active: 'annie',      // who the player is controlling
        members: {
            annie: { hp: 30, maxHp: 30, atk: 8, def: 6, spd: 10, heart: 12,
                     level: 1, xp: 0, moves: ['encourage'], accessories: [] },
            john:  { hp: 40, maxHp: 40, atk: 10, def: 10, spd: 7, heart: 8,
                     level: 1, xp: 0, moves: ['ive_got_this'], accessories: [] },
            obi:   { hp: 35, maxHp: 35, atk: 9, def: 9, spd: 8, heart: 7,
                     level: 1, xp: 0, moves: ['good_boy_charge'], accessories: ['blue_bandana'] },
            luna:  { hp: 20, maxHp: 20, atk: 14, def: 4, spd: 15, heart: 5,
                     level: 1, xp: 0, moves: ['pounce'], accessories: [] },
        },
        positions: {
            annie: { x: 5, y: 8, facing: 'south' },
            john:  { x: 5, y: 9, facing: 'south' },
            obi:   { x: 4, y: 9, facing: 'south' },
            luna:  { x: 6, y: 9, facing: 'south' },
        },
    },

    // Inventory
    inventory: {
        items: [],            // [{ id: 'potion', qty: 3 }, ...]
        coins: 50,
    },

    // Progression
    flags: {},                // { 'ch0_packed_boxes': true, 'ch1_met_raccoon': false, ... }
    questLog: [],             // [{ id: 'find_keys', chapter: 0, status: 'active', steps: [...] }]
    littleThings: [],         // ['lt_ch0_car', 'lt_ch0_water', ...] — collected IDs

    // World
    warmth: {                 // per-chapter warmth counters
        ch0: 0, ch1: 0, ch2: 0, ch3: 0, ch4: 0,
        ch5: 0, ch6: 0, ch7: 0, ch8: 0,
    },
    befriended: [],           // ['raccoon_ch1', 'goose_ch2', ...] — creature IDs
    bestiary: {},             // { raccoon: { seen: true, befriended: true, entry: 'obi' } }

    // Collections
    fishLog: [],              // caught fish IDs
    collections: {},          // { ch1_arrowheads: ['ah_1', 'ah_3'], ... }
    recipes: [],              // unlocked recipe IDs
    photos: [],               // scenic spot IDs photographed

    // Car (visual state)
    car: {
        bumperStickers: [],   // ['ch1_rest_stop', 'ch3_kentucky']
        scratched: false,
        noseprints: 0,
    },
};
```

### 5b. State Access API

State is never mutated directly by systems. All reads and writes go through a thin API that can trigger events.

```javascript
// game-state.js
export function getState() { return state; }
export function setFlag(key, value = true) { state.flags[key] = value; events.emit('flag:set', key); }
export function hasFlag(key) { return !!state.flags[key]; }
export function addItem(id, qty = 1) { ... events.emit('item:added', id, qty); }
export function removeItem(id, qty = 1) { ... }
export function addCoins(n) { state.inventory.coins += n; events.emit('coins:changed'); }
export function addXP(amount) { ... /* distributes to all alive party members, checks level-up */ }
export function addWarmth(chapter, amount) { state.warmth[chapter] += amount; events.emit('warmth:changed', chapter); }
export function collectLittleThing(id) { state.littleThings.push(id); events.emit('littleThing:collected', id); }
export function addBefriend(creatureId) { state.befriended.push(creatureId); events.emit('creature:befriended', creatureId); }
```

### 5c. Save/Load Schema

```javascript
// save.js
const SAVE_KEY = 'homeward_save';

export function save(slot) {
    const data = {
        version: 1,
        slot,
        timestamp: Date.now(),
        state: JSON.parse(JSON.stringify(getState())), // deep clone
    };
    localStorage.setItem(`${SAVE_KEY}_${slot}`, JSON.stringify(data));
}

export function load(slot) {
    const raw = localStorage.getItem(`${SAVE_KEY}_${slot}`);
    if (!raw) return null;
    const data = JSON.parse(raw);
    // version migration here if needed
    return data.state;
}

export function getSlotPreview(slot) {
    // Returns { chapter, playTime, timestamp, partyLevels } for slot selection screen
}
```

Auto-save triggers: area transitions, rest points, after battle victory.

---

## 6. Event Bus

Cross-system communication happens through a central pub/sub event bus. This decouples systems — the battle system doesn't need to import the bestiary module; it just emits `creature:befriended` and the bestiary subscribes to it.

```javascript
// events.js
const listeners = {};

export function on(event, callback) {
    (listeners[event] ||= []).push(callback);
    return () => off(event, callback); // returns unsubscribe function
}

export function off(event, callback) {
    listeners[event] = (listeners[event] || []).filter(cb => cb !== callback);
}

export function emit(event, ...args) {
    (listeners[event] || []).forEach(cb => cb(...args));
}
```

### Key Events

| Event | Emitted By | Consumed By | Payload |
|-------|-----------|-------------|---------|
| `flag:set` | game-state | dialogue, npc, trigger-zone | `(key)` |
| `item:added` | game-state | hud (flash), quest log (check completion) | `(itemId, qty)` |
| `coins:changed` | game-state | hud (animate counter) | none |
| `warmth:changed` | game-state | overworld (palette shift, spawn flowers) | `(chapter)` |
| `littleThing:collected` | game-state | journal (notification), hud (glow effect) | `(id)` |
| `creature:befriended` | battle/befriend | bestiary, warmth, flags | `(creatureId)` |
| `quest:started` | dialogue | journal | `(questId)` |
| `quest:completed` | game-state | journal (notification), warmth | `(questId)` |
| `party:switched` | party | camera, hud, overworld (perspective shift) | `(characterId)` |
| `chapter:entered` | overworld | assets (preload next), audio (change theme) | `(chapterNum)` |
| `battle:started` | encounter | audio (battle music), hud (hide) | `(encounterData)` |
| `battle:ended` | battle | audio (restore), overworld (resume) | `(result)` |
| `dialogue:started` | overworld | hud (hide), input (lock) | `(dialogueId)` |
| `dialogue:ended` | dialogue | overworld (resume), flags (set completion) | `(dialogueId, choices)` |

---

## 7. Rendering Pipeline

### Draw Order (bottom to top)

```
1. Tile layer: ground          ── tilemap ground layer
2. Tile layer: decoration      ── walkable decorations (flowers, cracks, Warmth-spawned flowers)
3. Entity layer (Y-sorted)     ── characters, NPCs, items, interactables
4. Tile layer: overlay         ── tree canopy, roof overhangs (fade when player underneath)
5. Effects layer               ── particles (butterflies, fireflies), weather
6. Perspective overlay         ── character-specific tints (Obi scent trails, Luna highlights)
7. Time-of-day tint            ── fullscreen color overlay based on timeOfDay state
8. Warmth tint                 ── additional warm tint based on area warmth (stacks with time-of-day)
9. HUD                         ── health, coins, active character (fades after 3s)
10. Dialogue box               ── when active (or overlay_text for John's Moments)
11. Transition overlay         ── fade-to-black, screen wipe
```

### Y-Sorting

Entities on the entity layer are sorted by their `y + height` value each frame before rendering. This creates correct depth — a character standing below a tree appears in front of it; a character above appears behind it.

```javascript
function renderEntityLayer(ctx, entities) {
    entities.sort((a, b) => (a.y + a.height) - (b.y + b.height));
    for (const entity of entities) {
        entity.render(ctx);
    }
}
```

### Camera

```javascript
// camera.js
export const camera = {
    x: 0, y: 0,          // top-left corner of viewport in world pixels
    targetX: 0, targetY: 0,
    shakeX: 0, shakeY: 0,

    follow(entity) {
        this.targetX = entity.x + entity.width / 2 - CANVAS_W / 2;
        this.targetY = entity.y + entity.height / 2 - CANVAS_H / 2;
    },

    update(dt) {
        // Smooth follow with lerp
        const speed = 0.1;
        this.x += (this.targetX - this.x) * speed;
        this.y += (this.targetY - this.y) * speed;

        // Clamp to map bounds
        this.x = Math.max(0, Math.min(this.x, mapWidth - CANVAS_W));
        this.y = Math.max(0, Math.min(this.y, mapHeight - CANVAS_H));

        // Decay shake
        this.shakeX *= 0.9;
        this.shakeY *= 0.9;
    },

    apply(ctx) {
        ctx.translate(
            -Math.round(this.x + this.shakeX),
            -Math.round(this.y + this.shakeY)
        );
    },

    shake(intensity = 3) {
        this.shakeX = (Math.random() - 0.5) * intensity * 2;
        this.shakeY = (Math.random() - 0.5) * intensity * 2;
    },
};
```

### Overlay Fade (Tree Canopy / Rooftops)

When the active character walks under an overlay tile, that overlay group fades to ~30% opacity. This requires overlay tiles to be tagged with group IDs in the Tiled map so the whole roof fades together, not individual tiles.

```javascript
function renderOverlayLayer(ctx, overlayTiles, playerTileX, playerTileY) {
    const playerGroup = getOverlayGroupAt(playerTileX, playerTileY);
    for (const tile of overlayTiles) {
        const alpha = (tile.group === playerGroup) ? 0.3 : 1.0;
        ctx.globalAlpha = alpha;
        drawTile(ctx, tile);
    }
    ctx.globalAlpha = 1.0;
}
```

---

## 8. Tilemap System

### Map Format (Tiled JSON)

Maps are created in Tiled, exported as JSON. Each map file contains:

```javascript
{
    "width": 30,               // map width in tiles
    "height": 20,              // map height in tiles
    "tilewidth": 32,
    "tileheight": 32,
    "layers": [
        {
            "name": "ground",
            "type": "tilelayer",
            "data": [1, 1, 2, 3, ...],   // tile IDs, row-major
        },
        {
            "name": "decoration",
            "type": "tilelayer",
            "data": [0, 0, 45, 0, ...],  // 0 = empty
        },
        {
            "name": "collision",
            "type": "tilelayer",
            "data": [0, 0, 1, 1, ...],   // 1 = blocked, 0 = walkable
        },
        {
            "name": "overlay",
            "type": "tilelayer",
            "data": [0, 0, 0, 0, ...],
            "properties": { "overlayGroups": { ... } }
        },
        {
            "name": "entities",
            "type": "objectgroup",
            "objects": [
                { "name": "spawn_start", "type": "spawn", "x": 160, "y": 256 },
                { "name": "npc_neighbor", "type": "npc", "x": 320, "y": 192,
                  "properties": { "dialogueId": "ch0_neighbor_01" } },
                { "name": "door_to_street", "type": "transition", "x": 448, "y": 384,
                  "width": 32, "height": 32,
                  "properties": { "targetMap": "ch0-street", "targetSpawn": "from_apartment" } },
                { "name": "dig_spot_1", "type": "ability_spot", "x": 256, "y": 320,
                  "properties": { "ability": "dig", "reward": "arrowhead_1" } },
                { "name": "lt_ch0_car", "type": "little_thing", "x": 128, "y": 288,
                  "properties": { "text": "She always makes sure everyone has water before she gets her own." } },
            ]
        }
    ],
    "tilesets": [
        { "firstgid": 1, "source": "ch0-apartment-tiles.json" }
    ]
}
```

### tilemap.js Exports

```javascript
export function loadMap(mapId) { ... }        // fetch JSON, parse, set up layers
export function getTile(layer, x, y) { ... }  // get tile ID at grid position
export function isBlocked(x, y) { ... }       // check collision layer
export function getEntitiesOfType(type) { ... } // get all spawns, NPCs, etc.
export function renderLayer(ctx, layerName) { ... } // draw one tile layer
export function getMapSize() { ... }          // { width, height } in pixels
```

---

## 9. Entity System

Entities are lightweight objects — not classes with deep inheritance. Each entity type has a factory function that returns an object with the standard interface.

### Entity Interface

```javascript
{
    id: 'npc_neighbor_01',
    type: 'npc',               // 'player', 'npc', 'item', 'interactable', 'trigger', 'littleThing'
    x: 160, y: 256,            // world position in pixels
    width: 32, height: 48,     // hitbox dimensions
    facing: 'south',           // 'north', 'south', 'east', 'west'
    sprite: null,              // reference to sprite sheet + current animation tag
    visible: true,
    active: true,              // inactive entities skip update/render

    update(dt) { },
    render(ctx) { },
    onInteract(activeCharacter) { },  // called when player presses action button facing this entity
}
```

### Entity Factory Pattern

```javascript
// npc.js
export function createNPC(data) {
    return {
        id: data.name,
        type: 'npc',
        x: data.x,
        y: data.y,
        width: 32,
        height: 48,
        facing: data.properties?.facing || 'south',
        dialogueId: data.properties?.dialogueId,
        sprite: loadSprite(data.properties?.sprite || 'generic-npc'),
        schedule: data.properties?.schedule || null,

        update(dt) {
            // patrol route / schedule logic
        },

        render(ctx) {
            drawSprite(ctx, this.sprite, this.x, this.y, this.facing);
        },

        onInteract(activeCharacter) {
            const dialogueData = getDialogueForCharacter(this.dialogueId, activeCharacter);
            setMode('dialogue', { dialogue: dialogueData, speaker: this.id });
        },
    };
}
```

### Character-Specific Interactions

Interactable objects define which character abilities can activate them:

```javascript
// From Tiled object data
{
    "name": "dig_spot_1",
    "type": "ability_spot",
    "properties": {
        "ability": "dig",       // only Obi can use this
        "reward": "buried_bone",
        "flag": "ch1_dug_bone"  // set this flag when used
    }
}
```

The overworld checks: does the active character have the required ability? If yes, show interaction prompt. If no, show a character-specific "can't do that" message (Annie: "I think Obi could dig here..." / Luna: *ignores it entirely*).

---

## 10. Movement & Collision

### Grid-Based Movement with Smooth Tweening

Characters move tile-to-tile on the grid, but the visual position smoothly interpolates between grid cells. Characters taller than one tile (humans at 32×48) need a Y rendering offset so their feet align with the tile, not their head.

```javascript
// Directional vectors for 8 directions
const DIR_VECTORS = {
    north:     { dx: 0, dy: -1 },
    south:     { dx: 0, dy:  1 },
    east:      { dx: 1, dy:  0 },
    west:      { dx:-1, dy:  0 },
    northeast: { dx: 1, dy: -1 },
    northwest: { dx:-1, dy: -1 },
    southeast: { dx: 1, dy:  1 },
    southwest: { dx:-1, dy:  1 },
};

// player.js (simplified)
const player = {
    gridX: 5, gridY: 8,         // logical grid position (tile the feet are on)
    pixelX: 160, pixelY: 256,   // visual position of the feet tile (smooth)
    targetX: 160, targetY: 256,
    moving: false,
    moveTimer: 0,
    MOVE_DURATION: 200,          // ms per tile
    spriteWidth: 32,             // Annie/John: 32, Obi: 32, Luna: 24
    spriteHeight: 48,            // Annie/John: 48, Obi: 32, Luna: 32

    // Y rendering offset: sprite is drawn ABOVE the grid position so feet align
    get renderY() { return this.pixelY - (this.spriteHeight - TILE_SIZE); },
    // X rendering offset: center sprites narrower than a tile
    get renderX() { return this.pixelX + (TILE_SIZE - this.spriteWidth) / 2; },

    update(dt) {
        if (this.moving) {
            this.moveTimer += dt;
            const t = Math.min(this.moveTimer / this.MOVE_DURATION, 1);
            this.pixelX = lerp(this.startX, this.targetX, t);
            this.pixelY = lerp(this.startY, this.targetY, t);

            if (t >= 1) {
                this.moving = false;
                this.pixelX = this.targetX;
                this.pixelY = this.targetY;
                this.onArrived();
            }
        } else {
            const dir = input.getDirection();
            if (dir) this.tryMove(dir);
        }
    },

    tryMove(direction) {
        const { dx, dy } = DIR_VECTORS[direction];
        const newX = this.gridX + dx;
        const newY = this.gridY + dy;

        // For diagonal movement, also check both adjacent tiles to prevent corner-cutting
        const blocked = isBlocked(newX, newY) || isEntityBlocking(newX, newY);
        const cornerBlocked = (dx !== 0 && dy !== 0) &&
            (isBlocked(this.gridX + dx, this.gridY) || isBlocked(this.gridX, this.gridY + dy));

        this.facing = direction;

        if (!blocked && !cornerBlocked) {
            this.startX = this.pixelX;
            this.startY = this.pixelY;
            this.gridX = newX;
            this.gridY = newY;
            this.targetX = newX * TILE_SIZE;
            this.targetY = newY * TILE_SIZE;
            this.moving = true;
            this.moveTimer = 0;
        }
    },

    render(ctx) {
        drawSprite(ctx, this.sprite, this.animTag, this.frame,
            Math.round(this.renderX), Math.round(this.renderY));
    },

    onArrived() {
        checkTriggerZones(this.gridX, this.gridY);
        checkEncounterZone(this.gridX, this.gridY);
    },
};
```

### Party Following

Non-active party members follow the active character with a delay. Each follower stores a queue of the leader's past positions and replays them with a gap.

```javascript
// party.js
const FOLLOW_DELAY = 3; // number of grid steps behind

export function updateFollowers(leaderHistory) {
    const followers = getInactiveMembers();
    followers.forEach((follower, index) => {
        const historyIndex = leaderHistory.length - (FOLLOW_DELAY * (index + 1));
        if (historyIndex >= 0) {
            const target = leaderHistory[historyIndex];
            follower.gridX = target.x;
            follower.gridY = target.y;
            follower.facing = target.facing;
            // tween follower.pixelX/Y toward grid position
        }
    });
}
```

---

## 11. Dialogue System

### Dialogue Data Format

```javascript
// dialogue.json (per chapter)
{
    "ch0_neighbor_01": {
        "speaker": "Mrs. Patterson",
        "portrait": "npc_patterson",
        "lines": {
            // Character-variant dialogue
            "annie": [
                { "text": "Oh Annie dear, I'm going to miss you so much!", "expression": "sad" },
                { "text": "You take care of those fur babies, you hear?", "expression": "happy" }
            ],
            "john": [
                { "text": "John! You take care of Annie for us.", "expression": "neutral" },
                { "text": "And don't forget to write!", "expression": "happy" }
            ],
            "obi": [
                { "text": "What a good boy! Oh, I'll miss this face.", "expression": "happy" },
                { "_internal": "This person smells like cookies. I trust her with my life.", "expression": "neutral" }
            ],
            "luna": [
                { "text": "Oh, the cat. Yes. Hello.", "expression": "neutral" },
                { "_internal": "She always smelled like lavender. Adequate.", "expression": "neutral" }
            ]
        },
        "onComplete": {
            "setFlag": "ch0_talked_to_patterson",
            "addWarmth": 1
        }
    }
}
```

The `_internal` field marks internal monologue (animal thoughts the player sees but NPCs don't "say"). Rendered in italics or a different text color.

### Dialogue Branching (Choices)

```javascript
{
    "ch2_pie_contest": {
        "speaker": "Contest Judge",
        "lines": {
            "default": [
                { "text": "We need one more entry for the pie contest! You folks interested?" },
                {
                    "choice": true,
                    "options": [
                        { "label": "We'd love to!", "next": "accept", "flag": "ch2_entered_contest" },
                        { "label": "Maybe later.", "next": "decline" }
                    ]
                }
            ]
        },
        "branches": {
            "accept": [
                { "text": "Wonderful! Head to the kitchen tent and show us what you've got!" }
            ],
            "decline": [
                { "text": "Well, if you change your mind, we'll be here 'til sundown." }
            ]
        }
    }
}
```

### dialogue.js Exports

```javascript
export function startDialogue(dialogueId, activeCharacter) { ... }
export function advanceLine() { ... }     // next line or finish
export function selectChoice(index) { ... }
export function isActive() { ... }        // is dialogue currently showing?
```

---

## 12. Battle System

### Battle State Machine

```
INTRO → BUILD_TURN_ORDER → NEXT_TURN → SELECT_ACTION → EXECUTE_ACTION → CHECK_END → (loop to NEXT_TURN or END)
```

| Phase | What Happens |
|-------|-------------|
| INTRO | Camera transition, enemy appears, battle music starts |
| BUILD_TURN_ORDER | All party + enemies sorted by Speed (with slight randomization). Rebuilt each round. |
| NEXT_TURN | Pop next unit from turn order. If it's a party member → SELECT_ACTION. If enemy → ENEMY_AI. |
| SELECT_ACTION | Player chooses: Attack / Special / Befriend / Item / Flee. If a combo is available, it appears as a Special option. |
| ENEMY_AI | Enemy AI selects action automatically |
| EXECUTE_ACTION | Action animation plays, damage/effect applied |
| CHECK_END | All enemies defeated/befriended? Party wiped? If neither, NEXT_TURN. If turn order empty, BUILD_TURN_ORDER (new round). |
| END_VICTORY | XP, coins, items distributed. Befriended creatures logged. Return to overworld. |
| END_DEFEAT | Party regroups at last save point. No penalty. Encouraging message. |

Turns are **speed-interleaved** — a fast character like Luna (SPD 15) may act before every enemy, while a slower character like John (SPD 7) may act after some enemies. This makes Speed meaningful and creates tactical depth.

### Combo Moves

Combo moves are two-character joint actions unlocked at higher levels. They appear as Special options when both participating characters are alive and neither is incapacitated.

```javascript
const comboMoves = [
    {
        id: 'together',
        name: 'Together',
        characters: ['john', 'annie'],
        unlocksAtLevel: 8,
        type: 'heal',
        description: 'Massive party heal',
        effect: (party) => { /* heal all party members to full */ },
        cooldown: 3, // rounds
    },
    {
        id: 'chaos_siblings',
        name: 'Chaos Siblings',
        characters: ['obi', 'luna'],
        unlocksAtLevel: 6,
        type: 'attack',
        description: 'Simultaneous attack on all enemies',
        effect: (enemies) => { /* damage all enemies */ },
        cooldown: 4,
    },
    {
        id: 'good_boy',
        name: 'Good Boy',
        characters: ['annie', 'obi'],
        unlocksAtLevel: 5,
        type: 'buff',
        description: 'Obi gets a massive attack buff because Annie believes in him',
        effect: (obi) => { /* +50% ATK for 3 turns */ },
        cooldown: 3,
    },
    {
        id: 'mutual_respect',
        name: 'Mutual Respect',
        characters: ['john', 'luna'],
        unlocksAtLevel: 10,
        type: 'attack',
        description: 'Luna actually listens to John for once — precision strike',
        effect: (target) => { /* guaranteed critical, highest single-target damage */ },
        cooldown: 5,
    },
];

// A combo is available to a character if:
// 1. Both characters are alive and not KO'd
// 2. Both are at or above the unlock level
// 3. The combo is not on cooldown
function getAvailableCombos(activeCharacter, party) {
    return comboMoves.filter(combo =>
        combo.characters.includes(activeCharacter.id) &&
        combo.characters.every(id => party[id].hp > 0) &&
        combo.characters.every(id => party[id].level >= combo.unlocksAtLevel) &&
        !combo.onCooldown
    );
}
```

### Turn Order

All 4 party members + all enemies are sorted by Speed stat each round. Turns alternate based on this order — it's not "all players then all enemies."

```javascript
function calculateTurnOrder(party, enemies) {
    const all = [...party, ...enemies].map(unit => ({
        unit,
        speed: unit.spd + Math.random() * 3, // slight randomization
    }));
    all.sort((a, b) => b.speed - a.speed);
    return all.map(entry => entry.unit);
}
```

### Befriend Mechanic Data

```javascript
// enemies.json (partial)
{
    "raccoon": {
        "name": "Trash Panda",
        "hp": 25, "atk": 6, "def": 5, "spd": 9,
        "moves": ["scratch", "rummage"],
        "befriendThreshold": 100,
        "befriendActions": {
            "annie_talk": 20,
            "annie_compliment": 15,
            "annie_offer_snack": 40,
            "john_share_food": 35,
            "john_dad_joke": 25,
            "john_wait_patiently": 15,
            "obi_wag_tail": 30,
            "obi_play_bow": 25,
            "obi_puppy_eyes": 35,
            "luna_ignore_pointedly": 20,
            "luna_slow_blink": 30,
            "luna_nap_nearby": 10
        },
        "befriendAnimation": "raccoon_shares_snack",
        "bestiary_obi": "This friend smells like pizza boxes and ambition.",
        "bestiary_luna": "Mediocre. Unacceptable dining habits. 3/10."
    }
}
```

---

## 13. Character Perspective System

When the active character changes, the overworld applies visual and behavioral shifts.

```javascript
// perspective.js
const perspectives = {
    annie: {
        tint: null,                    // no tint — default warm view
        overlays: [],                  // no special overlays
        littleThingsVisible: true,     // only Annie sees them
        interactionStyle: 'empathetic',
    },
    john: {
        tint: { r: 0, g: 0, b: 10, a: 0.05 },  // very slight cool shift
        overlays: ['fixable_objects'],  // highlight broken things
        littleThingsVisible: false,
        interactionStyle: 'practical',
    },
    obi: {
        tint: { r: 10, g: 5, b: 0, a: 0.03 },  // very slight warm shift
        overlays: ['scent_trails', 'food_glow', 'squirrel_alert'],
        littleThingsVisible: false,
        interactionStyle: 'excited',
    },
    luna: {
        tint: { r: 0, g: 0, b: 15, a: 0.05 },  // slight cool shift
        overlays: ['high_places', 'small_prey', 'ratings'],
        littleThingsVisible: false,
        interactionStyle: 'withering',
    },
};
```

The `overlays` array determines which special visual indicators appear on the overworld (scent trails for Obi, climbable ledges highlighted for Luna, etc.). These are rendered on the perspective overlay layer (#6 in the draw order).

---

## 14. Asset Loading Strategy

### Chapter-Based Manifests

Assets are loaded per chapter. Each chapter has a manifest listing its required assets. On chapter transition, the engine preloads the next chapter's assets during the transition screen.

```javascript
// Example manifest: data/chapters/ch0/manifest.json
{
    "sprites": [
        "sprites/annie-walk.png",
        "sprites/obi-walk.png",
        "sprites/luna-walk.png",
        "sprites/john-walk.png",
        "sprites/npc-patterson.png"
    ],
    "tiles": [
        "tiles/ch0-apartment.png",
        "tiles/ch0-street.png"
    ],
    "portraits": [
        "portraits/annie-neutral.png",
        "portraits/annie-happy.png",
        "portraits/patterson-neutral.png"
    ],
    "maps": [
        "data/chapters/ch0/maps/apartment.json",
        "data/chapters/ch0/maps/street.json"
    ],
    "data": [
        "data/chapters/ch0/dialogue.json",
        "data/chapters/ch0/npcs.json",
        "data/chapters/ch0/cutscenes.json"
    ]
}
```

### Sprite Sheet Format

Sprite sheets are PNG grids with an accompanying JSON metadata file (exported from Aseprite via `Export Sprite Sheet` with `Split Tags`).

```javascript
// sprites/annie-walk.json (Aseprite export format)
{
    "frames": {
        "annie-walk-south-0": { "frame": { "x": 0, "y": 0, "w": 32, "h": 48 }, "duration": 125 },
        "annie-walk-south-1": { "frame": { "x": 32, "y": 0, "w": 32, "h": 48 }, "duration": 125 },
        "annie-walk-south-2": { "frame": { "x": 64, "y": 0, "w": 32, "h": 48 }, "duration": 125 },
        "annie-walk-south-3": { "frame": { "x": 96, "y": 0, "w": 32, "h": 48 }, "duration": 125 },
        // ... all 8 directions × 4 frames
    },
    "meta": {
        "frameTags": [
            { "name": "walk_south", "from": 0, "to": 3, "direction": "forward" },
            { "name": "walk_north", "from": 4, "to": 7, "direction": "forward" },
            { "name": "walk_east",  "from": 8, "to": 11, "direction": "forward" },
            { "name": "walk_west",  "from": 12, "to": 15, "direction": "forward" },
            // ... SE, SW, NE, NW
            { "name": "idle_south", "from": 32, "to": 33, "direction": "forward" },
            // ...
        ],
        "image": "annie-walk.png",
        "size": { "w": 256, "h": 384 }
    }
}
```

### Sprite Renderer

```javascript
// In assets.js or a sprite utility
export function drawSprite(ctx, spriteSheet, animTag, frameIndex, x, y) {
    const tag = spriteSheet.meta.frameTags.find(t => t.name === animTag);
    const frameKey = Object.keys(spriteSheet.frames)[tag.from + frameIndex];
    const frame = spriteSheet.frames[frameKey].frame;

    ctx.drawImage(
        spriteSheet.image,       // the loaded PNG
        frame.x, frame.y,       // source x, y
        frame.w, frame.h,       // source width, height
        Math.round(x), Math.round(y),  // dest x, y (rounded for pixel-perfect)
        frame.w, frame.h        // dest width, height (1:1 at native res)
    );
}
```

---

## 15. Cutscene System

Cutscenes are scripted sequences stored as data. The cutscene engine reads a list of actions and executes them in order (or in parallel when grouped).

### Cutscene Data Format

```javascript
// cutscenes.json
{
    "ch0_leaving_home": {
        "letterbox": true,
        "actions": [
            { "type": "fade_in", "duration": 500 },
            { "type": "camera_pan", "to": { "x": 5, "y": 3 }, "duration": 1000 },
            { "type": "walk_to", "entity": "annie", "x": 7, "y": 5, "wait": true },
            { "type": "face", "entity": "annie", "direction": "north" },
            { "type": "say", "entity": "annie", "text": "I think that's the last box.", "expression": "neutral" },
            { "type": "wait", "duration": 500 },
            { "type": "walk_to", "entity": "obi", "x": 7, "y": 6, "wait": true },
            { "type": "emote", "entity": "obi", "emote": "!" },
            { "type": "say", "entity": "obi", "text": "", "_internal": "Why are all the things in boxes? Are we eating the boxes?", "expression": "confused" },
            { "type": "parallel", "actions": [
                { "type": "walk_to", "entity": "john", "x": 6, "y": 5 },
                { "type": "walk_to", "entity": "luna", "x": 8, "y": 4 }
            ]},
            { "type": "say", "entity": "john", "text": "Car's loaded. Ready when you are.", "expression": "neutral" },
            { "type": "fade_out", "duration": 1000 },
            { "type": "transition", "targetMap": "ch0-street", "spawn": "car" }
        ]
    }
}
```

### Cutscene Action Types

| Action | Params | Behavior |
|--------|--------|----------|
| `fade_in` / `fade_out` | duration | Screen fade |
| `camera_pan` | to, duration | Move camera to world position or entity |
| `walk_to` | entity, x, y, wait | Move entity to grid position. If wait=true, next action waits. |
| `face` | entity, direction | Turn entity to face direction |
| `say` | entity, text, expression | Show dialogue box. Advances on player input. |
| `overlay_text` | text, style, duration | Text rendered directly over scene (no box). Used for John's Moments. |
| `emote` | entity, emote | Show emote bubble (!, ?, ♥, ...) above entity |
| `wait` | duration | Pause for N ms |
| `parallel` | actions[] | Execute multiple actions simultaneously |
| `set_flag` | flag | Set a story flag |
| `play_sound` | sound | Play sound effect |
| `shake` | intensity, duration | Camera shake |
| `letterbox` | enable | Toggle cinematic black bars |
| `transition` | targetMap, spawn | Load new map and place party |
| `set_time` | timeOfDay | Change time of day (triggers palette shift, NPC schedules) |

---

## 16. Input System

```javascript
// input.js
const keys = {};        // current frame state: true if held
const justPressed = {}; // true only on the frame the key went down
const justReleased = {};

const bindings = {
    up:       ['ArrowUp', 'KeyW'],
    down:     ['ArrowDown', 'KeyS'],
    left:     ['ArrowLeft', 'KeyA'],
    right:    ['ArrowRight', 'KeyD'],
    action:   ['Space', 'Enter', 'KeyZ'],
    cancel:   ['Escape', 'KeyX'],
    menu:     ['Escape', 'KeyP'],
    switch:   ['Tab', 'KeyQ'],
    ability:  ['KeyE', 'ShiftLeft'],
};

export function isHeld(action) { return bindings[action].some(k => keys[k]); }
export function wasPressed(action) { return bindings[action].some(k => justPressed[k]); }
export function wasReleased(action) { return bindings[action].some(k => justReleased[k]); }

export function getDirection() {
    const up = isHeld('up'), down = isHeld('down');
    const left = isHeld('left'), right = isHeld('right');

    if (up && left) return 'northwest';
    if (up && right) return 'northeast';
    if (down && left) return 'southwest';
    if (down && right) return 'southeast';
    if (up) return 'north';
    if (down) return 'south';
    if (left) return 'west';
    if (right) return 'east';
    return null;
}

export function poll() {
    // Clear justPressed/justReleased at the start of each logic tick
    Object.keys(justPressed).forEach(k => justPressed[k] = false);
    Object.keys(justReleased).forEach(k => justReleased[k] = false);
}
```

---

## 17. Audio System

Evolved from ACD's procedural Web Audio system. Each area has a musical theme defined as a set of layers that build up as Warmth increases.

```javascript
// audio.js (conceptual)
const themes = {
    ch0_apartment: {
        bpm: 80,
        key: 'C',
        layers: [
            { name: 'piano', warmthMin: 0 },        // always plays
            { name: 'strings', warmthMin: 5 },       // appears at warmth 5
            { name: 'woodwinds', warmthMin: 10 },    // appears at warmth 10
        ],
    },
    battle: {
        bpm: 120,
        key: 'Am',
        layers: [{ name: 'full', warmthMin: 0 }],
    },
};

export function setTheme(themeId) { ... }
export function updateWarmthLayers(warmth) { ... }  // add/remove layers based on warmth
export function playSFX(sfxId) { ... }
export function fadeOut(duration) { ... }
export function fadeIn(duration) { ... }
```

---

## 18. Time-of-Day System

Each chapter defines its own day cycle behavior. Some chapters (like the driving segments) have a fixed time. Town chapters advance time as the player completes quests.

```javascript
// In game-state.js
// timeOfDay: 'morning' | 'day' | 'evening' | 'night'

const TIME_TINTS = {
    morning: { r: 255, g: 240, b: 208, a: 0.10 },  // #FFF0D0 at 10%
    day:     null,                                     // no tint
    evening: { r: 240, g: 200, b: 144, a: 0.15 },   // #F0C890 at 15%
    night:   { r: 96,  g: 128, b: 168, a: 0.20 },   // #6080A8 at 20%
};

// Applied after all tile/entity rendering, before HUD
function applyTimeOfDayTint(ctx, time) {
    const tint = TIME_TINTS[time];
    if (!tint) return;
    ctx.fillStyle = `rgba(${tint.r}, ${tint.g}, ${tint.b}, ${tint.a})`;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
}
```

Time advances via story flags, not a real-time clock. A quest completion might set `timeOfDay: 'evening'`. This is simpler and gives narrative control over the lighting.

---

## 19. Ambient Effects System

Particles and ambient creatures that make the world feel alive. Managed by a simple particle pool.

```javascript
// effects.js
const particles = [];

export function spawnAmbient(type, area) {
    const templates = {
        butterflies: { sprite: 'butterfly', count: 3, speed: 0.3, drift: true, warmthMin: 3 },
        fireflies:   { sprite: 'firefly', count: 8, speed: 0.2, glow: true, timeReq: 'evening' },
        birds:       { sprite: 'bird', count: 2, speed: 1.0, fly: true, warmthMin: 0 },
        rain:        { sprite: 'raindrop', count: 40, speed: 2.0, fall: true },
        flowers:     { sprite: 'flower', count: 0, speed: 0, static: true, warmthMin: 5 },
        // flowers don't move — they're placed on walkable tiles as warmth increases
    };
    // spawn particles based on template, area warmth, and time of day
}

export function updateParticles(dt) {
    for (const p of particles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) recycle(p);
    }
}

export function renderParticles(ctx) {
    for (const p of particles) {
        drawSprite(ctx, p.sprite, p.frame, p.x, p.y);
    }
}
```

Warmth thresholds trigger ambient spawns: at warmth 3 → butterflies appear, at warmth 5 → flowers bloom on empty grass tiles, at warmth 10 → full ambient life. The overworld subscribes to `warmth:changed` and calls `spawnAmbient()` when thresholds are crossed.

---

## 20. Warmth Threshold Effects

The warmth system needs concrete threshold definitions so it's implementable, not just conceptual.

```javascript
// warmth.js
const WARMTH_THRESHOLDS = [
    { level: 2,  effect: 'npc_friendlier',   desc: 'Some NPCs unlock new dialogue lines' },
    { level: 3,  effect: 'butterflies',       desc: 'Butterflies spawn in outdoor areas' },
    { level: 5,  effect: 'flowers',           desc: 'Flowers appear on bare grass tiles' },
    { level: 7,  effect: 'palette_warm',      desc: 'Area palette shifts +5% warm tint' },
    { level: 10, effect: 'music_layer',       desc: 'Music adds an instrument layer' },
    { level: 15, effect: 'palette_warmer',    desc: 'Area palette shifts +10% warm tint' },
    { level: 20, effect: 'full_bloom',        desc: 'Maximum ambient life, music fully layered' },
];

// Called when warmth changes for a chapter
export function getActiveEffects(warmthValue) {
    return WARMTH_THRESHOLDS.filter(t => warmthValue >= t.level);
}

// Epilogue uses total warmth across all chapters
export function getTotalWarmth(state) {
    return Object.values(state.warmth).reduce((sum, v) => sum + v, 0);
}

// Epilogue warmth tiers
// < 30: small housewarming (just parents)
// 30-60: medium (parents + a few NPCs from the journey)
// 60-90: large (many returning NPCs, decorated house)
// 90+: full (everyone, full decorations, extended credits montage)
```

---

## 21. John's Moments (Cutscene Variant)

John's Moments are cutscenes with special visual treatment. They're defined in the regular cutscene data but with a `"variant": "johns_moment"` flag that triggers different rendering.

```javascript
// cutscene data
{
    "ch3_sunset": {
        "variant": "johns_moment",
        "letterbox": true,
        "actions": [
            { "type": "fade_in", "duration": 800 },
            { "type": "camera_pan", "to": "annie", "duration": 1500 },
            { "type": "overlay_text", "text": "She's pointing at something in the sky.",
              "style": "johns_moment", "duration": 3000 },
            { "type": "wait", "duration": 1000 },
            { "type": "overlay_text", "text": "She always sees things I'd walk right past.",
              "style": "johns_moment", "duration": 3000 },
            { "type": "fade_out", "duration": 1000 }
        ]
    }
}
```

**Rendering difference:** Normal dialogue uses a text box at the bottom with a portrait. John's Moments use `overlay_text` — translucent text rendered directly over the scene, no text box, no portrait. Font is slightly different (italic or serif). The camera focuses on what John is watching, not on John himself. These are the 5–6 most emotionally impactful moments in the game.

---

## 22. Accessory Rendering System

Accessories are stat-boosting equippable items that are visible on character sprites. They're rendered as sprite overlays on top of the base character sprite.

```javascript
// Each accessory defines per-direction offsets for rendering on top of the character
const accessoryDefs = {
    blue_bandana: {
        slot: 'neck',
        sprite: 'acc_blue_bandana',
        statBonus: { def: 2 },
        offsets: {
            south: { x: 0, y: 12 },
            north: { x: 0, y: 10 },
            east:  { x: -2, y: 11 },
            west:  { x: 2, y: 11 },
            // ... 8 directions
        },
    },
    sun_hat: {
        slot: 'head',
        sprite: 'acc_sun_hat',
        statBonus: { heart: 1 },
        offsets: { /* per-direction */ },
    },
};

// In entity render:
function renderCharacterWithAccessories(ctx, character) {
    // Draw base sprite
    drawSprite(ctx, character.sprite, character.animTag, character.frame, character.renderX, character.renderY);

    // Draw equipped accessories
    for (const accId of character.accessories) {
        const acc = accessoryDefs[accId];
        const offset = acc.offsets[character.facing] || { x: 0, y: 0 };
        drawSprite(ctx, acc.sprite, character.facing, 0,
            character.renderX + offset.x,
            character.renderY + offset.y);
    }
}
```

---

## 23. Perspective Overlay Rendering

When Obi is active and uses Sniff, or when Luna sees climbable surfaces, these are rendered as colored tile highlights on the perspective overlay layer.

```javascript
// perspective-overlays.js
const overlayTypes = {
    scent_trails: {
        character: 'obi',
        tileColor: 'rgba(200, 170, 80, 0.25)',  // golden translucent
        // Which tiles to highlight is driven by data in the map's object layer:
        // objects of type "sniff_spot" define locations
        // When Obi uses Sniff ability, nearby sniff_spots within 5 tiles become visible
    },
    food_glow: {
        character: 'obi',
        entityFilter: (entity) => entity.type === 'item' && entity.properties?.edible,
        glowColor: 'rgba(240, 200, 100, 0.4)',
    },
    high_places: {
        character: 'luna',
        tileProperty: 'climbable',  // tiles with this custom property in Tiled
        highlightColor: 'rgba(100, 200, 180, 0.3)',
    },
    fixable_objects: {
        character: 'john',
        entityFilter: (entity) => entity.type === 'interactable' && entity.properties?.ability === 'fix',
        highlightColor: 'rgba(120, 160, 200, 0.3)',
    },
};

// Rendered on layer 6 (after entities, before HUD)
export function renderPerspectiveOverlays(ctx, activeCharacter, map, entities) {
    for (const [key, overlay] of Object.entries(overlayTypes)) {
        if (overlay.character !== activeCharacter) continue;
        // render highlighted tiles or entity glows based on overlay type
    }
}
```

---

## 24. NPC Schedule System

Simple time-based NPC positioning. NPCs define positions for each time of day. When time changes, NPCs tween to their new position.

```javascript
// In npcs.json
{
    "npc_baker": {
        "sprite": "baker",
        "schedule": {
            "morning": { "map": "ch2-main-street", "x": 8, "y": 5, "facing": "south" },
            "day":     { "map": "ch2-main-street", "x": 8, "y": 5, "facing": "south" },
            "evening": { "map": "ch2-main-street", "x": 12, "y": 8, "facing": "west" },
            "night":   null  // NPC not present
        },
        "dialogue": {
            "morning": "ch2_baker_morning",
            "day":     "ch2_baker_day",
            "evening": "ch2_baker_evening"
        }
    }
}
```

When `timeOfDay` changes, the overworld iterates all NPCs on the current map and updates their positions. If an NPC's schedule says `null` for the current time, they're removed from the entity list. Different dialogue IDs per time means NPCs say different things in the morning vs evening.

---

## 25. Missing Data Schemas

### Quest Definition

```javascript
// In ch0/quests.json
{
    "find_keys": {
        "name": "Where Are My Keys?",
        "chapter": 0,
        "giver": "annie",         // who initiates (can be a cutscene)
        "description": "Find the apartment keys before we can lock up.",
        "steps": [
            { "id": "search_kitchen", "text": "Check the kitchen counter", "flag": "ch0_checked_kitchen" },
            { "id": "search_couch", "text": "Look under the couch cushions", "flag": "ch0_checked_couch", "requireAbility": "sniff" },
            { "id": "found_keys", "text": "Found them! Behind the bookshelf.", "flag": "ch0_found_keys" }
        ],
        "rewards": { "xp": 20, "coins": 10, "warmth": 2, "item": null },
        "completionDialogue": "ch0_keys_found"
    }
}
```

### Item Definition

```javascript
// items.json
{
    "potion": {
        "name": "Trail Mix",
        "category": "consumable",     // consumable, key_item, accessory, treasure, gift
        "description": "A hearty mix of nuts and dried fruit. Restores 15 HP.",
        "effect": { "type": "heal", "target": "one", "amount": 15 },
        "price": 8,
        "icon": "item_trail_mix"
    },
    "apartment_keys": {
        "name": "Apartment Keys",
        "category": "key_item",
        "description": "The keys to the old apartment. Time to lock up one last time.",
        "effect": null,
        "price": null,
        "icon": "item_keys"
    },
    "blue_bandana": {
        "name": "Blue Bandana",
        "category": "accessory",
        "description": "Obi's signature look. +2 DEF.",
        "equippable_by": ["obi"],
        "slot": "neck",
        "statBonus": { "def": 2 },
        "icon": "item_bandana",
        "price": null   // not sellable — it's Obi's
    }
}
```

### Level-Up Curve

```javascript
// In party.json
{
    "xp_curve": [
        0,     // level 1 (starting)
        100,   // level 2
        250,   // level 3
        450,   // level 4
        700,   // level 5
        1000,  // level 6
        1400,  // level 7
        1900,  // level 8
        2500,  // level 9
        3200,  // level 10
        4000,  // level 11
        5000,  // level 12
        6200,  // level 13
        7600,  // level 14
        9200,  // level 15
        11000, // level 16
        13000, // level 17
        15500, // level 18
        18500, // level 19
        22000  // level 20 (max)
    ],
    "stat_growth": {
        "annie": { "hp": 3, "atk": 1, "def": 1, "spd": 1, "heart": 2 },
        "john":  { "hp": 4, "atk": 2, "def": 2, "spd": 1, "heart": 1 },
        "obi":   { "hp": 3, "atk": 2, "def": 2, "spd": 1, "heart": 1 },
        "luna":  { "hp": 2, "atk": 3, "def": 0, "spd": 2, "heart": 1 }
    },
    "move_unlocks": {
        "annie": [
            { "level": 1,  "move": "encourage" },
            { "level": 3,  "move": "youve_got_this" },
            { "level": 6,  "move": "cozy_vibes" },
            { "level": 10, "move": "group_hug" }
        ],
        "john": [
            { "level": 1,  "move": "ive_got_this" },
            { "level": 3,  "move": "hold_on" },
            { "level": 7,  "move": "dad_energy" },
            { "level": 12, "move": "steady_hand" }
        ],
        "obi": [
            { "level": 1,  "move": "good_boy_charge" },
            { "level": 3,  "move": "protective_howl" },
            { "level": 5,  "move": "tail_wag" },
            { "level": 9,  "move": "zoomies" }
        ],
        "luna": [
            { "level": 1,  "move": "pounce" },
            { "level": 3,  "move": "cat_nap" },
            { "level": 6,  "move": "knock_it_off_the_table" },
            { "level": 10, "move": "murder_mittens" }
        ]
    }
}
```

### Recipe Format

```javascript
// recipes.json
{
    "campfire_stew": {
        "name": "Campfire Stew",
        "ingredients": ["potato", "carrot", "broth"],
        "result": {
            "item": "campfire_stew_item",
            "effect": { "type": "heal", "target": "all", "amount": 20 }
        },
        "annieBonus": { "type": "heal", "target": "all", "amount": 30 },
        "chapter_available": 1
    }
}
```

---

## 26. Milestone 0 — What Gets Built First

The vertical slice builds all core systems at minimum viable depth. Here's the exact file list and what each one does for Milestone 0:

### Must Implement

| File | What it does for M0 |
|------|---------------------|
| `index.html` | Canvas element, CSS scaling, entry script |
| `main.js` | Init canvas, load Ch0 assets, start loop |
| `constants.js` | All game constants |
| `engine/game-loop.js` | Fixed-step update + variable render |
| `engine/canvas.js` | Canvas setup, pixel-perfect integer scaling |
| `engine/input.js` | Keyboard state, direction, action, menu |
| `engine/camera.js` | Follow player, smooth lerp, map bounds |
| `engine/assets.js` | Load PNG + JSON sprite sheets, load map JSON |
| `engine/events.js` | Pub/sub bus |
| `engine/transitions.js` | Fade-to-black only |
| `state/game-state.js` | Master state object + access API |
| `state/mode-machine.js` | Mode switching with enter/exit |
| `world/tilemap.js` | Load Tiled JSON, render ground + collision |
| `world/entity.js` | Base entity interface |
| `world/player.js` | Grid movement, facing, collision check |
| `world/party.js` | 4 members, active switching, follow queue |
| `world/npc.js` | Static NPC with interaction trigger |
| `world/interactable.js` | One ability spot (Obi dig) |
| `world/little-things.js` | One collectible, Annie-only visibility |
| `world/overworld.js` | Overworld mode controller |
| `ui/hud.js` | Active character indicator only |
| `ui/dialogue.js` | Text box with portrait, typewriter, advance |

### Must Have Assets

- Annie walk sprite sheet (8-dir, 4 frames per dir) — or minimum 4-dir
- Obi walk sprite sheet (4-dir minimum)
- Luna walk sprite sheet (4-dir minimum)
- John walk sprite sheet (4-dir minimum)
- One NPC static sprite
- Annie portrait (neutral expression)
- Ch0 apartment tileset
- Ch0 apartment map (Tiled JSON, ~20×15 tiles)

### Deliverable

Annie walks around the apartment. Switch to John/Obi/Luna with Tab — they follow. Walk up to the neighbor NPC, press Space — dialogue box appears with character-variant text. Find a Little Thing as Annie (invisible as anyone else). Walk to the door — fade to black.

**This is Milestone 0.** Everything after this is adding systems (battle, cutscene, menu) one at a time and building chapters on top of the validated foundation.
