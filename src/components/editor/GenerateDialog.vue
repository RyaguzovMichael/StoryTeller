<script setup lang="ts">
import { reactive } from 'vue'
import { DEFAULT_GEN } from '@/editor/scenarioGenerator'
import { useScenarioEditor } from '@/editor/useScenarioEditor'
import { useNotificationStore } from '@/notifications/notificationStore'

const emit = defineEmits<{ (e: 'close'): void }>()

const store = useScenarioEditor()
const notifications = useNotificationStore()

const form = reactive({
  ...DEFAULT_GEN,
  regenerateTerrains: true,
  regenerateEvents: true,
  regenerateDeck: true,
})

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.floor(value)))
}

function onGenerate(): void {
  const deckSize = clamp(form.deckSize, 1, 40)
  store.regenerateContent({
    terrainCount: clamp(form.terrainCount, 1, 5),
    eventCount: clamp(form.eventCount, 1, 20),
    deckSize,
    narrativeCount: clamp(form.narrativeCount, 0, deckSize),
    regenerateTerrains: form.regenerateTerrains,
    regenerateEvents: form.regenerateEvents,
    regenerateDeck: form.regenerateDeck,
  })
  notifications.push('Content regenerated.', 'info')
  emit('close')
}
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="dialog" role="dialog" aria-modal="true">
      <h2>Regenerate content</h2>
      <div class="form-grid">
        <label>Terrain types<input v-model.number="form.terrainCount" type="number" min="1" max="5" /></label>
        <label>Event count<input v-model.number="form.eventCount" type="number" min="1" max="20" /></label>
        <label>Deck size<input v-model.number="form.deckSize" type="number" min="1" max="40" /></label>
        <label>Narrative cards<input v-model.number="form.narrativeCount" type="number" min="0" :max="form.deckSize" /></label>
      </div>
      <label class="check"><input v-model="form.regenerateTerrains" type="checkbox" /> Regenerate terrains</label>
      <label class="check"><input v-model="form.regenerateEvents" type="checkbox" /> Regenerate events</label>
      <label class="check"><input v-model="form.regenerateDeck" type="checkbox" /> Regenerate deck</label>
      <p class="note">Regenerating terrains drops cells painted with a removed terrain back to blank; regenerating events clears events already placed on the map.</p>
      <div class="actions">
        <button type="button" @click="emit('close')">Cancel</button>
        <button type="button" class="primary" @click="onGenerate">Generate</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}
.dialog {
  width: min(420px, 90vw);
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 1rem 1.25rem;
  background: var(--st-wood);
  color: var(--st-ink);
  border: 1px solid var(--st-wood-edge);
  border-radius: 8px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
}
h2 {
  margin: 0;
  font-size: 1rem;
  color: var(--st-gold);
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  gap: 0.5rem;
}
label {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  font-size: 0.85rem;
}
.check {
  flex-direction: row;
  align-items: center;
  gap: 0.4rem;
}
input[type='number'] {
  padding: 0.3rem;
  background: var(--st-parchment);
  color: var(--st-parchment-ink);
  border: 1px solid var(--st-parchment-border);
  border-radius: 4px;
}
.note {
  margin: 0;
  font-size: 0.78rem;
  color: var(--st-gold-muted);
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.25rem;
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
