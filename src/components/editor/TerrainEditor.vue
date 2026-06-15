<script setup lang="ts">
import { reactive } from 'vue'
import { useScenarioEditor } from '@/editor/useScenarioEditor'
import { useNotificationStore } from '@/notifications/notificationStore'

const store = useScenarioEditor()
const notifications = useNotificationStore()

const draftNew = reactive({ name: '', color: '#cccccc' })

function guard(action: () => void): void {
  try {
    action()
  } catch (err) {
    notifications.push(err instanceof Error ? err.message : 'Edit failed', 'info')
  }
}

function rename(oldName: string, newName: string): void {
  if (newName && newName !== oldName) guard(() => store.editor.updateTerrain(oldName, { name: newName }))
}

function recolor(name: string, color: string): void {
  store.editor.updateTerrain(name, { color })
}

function remove(name: string): void {
  guard(() => store.editor.removeTerrain(name))
}

function add(): void {
  if (!draftNew.name) return
  guard(() => {
    store.editor.addTerrain({ name: draftNew.name, color: draftNew.color })
    draftNew.name = ''
    draftNew.color = '#cccccc'
  })
}
</script>

<template>
  <div class="editor-list">
    <table>
      <thead>
        <tr><th>Color</th><th>Name</th><th></th></tr>
      </thead>
      <tbody>
        <tr v-for="terrain in store.draft.terrains" :key="terrain.name">
          <td><input type="color" :value="terrain.color" @input="recolor(terrain.name, ($event.target as HTMLInputElement).value)" /></td>
          <td><input type="text" :value="terrain.name" @change="rename(terrain.name, ($event.target as HTMLInputElement).value)" /></td>
          <td><button type="button" class="danger" @click="remove(terrain.name)">Delete</button></td>
        </tr>
      </tbody>
    </table>

    <form class="add-row" @submit.prevent="add">
      <input v-model="draftNew.color" type="color" />
      <input v-model="draftNew.name" type="text" placeholder="new terrain name" />
      <button type="submit" class="primary">Add terrain</button>
    </form>
  </div>
</template>

<style scoped>
.editor-list {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  color: var(--st-ink);
}
table {
  border-collapse: collapse;
  max-width: 500px;
}
th {
  text-align: left;
  font-size: 0.8rem;
  color: var(--st-gold-muted);
  padding: 0.25rem;
}
td {
  padding: 0.25rem;
}
input[type='text'] {
  padding: 0.3rem;
  background: var(--st-parchment);
  color: var(--st-parchment-ink);
  border: 1px solid var(--st-parchment-border);
  border-radius: 4px;
}
.add-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
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
