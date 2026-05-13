// Hardcoded apartment test map in Tiled-compatible JSON format.
// Architecture doc §8 — same structure as a real Tiled export.
//
// 20 tiles wide × 15 tiles tall. Walls around the perimeter (collision=1).
// One rug and a small table in the middle. Door gap at the south wall.

import { TILE_SIZE } from '../../constants.js';

const W = 20;
const H = 15;

function build(fn) {
    const arr = new Array(W * H);
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            arr[y * W + x] = fn(x, y);
        }
    }
    return arr;
}

// Tile ID 1 = floor everywhere.
const groundData = build(() => 1);

// Decoration: rug in the middle, table surface.
//   Tile 2 = rug (Soft Tan)
//   Tile 3 = table surface (Warm Brown)
const decorationData = build((x, y) => {
    if (x >= 8 && x <= 11 && y >= 6 && y <= 9) return 2;   // rug
    if (y === 5 && (x === 5 || x === 6)) return 3;          // table
    return 0;
});

// Collision: 1 = blocked, 0 = walkable.
const collisionData = build((x, y) => {
    // Door gap at south wall — entity layer has the transition object here.
    if (y === H - 1 && x === 10) return 0;
    // Outer walls
    if (x === 0 || x === W - 1 || y === 0 || y === H - 1) return 1;
    // Table blocks movement
    if (y === 5 && (x === 5 || x === 6)) return 1;
    return 0;
});

export const testMap = {
    width: W,
    height: H,
    tilewidth: TILE_SIZE,
    tileheight: TILE_SIZE,
    layers: [
        { name: 'ground',     type: 'tilelayer',  data: groundData },
        { name: 'decoration', type: 'tilelayer',  data: decorationData },
        { name: 'collision',  type: 'tilelayer',  data: collisionData },
        { name: 'overlay',    type: 'tilelayer',  data: build(() => 0) },
        {
            name: 'entities',
            type: 'objectgroup',
            objects: [
                {
                    name: 'spawn_start',
                    type: 'spawn',
                    x: 10 * TILE_SIZE,
                    y: 7 * TILE_SIZE,
                },
                {
                    name: 'npc_neighbor',
                    type: 'npc',
                    x: 4 * TILE_SIZE,
                    y: 4 * TILE_SIZE,
                    properties: { dialogueId: 'ch0_neighbor_01' },
                },
                {
                    name: 'door_to_street',
                    type: 'transition',
                    x: 10 * TILE_SIZE,
                    y: 14 * TILE_SIZE,
                    width: TILE_SIZE,
                    height: TILE_SIZE,
                    properties: { targetMap: 'ch0-street', targetSpawn: 'from_apartment' },
                },
            ],
        },
    ],
    tilesets: [],
};

// Color mapping for placeholder rendering (no tileset image yet).
export const TEST_TILE_COLORS = {
    0: '#6B4830', // wall fill / empty (Deep Brown)
    1: '#F0E0C8', // floor (Warm Sand)
    2: '#D4B896', // rug (Soft Tan)
    3: '#A07850', // table surface (Warm Brown)
};
