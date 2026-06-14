// The four-phase game loop, plus the terminal game-over state.
export type GamePhase =
  | 'movement'
  | 'draw'
  | 'consequences'
  | 'narrative-intervention'
  | 'game-over'
