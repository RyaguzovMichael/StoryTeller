// Barrel: one entry point for the scenario data contract, so consumers write
// `import type { Card, HexCell } from '@/engine/types/scenario'` instead of
// reaching into each file. Analogous to exposing a whole namespace.
export type { HexCell, MapConfig } from './hexCell'
export type { CardType, Card, PlayerDeck } from './card'
export type { Outcome, GameEvent, EventPool } from './event'
export type { Scenario } from './scenario'
