// Party manager: tracks active character, follower chain, and switching.
// Architecture doc §10 ("Party Following").
//
// Followers replay the active character's recent grid positions with a delay
// of FOLLOW_DELAY entries per chain index. Each follower walks one tile per
// tween toward the current historical target, so the chain feels organic
// rather than rubber-banded.

import * as input from '../engine/input.js';
import * as events from '../engine/events.js';
import * as transitions from '../engine/transitions.js';
import { createPlayer } from './player.js';
import { isBlocked } from './tilemap.js';
import { getState } from '../state/game-state.js';

const PARTY_ORDER = ['annie', 'john', 'obi', 'luna'];
const FOLLOW_DELAY = 3;

// Offset applied to the leader's facing to find a tile "behind" them — used
// only for the very first spawn so the column isn't stacked on a single tile.
const BEHIND_OFFSET = {
    north: { dx:  0, dy:  1 },
    south: { dx:  0, dy: -1 },
    east:  { dx: -1, dy:  0 },
    west:  { dx:  1, dy:  0 },
};

let characters = {};        // characterId -> player entity
let activeIndex = 0;        // index into PARTY_ORDER
let history = [];           // [{ x, y, facing }, ...]

export function initParty(spawnTileX, spawnTileY, initialFacing = 'south') {
    characters = {};
    activeIndex = 0;
    history = [];

    // Active starts at whatever game-state says (defaults to annie).
    const stateActive = getState().party.active;
    const stateIdx = PARTY_ORDER.indexOf(stateActive);
    if (stateIdx >= 0) activeIndex = stateIdx;

    // Build characters, placing followers behind the leader in a column.
    // If a tile would land on a wall, fall back to the spawn tile (per spec).
    const back = BEHIND_OFFSET[initialFacing] || BEHIND_OFFSET.south;
    let followerSlot = 1;
    for (let i = 0; i < PARTY_ORDER.length; i++) {
        const id = PARTY_ORDER[i];
        let tx = spawnTileX;
        let ty = spawnTileY;
        if (i !== activeIndex) {
            tx = spawnTileX + back.dx * followerSlot;
            ty = spawnTileY + back.dy * followerSlot;
            if (isBlocked(tx, ty)) {
                tx = spawnTileX;
                ty = spawnTileY;
            }
            followerSlot++;
        }
        const p = createPlayer(id, tx, ty);
        p.active = (i === activeIndex);
        p.facing = initialFacing;
        // Followers tween faster than the leader so they can close gaps when
        // the leader walks continuously. Leader = 200ms, followers = 150ms.
        p.MOVE_DURATION = (i === activeIndex) ? 200 : 150;
        characters[id] = p;
    }

    // Seed history with the leader's spawn so we can record arrivals from it.
    const leader = getActiveCharacter();
    history.push({ x: leader.gridX, y: leader.gridY, facing: leader.facing });
}

export function updateParty(dt) {
    // Tab → cycle active character. Edge-triggered so a held key only fires once.
    // Suppressed during fade transitions so the player can't switch leaders
    // while the screen is dark.
    if (!transitions.isInputLocked() && input.wasPressed('switch')) {
        switchCharacter();
    }

    // Drive every party member's tween + (for the active one) input read.
    for (const id of PARTY_ORDER) {
        const c = characters[id];
        if (c) c.update(dt);
    }

    // Record leader arrivals into the history — but only when they're standing
    // still AND on a tile we haven't already recorded as the latest entry.
    const leader = getActiveCharacter();
    if (!leader.moving) {
        const last = history[history.length - 1];
        if (!last || last.x !== leader.gridX || last.y !== leader.gridY ||
            last.facing !== leader.facing) {
            history.push({ x: leader.gridX, y: leader.gridY, facing: leader.facing });
        }
    }

    // Drive each follower one tile toward its current history target. The
    // target advances naturally each time the leader pushes a new entry.
    const followers = getFollowers();
    for (let i = 0; i < followers.length; i++) {
        const lookback = FOLLOW_DELAY * (i + 1);
        const targetIndex = history.length - lookback;
        if (targetIndex < 0) continue;
        const target = history[targetIndex];
        stepFollowerToward(followers[i], target);
    }

    // Cap history length so it doesn't grow unbounded. Keep enough for the
    // deepest lookback plus generous slack.
    const MAX_HISTORY = FOLLOW_DELAY * PARTY_ORDER.length + 64;
    if (history.length > MAX_HISTORY) {
        history.splice(0, history.length - MAX_HISTORY);
    }
}

