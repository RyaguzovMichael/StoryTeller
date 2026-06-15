import type { Card, GameEvent, HexCell, TerrainType } from '@/engine/types/scenario'
import { coordKey, recenterCoords, type Coord } from '@/engine/hexGrid'
import type { Random } from '@/engine/random'
import { BLANK_TERRAIN, type ScenarioDraft } from './scenarioDraft'

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

  // Paints a real terrain, creating the cell if it does not exist yet (a click on
  // an empty/ghost or blank hex authors it in one step). BLANK_TERRAIN is not a
  // real terrain — use markBlank to clear a cell back to the blank state.
  paintTerrain(coord: Coord, terrain: string): void {
    if (!this.state.terrainMap.has(terrain)) throw new Error(`Unknown terrain "${terrain}"`)
    this.upsertCell(coord).terrain = terrain
  }

  // Marks a coord as a playable-but-unfilled (blank) cell, creating it if needed.
  // This is the shape brush: a blank cell is part of the map and a fill target.
  markBlank(coord: Coord): void {
    this.upsertCell(coord).terrain = BLANK_TERRAIN
  }

  assignEvent(coord: Coord, eventId: string | null): void {
    if (eventId !== null && !this.state.eventMap.has(eventId)) {
      throw new Error(`Unknown event "${eventId}"`)
    }
    this.requireCell(coord).event_id = eventId
  }

  // Fills every blank cell with a random real terrain, leaving authored cells
  // untouched. No-op for the rest of the scenario (event pool, deck).
  fillBlankTerrains(random: Random): void {
    const terrains = [...this.state.terrainMap.keys()]
    if (terrains.length === 0) throw new Error('Define a terrain before filling cells')
    for (const cell of this.state.cellMap.values()) {
      if (cell.terrain === BLANK_TERRAIN) cell.terrain = random.pick(terrains)
    }
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

  // --- Terrains ---

  addTerrain(terrain: TerrainType): void {
    if (this.state.terrainMap.has(terrain.name)) {
      throw new Error(`Duplicate terrain "${terrain.name}"`)
    }
    this.state.terrainMap.set(terrain.name, terrain)
  }

  // Renaming cascades into every cell painted with the old name.
  updateTerrain(name: string, patch: Partial<TerrainType>): void {
    const terrain = this.state.terrainMap.get(name)
    if (!terrain) throw new Error(`Unknown terrain "${name}"`)
    const newName = patch.name ?? name
    if (newName !== name && this.state.terrainMap.has(newName)) {
      throw new Error(`Duplicate terrain "${newName}"`)
    }
    Object.assign(terrain, patch)
    if (newName !== name) {
      this.state.terrainMap.delete(name)
      this.state.terrainMap.set(newName, terrain)
      for (const cell of this.state.cellMap.values()) {
        if (cell.terrain === name) cell.terrain = newName
      }
    }
  }

  // Swaps the whole terrain palette for a freshly generated one. Cells and cards
  // referencing a terrain that no longer exists are cleared: such a cell drops
  // back to blank (a fill target), and a card's overwrite_terrain is unset.
  replaceTerrains(terrains: TerrainType[]): void {
    this.state.terrainMap.clear()
    for (const terrain of terrains) this.state.terrainMap.set(terrain.name, terrain)
    for (const cell of this.state.cellMap.values()) {
      if (cell.terrain !== BLANK_TERRAIN && !this.state.terrainMap.has(cell.terrain)) {
        cell.terrain = BLANK_TERRAIN
      }
    }
    for (const card of this.state.cardMap.values()) {
      if (card.overwrite_terrain != null && !this.state.terrainMap.has(card.overwrite_terrain)) {
        card.overwrite_terrain = undefined
      }
    }
  }

  removeTerrain(name: string): void {
    if (!this.state.terrainMap.has(name)) throw new Error(`Unknown terrain "${name}"`)
    for (const cell of this.state.cellMap.values()) {
      if (cell.terrain === name) {
        throw new Error(`Terrain "${name}" is in use; repaint those cells first`)
      }
    }
    this.state.terrainMap.delete(name)
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

  // Swaps the whole event pool for a freshly generated one. The old ids are gone,
  // so every reference to them is cleared: events placed on the map and cards'
  // overwrite_event_id.
  replaceEvents(events: GameEvent[]): void {
    this.state.eventMap.clear()
    for (const event of events) this.state.eventMap.set(event.id, event)
    for (const cell of this.state.cellMap.values()) cell.event_id = null
    for (const card of this.state.cardMap.values()) card.overwrite_event_id = null
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

  // Swaps the whole deck for a freshly generated one. Narrative cards carry their
  // own overwrite targets, so no cascade is needed here.
  replaceDeck(cards: Card[]): void {
    this.state.cardMap.clear()
    for (const card of cards) this.state.cardMap.set(card.id, card)
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

  // Returns the cell at coord, creating a blank one if absent. Used by the paint
  // and shape brushes, which both author wherever the author clicks.
  private upsertCell(coord: Coord): HexCell {
    const key = coordKey(coord)
    const existing = this.state.cellMap.get(key)
    if (existing) return existing
    const cell: HexCell = { q: coord.q, r: coord.r, terrain: BLANK_TERRAIN, event_id: null, is_revealed: false }
    this.state.cellMap.set(key, cell)
    return cell
  }

  private readonly state: ScenarioDraft
}
