# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Always use the `make` targets — not the raw `pnpm` scripts.** The `Makefile`
is the project's task runner. Its prerequisite chain gates the "safe" path:
`run → build → (test + type-check) → install`, so `make run` always installs,
runs the tests, type-checks, and builds before serving the production build.

```sh
make            # default: make run
make run        # install → test → type-check → build → serve production build (pnpm preview)
make dev        # fast, unguarded dev server with HMR (no tests/build) — plain pnpm dev
make test       # run the unit suite once (vitest --run); gates build
make type-check # vue-tsc type checking only
make build      # type-check + production build to dist/ (depends on test + type-check)
make lint       # oxlint then eslint (both with --fix)
make format     # prettier over src/
make clean      # remove dist/
```

The `Makefile` is read-only for Claude — propose changes and let the maintainer
apply them. Run a single unit test file directly with vitest when needed:
```sh
pnpm test:unit src/__tests__/hexGrid.spec.ts
```

## Architecture

This is a **Vue 3 + TypeScript + Vite** SPA — a browser-based card narrative engine called "Storyteller."

### Folder layout (`src/`)

The tree is organized by **role/domain**, not by technical kind. The center is a
portable game core (`engine/`) that everything else orbits.

```
engine/            Portable game core — no Vue components, no editor, no persistence.
                   Intended for reuse in another game; keep it framework-light.
  gameEngine.ts      Pinia state machine driving the 4-phase game loop (the engine).
  hexGrid.ts         Pure axial-coordinate math (adjacency, distance, radius).
  rng.ts             Deterministic seeded RNG.
  scenarioGenerator.ts  Procedural Scenario generator.
  types/
    scenario/        Authored data contract, one type per file + barrel index.ts
                     (coord, hexCell, card, event, scenario).
    gameState/       Runtime state types (phase, gameState) + barrel index.ts.
game/              Play-side glue around the engine (e.g. useEndGameManager.ts).
editor/            Editor-side logic (mapTransforms.ts).
views/             Route-level pages: GameView.vue, EditorView.vue.
components/        Shared presentational UI, subdivided by role:
  board/             HexGrid.vue + hexLayout.ts (SVG/pixel geometry — render, not rules).
  cards/             PlayerHand, EventPanel, NarrativeCardDrop.
  hud/               ResourceBar.
  system/            SystemNotificationManager.
notifications/     App-feedback store + its types (notificationStore.ts, types.ts).
infrastructure/    Persistence layer (storage.ts — localStorage repository).
router.ts          Routes (flat file, not a folder).
```

**Engine portability seams (not yet broken).** The engine still couples to Vue/UI
in three spots; address these before extracting it: (1) `gameEngine` is a Pinia
store; (2) it pushes UI notifications via `useNotificationStore`; (3)
`placeNarrativeCard` calls `saveScenario` from `infrastructure/`.

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

### Key data contracts (in `src/engine/types/`)
- `MapConfig` — array of hex cells with axial coordinates, terrain tag, `event_id`, `is_revealed`
- `EventPool` — events with hidden difficulty, `success_outcome`, `fail_outcome` (resource deltas)
- `PlayerDeck` — cards with id, narrative text, type (`standard` | `narrative`), hidden `weight`
- `GameState` — resources, current phase, hand, position, hidden counter `$S`
- `Scenario` — `{ id, metadata, mapData, eventsData, playerDeck, ... }` (the persisted story JSON)

### Rendering
- Hex grid: pure **SVG polygons** with axial coordinates — no Canvas, no Pixi.js/Phaser.
- Cards: Drag-and-Drop via `vuedraggable`.
- Endings and system notifications use Vue `watch`/`watchEffect` (Observer pattern) via `game/useEndGameManager.ts` and `components/system/SystemNotificationManager.vue`.

### State and storage
- **Stage 2** (current target): `localStorage` only, single test scenario.
- **Stage 3**: `localStorage` array of `Story` objects + `vue-router`.
- **Stage 4**: Replace `localStorage` with **Supabase** (PostgreSQL metadata + Storage bucket for JSON files). RLS: public SELECT, author-only writes. Game loop stays local after initial JSON download.

### Routing
Routes live in `src/router.ts`. Current routes:
- `/` → redirects to `/game`
- `/game` → `GameView`
- `/editor` → `EditorView`

Planned (per design doc): `/` → `CatalogView`, `/game/:id`, `/editor/:id`.

### CI/CD
GitHub Actions (`.github/workflows/deploy.yml`) deploys to GitHub Pages on push to `main`. Sets `VITE_BASE_PATH=/<repo-name>/` so Vite's `base` path is correct for subdirectory hosting. Uses `peaceiris/actions-gh-pages`. **Note:** the workflow uses `npm ci` — if switching fully to pnpm, this needs updating.

### Config notes
- `@` alias resolves to `src/`
- TypeScript strict mode is on (`tsconfig.app.json`)
- Lint pipeline: oxlint runs first, then ESLint (configured via `eslint.config.ts`)
