// Core engine constants. Sourced from HOMEWARD-ARCHITECTURE.md §3.

export const TICK_RATE = 1000 / 60;    // 60 Hz logic update (16.67ms per tick)
export const CANVAS_W = 480;            // native pixels
export const CANVAS_H = 270;            // native pixels
export const TILE_SIZE = 32;            // pixels per tile
export const TILES_X = 15;              // visible tiles horizontal
export const TILES_Y = Math.ceil(CANVAS_H / TILE_SIZE); // ~8.4

// Cap delta time so a backgrounded tab doesn't simulate hundreds of ticks.
export const MAX_DELTA = 250;

// Key bindings — architecture doc §16
export const KEY_BINDINGS = {
    up:       ['ArrowUp', 'KeyW'],
    down:     ['ArrowDown', 'KeyS'],
    left:     ['ArrowLeft', 'KeyA'],
    right:    ['ArrowRight', 'KeyD'],
    action:   ['Space', 'Enter', 'KeyZ'],
    cancel:   ['Escape', 'KeyX'],
    menu:     ['Escape', 'KeyP'],
    switch:   ['Tab', 'KeyQ'],
    ability:  ['KeyE', 'ShiftLeft'],
};

// Placeholder character colors for stand-in rectangles before sprites exist.
export const ANNIE_COLOR = '#D85040';
export const JOHN_COLOR  = '#5878A0';
export const OBI_COLOR   = '#A07048';
export const LUNA_COLOR  = '#C89848';
export const NPC_COLOR   = '#888888';

// Sprite footprint per character (style guide §2)
export const CHARACTER_DIMS = {
    annie: { width: 32, height: 48, color: ANNIE_COLOR, label: 'A' },
    john:  { width: 32, height: 48, color: JOHN_COLOR,  label: 'J' },
    obi:   { width: 32, height: 32, color: OBI_COLOR,   label: 'O' },
    luna:  { width: 24, height: 32, color: LUNA_COLOR,  label: 'L' },
};
