// UI feedback surfaced by the notification store — not part of game state, so it
// lives next to the store that owns it rather than inside the engine.
export type NotificationKind = 'info' | 'outcome' | 'game-over'

export interface SystemNotification {
  id: string
  text: string
  kind: NotificationKind
}
