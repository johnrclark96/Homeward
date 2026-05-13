// Canvas setup + integer-multiple CSS scaling.

import { CANVAS_W, CANVAS_H } from '../constants.js';

let canvas = null;
let ctx = null;

export function init(canvasElement) {
    canvas = canvasElement;
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    resize();
    return ctx;
}

// Pick the largest integer scale that fits in the viewport; never 0.
export function resize() {
    if (!canvas) return;
    const scaleX = Math.floor(window.innerWidth / CANVAS_W);
    const scaleY = Math.floor(window.innerHeight / CANVAS_H);
    const scale = Math.max(1, Math.min(scaleX, scaleY));
    canvas.style.width  = (CANVAS_W * scale) + 'px';
    canvas.style.height = (CANVAS_H * scale) + 'px';
}

export function getCtx() {
    return ctx;
}

export function getCanvas() {
    return canvas;
}
