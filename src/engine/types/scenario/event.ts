// A resource change plus the narrative text shown when it is applied.
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
