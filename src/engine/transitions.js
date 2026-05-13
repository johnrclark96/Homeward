// Fade-to-black overlay. Architecture doc §4 (area transition flow).
//
// The transition system is a singleton overlay that lives outside the mode
// machine — when a fade is active, modes still update/render normally, but a
// full-screen black rectangle is drawn on top at the appropriate opacity, and
// input is reported as "locked" so the player / party can suppress reads.
//
// For M0 we only support fade_out and fade_in; chaining (out → load → in)
// belongs to a later milestone.

import { CANVAS_W, CANVAS_H } from '../constants.js';

const TYPE_FADE_OUT = 'fade_out';
const TYPE_FADE_IN  = 'fade_in';

let active = null;  // { type, duration, elapsed, callback }

export function startFade(type, duration = 500, callback = null) {
    if (type !== TYPE_FADE_OUT && type !== TYPE_FADE_IN) {
        console.warn(`Unknown transition type: ${type}`);
        return;
    }
    active = { type, duration: Math.max(1, duration), elapsed: 0, callback };
}

export function isActive() {
    return active !== null;
}

// Input is locked for the full duration of any in-flight fade. Held fades
// (a finished fade_out that's holding on black) keep input locked too —
// the player should not be able to walk while the screen is dark.
export function isInputLocked() {
    return active !== null;
}

// Reset to fully-transparent and clear any in-flight animation. Used by
// future area-transition glue once we have a map to load into.
export function clear() {
    active = null;
}

export function update(dt) {
    if (!active) return;
    active.elapsed += dt;
    if (active.elapsed >= active.duration) {
        const cb = active.callback;
        // The callback may itself call startFade (e.g. fade_out → load → fade_in).
        // We hold on whichever terminal state the fade ended at if no callback
        // schedules a successor: fade_out → opaque black, fade_in → cleared.
        const wasFadeOut = active.type === TYPE_FADE_OUT;
        if (wasFadeOut) {
            // Hold on black. Input stays locked until callback / clear() runs.
            active.elapsed = active.duration;
        } else {
            active = null;
        }
        if (typeof cb === 'function') cb();
    }
}

// Returns the current overlay alpha in [0, 1] — 0 = transparent, 1 = opaque.
export function currentAlpha() {
    if (!active) return 0;
    const t = Math.min(active.elapsed / active.duration, 1);
    return active.type === TYPE_FADE_OUT ? t : (1 - t);
}

export function render(ctx) {
    const a = currentAlpha();
    if (a <= 0) return;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.globalAlpha = 1;
    ctx.restore();
}

export const FADE_OUT = TYPE_FADE_OUT;
export const FADE_IN  = TYPE_FADE_IN;
