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
