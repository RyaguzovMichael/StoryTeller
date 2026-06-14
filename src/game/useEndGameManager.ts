// Observer: watches resources and ends the game when any vital resource is
// depleted. Triggers the rule on the engine; the resulting notification is
// produced by the effect observer (game/useGameEffects.ts).
import { watch } from 'vue'
import { useGame } from '@/game/useGame'

export function useEndGameManager(): void {
  const game = useGame()
  watch(
    () => Object.values(game.resources),
    (values) => {
      if (game.isGameOver) return
      if (values.some((value) => value <= 0)) {
        game.engine.endGame('a vital resource was depleted')
      }
    },
    { deep: true },
  )
}
