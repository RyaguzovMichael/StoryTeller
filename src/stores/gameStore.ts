import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Card, Coord, GameEvent, HexCell, Scenario } from '@/types/scenario'
import type { GamePhase } from '@/types/gameState'
import { coordKey, isAdjacent } from '@/utils/hexGrid'
import { createRng } from '@/utils/rng'
import { saveScenario } from '@/utils/storage'
import { useNotificationStore } from './notificationStore'

export const useGameStore = defineStore('game', () => {
  const scenario = ref<Scenario | null>(null)
  const phase = ref<GamePhase>('movement')
  const resources = ref<Record<string, number>>({})
  const position = ref<Coord>({ q: 0, r: 0 })
  const drawPile = ref<Card[]>([])
  const hand = ref<Card[]>([])
  const activeZone = ref<Card[]>([])
  const currentEventId = ref<string | null>(null)
  const pendingNarrativeCard = ref<Card | null>(null)
  const turnCount = ref<number>(0)

  const cells = computed<HexCell[]>(() => scenario.value?.mapData.cells ?? [])
  const mapRadius = computed<number>(() => scenario.value?.mapData.radius ?? 0)
  const currentEvent = computed<GameEvent | null>(() => {
    if (!scenario.value || !currentEventId.value) return null
    return scenario.value.eventsData.find((e) => e.id === currentEventId.value) ?? null
  })
  const isGameOver = computed(() => phase.value === 'game-over')
  const hiddenS = computed<number>(() =>
    activeZone.value.reduce((sum, c) => sum + (c.weight ?? 0), 0),
  )

  function cellAt(c: Coord): HexCell | undefined {
    return cells.value.find((cell) => cell.q === c.q && cell.r === c.r)
  }

  function drawToHandSize(): void {
    const target = scenario.value?.initial_hand_size ?? 0
    while (hand.value.length < target && drawPile.value.length > 0) {
      const card = drawPile.value.shift()
      if (card) hand.value.push(card)
    }
  }

  function initFromScenario(s: Scenario): void {
    const notifications = useNotificationStore()
    notifications.clear()
    scenario.value = JSON.parse(JSON.stringify(s)) as Scenario
    phase.value = 'movement'
    resources.value = { ...s.initial_resources }
    position.value = { ...s.starting_position }
    activeZone.value = []
    currentEventId.value = null
    pendingNarrativeCard.value = null
    turnCount.value = 0

    const rng = createRng(Date.now() & 0xffffff)
    const standards = s.playerDeck.filter((c) => c.type === 'standard')
    drawPile.value = rng.shuffle(standards)
    hand.value = []
    drawToHandSize()

    const startCell = cellAt(position.value)
    if (startCell) startCell.is_revealed = true
  }

  function selectHex(target: Coord): void {
    if (phase.value !== 'movement') return
    if (!isAdjacent(position.value, target)) return
    const cell = cellAt(target)
    if (!cell) return
    position.value = { q: target.q, r: target.r }
    cell.is_revealed = true
    if (cell.event_id) {
      currentEventId.value = cell.event_id
      const event = currentEvent.value
      if (event) {
        const notifications = useNotificationStore()
        notifications.push(event.text, 'info')
      }
      phase.value = 'draw'
    } else {
      currentEventId.value = null
    }
  }

  function playCard(cardId: string): void {
    if (phase.value !== 'draw') return
    const idx = hand.value.findIndex((c) => c.id === cardId)
    if (idx < 0) return
    const card = hand.value.splice(idx, 1)[0] as Card
    activeZone.value.push(card)
  }

  function returnCard(cardId: string): void {
    if (phase.value !== 'draw') return
    const idx = activeZone.value.findIndex((c) => c.id === cardId)
    if (idx < 0) return
    const card = activeZone.value.splice(idx, 1)[0] as Card
    hand.value.push(card)
  }

  function applyDeltas(deltas: Record<string, number>): void {
    for (const [key, delta] of Object.entries(deltas)) {
      const prev = resources.value[key] ?? 0
      resources.value[key] = prev + delta
    }
  }

  function confirmPlay(): void {
    if (phase.value !== 'draw') return
    const event = currentEvent.value
    if (!event) {
      activeZone.value = []
      phase.value = 'movement'
      return
    }
    const notifications = useNotificationStore()
    const s = hiddenS.value
    let outcomeText: string
    if (event.critical_threshold !== undefined && s >= event.critical_threshold) {
      const success = event.success_outcome
      const boosted: Record<string, number> = {}
      for (const [k, v] of Object.entries(success.resource_deltas)) boosted[k] = v * 2
      applyDeltas(boosted)
      outcomeText = `Critical success! ${success.text}`
    } else if (s >= event.difficulty) {
      applyDeltas(event.success_outcome.resource_deltas)
      outcomeText = `Success. ${event.success_outcome.text}`
    } else {
      applyDeltas(event.fail_outcome.resource_deltas)
      outcomeText = `Failure. ${event.fail_outcome.text}`
    }
    notifications.push(outcomeText, 'outcome')

    drawPile.value.push(...activeZone.value)
    activeZone.value = []
    currentEventId.value = null
    turnCount.value += 1
    drawToHandSize()

    const interval = scenario.value?.narrative_intervention_interval ?? 0
    if (
      interval > 0 &&
      turnCount.value % interval === 0 &&
      scenario.value
    ) {
      const narrative = scenario.value.playerDeck.find((c) => c.type === 'narrative')
      if (narrative) {
        pendingNarrativeCard.value = { ...narrative, id: `${narrative.id}-t${turnCount.value}` }
        phase.value = 'narrative-intervention'
        notifications.push(
          'A narrative intervention demands your attention. Place the card on any hex.',
          'info',
        )
        return
      }
    }
    phase.value = 'movement'
  }

  function placeNarrativeCard(target: Coord): void {
    if (phase.value !== 'narrative-intervention') return
    const card = pendingNarrativeCard.value
    if (!card || !scenario.value) return
    const cell = cellAt(target)
    if (!cell) return
    if (card.overwrite_terrain) cell.terrain = card.overwrite_terrain
    if (card.overwrite_event_id !== undefined) cell.event_id = card.overwrite_event_id ?? null
    cell.is_revealed = true
    saveScenario(scenario.value)
    pendingNarrativeCard.value = null
    phase.value = 'movement'
  }

  function endGame(reason: string): void {
    if (phase.value === 'game-over') return
    phase.value = 'game-over'
    const notifications = useNotificationStore()
    notifications.push(`Game over: ${reason}.`, 'game-over')
  }

  function adjacencyHints(): Set<string> {
    const hints = new Set<string>()
    for (const cell of cells.value) {
      if (isAdjacent(position.value, { q: cell.q, r: cell.r })) {
        hints.add(coordKey({ q: cell.q, r: cell.r }))
      }
    }
    return hints
  }

  return {
    scenario,
    phase,
    resources,
    position,
    drawPile,
    hand,
    activeZone,
    hiddenS,
    currentEventId,
    pendingNarrativeCard,
    turnCount,
    cells,
    mapRadius,
    currentEvent,
    isGameOver,
    initFromScenario,
    selectHex,
    playCard,
    returnCard,
    confirmPlay,
    placeNarrativeCard,
    endGame,
    adjacencyHints,
  }
})
