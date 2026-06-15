import type { Card, GameEvent, HexCell } from '@/engine/types/scenario'
import { coordKey, recenterCoords, type Coord } from '@/engine/hexGrid'
import type { ScenarioDraft } from './scenarioDraft'

const DEFAULT_TERRAIN = 'plains'

// The sole writer of a ScenarioDraft: the editor counterpart of GameEngine.
// Exposes intent-level edits an author performs; each one keeps the draft's
// invariants intact (see ScenarioDraft.validate for the full list), throwing
// when an edit would target something that does not exist or break uniqueness.
export class ScenarioEditor {
  constructor(draft: ScenarioDraft) {
    this.state = draft
  }

  get draft(): ScenarioDraft {
    return this.state
  }

  // --- Map ---

  paintTerrain(coord: Coord, terrain: string): void {
    this.requireCell(coord).terrain = terrain
  }

  assignEvent(coord: Coord, eventId: string | null): void {
    if (eventId !== null && !this.state.eventMap.has(eventId)) {
      throw new Error(`Unknown event "${eventId}"`)
    }
    this.requireCell(coord).event_id = eventId
  }

  addCell(coord: Coord): void {
    const key = coordKey(coord)
    if (this.state.cellMap.has(key)) return
    this.state.cellMap.set(key, {
      q: coord.q,
      r: coord.r,
      terrain: DEFAULT_TERRAIN,
      event_id: null,
      is_revealed: false,
    })
  }

  removeCell(coord: Coord): void {
    if (coordKey(coord) === coordKey(this.state.meta.startingPosition)) {
      throw new Error('Cannot remove the starting cell; move the start first')
    }
    this.state.cellMap.delete(coordKey(coord))
  }

  setStart(coord: Coord): void {
    if (!this.state.cellMap.has(coordKey(coord))) {
      throw new Error('Starting position must be an existing cell')
    }
    this.state.meta.startingPosition = { q: coord.q, r: coord.r }
  }

  // Shifts the whole map (and the start) so its bounding box centers on (0,0).
  // Rebuilds the cell map because recentering changes every coordKey.
  recenter(): void {
    const cells = [...this.state.cellMap.values()]
    const recentered = recenterCoords([this.state.meta.startingPosition, ...cells])
    const newStart = recentered[0]
    if (!newStart) return
    const newCells = recentered.slice(1) as HexCell[]
    this.state.cellMap.clear()
    for (const cell of newCells) this.state.cellMap.set(coordKey(cell), cell)
    this.state.meta.startingPosition = { q: newStart.q, r: newStart.r }
  }

  // --- Event pool ---

  addEvent(event: GameEvent): void {
    if (this.state.eventMap.has(event.id)) throw new Error(`Duplicate event id "${event.id}"`)
    this.state.eventMap.set(event.id, event)
  }

  updateEvent(id: string, patch: Partial<Omit<GameEvent, 'id'>>): void {
    const event = this.state.eventMap.get(id)
    if (!event) throw new Error(`Unknown event "${id}"`)
    Object.assign(event, patch)
  }

  // Cascades: clears cell.event_id and card.overwrite_event_id pointing at it.
  removeEvent(id: string): void {
    if (!this.state.eventMap.delete(id)) throw new Error(`Unknown event "${id}"`)
    for (const cell of this.state.cellMap.values()) {
      if (cell.event_id === id) cell.event_id = null
    }
    for (const card of this.state.cardMap.values()) {
      if (card.overwrite_event_id === id) card.overwrite_event_id = null
    }
  }

  // --- Deck ---

  addCard(card: Card): void {
    if (this.state.cardMap.has(card.id)) throw new Error(`Duplicate card id "${card.id}"`)
    this.state.cardMap.set(card.id, card)
  }

  updateCard(id: string, patch: Partial<Omit<Card, 'id'>>): void {
    const card = this.state.cardMap.get(id)
    if (!card) throw new Error(`Unknown card "${id}"`)
    Object.assign(card, patch)
  }

  removeCard(id: string): void {
    if (!this.state.cardMap.delete(id)) throw new Error(`Unknown card "${id}"`)
  }

  // --- Metadata ---

  setTitle(title: string): void {
    this.state.meta.title = title
  }

  setInitialResources(resources: Record<string, number>): void {
    this.state.meta.initialResources = resources
  }

  setInterval(turns: number): void {
    this.state.meta.narrativeInterventionInterval = turns
  }

  setInitialHandSize(size: number): void {
    this.state.meta.initialHandSize = size
  }

  setDrawCount(count: number): void {
    this.state.meta.drawCardCountPerTurn = count
  }

  setHandLimit(limit: number): void {
    this.state.meta.handLimit = limit
  }

  private requireCell(coord: Coord): HexCell {
    const cell = this.state.cellMap.get(coordKey(coord))
    if (!cell) throw new Error(`No cell at (${coord.q},${coord.r})`)
    return cell
  }

  private readonly state: ScenarioDraft
}
