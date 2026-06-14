// Thin Vue/Pinia wrapper around the pure GameEngine. Its ONLY job is to be a
// reactive state provider: it holds `reactive(state)`, hands it to the engine,
// and exposes the engine handle + derived values. It contains no game actions
// and no side effects — callers drive the game through `game.engine.*`, and
// side effects are handled by observers (game/useGameEffects.ts,
// game/useEndGameManager.ts). Do not add actions here.
import { markRaw, reactive, toRefs } from 'vue'
import { defineStore } from 'pinia'
import { GameEngine } from '@/engine/gameEngine'
import { createEmptyState } from '@/engine/types/gameState/gameState'

export const useGame = defineStore('game', () => {
  const state = reactive(createEmptyState())
  // markRaw: reactivity comes from `state`, not from the engine instance itself,
  // so we keep Vue from wrapping the class in a proxy.
  const engine = markRaw(new GameEngine(state))

  return {
    ...toRefs(state),
    engine,
  }
})
