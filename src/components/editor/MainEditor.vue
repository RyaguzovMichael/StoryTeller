<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useScenarioEditor } from '@/editor/useScenarioEditor'
import { useNotificationStore } from '@/notifications/notificationStore'

const store = useScenarioEditor()
const notifications = useNotificationStore()

const meta = computed(() => store.draft.meta)
const resourceEntries = computed(() => Object.entries(meta.value.initialResources))

const draftResource = reactive({ key: '', value: 0 })

function setTitle(value: string): void {
  store.editor.setTitle(value)
}
function setInterval(value: number): void {
  store.editor.setInterval(value)
}
function setInitialHandSize(value: number): void {
  store.editor.setInitialHandSize(value)
}
function setDrawCount(value: number): void {
  store.editor.setDrawCount(value)
}
function setHandLimit(value: number): void {
  store.editor.setHandLimit(value)
}

// initial_resources is an open record (the engine treats resource names as data),
// so each row is an editable key/value pair the author can rename, retune or drop.
function setResourceValue(key: string, value: number): void {
  store.editor.setInitialResources({ ...meta.value.initialResources, [key]: value })
}
function renameResource(oldKey: string, newKey: string): void {
  const trimmed = newKey.trim()
  if (!trimmed || trimmed === oldKey) return
  if (trimmed in meta.value.initialResources) {
    notifications.push(`Resource "${trimmed}" already exists.`, 'info')
    return
  }
  // Rebuild from entries so the row keeps its position after a rename.
  const next: Record<string, number> = {}
  for (const [key, value] of Object.entries(meta.value.initialResources)) {
    next[key === oldKey ? trimmed : key] = value
  }
  store.editor.setInitialResources(next)
}
function removeResource(key: string): void {
  const next = { ...meta.value.initialResources }
  delete next[key]
  store.editor.setInitialResources(next)
}
function addResource(): void {
  const key = draftResource.key.trim()
  if (!key) return
  if (key in meta.value.initialResources) {
    notifications.push(`Resource "${key}" already exists.`, 'info')
    return
  }
  store.editor.setInitialResources({ ...meta.value.initialResources, [key]: draftResource.value })
  draftResource.key = ''
  draftResource.value = 0
}
</script>

<template>
  <div class="main-editor">
    <label class="field">
      <span>Title</span>
      <input type="text" :value="meta.title" @change="setTitle(($event.target as HTMLInputElement).value)" />
    </label>

    <fieldset class="resources">
      <legend>Initial resources</legend>
      <div v-for="[key, value] in resourceEntries" :key="key" class="resource-row">
        <input
          class="res-key" type="text" :value="key"
          @change="renameResource(key, ($event.target as HTMLInputElement).value)"
        />
        <input
          class="res-value" type="number" :value="value"
          @change="setResourceValue(key, Number(($event.target as HTMLInputElement).value))"
        />
        <button type="button" class="danger" @click="removeResource(key)">Delete</button>
      </div>
      <form class="add-row" @submit.prevent="addResource">
        <input v-model="draftResource.key" type="text" placeholder="name" />
        <input v-model.number="draftResource.value" type="number" />
        <button type="submit" class="primary">Add resource</button>
      </form>
    </fieldset>

    <div class="numbers">
      <label class="field">
        <span>Narrative intervention interval</span>
        <input
          type="number" min="1" :value="meta.narrativeInterventionInterval"
          @change="setInterval(Number(($event.target as HTMLInputElement).value))"
        />
      </label>
      <label class="field">
        <span>Initial hand size</span>
        <input
          type="number" min="0" :value="meta.initialHandSize"
          @change="setInitialHandSize(Number(($event.target as HTMLInputElement).value))"
        />
      </label>
      <label class="field">
        <span>Draw cards per turn</span>
        <input
          type="number" min="0" :value="meta.drawCardCountPerTurn"
          @change="setDrawCount(Number(($event.target as HTMLInputElement).value))"
        />
      </label>
      <label class="field">
        <span>Hand limit</span>
        <input
          type="number" min="0" :value="meta.handLimit"
          @change="setHandLimit(Number(($event.target as HTMLInputElement).value))"
        />
      </label>
    </div>
  </div>
</template>

<style scoped>
.main-editor {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 560px;
  color: var(--st-ink);
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.85rem;
}
.resources {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  border: 1px solid var(--st-wood-border);
  border-radius: 6px;
  padding: 0.5rem 0.75rem 0.75rem;
}
legend {
  font-size: 0.8rem;
  color: var(--st-gold);
  padding: 0 0.3rem;
}
.resource-row,
.add-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
.res-key {
  flex: 1;
}
.res-value,
.add-row input[type='number'] {
  width: 6rem;
}
.add-row {
  margin-top: 0.3rem;
}
.add-row input[type='text'] {
  flex: 1;
}
.numbers {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
}
input {
  padding: 0.3rem;
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
  padding: 0.35rem 0.7rem;
  cursor: pointer;
}
button.primary {
  background: linear-gradient(180deg, var(--st-wood-button-start) 0%, var(--st-wood-button-end) 100%);
  color: var(--st-ink);
  border: 1px solid var(--st-wood-edge);
}
button.danger {
  color: var(--st-danger-ink);
}
</style>
