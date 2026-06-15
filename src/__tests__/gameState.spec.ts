import { describe, it, expect } from 'vitest'

import {
  createEmptyState,
  serializeGameState,
  deserializeGameState,
} from '@/engine/gameState'
import { createRandom } from '@/engine/random'
import type { GameState } from '@/engine/gameState'

function aState(): GameState {
  const state = createEmptyState()
  state.storyId = 'story-1'
  state.resources = { gold: 3 }
  state.playerPosition = { q: 1, r: 0 }
  state.random = createRandom(42)
  state.random.next() // advance the stream so the saved position is non-trivial
  return state
}

describe('serialize/deserialize GameState', () => {
  it('flattens random to randomState and restores the exact stream position', () => {
    const state = aState()
    const dto = serializeGameState(state)

    expect(dto.randomState).toBe(state.random.state)
    expect('random' in dto).toBe(false)

    const restored = deserializeGameState(dto)

    expect(restored.storyId).toBe('story-1')
    expect(restored.resources).toEqual({ gold: 3 })
    expect(restored.playerPosition).toEqual({ q: 1, r: 0 })
    // The restored generator resumes the exact same stream, bit-for-bit.
    expect(restored.random.state).toBe(state.random.state)
    expect(restored.random.next()).toBe(state.random.next())
  })
})
