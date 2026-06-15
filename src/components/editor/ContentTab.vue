<script setup lang="ts">
import { ref } from 'vue'
import TerrainEditor from '@/components/editor/TerrainEditor.vue'
import CardEditor from '@/components/editor/CardEditor.vue'
import EventEditor from '@/components/editor/EventEditor.vue'

type SubTab = 'terrains' | 'cards' | 'events'
const sub = ref<SubTab>('terrains')
</script>

<template>
  <div class="content-tab">
    <nav class="sub-tabs">
      <button type="button" :class="{ active: sub === 'terrains' }" @click="sub = 'terrains'">Terrains</button>
      <button type="button" :class="{ active: sub === 'cards' }" @click="sub = 'cards'">Cards</button>
      <button type="button" :class="{ active: sub === 'events' }" @click="sub = 'events'">Events</button>
    </nav>
    <div class="sub-body">
      <TerrainEditor v-if="sub === 'terrains'" />
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
.sub-tabs {
  display: flex;
  gap: 0.25rem;
  padding: 0.5rem;
  border-bottom: 1px solid #eee;
}
.sub-tabs button {
  border: 1px solid #ccc;
  background: #f4f4f4;
  padding: 0.35rem 0.9rem;
  border-radius: 4px;
  cursor: pointer;
}
.sub-tabs button.active {
  background: #334;
  color: white;
  border-color: #334;
}
.sub-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
</style>
