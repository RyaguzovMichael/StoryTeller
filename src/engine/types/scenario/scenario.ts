import type { Coord } from '@/engine/hexGrid'
import type { MapConfig } from './hexCell'
import type { EventPool } from './event'
import type { PlayerDeck } from './card'

// The full authored story: one folder / one JSON file maps to one Scenario.
export interface Scenario {
  id: string
  metadata: { title: string }
  mapData: MapConfig
  eventsData: EventPool
  playerDeck: PlayerDeck
  initial_resources: Record<string, number>
  starting_position: Coord
  narrative_intervention_interval: number
  initial_hand_size: number
  draw_card_count_per_turn: number
  hand_limit: number
}
