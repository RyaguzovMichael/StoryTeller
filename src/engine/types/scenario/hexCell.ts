import type { Coord } from '@/engine/hexGrid'

// One tile of the map: an axial coordinate plus its authored content.
export interface HexCell extends Coord {
  terrain: string
  event_id: string | null
  is_revealed: boolean
}

export interface MapConfig {
  cells: HexCell[]
}
