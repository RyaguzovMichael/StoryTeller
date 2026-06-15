import { describe, it, expect } from 'vitest'
import { createRandom, restoreRandom } from '@/engine/random'

describe('random', () => {
  it('is deterministic for a given seed', () => {
    const a = createRandom(42)
    const b = createRandom(42)
    const seqA = Array.from({ length: 5 }, () => a.next())
    const seqB = Array.from({ length: 5 }, () => b.next())
    expect(seqA).toEqual(seqB)
  })

  it('shuffle is deterministic for a given seed', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8]
    expect(createRandom(7).shuffle(items)).toEqual(createRandom(7).shuffle(items))
  })

  it('restoreRandom resumes the exact same stream (anti-abuse invariant)', () => {
    const live = createRandom(123)
    live.next()
    live.next()
    const saved = live.state

    const expected = [live.next(), live.next(), live.next()]
    const resumed = restoreRandom(saved)
    const actual = [resumed.next(), resumed.next(), resumed.next()]

    expect(actual).toEqual(expected)
  })
})
