<script setup lang="ts">
import type { Card } from '@/engine/types/scenario'

defineProps<{
  card: Card
}>()
</script>

<template>
  <aside class="narrative-card-drop">
    <h3>Narrative Card</h3>
    <article class="card narrative">
      <p>{{ card.text }}</p>
      <small>Click any hex to place it.</small>
    </article>
  </aside>
</template>

<style scoped>
.narrative-card-drop {
  border: 2px solid var(--st-narrative);
  padding: 0.5rem;
  border-radius: 8px;
  background: var(--st-narrative-bg);
  color: var(--st-narrative-ink);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);
}
.narrative-card-drop h3 {
  margin: 0 0 0.4rem;
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--st-narrative);
}
.card.narrative {
  border: 1px solid var(--st-narrative);
  background: linear-gradient(180deg, var(--st-narrative-card) 0%, var(--st-narrative-card-shade) 100%);
  border-radius: 6px;
  padding: 0.6rem 0.7rem;
  width: 180px;
  min-height: 90px;
  font-size: 0.9rem;
  color: var(--st-narrative-ink);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
}
.card.narrative p {
  margin: 0 0 0.4rem;
  color: var(--st-narrative-ink);
  line-height: 1.35;
}
.card.narrative small {
  color: var(--st-narrative-label);
  font-style: italic;
}
</style>
