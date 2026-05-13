// Dialogue mode — text box with typewriter reveal, portrait placeholder,
// and per-character variant lines. Architecture doc §11, style guide §5.
//
// Used as an overlay via modeMachine.pushMode(), so the overworld stays
// rendered behind it as a frozen backdrop.

import {
    CANVAS_W, CANVAS_H,
    ANNIE_COLOR, JOHN_COLOR, OBI_COLOR, LUNA_COLOR, NPC_COLOR,
} from '../constants.js';
import * as input from '../engine/input.js';
import * as events from '../engine/events.js';
import * as modeMachine from '../state/mode-machine.js';
import { setFlag, addWarmth } from '../state/game-state.js';
import { getDialogue } from '../world/data/test-dialogue.js';

const BOX_HEIGHT = 68;             // ~25% of 270
const BOX_MARGIN = 4;
const PORTRAIT_SIZE = 48;
const PORTRAIT_PAD = 6;
const TEXT_PAD_LEFT = PORTRAIT_PAD + PORTRAIT_SIZE + 8;
const TEXT_PAD_TOP = 8;
const NAME_HEIGHT = 12;
const LINE_HEIGHT = 11;
const CHAR_DELAY_MS = 30;

const SPEAKER_COLORS = {
    annie: ANNIE_COLOR,
    john:  JOHN_COLOR,
    obi:   OBI_COLOR,
    luna:  LUNA_COLOR,
};

// Text colors
const TEXT_COLOR = '#FFF8F0';       // Cream — spoken dialogue
const INTERNAL_COLOR = '#F0D070';   // Annie Blonde — internal monologue (Obi/Luna)
const DEFAULT_NAME_COLOR = '#FFF8F0';

// Internal state — fields are reset in enter().
let dialogueId = null;
let dialogue = null;
let activeCharacter = 'annie';
let lines = [];                     // selected variant lines
let lineIdx = 0;
let charsRevealed = 0;
let charTimer = 0;
let waitingForInput = false;
let currentText = '';
let currentIsInternal = false;
let pulseTimer = 0;
let wrappedLines = [];              // currentText word-wrapped
let wrapMaxWidth = 0;

function pickLinesForCharacter(d, charId) {
    // Prefer character-specific lines; fall back to 'default' then 'annie'.
    if (d.lines?.[charId]) return d.lines[charId];
    if (d.lines?.default) return d.lines.default;
    if (d.lines?.annie) return d.lines.annie;
    return [];
}

function startLine(idx) {
    lineIdx = idx;
    const line = lines[idx] || {};
    currentIsInternal = typeof line._internal === 'string';
    currentText = currentIsInternal ? line._internal : (line.text || '');
    charsRevealed = 0;
    charTimer = 0;
    waitingForInput = false;
    wrappedLines = null; // computed lazily on first render once we have ctx for measuring
}

function applyOnComplete(d) {
    const oc = d?.onComplete;
    if (!oc) return;
    if (oc.setFlag) setFlag(oc.setFlag);
    if (typeof oc.addWarmth === 'number') {
        // Default to the dialogue's chapter if specified, else ch0.
        addWarmth(oc.chapter ?? 0, oc.addWarmth);
    }
}

function wrapText(ctx, text, maxWidth) {
    const words = text.split(/(\s+)/);  // keep whitespace tokens
    const out = [];
    let current = '';
    for (const w of words) {
        if (w === '') continue;
        const test = current + w;
        if (ctx.measureText(test).width > maxWidth && current.trim().length > 0) {
            out.push(current.trimEnd());
            // Whitespace tokens at the start of a wrapped line are discarded.
            current = /^\s+$/.test(w) ? '' : w;
        } else {
            current = test;
        }
    }
    if (current.trim().length > 0) out.push(current.trimEnd());
    return out;
}

// Map a `charsRevealed` count over `currentText` into a count over `wrappedLines`.
function revealedSlice(wrapped, total) {
    // Reconstruct cumulative original-text lengths per wrapped line. Wrapping
    // dropped some whitespace, so cumulative may slightly undercount — fine for
    // the typewriter, since the user sees per-character reveal of the joined text.
    const result = [];
    let remaining = total;
    for (const w of wrapped) {
        if (remaining <= 0) { result.push(''); continue; }
        if (w.length <= remaining) {
            result.push(w);
            remaining -= w.length;
            // Account for the space that was wrapped out between lines.
            remaining -= 1;
        } else {
            result.push(w.slice(0, remaining));
            remaining = 0;
        }
    }
    return result;
}

