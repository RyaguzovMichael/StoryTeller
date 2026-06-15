<script setup lang="ts">
import { computed, ref } from 'vue'
import HexGrid from '@/components/board/HexGrid.vue'
import TerrainPalette from '@/components/editor/TerrainPalette.vue'
import GenerateDialog from '@/components/editor/GenerateDialog.vue'
import { useScenarioEditor } from '@/editor/useScenarioEditor'
import { useNotificationStore } from '@/notifications/notificationStore'
import { coordKey, type Coord } from '@/engine/hexGrid'
import { BLANK_TERRAIN } from '@/editor/scenarioDraft'
import type { HexCell } from '@/engine/types/scenario'
import type { Brush } from '@/components/editor/brush'

const store = useScenarioEditor()
const notifications = useNotificationStore()

const brush = ref<Brush>({ kind: 'inspect' })
const selected = ref<Coord | null>(null)
const zoom = ref(1)
const showGenerate = ref(false)

const startKey = computed(() => coordKey(store.draft.meta.startingPosition))
const selectedKey = computed(() => (selected.value ? coordKey(selected.value) : undefined))
const selectedCell = computed(() => (selected.value ? store.draft.cellAt(selected.value) : undefined))

// The grid the editor paints over: every real cell, plus a "ghost" for each
// in-canvas coord that has no cell yet. Ghosts are not part of the map until the
// author paints/shapes them; blank cells are playable but unfilled.
const renderCells = computed<HexCell[]>(() => {
  const cells: HexCell[] = []
  const seen = new Set<string>()
  for (const coord of store.canvas) {
    const key = coordKey(coord)
    if (seen.has(key)) continue
    seen.add(key)
    const real = store.draft.cellAt(coord)
    cells.push(real ?? { q: coord.q, r: coord.r, terrain: '', event_id: null, is_revealed: false })
  }
  // Keep any real cells that fall outside the current canvas footprint.
  for (const cell of store.draft.cells) {
    if (!seen.has(coordKey(cell))) cells.push(cell)
  }
  return cells
})

const ghostKeys = computed(() => {
  const keys = new Set<string>()
  for (const cell of renderCells.value) {
    if (!store.draft.cellAt(cell)) keys.add(coordKey(cell))
  }
  return keys
})

const blankKeys = computed(() => {
  const keys = new Set<string>()
  for (const cell of store.draft.cells) {
    if (cell.terrain === BLANK_TERRAIN) keys.add(coordKey(cell))
  }
  return keys
})

function onHexClick(coord: Coord): void {
  const active = brush.value
  if (active.kind === 'inspect') {
    selected.value = { q: coord.q, r: coord.r }
    return
  }
  try {
    switch (active.kind) {
      case 'terrain':
        store.editor.paintTerrain(coord, active.name)
        break
      case 'event':
        store.editor.assignEvent(coord, active.id)
        break
      case 'clear-event':
        store.editor.assignEvent(coord, null)
        break
      case 'start':
        store.editor.setStart(coord)
        break
      case 'blank':
        store.editor.markBlank(coord)
        break
      case 'remove':
        store.editor.removeCell(coord)
        if (selected.value && coordKey(selected.value) === coordKey(coord)) selected.value = null
        break
    }
  } catch (err) {
    notifications.push(err instanceof Error ? err.message : 'Edit failed', 'info')
  }
}

function onWidth(value: number): void {
  store.resizeCanvas(value, store.height)
}
function onHeight(value: number): void {
  store.resizeCanvas(store.width, value)
}

function onFill(): void {
  try {
    store.fillCells()
    notifications.push('Blank cells filled with terrain.', 'info')
  } catch (err) {
    notifications.push(err instanceof Error ? err.message : 'Fill failed', 'info')
  }
}

function onClear(): void {
  store.clearScenario()
  selected.value = null
  notifications.push('Scenario cleared to a blank canvas.', 'info')
}

function onRecenter(): void {
  store.editor.recenter()
}

const issueTooltip = computed(() =>
  store.issues.length ? store.issues.map((issue) => issue.message).join('\n') : 'Save scenario',
)

function onSave(): void {
  store.save()
  notifications.push('Scenario saved.', 'info')
}
</script>

