import { describe, it, expect } from 'vitest'

import { ScenarioDraft } from '@/editor/scenarioDraft'
import { ScenarioEditor } from '@/editor/scenarioEditor'
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

function editor(): ScenarioEditor {
  return new ScenarioEditor(ScenarioDraft.from(makeScenario()))
}

describe('ScenarioEditor — map', () => {
  it('paints terrain on an existing cell', () => {
    const ed = editor()
    ed.paintTerrain({ q: 1, r: 0 }, 'ruin')
    expect(ed.draft.cellAt({ q: 1, r: 0 })?.terrain).toBe('ruin')
  })

  it('throws when painting a cell that does not exist', () => {
    expect(() => editor().paintTerrain({ q: 9, r: 9 }, 'ruin')).toThrow()
  })

  it('assigns and clears a cell event', () => {
    const ed = editor()
    ed.assignEvent({ q: 0, r: 1 }, 'ev-1')
    expect(ed.draft.cellAt({ q: 0, r: 1 })?.event_id).toBe('ev-1')
    ed.assignEvent({ q: 0, r: 1 }, null)
    expect(ed.draft.cellAt({ q: 0, r: 1 })?.event_id).toBeNull()
  })

  it('throws when assigning an unknown event', () => {
    expect(() => editor().assignEvent({ q: 0, r: 1 }, 'ghost')).toThrow()
  })

  it('adds a new cell and is a no-op on an existing coord', () => {
    const ed = editor()
    ed.addCell({ q: 2, r: 0 })
    expect(ed.draft.cellAt({ q: 2, r: 0 })).toBeDefined()
    ed.addCell({ q: 0, r: 0 })
    expect(ed.draft.cells.filter((c) => c.q === 0 && c.r === 0)).toHaveLength(1)
  })

  it('removes a cell but refuses to remove the starting cell', () => {
    const ed = editor()
    ed.removeCell({ q: 0, r: 1 })
    expect(ed.draft.cellAt({ q: 0, r: 1 })).toBeUndefined()
    expect(() => ed.removeCell({ q: 0, r: 0 })).toThrow()
  })

  it('moves the start onto an existing cell only', () => {
    const ed = editor()
    ed.setStart({ q: 1, r: 0 })
    expect(ed.draft.meta.startingPosition).toEqual({ q: 1, r: 0 })
    expect(() => ed.setStart({ q: 9, r: 9 })).toThrow()
  })

  it('recenters the map around (0,0) keeping the start on its cell', () => {
    const shifted = makeScenario()
    for (const cell of shifted.mapData.cells) {
      cell.q += 10
      cell.r += 10
    }
    shifted.starting_position = { q: 10, r: 10 }
    const ed = new ScenarioEditor(ScenarioDraft.from(shifted))
    ed.recenter()
    const result = ed.draft.toScenario()
    const start = result.starting_position
    expect(result.mapData.cells.some((c) => c.q === start.q && c.r === start.r)).toBe(true)
    const maxAbs = Math.max(...result.mapData.cells.map((c) => Math.max(Math.abs(c.q), Math.abs(c.r))))
    expect(maxAbs).toBeLessThan(10)
  })
})

describe('ScenarioEditor — events & deck', () => {
  it('adds an event and rejects a duplicate id', () => {
    const ed = editor()
    ed.addEvent({
      id: 'ev-2',
      text: 'Another',
      difficulty: 4,
      success_outcome: { text: 'y', resource_deltas: {} },
      fail_outcome: { text: 'n', resource_deltas: {} },
    })
    expect(ed.draft.events.map((e) => e.id)).toContain('ev-2')
    expect(() =>
      ed.addEvent({
        id: 'ev-1',
        text: 'dup',
        difficulty: 1,
        success_outcome: { text: '', resource_deltas: {} },
        fail_outcome: { text: '', resource_deltas: {} },
      }),
    ).toThrow()
  })

  it('updates an event in place', () => {
    const ed = editor()
    ed.updateEvent('ev-1', { difficulty: 7 })
    expect(ed.draft.events.find((e) => e.id === 'ev-1')?.difficulty).toBe(7)
  })

  it('cascades removeEvent into cells and cards', () => {
    const ed = editor()
    ed.removeEvent('ev-1')
    expect(ed.draft.events).toHaveLength(0)
    expect(ed.draft.cellAt({ q: 1, r: 0 })?.event_id).toBeNull()
    expect(ed.draft.deck.find((c) => c.id === 'n1')?.overwrite_event_id).toBeNull()
    expect(ed.draft.validate()).toEqual([])
  })

  it('adds, updates and removes cards', () => {
    const ed = editor()
    ed.addCard({ id: 'c9', text: 'nine', type: 'standard', weight: 4 })
    expect(ed.draft.deck.map((c) => c.id)).toContain('c9')
    ed.updateCard('c9', { weight: 1 })
    expect(ed.draft.deck.find((c) => c.id === 'c9')?.weight).toBe(1)
    ed.removeCard('c9')
    expect(ed.draft.deck.map((c) => c.id)).not.toContain('c9')
    expect(() =>
      ed.addCard({ id: 'c1', text: 'dup', type: 'standard', weight: 1 }),
    ).toThrow()
  })
})

describe('ScenarioEditor — meta', () => {
  it('sets metadata fields and round-trips through toScenario', () => {
    const ed = editor()
    ed.setTitle('Renamed')
    ed.setInitialResources({ gold: 1, health: 9 })
    ed.setInterval(6)
    ed.setInitialHandSize(2)
    ed.setDrawCount(1)
    ed.setHandLimit(8)
    const out = ed.draft.toScenario()
    expect(out.metadata.title).toBe('Renamed')
    expect(out.initial_resources).toEqual({ gold: 1, health: 9 })
    expect(out.narrative_intervention_interval).toBe(6)
    expect(out.initial_hand_size).toBe(2)
    expect(out.draw_card_count_per_turn).toBe(1)
    expect(out.hand_limit).toBe(8)
    expect(ed.draft.validate()).toEqual([])
  })
})
