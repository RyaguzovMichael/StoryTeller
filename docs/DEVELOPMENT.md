# Development Notes

This document collects the code conventions and the current architectural
state of the engine, for anyone working on this codebase. It complements
`CLAUDE.md`, which covers the folder layout and the AI-assisted workflow used
to develop this project.

## Code style

- **Class member ordering:** public members first, then private members. The
  public contract should read top-to-bottom without wading through private
  helpers.
- **Naming:** full, descriptive names everywhere — including local loop
  variables and math-heavy helpers (`boundingBox`, `offsetQ`, `cell`, not
  `b`, `offQ`, `c`).
- **Comments:** minimal. Comment only the non-obvious "why" (a hidden
  constraint, an invariant, a workaround) — not "what" the code does, and not
  conventions/intentions that can drift from the code over time.
- **YAGNI:** don't shape signatures or structures around guessed future
  mechanics. Build what's needed now; leave a `TODO` if a future change is
  likely rather than implementing it ahead of time. The architecture is
  intentionally iterative and emergent, reworked element-by-element from the
  original MVP — expect earlier decisions to be revised as later pieces land.

## Testing

Unit tests live in `src/__tests__/`, one file per module as `<module>.spec.ts`
(e.g. `gameEngine.spec.ts`, `createGameState.spec.ts`, `hexGrid.spec.ts`,
`selectors.spec.ts`, `storage.spec.ts`). Run the full suite with `make test`,
or a single file directly with `pnpm test:unit src/__tests__/hexGrid.spec.ts`.

Currently only `engine/` and `infrastructure/` modules have unit tests — the
Vue layer (`game/`, `components/`, views) is verified manually in the browser
per `CLAUDE.md`'s maintainer workflow, not unit-tested.

## Current architecture: engine boundaries

This section describes the state of `src/engine/` and `src/game/` after the
`refactor/engine-boundaries` work.

### `GameEngine` (`src/engine/gameEngine.ts`)

- Pure, framework-agnostic game core: no Vue, no Pinia, no notifications, no
  persistence, and **no knowledge of `Scenario`**. It is handed a ready
  `GameState` (a loaded save, or one mapped from a scenario by
  `createGameState`) and only applies rules to it.
- It is the **sole writer** of `GameState`. The host (Vue layer) only reads.
- **Reactivity bridge:** the engine mutates the state object it's given. In
  the app, `game/useGame.ts` passes a `reactive()` object, so every
  `this.state.x = ...` is tracked and the UI re-renders. In tests/Node, a
  plain object works identically.
- **Two-channel feedback to the host:**
  - Reactive `GameState` for continuous data (resources, hand, position, ...).
  - Transient `EngineEvent`s for one-off signals, delivered via
    `onEvent(listener)`. Current kinds: `outcome`, `game-over`, `reset`,
    `persist` (see `src/engine/types/gameState/engineEvent.ts`).
- **Entry point:** `load(state)` — `Object.assign`s into the engine's
  reactive state in place (the store creates that object once and must keep
  the same reference for `toRefs`/computed refs, so this is a method, not a
  constructor). If `!state.initialized`, runs the private one-time
  `initialize()` (shuffle/deal/reveal), sets `initialized = true`, and emits
  `reset`. An already-initialized save passes through untouched.

### `createGameState` (`src/engine/createGameState.ts`)

- The **only** place that knows about `Scenario`. A pure projection
  `Scenario -> GameState`.
- Deep-clones the whole scenario (`JSON.parse(JSON.stringify(...))`) so
  nothing in the resulting `GameState` shares references with the authored
  data — the engine may mutate any field during play.
- Does no shuffling/dealing/reveal — that one-time setup is game *rules*, and
  rules live in the engine (`GameEngine.initialize`), not in the mapper or in
  the type files. Returns `initialized: false`.

### Persistence (`src/infrastructure/storage.ts`)

- Scenario (`storyteller:scenario:v1`) and in-progress save
  (`storyteller:save:v1`) are stored separately, so playing never mutates the
  authored scenario.
- `saveGame`/`loadGame`/`clearGame` operate on the full `GameState`.
  `isGameState` is a minimal marker check (`initialized === true`), not full
  schema validation — bump `SAVE_KEY` when the shape changes.
- Persistence is **event-driven**: `game/useGameEffects.ts` subscribes via
  `engine.onEvent` and calls `saveGame(event.state)` on the `persist` event.
  Any state-changing engine action that should be saved must emit `persist`.

### Vue layer (`src/game/`)

- `useGame.ts` — thin Pinia store. Holds `reactive(createEmptyState())`,
  constructs `new GameEngine(state)` (`markRaw`'d so Vue doesn't proxy the
  class instance), and exposes the state as read-only computed refs
  (`game.hand`, `game.resources`, ...) plus the `engine` handle and derived
  selectors (`reachable`). **No actions live here** — callers drive the game
  through `game.engine.*`.
- `useGameEffects.ts` — observer. Subscribes to `engine.onEvent` and performs
  all host-side work the engine refuses to do: pushing notifications
  (`outcome`, `game-over`, `reset` clears them) and persistence (`persist`).
- `useEndGameManager.ts` — observer that watches resources and calls
  `game.engine.endGame(...)` when an ending condition is met.
- `selectors.ts` — pure derived-state helpers over `GameState` (e.g.
  `reachableCoordKeys`), used by both the store and potentially the engine's
  own logic.

This section should be updated as the architecture continues to evolve —
treat it as a snapshot of the *current* design, not a fixed target.
