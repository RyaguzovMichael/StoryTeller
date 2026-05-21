import type { Coord } from '@/types/scenario'

export const HEX_SIZE = 24

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

export function axialToPixel(c: Coord, size: number = HEX_SIZE): { x: number; y: number } {
  const x = size * Math.sqrt(3) * (c.q + c.r / 2)
  const y = size * 1.5 * c.r
  return { x, y }
}

export function hexCorners(center: { x: number; y: number }, size: number = HEX_SIZE): string {
  const points: string[] = []
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30)
    const px = center.x + size * Math.cos(angle)
    const py = center.y + size * Math.sin(angle)
    points.push(`${px.toFixed(2)},${py.toFixed(2)}`)
  }
  return points.join(' ')
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

export function viewBoxFor(radius: number, size: number = HEX_SIZE, padding: number = 8): string {
  const w = size * Math.sqrt(3) * (radius + 0.5) + padding
  const h = size * 1.5 * radius + size + padding
  return `${-w} ${-h} ${2 * w} ${2 * h}`
}
