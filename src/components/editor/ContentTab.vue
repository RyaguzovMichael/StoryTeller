<script setup lang="ts">
import { ref } from 'vue'
import MainEditor from '@/components/editor/MainEditor.vue'
import TerrainEditor from '@/components/editor/TerrainEditor.vue'
import CardEditor from '@/components/editor/CardEditor.vue'
import EventEditor from '@/components/editor/EventEditor.vue'

type SubTab = 'main' | 'terrains' | 'cards' | 'events'
const sub = ref<SubTab>('main')
</script>

<template>
  <div class="content-tab">
    <nav class="sub-tabs">
      <button type="button" :class="{ active: sub === 'main' }" @click="sub = 'main'">Main</button>
      <button type="button" :class="{ active: sub === 'terrains' }" @click="sub = 'terrains'">Terrains</button>
      <button type="button" :class="{ active: sub === 'cards' }" @click="sub = 'cards'">Cards</button>
      <button type="button" :class="{ active: sub === 'events' }" @click="sub = 'events'">Events</button>
    </nav>
    <div class="sub-body">
      <MainEditor v-if="sub === 'main'" />
      <TerrainEditor v-else-if="sub === 'terrains'" />
      <CardEditor v-else-if="sub === 'cards'" />
      <EventEditor v-else />
    </div>
  </div>
</template>

<style scoped>
.content-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}
.content-tab {
  background: var(--st-wood-dark);
  color: var(--st-ink);
}
.sub-tabs {
  display: flex;
  gap: 0.25rem;
  padding: 0.5rem;
  border-bottom: 1px solid var(--st-wood-border);
}
.sub-tabs button {
  border: 1px solid var(--st-wood-border);
  background: var(--st-wood-darkest);
  color: var(--st-ink);
  padding: 0.35rem 0.9rem;
  border-radius: 4px;
  cursor: pointer;
}
.sub-tabs button.active {
  background: var(--st-wood-button-start);
  color: var(--st-ink-bright);
  border-color: var(--st-gold-line);
}
.sub-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
</style>
