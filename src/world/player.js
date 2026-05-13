// Player / party-member character. Architecture doc §10.
// Grid-based movement with smooth pixel tweening; 8-directional with corner-cut
// prevention. The same factory is used for the active player AND followers —
// `active: true` reads input, `active: false` waits for moveToGrid() calls.

import { TILE_SIZE, CHARACTER_DIMS } from '../constants.js';
import * as input from '../engine/input.js';
import * as transitions from '../engine/transitions.js';
import * as modeMachine from '../state/mode-machine.js';
import { isBlocked } from './tilemap.js';
import { isBlockingEntityAt, getEntities } from './entity-registry.js';

const DIR_VECTORS = {
    north:     { dx:  0, dy: -1 },
    south:     { dx:  0, dy:  1 },
    east:      { dx:  1, dy:  0 },
    west:      { dx: -1, dy:  0 },
    northeast: { dx:  1, dy: -1 },
    northwest: { dx: -1, dy: -1 },
    southeast: { dx:  1, dy:  1 },
    southwest: { dx: -1, dy:  1 },
};

const FACING_CARDINAL = {
    north: 'north', south: 'south', east: 'east', west: 'west',
    northeast: 'east', southeast: 'east',
    northwest: 'west', southwest: 'west',
};

function lerp(a, b, t) { return a + (b - a) * t; }

