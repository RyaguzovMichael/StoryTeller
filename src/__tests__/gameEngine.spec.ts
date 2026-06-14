import { describe, it, expect } from 'vitest'

import { GameEngine } from '@/engine/gameEngine'
import { createGameState } from '@/engine/createGameState'
import { createEmptyState } from '@/engine/types/gameState'
import type { EngineEvent } from '@/engine/types/gameState'
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

// Builds an initialized engine and records every event it emits.
function setup() {
  const state = createEmptyState()
  const engine = new GameEngine(state)
  const events: EngineEvent[] = []
  engine.onEvent((event) => events.push(event))
  engine.load(createGameState(makeScenario()))
  return { engine, state, events }
}

describe('GameEngine.load', () => {
  it('runs one-time setup for a freshly mapped scenario', () => {
    const { state, events } = setup()

    expect(state.initialized).toBe(true)
    expect(state.hand).toHaveLength(2)
    expect(state.drawPile).toHaveLength(1)
    expect(state.cells.find((c) => c.q === 0 && c.r === 0)?.is_revealed).toBe(true)
    expect(events.some((e) => e.kind === 'reset')).toBe(true)
    expect(events.some((e) => e.kind === 'persist')).toBe(true)
  })

  it('loads an already-initialized save untouched (no re-deal, no events)', () => {
    const fresh = createEmptyState()
    new GameEngine(fresh).load(createGameState(makeScenario()))
    const saved = JSON.parse(JSON.stringify(fresh))
    saved.hand = [] // tamper: prove no re-deal

    const target = createEmptyState()
    const engine = new GameEngine(target)
    const events: EngineEvent[] = []
    engine.onEvent((event) => events.push(event))
    engine.load(saved)

    expect(target.initialized).toBe(true)
    expect(target.hand).toEqual([]) // setup did not run again
    expect(events).toEqual([]) // already initialized → no setup signals
  })
})

describe('GameEngine.move', () => {
  it('reveals the target, opens its event, and asks to persist', () => {
    const { engine, state, events } = setup()
    events.length = 0

    engine.move({ q: 1, r: 0 })

    expect(state.position).toEqual({ q: 1, r: 0 })
    expect(state.phase).toBe('draw')
    expect(state.currentEvent?.id).toBe('ev-1')
    expect(state.cells.find((c) => c.q === 1 && c.r === 0)?.is_revealed).toBe(true)
    expect(events.some((e) => e.kind === 'persist')).toBe(true)
  })

  it('is ignored outside the movement phase', () => {
    const { engine, state } = setup()
    engine.move({ q: 1, r: 0 }) // now in draw phase
    engine.move({ q: 0, r: 0 })
    expect(state.position).toEqual({ q: 1, r: 0 })
  })
})

describe('GameEngine.playCard / returnCard', () => {
  it('moves a card between hand and tableau', () => {
    const { engine, state } = setup()
    engine.move({ q: 1, r: 0 })
    const card = state.hand[0]!

    engine.playCard(card)
    expect(state.tableau.map((c) => c.id)).toContain(card.id)
    expect(state.hand.map((c) => c.id)).not.toContain(card.id)

    engine.returnCard(card)
    expect(state.hand.map((c) => c.id)).toContain(card.id)
    expect(state.tableau.map((c) => c.id)).not.toContain(card.id)
  })

  it('ignores a card that is not in hand', () => {
    const { engine, state } = setup()
    engine.move({ q: 1, r: 0 })
    engine.playCard({ id: 'nope', text: 'x', type: 'standard', weight: 0 })
    expect(state.tableau).toHaveLength(0)
  })
})

describe('GameEngine.confirmPlay', () => {
  it('applies the success outcome and returns to movement', () => {
    const { engine, state, events } = setup()
    engine.move({ q: 1, r: 0 })
    for (const card of state.hand.slice()) engine.playCard(card) // sum >= difficulty 2
    events.length = 0

    engine.confirmPlay()

    expect(state.resources.gold).toBe(6) // 5 + success(+1)
    expect(state.tableau).toEqual([])
    expect(state.phase).toBe('movement')
    expect(events.some((e) => e.kind === 'outcome')).toBe(true)
    expect(events.some((e) => e.kind === 'persist')).toBe(true)
  })

  it('ends the game when a resource is depleted', () => {
    const { engine, state, events } = setup()
    engine.move({ q: 1, r: 0 })
    state.resources.gold = 1 // next failure (-1) will deplete it
    events.length = 0

    engine.confirmPlay() // empty tableau → failure

    expect(state.resources.gold).toBe(0)
    expect(state.phase).toBe('game-over')
    expect(events.some((e) => e.kind === 'game-over')).toBe(true)
  })

  it('never refills the hand beyond the maximum', () => {
    const { engine, state } = setup()
    engine.move({ q: 1, r: 0 })
    for (const card of state.hand.slice()) engine.playCard(card)
    engine.confirmPlay()
    expect(state.hand.length).toBeLessThanOrEqual(2)
  })
})

describe('GameEngine.onEvent', () => {
  it('hands a persist event carrying the current state', () => {
    const { engine, state, events } = setup()
    engine.move({ q: 1, r: 0 })

    const persistEvents = events.filter(
      (e) => e.kind === 'persist',
    ) as Extract<EngineEvent, { kind: 'persist' }>[]
    const persist = persistEvents[persistEvents.length - 1]
    expect(persist).toBeDefined()
    expect(persist?.state).toBe(state)
    expect(persist?.state.position).toEqual({ q: 1, r: 0 })
  })

  it('stops delivering after unsubscribe', () => {
    const { engine, events } = setup()
    const seen: EngineEvent[] = []
    const unsubscribe = engine.onEvent((event) => seen.push(event))
    unsubscribe()
    events.length = 0
    engine.move({ q: 1, r: 0 })
    expect(seen).toHaveLength(0)
  })
})
