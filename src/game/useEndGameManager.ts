import { watch } from 'vue'
import { useGameEngine } from '@/engine/gameEngine'

export function useEndGameManager(): void {
  const store = useGameEngine()
  watch(
    () => Object.values(store.resources),
    (vals) => {
      if (store.phase === 'game-over') return
      if (vals.some((v) => v <= 0)) {
        store.endGame('a vital resource was depleted')
      }
    },
    { deep: true },
  )
}
