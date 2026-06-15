import { describe, it, expect } from 'vitest'

import { generateBlankScenario, generateDeck } from '@/editor/scenarioGenerator'
import { createRandom } from '@/engine/random'

describe('generateBlankScenario', () => {
  it('produces a blank slate: one start cell, one terrain, no events or cards', () => {
    const scenario = generateBlankScenario()
    expect(scenario.mapData.cells).toEqual([
      { q: 0, r: 0, terrain: 'plains', event_id: null, is_revealed: true },
    ])
    expect(scenario.terrains).toHaveLength(1)
    expect(scenario.terrains[0]?.name).toBe('plains')
    expect(scenario.eventsData).toEqual([])
    expect(scenario.playerDeck).toEqual([])
    expect(scenario.starting_position).toEqual({ q: 0, r: 0 })
    expect(scenario.initial_hand_size).toBe(0)
  })
})

describe('generateDeck', () => {
  it('splits the deck into standard and narrative cards', () => {
    const deck = generateDeck(createRandom(1), 6, 2, ['ev-1', 'ev-2'], ['plains', 'forest'])
    expect(deck).toHaveLength(6)
    expect(deck.filter((card) => card.type === 'standard')).toHaveLength(4)
    expect(deck.filter((card) => card.type === 'narrative')).toHaveLength(2)
  })

  it('points narrative cards at the given terrains and event ids', () => {
    const deck = generateDeck(createRandom(2), 3, 3, ['ev-1'], ['plains', 'forest'])
    for (const card of deck) {
      expect(['plains', 'forest']).toContain(card.overwrite_terrain)
      expect(card.overwrite_event_id).toBe('ev-1')
    }
  })

  it('leaves narrative targets empty when there are no terrains or events', () => {
    const deck = generateDeck(createRandom(3), 2, 2, [], [])
    for (const card of deck) {
      expect(card.overwrite_terrain).toBeUndefined()
      expect(card.overwrite_event_id).toBeNull()
    }
  })
})
