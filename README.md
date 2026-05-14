# Homeward

A top-down pixel art RPG. Four characters — Annie, John, Obi (the dog), and Luna (the cat) — drive from Chicago to Wilmington, NC. It's a love letter disguised as a game, built as a personal gift.

The player discovers **Little Things** (glowing collectibles revealing unspoken thoughts), befriends enemies instead of fighting them, and watches the world grow warmer as they're kind to it.

## Tech

HTML5 Canvas 2D + vanilla ES modules. No build step, no framework — just files served over HTTP. Hosted on GitHub Pages.

## Run locally

```sh
# From the project root, any static file server works. Examples:
npx serve .
# or use VS Code's Live Server extension on index.html
```

Then open the URL the server prints (usually `http://localhost:3000`).

## Project documentation

Design and implementation notes live in four reference docs at the repo root:

- **[CLAUDE.md](CLAUDE.md)** — high-level project context, tech stack, conventions, current state.
- **[HOMEWARD-GDD.md](HOMEWARD-GDD.md)** — game design: story, characters, chapter structure, mechanics.
- **[HOMEWARD-STYLE-GUIDE.md](HOMEWARD-STYLE-GUIDE.md)** — visual bible: palette, sprite dimensions, animation specs.
- **[HOMEWARD-ARCHITECTURE.md](HOMEWARD-ARCHITECTURE.md)** — technical architecture: game loop, mode machine, state schema, rendering.
- **[HOMEWARD-PIXELLAB-WORKFLOW.md](HOMEWARD-PIXELLAB-WORKFLOW.md)** — operational manual for the PixelLab MCP-driven art pipeline.

## Status

In active development. Milestone 0 (vertical slice) is up: tile map, party, dialogue, Little Things, area transitions. Sprite generation is the current focus.

---

A personal project, not accepting external contributions.
