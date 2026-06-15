<script setup lang="ts">
import type { TerrainType, GameEvent } from '@/engine/types/scenario'
import type { Brush } from './brush'

const props = defineProps<{
  modelValue: Brush
  terrains: readonly TerrainType[]
  events: readonly GameEvent[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', brush: Brush): void
}>()

function select(brush: Brush): void {
  emit('update:modelValue', brush)
}

function isActive(brush: Brush): boolean {
  const current = props.modelValue
  if (current.kind !== brush.kind) return false
  if (current.kind === 'terrain' && brush.kind === 'terrain') return current.name === brush.name
  if (current.kind === 'event' && brush.kind === 'event') return current.id === brush.id
  return true
}
</script>

<template>
  <aside class="palette">
    <section>
      <h3>Tools</h3>
      <button type="button" :class="{ active: isActive({ kind: 'inspect' }) }" @click="select({ kind: 'inspect' })">
        🔍 Inspect
      </button>
      <button type="button" :class="{ active: isActive({ kind: 'start' }) }" @click="select({ kind: 'start' })">
        ⚑ Set start
      </button>
      <button type="button" :class="{ active: isActive({ kind: 'add' }) }" @click="select({ kind: 'add' })">
        ＋ Add cell
      </button>
      <button type="button" :class="{ active: isActive({ kind: 'remove' }) }" @click="select({ kind: 'remove' })">
        🗑 Remove cell
      </button>
      <button type="button" :class="{ active: isActive({ kind: 'clear-event' }) }" @click="select({ kind: 'clear-event' })">
        ✖ Clear event
      </button>
    </section>

    <section>
      <h3>Terrains</h3>
      <button
        v-for="terrain in terrains"
        :key="terrain.name"
        type="button"
        class="swatch"
        :class="{ active: isActive({ kind: 'terrain', name: terrain.name }) }"
        @click="select({ kind: 'terrain', name: terrain.name })"
      >
        <span class="chip" :style="{ background: terrain.color }" />
        {{ terrain.name }}
      </button>
    </section>

    <section>
      <h3>Events</h3>
      <p v-if="events.length === 0" class="empty">No events yet.</p>
      <button
        v-for="event in events"
        :key="event.id"
        type="button"
        :class="{ active: isActive({ kind: 'event', id: event.id }) }"
        :title="event.text"
        @click="select({ kind: 'event', id: event.id })"
      >
        ★ {{ event.id }}
      </button>
    </section>
  </aside>
</template>

<style scoped>
.palette {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow-y: auto;
  padding: 0.5rem;
  border-left: 1px solid #ccc;
  background: #fafafa;
}
section {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
h3 {
  margin: 0 0 0.2rem;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #666;
}
button {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  text-align: left;
  padding: 0.35rem 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 0.85rem;
}
button.active {
  border-color: #0033aa;
  box-shadow: inset 0 0 0 1px #0033aa;
}
.chip {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  border: 1px solid #0003;
  flex: none;
}
.empty {
  margin: 0;
  font-size: 0.8rem;
  color: #999;
}
</style>
