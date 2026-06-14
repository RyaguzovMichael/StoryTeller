// Observer: drains the engine's effect queue and performs the host-side work the
// pure engine deliberately refuses to do — notifications and persistence. This
// is where every game side effect lives, so the engine and the useGame wrapper
// stay free of them.
import { watch } from 'vue'
import { useGame } from '@/game/useGame'
import { useNotificationStore } from '@/notifications/notificationStore'
import { saveGame } from '@/infrastructure/storage'

export function useGameEffects(): void {
  const game = useGame()
  const notifications = useNotificationStore()

  watch(
    () => game.effects.length,
    (length) => {
      if (length === 0) return
      for (const effect of game.engine.drainEffects()) {
        switch (effect.kind) {
          case 'outcome':
            notifications.push(effect.text, 'outcome')
            break
          case 'game-over':
            notifications.push(`Game over: ${effect.reason}.`, 'game-over')
            break
          case 'reset':
            notifications.clear()
            break
        }
      }
      // Any drained effect means the state changed — persist the new snapshot.
      saveGame(game.engine.snapshot())
    },
  )
}
