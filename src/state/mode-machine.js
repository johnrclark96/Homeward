// Top-level finite state machine for game modes. Architecture doc §4.
//
// setMode replaces the current mode (full exit/enter).
// pushMode pauses the current mode and overlays a new one (used for dialogue,
//   menu, etc.). The paused mode keeps its state and is re-rendered as a backdrop;
//   only the topmost mode receives update() ticks. popMode reverses it.

let currentMode = null;
const modeStack = [];

export function setMode(newMode, params = {}) {
    if (currentMode && typeof currentMode.exit === 'function') {
        currentMode.exit();
    }
    // setMode always resets the stack — overlays don't survive a hard transition.
    for (const m of modeStack) {
        if (typeof m.exit === 'function') m.exit();
    }
    modeStack.length = 0;

    currentMode = newMode;
    if (currentMode && typeof currentMode.enter === 'function') {
        currentMode.enter(params);
    }
}

// Overlay a mode on top of the current one without exiting it.
// The paused mode retains all internal state; its update() is skipped while
// covered, but its render() still runs (as a frozen backdrop).
export function pushMode(newMode, params = {}) {
    if (currentMode) {
        if (typeof currentMode.pause === 'function') currentMode.pause();
        modeStack.push(currentMode);
    }
    currentMode = newMode;
    if (currentMode && typeof currentMode.enter === 'function') {
        currentMode.enter(params);
    }
}

export function popMode() {
    if (currentMode && typeof currentMode.exit === 'function') {
        currentMode.exit();
    }
    currentMode = modeStack.pop() || null;
    if (currentMode && typeof currentMode.resume === 'function') {
        currentMode.resume();
    }
}

export function getMode() {
    return currentMode;
}

export function update(dt) {
    // Only the topmost (active) mode updates. Stacked modes are frozen.
    if (currentMode && typeof currentMode.update === 'function') {
        currentMode.update(dt);
    }
}

export function render(ctx, alpha) {
    // Render stacked modes first (bottom-up) as static backdrops, then current.
    for (const mode of modeStack) {
        if (typeof mode.render === 'function') mode.render(ctx, alpha);
    }
    if (currentMode && typeof currentMode.render === 'function') {
        currentMode.render(ctx, alpha);
    }
}
