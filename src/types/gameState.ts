import type { Card, Coord } from './scenario'

export type GamePhase =
  | 'movement'
  | 'draw'
  | 'consequences'
  | 'narrative-intervention'
  | 'game-over'

export interface GameState {
  scenarioId: string
  phase: GamePhase
  resources: Record<string, number>
  position: Coord
  drawPile: Card[]
  hand: Card[]
  activeZone: Card[]
  hiddenS: number
  currentEventId: string | null
  pendingNarrativeCard: Card | null
  turnCount: number
}

export type NotificationKind = 'info' | 'outcome' | 'game-over'

export interface SystemNotification {
  id: string
  text: string
  kind: NotificationKind
}
