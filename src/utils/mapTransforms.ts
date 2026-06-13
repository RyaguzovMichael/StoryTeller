// Scenario-level map transforms. Kept separate from storage.ts (persistence) and
// from hexGrid.ts (pure coordinate math): this layer knows the Scenario shape and
// composes coordinate math into edits an author performs on a whole scenario.
import type { HexCell, Scenario } from '@/types/scenario'
import { recenterCoords } from './hexGrid'

// Recenters the map around (0,0) so absolute coordinates stay small. The starting
// position is recentered together with the cells, so it shifts by the same amount
// and keeps pointing at the same cell.
export function recenterScenario(scenario: Scenario): Scenario {
  const recentered = recenterCoords([scenario.starting_position, ...scenario.mapData.cells])
  const startingPosition = recentered[0] ?? scenario.starting_position
  const cells = recentered.slice(1) as HexCell[]
  return {
    ...scenario,
    mapData: { ...scenario.mapData, cells },
    starting_position: { q: startingPosition.q, r: startingPosition.r },
  }
}
