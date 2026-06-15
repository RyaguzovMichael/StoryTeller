import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest'

import { saveGame, loadGame, clearGame } from '@/infrastructure/gameStorage'
import { createEmptyState } from '@/engine/gameState'
import { createRandom } from '@/engine/random'
import type { GameState } from '@/engine/gameState'

const SAVE_KEY = 'storyteller:save:v2'

// localStorage is not provided by this test environment, so back it with memory.
class MemoryStorage {
  private store = new Map<string, string>()
  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value))
  }
  removeItem(key: string): void {
    this.store.delete(key)
  }
  clear(): void {
    this.store.clear()
  }
}

beforeAll(() => {
  vi.stubGlobal('localStorage', new MemoryStorage())
})

afterAll(() => {
  vi.unstubAllGlobals()
})

function aSave(): GameState {
  const state = createEmptyState()
  state.storyId = 'story-1'
  state.resources = { gold: 3 }
  state.playerPosition = { q: 1, r: 0 }
  state.random = createRandom(42)
  state.random.next() // advance the stream so the saved position is non-trivial
  return state
}

describe('storage save/load', () => {
  beforeEach(() => {
    clearGame()
  })

  it('round-trips a GameState, flattening random to randomState and back', () => {
    const state = aSave()
    saveGame(state)
    const loaded = loadGame()!

    expect(loaded.storyId).toBe('story-1')
    expect(loaded.resources).toEqual({ gold: 3 })
    expect(loaded.playerPosition).toEqual({ q: 1, r: 0 })
    // The restored generator resumes the exact same stream.
    expect(loaded.random.state).toBe(state.random.state)
    expect(loaded.random.next()).toBe(state.random.next())
  })

  it('returns null when there is no save', () => {
    expect(loadGame()).toBeNull()
  })

  it('returns null for unparseable data', () => {
    localStorage.setItem(SAVE_KEY, 'not json')
    expect(loadGame()).toBeNull()
  })

  it('returns null for data that is not one of our saves', () => {
    localStorage.setItem(SAVE_KEY, '{}')
    expect(loadGame()).toBeNull()
  })
})
