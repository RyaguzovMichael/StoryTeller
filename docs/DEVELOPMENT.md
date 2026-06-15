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
- **Declaration order — general models first:** within a file, put the more
  general / top-level models at the top and their details further down, so a
  reader meets the big picture before the specifics (e.g. `PlayerDeck` above
  `Card` above `CardType`).

## Testing

Unit tests live in `src/__tests__/`, one file per module as `<module>.spec.ts`
(e.g. `gameEngine.spec.ts`, `createGameState.spec.ts`, `hexGrid.spec.ts`,
`selectors.spec.ts`, `storage.spec.ts`, `random.spec.ts`). Run the full suite with `make test`,
or a single file directly with `pnpm test:unit src/__tests__/hexGrid.spec.ts`.

Currently only `engine/` and `infrastructure/` modules have unit tests — the
Vue layer (`game/`, `components/`, views) is verified manually in the browser
per `CLAUDE.md`'s maintainer workflow, not unit-tested.

## Current architecture: engine boundaries

This section describes the state of `src/engine/` and `src/game/` after the
`refactor/engine-boundaries` work.

### `GameEngine` (`src/engine/gameEngine.ts`)

- Pure, framework-agnostic game core: no Vue, no Pinia, no notifications, no
  persistence, and **no knowledge of `Scenario`**. It is handed a ready,
  fully set-up `GameState` and only applies the rules of an ongoing game —
  it does **no** one-time setup.
- It is the **sole writer** of `GameState`. The host (Vue layer) only reads.
- **Reactivity bridge:** the engine mutates the state object it's given. In
  the app, `game/useGame.ts` passes a `reactive()` object, so every
  `this.state.x = ...` is tracked and the UI re-renders. In tests/Node, a
  plain object works identically.
- **Randomness lives in the state.** `GameState.random` is a live `Random`
  generator (see `src/engine/random.ts`). The engine reshuffles the draw pile
  through it whenever cards return to the pile, so a card's future position
  can't be tracked across a save/load. Because the generator's position is
  persisted (see Persistence), reloading a save can't reroll a shuffle.
- **Two-channel feedback to the host:**
  - Reactive `GameState` for continuous data (resources, hand, position, ...).
  - Transient `EngineEvent`s for one-off signals, delivered via
    `onEvent(listener)`. Current kinds: `outcome`, `game-over`, `persist`
    (see `src/engine/types/gameState/engineEvent.ts`). Clearing notifications
    on a new game is **not** an engine event — it's a host lifecycle concern.
- **Entry point:** `load(state)` — `Object.assign`s the ready state into the
  engine's reactive state in place (the store creates that object once and must
  keep the same reference for `toRefs`/computed refs, so this is a method, not
  a constructor) and emits `persist`. Both a fresh mapping and a restored save
  load identically.

### `createGameState` (`src/engine/createGameState.ts`)

- The **only** place that knows about `Scenario`. Projects an authored
  scenario into a **ready-to-play** `GameState`: `createGameState(scenario, seed?)`.
- Deep-clones the whole scenario (`JSON.parse(JSON.stringify(...))`) so
  nothing in the resulting `GameState` shares references with the authored
  data — the engine may mutate any field during play.
- **Performs the one-time setup itself** — creates the `random` generator
  (`seed ?? Date.now()`), shuffles the draw pile, deals the opening hand
  (`initial_hand_size`, consumed here and not stored on `GameState`), reveals
  the starting cell. The engine therefore never deals with setup, only with the
  running game.

### Persistence (`src/infrastructure/storage.ts`)

- Scenario (`storyteller:scenario:v1`) and in-progress save
  (`storyteller:save:v2`) are stored separately, so playing never mutates the
  authored scenario.
- `GameState` is a **domain model, not a DTO**: its `random` is a live object.
  Storage owns the domain↔DTO mapping — `toDTO`/`fromDTO` flatten `random` to a
  serializable `randomState` number and rebuild it via `restoreRandom`. The
  save marker is a minimal structural check, not full schema validation — bump
  `SAVE_KEY` when the shape changes.
- Persistence is **event-driven**: `game/useGameEffects.ts` subscribes via
  `engine.onEvent` and calls `saveGame(event.state)` on the `persist` event.
  Any state-changing engine action that should be saved must emit `persist`.
- **Choosing a scenario** is orchestrated by `src/scenarioSource.ts`
  (`loadOrCreateScenario`: load the persisted one, else generate via the
  editor's generator and save it) — kept out of both storage and the views.

### Vue layer (`src/game/`)

- `useGame.ts` — thin Pinia store. Holds `reactive(createEmptyState())`,
  constructs `new GameEngine(state)` (`markRaw`'d so Vue doesn't proxy the
  class instance), and exposes the state as read-only computed refs
  (`game.hand`, `game.resources`, ...) plus the `engine` handle and derived
  selectors (`reachable`). **No actions live here** — callers drive the game
  through `game.engine.*`.
- `useGameEffects.ts` — observer. Subscribes to `engine.onEvent` and performs
  all host-side work the engine refuses to do: pushing notifications
  (`outcome`, `game-over`) and persistence (`persist`). Clearing notifications
  on a new game is done by the view directly (`GameView.onNewGame`).
- `useEndGameManager.ts` — observer that watches resources and calls
  `game.engine.endGame(...)` when an ending condition is met.
- `selectors.ts` — pure derived-state helpers over `GameState` (e.g.
  `reachableCoordKeys`), used by both the store and potentially the engine's
  own logic.

This section should be updated as the architecture continues to evolve —
treat it as a snapshot of the *current* design, not a fixed target.
