import type { Card, GameEvent, HexCell } from './types/scenario'
import type { Coord } from './hexGrid'
import { createRandom, type Random } from './random'

// The four-phase game loop, plus the terminal game-over state.
export type GamePhase =
  | 'movement'
  | 'draw'
  | 'consequences'
  | 'narrative-intervention'
  | 'game-over'

// The full runtime state the engine owns while a story is being played. This is
// a domain model, not a DTO: `random` is a live generator object, not a plain
// number — persistence flattens it via serializeGameState/deserializeGameState.
export interface GameState {
  storyId: string
  storyMetadata: { title: string }
  eventsById: Record<string, GameEvent>
  narrativeCardTemplates: Card[]
  narrativeInterventionInterval: number
  drawCardCountPerTurn: number
  handLimit: number
  random: Random
  phase: GamePhase
  resources: Record<string, number>
  playerPosition: Coord
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
    storyId: '',
    storyMetadata: { title: '' },
    eventsById: {},
    narrativeCardTemplates: [],
    narrativeInterventionInterval: 0,
    drawCardCountPerTurn: 0,
    handLimit: 0,
    random: createRandom(1),
    phase: 'movement',
    resources: {},
    playerPosition: { q: 0, r: 0 },
    cells: [],
    drawPile: [],
    hand: [],
    tableau: [],
    currentEvent: null,
    pendingNarrativeCard: null,
    turnCount: 0,
  }
}
