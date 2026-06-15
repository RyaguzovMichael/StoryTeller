import { describe, it, expect } from 'vitest'

import { isScenario } from '@/infrastructure/scenarioStorage'
import type { Scenario } from '@/engine/types/scenario'

describe('isScenario', () => {
  function aScenario(): Scenario {
    return {
      id: 's',
      metadata: { title: 't' },
      terrains: [],
      mapData: { cells: [] },
      eventsData: [],
      playerDeck: [],
      initial_resources: {},
      starting_position: { q: 0, r: 0 },
      narrative_intervention_interval: 5,
      initial_hand_size: 3,
      draw_card_count_per_turn: 2,
      hand_limit: 6,
    }
  }

  it('accepts a full scenario', () => {
    expect(isScenario(aScenario())).toBe(true)
  })

  it('rejects a scenario missing the new fields', () => {
    const { draw_card_count_per_turn, ...partial } = aScenario()
    void draw_card_count_per_turn
    expect(isScenario(partial)).toBe(false)
  })
})
