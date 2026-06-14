import type { Card, Coord } from '../scenario'
import type { GamePhase } from './phase'

// The full runtime state the engine owns while a scenario is being played.
export interface GameState {
  scenarioId: string
  phase: GamePhase
  resources: Record<string, number>
  position: Coord
  drawPile: Card[]
  hand: Card[]
  activeZone: Card[]
  hiddenS: number
  currentEventId: string | null
  pendingNarrativeCard: Card | null
  turnCount: number
}
