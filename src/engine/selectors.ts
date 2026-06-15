import type { GameState } from '@/engine/gameState'
import { neighbourCoordKeys } from '@/engine/hexGrid'

// Which hexes the player may move to from the current position. For now that is
// simply the adjacent cells that exist on the map; movement-restricting rules
// will layer in here later.
export function reachableCoordKeys(state: GameState): Set<string> {
  return neighbourCoordKeys(state.playerPosition, state.cells)
}
