import type { Scenario } from '@/engine/types/scenario'
import type { GameState } from '@/engine/types/gameState'
import { generateScenario, DEFAULT_PARAMS } from '@/engine/scenarioGenerator'

const SCENARIO_KEY = 'storyteller:scenario:v1'
const SAVE_KEY = 'storyteller:save:v1'

// A serialized GameState. Branded so a raw string can't be mistaken for one:
// only serializeGame produces it. Serialization lives here, not in the engine —
// the engine hands out a GameState and knows nothing about how it is stored.
declare const savedGameBrand: unique symbol
type SavedGame = string & { readonly [savedGameBrand]: true }

function serializeGame(state: GameState): SavedGame {
  return JSON.stringify(state) as SavedGame
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

export function loadOrCreateScenario(): Scenario {
  const existing = loadScenario()
  if (existing) return existing
  const generated = generateScenario(DEFAULT_PARAMS)
  saveScenario(generated)
  return generated
}

// Save-game store: the in-progress GameState, persisted separately from the
// story definition so playing never mutates the authored scenario.
export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!isGameState(parsed)) return null
    return parsed
  } catch {
    return null
  }
}

export function saveGame(state: GameState): void {
  localStorage.setItem(SAVE_KEY, serializeGame(state))
}

export function clearGame(): void {
  localStorage.removeItem(SAVE_KEY)
}

// Minimal marker check: "is this one of our saves, or garbage?". Not a full
// schema validation — bump SAVE_KEY when the shape changes.
export function isGameState(value: unknown): value is GameState {
  return !!value && typeof value === 'object' && (value as Record<string, unknown>).initialized === true
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
