// Vue/Pinia wrapper around the pure ScenarioEditor, mirroring game/useGame.ts:
// it holds a reactive ScenarioDraft, hands it to the editor, and exposes the
// editor handle plus derived values (validation issues, terrain colors, the
// editable canvas bounds). The editor is the sole writer of the draft;
// components read through `draft`.
import { computed, reactive, ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'
import { ScenarioDraft } from '@/editor/scenarioDraft'
import { ScenarioEditor } from '@/editor/scenarioEditor'
import {
  DEFAULT_PARAMS,
  generateBlankScenario,
  generateEvents,
  type GeneratorParams,
} from '@/editor/scenarioGenerator'
import { loadScenario, saveScenario } from '@/infrastructure/scenarioStorage'
import { enumerateRect, neighborsOf, coordKey, recenterCoords, type Coord } from '@/engine/hexGrid'
import { createRandom } from '@/engine/random'
import type { HexCell, Scenario } from '@/engine/types/scenario'

function makeEditor(scenario: Scenario): ScenarioEditor {
  // reactive() so editor mutations re-render the UI; the editor itself is held
  // in a shallowRef and is never proxied.
  return new ScenarioEditor(reactive(ScenarioDraft.from(scenario)) as ScenarioDraft)
}

// The footprint the editor paints over: an explicit list of axial coords. Coords
// without a cell render as ghosts the author can fill. Stored as actual coords
// (not a bounding box) so the pointy-top row offsets survive — a bbox would be
// re-expanded into a sheared rhombus on screen.
const DEFAULT_CANVAS = recenterCoords(enumerateRect(5, 5))

// Footprint for a loaded scenario: its cells plus a one-hex halo of neighbors,
// so the author can grow the map outward from the authored shape.
function canvasFromCells(cells: readonly HexCell[]): Coord[] {
  if (cells.length === 0) return [...DEFAULT_CANVAS]
  const footprint = new Map<string, Coord>()
  for (const cell of cells) {
    footprint.set(coordKey(cell), { q: cell.q, r: cell.r })
    for (const neighbor of neighborsOf(cell)) footprint.set(coordKey(neighbor), neighbor)
  }
  return [...footprint.values()]
}

export const useScenarioEditor = defineStore('scenarioEditor', () => {
  // The editor owns generation, so it seeds a default when storage is empty —
  // unlike the game, which refuses to invent a story.
  const stored = loadScenario()
  const initial = stored ?? generateBlankScenario(DEFAULT_PARAMS)
  const editor = shallowRef<ScenarioEditor>(makeEditor(initial))
  const canvas = ref<Coord[]>(
    stored ? canvasFromCells(stored.mapData.cells) : [...DEFAULT_CANVAS],
  )

  const draft = computed(() => editor.value.draft)
  const issues = computed(() => editor.value.draft.validate())
  const terrainColors = computed<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    for (const terrain of editor.value.draft.terrains) map[terrain.name] = terrain.color
    return map
  })

  function load(scenario: Scenario): void {
    editor.value = makeEditor(scenario)
    canvas.value = canvasFromCells(scenario.mapData.cells)
  }

  // Start over: a blank canvas sized W×H of ghosts (only the start cell authored).
  function newCanvas(params: GeneratorParams): void {
    const scenario = generateBlankScenario(params)
    saveScenario(scenario)
    editor.value = makeEditor(scenario)
    canvas.value = recenterCoords(enumerateRect(params.mapWidth, params.mapHeight))
  }

  // Assign a random real terrain to every blank cell (authored cells untouched).
  function fillCells(): void {
    editor.value.fillBlankTerrains(createRandom(Date.now()))
  }

  // Swap in a fresh event pool; clears events from the map and card overwrites.
  function regenerateEvents(count: number): void {
    editor.value.replaceEvents(generateEvents(createRandom(Date.now()), count))
  }

  function save(): void {
    saveScenario(editor.value.draft.toScenario())
  }

  return {
    editor,
    draft,
    issues,
    terrainColors,
    canvas,
    load,
    newCanvas,
    fillCells,
    regenerateEvents,
    save,
  }
})
