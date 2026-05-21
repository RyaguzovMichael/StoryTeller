import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { NotificationKind, SystemNotification } from '@/types/gameState'

export const useNotificationStore = defineStore('notifications', () => {
  const queue = ref<SystemNotification[]>([])
  let counter = 0

  const current = computed<SystemNotification | null>(() => queue.value[0] ?? null)
  const hasNotifications = computed(() => queue.value.length > 0)

  function push(text: string, kind: NotificationKind = 'info'): void {
    counter += 1
    queue.value.push({ id: `n-${counter}`, text, kind })
  }

  function dismiss(): void {
    queue.value.shift()
  }

  function clear(): void {
    queue.value = []
  }

  return { queue, current, hasNotifications, push, dismiss, clear }
})
