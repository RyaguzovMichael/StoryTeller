import type { Card, GameEvent, Outcome, Scenario, TerrainType } from '@/engine/types/scenario'
import type { Coord } from '@/engine/hexGrid'
import type { Random } from '@/engine/random'

// Default counts offered in the editor's "Regenerate…" dialog.
export interface GenerateCounts {
  terrainCount: number
  eventCount: number
  deckSize: number
  narrativeCount: number
}

export const DEFAULT_GEN: GenerateCounts = {
  terrainCount: 4,
  eventCount: 4,
  deckSize: 8,
  narrativeCount: 2,
}

// Palette the "Regenerate…" dialog draws terrain types from: names paired with
// the fill colors HexGrid falls back to, so generated terrains carry their own
// colors. generateTerrains picks a subset; the author can still add/edit terrains
// by hand from the Content tab.
const TERRAIN_PALETTE: ReadonlyArray<TerrainType> = [
  { name: 'plains', color: '#cdd9a3' },
  { name: 'swamp', color: '#7a8c5c' },
  { name: 'forest', color: '#4f7a4a' },
  { name: 'tavern', color: '#c08a4a' },
  { name: 'ruin', color: '#9c9c9c' },
]

// The single terrain a freshly cleared scenario starts with.
const STARTER_TERRAIN: TerrainType = TERRAIN_PALETTE[0] as TerrainType

// Picks `count` distinct terrain types from the palette (clamped to [1, palette]).
export function generateTerrains(rng: Random, count: number): TerrainType[] {
  const clamped = Math.max(1, Math.min(count, TERRAIN_PALETTE.length))
  return rng.shuffle(TERRAIN_PALETTE).slice(0, clamped).map((terrain) => ({ ...terrain }))
}
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

// Builds a fresh deck. Narrative cards overwrite a hex's terrain/event, so they
// draw their targets from the scenario's actual terrains and the given event ids
// — falling back to none when there is nothing to point at.
export function generateDeck(
  rng: Random,
  deckSize: number,
  narrativeCount: number,
  eventIds: readonly string[],
  terrains: readonly string[],
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
      overwrite_terrain: terrains.length > 0 ? (rng.pick(terrains) as string) : undefined,
      overwrite_event_id: eventIds.length > 0 ? (rng.pick(eventIds) as string) : null,
    })
  }
  return cards
}

// A blank-slate scenario the author shapes by hand: a single starting cell with
// the starter terrain, no events and no deck. The editor lays a 3×3 ghost canvas
// over it; everything else (more terrain, shape, fill, events, deck) is authored
// or generated afterward.
export function generateBlankScenario(): Scenario {
  const start: Coord = { q: 0, r: 0 }
  return {
    id: `scenario-${Date.now()}`,
    metadata: { title: 'Untitled Scenario' },
    terrains: [{ ...STARTER_TERRAIN }],
    mapData: {
      cells: [{ q: start.q, r: start.r, terrain: STARTER_TERRAIN.name, event_id: null, is_revealed: true }],
    },
    eventsData: [],
    playerDeck: [],
    initial_resources: { health: 10, gold: 5 },
    starting_position: start,
    narrative_intervention_interval: 5,
    initial_hand_size: 0,
    draw_card_count_per_turn: 1,
    hand_limit: 5,
  }
}
