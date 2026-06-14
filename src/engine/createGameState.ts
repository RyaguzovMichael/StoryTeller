// The single place that knows about Scenario. Pure projection of an authored
// scenario (the story definition) into a fresh GameState the engine can run. It
// only maps data — no shuffling, dealing or reveal: that one-time setup is game
// logic the engine performs on load (see GameEngine.load). The result has
// `initialized: false` so the engine knows it still needs that setup.
import type { Scenario } from '@/engine/types/scenario'
import { createEmptyState, type GameState } from '@/engine/types/gameState'

export function createGameState(scenario: Scenario): GameState {
  // Deep clone the whole scenario up front so nothing in the resulting GameState
  // shares references with the authored definition — the engine may mutate any
  // field during play, and the scenario must stay untouched.
  const source = JSON.parse(JSON.stringify(scenario)) as Scenario

  const state = createEmptyState()
  state.storyId = source.id
  state.storyMetadata = source.metadata
  state.eventsById = Object.fromEntries(source.eventsData.map((event) => [event.id, event]))
  state.narrativeCardTemplates = source.playerDeck.filter((card) => card.type === 'narrative')
  state.initialHandSize = source.initial_hand_size
  state.narrativeInterventionInterval = source.narrative_intervention_interval
  state.resources = source.initial_resources
  state.position = source.starting_position
  state.cells = source.mapData.cells
  state.drawPile = source.playerDeck.filter((card) => card.type === 'standard')
  return state
}
