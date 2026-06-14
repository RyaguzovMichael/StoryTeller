<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import HexGrid from '@/components/board/HexGrid.vue'
import PlayerHand from '@/components/cards/PlayerHand.vue'
import EventPanel from '@/components/cards/EventPanel.vue'
import NarrativeCardDrop from '@/components/cards/NarrativeCardDrop.vue'
import ResourceBar from '@/components/hud/ResourceBar.vue'
import { useGame } from '@/game/useGame'
import { useEndGameManager } from '@/game/useEndGameManager'
import { useGameEffects } from '@/game/useGameEffects'
import { clearGame, loadGame, loadOrCreateScenario } from '@/infrastructure/storage'
import { createGameState } from '@/engine/createGameState'
import type { Card, Coord } from '@/engine/types/scenario'

const game = useGame()
const {
  initialized,
  phase,
  resources,
  position,
  cells,
  hand,
  activeZone,
  pendingNarrativeCard,
  currentEvent,
} = storeToRefs(game)

useEndGameManager()
useGameEffects()

onMounted(() => {
  // Resume an in-progress save for this story if one exists; otherwise (no save,
  // a save for another story, or a finished game) map the scenario into a fresh
  // game. The engine performs the one-time setup on the fresh state.
  const scenario = loadOrCreateScenario()
  const saved = loadGame()
  if (saved && saved.storyId === scenario.id && saved.phase !== 'game-over') {
    game.engine.load({ ...saved, effects: [] })
  } else {
    game.engine.load(createGameState(scenario))
  }
})

// Discards the current save and starts the story over from its definition.
function onNewGame(): void {
  clearGame()
  game.engine.load(createGameState(loadOrCreateScenario()))
}

const gameOver = computed<boolean>(() => phase.value === 'game-over')

const adjacencyHints = computed<Set<string>>(() => game.engine.adjacencyHints())

const eventOpen = computed<boolean>(
  () => phase.value === 'draw' && !!currentEvent.value,
)

const movementHint = computed<string>(() => {
  if (gameOver.value) return 'The journey ends here.'
  if (phase.value === 'narrative-intervention')
    return 'A narrative card has appeared — drop it onto any hex.'
  if (phase.value === 'movement') return 'Choose an adjacent hex to move.'
  return ''
})

function onHandUpdate(cards: Card[]): void {
  game.hand = cards
}
function onActiveUpdate(cards: Card[]): void {
  game.activeZone = cards
}

function onHexClick(coord: Coord): void {
  if (phase.value === 'movement') game.engine.selectHex(coord)
  else if (phase.value === 'narrative-intervention') game.engine.placeNarrativeCard(coord)
}

function onConfirm(): void {
  game.engine.confirmPlay()
}

const dragLocked = computed<boolean>(
  () => phase.value !== 'draw' || gameOver.value,
)
</script>

<template>
  <main class="game-view">
    <header class="top-bar">
      <div class="brand">
        <h1>Storyteller</h1>
        <nav>
          <RouterLink to="/editor">Editor</RouterLink>
          <button type="button" class="new-game" @click="onNewGame">New game</button>
        </nav>
      </div>
      <ResourceBar v-if="initialized" :resources="resources" />
    </header>

    <p v-if="!initialized" class="loading-hint">Loading story…</p>

    <template v-else>
    <section class="board-area">
      <div class="board-frame">
        <HexGrid
          :cells="cells"
          :player-position="position"
          :highlight-set="adjacencyHints"
          :drop-mode="phase === 'narrative-intervention'"
          :dimmed="eventOpen"
          @hex-click="onHexClick"
        />

        <p v-if="movementHint" class="movement-hint">{{ movementHint }}</p>

        <div v-if="eventOpen" class="event-anchor">
          <EventPanel
            :text="currentEvent!.text"
            :active-zone="activeZone"
            :can-confirm="true"
            :disabled="gameOver"
            @update:active-zone="onActiveUpdate"
            @confirm="onConfirm"
          />
        </div>

        <aside
          v-if="phase === 'narrative-intervention' && pendingNarrativeCard"
          class="narrative-anchor"
        >
          <NarrativeCardDrop :card="pendingNarrativeCard" />
        </aside>
      </div>
    </section>

    <div class="hand-dock">
      <PlayerHand
        :model-value="hand"
        :disabled="dragLocked"
        @update:model-value="onHandUpdate"
      />
    </div>
    </template>
  </main>
