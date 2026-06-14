// Side effects the engine asks its host to perform. The engine never performs
// them itself — that keeps it pure (no notifications, no persistence). It only
// appends effects to its state; a host observer drains and applies them.
export type GameEffect =
  | { kind: 'outcome'; text: string }
  | { kind: 'game-over'; reason: string }
  | { kind: 'map-changed' }
  | { kind: 'reset' }
