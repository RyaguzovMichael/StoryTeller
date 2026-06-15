// An authored terrain type: the palette entry a cell references by `name`.
// Only `color` for now; an optional image/pattern is a planned addition, so the
// renderer resolves a cell's fill through a single helper rather than reading
// `color` inline (keeps the future swap to images local).
export interface TerrainType {
  name: string
  color: string
}
