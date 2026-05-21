<script setup lang="ts">
defineProps<{
  text: string
  phase: string
}>()
</script>

<template>
  <section class="narrative-text">
    <p class="phase">Phase: {{ phase }}</p>
    <p class="body">{{ text }}</p>
  </section>
</template>

<style scoped>
.narrative-text {
  border: 1px solid #aaa;
  padding: 0.75rem;
  border-radius: 6px;
  background: #fafafa;
  min-height: 80px;
}
.phase {
  font-size: 0.8rem;
  text-transform: uppercase;
  color: #666;
  margin: 0 0 0.25rem 0;
}
.body {
  margin: 0;
  font-size: 1rem;
}
</style>
