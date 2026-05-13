// Fixed-step update / variable-render game loop. Architecture doc §3.

import { TICK_RATE, MAX_DELTA } from '../constants.js';
import { getCtx } from './canvas.js';
import * as input from './input.js';

let modeMachine = null;
let lastTime = 0;
let accumulator = 0;
let running = false;

export function startLoop(machine) {
    modeMachine = machine;
    lastTime = performance.now();
    accumulator = 0;
    running = true;
    requestAnimationFrame(frame);
}

function frame(now) {
    if (!running) return;

    let delta = now - lastTime;
    lastTime = now;

    // Clamp huge deltas (backgrounded tab, breakpoint paused) so the accumulator
    // doesn't try to drain dozens of ticks at once — "spiral of death" guard.
    if (delta > MAX_DELTA) delta = MAX_DELTA;

    accumulator += delta;

    while (accumulator >= TICK_RATE) {
        if (modeMachine) modeMachine.update(TICK_RATE);
        // Clear edge-triggered key state AFTER update so keydown events that
        // arrived between frames are visible to wasPressed() during this tick.
        input.poll();
        accumulator -= TICK_RATE;
    }

    const alpha = accumulator / TICK_RATE;
    const ctx = getCtx();
    if (ctx && modeMachine) modeMachine.render(ctx, alpha);

    requestAnimationFrame(frame);
}

export function stopLoop() {
    running = false;
}
