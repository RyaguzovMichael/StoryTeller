# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
pnpm install          # install dependencies
pnpm dev              # start dev server with HMR
pnpm build            # type-check + build to dist/
pnpm preview          # preview production build locally
pnpm lint             # oxlint then eslint (both with --fix)
pnpm format           # prettier over src/
pnpm test:unit        # vitest (unit tests in src/__tests__)
pnpm test:e2e         # playwright e2e (requires built dist/ or running dev server)
```

Run a single unit test file:
```sh
pnpm test:unit src/__tests__/App.spec.ts
```

Run e2e tests on a specific browser:
```sh
pnpm test:e2e --project=chromium
```

## Architecture

This is a **Vue 3 + TypeScript + Vite** SPA — a browser-based card narrative engine called "Storyteller." The project is currently at Stage 1 (infrastructure only); game logic has not yet been written.

### Planned architecture (per docs/DESIGN-DOCUMENT.md and docs/TASK.md)

The engine is a **Universal Card Narrative Engine** where stories are configured entirely through JSON files. One folder = one story. The platform is a UGC hub with three zones:

1. **Story Catalog** (`/`) — `CatalogView`: browse/filter stories by tag and rating.
2. **Game Client** (`/game/:id`) — `GameView`: loads story JSON, runs game loop locally in the browser. No network after initial load.
3. **Browser Editor** (`/editor/:id`) — `EditorView`: visual constructor for authoring stories, exports to JSON.

### Game loop (4 phases, managed by a Pinia state machine)
| Phase | Description |
|-------|-------------|
| 1 — Basic Movement | Player clicks adjacent hex; engine reads `event_id` from hex and displays narrative text |
| 2 — Blind Play | Player drags cards (text-only, no visible stats) to active zone; each card secretly increments hidden counter `$S` |
| 3 — Accept Consequences | Engine compares `$S` vs event difficulty; branches to Failure / Success / Critical Success; updates resources |
| 4 — Story Intervention | Every N turns, player receives a narrative card that must be placed on a hex, permanently rewriting its tag and `event_id` |

### Key data contracts (to be defined in `src/types/`)
- `MapConfig` — 2D array of hex cells with axial coordinates, terrain tag, `event_id`, `is_revealed`
- `EventPool` — events with hidden difficulty, `success_outcome`, `fail_outcome` (resource deltas)
- `PlayerDeck` — cards with id, narrative text, type (`standard` | `narrative`)
- `GameState` — resources, current phase, hand, position, hidden counter `$S`
- `Story` — `{ id, metadata: { title, tags, rating }, mapData, eventsData, playerDeck }`

### Rendering
- Hex grid: pure **SVG polygons** with axial coordinates — no Canvas, no Pixi.js/Phaser.
- Cards: Drag-and-Drop via `vuedraggable`.
- Endings and system notifications use Vue `watch`/`watchEffect` (Observer pattern) via `EndGameManager` and `SystemNotificationManager`.

### State and storage
- **Stage 2** (current target): `localStorage` only, single test scenario.
- **Stage 3**: `localStorage` array of `Story` objects + `vue-router`.
- **Stage 4**: Replace `localStorage` with **Supabase** (PostgreSQL metadata + Storage bucket for JSON files). RLS: public SELECT, author-only writes. Game loop stays local after initial JSON download.

### Routing
`vue-router` is installed but routes array is empty. Planned routes:
- `/` → `CatalogView`
- `/game/:id` → `GameView`
- `/editor/` → `EditorSelectorView`
- `/editor/:id` → `EditorView`

### CI/CD
GitHub Actions (`.github/workflows/deploy.yml`) deploys to GitHub Pages on push to `main`. Sets `VITE_BASE_PATH=/<repo-name>/` so Vite's `base` path is correct for subdirectory hosting. Uses `peaceiris/actions-gh-pages`. **Note:** the workflow uses `npm ci` — if switching fully to pnpm, this needs updating.

### Config notes
- `@` alias resolves to `src/`
- TypeScript strict mode is on (`tsconfig.app.json`)
- Lint pipeline: oxlint runs first, then ESLint (configured via `eslint.config.ts`)
