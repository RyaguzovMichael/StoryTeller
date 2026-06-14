import type { Card, Coord, GameEvent, HexCell } from '../scenario'
import type { GamePhase } from './phase'

// The full runtime state the engine owns while a story is being played. The
// engine knows nothing about Scenario: it is handed a ready GameState (either a
// loaded save or one mapped from a scenario by createGameState) and only applies
// rules to it. `currentEvent` is the resolved event object, not an id.
export interface GameState {
  // False until the engine has run its one-time setup (shuffle/deal/reveal) on a
  // freshly mapped scenario. The host must not render game data while false.
  initialized: boolean
  // Mapped from the scenario once, then treated as read-only during play.
  storyId: string
  storyMetadata: { title: string }
  eventsById: Record<string, GameEvent>
  narrativeCardTemplates: Card[]
  initialHandSize: number
  narrativeInterventionInterval: number
  // Runtime, mutated as the game is played.
  phase: GamePhase
  resources: Record<string, number>
  position: Coord
  cells: HexCell[]
  drawPile: Card[]
  hand: Card[]
  tableau: Card[]
  currentEvent: GameEvent | null
  pendingNarrativeCard: Card | null
  turnCount: number
}

export function createEmptyState(): GameState {
  return {
    initialized: false,
    storyId: '',
    storyMetadata: { title: '' },
    eventsById: {},
    narrativeCardTemplates: [],
    initialHandSize: 0,
    narrativeInterventionInterval: 0,
    phase: 'movement',
    resources: {},
    position: { q: 0, r: 0 },
    cells: [],
    drawPile: [],
    hand: [],
    tableau: [],
    currentEvent: null,
    pendingNarrativeCard: null,
    turnCount: 0,
  }
}