<template>
  <div class="map-tab">
    <div class="left">
      <div class="toolbar">
        <div class="tools">
          <label class="slider">
            W
            <input
              type="range" min="1" max="20" step="1" :value="store.width"
              @input="onWidth(Number(($event.target as HTMLInputElement).value))"
            />
            <span>{{ store.width }}</span>
          </label>
          <label class="slider">
            H
            <input
              type="range" min="1" max="20" step="1" :value="store.height"
              @input="onHeight(Number(($event.target as HTMLInputElement).value))"
            />
            <span>{{ store.height }}</span>
          </label>
          <label class="slider">
            Zoom
            <input v-model.number="zoom" type="range" min="0.4" max="2.5" step="0.1" />
          </label>
          <button type="button" @click="onRecenter">Recenter</button>
          <button type="button" @click="onFill">Fill blank cells</button>
          <button type="button" @click="showGenerate = true">Regenerate…</button>
          <button type="button" @click="onClear">Clear scenario</button>
          <button
            type="button"
            :disabled="store.issues.length > 0"
            :title="issueTooltip"
            @click="onSave"
          >
            {{ store.issues.length ? '⚠ ' : '' }}Save
          </button>
        </div>
        <div class="seed-group">
          <label class="seed">Seed<input v-model.number="store.seed" type="number" /></label>
          <button type="button" class="dice" title="Random seed" @click="store.randomizeSeed">🎲</button>
        </div>
      </div>

      <div class="grid-wrapper">
        <HexGrid
          :cells="renderCells"
          :terrain-colors="store.terrainColors"
          :ghost-keys="ghostKeys"
          :blank-keys="blankKeys"
          :selected-key="selectedKey"
          :start-key="startKey"
          :zoom="zoom"
          editing
          @hex-click="onHexClick"
        />
      </div>

      <div v-if="selectedCell" class="inspector">
        <strong>Cell ({{ selectedCell.q }}, {{ selectedCell.r }})</strong>
        <span>terrain: {{ selectedCell.terrain === '' ? '(blank)' : selectedCell.terrain }}</span>
        <span>event: {{ selectedCell.event_id ?? '—' }}</span>
        <span v-if="coordKey(selectedCell) === startKey" class="start-tag">start</span>
      </div>
      <p v-else-if="selected" class="inspector empty">
        Cell ({{ selected.q }}, {{ selected.r }}): ghost — not playable.
      </p>
      <p v-else class="inspector empty">Pick the Inspect brush and click a hex to see its state.</p>
    </div>

    <TerrainPalette
      v-model="brush"
      :terrains="store.draft.terrains"
      :events="store.draft.events"
      class="right"
    />

    <GenerateDialog v-if="showGenerate" @close="showGenerate = false" />
  </div>
</template>

<style scoped>
.map-tab {
  display: grid;
  grid-template-columns: 1fr 240px;
  gap: 0;
  height: 100%;
  min-height: 0;
  background: var(--st-wood-dark);
  color: var(--st-ink);
}
.left {
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.6rem;
  border-bottom: 1px solid var(--st-wood-border);
  flex-wrap: wrap;
}
.tools,
.seed-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.toolbar button {
  border: 1px solid var(--st-wood-border);
  border-radius: 4px;
  background: var(--st-wood-darkest);
  color: var(--st-ink);
  padding: 0.35rem 0.7rem;
  cursor: pointer;
}
.slider {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.8rem;
  color: var(--st-gold-muted);
}
.slider input[type='range'] {
  width: 90px;
}
.slider span {
  width: 1.6rem;
  text-align: right;
  color: var(--st-ink);
}
.seed {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.8rem;
  color: var(--st-gold-muted);
}
.seed input {
  width: 6rem;
  padding: 0.3rem;
  background: var(--st-parchment);
  color: var(--st-parchment-ink);
  border: 1px solid var(--st-parchment-border);
  border-radius: 4px;
}
.dice {
  padding: 0.3rem 0.5rem !important;
}
.grid-wrapper {
  flex: 1;
  min-height: 320px;
  background: var(--st-wood-darkest);
}
.inspector {
  display: flex;
  gap: 1rem;
  align-items: center;
  padding: 0.5rem 0.75rem;
  border-top: 1px solid var(--st-wood-border);
  font-size: 0.85rem;
  color: var(--st-ink);
}
.inspector.empty {
  color: var(--st-gold-muted);
  margin: 0;
}
.start-tag {
  color: var(--st-gold);
  font-weight: bold;
}
.right {
  min-height: 0;
}
</style>
