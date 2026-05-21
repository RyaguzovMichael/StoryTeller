<script setup lang="ts">
import draggable from 'vuedraggable'
import type { Card } from '@/types/scenario'

defineProps<{
  modelValue: Card[]
  disabled?: boolean
}>()

defineEmits<{
  (e: 'update:modelValue', value: Card[]): void
}>()
</script>

<template>
  <section class="player-hand" :aria-disabled="disabled">
    <h3>Hand</h3>
    <draggable
      :model-value="modelValue"
      :item-key="(c: Card) => c.id"
      :group="{ name: 'cards', pull: !disabled, put: !disabled }"
      :disabled="disabled"
      class="card-list"
      ghost-class="card-ghost"
      @update:model-value="(v: Card[]) => $emit('update:modelValue', v)"
    >
      <template #item="{ element }">
        <article class="card" :data-card-id="element.id">
          <p>{{ element.text }}</p>
        </article>
      </template>
    </draggable>
    <p v-if="modelValue.length === 0" class="empty">No cards in hand.</p>
  </section>
</template>

<style scoped>
.player-hand {
  border: 1px solid #aaa;
  padding: 0.5rem;
  border-radius: 6px;
  min-height: 120px;
}
.card-list {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  min-height: 80px;
}
.card {
  border: 1px solid #444;
  background: #fff8e7;
  border-radius: 4px;
  padding: 0.5rem;
  width: 130px;
  min-height: 70px;
  cursor: grab;
  font-size: 0.9rem;
}
.card-ghost {
  opacity: 0.4;
}
.empty {
  color: #888;
  font-style: italic;
}
</style>
