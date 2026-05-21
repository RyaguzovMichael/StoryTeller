<script setup lang="ts">
defineProps<{
  resources: Record<string, number>
}>()
</script>

<template>
  <section class="resource-bar">
    <h3>Resources</h3>
    <ul>
      <li v-for="(value, key) in resources" :key="key">
        <strong>{{ key }}</strong>: {{ value }}
      </li>
    </ul>
  </section>
</template>

<style scoped>
.resource-bar {
  border: 1px solid #aaa;
  padding: 0.5rem;
  border-radius: 6px;
}
ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  gap: 1rem;
}
</style>
