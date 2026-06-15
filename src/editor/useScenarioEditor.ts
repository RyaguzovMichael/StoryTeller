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
import { enumerateRect, recenterCoords, type Coord } from '@/engine/hexGrid'
import { createRandom } from '@/engine/random'
import type { Scenario } from '@/engine/types/scenario'

// The rectangle of axial coords the editor paints over. Cells outside it are not
// shown; coords inside it without a cell render as ghosts the author can fill.
export interface CanvasBounds {
  minQ: number
  maxQ: number
  minR: number
  maxR: number
}

const DEFAULT_CANVAS: CanvasBounds = { minQ: -2, maxQ: 2, minR: -2, maxR: 2 }
const CANVAS_MARGIN = 1

function makeEditor(scenario: Scenario): ScenarioEditor {
  // reactive() so editor mutations re-render the UI; the editor itself is held
  // in a shallowRef and is never proxied.
  return new ScenarioEditor(reactive(ScenarioDraft.from(scenario)) as ScenarioDraft)
}

function boundsOfCoords(coords: readonly Coord[], margin = 0): CanvasBounds {
  if (coords.length === 0) return { ...DEFAULT_CANVAS }
  let minQ = Infinity
  let maxQ = -Infinity
  let minR = Infinity
  let maxR = -Infinity
  for (const coord of coords) {
    minQ = Math.min(minQ, coord.q)
    maxQ = Math.max(maxQ, coord.q)
    minR = Math.min(minR, coord.r)
    maxR = Math.max(maxR, coord.r)
  }
  return { minQ: minQ - margin, maxQ: maxQ + margin, minR: minR - margin, maxR: maxR + margin }
}

export const useScenarioEditor = defineStore('scenarioEditor', () => {
  // The editor owns generation, so it seeds a default when storage is empty —
  // unlike the game, which refuses to invent a story.
  const initial = loadScenario() ?? generateBlankScenario(DEFAULT_PARAMS)
  const editor = shallowRef<ScenarioEditor>(makeEditor(initial))
  const canvas = ref<CanvasBounds>(boundsOfCoords(initial.mapData.cells, CANVAS_MARGIN))

  const draft = computed(() => editor.value.draft)
  const issues = computed(() => editor.value.draft.validate())
  const terrainColors = computed<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    for (const terrain of editor.value.draft.terrains) map[terrain.name] = terrain.color
    return map
  })

  function load(scenario: Scenario): void {
    editor.value = makeEditor(scenario)
    canvas.value = boundsOfCoords(scenario.mapData.cells, CANVAS_MARGIN)
  }

  // Start over: a blank canvas sized W×H of ghosts (only the start cell authored).
  function newCanvas(params: GeneratorParams): void {
    const scenario = generateBlankScenario(params)
    saveScenario(scenario)
    editor.value = makeEditor(scenario)
    canvas.value = boundsOfCoords(recenterCoords(enumerateRect(params.mapWidth, params.mapHeight)))
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
