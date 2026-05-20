# Storyteller

A browser-based card narrative engine and UGC platform. Stories are configured entirely through JSON files — one folder equals one story. The engine is genre-agnostic and operates on mathematical primitives: a hex grid, cards, variables, and conditions. All internal numbers are hidden from the player behind narrative text, keeping gameplay focused on storytelling.

> This project is fully written by [Claude Code](https://claude.ai/code) (claude-cli).

## How it works

The game board is a hex grid rendered with pure SVG (no Canvas or game engine). Each session runs a 4-phase loop:

1. **Move** — player steps to an adjacent hex; the engine reads the event attached to it and displays its narrative text.
2. **Play cards** — player picks cards from hand (text-only, no visible stats); each card secretly adds weight to a hidden counter.
3. **Accept consequences** — the engine compares the hidden counter against the event's difficulty and resolves one of three branches: Failure, Success, or Critical Success.
4. **Story intervention** — every few turns the engine deals a narrative card that the player must place on the grid, permanently rewriting that hex.

## Platform zones

- **Story Catalog** — browse and filter community stories by genre tag and rating; launch any story instantly.
- **Game Client** — lightweight player that downloads a story's JSON config once, then runs the entire loop locally in the browser with no further network calls.
- **Browser Editor** — visual constructor for authoring stories: click hexes to assign terrain tags, fill in event pools and card decks, then publish directly to the shared platform.

## Tech stack

- Vue 3 (Composition API, `<script setup>`)
- TypeScript (strict mode)
- Vite
- Pinia
- Vue Router
- SVG hex grid (axial coordinates)
- Supabase (PostgreSQL + Storage + Auth) — planned for Stage 4

## Development

```sh
pnpm install
pnpm dev          # dev server with HMR
pnpm build        # type-check + production build
pnpm lint         # oxlint + eslint
pnpm test:unit    # vitest
pnpm test:e2e     # playwright
```

Deployed automatically to GitHub Pages on every push to `main` via GitHub Actions.
