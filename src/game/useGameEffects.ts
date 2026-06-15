// Observer: subscribes to engine events and performs the host-side work the pure
// engine deliberately refuses to do — notifications and persistence. This is
// where every game side effect lives, so the engine and the useGame wrapper stay
// free of them.
import { onScopeDispose } from 'vue'
import { useGame } from '@/game/useGame'
import { useNotificationStore } from '@/notifications/notificationStore'
import { saveGame } from '@/infrastructure/storage'

export function useGameEffects(): void {
  const game = useGame()
  const notifications = useNotificationStore()

  const unsubscribe = game.engine.onEvent((event) => {
    switch (event.kind) {
      case 'outcome':
        notifications.push(event.text, 'outcome')
        break
      case 'game-over':
        notifications.push(`Game over: ${event.reason}.`, 'game-over')
        break
      case 'persist':
        saveGame(event.state)
        break
    }
  })

  onScopeDispose(unsubscribe)
}
