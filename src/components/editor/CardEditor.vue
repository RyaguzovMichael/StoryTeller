<script setup lang="ts">
import { reactive } from 'vue'
import { useScenarioEditor } from '@/editor/useScenarioEditor'
import { useNotificationStore } from '@/notifications/notificationStore'
import type { CardType } from '@/engine/types/scenario'

const store = useScenarioEditor()
const notifications = useNotificationStore()

const draftNew = reactive<{ id: string; text: string; type: CardType; weight: number }>({
  id: '',
  text: '',
  type: 'standard',
  weight: 1,
})

function guard(action: () => void): void {
  try {
    action()
  } catch (err) {
    notifications.push(err instanceof Error ? err.message : 'Edit failed', 'info')
  }
}

function setText(id: string, text: string): void {
  store.editor.updateCard(id, { text })
}
function setType(id: string, type: CardType): void {
  store.editor.updateCard(id, { type })
}
function setWeight(id: string, weight: number): void {
  store.editor.updateCard(id, { weight })
}
function setOverwriteTerrain(id: string, value: string): void {
  store.editor.updateCard(id, { overwrite_terrain: value || undefined })
}
function setOverwriteEvent(id: string, value: string): void {
  store.editor.updateCard(id, { overwrite_event_id: value || null })
}
function remove(id: string): void {
  guard(() => store.editor.removeCard(id))
}
function add(): void {
  if (!draftNew.id) return
  guard(() => {
    store.editor.addCard({
      id: draftNew.id,
      text: draftNew.text,
      type: draftNew.type,
      weight: draftNew.weight,
    })
    draftNew.id = ''
    draftNew.text = ''
    draftNew.type = 'standard'
    draftNew.weight = 1
  })
}
</script>

<template>
  <div class="editor-list">
    <div v-for="card in store.draft.deck" :key="card.id" class="card-row">
      <div class="row-head">
        <strong>{{ card.id }}</strong>
        <select :value="card.type" @change="setType(card.id, ($event.target as HTMLSelectElement).value as CardType)">
          <option value="standard">standard</option>
          <option value="narrative">narrative</option>
        </select>
        <label>weight <input type="number" :value="card.weight" @change="setWeight(card.id, Number(($event.target as HTMLInputElement).value))" /></label>
        <button type="button" class="danger" @click="remove(card.id)">Delete</button>
      </div>
      <input class="text" type="text" :value="card.text" @change="setText(card.id, ($event.target as HTMLInputElement).value)" />
      <div v-if="card.type === 'narrative'" class="overwrites">
        <label>
          terrain →
          <select :value="card.overwrite_terrain ?? ''" @change="setOverwriteTerrain(card.id, ($event.target as HTMLSelectElement).value)">
            <option value="">(none)</option>
            <option v-for="t in store.draft.terrains" :key="t.name" :value="t.name">{{ t.name }}</option>
          </select>
        </label>
        <label>
          event →
          <select :value="card.overwrite_event_id ?? ''" @change="setOverwriteEvent(card.id, ($event.target as HTMLSelectElement).value)">
            <option value="">(none)</option>
            <option v-for="e in store.draft.events" :key="e.id" :value="e.id">{{ e.id }}</option>
          </select>
        </label>
      </div>
    </div>

    <form class="add-row" @submit.prevent="add">
      <input v-model="draftNew.id" type="text" placeholder="id" />
      <input v-model="draftNew.text" type="text" placeholder="text" />
      <select v-model="draftNew.type">
        <option value="standard">standard</option>
        <option value="narrative">narrative</option>
      </select>
      <input v-model.number="draftNew.weight" type="number" />
      <button type="submit" class="primary">Add card</button>
    </form>
  </div>
</template>

<style scoped>
.editor-list {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  color: var(--st-ink);
}
.card-row {
  border: 1px solid var(--st-wood-border);
  background: var(--st-wood);
  border-radius: 6px;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  max-width: 640px;
}
.row-head {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.row-head label {
  font-size: 0.85rem;
}
.row-head input[type='number'] {
  width: 4rem;
}
.text {
  padding: 0.35rem;
}
.overwrites {
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
}
.add-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}
.add-row input[type='number'] {
  width: 4rem;
}
input,
select {
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
