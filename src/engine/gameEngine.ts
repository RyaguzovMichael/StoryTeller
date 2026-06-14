// Pure, framework-agnostic game core. No Vue, no Pinia, no notifications, no
// persistence — and no knowledge of Scenario. The engine is handed a ready
// GameState (a loaded save, or one mapped from a scenario by createGameState)
// and only applies the rules to it.
//
// Reactivity bridge: the engine mutates the state object it is handed. In the
// Vue app the wrapper (game/useGame.ts) passes a `reactive()` object, so every
// `this.state.x = ...` is tracked and the UI re-renders. In tests or Node, pass
// a plain object — the same code runs with zero Vue. The engine never knows
// which it got.
//
// Side effects (notifications, saving) are never performed here. The engine
// appends a GameEffect to `state.effects`; a host observer drains and applies
// them (see game/useGameEffects.ts). That keeps the core dependency-free.
import type { Card, Coord, HexCell } from '@/engine/types/scenario'
import type { GameEffect, GameState, SavedGame } from '@/engine/types/gameState'
import { coordKey, isAdjacent } from '@/engine/hexGrid'
import { createRng } from '@/engine/rng'

export class GameEngine {
  constructor(private readonly state: GameState) {}

  // Single entry point for state. Accepts anything ready to play — a freshly
  // mapped scenario or a restored save — and hydrates the engine's reactive
  // state object in place (it must stay the same object the store handed out).
  // A fresh scenario mapping arrives uninitialized and gets the one-time setup;
  // a save is already initialized and is loaded untouched.
  load(state: GameState): void {
    Object.assign(this.state, state)
    if (!this.state.initialized) this.initialize()
  }

  // One-time setup for a freshly mapped scenario: shuffle the draw pile, deal the
  // opening hand, reveal the starting cell. Marks the state initialized and asks
  // the host to reset (clears notifications, persists the fresh game).
  private initialize(): void {
    const rng = createRng(Date.now() & 0xffffff)
    this.state.drawPile = rng.shuffle(this.state.drawPile)
    this.drawToHandSize()
    const startCell = this.cellAt(this.state.position)
    if (startCell) startCell.is_revealed = true
    this.state.initialized = true
    this.emit({ kind: 'reset' })
  }

  // A persistable snapshot of the current game (without the transient effects).
  snapshot(): SavedGame {
    const { effects: _effects, ...rest } = this.state
    return JSON.parse(JSON.stringify(rest)) as SavedGame
  }

  private sumActiveZoneWeight(): number {
    return this.state.activeZone.reduce((sum, card) => sum + (card.weight ?? 0), 0)
  }

  private emit(effect: GameEffect): void {
    this.state.effects.push(effect)
  }

  // Returns and clears the queued effects. The host calls this and applies them.
  drainEffects(): GameEffect[] {
    const drained = this.state.effects.slice()
    this.state.effects.length = 0
    return drained
  }

  private cellAt(coord: Coord): HexCell | undefined {
    return this.state.cells.find((cell) => cell.q === coord.q && cell.r === coord.r)
  }

  private drawToHandSize(): void {
    while (this.state.hand.length < this.state.initialHandSize && this.state.drawPile.length > 0) {
      const card = this.state.drawPile.shift()
      if (card) this.state.hand.push(card)
    }
  }

  selectHex(target: Coord): void {
    if (this.state.phase !== 'movement') return
    if (!isAdjacent(this.state.position, target)) return
    const cell = this.cellAt(target)
    if (!cell) return
    this.state.position = { q: target.q, r: target.r }
    cell.is_revealed = true
    if (cell.event_id) {
      this.state.currentEvent = this.state.eventsById[cell.event_id] ?? null
      this.state.phase = 'draw'
    } else {
      this.state.currentEvent = null
    }
    this.emit({ kind: 'player-move' })
  }

  playCard(cardId: string): void {
    if (this.state.phase !== 'draw') return
    const index = this.state.hand.findIndex((c) => c.id === cardId)
    if (index < 0) return
    const card = this.state.hand.splice(index, 1)[0] as Card
    this.state.activeZone.push(card)
  }

  returnCard(cardId: string): void {
    if (this.state.phase !== 'draw') return
    const index = this.state.activeZone.findIndex((c) => c.id === cardId)
    if (index < 0) return
    const card = this.state.activeZone.splice(index, 1)[0] as Card
    this.state.hand.push(card)
  }

  private applyDeltas(deltas: Record<string, number>): void {
    for (const [key, delta] of Object.entries(deltas)) {
      const previous = this.state.resources[key] ?? 0
      this.state.resources[key] = previous + delta
    }
  }

  confirmPlay(): void {
    if (this.state.phase !== 'draw') return
    const event = this.state.currentEvent
    if (!event) {
      this.state.activeZone = []
      this.state.phase = 'movement'
      return
    }

    const hidden = this.sumActiveZoneWeight()
    let outcomeText: string
    if (event.critical_threshold !== undefined && hidden >= event.critical_threshold) {
      const success = event.success_outcome
      const boosted: Record<string, number> = {}
      for (const [key, value] of Object.entries(success.resource_deltas)) boosted[key] = value * 2
      this.applyDeltas(boosted)
      outcomeText = `Critical success! ${success.text}`
    } else if (hidden >= event.difficulty) {
      this.applyDeltas(event.success_outcome.resource_deltas)
      outcomeText = `Success. ${event.success_outcome.text}`
    } else {
      this.applyDeltas(event.fail_outcome.resource_deltas)
      outcomeText = `Failure. ${event.fail_outcome.text}`
    }
    this.emit({ kind: 'outcome', text: outcomeText })

    this.state.drawPile.push(...this.state.activeZone)
    this.state.activeZone = []
    this.state.currentEvent = null
    this.state.turnCount += 1
    this.drawToHandSize()

    const interval = this.state.narrativeInterventionInterval
    if (interval > 0 && this.state.turnCount % interval === 0) {
      const narrative = this.state.narrativeCardTemplates[0]
      if (narrative) {
        this.state.pendingNarrativeCard = { ...narrative, id: `${narrative.id}-t${this.state.turnCount}` }
        this.state.phase = 'narrative-intervention'
        return
      }
    }
    this.state.phase = 'movement'
  }

  placeNarrativeCard(target: Coord): void {
    if (this.state.phase !== 'narrative-intervention') return
    const card = this.state.pendingNarrativeCard
    if (!card) return
    const cell = this.cellAt(target)
    if (!cell) return
    if (card.overwrite_terrain) cell.terrain = card.overwrite_terrain
    if (card.overwrite_event_id !== undefined) cell.event_id = card.overwrite_event_id ?? null
    cell.is_revealed = true
    this.state.pendingNarrativeCard = null
    this.state.phase = 'movement'
    this.emit({ kind: 'map-changed' })
  }

  endGame(reason: string): void {
    if (this.state.phase === 'game-over') return
    this.state.phase = 'game-over'
    this.emit({ kind: 'game-over', reason })
  }

  adjacencyHints(): Set<string> {
    const hints = new Set<string>()
    for (const cell of this.state.cells) {
      if (isAdjacent(this.state.position, { q: cell.q, r: cell.r })) {
        hints.add(coordKey({ q: cell.q, r: cell.r }))
      }
    }
    return hints
  }
}
