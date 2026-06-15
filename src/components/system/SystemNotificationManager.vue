<script setup lang="ts">
import { useNotificationStore } from '@/notifications/notificationStore'

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
        <header class="notification-header">
          <span class="notification-eyebrow">{{
            notifications.current.kind === 'game-over' ? 'Journey\'s End'
            : notifications.current.kind === 'outcome' ? 'Outcome'
            : 'Notice'
          }}</span>
        </header>
        <p class="notification-text">{{ notifications.current.text }}</p>
        <button type="button" class="ok-button" @click="dismiss">Continue</button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.notification-overlay {
  position: fixed;
  inset: 0;
  background: rgba(10, 7, 3, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.notification-modal {
  background: linear-gradient(180deg, var(--st-parchment) 0%, var(--st-parchment-shade) 100%);
  border: 1px solid var(--st-parchment-border);
  border-radius: 12px;
  padding: 1.25rem 1.5rem 1rem;
  width: min(480px, 90vw);
  box-shadow:
    0 16px 48px rgba(40, 25, 5, 0.5),
    0 2px 4px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.7);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  animation: rise 200ms ease-out;
}
@keyframes rise {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
.notification-modal.kind-game-over {
  border-color: var(--st-danger);
  border-width: 2px;
  background: linear-gradient(180deg, var(--st-danger-bg) 0%, var(--st-danger-bg-shade) 100%);
}
.notification-modal.kind-outcome {
  border-left: 5px solid var(--st-wood-button-start);
}
.notification-header {
  display: flex;
  align-items: center;
}
.notification-eyebrow {
  font-size: 0.72rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--st-parchment-label);
  font-weight: 700;
}
.notification-modal.kind-game-over .notification-eyebrow {
  color: var(--st-danger);
}
.notification-text {
  margin: 0;
  font-size: 1.02rem;
  line-height: 1.45;
  color: var(--st-parchment-ink);
  font-family: Georgia, 'Iowan Old Style', serif;
}
.ok-button {
  align-self: flex-end;
  padding: 0.45rem 1.2rem;
  background: linear-gradient(180deg, var(--st-wood-button-start) 0%, var(--st-wood-button-end) 100%);
  color: var(--st-ink);
  border: 1px solid var(--st-wood-edge);
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(40, 20, 0, 0.4), inset 0 1px 0 rgba(255, 243, 200, 0.15);
  transition: filter 120ms ease, transform 80ms ease;
}
.ok-button:hover {
  filter: brightness(1.1);
}
.ok-button:active {
  transform: translateY(1px);
}
.notification-modal.kind-game-over .ok-button {
  background: linear-gradient(180deg, var(--st-danger) 0%, var(--st-danger-deep) 100%);
  border-color: var(--st-danger-edge);
}
</style>
