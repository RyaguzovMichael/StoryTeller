import { describe, it, expect } from 'vitest'

import {
  NEIGHBOR_DIRS,
  coordKey,
  hexDistance,
  neighborsOf,
  isAdjacent,
  enumerateRadius,
  recenterCoords,
} from '@/utils/hexGrid'
import type { Coord } from '@/types/scenario'

describe('NEIGHBOR_DIRS', () => {
  it('lists exactly six directions', () => {
    expect(NEIGHBOR_DIRS).toHaveLength(6)
  })

  it('contains only unit-distance directions away from the origin', () => {
    for (const direction of NEIGHBOR_DIRS) {
      expect(hexDistance({ q: 0, r: 0 }, direction)).toBe(1)
    }
  })

  it('has no duplicate directions', () => {
    const keys = NEIGHBOR_DIRS.map(coordKey)
    expect(new Set(keys).size).toBe(NEIGHBOR_DIRS.length)
  })

  it('is symmetric: every direction has its opposite', () => {
    const keys = new Set(NEIGHBOR_DIRS.map(coordKey))
    for (const direction of NEIGHBOR_DIRS) {
      expect(keys.has(coordKey({ q: -direction.q, r: -direction.r }))).toBe(true)
    }
  })
})

describe('coordKey', () => {
  it('formats a coordinate as "q,r"', () => {
    expect(coordKey({ q: 2, r: -3 })).toBe('2,-3')
  })

  it('produces equal keys for equal coordinates', () => {
    expect(coordKey({ q: 1, r: 1 })).toBe(coordKey({ q: 1, r: 1 }))
  })

  it('produces distinct keys for swapped components', () => {
    expect(coordKey({ q: 1, r: 2 })).not.toBe(coordKey({ q: 2, r: 1 }))
  })
})

describe('hexDistance', () => {
  it('is zero between a coordinate and itself', () => {
    expect(hexDistance({ q: 4, r: -1 }, { q: 4, r: -1 })).toBe(0)
  })

  it('is one between immediate neighbors of the origin', () => {
    for (const direction of NEIGHBOR_DIRS) {
      expect(hexDistance({ q: 0, r: 0 }, direction)).toBe(1)
    }
  })

  it('is symmetric', () => {
    const a: Coord = { q: -2, r: 3 }
    const b: Coord = { q: 5, r: -1 }
    expect(hexDistance(a, b)).toBe(hexDistance(b, a))
  })

  it('counts steps along the third (s) axis', () => {
    // (0,0) and (2,-2) differ only on the s axis; distance is 2.
    expect(hexDistance({ q: 0, r: 0 }, { q: 2, r: -2 })).toBe(2)
  })

  it('measures a straight line along the q axis', () => {
    expect(hexDistance({ q: 0, r: 0 }, { q: 3, r: 0 })).toBe(3)
  })
})

describe('neighborsOf', () => {
  it('returns six neighbors', () => {
    expect(neighborsOf({ q: 0, r: 0 })).toHaveLength(6)
  })

  it('returns coordinates each at distance one from the source', () => {
    const center: Coord = { q: 3, r: -4 }
    for (const neighbor of neighborsOf(center)) {
      expect(hexDistance(center, neighbor)).toBe(1)
    }
  })

  it('offsets each direction from the source coordinate', () => {
    const center: Coord = { q: 10, r: 20 }
    const expected = NEIGHBOR_DIRS.map((direction) =>
      coordKey({ q: center.q + direction.q, r: center.r + direction.r }),
    )
    expect(neighborsOf(center).map(coordKey)).toEqual(expected)
  })

  it('does not mutate the source coordinate', () => {
    const center: Coord = { q: 1, r: 2 }
    neighborsOf(center)
    expect(center).toEqual({ q: 1, r: 2 })
  })
})

