// Base entity factory. Architecture doc §9.
// All entity types build on this — same plain-object interface, no class hierarchy.

let nextId = 1;

export function createEntity(config = {}) {
    return {
        id: config.id ?? `entity_${nextId++}`,
        type: config.type ?? 'entity',
        x: config.x ?? 0,
        y: config.y ?? 0,
        width: config.width ?? 32,
        height: config.height ?? 32,
        facing: config.facing ?? 'south',
        sprite: config.sprite ?? null,
        visible: config.visible ?? true,
        active: config.active ?? true,

        update(/* dt */) { },
        render(/* ctx */) { },
        onInteract(/* activeCharacter */) { },

        ...config.overrides,
    };
}
