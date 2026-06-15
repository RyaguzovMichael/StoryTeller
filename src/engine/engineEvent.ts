import type { GameState } from './gameState'

// Transient signals the engine emits to its host. The engine performs no I/O
// itself: it hands these to subscribers (see GameEngine.onEvent), which turn
// them into notifications and persistence. `persist` carries the state to save —
// the engine does not know how saving is done.
export type EngineEvent =
  | { kind: 'outcome'; text: string }
  | { kind: 'game-over'; reason: string }
  | { kind: 'persist'; state: GameState }
