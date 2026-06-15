<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import HexGrid from '@/components/board/HexGrid.vue'
import PlayerHand from '@/components/cards/PlayerHand.vue'
import EventPanel from '@/components/cards/EventPanel.vue'
import NarrativeCardDrop from '@/components/cards/NarrativeCardDrop.vue'
import ResourceBar from '@/components/hud/ResourceBar.vue'
import { useGame } from '@/game/useGame'
import { useGameEffects } from '@/game/useGameEffects'
import { useNotificationStore } from '@/notifications/notificationStore'
import { clearGame, loadGame } from '@/infrastructure/gameStorage'
import { loadScenario } from '@/infrastructure/scenarioStorage'
import { createGameState } from '@/engine/createGameState'
import { deserializeGameState } from '@/engine/gameState'
import type { Card } from '@/engine/types/scenario'
import type { Coord } from '@/engine/hexGrid'

const game = useGame()
const notifications = useNotificationStore()
const {
  phase,
  resources,
  playerPosition,
  cells,
  hand,
  tableau,
  pendingNarrativeCard,
  currentEvent,
} = storeToRefs(game)

// Whether a game has been loaded yet. "Empty" only exists between store creation
// and this view's onMounted, so the loading guard is the view's concern.
const ready = ref(false)

useGameEffects()

onMounted(() => {
  // Resume an in-progress save for this story if one exists; otherwise (no save,
  // a save for another story, or a finished game) map the scenario into a fresh,
  // ready-to-play game.
  const scenario = loadScenario()
  // No scenario authored/saved yet: nothing to play. The view shows its empty
  // guard rather than inventing a story.
  if (!scenario) {
    ready.value = true
    return
  }
  const saved = loadGame()
  if (saved && saved.storyId === scenario.id && saved.phase !== 'game-over') {
    game.engine.load(deserializeGameState(saved))
  } else {
    game.engine.load(createGameState(scenario))
  }
  ready.value = true
})

// Discards the current save and starts the story over from its definition.
function onNewGame(): void {
  const scenario = loadScenario()
  if (!scenario) return
  clearGame()
  notifications.clear()
  game.engine.load(createGameState(scenario))
}

const gameOver = computed<boolean>(() => phase.value === 'game-over')

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

// Translate a drag into/out of the tableau into an engine command. The engine is
// the sole mutator; the reactive state then redraws the lists.
// TODO: this diffing against vuedraggable's emitted array is awkward — revisit
// how drag-and-drop talks to the engine (and the disabled in-list reorder).
function onTableauUpdate(next: Card[]): void {
  const current = tableau.value
  const added = next.find((card) => !current.some((existing) => existing.id === card.id))
  if (added) {
    game.engine.playCard(added)
    return
  }
  const removed = current.find((card) => !next.some((existing) => existing.id === card.id))
  if (removed) game.engine.returnCard(removed)
}

function onHexClick(coord: Coord): void {
  if (phase.value === 'movement') game.engine.move(coord)
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
      <ResourceBar v-if="ready" :resources="resources" />
    </header>

    <p v-if="!ready" class="loading-hint">Loading story…</p>

    <template v-else>
    <section class="board-area">
      <div class="board-frame">
        <HexGrid
          :cells="cells"
          :player-position="playerPosition"
          :highlight-set="game.reachable"
          :drop-mode="phase === 'narrative-intervention'"
          :dimmed="eventOpen"
          @hex-click="onHexClick"
        />

        <p v-if="movementHint" class="movement-hint">{{ movementHint }}</p>

        <div v-if="eventOpen" class="event-anchor">
          <EventPanel
            :text="currentEvent!.text"
            :tableau="tableau"
            :can-confirm="true"
            :disabled="gameOver"
            @update:tableau="onTableauUpdate"
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
      <PlayerHand :model-value="hand" :disabled="dragLocked" />
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
    radial-gradient(1200px 600px at 50% -20%, var(--st-wood) 0%, transparent 70%),
    linear-gradient(180deg, var(--st-wood-dark) 0%, var(--st-wood-darkest) 100%);
  color: var(--st-ink);
  box-sizing: border-box;
}
.top-bar {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid var(--st-wood-border);
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
  color: var(--st-ink);
  white-space: nowrap;
}
.top-bar nav {
  display: flex;
  align-items: baseline;
  gap: 1rem;
}
.top-bar nav :deep(a) {
  color: var(--st-gold);
  text-decoration: none;
  border-bottom: 1px dashed var(--st-gold-line);
  padding-bottom: 1px;
  font-size: 0.9rem;
}
.top-bar nav .new-game {
  background: none;
  border: none;
  border-bottom: 1px dashed var(--st-gold-line);
  padding: 0 0 1px;
  color: var(--st-gold);
  font: inherit;
  font-size: 0.9rem;
  cursor: pointer;
}
.top-bar nav .new-game:hover {
  color: var(--st-ink-bright);
}
.top-bar nav :deep(a:hover) {
  color: var(--st-ink-bright);
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
  border: 1px solid var(--st-wood-border-strong);
  background:
    radial-gradient(900px 500px at 50% 30%, var(--st-board-light) 0%, var(--st-board-mid) 70%, var(--st-board-dark) 100%);
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
  color: var(--st-gold);
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
  color: var(--st-ink-bright);
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
  background: linear-gradient(180deg, var(--st-wood-dark) 0%, var(--st-wood-abyss) 100%);
  border-top: 1px solid var(--st-wood-border);
  box-shadow: 0 -8px 16px rgba(0, 0, 0, 0.45);
}
</style>
