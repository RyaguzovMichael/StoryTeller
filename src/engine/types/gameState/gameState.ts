import type { Card, Coord, Scenario } from '../scenario'
import type { GamePhase } from './phase'
import type { GameEffect } from './effect'

// The full runtime state the engine owns while a scenario is being played.
// `hiddenS` and the current event are derived from this, not stored. `effects`
// is the queue the engine appends to and the host drains (see GameEffect).
export interface GameState {
  scenario: Scenario | null
  phase: GamePhase
  resources: Record<string, number>
  position: Coord
  drawPile: Card[]
  hand: Card[]
  activeZone: Card[]
  currentEventId: string | null
  pendingNarrativeCard: Card | null
  turnCount: number
  effects: GameEffect[]
}
