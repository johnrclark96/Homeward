// Trigger zone — invisible tile that fires an action when the player steps
// onto it. Architecture doc §4 (area transition flow).
//
// For M0 the only supported action is 'transition' (fade-to-black). Multi-map
// loading lives in a later milestone; here we just prove the fade fires from
// the door tile.

import { TILE_SIZE } from '../constants.js';
import * as transitions from '../engine/transitions.js';
import * as events from '../engine/events.js';

const FADE_DURATION = 500;

export function createTriggerZone(objectData) {
    const gridX = Math.floor(objectData.x / TILE_SIZE);
    const gridY = Math.floor(objectData.y / TILE_SIZE);

    return {
        id: objectData.name,
        type: 'trigger',
        gridX,
        gridY,
        pixelX: gridX * TILE_SIZE,
        pixelY: gridY * TILE_SIZE,
        spriteWidth: TILE_SIZE,
        spriteHeight: TILE_SIZE,
        // Invisible; not in any visual layer.
        visible: false,
        active: true,
        blocking: false,
        interactable: false,
        fired: false,
        // Map-data fields preserved for the future area-transition flow.
        targetMap: objectData.properties?.targetMap ?? null,
        targetSpawn: objectData.properties?.targetSpawn ?? null,

        // Stubs for the Y-sort code path even though we never render.
        get x() { return this.pixelX; },
        get y() { return this.pixelY; },
        get width()  { return this.spriteWidth; },
        get height() { return this.spriteHeight; },

        update() { },
        render() { /* invisible by design */ },

        onPlayerArrived(/* player */) {
            if (this.fired) return;
            if (transitions.isActive()) return;
            this.fired = true;
            events.emit('transition:start', {
                targetMap: this.targetMap,
                targetSpawn: this.targetSpawn,
            });
            // M0: fade out and hold on black. No second map yet.
            transitions.startFade(transitions.FADE_OUT, FADE_DURATION, () => {
                events.emit('transition:held', {
                    targetMap: this.targetMap,
                    targetSpawn: this.targetSpawn,
                });
            });
        },
    };
}
