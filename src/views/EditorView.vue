<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import HexGrid from '@/components/board/HexGrid.vue'
import { useNotificationStore } from '@/notifications/notificationStore'
import { isScenario, saveScenario } from '@/infrastructure/scenarioStorage'
import { loadOrCreateScenario } from '@/scenarioSource'
import {
  DEFAULT_PARAMS,
  generateScenario,
  type GeneratorParams,
} from '@/editor/scenarioGenerator'
import { recenterScenario } from '@/editor/mapTransforms'
import type { Scenario } from '@/engine/types/scenario'

const notifications = useNotificationStore()
const scenario = ref<Scenario | null>(null)
const jsonText = ref<string>('')

const params = reactive<GeneratorParams>({ ...DEFAULT_PARAMS })

onMounted(() => {
  const s = loadOrCreateScenario()
  setScenario(s)
})

function setScenario(s: Scenario): void {
  scenario.value = s
  jsonText.value = JSON.stringify(s, null, 2)
  params.deckSize = s.playerDeck.length
  params.narrativeCount = s.playerDeck.filter((c) => c.type === 'narrative').length
  params.eventCount = s.eventsData.length
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.floor(value)))
}

function onRegenerate(): void {
  const safe: GeneratorParams = {
    mapRadius: clamp(params.mapRadius, 1, 6),
    deckSize: clamp(params.deckSize, 3, 20),
    eventCount: clamp(params.eventCount, 1, 12),
    narrativeCount: clamp(params.narrativeCount, 0, clamp(params.deckSize, 3, 20)),
    seed: Math.floor(params.seed) || 1,
  }
  const generated = generateScenario(safe)
  saveScenario(generated)
  setScenario(generated)
  notifications.push('Scenario regenerated and saved.', 'info')
}

function onSaveJson(): void {
  try {
    const parsed = JSON.parse(jsonText.value) as unknown
    if (!isScenario(parsed)) {
      notifications.push('Invalid scenario: shape does not match the schema.', 'info')
      return
    }
    const centered = recenterScenario(parsed)
    saveScenario(centered)
    setScenario(centered)
    notifications.push('Scenario JSON saved.', 'info')
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error'
    notifications.push(`Invalid JSON: ${message}`, 'info')
  }
}

function onCenterMap(): void {
  if (!scenario.value) return
  const centered = recenterScenario(scenario.value)
  saveScenario(centered)
  setScenario(centered)
  notifications.push('Map recentered around (0,0) and saved.', 'info')
}

const previewCells = computed(() => scenario.value?.mapData.cells ?? [])
</script>

<template>
  <main class="editor-view">
    <header class="top-bar">
      <h1>Editor</h1>
      <nav>
        <RouterLink to="/game">Play</RouterLink>
      </nav>
    </header>

    <section class="form-card">
      <h2>Generate from sizes</h2>
      <div class="form-grid">
        <label>
          Map radius
          <input
            v-model.number="params.mapRadius"
            type="number"
            min="1"
            max="6"
            step="1"
          />
        </label>
        <label>
          Deck size
          <input
            v-model.number="params.deckSize"
            type="number"
            min="3"
            max="20"
            step="1"
          />
        </label>
        <label>
          Event count
          <input
            v-model.number="params.eventCount"
            type="number"
            min="1"
            max="12"
            step="1"
          />
        </label>
        <label>
          Narrative cards
          <input
            v-model.number="params.narrativeCount"
            type="number"
            min="0"
            :max="params.deckSize"
            step="1"
          />
        </label>
        <label>
          Seed
          <input v-model.number="params.seed" type="number" step="1" />
        </label>
      </div>
      <button type="button" class="primary" @click="onRegenerate">
        Regenerate &amp; Save
      </button>
    </section>

    <section class="split">
      <div class="json-pane">
        <h2>Scenario JSON</h2>
        <textarea v-model="jsonText" spellcheck="false" />
        <button type="button" class="primary" @click="onSaveJson">
          Save JSON
        </button>
      </div>
      <div class="preview-pane">
        <h2>Preview</h2>
        <div class="grid-wrapper">
          <HexGrid :cells="previewCells" />
        </div>
        <button type="button" class="primary" @click="onCenterMap">
          Center map
        </button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.editor-view {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  max-width: 1100px;
  margin: 0 auto;
}
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.top-bar h1 {
  margin: 0;
}
.form-card {
  border: 1px solid #aaa;
  padding: 1rem;
  border-radius: 6px;
  background: #fafafa;
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}
label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.9rem;
}
input[type='number'] {
  padding: 0.35rem;
  font-size: 1rem;
}
button.primary {
  background: #0033aa;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.95rem;
}
.split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.json-pane,
.preview-pane {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
textarea {
  font-family: ui-monospace, monospace;
  font-size: 0.8rem;
  min-height: 320px;
  padding: 0.5rem;
}
.grid-wrapper {
  border: 1px solid #ccc;
  background: #fdfdfa;
  border-radius: 6px;
  padding: 0.5rem;
  height: 360px;
}
</style>
