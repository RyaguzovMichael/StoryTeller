import type { Card, GameEvent, HexCell } from './types/scenario'
import type { Coord } from './hexGrid'
import { createRandom, restoreRandom, type Random } from './random'

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

// Serializable form of GameState: the live `random` generator collapsed to its
// 32-bit `randomState`. The domain↔DTO mapping lives here (not in storage) so the
// persistence layer stays a dumb byte store that never touches the engine's RNG.
export type GameStateDTO = Omit<GameState, 'random'> & { randomState: number }

export function serializeGameState(state: GameState): GameStateDTO {
  const { random, ...rest } = state
  return { ...rest, randomState: random.state }
}

export function deserializeGameState(dto: GameStateDTO): GameState {
  const { randomState, ...rest } = dto
  return { ...rest, random: restoreRandom(randomState) }
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
