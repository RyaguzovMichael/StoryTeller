<script setup lang="ts">
import { useNotificationStore } from '@/stores/notificationStore'

const notifications = useNotificationStore()

function dismiss(): void {
  notifications.dismiss()
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="notifications.current"
      class="notification-overlay"
      role="dialog"
      aria-modal="true"
    >
      <div class="notification-modal" :class="`kind-${notifications.current.kind}`">
        <p class="notification-text">{{ notifications.current.text }}</p>
        <button type="button" class="ok-button" @click="dismiss">OK</button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.notification-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.notification-modal {
  background: #fff;
  border-radius: 8px;
  padding: 1.25rem 1.5rem;
  max-width: 480px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.notification-modal.kind-game-over {
  border: 3px solid #aa0000;
  background: #fff0f0;
}
.notification-modal.kind-outcome {
  border-left: 6px solid #0033aa;
}
.notification-text {
  margin: 0;
  font-size: 1rem;
  line-height: 1.4;
}
.ok-button {
  align-self: flex-end;
  padding: 0.4rem 1rem;
  background: #0033aa;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>