export function createPlayer(characterId, gridX, gridY) {
    const dims = CHARACTER_DIMS[characterId];
    if (!dims) throw new Error(`Unknown character: ${characterId}`);

    const px = gridX * TILE_SIZE;
    const py = gridY * TILE_SIZE;

    const player = {
        id: characterId,
        type: 'player',
        characterId,
        gridX,
        gridY,
        pixelX: px,
        pixelY: py,
        // prev* are captured at the start of each update() so render() can
        // interpolate between logic ticks (30Hz logic, 60Hz render). Without
        // this, the sprite snaps once per tick instead of moving smoothly.
        prevPixelX: px,
        prevPixelY: py,
        startX: px,
        startY: py,
        targetX: px,
        targetY: py,
        moving: false,
        moveTimer: 0,
        MOVE_DURATION: 200,
        facing: 'south',
        visible: true,
        active: true,
        // The active player blocks NPC walking-into-it; followers don't block
        // anything (spec: "Only NPCs and map tiles block movement").
        blocking: false,

        spriteWidth:  dims.width,
        spriteHeight: dims.height,
        color: dims.color,
        label: dims.label,

        // Required by Y-sort + camera follow. These read the *logical* pixel
        // position (not the per-frame interpolated one) so camera follow and
        // Y-sort don't oscillate during a tween.
        get x() { return this.renderX; },
        get y() { return this.renderY; },
        get width()  { return this.spriteWidth; },
        get height() { return this.spriteHeight; },

        get renderX() { return this.pixelX + (TILE_SIZE - this.spriteWidth) / 2; },
        get renderY() { return this.pixelY - (this.spriteHeight - TILE_SIZE); },

        update(dt) {
            // Snapshot for render interpolation BEFORE this tick's mutations.
            this.prevPixelX = this.pixelX;
            this.prevPixelY = this.pixelY;

            if (this.moving) {
                this.moveTimer += dt;
                const t = Math.min(this.moveTimer / this.MOVE_DURATION, 1);
                this.pixelX = lerp(this.startX, this.targetX, t);
                this.pixelY = lerp(this.startY, this.targetY, t);
                if (t >= 1) {
                    this.moving = false;
                    this.pixelX = this.targetX;
                    this.pixelY = this.targetY;
                    // Capture the active mode before dispatch — if a triggered
                    // entity (Little Thing, transition, etc.) pushes a new mode,
                    // we must NOT chain another move on the same tick or the
                    // player walks off the trigger tile while the overlay is up.
                    const modeBefore = modeMachine.getMode();
                    this.onArrived();
                    const sameMode = modeMachine.getMode() === modeBefore;
                    // Without the chain, holding a direction key produces a
                    // 0-33ms pause between every tile (one full 30Hz update
                    // of latency). Re-checking input on the same tick the
                    // tween ends keeps movement snappy.
                    if (sameMode && this.active && !this.moving &&
                        !transitions.isInputLocked()) {
                        const dir = input.getDirection();
                        if (dir) this.tryMove(dir);
                    }
                }
            } else if (this.active && !transitions.isInputLocked()) {
                const dir = input.getDirection();
                if (dir) this.tryMove(dir);
            }
            // Followers (active=false) idle here until party.js calls moveToGrid.
        },

        tryMove(direction) {
            const { dx, dy } = DIR_VECTORS[direction];
            const newX = this.gridX + dx;
            const newY = this.gridY + dy;

            // Always face the input direction (cardinalised), even if we can't move.
            this.facing = FACING_CARDINAL[direction];

            const targetBlocked =
                isBlocked(newX, newY) ||
                isBlockingEntityAt(newX, newY, this);

            // Corner-cut prevention: for diagonals, both adjacent tiles must be open.
            const cornerBlocked = (dx !== 0 && dy !== 0) && (
                isBlocked(this.gridX + dx, this.gridY) ||
                isBlocked(this.gridX, this.gridY + dy) ||
                isBlockingEntityAt(this.gridX + dx, this.gridY, this) ||
                isBlockingEntityAt(this.gridX, this.gridY + dy, this)
            );

            if (targetBlocked || cornerBlocked) return;

            this.startX = this.pixelX;
            this.startY = this.pixelY;
            this.gridX = newX;
            this.gridY = newY;
            this.targetX = newX * TILE_SIZE;
            this.targetY = newY * TILE_SIZE;
            this.moving = true;
            this.moveTimer = 0;
        },

        // Used by party.js to steer a follower one tile at a time. Does NOT
        // check tile or entity collision — followers walk through anything
        // (they're visual chain members, not physical actors).
        moveToGrid(newGridX, newGridY, newFacing) {
            if (this.moving) return;
            if (newFacing) this.facing = newFacing;
            if (this.gridX === newGridX && this.gridY === newGridY) return;
            this.startX = this.pixelX;
            this.startY = this.pixelY;
            this.gridX = newGridX;
            this.gridY = newGridY;
            this.targetX = newGridX * TILE_SIZE;
            this.targetY = newGridY * TILE_SIZE;
            this.moving = true;
            this.moveTimer = 0;
        },

        // Snap the entity to a new grid position with no tween (used by party.js
        // when seeding follower positions on switch / spawn).
        snapToGrid(newGridX, newGridY, newFacing) {
            this.gridX = newGridX;
            this.gridY = newGridY;
            this.pixelX = newGridX * TILE_SIZE;
            this.pixelY = newGridY * TILE_SIZE;
            this.prevPixelX = this.pixelX;
            this.prevPixelY = this.pixelY;
            this.startX = this.pixelX;
            this.startY = this.pixelY;
            this.targetX = this.pixelX;
            this.targetY = this.pixelY;
            this.moving = false;
            this.moveTimer = 0;
            if (newFacing) this.facing = newFacing;
        },

        onArrived() {
            // Dispatch to anything sharing this tile (Little Things, trigger
            // zones, encounter zones, ability spots, etc.). Entities opt in by
            // exposing onPlayerArrived(player); silent skip otherwise. The
            // active player is the only one that drives this — followers walk
            // through everything per spec.
            if (!this.active) return;
            const list = getEntities();
            for (const e of list) {
                if (e === this) continue;
                if (!e.active) continue;
                if (e.gridX !== this.gridX || e.gridY !== this.gridY) continue;
                if (typeof e.onPlayerArrived === 'function') {
                    e.onPlayerArrived(this);
                }
            }
        },

        render(ctx, alpha = 0) {
            // Interpolate visual position between this tick and last so the sprite
            // moves smoothly at 60Hz, not in 30Hz steps.
            const ipx = this.prevPixelX + (this.pixelX - this.prevPixelX) * alpha;
            const ipy = this.prevPixelY + (this.pixelY - this.prevPixelY) * alpha;
            const rx = Math.round(ipx + (TILE_SIZE - this.spriteWidth) / 2);
            const ry = Math.round(ipy - (this.spriteHeight - TILE_SIZE));
            const w = this.spriteWidth;
            const h = this.spriteHeight;

            // Body rectangle
            ctx.fillStyle = this.color;
            ctx.fillRect(rx, ry, w, h);

            // Outline so the sprite reads against same-tone backgrounds
            ctx.strokeStyle = '#3A2E28';
            ctx.lineWidth = 1;
            ctx.strokeRect(rx + 0.5, ry + 0.5, w - 1, h - 1);

            // Facing indicator
            ctx.fillStyle = '#FFF8F0';
            const cx = rx + w / 2;
            const cy = ry + h / 2;
            const t = 4;
            ctx.beginPath();
            switch (this.facing) {
                case 'north':
                    ctx.moveTo(cx, ry + 2);
                    ctx.lineTo(cx - t, ry + 2 + t);
                    ctx.lineTo(cx + t, ry + 2 + t);
                    break;
                case 'south':
                    ctx.moveTo(cx, ry + h - 2);
                    ctx.lineTo(cx - t, ry + h - 2 - t);
                    ctx.lineTo(cx + t, ry + h - 2 - t);
                    break;
                case 'east':
                    ctx.moveTo(rx + w - 2, cy);
                    ctx.lineTo(rx + w - 2 - t, cy - t);
                    ctx.lineTo(rx + w - 2 - t, cy + t);
                    break;
                case 'west':
                    ctx.moveTo(rx + 2, cy);
                    ctx.lineTo(rx + 2 + t, cy - t);
                    ctx.lineTo(rx + 2 + t, cy + t);
                    break;
            }
            ctx.closePath();
            ctx.fill();

            // Centered identifying letter
            ctx.fillStyle = '#FFF8F0';
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.label, cx, cy);
        },

        onInteract() { },
    };

    return player;
}
