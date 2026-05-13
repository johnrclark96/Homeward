// Tilemap loader, accessor, and renderer. Architecture doc §8.
// Designed to accept real Tiled JSON exports — placeholder color rendering for now.

import { TILE_SIZE, CANVAS_W, CANVAS_H } from '../constants.js';
import { TEST_TILE_COLORS } from './data/test-map.js';

let mapData = null;
let layersByName = {};
let entityLayer = null;
let colorMap = TEST_TILE_COLORS;

export function loadMap(data, colors = TEST_TILE_COLORS) {
    mapData = data;
    layersByName = {};
    entityLayer = null;
    for (const layer of data.layers) {
        if (layer.type === 'tilelayer') {
            layersByName[layer.name] = layer;
        } else if (layer.type === 'objectgroup') {
            entityLayer = layer;
            layersByName[layer.name] = layer;
        }
    }
    colorMap = colors;
}

export function getMapData() {
    return mapData;
}

export function getMapSize() {
    if (!mapData) return { widthPx: 0, heightPx: 0, widthTiles: 0, heightTiles: 0 };
    return {
        widthPx: mapData.width * TILE_SIZE,
        heightPx: mapData.height * TILE_SIZE,
        widthTiles: mapData.width,
        heightTiles: mapData.height,
    };
}

export function getTile(layerName, x, y) {
    const layer = layersByName[layerName];
    if (!layer || layer.type !== 'tilelayer') return 0;
    if (x < 0 || y < 0 || x >= mapData.width || y >= mapData.height) return 0;
    return layer.data[y * mapData.width + x];
}

// Out-of-bounds counts as blocked (architecture doc §10 implementation note).
export function isBlocked(x, y) {
    if (!mapData) return true;
    if (x < 0 || y < 0 || x >= mapData.width || y >= mapData.height) return true;
    const collision = layersByName['collision'];
    if (!collision) return false;
    return collision.data[y * mapData.width + x] === 1;
}

export function getEntitiesOfType(type) {
    if (!entityLayer) return [];
    return entityLayer.objects.filter(o => o.type === type);
}

export function getEntityByName(name) {
    if (!entityLayer) return null;
    return entityLayer.objects.find(o => o.name === name) || null;
}

// Render only the tiles intersecting the camera viewport.
export function renderLayer(ctx, layerName, camera) {
    const layer = layersByName[layerName];
    if (!layer || layer.type !== 'tilelayer') return;

    const startX = Math.max(0, Math.floor(camera.x / TILE_SIZE));
    const startY = Math.max(0, Math.floor(camera.y / TILE_SIZE));
    const endX = Math.min(mapData.width,  Math.ceil((camera.x + CANVAS_W) / TILE_SIZE));
    const endY = Math.min(mapData.height, Math.ceil((camera.y + CANVAS_H) / TILE_SIZE));

    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
            const id = layer.data[y * mapData.width + x];
            if (id === 0 && layerName !== 'ground') continue; // skip empty in non-ground layers
            const color = colorMap[id];
            if (!color) continue;
            ctx.fillStyle = color;
            ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
    }
}

// Renders the collision layer as a wall fill — useful while we lack tileset art.
// The "0" floor cells in collision are skipped; "1" cells fill with the wall color.
export function renderCollisionAsWalls(ctx, camera, color = '#6B4830') {
    const layer = layersByName['collision'];
    if (!layer) return;
    const startX = Math.max(0, Math.floor(camera.x / TILE_SIZE));
    const startY = Math.max(0, Math.floor(camera.y / TILE_SIZE));
    const endX = Math.min(mapData.width,  Math.ceil((camera.x + CANVAS_W) / TILE_SIZE));
    const endY = Math.min(mapData.height, Math.ceil((camera.y + CANVAS_H) / TILE_SIZE));

    ctx.fillStyle = color;
    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
            if (layer.data[y * mapData.width + x] === 1) {
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }
    }
}