describe('isAdjacent', () => {
  it('is true for direct neighbors', () => {
    expect(isAdjacent({ q: 0, r: 0 }, { q: 1, r: 0 })).toBe(true)
  })

  it('is false for a coordinate compared with itself', () => {
    expect(isAdjacent({ q: 2, r: 2 }, { q: 2, r: 2 })).toBe(false)
  })

  it('is false for coordinates two steps apart', () => {
    expect(isAdjacent({ q: 0, r: 0 }, { q: 2, r: 0 })).toBe(false)
  })

  it('agrees with neighborsOf for every neighbor', () => {
    const center: Coord = { q: -1, r: 5 }
    for (const neighbor of neighborsOf(center)) {
      expect(isAdjacent(center, neighbor)).toBe(true)
    }
  })
})

describe('enumerateRadius', () => {
  it('returns the single origin cell for radius 0', () => {
    const cells = enumerateRadius(0)
    expect(cells).toHaveLength(1)
    expect(coordKey(cells[0]!)).toBe('0,0')
  })

  it('returns seven cells for radius 1 (center plus six neighbors)', () => {
    expect(enumerateRadius(1)).toHaveLength(7)
  })

  // Centered hexagonal numbers: 1, 7, 19, 37 for radii 0..3.
  it.each([
    [0, 1],
    [1, 7],
    [2, 19],
    [3, 37],
  ])('returns the centered hexagonal count for radius %i', (radius, expectedCount) => {
    expect(enumerateRadius(radius)).toHaveLength(expectedCount)
  })

  it('includes the origin', () => {
    expect(enumerateRadius(2).map(coordKey)).toContain('0,0')
  })

  it('keeps every cell within the requested radius', () => {
    const radius = 3
    for (const cell of enumerateRadius(radius)) {
      expect(hexDistance({ q: 0, r: 0 }, cell)).toBeLessThanOrEqual(radius)
    }
  })

  it('contains every immediate neighbor at radius 1', () => {
    const keys = new Set(enumerateRadius(1).map(coordKey))
    for (const direction of NEIGHBOR_DIRS) {
      expect(keys.has(coordKey(direction))).toBe(true)
    }
  })

  it('produces no duplicate cells', () => {
    const cells = enumerateRadius(3)
    expect(new Set(cells.map(coordKey)).size).toBe(cells.length)
  })
})

describe('recenterCoords', () => {
  it('returns an empty array for empty input', () => {
    expect(recenterCoords([])).toEqual([])
  })

  it('leaves an already-centered single cell at the origin', () => {
    expect(recenterCoords([{ q: 0, r: 0 }])).toEqual([{ q: 0, r: 0 }])
  })

  it('shifts a single offset cell back to the origin', () => {
    expect(recenterCoords([{ q: 5, r: -3 }])).toEqual([{ q: 0, r: 0 }])
  })

  it('centers the bounding box of a coordinate set on the origin', () => {
    const recentered = recenterCoords([
      { q: 10, r: 10 },
      { q: 14, r: 10 },
      { q: 10, r: 14 },
      { q: 14, r: 14 },
    ])
    expect(recentered.map(coordKey).sort()).toEqual(
      ['-2,-2', '-2,2', '2,-2', '2,2'].sort(),
    )
  })

  it('preserves the relative geometry between cells', () => {
    const original: Coord[] = [
      { q: 3, r: 7 },
      { q: 6, r: 7 },
    ]
    const recentered = recenterCoords(original)
    expect(hexDistance(recentered[0]!, recentered[1]!)).toBe(hexDistance(original[0]!, original[1]!))
  })

  it('preserves extra fields on each item', () => {
    const cells = [
      { q: 4, r: 4, terrain: 'forest', event_id: 'e1' },
      { q: 6, r: 6, terrain: 'water', event_id: null },
    ]
    const recentered = recenterCoords(cells)
    expect(recentered[0]).toMatchObject({ terrain: 'forest', event_id: 'e1' })
    expect(recentered[1]).toMatchObject({ terrain: 'water', event_id: null })
  })

  it('returns new objects without mutating the input', () => {
    const original = { q: 8, r: 8 }
    const recentered = recenterCoords([original])
    expect(recentered[0]).not.toBe(original)
    expect(original).toEqual({ q: 8, r: 8 })
  })
})
