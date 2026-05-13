// Master game state + mutation API. Architecture doc §5a / §5b.

import * as events from '../engine/events.js';

const state = {
    // Meta
    chapter: 0,
    currentMap: 'ch0-apartment',
    playTime: 0,
    timeOfDay: 'morning',

    // Party
    party: {
        active: 'annie',
        members: {
            annie: { hp: 30, maxHp: 30, atk: 8,  def: 6,  spd: 10, heart: 12,
                     level: 1, xp: 0, moves: ['encourage'], accessories: [] },
            john:  { hp: 40, maxHp: 40, atk: 10, def: 10, spd: 7,  heart: 8,
                     level: 1, xp: 0, moves: ['ive_got_this'], accessories: [] },
            obi:   { hp: 35, maxHp: 35, atk: 9,  def: 9,  spd: 8,  heart: 7,
                     level: 1, xp: 0, moves: ['good_boy_charge'], accessories: ['blue_bandana'] },
            luna:  { hp: 20, maxHp: 20, atk: 14, def: 4,  spd: 15, heart: 5,
                     level: 1, xp: 0, moves: ['pounce'], accessories: [] },
        },
        positions: {
            annie: { x: 5, y: 8, facing: 'south' },
            john:  { x: 5, y: 9, facing: 'south' },
            obi:   { x: 4, y: 9, facing: 'south' },
            luna:  { x: 6, y: 9, facing: 'south' },
        },
    },

    // Inventory
    inventory: {
        items: [],
        coins: 50,
    },

    // Progression
    flags: {},
    questLog: [],
    littleThings: [],

    // World
    warmth: {
        ch0: 0, ch1: 0, ch2: 0, ch3: 0, ch4: 0,
        ch5: 0, ch6: 0, ch7: 0, ch8: 0,
    },
    befriended: [],
    bestiary: {},

    // Collections
    fishLog: [],
    collections: {},
    recipes: [],
    photos: [],

    // Car (visual state)
    car: {
        bumperStickers: [],
        scratched: false,
        noseprints: 0,
    },
};

export function getState() {
    return state;
}

export function setFlag(key, value = true) {
    state.flags[key] = value;
    events.emit('flag:set', key);
}

export function hasFlag(key) {
    return !!state.flags[key];
}

export function addItem(id, qty = 1) {
    const existing = state.inventory.items.find(i => i.id === id);
    if (existing) existing.qty += qty;
    else state.inventory.items.push({ id, qty });
    events.emit('item:added', id, qty);
}

export function removeItem(id, qty = 1) {
    const existing = state.inventory.items.find(i => i.id === id);
    if (!existing) return;
    existing.qty -= qty;
    if (existing.qty <= 0) {
        state.inventory.items = state.inventory.items.filter(i => i.id !== id);
    }
    events.emit('item:removed', id, qty);
}

export function addCoins(n) {
    state.inventory.coins += n;
    events.emit('coins:changed');
}

export function addXP(amount) {
    // Distribute to all party members above 0 HP. Level-up logic is added in a later session.
    for (const id in state.party.members) {
        const member = state.party.members[id];
        if (member.hp > 0) member.xp += amount;
    }
    events.emit('xp:changed', amount);
}

export function addWarmth(chapter, amount) {
    const key = typeof chapter === 'number' ? `ch${chapter}` : chapter;
    state.warmth[key] = (state.warmth[key] || 0) + amount;
    events.emit('warmth:changed', key);
}

export function collectLittleThing(id) {
    if (state.littleThings.includes(id)) return;
    state.littleThings.push(id);
    events.emit('littleThing:collected', id);
}

export function addBefriend(creatureId) {
    if (state.befriended.includes(creatureId)) return;
    state.befriended.push(creatureId);
    events.emit('creature:befriended', creatureId);
}