function stepFollowerToward(follower, target) {
    if (follower.moving) return;
    if (follower.gridX === target.x && follower.gridY === target.y) {
        // Already at target — adopt the recorded facing so we mirror the leader.
        if (follower.facing !== target.facing) follower.facing = target.facing;
        return;
    }
    // Pick one cardinal step toward the target. Vertical first when both
    // axes differ; doesn't really matter for M0 since followers don't collide.
    let stepX = follower.gridX;
    let stepY = follower.gridY;
    let facing = follower.facing;
    if (target.y !== follower.gridY) {
        stepY += target.y > follower.gridY ? 1 : -1;
        facing = target.y > follower.gridY ? 'south' : 'north';
    } else if (target.x !== follower.gridX) {
        stepX += target.x > follower.gridX ? 1 : -1;
        facing = target.x > follower.gridX ? 'east' : 'west';
    }
    follower.moveToGrid(stepX, stepY, facing);
}

export function switchCharacter() {
    const prevId = PARTY_ORDER[activeIndex];
    activeIndex = (activeIndex + 1) % PARTY_ORDER.length;
    const newId = PARTY_ORDER[activeIndex];

    characters[prevId].active = false;
    characters[newId].active = true;
    // Leader tweens slower (200ms) than followers (150ms) so the chain can close gaps.
    characters[prevId].MOVE_DURATION = 150;
    characters[newId].MOVE_DURATION = 200;

    // Stop any in-flight tween on the new leader so it doesn't keep walking
    // in the direction it was being steered as a follower.
    const newLeader = characters[newId];
    if (newLeader.moving) {
        newLeader.pixelX = newLeader.targetX;
        newLeader.pixelY = newLeader.targetY;
        newLeader.prevPixelX = newLeader.pixelX;
        newLeader.prevPixelY = newLeader.pixelY;
        newLeader.moving = false;
        newLeader.moveTimer = 0;
    }

    // Snap any follower that has drifted far from the new leader (>6 tiles
    // Manhattan) to a position just behind them. Without this, repeated
    // character switches can strand followers across the map and they never
    // catch up. Falls back to the leader's tile if the behind-slot is blocked.
    const MAX_FOLLOW_DISTANCE = 6;
    const back = BEHIND_OFFSET[newLeader.facing] || BEHIND_OFFSET.south;
    const followersForSnap = getFollowers();
    for (let i = 0; i < followersForSnap.length; i++) {
        const f = followersForSnap[i];
        const dist = Math.abs(f.gridX - newLeader.gridX) +
                     Math.abs(f.gridY - newLeader.gridY);
        if (dist > MAX_FOLLOW_DISTANCE) {
            const snapX = newLeader.gridX + back.dx * (i + 1);
            const snapY = newLeader.gridY + back.dy * (i + 1);
            if (!isBlocked(snapX, snapY)) {
                f.snapToGrid(snapX, snapY, newLeader.facing);
            } else {
                f.snapToGrid(newLeader.gridX, newLeader.gridY, newLeader.facing);
            }
        }
    }

    // Re-seed history from current party positions so followers don't sit
    // motionless for FOLLOW_DELAY * N tiles before the new leader's path is
    // long enough to feed them targets.
    //
    // Layout: [farthest×3, ..., nearest×3, newLeader]. Each follower's lookback
    // formula (history.length - FOLLOW_DELAY*(i+1)) lands on its current pos.
    const followers = getFollowers();
    history = [];
    for (let i = followers.length - 1; i >= 0; i--) {
        const f = followers[i];
        for (let j = 0; j < FOLLOW_DELAY; j++) {
            history.push({ x: f.gridX, y: f.gridY, facing: f.facing });
        }
    }
    history.push({ x: newLeader.gridX, y: newLeader.gridY, facing: newLeader.facing });

    // Mutate authoritative state, then announce.
    getState().party.active = newId;
    events.emit('party:switched', newId);
}

export function getActiveCharacter() {
    return characters[PARTY_ORDER[activeIndex]];
}

// In chain order: closest-behind first, farthest last.
export function getFollowers() {
    const list = [];
    for (let i = 1; i < PARTY_ORDER.length; i++) {
        const idx = (activeIndex + i) % PARTY_ORDER.length;
        list.push(characters[PARTY_ORDER[idx]]);
    }
    return list;
}

export function getPartyEntities() {
    // Active first, then followers — order doesn't matter for Y-sort but is
    // useful for systems that want a stable iteration.
    return [getActiveCharacter(), ...getFollowers()];
}

// Test / debug only.
export function getHistory() { return history; }
