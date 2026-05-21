import { watch } from 'vue'
import { useGameStore } from '@/stores/gameStore'

export function useEndGameManager(): void {
  const store = useGameStore()
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
