import type { Card, GameEvent } from '@/engine/types/scenario'
import type { Coord } from '@/engine/hexGrid'
import type { ScenarioDraft } from './scenarioDraft'

// The sole writer of a ScenarioDraft: the editor counterpart of GameEngine.
// Exposes intent-level edits an author performs; each one keeps the draft's
// invariants intact (see ScenarioDraft.validate for the full list).
export class ScenarioEditor {
  constructor(draft: ScenarioDraft) {
    this.state = draft
  }

  get draft(): ScenarioDraft {
    return this.state
  }

  // --- Map ---

  paintTerrain(_coord: Coord, _terrain: string): void {
    throw new Error('not implemented')
  }

  assignEvent(_coord: Coord, _eventId: string | null): void {
    throw new Error('not implemented')
  }

  addCell(_coord: Coord): void {
    throw new Error('not implemented')
  }

  removeCell(_coord: Coord): void {
    throw new Error('not implemented')
  }

  setStart(_coord: Coord): void {
    throw new Error('not implemented')
  }

  recenter(): void {
    throw new Error('not implemented')
  }

  // --- Event pool ---

  addEvent(_event: GameEvent): void {
    throw new Error('not implemented')
  }

  updateEvent(_id: string, _patch: Partial<Omit<GameEvent, 'id'>>): void {
    throw new Error('not implemented')
  }

  // Cascades: clears cell.event_id and card.overwrite_event_id pointing at it.
  removeEvent(_id: string): void {
    throw new Error('not implemented')
  }

  // --- Deck ---

  addCard(_card: Card): void {
    throw new Error('not implemented')
  }

  updateCard(_id: string, _patch: Partial<Omit<Card, 'id'>>): void {
    throw new Error('not implemented')
  }

  removeCard(_id: string): void {
    throw new Error('not implemented')
  }

  // --- Metadata ---

  setTitle(_title: string): void {
    throw new Error('not implemented')
  }

  setInitialResources(_resources: Record<string, number>): void {
    throw new Error('not implemented')
  }

  setInterval(_turns: number): void {
    throw new Error('not implemented')
  }

  setInitialHandSize(_size: number): void {
    throw new Error('not implemented')
  }

  setDrawCount(_count: number): void {
    throw new Error('not implemented')
  }

  setHandLimit(_limit: number): void {
    throw new Error('not implemented')
  }

  private readonly state: ScenarioDraft
}
