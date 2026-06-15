import type { Card, GameEvent, HexCell, Scenario } from '@/engine/types/scenario'
import type { Coord } from '@/engine/hexGrid'

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
// `Scenario` JSON contract via toScenario(). ScenarioEditor is its sole writer.
export class ScenarioDraft {
  static from(_scenario: Scenario): ScenarioDraft {
    throw new Error('not implemented')
  }

  toScenario(): Scenario {
    throw new Error('not implemented')
  }

  cellAt(_coord: Coord): HexCell | undefined {
    throw new Error('not implemented')
  }

  get cells(): readonly HexCell[] {
    throw new Error('not implemented')
  }

  get events(): readonly GameEvent[] {
    throw new Error('not implemented')
  }

  get deck(): readonly Card[] {
    throw new Error('not implemented')
  }

  get meta(): ScenarioMeta {
    throw new Error('not implemented')
  }

  validate(): ValidationIssue[] {
    throw new Error('not implemented')
  }
}
