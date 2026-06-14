// Rendering layer: translates the abstract hex grid (axial q,r coordinates) into
// screen geometry — pixel positions, polygon corner points, and the SVG viewBox.
// hexGrid.ts stays pure coordinate math and knows nothing about pixels or SVG.
//
// All geometry depends on a single parameter: the hex size (circumradius). It is
// captured once in the constructor, so every method derives its result from that
// one stored value. A view can hold the size in a reactive ref and rebuild the
// HexLayout instance whenever the size changes, making the whole render scale.
import type { Coord } from '@/engine/types/scenario'

// Default hex circumradius, in SVG user units. On-screen size is this value
// multiplied by the camera scale applied in the rendering component.
export const HEX_SIZE = 24

export interface PixelPoint {
  x: number
  y: number
}

export interface PixelBounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export class HexLayout {
  readonly size: number

  constructor(size: number = HEX_SIZE) {
    this.size = size
  }

  // Pixel position of a hex center (pointy-top orientation).
  axialToPixel(coord: Coord): PixelPoint {
    const x = this.size * Math.sqrt(3) * (coord.q + coord.r / 2)
    const y = this.size * 1.5 * coord.r
    return { x, y }
  }

  // The six corner points of a hex as an SVG polygon "points" string.
  hexCorners(center: PixelPoint): string {
    const points: string[] = []
    for (let cornerIndex = 0; cornerIndex < 6; cornerIndex++) {
      const angle = (Math.PI / 180) * (60 * cornerIndex - 30)
      const pointX = center.x + this.size * Math.cos(angle)
      const pointY = center.y + this.size * Math.sin(angle)
      points.push(`${pointX.toFixed(2)},${pointY.toFixed(2)}`)
    }
    return points.join(' ')
  }

  // Bounding box (in pixel space) that encloses every cell, accounting for the
  // physical extent of a pointy-top hex: half-width sqrt(3)/2*size, half-height size.
  boundsForCells(cells: readonly Coord[]): PixelBounds {
    if (cells.length === 0) {
      return { minX: -this.size, minY: -this.size, maxX: this.size, maxY: this.size }
    }
    const halfWidth = (this.size * Math.sqrt(3)) / 2
    const halfHeight = this.size
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (const cell of cells) {
      const center = this.axialToPixel(cell)
      minX = Math.min(minX, center.x - halfWidth)
      maxX = Math.max(maxX, center.x + halfWidth)
      minY = Math.min(minY, center.y - halfHeight)
      maxY = Math.max(maxY, center.y + halfHeight)
    }
    return { minX, minY, maxX, maxY }
  }

  // Value for an SVG <svg viewBox="..."> attribute that frames every cell,
  // regardless of map shape. The SVG spec requires this attribute to be a single
  // string "min-x min-y width height", so this returns a formatted string.
  viewBoxForCells(cells: readonly Coord[], padding: number = 8): string {
    const boundingBox = this.boundsForCells(cells)
    const originX = boundingBox.minX - padding
    const originY = boundingBox.minY - padding
    const width = boundingBox.maxX - boundingBox.minX + 2 * padding
    const height = boundingBox.maxY - boundingBox.minY + 2 * padding
    return `${originX} ${originY} ${width} ${height}`
  }
}
