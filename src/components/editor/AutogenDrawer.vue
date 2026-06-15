<script setup lang="ts">
import { reactive, ref } from 'vue'
import { DEFAULT_PARAMS, type GeneratorParams } from '@/editor/scenarioGenerator'
import { useScenarioEditor } from '@/editor/useScenarioEditor'
import { useNotificationStore } from '@/notifications/notificationStore'

const store = useScenarioEditor()
const notifications = useNotificationStore()

const open = ref(false)
const params = reactive<GeneratorParams>({ ...DEFAULT_PARAMS })

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.floor(value)))
}

function onRegenerate(): void {
  const deckSize = clamp(params.deckSize, 3, 20)
  store.regenerate({
    mapWidth: clamp(params.mapWidth, 1, 20),
    mapHeight: clamp(params.mapHeight, 1, 20),
    deckSize,
    eventCount: clamp(params.eventCount, 1, 12),
    narrativeCount: clamp(params.narrativeCount, 0, deckSize),
    seed: Math.floor(params.seed) || 1,
  })
  notifications.push('Scenario regenerated and saved.', 'info')
}
</script>

<template>
  <section class="drawer">
    <button type="button" class="drawer-toggle" @click="open = !open">
      {{ open ? '▾' : '▸' }} Autogenerate
    </button>
    <div v-if="open" class="drawer-body">
      <div class="form-grid">
        <label>Map width<input v-model.number="params.mapWidth" type="number" min="1" max="20" step="1" /></label>
        <label>Map height<input v-model.number="params.mapHeight" type="number" min="1" max="20" step="1" /></label>
        <label>Deck size<input v-model.number="params.deckSize" type="number" min="3" max="20" step="1" /></label>
        <label>Event count<input v-model.number="params.eventCount" type="number" min="1" max="12" step="1" /></label>
        <label>Narrative cards<input v-model.number="params.narrativeCount" type="number" min="0" :max="params.deckSize" step="1" /></label>
        <label>Seed<input v-model.number="params.seed" type="number" step="1" /></label>
      </div>
      <button type="button" class="primary" @click="onRegenerate">Regenerate &amp; Save</button>
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
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.5rem;
}
label {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  font-size: 0.85rem;
}
input {
  padding: 0.3rem;
  font-size: 0.95rem;
}
button.primary {
  align-self: flex-start;
  background: #0033aa;
  color: white;
  border: none;
  padding: 0.45rem 0.9rem;
  border-radius: 4px;
  cursor: pointer;
}
</style>
