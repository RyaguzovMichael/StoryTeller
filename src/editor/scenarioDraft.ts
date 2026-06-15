import type { Card, GameEvent, HexCell, Scenario, TerrainType } from '@/engine/types/scenario'
import { coordKey, type Coord } from '@/engine/hexGrid'

// Reserved terrain marking a "blank" cell: playable (part of the authored shape)
// but with no terrain chosen yet, so generation may fill it. Blank cells live
// only in the draft — toScenario() drops them, so the exported Scenario never
// carries this sentinel.
export const BLANK_TERRAIN = ''

// A single problem found by validate(). Non-fatal: surfaced in the UI rather
// than thrown, so an author can keep editing a temporarily-invalid scenario.
export interface ValidationIssue {
  code: string
  message: string
}

// The scenario fields that are not the map / event pool / deck collections.
export interface ScenarioMeta {
  id: string
  title: string
  initialResources: Record<string, number>
  startingPosition: Coord
  narrativeInterventionInterval: number
  initialHandSize: number
  drawCardCountPerTurn: number
  handLimit: number
}

// Editor-side domain model of an authored scenario: the counterpart of the
// engine's GameState. Holds cells/events/cards in Maps (keyed by coordKey / id)
// for O(1) lookup during interactive editing, and serializes back to the plain
// `Scenario` JSON contract via toScenario().
//
// ScenarioEditor is its sole writer: the maps and `meta` below are open for the
// editor to mutate (mirroring GameState's open fields), while everything else
// reads through cellAt / cells / events / deck. Uniqueness of coords and ids is
// guaranteed structurally by the Maps; validate() reports only the referential
// and numeric invariants the Map structure cannot enforce.
export class ScenarioDraft {
  readonly terrainMap: Map<string, TerrainType>
  readonly cellMap: Map<string, HexCell>
  readonly eventMap: Map<string, GameEvent>
  readonly cardMap: Map<string, Card>
  readonly meta: ScenarioMeta

  static from(scenario: Scenario): ScenarioDraft {
    // Deep clone so the draft never shares references with the source scenario.
    const clone = JSON.parse(JSON.stringify(scenario)) as Scenario
    const terrainMap = new Map<string, TerrainType>()
    for (const terrain of clone.terrains) terrainMap.set(terrain.name, terrain)
    const cellMap = new Map<string, HexCell>()
    for (const cell of clone.mapData.cells) cellMap.set(coordKey(cell), cell)
    const eventMap = new Map<string, GameEvent>()
    for (const event of clone.eventsData) eventMap.set(event.id, event)
    const cardMap = new Map<string, Card>()
    for (const card of clone.playerDeck) cardMap.set(card.id, card)
    return new ScenarioDraft(terrainMap, cellMap, eventMap, cardMap, {
      id: clone.id,
      title: clone.metadata.title,
      initialResources: clone.initial_resources,
      startingPosition: clone.starting_position,
      narrativeInterventionInterval: clone.narrative_intervention_interval,
      initialHandSize: clone.initial_hand_size,
      drawCardCountPerTurn: clone.draw_card_count_per_turn,
      handLimit: clone.hand_limit,
    })
  }

  toScenario(): Scenario {
    return {
      id: this.meta.id,
      metadata: { title: this.meta.title },
      terrains: [...this.terrainMap.values()],
      // Blank cells are an editor-only authoring state; only authored cells ship.
      mapData: { cells: [...this.cellMap.values()].filter((cell) => cell.terrain !== BLANK_TERRAIN) },
      eventsData: [...this.eventMap.values()],
      playerDeck: [...this.cardMap.values()],
      initial_resources: this.meta.initialResources,
      starting_position: this.meta.startingPosition,
      narrative_intervention_interval: this.meta.narrativeInterventionInterval,
      initial_hand_size: this.meta.initialHandSize,
      draw_card_count_per_turn: this.meta.drawCardCountPerTurn,
      hand_limit: this.meta.handLimit,
    }
  }

  cellAt(coord: Coord): HexCell | undefined {
    return this.cellMap.get(coordKey(coord))
  }

  get terrains(): readonly TerrainType[] {
    return [...this.terrainMap.values()]
  }

  get cells(): readonly HexCell[] {
    return [...this.cellMap.values()]
  }

  get events(): readonly GameEvent[] {
    return [...this.eventMap.values()]
  }

  get deck(): readonly Card[] {
    return [...this.cardMap.values()]
  }

  validate(): ValidationIssue[] {
    const issues: ValidationIssue[] = []

    if (!this.cellMap.has(coordKey(this.meta.startingPosition))) {
      issues.push({
        code: 'start-off-map',
        message: 'Starting position is not on any map cell.',
      })
    }

    let blankCount = 0
    for (const cell of this.cellMap.values()) {
      if (cell.terrain === BLANK_TERRAIN) {
        blankCount++
      } else if (!this.terrainMap.has(cell.terrain)) {
        issues.push({
          code: 'dangling-cell-terrain',
          message: `Cell (${cell.q},${cell.r}) references missing terrain "${cell.terrain}".`,
        })
      }
      if (cell.event_id !== null && !this.eventMap.has(cell.event_id)) {
        issues.push({
          code: 'dangling-cell-event',
          message: `Cell (${cell.q},${cell.r}) references missing event "${cell.event_id}".`,
        })
      }
    }

    if (blankCount > 0) {
      issues.push({
        code: 'unfilled-blank-cell',
        message: `${blankCount} playable cell(s) have no terrain yet; fill or remove them.`,
      })
    }

    for (const card of this.cardMap.values()) {
      const ref = card.overwrite_event_id
      if (ref != null && !this.eventMap.has(ref)) {
        issues.push({
          code: 'dangling-card-event',
          message: `Card "${card.id}" references missing event "${ref}".`,
        })
      }
    }

    if (this.meta.narrativeInterventionInterval < 1) {
      issues.push({
        code: 'interval-too-small',
        message: 'Narrative intervention interval must be at least 1.',
      })
    }

    if (this.meta.initialHandSize > this.cardMap.size) {
      issues.push({
        code: 'hand-size-too-large',
        message: 'Initial hand size is larger than the deck.',
      })
    }

    return issues
  }

  private constructor(
    terrainMap: Map<string, TerrainType>,
    cellMap: Map<string, HexCell>,
    eventMap: Map<string, GameEvent>,
    cardMap: Map<string, Card>,
    meta: ScenarioMeta,
  ) {
    this.terrainMap = terrainMap
    this.cellMap = cellMap
    this.eventMap = eventMap
    this.cardMap = cardMap
    this.meta = meta
  }
}
