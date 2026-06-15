// The active map tool. "inspect" selects a hex to view its state without
// changing it; the rest apply an edit on click via ScenarioEditor.
export type Brush =
  | { kind: 'inspect' }
  | { kind: 'terrain'; name: string }
  | { kind: 'event'; id: string }
  | { kind: 'clear-event' }
  | { kind: 'start' }
  | { kind: 'add' }
  | { kind: 'remove' }
