import type { Card, GameEvent, Outcome, Scenario, TerrainType } from '@/engine/types/scenario'
import type { Coord } from '@/engine/hexGrid'
import { createRandom, type Random } from '@/engine/random'

export interface GeneratorParams {
  mapWidth: number
  mapHeight: number
  deckSize: number
  eventCount: number
  narrativeCount: number
  seed: number
}

export const DEFAULT_PARAMS: GeneratorParams = {
  mapWidth: 5,
  mapHeight: 5,
  deckSize: 8,
  eventCount: 4,
  narrativeCount: 2,
  seed: 1,
}

// Default terrain palette: names paired with the fill colors HexGrid falls back
// to, so a freshly generated scenario carries its own colors.
const DEFAULT_TERRAINS: ReadonlyArray<TerrainType> = [
  { name: 'plains', color: '#cdd9a3' },
  { name: 'swamp', color: '#7a8c5c' },
  { name: 'forest', color: '#4f7a4a' },
  { name: 'tavern', color: '#c08a4a' },
  { name: 'ruin', color: '#9c9c9c' },
]
const TERRAINS: ReadonlyArray<string> = DEFAULT_TERRAINS.map((t) => t.name)
const RESOURCE_KEYS: ReadonlyArray<string> = ['health', 'gold']

const EVENT_TEXTS: ReadonlyArray<string> = [
  'A stranger blocks the path, eyes hidden beneath a cowl.',
  'Smoke rises from a campfire long abandoned.',
  'A weathered shrine offers either blessing or curse.',
  'The wind carries voices that should not be there.',
  'A wounded traveler begs for aid.',
  'A locked chest sits in plain sight.',
  'Footprints lead into the brush and stop.',
  'A merchant offers a deal too good to refuse.',
]

const CARD_TEXTS: ReadonlyArray<string> = [
  'Steady your nerve.',
  'Trust your instinct.',
  'Speak softly.',
  'Stand your ground.',
  'Look for a sign.',
  'Recall an old story.',
  'Wait, and listen.',
  'Move quickly.',
  'Strike first.',
  'Bargain.',
  'Pray.',
  'Run.',
]

const NARRATIVE_TEXTS: ReadonlyArray<string> = [
  'The road remembers a different name here.',
  'A storm rolls in; the land changes shape.',
  'An old map is redrawn before your eyes.',
  'A pact is made in whispers.',
]

function makeOutcome(rng: Random, sign: 1 | -1, intensity: number): Outcome {
  const key = rng.pick(RESOURCE_KEYS)
  const magnitude = sign * (rng.int(1, intensity))
  return {
    text:
      sign > 0
        ? `Fortune turns. ${key} ${magnitude >= 0 ? '+' : ''}${magnitude}.`
        : `It goes badly. ${key} ${magnitude}.`,
    resource_deltas: { [key]: magnitude },
  }
}

export function generateEvents(rng: Random, count: number): GameEvent[] {
  const events: GameEvent[] = []
  for (let i = 0; i < count; i++) {
    const difficulty = rng.int(3, 8)
    events.push({
      id: `evt-${i + 1}`,
      text: EVENT_TEXTS[i % EVENT_TEXTS.length] as string,
      difficulty,
      critical_threshold: difficulty + 3,
      success_outcome: makeOutcome(rng, 1, 3),
      fail_outcome: makeOutcome(rng, -1, 3),
    })
  }
  return events
}

function makeDeck(
  rng: Random,
  deckSize: number,
  narrativeCount: number,
  eventIds: string[],
): Card[] {
  const cards: Card[] = []
  const standardCount = Math.max(0, deckSize - narrativeCount)
  for (let i = 0; i < standardCount; i++) {
    cards.push({
      id: `card-${i + 1}`,
      text: CARD_TEXTS[i % CARD_TEXTS.length] as string,
      type: 'standard',
      weight: rng.int(1, 3),
    })
  }
  for (let i = 0; i < narrativeCount; i++) {
    cards.push({
      id: `narr-${i + 1}`,
      text: NARRATIVE_TEXTS[i % NARRATIVE_TEXTS.length] as string,
      type: 'narrative',
      weight: 0,
      overwrite_terrain: rng.pick(TERRAINS),
      overwrite_event_id: eventIds.length > 0 ? (rng.pick(eventIds) as string) : null,
    })
  }
  return cards
}

// Seeds a fresh scenario the author then shapes by hand. The map is blank: only
// the starting cell is authored (so the scenario is minimally valid); the rest of
// the canvas is filled in by the editor via the shape brush and "fill cells". A
// starter terrain palette, event pool and deck are generated as authoring material.
// mapWidth/mapHeight describe the canvas the editor lays out — generation itself
// only places the start cell.
export function generateBlankScenario(params: GeneratorParams = DEFAULT_PARAMS): Scenario {
  const rng = createRandom(params.seed)
  const start: Coord = { q: 0, r: 0 }
  const firstTerrain = TERRAINS[0] as string
  const events = generateEvents(rng, params.eventCount)
  const eventIds = events.map((e) => e.id)
  const deck = makeDeck(rng, params.deckSize, params.narrativeCount, eventIds)
  const initialHandSize = Math.min(5, Math.max(1, params.deckSize - params.narrativeCount))
  return {
    id: `scenario-${params.seed}`,
    metadata: { title: 'Default Scenario' },
    terrains: DEFAULT_TERRAINS.map((t) => ({ ...t })),
    mapData: { cells: [{ q: start.q, r: start.r, terrain: firstTerrain, event_id: null, is_revealed: true }] },
    eventsData: events,
    playerDeck: deck,
    initial_resources: { health: 10, gold: 5 },
    starting_position: start,
    narrative_intervention_interval: 5,
    initial_hand_size: initialHandSize,
    draw_card_count_per_turn: rng.int(1, 3),
    hand_limit: initialHandSize * 2,
  }
}
