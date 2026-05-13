// Keyboard input. Architecture doc §16.

import { KEY_BINDINGS } from '../constants.js';

const keys = {};         // currently held
const justPressed = {};  // true only on the tick the key went down
const justReleased = {}; // true only on the tick the key went up

function onKeyDown(e) {
    if (keys[e.code]) return;       // ignore key-repeat
    keys[e.code] = true;
    justPressed[e.code] = true;
    // Prevent default for keys we use (stops Tab from changing focus, Space from scrolling, etc.)
    if (isBoundKey(e.code)) e.preventDefault();
}

function onKeyUp(e) {
    keys[e.code] = false;
    justReleased[e.code] = true;
    if (isBoundKey(e.code)) e.preventDefault();
}

function isBoundKey(code) {
    for (const action in KEY_BINDINGS) {
        if (KEY_BINDINGS[action].includes(code)) return true;
    }
    return false;
}

export function init() {
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    // Clear key state if the window loses focus — otherwise keys can get "stuck".
    window.addEventListener('blur', () => {
        for (const k in keys) keys[k] = false;
    });
}

export function isHeld(action) {
    return KEY_BINDINGS[action].some(k => keys[k]);
}

export function wasPressed(action) {
    return KEY_BINDINGS[action].some(k => justPressed[k]);
}

export function wasReleased(action) {
    return KEY_BINDINGS[action].some(k => justReleased[k]);
}

export function getDirection() {
    const up = isHeld('up'), down = isHeld('down');
    const left = isHeld('left'), right = isHeld('right');

    if (up && left) return 'northwest';
    if (up && right) return 'northeast';
    if (down && left) return 'southwest';
    if (down && right) return 'southeast';
    if (up) return 'north';
    if (down) return 'south';
    if (left) return 'west';
    if (right) return 'east';
    return null;
}

// Called at the start of each logic tick to clear single-frame edge state.
export function poll() {
    for (const k in justPressed) justPressed[k] = false;
    for (const k in justReleased) justReleased[k] = false;
}
