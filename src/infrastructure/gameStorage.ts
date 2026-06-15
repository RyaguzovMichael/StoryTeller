import type { GameState } from '@/engine/types/gameState'
import { restoreRandom } from '@/engine/random'

// Save-game store: the in-progress GameState, persisted separately from the
// story definition so playing never mutates the authored scenario.
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
