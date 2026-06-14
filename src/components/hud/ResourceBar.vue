<script setup lang="ts">
defineProps<{
  resources: Record<string, number>
}>()
</script>

<template>
  <section class="resource-bar" aria-label="Resources">
    <ul>
      <li v-for="(value, key) in resources" :key="key">
        <span class="key">{{ key }}</span>
        <span class="value" :class="{ low: value <= 1, danger: value <= 0 }">
          {{ value }}
        </span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.resource-bar {
  margin: 0 1rem;
  padding: 0.45rem 0.75rem;
  background: linear-gradient(180deg, #2c2218 0%, #1a140c 100%);
  border: 1px solid #4a3a22;
  border-radius: 8px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
}
ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem;
  justify-content: center;
}
li {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.92rem;
}
.key {
  text-transform: uppercase;
  font-size: 0.68rem;
  letter-spacing: 0.14em;
  color: #c8a96b;
  font-weight: 700;
}
.value {
  min-width: 1.5em;
  text-align: right;
  font-variant-numeric: tabular-nums;
  color: #fff3cf;
  font-weight: 600;
}
.value.low {
  color: #f6c971;
}
.value.danger {
  color: #ff8a7a;
}
</style>