export const dialogueMode = {
    enter(params = {}) {
        dialogueId = params.dialogueId || null;
        activeCharacter = params.activeCharacter || 'annie';
        dialogue = getDialogue(dialogueId);

        if (!dialogue) {
            console.warn(`Dialogue not found: ${dialogueId}`);
            modeMachine.popMode();
            return;
        }

        lines = pickLinesForCharacter(dialogue, activeCharacter);
        if (lines.length === 0) {
            modeMachine.popMode();
            return;
        }

        startLine(0);
        events.emit('dialogue:started', dialogueId);
    },

    exit() {
        dialogueId = null;
        dialogue = null;
        lines = [];
        lineIdx = 0;
        charsRevealed = 0;
        wrappedLines = null;
    },

    update(dt) {
        pulseTimer += dt;

        // Typewriter reveal.
        if (charsRevealed < currentText.length) {
            charTimer += dt;
            while (charTimer >= CHAR_DELAY_MS && charsRevealed < currentText.length) {
                charsRevealed++;
                charTimer -= CHAR_DELAY_MS;
            }
            if (charsRevealed >= currentText.length) {
                waitingForInput = true;
            }
        } else {
            waitingForInput = true;
        }

        if (input.wasPressed('action')) {
            if (charsRevealed < currentText.length) {
                // Instant-reveal the rest of the current line.
                charsRevealed = currentText.length;
                waitingForInput = true;
            } else {
                // Advance or close.
                const next = lineIdx + 1;
                if (next >= lines.length) {
                    this.close();
                } else {
                    startLine(next);
                }
            }
        }
    },

    close() {
        const finishedId = dialogueId;
        applyOnComplete(dialogue);
        events.emit('dialogue:ended', finishedId);
        modeMachine.popMode();
    },

    render(ctx /* , alpha */) {
        // Layout: bottom-aligned box across the screen.
        const boxY = CANVAS_H - BOX_HEIGHT - BOX_MARGIN;
        const boxX = BOX_MARGIN;
        const boxW = CANVAS_W - BOX_MARGIN * 2;
        const boxH = BOX_HEIGHT;

        // Semi-transparent dark background.
        ctx.save();
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = '#3A2E28';
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.globalAlpha = 1;

        // Thin warm border.
        ctx.strokeStyle = '#F0E0C8';
        ctx.lineWidth = 1;
        ctx.strokeRect(boxX + 0.5, boxY + 0.5, boxW - 1, boxH - 1);

        // Portrait area: filled with speaker's character color as placeholder.
        const portraitX = boxX + PORTRAIT_PAD;
        const portraitY = boxY + PORTRAIT_PAD;
        const portraitColor = SPEAKER_COLORS[activeCharacter] || NPC_COLOR;
        ctx.fillStyle = portraitColor;
        ctx.fillRect(portraitX, portraitY, PORTRAIT_SIZE, PORTRAIT_SIZE);
        ctx.strokeStyle = '#F0E0C8';
        ctx.strokeRect(portraitX + 0.5, portraitY + 0.5,
                       PORTRAIT_SIZE - 1, PORTRAIT_SIZE - 1);

        // Speaker name — accent color for party members, neutral for NPCs.
        // Mrs. Patterson is an NPC speaking aloud; her name renders in cream.
        // For internal monologue, color the name in the *thinking* character's
        // accent color so it reads "Obi's thought" / "Luna's thought".
        const speakerName = currentIsInternal
            ? `${capitalize(activeCharacter)}'s thought`
            : (dialogue?.speaker || 'NPC');
        const nameColor = currentIsInternal
            ? (SPEAKER_COLORS[activeCharacter] || DEFAULT_NAME_COLOR)
            : DEFAULT_NAME_COLOR;

        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.font = 'bold 9px monospace';
        ctx.fillStyle = nameColor;
        ctx.fillText(speakerName, boxX + TEXT_PAD_LEFT, boxY + TEXT_PAD_TOP);

        // Body text — wrap to fit the area right of the portrait.
        const textX = boxX + TEXT_PAD_LEFT;
        const textY = boxY + TEXT_PAD_TOP + NAME_HEIGHT + 2;
        const maxTextWidth = (boxX + boxW) - textX - 8;

        ctx.font = currentIsInternal
            ? 'italic 9px monospace'
            : '9px monospace';

        // Compute / cache the wrapped layout for the full current line.
        if (!wrappedLines || wrapMaxWidth !== maxTextWidth) {
            wrappedLines = wrapText(ctx, currentText, maxTextWidth);
            wrapMaxWidth = maxTextWidth;
        }

        const visibleWrapped = revealedSlice(wrappedLines, charsRevealed);
        ctx.fillStyle = currentIsInternal ? INTERNAL_COLOR : TEXT_COLOR;
        for (let i = 0; i < visibleWrapped.length; i++) {
            ctx.fillText(visibleWrapped[i], textX, textY + i * LINE_HEIGHT);
        }

        // Advance indicator — pulsing triangle in bottom-right of the box.
        if (waitingForInput) {
            const pulse = 0.6 + 0.4 * Math.abs(Math.sin(pulseTimer / 300));
            ctx.save();
            ctx.globalAlpha = pulse;
            ctx.fillStyle = TEXT_COLOR;
            const tx = boxX + boxW - 10;
            const ty = boxY + boxH - 10;
            ctx.beginPath();
            ctx.moveTo(tx, ty);
            ctx.lineTo(tx + 6, ty);
            ctx.lineTo(tx + 3, ty + 4);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }

        ctx.restore();
    },
};

function capitalize(s) {
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
}

// Public — for tests / debugging.
export function isActive() {
    return modeMachine.getMode() === dialogueMode;
}
