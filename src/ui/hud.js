// Minimal HUD. Style guide §5. M0 scope: active-character indicator only.
//
// Bottom-left: small color swatch + character name. Bottom-right: "Tab: switch"
// hint. Fades to 30% opacity after 3 seconds of no input; any input restores
// full opacity. Hidden during dialogue and during the Little Thing overlay.

import {
    CANVAS_W, CANVAS_H, KEY_BINDINGS,
    ANNIE_COLOR, JOHN_COLOR, OBI_COLOR, LUNA_COLOR,
} from '../constants.js';
import * as events from '../engine/events.js';
import { getState } from '../state/game-state.js';

const SWATCH_SIZE = 12;
const PADDING = 12;
const TEXT_COLOR = '#FFF8F0';     // Cream
const HINT_COLOR = '#888888';
const FADE_AFTER_MS = 3000;
const ACTIVE_ALPHA = 1.0;
const IDLE_ALPHA = 0.3;

const ACCENT = {
    annie: ANNIE_COLOR,
    john:  JOHN_COLOR,
    obi:   OBI_COLOR,
    luna:  LUNA_COLOR,
};

const NAME = {
    annie: 'Annie',
    john:  'John',
    obi:   'Obi',
    luna:  'Luna',
};

let idleTimer = 0;
let hidden = false;
let initialized = false;

export function init() {
    if (initialized) return;
    initialized = true;
    events.on('dialogue:started', () => { hidden = true; });
    events.on('dialogue:ended',   () => { hidden = false; bump(); });
    events.on('littleThing:reveal',    () => { hidden = true; });
    events.on('littleThing:dismissed', () => { hidden = false; bump(); });
    events.on('party:switched', () => bump());
    events.on('transition:start', () => bump());

    // Any keydown counts as input — keep the HUD awake.
    window.addEventListener('keydown', () => bump());
}

// Restore full opacity and reset the fade timer.
export function bump() {
    idleTimer = 0;
}

export function update(dt) {
    if (hidden) return;
    idleTimer += dt;
}

export function render(ctx) {
    if (hidden) return;

    const state = getState();
    const activeId = state.party.active;
    const color = ACCENT[activeId] || TEXT_COLOR;
    const name = NAME[activeId] || activeId;

    const alpha = idleTimer >= FADE_AFTER_MS ? IDLE_ALPHA : ACTIVE_ALPHA;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = '16px monospace';
    ctx.textBaseline = 'middle';

    // Bottom-left: swatch + active name.
    const swatchX = PADDING;
    const swatchY = CANVAS_H - PADDING - SWATCH_SIZE;
    ctx.fillStyle = color;
    ctx.fillRect(swatchX, swatchY, SWATCH_SIZE, SWATCH_SIZE);
    ctx.strokeStyle = '#3A2E28';
    ctx.lineWidth = 1;
    ctx.strokeRect(swatchX + 0.5, swatchY + 0.5, SWATCH_SIZE - 1, SWATCH_SIZE - 1);

    ctx.textAlign = 'left';
    ctx.fillStyle = TEXT_COLOR;
    ctx.fillText(name, swatchX + SWATCH_SIZE + 8, swatchY + SWATCH_SIZE / 2 + 0.5);

    // Bottom-right: switch hint.
    const switchKey = (KEY_BINDINGS.switch[0] || 'Tab').replace(/^Key/, '');
    ctx.textAlign = 'right';
    ctx.fillStyle = HINT_COLOR;
    ctx.fillText(`${switchKey}: switch`,
                 CANVAS_W - PADDING,
                 swatchY + SWATCH_SIZE / 2 + 0.5);

    ctx.globalAlpha = 1;
    ctx.restore();
}
