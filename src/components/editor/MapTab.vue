<script setup lang="ts">
import { computed, ref } from 'vue'
import HexGrid from '@/components/board/HexGrid.vue'
import TerrainPalette from '@/components/editor/TerrainPalette.vue'
import AutogenDrawer from '@/components/editor/AutogenDrawer.vue'
import RawJsonDrawer from '@/components/editor/RawJsonDrawer.vue'
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

const startKey = computed(() => coordKey(store.draft.meta.startingPosition))
const selectedKey = computed(() => (selected.value ? coordKey(selected.value) : undefined))
const selectedCell = computed(() => (selected.value ? store.draft.cellAt(selected.value) : undefined))

// The grid the editor paints over: every real cell, plus a "ghost" for each
// in-canvas coord that has no cell yet. Ghosts are not part of the map until the
// author paints/shapes them; blank cells are playable but unfilled.
const renderCells = computed<HexCell[]>(() => {
  const cells: HexCell[] = []
  const seen = new Set<string>()
  const { minQ, maxQ, minR, maxR } = store.canvas
  for (let r = minR; r <= maxR; r++) {
    for (let q = minQ; q <= maxQ; q++) {
      const real = store.draft.cellAt({ q, r })
      if (real) {
        cells.push(real)
        seen.add(coordKey({ q, r }))
      } else {
        cells.push({ q, r, terrain: '', event_id: null, is_revealed: false })
      }
    }
  }
  // Keep any real cells that fall outside the current canvas bounds.
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

function onRecenter(): void {
  store.editor.recenter()
}
</script>

<template>
  <div class="map-tab">
    <div class="left">
      <div class="toolbar">
        <button type="button" @click="onRecenter">Recenter</button>
        <span class="hint">Brush: {{ brush.kind }}</span>
      </div>
      <div class="grid-wrapper">
        <HexGrid
          :cells="renderCells"
          :terrain-colors="store.terrainColors"
          :ghost-keys="ghostKeys"
          :blank-keys="blankKeys"
          :selected-key="selectedKey"
          :start-key="startKey"
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

      <AutogenDrawer />
      <RawJsonDrawer />
    </div>

    <TerrainPalette
      v-model="brush"
      :terrains="store.draft.terrains"
      :events="store.draft.events"
      class="right"
    />
  </div>
</template>

<style scoped>
.map-tab {
  display: grid;
  grid-template-columns: 1fr 240px;
  gap: 0;
  height: 100%;
  min-height: 0;
}
.left {
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.toolbar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  border-bottom: 1px solid #eee;
}
.toolbar button {
  border: 1px solid #ccc;
  border-radius: 4px;
  background: white;
  padding: 0.35rem 0.7rem;
  cursor: pointer;
}
.hint {
  font-size: 0.85rem;
  color: #666;
}
.grid-wrapper {
  flex: 1;
  min-height: 320px;
  background: #fdfdfa;
}
.inspector {
  display: flex;
  gap: 1rem;
  align-items: center;
  padding: 0.5rem 0.75rem;
  border-top: 1px solid #eee;
  font-size: 0.85rem;
}
.inspector.empty {
  color: #999;
  margin: 0;
}
.start-tag {
  color: #0033aa;
  font-weight: bold;
}
.right {
  min-height: 0;
}
</style>
