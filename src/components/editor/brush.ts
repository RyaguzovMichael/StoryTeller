// The active map tool. "inspect" selects a hex to view its state without
// changing it; the rest apply an edit on click via ScenarioEditor. "blank" is
// the shape brush — it makes a hex a playable, not-yet-filled cell; "remove"
// deletes the cell back to a non-playable ghost.
export type Brush =
  | { kind: 'inspect' }
  | { kind: 'terrain'; name: string }
  | { kind: 'event'; id: string }
  | { kind: 'clear-event' }
  | { kind: 'start' }
  | { kind: 'blank' }
  | { kind: 'remove' }
