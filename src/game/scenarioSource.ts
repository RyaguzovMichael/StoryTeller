// Orchestrates where a scenario comes from: load the persisted one, or generate
// a default and save it. Kept out of the persistence layer (storage stays pure
// load/save) and out of the views (they stay dumb) — this is the one place that
// ties storage to the editor's generator.
import type { Scenario } from '@/engine/types/scenario'
import { loadScenario, saveScenario } from '@/infrastructure/scenarioStorage'
import { generateScenario, DEFAULT_PARAMS } from '@/editor/scenarioGenerator'

export function loadOrCreateScenario(): Scenario {
  const existing = loadScenario()
  if (existing) return existing
  const generated = generateScenario(DEFAULT_PARAMS)
  saveScenario(generated)
  return generated
}
