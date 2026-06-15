<script setup lang="ts">
import { ref } from 'vue'
import MapTab from '@/components/editor/MapTab.vue'
import ContentTab from '@/components/editor/ContentTab.vue'
import JsonTab from '@/components/editor/JsonTab.vue'

type Tab = 'map' | 'content' | 'json'
const tab = ref<Tab>('map')
</script>

<template>
  <main class="editor-view">
    <header class="editor-header">
      <div class="bar">
        <div class="brand">
          <h1>Storyteller</h1>
          <RouterLink to="/game" class="mode">Play</RouterLink>
        </div>
      </div>
      <nav class="tab-strip">
        <button type="button" :class="{ active: tab === 'map' }" @click="tab = 'map'">Map</button>
        <button type="button" :class="{ active: tab === 'content' }" @click="tab = 'content'">Content</button>
        <button type="button" :class="{ active: tab === 'json' }" @click="tab = 'json'">JSON</button>
      </nav>
    </header>

    <section class="tab-body">
      <MapTab v-if="tab === 'map'" />
      <ContentTab v-else-if="tab === 'content'" />
      <JsonTab v-else />
    </section>
  </main>
</template>

<style scoped>
.editor-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--st-wood-dark);
  color: var(--st-ink);
}
.editor-header {
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, var(--st-wood) 0%, var(--st-wood-dark) 100%);
}
.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.5rem 1rem;
}
.brand {
  display: flex;
  align-items: baseline;
  gap: 1.25rem;
  min-width: 0;
}
.brand h1 {
  margin: 0;
  font-family: Georgia, 'Iowan Old Style', serif;
  font-size: 1.15rem;
  letter-spacing: 0.04em;
  color: var(--st-ink);
  white-space: nowrap;
}
.brand .mode {
  color: var(--st-gold);
  text-decoration: none;
  border-bottom: 1px dashed var(--st-gold-line);
  padding-bottom: 1px;
  font-size: 0.9rem;
}
.brand .mode:hover {
  color: var(--st-ink-bright);
}
.tab-strip {
  display: flex;
  width: 100%;
}
.tab-strip button {
  flex: 1;
  padding: 0.6rem 0;
  border: none;
  border-bottom: 2px solid var(--st-wood-border);
  background: transparent;
  color: var(--st-gold-muted);
  cursor: pointer;
  font-size: 0.95rem;
  letter-spacing: 0.03em;
}
.tab-strip button:hover {
  color: var(--st-ink);
}
.tab-strip button.active {
  color: var(--st-ink-bright);
  border-bottom-color: var(--st-gold);
  background: var(--st-wood);
}
.tab-body {
  flex: 1;
  min-height: 0;
}
</style>
