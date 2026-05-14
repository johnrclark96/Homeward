// Little Thing reveal overlay. GDD §4.
//
// A quiet, private moment — not a conversation. No portrait, no speaker name,
// no "You found a thought!" announcement. A dim warmth-tinted darkening of the
// whole screen, gold text centered, Space to dismiss. Pushed as a mode on top
// of the overworld so the world stays rendered behind it.

import { CANVAS_W, CANVAS_H } from '../constants.js';
import * as input from '../engine/input.js';
import * as modeMachine from '../state/mode-machine.js';
import * as events from '../engine/events.js';

const TEXT_COLOR = '#F0D070';   // Annie Blonde / warm gold
const TINT_COLOR = '#1A0F0A';   // slightly warmer than charcoal
const TINT_ALPHA = 0.72;
const LINE_HEIGHT = 24;
const MAX_TEXT_WIDTH = 640;
const CHAR_DELAY_MS = 30;

let text = '';
let wrapped = null;
let charsRevealed = 0;
let charTimer = 0;
let pulseTimer = 0;
let waitingForInput = false;
// Swallow the action-button press that started this overlay so it doesn't
// also dismiss it on the same tick. Cleared after the first update tick.
let inputCooldown = true;

function wrap(ctx, raw, maxWidth) {
    const words = raw.split(/(\s+)/);
    const out = [];
    let current = '';
    for (const w of words) {
        if (w === '') continue;
        const test = current + w;
        if (ctx.measureText(test).width > maxWidth && current.trim().length > 0) {
            out.push(current.trimEnd());
            current = /^\s+$/.test(w) ? '' : w;
        } else {
            current = test;
        }
    }
    if (current.trim().length > 0) out.push(current.trimEnd());
    return out;
}

function revealedSlice(lines, total) {
    const result = [];
    let remaining = total;
    for (const w of lines) {
        if (remaining <= 0) { result.push(''); continue; }
        if (w.length <= remaining) {
            result.push(w);
            remaining -= w.length;
            remaining -= 1;
        } else {
            result.push(w.slice(0, remaining));
            remaining = 0;
        }
    }
    return result;
}

export const littleThingOverlay = {
    enter(params = {}) {
        text = params.text || '';
        wrapped = null;
        charsRevealed = 0;
        charTimer = 0;
        pulseTimer = 0;
        waitingForInput = false;
        inputCooldown = true;
        events.emit('littleThing:reveal', text);
    },

    exit() {
        text = '';
        wrapped = null;
        events.emit('littleThing:dismissed');
    },

    update(dt) {
        pulseTimer += dt;

        // Typewriter reveal.
        if (charsRevealed < text.length) {
            charTimer += dt;
            while (charTimer >= CHAR_DELAY_MS && charsRevealed < text.length) {
                charsRevealed++;
                charTimer -= CHAR_DELAY_MS;
            }
            if (charsRevealed >= text.length) waitingForInput = true;
        } else {
            waitingForInput = true;
        }

        if (inputCooldown) {
            inputCooldown = false;
            return;
        }

        if (input.wasPressed('action') || input.wasPressed('cancel')) {
            if (charsRevealed < text.length) {
                charsRevealed = text.length;
                waitingForInput = true;
            } else {
                modeMachine.popMode();
            }
        }
    },

    render(ctx /* , alpha */) {
        ctx.save();

        ctx.globalAlpha = TINT_ALPHA;
        ctx.fillStyle = TINT_COLOR;
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.globalAlpha = 1;

        ctx.font = 'italic 18px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (!wrapped) {
            wrapped = wrap(ctx, text, MAX_TEXT_WIDTH);
        }

        const visible = revealedSlice(wrapped, charsRevealed);
        const totalH = visible.length * LINE_HEIGHT;
        const startY = Math.round((CANVAS_H - totalH) / 2 + LINE_HEIGHT / 2);
        const cx = Math.round(CANVAS_W / 2);

        ctx.fillStyle = TEXT_COLOR;
        for (let i = 0; i < visible.length; i++) {
            ctx.fillText(visible[i], cx, startY + i * LINE_HEIGHT);
        }

        // Soft pulsing dot below the text to hint "press to continue".
        if (waitingForInput) {
            const pulse = 0.4 + 0.4 * Math.abs(Math.sin(pulseTimer / 400));
            ctx.globalAlpha = pulse;
            ctx.fillStyle = TEXT_COLOR;
            const dotY = startY + visible.length * LINE_HEIGHT + 12;
            ctx.beginPath();
            ctx.arc(cx, dotY, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        ctx.restore();
    },
};

export function isActive() {
    return modeMachine.getMode() === littleThingOverlay;
}
