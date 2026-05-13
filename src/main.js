// Bootstrap: init canvas + input, create the overworld, start the game loop.

import * as canvasMod from './engine/canvas.js';
import * as input from './engine/input.js';
import { startLoop } from './engine/game-loop.js';
import * as modeMachine from './state/mode-machine.js';
import { createOverworld } from './world/overworld.js';
import * as hud from './ui/hud.js';

function boot() {
    const canvasEl = document.getElementById('game');
    if (!canvasEl) {
        console.error('Canvas element #game not found');
        return;
    }

    canvasMod.init(canvasEl);
    input.init();
    hud.init();

    window.addEventListener('resize', () => canvasMod.resize());

    const overworld = createOverworld();
    modeMachine.setMode(overworld);

    startLoop(modeMachine);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
} else {
    boot();
}
