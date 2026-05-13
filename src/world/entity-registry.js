// Shared lookup for entities currently in the world.
//
// Decouples the player (which needs to know "is something blocking the tile I'm
// stepping onto?") and interaction code from the overworld's entity list, without
// either side importing the other directly.
//
// The overworld populates the registry once after building its entity list, and
// any consumer can query.

let entities = [];

export function setEntities(list) {
    entities = list;
}

export function getEntities() {
    return entities;
}

// True if any blocking entity occupies (gx, gy). Pass an entity reference as
// `exclude` to skip self-collision (e.g., the active player skips itself).
export function isBlockingEntityAt(gx, gy, exclude = null) {
    for (const e of entities) {
        if (e === exclude) continue;
        if (!e.blocking) continue;
        if (e.gridX === gx && e.gridY === gy) return true;
    }
    return false;
}

// First interactable entity at (gx, gy), or null. NPCs and signs set
// interactable: true; the no-op onInteract on the base entity factory does not.
export function getInteractableAt(gx, gy) {
    for (const e of entities) {
        if (!e.interactable) continue;
        if (e.gridX === gx && e.gridY === gy) return e;
    }
    return null;
}
