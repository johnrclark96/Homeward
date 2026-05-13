// Little Thing collectible. GDD §4 — the emotional core of the game.
//
// A soft golden glow on the floor, visible only when Annie is the active
// character. Annie walks over it → quiet text appears, then the glow is gone
// forever. No fanfare, no notification, no name — the moment IS the reward.

import { TILE_SIZE } from '../constants.js';
import * as modeMachine from '../state/mode-machine.js';
import * as events from '../engine/events.js';
import { getState, collectLittleThing } from '../state/game-state.js';
import { littleThingOverlay } from '../ui/little-thing-overlay.js';

const GOLD = '#F0D070';
const PULSE_RATE_ALPHA = 0.003;  // sin coefficient — slow, steady breath
const PULSE_RATE_RADIUS = 0.002;

export function createLittleThing(objectData) {
    const gridX = Math.floor(objectData.x / TILE_SIZE);
    const gridY = Math.floor(objectData.y / TILE_SIZE);
    const id = objectData.properties?.id || objectData.name;
    const text = objectData.properties?.text || '';

    if (!id) {
        console.warn('Little Thing missing id — skipping', objectData);
        return null;
    }

    const alreadyCollected = getState().littleThings.includes(id);

    const thing = {
        id,
        type: 'little_thing',
        gridX,
        gridY,
        pixelX: gridX * TILE_SIZE,
        pixelY: gridY * TILE_SIZE,
        // Floor-level effect. Sort key (y + height) lands on the tile's
        // vertical center, which is well above any character's feet, so the
        // glow always renders behind whoever's standing on it.
        spriteWidth: TILE_SIZE,
        spriteHeight: TILE_SIZE / 2,
        text,

        // Visibility tied to the active party member. Set on creation and
        // refreshed via the party:switched listener below.
        visible: !alreadyCollected && getState().party.active === 'annie',
        active: !alreadyCollected,
        blocking: false,
        interactable: false,

        // Y-sort hooks. Floor-level effect: sort on the tile's vertical center
        // so characters always sort in front of the glow when standing on it.
        get x() { return this.pixelX; },
        get y() { return this.pixelY; },
        get width()  { return this.spriteWidth; },
        get height() { return this.spriteHeight; },

        update(/* dt */) { /* pulse is time-based in render */ },

        render(ctx /* , alpha */) {
            if (!this.visible) return;
            const cx = this.pixelX + TILE_SIZE / 2;
            const cy = this.pixelY + TILE_SIZE / 2;

            const t = Date.now();
            const pulse  = 0.5 + 0.3 * Math.sin(t * PULSE_RATE_ALPHA);
            const radius = 8 + 3 * Math.sin(t * PULSE_RATE_RADIUS);

            ctx.save();

            // Outer soft halo
            ctx.globalAlpha = pulse * 0.3;
            ctx.fillStyle = GOLD;
            ctx.beginPath();
            ctx.arc(cx, cy, radius + 5, 0, Math.PI * 2);
            ctx.fill();

            // Inner core
            ctx.globalAlpha = pulse;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        },

        onPlayerArrived(player) {
            if (!this.active) return;
            // Only Annie can collect. Other characters can't even see the
            // glow, so this branch is defensive.
            if (player.characterId !== 'annie') return;

            this.active = false;
            this.visible = false;
            collectLittleThing(this.id);
            modeMachine.pushMode(littleThingOverlay, { text: this.text });
        },
    };

    const unsubscribe = events.on('party:switched', (newActive) => {
        if (!thing.active) return;   // already collected
        thing.visible = (newActive === 'annie');
    });

    thing.destroy = unsubscribe;
    return thing;
}
