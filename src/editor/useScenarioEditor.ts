// Vue/Pinia wrapper around the pure ScenarioEditor, mirroring game/useGame.ts:
// it holds a reactive ScenarioDraft, hands it to the editor, and exposes the
// editor handle plus derived values (validation issues, terrain colors). The
// editor is the sole writer of the draft; components read through `draft`.
import { computed, reactive, shallowRef } from 'vue'
import { defineStore } from 'pinia'
import { ScenarioDraft } from '@/editor/scenarioDraft'
import { ScenarioEditor } from '@/editor/scenarioEditor'
import { DEFAULT_PARAMS, generateScenario, type GeneratorParams } from '@/editor/scenarioGenerator'
import { loadScenario, saveScenario } from '@/infrastructure/scenarioStorage'
import type { Scenario } from '@/engine/types/scenario'

function makeEditor(scenario: Scenario): ScenarioEditor {
  // reactive() so editor mutations re-render the UI; the editor itself is held
  // in a shallowRef and is never proxied.
  return new ScenarioEditor(reactive(ScenarioDraft.from(scenario)) as ScenarioDraft)
}

export const useScenarioEditor = defineStore('scenarioEditor', () => {
  // The editor owns generation, so it seeds a default when storage is empty —
  // unlike the game, which refuses to invent a story.
  const initial = loadScenario() ?? generateScenario(DEFAULT_PARAMS)
  const editor = shallowRef<ScenarioEditor>(makeEditor(initial))

  const draft = computed(() => editor.value.draft)
  const issues = computed(() => editor.value.draft.validate())
  const terrainColors = computed<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    for (const terrain of editor.value.draft.terrains) map[terrain.name] = terrain.color
    return map
  })

  function load(scenario: Scenario): void {
    editor.value = makeEditor(scenario)
  }

  function regenerate(params: GeneratorParams): void {
    const scenario = generateScenario(params)
    saveScenario(scenario)
    editor.value = makeEditor(scenario)
  }

  function save(): void {
    saveScenario(editor.value.draft.toScenario())
  }

  return { editor, draft, issues, terrainColors, load, regenerate, save }
})
