// Pure, framework-agnostic game core. No Vue, no Pinia, no notifications, no
// persistence — and no knowledge of Scenario. The engine is handed a ready
// GameState (a loaded save, or one mapped from a scenario by createGameState)
// and only applies the rules to it.
//
// Reactivity bridge: the engine mutates the state object it is handed. In the
// Vue app the wrapper (game/useGame.ts) passes a `reactive()` object, so every
// `this.state.x = ...` is tracked and the UI re-renders. In tests or Node, pass
// a plain object — the same code runs with zero Vue.
//
// Feedback to the host is two-channel: reactive state for continuous data, and
// transient EngineEvents for one-off signals (notifications, persistence). The
// engine performs no I/O; it hands events to onEvent subscribers. It is the only
// writer of the state.
import type { Card, HexCell } from '@/engine/types/scenario'
import type { GameState } from '@/engine/gameState'
import type { EngineEvent } from '@/engine/engineEvent'
import { isAdjacent, type Coord } from '@/engine/hexGrid'

export class GameEngine {
  private listeners: Array<(event: EngineEvent) => void> = []

  constructor(private readonly state: GameState) {}

  // Single entry point for state. Accepts anything ready to play — a freshly
  // mapped scenario (createGameState) or a restored save — and hydrates the
  // engine's reactive state object in place. The state already has its one-time
  // setup done, so the engine only persists it.
  load(state: GameState): void {
    Object.assign(this.state, state)
    this.emitPersist()
  }

  move(target: Coord): void {
    if (this.state.phase !== 'movement') return
    if (!isAdjacent(this.state.playerPosition, target)) return
    const cell = this.findCellAt(target)
    if (!cell) return
    this.state.playerPosition = { q: target.q, r: target.r }
    cell.is_revealed = true
    if (cell.event_id) {
      this.state.currentEvent = this.state.eventsById[cell.event_id] ?? null
      this.state.phase = 'draw'
    } else {
      this.state.currentEvent = null
    }
    this.emitPersist()
  }

  playCard(card: Card): void {
    if (this.state.phase !== 'draw') return
    const index = this.state.hand.findIndex((c) => c.id === card.id)
    if (index < 0) return
    const moved = this.state.hand.splice(index, 1)[0] as Card
    this.state.tableau.push(moved)
  }

  returnCard(card: Card): void {
    if (this.state.phase !== 'draw') return
    const index = this.state.tableau.findIndex((c) => c.id === card.id)
    if (index < 0) return
    const moved = this.state.tableau.splice(index, 1)[0] as Card
    this.state.hand.push(moved)
  }

  confirmPlay(): void {
    if (this.state.phase !== 'draw') return
    const event = this.state.currentEvent
    if (!event) {
      this.state.tableau = []
      this.state.phase = 'movement'
      this.emitPersist()
      return
    }

    const hidden = this.sumTableauWeight()
    let outcomeText: string
    if (event.critical_threshold !== undefined && hidden >= event.critical_threshold) {
      const success = event.success_outcome
      const boosted: Record<string, number> = {}
      for (const [key, value] of Object.entries(success.resource_deltas)) boosted[key] = value * 2
      this.applyResourceDeltas(boosted)
      outcomeText = `Critical success! ${success.text}`
    } else if (hidden >= event.difficulty) {
      this.applyResourceDeltas(event.success_outcome.resource_deltas)
      outcomeText = `Success. ${event.success_outcome.text}`
    } else {
      this.applyResourceDeltas(event.fail_outcome.resource_deltas)
      outcomeText = `Failure. ${event.fail_outcome.text}`
    }
    this.emit({ kind: 'outcome', text: outcomeText })

    // Cards return to the draw pile shuffled, so a card's future position can't
    // be tracked across a save/load.
    this.state.drawPile = this.state.random.shuffle([...this.state.drawPile, ...this.state.tableau])
    this.state.tableau = []
    this.state.currentEvent = null
    this.state.turnCount += 1
    this.drawCards(this.state.drawCardCountPerTurn)

    if (this.isAnyResourceDepleted()) {
      this.endGame('a vital resource was depleted')
      return
    }

    const interval = this.state.narrativeInterventionInterval
    if (interval > 0 && this.state.turnCount % interval === 0) {
      const narrative = this.state.narrativeCardTemplates[0]
      if (narrative) {
        this.state.pendingNarrativeCard = { ...narrative, id: `${narrative.id}-t${this.state.turnCount}` }
        this.state.phase = 'narrative-intervention'
        this.emitPersist()
        return
      }
    }
    this.state.phase = 'movement'
    this.emitPersist()
  }

  placeNarrativeCard(target: Coord): void {
    if (this.state.phase !== 'narrative-intervention') return
    const card = this.state.pendingNarrativeCard
    if (!card) return
    const cell = this.findCellAt(target)
    if (!cell) return
    if (card.overwrite_terrain) cell.terrain = card.overwrite_terrain
    if (card.overwrite_event_id !== undefined) cell.event_id = card.overwrite_event_id ?? null
    cell.is_revealed = true
    this.state.pendingNarrativeCard = null
    this.state.phase = 'movement'
    this.emitPersist()
  }

  // Subscribe to engine events. Returns an unsubscribe function.
  onEvent(listener: (event: EngineEvent) => void): () => void {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index >= 0) this.listeners.splice(index, 1)
    }
  }

  private endGame(reason: string): void {
    if (this.state.phase === 'game-over') return
    this.state.phase = 'game-over'
    this.emit({ kind: 'game-over', reason })
    this.emitPersist()
  }

  private emit(event: EngineEvent): void {
    for (const listener of this.listeners) listener(event)
  }

  private emitPersist(): void {
    this.emit({ kind: 'persist', state: this.state })
  }

  private isAnyResourceDepleted(): boolean {
    return Object.values(this.state.resources).some((value) => value <= 0)
  }

  private drawCards(count: number): void {
    const max = this.state.handLimit
    let drawn = 0
    while (drawn < count && this.state.hand.length < max && this.state.drawPile.length > 0) {
      const card = this.state.drawPile.shift()
      if (card) this.state.hand.push(card)
      drawn += 1
    }
  }

  private findCellAt(coord: Coord): HexCell | undefined {
    return this.state.cells.find((cell) => cell.q === coord.q && cell.r === coord.r)
  }

  private applyResourceDeltas(deltas: Record<string, number>): void {
    for (const [key, delta] of Object.entries(deltas)) {
      const previous = this.state.resources[key] ?? 0
      this.state.resources[key] = previous + delta
    }
  }

  private sumTableauWeight(): number {
    return this.state.tableau.reduce((sum, card) => sum + (card.weight ?? 0), 0)
  }
}
