<script setup lang="ts">
import { ref } from 'vue'
import { isScenario } from '@/infrastructure/scenarioStorage'
import { useScenarioEditor } from '@/editor/useScenarioEditor'
import { useNotificationStore } from '@/notifications/notificationStore'

const store = useScenarioEditor()
const notifications = useNotificationStore()

const open = ref(false)
const text = ref('')

function syncFromEditor(): void {
  text.value = JSON.stringify(store.draft.toScenario(), null, 2)
}

function onToggle(): void {
  open.value = !open.value
  if (open.value) syncFromEditor()
}

function onApply(): void {
  try {
    const parsed = JSON.parse(text.value) as unknown
    if (!isScenario(parsed)) {
      notifications.push('Invalid scenario: shape does not match the schema.', 'info')
      return
    }
    store.load(parsed)
    store.save()
    notifications.push('Scenario loaded from JSON and saved.', 'info')
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error'
    notifications.push(`Invalid JSON: ${message}`, 'info')
  }
}
</script>

<template>
  <section class="drawer">
    <button type="button" class="drawer-toggle" @click="onToggle">
      {{ open ? '▾' : '▸' }} Raw JSON
    </button>
    <div v-if="open" class="drawer-body">
      <textarea v-model="text" spellcheck="false" />
      <div class="actions">
        <button type="button" @click="syncFromEditor">Refresh from editor</button>
        <button type="button" class="primary" @click="onApply">Apply JSON</button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.drawer {
  border-top: 1px solid #ccc;
  background: #fafafa;
}
.drawer-toggle {
  width: 100%;
  text-align: left;
  padding: 0.5rem 0.75rem;
  border: none;
  background: #f0f0f0;
  cursor: pointer;
  font-size: 0.9rem;
}
.drawer-body {
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
textarea {
  font-family: ui-monospace, monospace;
  font-size: 0.78rem;
  min-height: 240px;
  padding: 0.5rem;
}
.actions {
  display: flex;
  gap: 0.5rem;
}
button {
  border: 1px solid #ccc;
  border-radius: 4px;
  background: white;
  padding: 0.4rem 0.8rem;
  cursor: pointer;
}
button.primary {
  background: #0033aa;
  color: white;
  border: none;
}
</style>
