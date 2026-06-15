<script setup lang="ts">
import { reactive } from 'vue'
import { useScenarioEditor } from '@/editor/useScenarioEditor'
import { useNotificationStore } from '@/notifications/notificationStore'
import type { GameEvent, Outcome } from '@/engine/types/scenario'

const store = useScenarioEditor()
const notifications = useNotificationStore()

const draftNew = reactive({ id: '', text: '', difficulty: 4 })

function guard(action: () => void): void {
  try {
    action()
  } catch (err) {
    notifications.push(err instanceof Error ? err.message : 'Edit failed', 'info')
  }
}

function eventOf(id: string): GameEvent | undefined {
  return store.draft.eventMap.get(id)
}

function setText(id: string, text: string): void {
  store.editor.updateEvent(id, { text })
}
function setDifficulty(id: string, value: number): void {
  store.editor.updateEvent(id, { difficulty: value })
}
function setCritical(id: string, value: string): void {
  store.editor.updateEvent(id, { critical_threshold: value === '' ? undefined : Number(value) })
}
function setOutcomeText(id: string, which: 'success' | 'fail', text: string): void {
  const event = eventOf(id)
  if (!event) return
  const base = which === 'success' ? event.success_outcome : event.fail_outcome
  patchOutcome(id, which, { ...base, text })
}
function deltasText(outcome: Outcome): string {
  return JSON.stringify(outcome.resource_deltas)
}
function setOutcomeDeltas(id: string, which: 'success' | 'fail', json: string): void {
  const event = eventOf(id)
  if (!event) return
  let parsed: Record<string, number>
  try {
    parsed = JSON.parse(json) as Record<string, number>
  } catch {
    notifications.push('Invalid resource deltas JSON.', 'info')
    return
  }
  const base = which === 'success' ? event.success_outcome : event.fail_outcome
  patchOutcome(id, which, { ...base, resource_deltas: parsed })
}
function patchOutcome(id: string, which: 'success' | 'fail', outcome: Outcome): void {
  store.editor.updateEvent(id, which === 'success' ? { success_outcome: outcome } : { fail_outcome: outcome })
}
function remove(id: string): void {
  guard(() => store.editor.removeEvent(id))
}
function add(): void {
  if (!draftNew.id) return
  guard(() => {
    store.editor.addEvent({
      id: draftNew.id,
      text: draftNew.text,
      difficulty: draftNew.difficulty,
      success_outcome: { text: '', resource_deltas: {} },
      fail_outcome: { text: '', resource_deltas: {} },
    })
    draftNew.id = ''
    draftNew.text = ''
    draftNew.difficulty = 4
  })
}
</script>

<template>
  <div class="editor-list">
    <div v-for="event in store.draft.events" :key="event.id" class="event-row">
      <div class="row-head">
        <strong>{{ event.id }}</strong>
        <label>difficulty <input type="number" :value="event.difficulty" @change="setDifficulty(event.id, Number(($event.target as HTMLInputElement).value))" /></label>
        <label>crit <input type="number" :value="event.critical_threshold ?? ''" @change="setCritical(event.id, ($event.target as HTMLInputElement).value)" /></label>
        <button type="button" class="danger" @click="remove(event.id)">Delete</button>
      </div>
      <input class="text" type="text" :value="event.text" placeholder="event text" @change="setText(event.id, ($event.target as HTMLInputElement).value)" />
      <div class="outcomes">
        <fieldset>
          <legend>Success</legend>
          <input type="text" :value="event.success_outcome.text" placeholder="text" @change="setOutcomeText(event.id, 'success', ($event.target as HTMLInputElement).value)" />
          <input type="text" :value="deltasText(event.success_outcome)" placeholder='{"gold":1}' @change="setOutcomeDeltas(event.id, 'success', ($event.target as HTMLInputElement).value)" />
        </fieldset>
        <fieldset>
          <legend>Fail</legend>
          <input type="text" :value="event.fail_outcome.text" placeholder="text" @change="setOutcomeText(event.id, 'fail', ($event.target as HTMLInputElement).value)" />
          <input type="text" :value="deltasText(event.fail_outcome)" placeholder='{"gold":-1}' @change="setOutcomeDeltas(event.id, 'fail', ($event.target as HTMLInputElement).value)" />
        </fieldset>
      </div>
    </div>

    <form class="add-row" @submit.prevent="add">
      <input v-model="draftNew.id" type="text" placeholder="id" />
      <input v-model="draftNew.text" type="text" placeholder="text" />
      <input v-model.number="draftNew.difficulty" type="number" />
      <button type="submit" class="primary">Add event</button>
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
.event-row {
  border: 1px solid var(--st-wood-border);
  background: var(--st-wood);
  border-radius: 6px;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  max-width: 720px;
}
.row-head {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.row-head label {
  font-size: 0.85rem;
}
.row-head input {
  width: 4rem;
}
.text {
  padding: 0.35rem;
}
.outcomes {
  display: flex;
  gap: 0.75rem;
}
fieldset {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  border: 1px solid var(--st-wood-border);
  border-radius: 4px;
}
legend {
  font-size: 0.8rem;
  color: var(--st-gold);
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
