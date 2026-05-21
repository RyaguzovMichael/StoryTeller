<script setup lang="ts">
import type { Card } from '@/types/scenario'

defineProps<{
  card: Card
}>()

function onDragStart(event: DragEvent): void {
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', 'narrative-card')
  }
}
</script>

<template>
  <aside class="narrative-card-drop">
    <h3>Narrative Card</h3>
    <article
      class="card narrative"
      draggable="true"
      @dragstart="onDragStart"
    >
      <p>{{ card.text }}</p>
      <small>Drag onto any hex.</small>
    </article>
  </aside>
</template>

<style scoped>
.narrative-card-drop {
  border: 2px solid #993333;
  padding: 0.5rem;
  border-radius: 6px;
  background: #fff0f0;
}
.card.narrative {
  border: 1px solid #993333;
  background: #ffdada;
  border-radius: 4px;
  padding: 0.5rem;
  width: 180px;
  min-height: 90px;
  cursor: grab;
  font-size: 0.9rem;
}
</style>
