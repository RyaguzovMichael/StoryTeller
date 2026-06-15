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

function onNewCanvas(): void {
  const deckSize = clamp(params.deckSize, 3, 20)
  store.newCanvas({
    mapWidth: clamp(params.mapWidth, 1, 20),
    mapHeight: clamp(params.mapHeight, 1, 20),
    deckSize,
    eventCount: clamp(params.eventCount, 1, 12),
    narrativeCount: clamp(params.narrativeCount, 0, deckSize),
    seed: Math.floor(params.seed) || 1,
  })
  notifications.push('New blank canvas created and saved.', 'info')
}

function onFillCells(): void {
  store.fillCells()
  notifications.push('Blank cells filled with terrain.', 'info')
}

function onRegenerateEvents(): void {
  store.regenerateEvents(clamp(params.eventCount, 1, 12))
  notifications.push('Event pool regenerated; map events cleared.', 'info')
}
</script>

<template>
  <section class="drawer">
    <button type="button" class="drawer-toggle" @click="open = !open">
      {{ open ? '▾' : '▸' }} Generate
    </button>
    <div v-if="open" class="drawer-body">
      <fieldset>
        <legend>New canvas</legend>
        <div class="form-grid">
          <label>Width<input v-model.number="params.mapWidth" type="number" min="1" max="20" step="1" /></label>
          <label>Height<input v-model.number="params.mapHeight" type="number" min="1" max="20" step="1" /></label>
          <label>Deck size<input v-model.number="params.deckSize" type="number" min="3" max="20" step="1" /></label>
          <label>Narrative cards<input v-model.number="params.narrativeCount" type="number" min="0" :max="params.deckSize" step="1" /></label>
          <label>Seed<input v-model.number="params.seed" type="number" step="1" /></label>
        </div>
        <button type="button" class="primary" @click="onNewCanvas">Create blank canvas</button>
        <p class="note">Replaces the whole scenario with an empty W×H canvas.</p>
      </fieldset>

      <fieldset>
        <legend>Fill &amp; events</legend>
        <button type="button" @click="onFillCells">Fill blank cells</button>
        <div class="event-row">
          <label>Event count<input v-model.number="params.eventCount" type="number" min="1" max="12" step="1" /></label>
          <button type="button" @click="onRegenerateEvents">Regenerate events</button>
        </div>
        <p class="note">Fill assigns terrain to blank cells only. Regenerating events clears all events placed on the map.</p>
      </fieldset>
    </div>
  </section>
</template>

<style scoped>
.drawer {
  border-top: 1px solid var(--st-wood-border);
  background: var(--st-wood);
  color: var(--st-ink);
}
.drawer-toggle {
  width: 100%;
  text-align: left;
  padding: 0.5rem 0.75rem;
  border: none;
  background: var(--st-wood-darkest);
  color: var(--st-gold);
  cursor: pointer;
  font-size: 0.9rem;
}
.drawer-body {
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
fieldset {
  border: 1px solid var(--st-wood-border);
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
}
legend {
  font-size: 0.8rem;
  color: var(--st-gold);
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
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
  background: var(--st-parchment);
  color: var(--st-parchment-ink);
  border: 1px solid var(--st-parchment-border);
  border-radius: 4px;
}
.event-row {
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
}
.event-row label {
  width: 7rem;
}
button {
  align-self: flex-start;
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
.note {
  margin: 0;
  font-size: 0.78rem;
  color: var(--st-gold-muted);
}
</style>
