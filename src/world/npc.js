// NPC entity factory. Architecture doc §9.
//
// NPCs block movement and respond to the player's action button. Interaction
// hands off to the dialogue mode, which is pushed on top of the overworld so
// the world stays rendered behind the dialogue box.

import { TILE_SIZE, NPC_COLOR } from '../constants.js';
import * as modeMachine from '../state/mode-machine.js';
import { dialogueMode } from '../ui/dialogue.js';

export function createNPC(objectData) {
    const gridX = Math.floor(objectData.x / TILE_SIZE);
    const gridY = Math.floor(objectData.y / TILE_SIZE);
    const dialogueId = objectData.properties?.dialogueId ?? null;
    const spriteW = 32;
    const spriteH = 48;
    const px = gridX * TILE_SIZE;
    const py = gridY * TILE_SIZE;

    // Short label for the placeholder rectangle. "N" is a fine fallback —
    // distinguishable from A/J/O/L without colliding with any party initial.
    const label = (objectData.properties?.label) || 'N';

    return {
        id: objectData.name,
        type: 'npc',
        gridX,
        gridY,
        pixelX: px,
        pixelY: py,
        prevPixelX: px,
        prevPixelY: py,
        spriteWidth: spriteW,
        spriteHeight: spriteH,
        facing: objectData.properties?.facing || 'south',
        visible: true,
        active: true,
        blocking: true,
        interactable: true,
        dialogueId,

        get x() { return this.renderX; },
        get y() { return this.renderY; },
        get width()  { return this.spriteWidth; },
        get height() { return this.spriteHeight; },
        get renderX() { return this.pixelX + (TILE_SIZE - this.spriteWidth) / 2; },
        get renderY() { return this.pixelY - (this.spriteHeight - TILE_SIZE); },

        update(/* dt */) {
            // Static NPC for M0. Schedule / patrol behavior lives here later.
        },

        render(ctx /* , alpha */) {
            // NPC doesn't tween, so no interpolation needed — but keep the
            // signature compatible with the rest of the entity layer.
            const rx = Math.round(this.renderX);
            const ry = Math.round(this.renderY);
            const w = this.spriteWidth;
            const h = this.spriteHeight;

            ctx.fillStyle = NPC_COLOR;
            ctx.fillRect(rx, ry, w, h);

            ctx.strokeStyle = '#3A2E28';
            ctx.lineWidth = 1;
            ctx.strokeRect(rx + 0.5, ry + 0.5, w - 1, h - 1);

            // Facing indicator
            const cx = rx + w / 2;
            const cy = ry + h / 2;
            const t = 4;
            ctx.fillStyle = '#FFF8F0';
            ctx.beginPath();
            switch (this.facing) {
                case 'north':
                    ctx.moveTo(cx, ry + 2);
                    ctx.lineTo(cx - t, ry + 2 + t);
                    ctx.lineTo(cx + t, ry + 2 + t); break;
                case 'south':
                    ctx.moveTo(cx, ry + h - 2);
                    ctx.lineTo(cx - t, ry + h - 2 - t);
                    ctx.lineTo(cx + t, ry + h - 2 - t); break;
                case 'east':
                    ctx.moveTo(rx + w - 2, cy);
                    ctx.lineTo(rx + w - 2 - t, cy - t);
                    ctx.lineTo(rx + w - 2 - t, cy + t); break;
                case 'west':
                    ctx.moveTo(rx + 2, cy);
                    ctx.lineTo(rx + 2 + t, cy - t);
                    ctx.lineTo(rx + 2 + t, cy + t); break;
            }
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#FFF8F0';
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, cx, cy);
        },

        onInteract(activeCharacterId) {
            if (!this.dialogueId) return;
            modeMachine.pushMode(dialogueMode, {
                dialogueId: this.dialogueId,
                activeCharacter: activeCharacterId,
            });
        },
    };
}
