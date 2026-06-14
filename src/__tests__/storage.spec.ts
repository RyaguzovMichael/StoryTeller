import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest'

import { saveGame, loadGame, clearGame } from '@/infrastructure/storage'
import { createEmptyState } from '@/engine/types/gameState'
import type { GameState } from '@/engine/types/gameState'

const SAVE_KEY = 'storyteller:save:v1'

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
  state.initialized = true
  state.storyId = 'story-1'
  state.resources = { gold: 3 }
  state.position = { q: 1, r: 0 }
  return state
}

describe('storage save/load', () => {
  beforeEach(() => {
    clearGame()
  })

  it('round-trips a GameState', () => {
    const state = aSave()
    saveGame(state)
    expect(loadGame()).toEqual(state)
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
