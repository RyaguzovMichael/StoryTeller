<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { isScenario } from '@/infrastructure/scenarioStorage'
import { useScenarioEditor } from '@/editor/useScenarioEditor'
import { useNotificationStore } from '@/notifications/notificationStore'

const store = useScenarioEditor()
const notifications = useNotificationStore()

const text = ref('')

function syncFromEditor(): void {
  text.value = JSON.stringify(store.draft.toScenario(), null, 2)
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

onMounted(syncFromEditor)
</script>

<template>
  <section class="json-tab">
    <div class="actions">
      <button type="button" @click="syncFromEditor">Refresh from editor</button>
      <button type="button" class="primary" @click="onApply">Apply JSON</button>
    </div>
    <textarea v-model="text" spellcheck="false" />
  </section>
</template>

<style scoped>
.json-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--st-wood-dark);
  color: var(--st-ink);
}
.actions {
  display: flex;
  gap: 0.5rem;
}
textarea {
  flex: 1;
  min-height: 0;
  resize: none;
  font-family: ui-monospace, monospace;
  font-size: 0.82rem;
  padding: 0.75rem;
  background: var(--st-parchment);
  color: var(--st-parchment-ink);
  border: 1px solid var(--st-parchment-border);
  border-radius: 4px;
}
button {
  border: 1px solid var(--st-wood-border);
  border-radius: 4px;
  background: var(--st-wood-darkest);
  color: var(--st-ink);
  padding: 0.4rem 0.9rem;
  cursor: pointer;
}
button.primary {
  background: linear-gradient(180deg, var(--st-wood-button-start) 0%, var(--st-wood-button-end) 100%);
  color: var(--st-ink);
  border: 1px solid var(--st-wood-edge);
}
</style>
