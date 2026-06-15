import type { GameStateDTO } from '@/engine/gameState'

// Save-game store: the in-progress save, persisted separately from the story
// definition so playing never mutates the authored scenario. This layer is a
// dumb byte store — it takes an already-serializable DTO and hands one back,
// knowing nothing about the engine's live `random` generator. The domain↔DTO
// mapping lives in engine/gameState (serializeGameState/deserializeGameState).
const SAVE_KEY = 'storyteller:save:v2'

export function loadGame(): GameStateDTO | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!isGameStateDTO(parsed)) return null
    return parsed
  } catch {
    return null
  }
}

export function saveGame(dto: GameStateDTO): void {
  localStorage.setItem(SAVE_KEY, JSON.stringify(dto))
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
