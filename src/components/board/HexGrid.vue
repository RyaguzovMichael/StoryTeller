<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { HexCell } from '@/engine/types/scenario'
import { coordKey, type Coord } from '@/engine/hexGrid'
import { HEX_SIZE, HexLayout } from '@/components/board/hexLayout'

const props = defineProps<{
  cells: readonly HexCell[]
  playerPosition?: Coord
  highlightSet?: Set<string>
  dropMode?: boolean
  dimmed?: boolean
  terrainColors?: Record<string, string>
  // Editor affordances: render every cell at full opacity and show event markers
  // regardless of is_revealed, mark the selected/start cells.
  editing?: boolean
  selectedKey?: string
  startKey?: string
  // Editor map states: ghost = in-canvas coord that is not a playable cell;
  // blank = a playable cell with no terrain yet. Both render muted and label-less.
  ghostKeys?: Set<string>
  blankKeys?: Set<string>
}>()

const emit = defineEmits<{
  (e: 'hex-click', coord: Coord): void
}>()

// Camera zoom: pixels of screen space per SVG unit. With VIEW_SCALE=2.5 and
// HEX_SIZE=24, hexes render at 24 * 2.5 = 60 px circumradius on screen.
const VIEW_SCALE = 2.5

const containerRef = ref<HTMLElement | null>(null)
const containerW = ref(800)
const containerH = ref(500)

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  if (!containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  containerW.value = Math.max(rect.width, 1)
  containerH.value = Math.max(rect.height, 1)
  resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      containerW.value = Math.max(entry.contentRect.width, 1)
      containerH.value = Math.max(entry.contentRect.height, 1)
    }
  })
  resizeObserver.observe(containerRef.value)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
})

// Hex size lives in a ref so the layout can later become reactive (zoom, scale).
// Rebuilding the HexLayout whenever the size changes recomputes all geometry.
const hexSize = ref(HEX_SIZE)
const layout = computed(() => new HexLayout(hexSize.value))

const cameraCenter = computed(() => {
  if (!props.playerPosition) return { x: 0, y: 0 }
  return layout.value.axialToPixel(props.playerPosition)
})

// With a player present (game), the camera follows the player at a fixed zoom.
// Without a player (editor preview), frame the whole map regardless of its shape.
const viewBox = computed(() => {
  if (!props.playerPosition) {
    return layout.value.viewBoxForCells(props.cells)
  }
  const viewWidth = containerW.value / VIEW_SCALE
  const viewHeight = containerH.value / VIEW_SCALE
  const originX = cameraCenter.value.x - viewWidth / 2
  const originY = cameraCenter.value.y - viewHeight / 2
  return `${originX} ${originY} ${viewWidth} ${viewHeight}`
})

// "slice" fills the container (camera mode); "meet" fits the whole map in view.
const aspectMode = computed(() =>
  props.playerPosition ? 'xMidYMid slice' : 'xMidYMid meet',
)

const terrainFontSize = computed(() => hexSize.value * 0.28)
const eventFontSize = computed(() => hexSize.value * 0.4)
const playerFontSize = computed(() => hexSize.value * 0.6)
const terrainYOffset = computed(() => hexSize.value * 0.1)
const eventYOffset = computed(() => hexSize.value * 0.35)
const playerYOffset = computed(() => hexSize.value * 0.7)
const baseStroke = computed(() => hexSize.value * 0.04)
const playerStroke = computed(() => hexSize.value * 0.11)

interface RenderedCell {
  cell: HexCell
  cx: number
  cy: number
  points: string
  key: string
  highlighted: boolean
  isPlayer: boolean
  selected: boolean
  isStart: boolean
  showEvent: boolean
  fillOpacity: number
  isGhost: boolean
  isBlank: boolean
}

const rendered = computed<RenderedCell[]>(() =>
  props.cells.map((cell) => {
    const center = layout.value.axialToPixel({ q: cell.q, r: cell.r })
    const key = coordKey({ q: cell.q, r: cell.r })
    const isPlayer =
      !!props.playerPosition &&
      props.playerPosition.q === cell.q &&
      props.playerPosition.r === cell.r
    const highlighted = props.highlightSet?.has(key) ?? false
    const revealed = props.editing || cell.is_revealed
    const isGhost = props.ghostKeys?.has(key) ?? false
    const isBlank = props.blankKeys?.has(key) ?? false
    return {
      cell,
      cx: center.x,
      cy: center.y,
      points: layout.value.hexCorners(center),
      key,
      highlighted,
      isPlayer,
      selected: props.selectedKey === key,
      isStart: props.startKey === key,
      showEvent: !!cell.event_id && revealed && !isGhost && !isBlank,
      fillOpacity: isGhost ? 0.12 : isBlank ? 0.32 : revealed ? 1 : 0.35,
      isGhost,
      isBlank,
    }
  }),
)

