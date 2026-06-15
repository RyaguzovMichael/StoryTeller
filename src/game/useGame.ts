// Thin Vue/Pinia wrapper around the pure GameEngine. Its ONLY job is to be a
// reactive state provider: it holds `reactive(state)`, hands it to the engine,
// and exposes the engine handle + derived values. It contains no game actions
// and no side effects — callers drive the game through `game.engine.*`, and
// side effects are handled by observers (game/useGameEffects.ts,
// game/useEndGameManager.ts). Do not add actions here.
import { computed, markRaw, reactive, type ComputedRef } from 'vue'
import { defineStore } from 'pinia'
import { GameEngine } from '@/engine/gameEngine'
import { createEmptyState } from '@/engine/gameState'
import { reachableCoordKeys } from '@/engine/selectors'

// Expose each state field as a read-only computed: reassigning `game.hand = ...`
// becomes a type error (the engine is the sole writer), while element types stay
// mutable so component props that read them need no readonly ceremony.
type ReadonlyRefs<T> = { readonly [K in keyof T]: ComputedRef<T[K]> }
function readonlyRefs<T extends object>(source: T): ReadonlyRefs<T> {
  const refs = {} as { [K in keyof T]: ComputedRef<T[K]> }
  for (const key of Object.keys(source) as (keyof T)[]) {
    refs[key] = computed(() => source[key])
  }
  return refs
}

export const useGame = defineStore('game', () => {
  const state = reactive(createEmptyState())
  // markRaw: reactivity comes from `state`, not from the engine instance itself,
  // so we keep Vue from wrapping the class in a proxy. The engine keeps the
  // writable `state`; consumers only get read-only projections.
  const engine = markRaw(new GameEngine(state))
  const reachable = computed(() => reachableCoordKeys(state))

  return {
    ...readonlyRefs(state),
    engine,
    reachable,
  }
})
