# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@docs/DEVELOPMENT.md covers code style conventions and the current engine/game
architecture in detail — read it alongside this file.

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

## Working with the maintainer (planning & verification)

The maintainer oversees this project at the **architecture level** and does not
read every line of implementation. The architecture is being reworked
element-by-element from the original MVP, so it is intentionally **iterative and
emergent** — earlier decisions get revised as later pieces land. Work with that,
not against it:

1. **Plans are contracts, not prose.** When proposing a plan, express it as
   types, function signatures, and module boundaries — the surface the maintainer
   actually reviews. Avoid paragraphs describing behavior; show the shape. A
   design decision buried in approved prose will resurface as a rejection during
   coding, which is expensive.

2. **Skeleton first, then bodies.** For any non-trivial change, lay down the
   files with interfaces/signatures and stubbed bodies for review *before*
   filling in implementation. Rejecting the shape costs one line; rejecting a
   finished file wastes the whole write.

3. **Contracts get tests before implementation.** When the plan settles on a
   contract (a type / signature / module boundary), write its tests *before*
   implementing the bodies. The plan must state explicitly **which contracts get
   tests and which don't** — don't blanket-test everything, decide per contract.

4. **Verification is usually the maintainer's, done by hand.** Tests + type-check
   + lint passing is Claude's bar for "done"; the maintainer prefers to re-check
   runtime behavior manually in the browser (to save tokens). Do **not** run the
   `run-storyteller` skill every time — only when explicitly asked, or when a
   change genuinely can't be trusted without it.

5. **Fact-check claims about the code.** The maintainer may not have read the
   relevant implementation. If they assert something about how the code behaves,
   verify it against the actual source and correct them *before* acting on a
   possibly-wrong premise — even when the proposed direction is otherwise fine.

6. **Don't over-specify the architecture.** Settled decisions are captured in
   Claude's memory as the *current* state of an evolving design; expect to update
   them as iteration continues, and don't resist revisions or try to lock down a
   full target architecture up front.

7. **Branch and commit per plan.** Once a plan is approved, create a new branch
   for it before the first edit — implementation does not land directly on
   `master`. Commit after each completed stage of the plan (e.g. "types",
   "engine", "Vue layer"), not as one big commit at the end. Each commit message
   is a single concise subject line (~5-6 words, Conventional Commits prefix is
   fine) plus the `Co-Authored-By` trailer — no body unless asked.

## Architecture

This is a **Vue 3 + TypeScript + Vite** SPA — a browser-based card narrative engine called "Storyteller."

### Folder layout (`src/`)

The tree is organized by **role/domain**, not by technical kind. The center is a
portable game core (`engine/`) that everything else orbits.

```
engine/            Portable game core — pure TS, NO Vue/Pinia/notifications/persistence.
                   Intended for reuse in another game. See docs/DEVELOPMENT.md
                   for the engine/game boundary in detail.
  gameEngine.ts      `class GameEngine`: state machine for the 4-phase loop.
  hexGrid.ts         Pure axial-coordinate math (adjacency, distance, radius).
  random.ts          Deterministic seeded RNG (createRandom/restoreRandom, serializable state).
  createGameState.ts Scenario -> ready-to-play GameState (shuffle/deal/reveal).
  types/
    scenario/        Authored data contract, one type per file + barrel index.ts
                     (coord, hexCell, card, event, scenario).
    gameState/       Runtime state types (phase, gameState, engineEvent) + barrel index.ts.
game/              Vue layer around the engine: useGame (Pinia store), and the
                   useGameEffects/useEndGameManager observers.
editor/            Editor-side logic (mapTransforms.ts, scenarioGenerator.ts).
scenarioSource.ts  Orchestrates scenario loading: persisted one, else generate + save.
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

### Planned architecture (per docs/DESIGN-DOCUMENT.md and docs/TASK.md)

The engine is a **Universal Card Narrative Engine** where stories are configured entirely through JSON files. One folder = one story. The platform is a UGC hub with three zones:

1. **Story Catalog** (`/`) — `CatalogView`: browse/filter stories by tag and rating.
2. **Game Client** (`/game/:id`) — `GameView`: loads story JSON, runs game loop locally in the browser. No network after initial load.
3. **Browser Editor** (`/editor/:id`) — `EditorView`: visual constructor for authoring stories, exports to JSON.

### Game loop (4 phases, managed by the `GameEngine` state machine)
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
- `GameState` — resources, current phase, hand/tableau/drawPile, `playerPosition`,
  current event, a live `random` generator, `drawCardCountPerTurn`/`handLimit`;
  the hidden check total is computed on demand from tableau card weights
  (`sumTableauWeight`), not stored as a `$S` field. It is a domain model — storage
  flattens `random` to a serializable `randomState` via its DTO layer.
- `Scenario` — `{ id, metadata, mapData, eventsData, playerDeck, initial_hand_size,
  draw_card_count_per_turn, hand_limit, ... }` (the persisted story JSON)

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
