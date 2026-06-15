import { describe, it, expect } from 'vitest'

import { createGameState } from '@/engine/createGameState'
import type { Scenario } from '@/engine/types/scenario'

function makeScenario(): Scenario {
  return {
    id: 'story-1',
    metadata: { title: 'Test Story' },
    terrains: [
      { name: 'plains', color: '#cdd9a3' },
      { name: 'forest', color: '#4f7a4a' },
      { name: 'swamp', color: '#7a8c5c' },
    ],
    mapData: {
      cells: [
        { q: 0, r: 0, terrain: 'plains', event_id: null, is_revealed: false },
        { q: 1, r: 0, terrain: 'forest', event_id: 'ev-1', is_revealed: false },
      ],
    },
    eventsData: [
      {
        id: 'ev-1',
        text: 'An event',
        difficulty: 2,
        success_outcome: { text: 'ok', resource_deltas: { gold: 1 } },
        fail_outcome: { text: 'bad', resource_deltas: { gold: -1 } },
      },
    ],
    playerDeck: [
      { id: 'c1', text: 'one', type: 'standard', weight: 1 },
      { id: 'c2', text: 'two', type: 'standard', weight: 2 },
      { id: 'c3', text: 'three', type: 'standard', weight: 3 },
      { id: 'n1', text: 'narrative', type: 'narrative', weight: 0 },
    ],
    initial_resources: { gold: 5 },
    starting_position: { q: 0, r: 0 },
    narrative_intervention_interval: 3,
    initial_hand_size: 1,
    draw_card_count_per_turn: 2,
    hand_limit: 4,
  }
}

describe('createGameState', () => {
  it('maps scenario fields onto a ready GameState', () => {
    const state = createGameState(makeScenario(), 1)

    expect(state.storyId).toBe('story-1')
    expect(state.storyMetadata.title).toBe('Test Story')
    expect(state.drawCardCountPerTurn).toBe(2)
    expect(state.handLimit).toBe(4)
    expect(state.narrativeInterventionInterval).toBe(3)
    expect(state.resources).toEqual({ gold: 5 })
    expect(state.playerPosition).toEqual({ q: 0, r: 0 })
    expect(state.currentEvent).toBeNull()
    expect(state.phase).toBe('movement')
    expect(state.random).toBeDefined()
  })

  it('indexes events by id and keeps only narrative cards as templates', () => {
    const state = createGameState(makeScenario(), 1)

    expect(Object.keys(state.eventsById)).toEqual(['ev-1'])
    expect(state.eventsById['ev-1']?.text).toBe('An event')
    expect(state.narrativeCardTemplates.map((c) => c.id)).toEqual(['n1'])
  })

  it('deals the opening hand and keeps the rest (standard cards only) in the draw pile', () => {
    const state = createGameState(makeScenario(), 1)

    expect(state.hand).toHaveLength(1)
    expect(state.drawPile).toHaveLength(2)
    const all = [...state.hand, ...state.drawPile].map((c) => c.id).sort()
    expect(all).toEqual(['c1', 'c2', 'c3'])
  })

  it('reveals the starting cell', () => {
    const state = createGameState(makeScenario(), 1)
    const start = state.cells.find((c) => c.q === 0 && c.r === 0)
    expect(start?.is_revealed).toBe(true)
  })

  it('is deterministic for a given seed', () => {
    const a = createGameState(makeScenario(), 99)
    const b = createGameState(makeScenario(), 99)
    expect(a.hand.map((c) => c.id)).toEqual(b.hand.map((c) => c.id))
    expect(a.drawPile.map((c) => c.id)).toEqual(b.drawPile.map((c) => c.id))
  })

  it('deep clones cells so mutating state never touches the scenario', () => {
    const scenario = makeScenario()
    const state = createGameState(scenario, 1)

    state.cells[1]!.is_revealed = true
    expect(scenario.mapData.cells[1]!.is_revealed).toBe(false)
  })
})
