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
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid #ccc;
}
.tabs {
  display: flex;
  gap: 0.25rem;
}
.tabs button {
  border: 1px solid #ccc;
  background: #f4f4f4;
  padding: 0.4rem 1rem;
  cursor: pointer;
  border-radius: 4px;
}
.tabs button.active {
  background: #0033aa;
  color: white;
  border-color: #0033aa;
}
.actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.issues {
  color: #aa5500;
  font-size: 0.85rem;
  cursor: help;
}
.actions .primary {
  background: #0033aa;
  color: white;
  border: none;
  padding: 0.4rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}
.tab-body {
  flex: 1;
  min-height: 0;
}
</style>
