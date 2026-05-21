export interface Coord {
  q: number
  r: number
}

export interface HexCell {
  q: number
  r: number
  terrain: string
  event_id: string | null
  is_revealed: boolean
}

export interface MapConfig {
  radius: number
  cells: HexCell[]
}

export interface Outcome {
  text: string
  resource_deltas: Record<string, number>
}

export interface GameEvent {
  id: string
  text: string
  difficulty: number
  critical_threshold?: number
  success_outcome: Outcome
  fail_outcome: Outcome
}

export type EventPool = GameEvent[]

export type CardType = 'standard' | 'narrative'

export interface Card {
  id: string
  text: string
  type: CardType
  weight: number
  overwrite_terrain?: string
  overwrite_event_id?: string | null
}

export type PlayerDeck = Card[]

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
}
