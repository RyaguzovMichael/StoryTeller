import type { Coord } from '@/types/scenario'

export const NEIGHBOR_DIRS: ReadonlyArray<Coord> = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
]

export function coordKey(c: Coord): string {
  return `${c.q},${c.r}`
}

export function hexDistance(a: Coord, b: Coord): number {
  const dq = a.q - b.q
  const dr = a.r - b.r
  return (Math.abs(dq) + Math.abs(dq + dr) + Math.abs(dr)) / 2
}

export function neighborsOf(c: Coord): Coord[] {
  return NEIGHBOR_DIRS.map((d) => ({ q: c.q + d.q, r: c.r + d.r }))
}

export function isAdjacent(a: Coord, b: Coord): boolean {
  return hexDistance(a, b) === 1
}

export function enumerateRadius(radius: number): Coord[] {
  const cells: Coord[] = []
  for (let q = -radius; q <= radius; q++) {
    const rMin = Math.max(-radius, -q - radius)
    const rMax = Math.min(radius, -q + radius)
    for (let r = rMin; r <= rMax; r++) {
      cells.push({ q, r })
    }
  }
  return cells
}

// Translates a set of coordinates so their bounding-box center sits on (0,0),
// keeping absolute coordinate values as small as possible. Extra fields on each
// item (terrain, event_id, ...) are preserved. Pure: returns new objects.
export function recenterCoords<T extends Coord>(coords: readonly T[]): T[] {
  if (coords.length === 0) return []
  let minQ = Infinity
  let maxQ = -Infinity
  let minR = Infinity
  let maxR = -Infinity
  for (const coord of coords) {
    minQ = Math.min(minQ, coord.q)
    maxQ = Math.max(maxQ, coord.q)
    minR = Math.min(minR, coord.r)
    maxR = Math.max(maxR, coord.r)
  }
  const offsetQ = Math.round((minQ + maxQ) / 2)
  const offsetR = Math.round((minR + maxR) / 2)
  return coords.map((coord) => ({ ...coord, q: coord.q - offsetQ, r: coord.r - offsetR }))
}
