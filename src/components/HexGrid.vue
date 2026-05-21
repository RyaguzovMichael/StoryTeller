<script setup lang="ts">
import { computed } from 'vue'
import type { Coord, HexCell } from '@/types/scenario'
import { HEX_SIZE, axialToPixel, coordKey, hexCorners, viewBoxFor } from '@/utils/hexGrid'

const props = defineProps<{
  cells: HexCell[]
  radius: number
  playerPosition?: Coord
  highlightSet?: Set<string>
  dropMode?: boolean
}>()

const emit = defineEmits<{
  (e: 'hex-click', coord: Coord): void
  (e: 'hex-drop', coord: Coord): void
}>()

const viewBox = computed(() => viewBoxFor(props.radius, HEX_SIZE, 16))

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
    const { x, y } = axialToPixel({ q: cell.q, r: cell.r })
    const key = coordKey({ q: cell.q, r: cell.r })
    const isPlayer =
      !!props.playerPosition &&
      props.playerPosition.q === cell.q &&
      props.playerPosition.r === cell.r
    const highlighted = props.highlightSet?.has(key) ?? false
    return {
      cell,
      cx: x,
      cy: y,
      points: hexCorners({ x, y }),
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

function onHexDragOver(event: DragEvent): void {
  if (props.dropMode) event.preventDefault()
}

function onHexDrop(event: DragEvent, coord: Coord): void {
  if (!props.dropMode) return
  event.preventDefault()
  emit('hex-drop', coord)
}
</script>

<template>
  <svg :viewBox="viewBox" class="hex-grid" xmlns="http://www.w3.org/2000/svg">
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
      @dragover="onHexDragOver"
      @drop="onHexDrop($event, { q: r.cell.q, r: r.cell.r })"
    >
      <polygon
        :points="r.points"
        :fill="fillFor(r.cell)"
        :fill-opacity="r.cell.is_revealed ? 1 : 0.35"
        stroke="#222"
        :stroke-width="r.isPlayer ? 3 : 1"
      />
      <text
        :x="r.cx"
        :y="r.cy - 4"
        text-anchor="middle"
        font-size="9"
        fill="#222"
      >
        {{ r.cell.terrain }}
      </text>
      <text
        v-if="r.cell.event_id && r.cell.is_revealed"
        :x="r.cx"
        :y="r.cy + 8"
        text-anchor="middle"
        font-size="8"
        fill="#330000"
      >
        ★
      </text>
      <text
        v-if="r.isPlayer"
        :x="r.cx"
        :y="r.cy + 20"
        text-anchor="middle"
        font-size="14"
        font-weight="bold"
        fill="#0033aa"
      >
        ◉
      </text>
    </g>
  </svg>
</template>

<style scoped>
.hex-grid {
  width: 100%;
  height: 100%;
  display: block;
  user-select: none;
}
.hex {
  cursor: default;
}
.hex.highlighted polygon {
  stroke: #0033aa;
  stroke-width: 2.5;
}
.hex.highlighted {
  cursor: pointer;
}
.hex.droppable {
  cursor: copy;
}
</style>
