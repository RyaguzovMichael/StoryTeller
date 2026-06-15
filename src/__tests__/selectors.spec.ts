import { describe, it, expect } from 'vitest'

import { reachableCoordKeys } from '@/engine/selectors'
import { createEmptyState } from '@/engine/gameState'
import type { GameState } from '@/engine/gameState'
import type { HexCell } from '@/engine/types/scenario'

function cell(q: number, r: number): HexCell {
  return { q, r, terrain: 'plains', event_id: null, is_revealed: false }
}

function stateWith(position: { q: number; r: number }, cells: HexCell[]): GameState {
  const state = createEmptyState()
  state.playerPosition = position
  state.cells = cells
  return state
}

describe('reachableCoordKeys', () => {
  it('returns adjacent cells that exist on the map', () => {
    const state = stateWith({ q: 0, r: 0 }, [
      cell(0, 0),
      cell(1, 0),
      cell(0, 1),
      cell(3, 3),
    ])
    expect(reachableCoordKeys(state)).toEqual(new Set(['1,0', '0,1']))
  })

  it('is empty when no adjacent cell exists', () => {
    const state = stateWith({ q: 0, r: 0 }, [cell(0, 0), cell(5, 5)])
    expect(reachableCoordKeys(state)).toEqual(new Set())
  })
})
