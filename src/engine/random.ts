// Deterministic seeded RNG (mulberry32). The whole internal state is a single
// 32-bit integer exposed via `state`, so a session's generator can be persisted
// and resumed exactly (restoreRandom) — this is what makes save/load reproducible
// and closes reroll abuse.
export interface Random {
  next(): number
  int(min: number, max: number): number
  pick<T>(items: readonly T[]): T
  shuffle<T>(items: readonly T[]): T[]
  readonly state: number
}

export function createRandom(seed: number): Random {
  return fromState((seed | 0) || 1)
}

// Resume a generator from a previously captured `state` — continues the exact
// same stream. Unlike createRandom it does not normalize the value, so the
// position is restored bit-for-bit.
export function restoreRandom(state: number): Random {
  return fromState(state | 0)
}

function fromState(initial: number): Random {
  let state = initial
  function next(): number {
    state = (state + 0x6d2b79f5) | 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  function int(min: number, max: number): number {
    return Math.floor(next() * (max - min + 1)) + min
  }
  function pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error('pick from empty array')
    return items[int(0, items.length - 1)] as T
  }
  function shuffle<T>(items: readonly T[]): T[] {
    const out = items.slice()
    for (let i = out.length - 1; i > 0; i--) {
      const j = int(0, i)
      const tmp = out[i] as T
      out[i] = out[j] as T
      out[j] = tmp
    }
    return out
  }
  return {
    next,
    int,
    pick,
    shuffle,
    get state() {
      return state
    },
  }
}
