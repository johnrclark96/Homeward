// Test dialogue data — one entry, used by the apartment-test NPC.
// Format mirrors HOMEWARD-ARCHITECTURE.md §11.

export const dialogueData = {
    ch0_neighbor_01: {
        speaker: 'Mrs. Patterson',
        portrait: 'npc_patterson',
        lines: {
            annie: [
                { text: "Oh Annie dear, I'm going to miss you so much!", expression: 'sad' },
                { text: "You take care of those fur babies, you hear?", expression: 'happy' },
            ],
            john: [
                { text: "John! You take care of Annie for us.", expression: 'neutral' },
                { text: "And don't forget to write!", expression: 'happy' },
            ],
            obi: [
                { text: "What a good boy! Oh, I'll miss this face.", expression: 'happy' },
                { _internal: "This person smells like cookies. I trust her with my life.", expression: 'neutral' },
            ],
            luna: [
                { text: "Oh, the cat. Yes. Hello.", expression: 'neutral' },
                { _internal: "She always smelled like lavender. Adequate.", expression: 'neutral' },
            ],
        },
        onComplete: {
            setFlag: 'ch0_talked_to_patterson',
        },
    },
};

export function getDialogue(id) {
    return dialogueData[id] || null;
}
