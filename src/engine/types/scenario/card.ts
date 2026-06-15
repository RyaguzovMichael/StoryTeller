export type PlayerDeck = Card[]

export interface Card {
  id: string
  text: string
  type: CardType
  weight: number
  overwrite_terrain?: string
  overwrite_event_id?: string | null
}

export type CardType = 'standard' | 'narrative'
