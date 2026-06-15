// Vue/Pinia wrapper around the pure ScenarioEditor, mirroring game/useGame.ts:
// it holds a reactive ScenarioDraft, hands it to the editor, and exposes the
// editor handle plus derived values (validation issues, terrain colors, the
// editable canvas footprint, and the toolbar's width/height/seed). The editor is
// the sole writer of the draft; components read through `draft`.
import { computed, reactive, ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'
import { ScenarioDraft } from '@/editor/scenarioDraft'
import { ScenarioEditor } from '@/editor/scenarioEditor'
import {
  generateBlankScenario,
  generateDeck,
  generateEvents,
  generateTerrains,
} from '@/editor/scenarioGenerator'
import { loadScenario, saveScenario } from '@/infrastructure/scenarioStorage'
import { enumerateRect, neighborsOf, coordKey, recenterCoords, type Coord } from '@/engine/hexGrid'
import { createRandom } from '@/engine/random'
import type { HexCell, Scenario } from '@/engine/types/scenario'

// What the "Regenerate…" dialog asks the store to rebuild.
export interface RegenerateOptions {
  terrainCount: number
  eventCount: number
  deckSize: number
  narrativeCount: number
  regenerateTerrains: boolean
  regenerateEvents: boolean
  regenerateDeck: boolean
}

const DEFAULT_SIZE = 3
const DEFAULT_CANVAS = recenterCoords(enumerateRect(DEFAULT_SIZE, DEFAULT_SIZE))

function makeEditor(scenario: Scenario): ScenarioEditor {
  // reactive() so editor mutations re-render the UI; the editor itself is held
  // in a shallowRef and is never proxied.
  return new ScenarioEditor(reactive(ScenarioDraft.from(scenario)) as ScenarioDraft)
}

// Footprint for a loaded scenario: its cells plus a one-hex halo of neighbors,
// so the author can grow the map outward from the authored shape. Stored as
// actual coords (not a bounding box) so the pointy-top row offsets survive — a
// bbox would be re-expanded into a sheared rhombus on screen.
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
  // The editor owns generation, so it seeds a blank slate when storage is empty —
  // unlike the game, which refuses to invent a story.
  const stored = loadScenario()
  const initial = stored ?? generateBlankScenario()
  const editor = shallowRef<ScenarioEditor>(makeEditor(initial))
  const canvas = ref<Coord[]>(stored ? canvasFromCells(stored.mapData.cells) : [...DEFAULT_CANVAS])

  // Toolbar state: canvas size sliders and the generation seed.
  const width = ref(DEFAULT_SIZE)
  const height = ref(DEFAULT_SIZE)
  const seed = ref(1)

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

  // Full reset: a blank slate (3×3 ghost canvas, one start cell, no events/deck).
  function clearScenario(): void {
    const scenario = generateBlankScenario()
    saveScenario(scenario)
    editor.value = makeEditor(scenario)
    width.value = DEFAULT_SIZE
    height.value = DEFAULT_SIZE
    canvas.value = recenterCoords(enumerateRect(DEFAULT_SIZE, DEFAULT_SIZE))
  }

  // Live, non-destructive: only the ghost footprint changes; authored cells stay
  // (cells outside the footprint still render via MapTab's fallback).
  function resizeCanvas(newWidth: number, newHeight: number): void {
    width.value = newWidth
    height.value = newHeight
    canvas.value = recenterCoords(enumerateRect(newWidth, newHeight))
  }

  // Assign a random real terrain to every blank cell (authored cells untouched).
  function fillCells(): void {
    editor.value.fillBlankTerrains(createRandom(seed.value))
  }

  // Generate a fresh terrain palette, event pool and/or deck from the seed. The
  // order matters: terrains and events are rebuilt before the deck so a
  // regenerated deck can point its narrative cards at the fresh terrains/event ids.
  function regenerateContent(options: RegenerateOptions): void {
    const random = createRandom(seed.value)
    const activeEditor = editor.value
    if (options.regenerateTerrains) {
      activeEditor.replaceTerrains(generateTerrains(random, options.terrainCount))
    }
    let eventIds = activeEditor.draft.events.map((event) => event.id)
    if (options.regenerateEvents) {
      const events = generateEvents(random, options.eventCount)
      activeEditor.replaceEvents(events)
      eventIds = events.map((event) => event.id)
    }
    if (options.regenerateDeck) {
      const terrains = activeEditor.draft.terrains.map((terrain) => terrain.name)
      activeEditor.replaceDeck(
        generateDeck(random, options.deckSize, options.narrativeCount, eventIds, terrains),
      )
    }
  }

  function randomizeSeed(): void {
    seed.value = Math.floor(Math.random() * 1_000_000_000)
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
    width,
    height,
    seed,
    load,
    clearScenario,
    resizeCanvas,
    fillCells,
    regenerateContent,
    randomizeSeed,
    save,
  }
})