// Built-in fallback palette, used when the scenario carries no color for a
// terrain (or in the game, which does not yet pass authored colors).
const TERRAIN_FILL: Record<string, string> = {
  plains: '#cdd9a3',
  swamp: '#7a8c5c',
  forest: '#4f7a4a',
  tavern: '#c08a4a',
  ruin: '#9c9c9c',
}

// Single point that maps a cell to its rendered fill. Authored colors win, then
// the built-in fallback. This is the one place to extend when terrains gain
// images/patterns instead of a flat color.
function terrainFill(cell: HexCell): string {
  return props.terrainColors?.[cell.terrain] ?? TERRAIN_FILL[cell.terrain] ?? '#bbbbbb'
}

function onHexClick(coord: Coord): void {
  emit('hex-click', coord)
}
</script>

<template>
  <div ref="containerRef" class="hex-viewport">
    <svg
      :viewBox="viewBox"
      class="hex-grid"
      :class="{ dimmed }"
      :preserveAspectRatio="aspectMode"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g
        v-for="r in rendered"
        :key="r.key"
        class="hex"
        :class="{
          highlighted: r.highlighted,
          player: r.isPlayer,
          unrevealed: !r.cell.is_revealed,
          droppable: dropMode,
          selected: r.selected,
          ghost: r.isGhost,
          blank: r.isBlank,
        }"
        @click="onHexClick({ q: r.cell.q, r: r.cell.r })"
      >
        <polygon
          :points="r.points"
          :fill="terrainFill(r.cell)"
          :fill-opacity="r.fillOpacity"
          stroke="#222"
          :stroke-width="r.isPlayer ? playerStroke : baseStroke"
        />
        <text
          v-if="!r.isGhost && !r.isBlank"
          :x="r.cx"
          :y="r.cy - terrainYOffset"
          text-anchor="middle"
          :font-size="terrainFontSize"
          fill="#222"
        >
          {{ r.cell.terrain }}
        </text>
        <text
          v-if="r.showEvent"
          :x="r.cx"
          :y="r.cy + eventYOffset"
          text-anchor="middle"
          :font-size="eventFontSize"
          fill="#330000"
        >
          ★
        </text>
        <text
          v-if="r.isStart"
          :x="r.cx"
          :y="r.cy + playerYOffset"
          text-anchor="middle"
          :font-size="playerFontSize"
          font-weight="bold"
          fill="#0033aa"
        >
          ⚑
        </text>
        <text
          v-if="r.isPlayer"
          :x="r.cx"
          :y="r.cy + playerYOffset"
          text-anchor="middle"
          :font-size="playerFontSize"
          font-weight="bold"
          fill="#0033aa"
        >
          ◉
        </text>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.hex-viewport {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
}
.hex-grid {
  width: 100%;
  height: 100%;
  display: block;
  user-select: none;
  transition: filter 220ms ease, opacity 220ms ease;
}
.hex-grid.dimmed {
  filter: grayscale(0.45) brightness(0.7);
  opacity: 0.55;
  pointer-events: none;
}
.hex {
  cursor: default;
  transition: transform 320ms ease;
}
.hex.highlighted polygon {
  stroke: var(--st-map-highlight);
}
.hex.highlighted {
  cursor: pointer;
}
.hex.selected polygon {
  stroke: var(--st-map-selected);
  stroke-width: 1.5;
}
.hex.ghost {
  cursor: pointer;
}
.hex.ghost polygon {
  stroke: var(--st-ghost);
  stroke-dasharray: 2 3;
  stroke-opacity: 0.5;
}
.hex.blank {
  cursor: pointer;
}
.hex.blank polygon {
  stroke: var(--st-blank);
}
.hex.droppable {
  cursor: pointer;
}
.hex.droppable polygon {
  stroke: var(--st-map-droppable);
  stroke-dasharray: 2 2;
}
</style>
