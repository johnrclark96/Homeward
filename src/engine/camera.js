// Camera with smooth follow, clamping, and shake. Architecture doc §7.
//
// Like entities, the camera tracks its previous position so apply() can
// interpolate render frames between logic ticks. With logic at 60Hz on a 60Hz
// display, alpha is effectively 0 and this becomes a no-op — but it remains
// correct on 120/144Hz displays where multiple render frames hit per tick.

import { CANVAS_W, CANVAS_H } from '../constants.js';

export const camera = {
    x: 0, y: 0,
    prevX: 0, prevY: 0,
    targetX: 0, targetY: 0,
    shakeX: 0, shakeY: 0,
    mapWidth: 0,
    mapHeight: 0,

    setBounds(widthPx, heightPx) {
        this.mapWidth = widthPx;
        this.mapHeight = heightPx;
    },

    follow(entity) {
        // Center the entity in the viewport.
        this.targetX = entity.x + entity.width / 2 - CANVAS_W / 2;
        this.targetY = entity.y + entity.height / 2 - CANVAS_H / 2;
    },

    snapTo(entity) {
        this.follow(entity);
        this.x = this.targetX;
        this.y = this.targetY;
        this.clamp();
        this.prevX = this.x;
        this.prevY = this.y;
    },

    update(/* dt */) {
        // Snapshot for render interpolation BEFORE this tick's mutations.
        this.prevX = this.x;
        this.prevY = this.y;

        const speed = 0.25;
        this.x += (this.targetX - this.x) * speed;
        this.y += (this.targetY - this.y) * speed;
        this.clamp();
        this.shakeX *= 0.9;
        this.shakeY *= 0.9;
        if (Math.abs(this.shakeX) < 0.1) this.shakeX = 0;
        if (Math.abs(this.shakeY) < 0.1) this.shakeY = 0;
    },

    clamp() {
        const maxX = Math.max(0, this.mapWidth - CANVAS_W);
        const maxY = Math.max(0, this.mapHeight - CANVAS_H);
        if (this.x < 0) this.x = 0;
        if (this.y < 0) this.y = 0;
        if (this.x > maxX) this.x = maxX;
        if (this.y > maxY) this.y = maxY;
    },

    apply(ctx, alpha = 0) {
        const ix = this.prevX + (this.x - this.prevX) * alpha;
        const iy = this.prevY + (this.y - this.prevY) * alpha;
        ctx.save();
        ctx.translate(
            -Math.round(ix + this.shakeX),
            -Math.round(iy + this.shakeY)
        );
    },

    reset(ctx) {
        ctx.restore();
    },

    shake(intensity = 3) {
        this.shakeX = (Math.random() - 0.5) * intensity * 2;
        this.shakeY = (Math.random() - 0.5) * intensity * 2;
    },
};