</template>

<style scoped>
.game-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(1200px 600px at 50% -20%, #2c2218 0%, transparent 70%),
    linear-gradient(180deg, #1a140c 0%, #0d0a06 100%);
  color: #f4ead2;
  box-sizing: border-box;
}
.top-bar {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid #3a2c18;
}
.top-bar .brand {
  display: flex;
  align-items: baseline;
  gap: 1.25rem;
  min-width: 0;
}
.top-bar h1 {
  margin: 0;
  font-family: Georgia, 'Iowan Old Style', serif;
  font-size: 1.15rem;
  letter-spacing: 0.04em;
  color: #f4ead2;
  white-space: nowrap;
}
.top-bar nav {
  display: flex;
  align-items: baseline;
  gap: 1rem;
}
.top-bar nav :deep(a) {
  color: #d9c084;
  text-decoration: none;
  border-bottom: 1px dashed #806340;
  padding-bottom: 1px;
  font-size: 0.9rem;
}
.top-bar nav .new-game {
  background: none;
  border: none;
  border-bottom: 1px dashed #806340;
  padding: 0 0 1px;
  color: #d9c084;
  font: inherit;
  font-size: 0.9rem;
  cursor: pointer;
}
.top-bar nav .new-game:hover {
  color: #fff3cf;
}
.top-bar nav :deep(a:hover) {
  color: #fff3cf;
}
.top-bar :deep(.resource-bar) {
  margin: 0;
  padding: 0.3rem 0.6rem;
  flex: 0 1 auto;
}
.top-bar :deep(.resource-bar ul) {
  gap: 0.9rem;
}
.board-area {
  flex: 1 1 auto;
  position: relative;
  padding: 0.5rem 0.75rem 0;
  min-height: 0;
  display: flex;
}
.board-frame {
  position: relative;
  flex: 1 1 auto;
  border: 1px solid #4a3a22;
  background:
    radial-gradient(900px 500px at 50% 30%, #fdfaf0 0%, #e7dcc0 70%, #cbb98c 100%);
  border-radius: 10px;
  box-shadow:
    inset 0 0 60px rgba(80, 50, 10, 0.25),
    0 10px 30px rgba(0, 0, 0, 0.45);
  overflow: hidden;
  min-height: 0;
}
.loading-hint {
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  color: #d9c084;
  letter-spacing: 0.04em;
}
.movement-hint {
  position: absolute;
  top: 0.75rem;
  left: 50%;
  transform: translateX(-50%);
  margin: 0;
  padding: 0.3rem 0.8rem;
  background: rgba(20, 14, 6, 0.65);
  color: #fff3cf;
  border-radius: 999px;
  font-size: 0.85rem;
  letter-spacing: 0.02em;
  pointer-events: none;
  z-index: 5;
}
.event-anchor {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 1rem;
  display: flex;
  justify-content: center;
  pointer-events: none;
  z-index: 10;
}
.event-anchor::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(20, 14, 6, 0) 0%,
    rgba(20, 14, 6, 0.35) 100%
  );
  pointer-events: none;
}
.narrative-anchor {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 12;
}
.hand-dock {
  flex: 0 0 auto;
  width: 100%;
  background: linear-gradient(180deg, #1a140c 0%, #0a0703 100%);
  border-top: 1px solid #3a2c18;
  box-shadow: 0 -8px 16px rgba(0, 0, 0, 0.45);
}
</style>
