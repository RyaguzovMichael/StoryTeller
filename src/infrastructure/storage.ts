import type { Scenario } from '@/engine/types/scenario'
import type { SavedGame } from '@/engine/types/gameState'
import { generateScenario, DEFAULT_PARAMS } from '@/engine/scenarioGenerator'

const SCENARIO_KEY = 'storyteller:scenario:v1'
const SAVE_KEY = 'storyteller:save:v1'

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

export function loadOrCreateScenario(): Scenario {
  const existing = loadScenario()
  if (existing) return existing
  const generated = generateScenario(DEFAULT_PARAMS)
  saveScenario(generated)
  return generated
}

// Save-game store: the in-progress GameState snapshot, persisted separately from
// the story definition so playing never mutates the authored scenario.
export function loadGame(): SavedGame | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!isSavedGame(parsed)) return null
    return parsed
  } catch {
    return null
  }
}

export function saveGame(snapshot: SavedGame): void {
  localStorage.setItem(SAVE_KEY, JSON.stringify(snapshot))
}

export function clearGame(): void {
  localStorage.removeItem(SAVE_KEY)
}

export function isSavedGame(value: unknown): value is SavedGame {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  if (v.initialized !== true) return false
  if (typeof v.storyId !== 'string') return false
  if (!Array.isArray(v.cells)) return false
  if (!v.resources || typeof v.resources !== 'object') return false
  if (!v.position || typeof v.position !== 'object') return false
  return true
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
  return true
}
