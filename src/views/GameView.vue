<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import HexGrid from '@/components/HexGrid.vue'
import PlayerHand from '@/components/PlayerHand.vue'
import ActiveZone from '@/components/ActiveZone.vue'
import NarrativeCardDrop from '@/components/NarrativeCardDrop.vue'
import ResourceBar from '@/components/ResourceBar.vue'
import NarrativeText from '@/components/NarrativeText.vue'
import ConfirmButton from '@/components/ConfirmButton.vue'
import { useGameStore } from '@/stores/gameStore'
import { useEndGameManager } from '@/composables/useEndGameManager'
import { loadOrCreateScenario } from '@/utils/storage'
import type { Card, Coord } from '@/types/scenario'

const game = useGameStore()
const {
  phase,
  resources,
  position,
  cells,
  mapRadius,
  hand,
  activeZone,
  pendingNarrativeCard,
  currentEvent,
  isGameOver,
} = storeToRefs(game)

useEndGameManager()

onMounted(() => {
  const scenario = loadOrCreateScenario()
  game.initFromScenario(scenario)
})

const adjacencyHints = computed<Set<string>>(() => game.adjacencyHints())

const narrativeText = computed<string>(() => {
  if (isGameOver.value) return 'The journey ends here.'
  if (phase.value === 'narrative-intervention')
    return 'A narrative card has appeared. Drag it onto a hex on the map.'
  if (phase.value === 'draw' && currentEvent.value) return currentEvent.value.text
  if (phase.value === 'consequences') return 'Resolving consequences…'
  return 'Choose an adjacent hex to move.'
})

function onHandUpdate(cards: Card[]): void {
  game.hand = cards
}
function onActiveUpdate(cards: Card[]): void {
  game.activeZone = cards
}

function onHexClick(coord: Coord): void {
  if (phase.value === 'movement') game.selectHex(coord)
}

function onHexDrop(coord: Coord): void {
  if (phase.value === 'narrative-intervention') game.placeNarrativeCard(coord)
}

function onConfirm(): void {
  game.confirmPlay()
}

const dragLocked = computed<boolean>(
  () => phase.value !== 'draw' || isGameOver.value,
)
</script>

<template>
  <main class="game-view">
    <header class="top-bar">
      <h1>Storyteller</h1>
      <nav>
        <RouterLink to="/editor">Editor</RouterLink>
      </nav>
    </header>

    <ResourceBar :resources="resources" />

    <NarrativeText :text="narrativeText" :phase="phase" />

    <section class="grid-wrapper">
      <HexGrid
        :cells="cells"
        :radius="mapRadius"
        :player-position="position"
        :highlight-set="adjacencyHints"
        :drop-mode="phase === 'narrative-intervention'"
        @hex-click="onHexClick"
        @hex-drop="onHexDrop"
      />
    </section>

    <section class="play-area">
      <PlayerHand
        :model-value="hand"
        :disabled="dragLocked"
        @update:model-value="onHandUpdate"
      />
      <ActiveZone
        :model-value="activeZone"
        :disabled="dragLocked"
        @update:model-value="onActiveUpdate"
      />
    </section>

    <footer class="controls">
      <ConfirmButton
        :disabled="phase !== 'draw' || activeZone.length === 0"
        label="Confirm Play"
        @confirm="onConfirm"
      />
      <NarrativeCardDrop
        v-if="phase === 'narrative-intervention' && pendingNarrativeCard"
        :card="pendingNarrativeCard"
      />
    </footer>
  </main>
</template>

<style scoped>
.game-view {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  max-width: 1100px;
  margin: 0 auto;
}
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.top-bar h1 {
  margin: 0;
}
.grid-wrapper {
  border: 1px solid #ccc;
  background: #fdfdfa;
  border-radius: 6px;
  padding: 0.5rem;
  height: 420px;
}
.play-area {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.controls {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}
</style>
