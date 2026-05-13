// Overworld mode controller. Wires tilemap, camera, party, NPCs, and the
// entity render order.
// Architecture doc §4 (mode interface), §7 (draw order), §9 (entities).

import { TILE_SIZE } from '../constants.js';
import * as tilemap from './tilemap.js';
import { camera } from '../engine/camera.js';
import * as input from '../engine/input.js';
import { testMap, TEST_TILE_COLORS } from './data/test-map.js';
import {
    initParty, updateParty, getActiveCharacter, getPartyEntities,
} from './party.js';
import { createNPC } from './npc.js';
import {
    setEntities, getInteractableAt,
} from './entity-registry.js';

// Cardinal direction → tile-offset for "the tile in front of me", used for
// finding the entity an active character is facing on action-button press.
const FACING_VECTORS = {
    north: { dx:  0, dy: -1 },
    south: { dx:  0, dy:  1 },
    east:  { dx:  1, dy:  0 },
    west:  { dx: -1, dy:  0 },
};

export function createOverworld() {
    const entities = [];
    let initialized = false;

    function tryInteract() {
        const leader = getActiveCharacter();
        if (!leader || leader.moving) return;
        const v = FACING_VECTORS[leader.facing] || FACING_VECTORS.south;
        const tx = leader.gridX + v.dx;
        const ty = leader.gridY + v.dy;
        const target = getInteractableAt(tx, ty);
        if (target && typeof target.onInteract === 'function') {
            target.onInteract(leader.characterId);
        }
    }

    return {
        enter(/* params */) {
            tilemap.loadMap(testMap, TEST_TILE_COLORS);
            const size = tilemap.getMapSize();
            camera.setBounds(size.widthPx, size.heightPx);

            const spawn = tilemap.getEntityByName('spawn_start');
            const spawnTileX = spawn ? Math.floor(spawn.x / TILE_SIZE) : 5;
            const spawnTileY = spawn ? Math.floor(spawn.y / TILE_SIZE) : 5;

            initParty(spawnTileX, spawnTileY, 'south');

            // Build the entity list: party first, then NPCs from the map.
            entities.length = 0;
            for (const member of getPartyEntities()) entities.push(member);
            for (const obj of tilemap.getEntitiesOfType('npc')) {
                entities.push(createNPC(obj));
            }
            setEntities(entities);

            camera.snapTo(getActiveCharacter());
            initialized = true;
        },

        exit() {
            entities.length = 0;
            setEntities(entities);
            initialized = false;
        },

        // pause / resume are called by the mode machine when an overlay (dialogue,
        // menu, etc.) is pushed / popped on top of the overworld. Don't tear down
        // state — the overlay will re-render the world as a frozen backdrop.
        pause() { },
        resume() { },

        update(dt) {
            updateParty(dt);

            // NPCs (and any other non-party entities).
            for (const e of entities) {
                if (e.type === 'player') continue; // already updated by party
                if (e.active && typeof e.update === 'function') e.update(dt);
            }

            // Action button → talk-to-NPC (when standing still, facing one).
            if (input.wasPressed('action')) tryInteract();

            const active = getActiveCharacter();
            if (active) camera.follow(active);
            camera.update(dt);
        },

        render(ctx, alpha = 0) {
            // Background fill — anything outside the map shows the void color.
            const { widthPx, heightPx } = tilemap.getMapSize();
            ctx.fillStyle = '#3A2E28';
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

            camera.apply(ctx, alpha);

            // 1. Ground
            tilemap.renderLayer(ctx, 'ground', camera);
            // 2. Decoration
            tilemap.renderLayer(ctx, 'decoration', camera);
            // 2b. Walls (until real wall tiles exist)
            tilemap.renderCollisionAsWalls(ctx, camera);

            // 3. Entity layer — Y-sorted. Sort works off entity.y + entity.height
            //    which both party members and NPCs expose via getters.
            const visible = entities.filter(e => e.visible);
            visible.sort((a, b) => (a.y + a.height) - (b.y + b.height));
            for (const e of visible) e.render(ctx, alpha);

            // 4. Overlay
            tilemap.renderLayer(ctx, 'overlay', camera);

            camera.reset(ctx);

            // (Effects, perspective overlay, time-of-day tint, warmth tint, HUD —
            //  all later sessions.)
            void widthPx; void heightPx; void initialized;
        },

        // Test/inspection access
        getPlayer() { return getActiveCharacter(); },
        getEntities() { return entities; },
    };
}
