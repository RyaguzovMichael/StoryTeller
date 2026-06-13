<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { Coord, HexCell } from '@/types/scenario'
import { coordKey } from '@/utils/hexGrid'
import { HEX_SIZE, HexLayout } from '@/utils/hexLayout'

const props = defineProps<{
  cells: HexCell[]
  playerPosition?: Coord
  highlightSet?: Set<string>
  dropMode?: boolean
  dimmed?: boolean
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
    return {
      cell,
      cx: center.x,
      cy: center.y,
      points: layout.value.hexCorners(center),
      key,
      highlighted,
      isPlayer,
    }
  }),
)

const TERRAIN_FILL: Record<string, string> = {
  plains: '#cdd9a3',
  swamp: '#7a8c5c',
  forest: '#4f7a4a',
  tavern: '#c08a4a',
  ruin: '#9c9c9c',
}

function fillFor(cell: HexCell): string {
  return TERRAIN_FILL[cell.terrain] ?? '#bbbbbb'
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
        }"
        @click="onHexClick({ q: r.cell.q, r: r.cell.r })"
      >
        <polygon
          :points="r.points"
          :fill="fillFor(r.cell)"
          :fill-opacity="r.cell.is_revealed ? 1 : 0.35"
          stroke="#222"
          :stroke-width="r.isPlayer ? playerStroke : baseStroke"
        />
        <text
          :x="r.cx"
          :y="r.cy - terrainYOffset"
          text-anchor="middle"
          :font-size="terrainFontSize"
          fill="#222"
        >
          {{ r.cell.terrain }}
        </text>
        <text
          v-if="r.cell.event_id && r.cell.is_revealed"
          :x="r.cx"
          :y="r.cy + eventYOffset"
          text-anchor="middle"
          :font-size="eventFontSize"
          fill="#330000"
        >
          ★
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
  stroke: #0033aa;
}
.hex.highlighted {
  cursor: pointer;
}
.hex.droppable {
  cursor: pointer;
}
.hex.droppable polygon {
  stroke: #993333;
  stroke-dasharray: 2 2;
}
</style>
