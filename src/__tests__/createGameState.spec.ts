import { describe, it, expect } from 'vitest'

import { createGameState } from '@/engine/createGameState'
import type { Scenario } from '@/engine/types/scenario'

function makeScenario(): Scenario {
  return {
    id: 'story-1',
    metadata: { title: 'Test Story' },
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
      { id: 'n1', text: 'narrative', type: 'narrative', weight: 0 },
    ],
    initial_resources: { gold: 5 },
    starting_position: { q: 0, r: 0 },
    narrative_intervention_interval: 3,
    initial_hand_size: 1,
  }
}

describe('createGameState', () => {
  it('maps scenario fields onto a fresh, uninitialized GameState', () => {
    const state = createGameState(makeScenario())

    expect(state.initialized).toBe(false)
    expect(state.storyId).toBe('story-1')
    expect(state.storyMetadata.title).toBe('Test Story')
    expect(state.initialHandSize).toBe(1)
    expect(state.narrativeInterventionInterval).toBe(3)
    expect(state.resources).toEqual({ gold: 5 })
    expect(state.position).toEqual({ q: 0, r: 0 })
    expect(state.currentEvent).toBeNull()
    expect(state.phase).toBe('movement')
  })

  it('indexes events by id and keeps only narrative cards as templates', () => {
    const state = createGameState(makeScenario())

    expect(Object.keys(state.eventsById)).toEqual(['ev-1'])
    expect(state.eventsById['ev-1']?.text).toBe('An event')
    expect(state.narrativeCardTemplates.map((c) => c.id)).toEqual(['n1'])
  })

  it('puts only standard cards into the draw pile and leaves the hand empty', () => {
    const state = createGameState(makeScenario())

    expect(state.drawPile.map((c) => c.id).sort()).toEqual(['c1', 'c2'])
    expect(state.hand).toEqual([])
  })

  it('deep clones cells so mutating state never touches the scenario', () => {
    const scenario = makeScenario()
    const state = createGameState(scenario)

    state.cells[0]!.is_revealed = true
    expect(scenario.mapData.cells[0]!.is_revealed).toBe(false)
  })
})
