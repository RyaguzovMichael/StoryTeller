import type { Scenario } from '@/engine/types/scenario'
import type { GameState } from '@/engine/types/gameState'
import { restoreRandom } from '@/engine/random'

const SCENARIO_KEY = 'storyteller:scenario:v1'
const SAVE_KEY = 'storyteller:save:v2'

// GameState is a domain model with a live `random` generator; on disk we store a
// flat DTO where the generator is collapsed to its serializable `randomState`.
type GameStateDTO = Omit<GameState, 'random'> & { randomState: number }

function toDTO(state: GameState): GameStateDTO {
  const { random, ...rest } = state
  return { ...rest, randomState: random.state }
}

function fromDTO(dto: GameStateDTO): GameState {
  const { randomState, ...rest } = dto
  return { ...rest, random: restoreRandom(randomState) }
}

export function loadScenario(): Scenario | null {
  try {
    const raw = localStorage.getItem(SCENARIO_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!isScenario(parsed)) return null
    return parsed
  } catch {
    return null
  }
}

export function saveScenario(scenario: Scenario): void {
  localStorage.setItem(SCENARIO_KEY, JSON.stringify(scenario))
}

// Save-game store: the in-progress GameState, persisted separately from the
// story definition so playing never mutates the authored scenario.
export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!isGameStateDTO(parsed)) return null
    return fromDTO(parsed)
  } catch {
    return null
  }
}

export function saveGame(state: GameState): void {
  localStorage.setItem(SAVE_KEY, JSON.stringify(toDTO(state)))
}

export function clearGame(): void {
  localStorage.removeItem(SAVE_KEY)
}

// Minimal marker check: "is this one of our saves, or garbage?". Not a full
// schema validation — bump SAVE_KEY when the shape changes.
function isGameStateDTO(value: unknown): value is GameStateDTO {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return Array.isArray(v.cells) && typeof v.randomState === 'number'
}

export function isScenario(value: unknown): value is Scenario {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  if (typeof v.id !== 'string') return false
  if (!v.metadata || typeof v.metadata !== 'object') return false
  if (!v.mapData || typeof v.mapData !== 'object') return false
  if (!Array.isArray(v.eventsData)) return false
  if (!Array.isArray(v.playerDeck)) return false
  if (!v.initial_resources || typeof v.initial_resources !== 'object') return false
  if (!v.starting_position || typeof v.starting_position !== 'object') return false
  if (typeof v.narrative_intervention_interval !== 'number') return false
  if (typeof v.initial_hand_size !== 'number') return false
  if (typeof v.draw_card_count_per_turn !== 'number') return false
  if (typeof v.hand_limit !== 'number') return false
  return true
}
