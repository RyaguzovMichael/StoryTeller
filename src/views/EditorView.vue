<script setup lang="ts">
import { ref } from 'vue'
import MapTab from '@/components/editor/MapTab.vue'
import ContentTab from '@/components/editor/ContentTab.vue'
import { useScenarioEditor } from '@/editor/useScenarioEditor'
import { useNotificationStore } from '@/notifications/notificationStore'

const store = useScenarioEditor()
const notifications = useNotificationStore()

type Tab = 'map' | 'content'
const tab = ref<Tab>('map')

function onSave(): void {
  store.save()
  notifications.push('Scenario saved.', 'info')
}
</script>

<template>
  <main class="editor-view">
    <header class="top-bar">
      <div class="tabs">
        <button type="button" :class="{ active: tab === 'map' }" @click="tab = 'map'">Map</button>
        <button type="button" :class="{ active: tab === 'content' }" @click="tab = 'content'">Content</button>
      </div>
      <div class="actions">
        <span v-if="store.issues.length" class="issues" :title="store.issues.map((i) => i.message).join('\n')">
          ⚠ {{ store.issues.length }} issue(s)
        </span>
        <button type="button" class="primary" @click="onSave">Save</button>
        <RouterLink to="/game">Play</RouterLink>
      </div>
    </header>

    <section class="tab-body">
      <MapTab v-if="tab === 'map'" />
      <ContentTab v-else />
    </section>
  </main>
</template>

<style scoped>
.editor-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
}
.editor-view {
  background: var(--st-wood-dark);
  color: var(--st-ink);
}
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--st-wood-border);
  background: linear-gradient(180deg, var(--st-wood) 0%, var(--st-wood-dark) 100%);
}
.tabs {
  display: flex;
  gap: 0.25rem;
}
.tabs button {
  border: 1px solid var(--st-wood-border);
  background: var(--st-wood-darkest);
  color: var(--st-ink);
  padding: 0.4rem 1rem;
  cursor: pointer;
  border-radius: 4px;
}
.tabs button.active {
  background: var(--st-wood-button-start);
  color: var(--st-ink-bright);
  border-color: var(--st-gold-line);
}
.actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.actions :deep(a) {
  color: var(--st-gold);
  text-decoration: none;
  border-bottom: 1px dashed var(--st-gold-line);
  font-size: 0.9rem;
}
.issues {
  color: var(--st-warn);
  font-size: 0.85rem;
  cursor: help;
}
.actions .primary {
  background: linear-gradient(180deg, var(--st-wood-button-start) 0%, var(--st-wood-button-end) 100%);
  color: var(--st-ink);
  border: 1px solid var(--st-wood-edge);
  padding: 0.4rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}
.tab-body {
  flex: 1;
  min-height: 0;
}
</style>
