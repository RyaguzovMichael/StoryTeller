// The single place that knows about Scenario. Maps an authored scenario (the
// story definition) into a fully ready-to-play GameState and performs the
// one-time setup itself — shuffle, deal the opening hand, reveal the start cell —
// so the engine only ever deals with the running game, never with setup.
import type { Scenario } from '@/engine/types/scenario'
import { createEmptyState, type GameState } from '@/engine/gameState'
import { createRandom } from '@/engine/random'

export function createGameState(scenario: Scenario, seed?: number): GameState {
  // Deep clone the whole scenario up front so nothing in the resulting GameState
  // shares references with the authored definition — the engine may mutate any
  // field during play, and the scenario must stay untouched.
  const source = JSON.parse(JSON.stringify(scenario)) as Scenario

  const state = createEmptyState()
  state.storyId = source.id
  state.storyMetadata = source.metadata
  state.eventsById = Object.fromEntries(source.eventsData.map((event) => [event.id, event]))
  state.narrativeCardTemplates = source.playerDeck.filter((card) => card.type === 'narrative')
  state.narrativeInterventionInterval = source.narrative_intervention_interval
  state.drawCardCountPerTurn = source.draw_card_count_per_turn
  state.handLimit = source.hand_limit
  state.resources = source.initial_resources
  state.playerPosition = source.starting_position
  state.cells = source.mapData.cells

  state.random = createRandom(seed ?? (Date.now() & 0xffffff))
  state.drawPile = state.random.shuffle(source.playerDeck.filter((card) => card.type === 'standard'))
  state.hand = state.drawPile.splice(0, source.initial_hand_size)

  const startCell = state.cells.find(
    (cell) => cell.q === state.playerPosition.q && cell.r === state.playerPosition.r,
  )
  if (startCell) startCell.is_revealed = true

  return state
}
