import { describe, it, expect } from 'vitest'

import { GameEngine } from '@/engine/gameEngine'
import { createGameState } from '@/engine/createGameState'
import { createEmptyState } from '@/engine/types/gameState'
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
      { id: 'c3', text: 'three', type: 'standard', weight: 3 },
    ],
    initial_resources: { gold: 5 },
    starting_position: { q: 0, r: 0 },
    narrative_intervention_interval: 3,
    initial_hand_size: 2,
  }
}

describe('GameEngine.load', () => {
  it('runs one-time setup for a freshly mapped scenario', () => {
    const state = createEmptyState()
    const engine = new GameEngine(state)

    engine.load(createGameState(makeScenario()))

    expect(state.initialized).toBe(true)
    expect(state.hand).toHaveLength(2)
    expect(state.drawPile).toHaveLength(1)
    expect(state.cells.find((c) => c.q === 0 && c.r === 0)?.is_revealed).toBe(true)
    expect(state.effects.some((e) => e.kind === 'reset')).toBe(true)
  })

  it('loads an already-initialized save untouched (no re-deal)', () => {
    const fresh = createEmptyState()
    new GameEngine(fresh).load(createGameState(makeScenario()))
    const saved = JSON.parse(JSON.stringify({ ...fresh, effects: undefined }))
    saved.hand = [] // tamper: a real save would keep its own hand; prove no re-deal

    const target = createEmptyState()
    const engine = new GameEngine(target)
    engine.load({ ...saved, effects: [] })

    expect(target.initialized).toBe(true)
    expect(target.hand).toEqual([]) // setup did not run again
    expect(target.effects).toEqual([])
  })
})

describe('GameEngine.snapshot', () => {
  it('round-trips state without the transient effect queue', () => {
    const source = createEmptyState()
    const sourceEngine = new GameEngine(source)
    sourceEngine.load(createGameState(makeScenario()))
    sourceEngine.selectHex({ q: 1, r: 0 })

    const snapshot = sourceEngine.snapshot()
    expect(snapshot).not.toHaveProperty('effects')
    expect(snapshot.currentEvent?.id).toBe('ev-1')

    const target = createEmptyState()
    new GameEngine(target).load({ ...snapshot, effects: [] })

    expect(target.phase).toBe('draw')
    expect(target.currentEvent?.id).toBe('ev-1')
    expect(target.position).toEqual({ q: 1, r: 0 })
  })
})
