import { describe, it, expect } from 'vitest'

import { ScenarioDraft } from '@/editor/scenarioDraft'
import type { Scenario } from '@/engine/types/scenario'

function makeScenario(): Scenario {
  return {
    id: 'story-1',
    metadata: { title: 'Test Story' },
    mapData: {
      cells: [
        { q: 0, r: 0, terrain: 'plains', event_id: null, is_revealed: true },
        { q: 1, r: 0, terrain: 'forest', event_id: 'ev-1', is_revealed: false },
        { q: 0, r: 1, terrain: 'swamp', event_id: null, is_revealed: false },
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
      { id: 'n1', text: 'narrative', type: 'narrative', weight: 0, overwrite_event_id: 'ev-1' },
    ],
    initial_resources: { gold: 5 },
    starting_position: { q: 0, r: 0 },
    narrative_intervention_interval: 3,
    initial_hand_size: 1,
    draw_card_count_per_turn: 2,
    hand_limit: 4,
  }
}

describe('ScenarioDraft', () => {
  it('round-trips from -> toScenario preserving data and order', () => {
    const scenario = makeScenario()
    const restored = ScenarioDraft.from(scenario).toScenario()
    expect(restored).toEqual(scenario)
  })

  it('does not share references with the source scenario', () => {
    const scenario = makeScenario()
    const restored = ScenarioDraft.from(scenario).toScenario()
    expect(restored.mapData.cells).not.toBe(scenario.mapData.cells)
    expect(restored.mapData.cells[0]).not.toBe(scenario.mapData.cells[0])
  })

  it('exposes cells/events/deck and looks up cells by coord', () => {
    const draft = ScenarioDraft.from(makeScenario())
    expect(draft.cells).toHaveLength(3)
    expect(draft.events).toHaveLength(1)
    expect(draft.deck).toHaveLength(4)
    expect(draft.cellAt({ q: 1, r: 0 })?.terrain).toBe('forest')
    expect(draft.cellAt({ q: 5, r: 5 })).toBeUndefined()
  })

  it('maps meta fields', () => {
    const meta = ScenarioDraft.from(makeScenario()).meta
    expect(meta.id).toBe('story-1')
    expect(meta.title).toBe('Test Story')
    expect(meta.initialResources).toEqual({ gold: 5 })
    expect(meta.startingPosition).toEqual({ q: 0, r: 0 })
    expect(meta.narrativeInterventionInterval).toBe(3)
    expect(meta.initialHandSize).toBe(1)
    expect(meta.drawCardCountPerTurn).toBe(2)
    expect(meta.handLimit).toBe(4)
  })

  it('reports no issues for a well-formed scenario', () => {
    expect(ScenarioDraft.from(makeScenario()).validate()).toEqual([])
  })

  it('flags a starting position that is not on the map', () => {
    const scenario = makeScenario()
    scenario.starting_position = { q: 9, r: 9 }
    const codes = ScenarioDraft.from(scenario).validate().map((i) => i.code)
    expect(codes).toContain('start-off-map')
  })

  it('flags a dangling cell event_id', () => {
    const scenario = makeScenario()
    scenario.mapData.cells[1]!.event_id = 'ghost'
    const codes = ScenarioDraft.from(scenario).validate().map((i) => i.code)
    expect(codes).toContain('dangling-cell-event')
  })

  it('flags a dangling card overwrite_event_id', () => {
    const scenario = makeScenario()
    scenario.playerDeck[3]!.overwrite_event_id = 'ghost'
    const codes = ScenarioDraft.from(scenario).validate().map((i) => i.code)
    expect(codes).toContain('dangling-card-event')
  })

  it('flags an interval below 1', () => {
    const scenario = makeScenario()
    scenario.narrative_intervention_interval = 0
    const codes = ScenarioDraft.from(scenario).validate().map((i) => i.code)
    expect(codes).toContain('interval-too-small')
  })

  it('flags an initial hand size larger than the deck', () => {
    const scenario = makeScenario()
    scenario.initial_hand_size = 99
    const codes = ScenarioDraft.from(scenario).validate().map((i) => i.code)
    expect(codes).toContain('hand-size-too-large')
  })
})
