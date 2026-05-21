<script setup lang="ts">
import type { Card } from '@/types/scenario'

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
  border: 2px solid #993333;
  padding: 0.5rem;
  border-radius: 8px;
  background: #fff0f0;
  color: #2b0d0d;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);
}
.narrative-card-drop h3 {
  margin: 0 0 0.4rem;
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #993333;
}
.card.narrative {
  border: 1px solid #993333;
  background: linear-gradient(180deg, #ffe5e5 0%, #ffc7c7 100%);
  border-radius: 6px;
  padding: 0.6rem 0.7rem;
  width: 180px;
  min-height: 90px;
  font-size: 0.9rem;
  color: #2b0d0d;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
}
.card.narrative p {
  margin: 0 0 0.4rem;
  color: #2b0d0d;
  line-height: 1.35;
}
.card.narrative small {
  color: #7a3333;
  font-style: italic;
}
</style>
