# План: доменное ядро редактора сценариев

Ветка: `feature/scenario-editor-core`

## Цель

Перевести редактор с правки сырого JSON на доменную модель по аналогии с
движком: `gameEngine` ↔ `gameState`. Появляются два класса:

- `ScenarioEditor` — единственный писатель, меняет сценарий методами-намерениями
  (аналог `GameEngine`).
- `ScenarioDraft` — доменная модель-черновик с защитой инвариантов и быстрым
  поиском по `Map` (аналог `GameState`).

`Scenario` (тип в `engine/types/scenario`) остаётся плоским сериализуемым
JSON-контрактом — роль DTO, как `GameStateDTO`. Его и `scenarioStorage`/игру не
трогаем. Канал `EngineEvent` не копируем (YAGNI): сохранение остаётся явным.

## Границы модулей

```
src/editor/
  scenarioDraft.ts    NEW  ScenarioDraft + ValidationIssue   (аналог gameState.ts)
  scenarioEditor.ts   NEW  ScenarioEditor — sole writer        (аналог gameEngine.ts)
  scenarioGenerator.ts      без изменений
  mapTransforms.ts    DEL  recenter переезжает в ScenarioEditor
```

## Контракт

```ts
// scenarioDraft.ts
export interface ValidationIssue { code: string; message: string }

export class ScenarioDraft {
  static from(scenario: Scenario): ScenarioDraft   // массивы -> Map по coordKey/id
  toScenario(): Scenario                            // Map -> массивы (порядок вставки)

  cellAt(coord: Coord): HexCell | undefined
  get cells(): readonly HexCell[]
  get events(): readonly GameEvent[]
  get deck(): readonly Card[]
  get meta(): ScenarioMeta

  validate(): ValidationIssue[]                     // не бросает — для подсветки в UI
}

// scenarioEditor.ts — единственный писатель ScenarioDraft
export class ScenarioEditor {
  constructor(draft: ScenarioDraft)
  get draft(): ScenarioDraft
  // карта (фаза 1 UI)
  paintTerrain(coord, terrain): void
  assignEvent(coord, eventId | null): void
  addCell(coord): void
  removeCell(coord): void
  setStart(coord): void
  recenter(): void
  // события / колода / мета (фаза 2 UI)
  addEvent(event): void; updateEvent(id, patch): void; removeEvent(id): void  // каскад
  addCard(card): void;   updateCard(id, patch): void;  removeCard(id): void
  setTitle / setInitialResources / setInterval / setInitialHandSize / setDrawCount / setHandLimit
}
```

## Инварианты (защищает editor, отражает validate)

- координаты ячеек уникальны;
- `starting_position` указывает на существующую ячейку;
- `event_id` ячейки и `overwrite_event_id` нарратив-карты ссылаются на
  существующее событие либо `null`;
- `id` карт и событий уникальны;
- `removeEvent` каскадно чистит ссылки на него (ячейки и карты);
- `narrative_intervention_interval ≥ 1`, счётчики ≥ 0,
  `initial_hand_size` не больше размера колоды.

## Тесты (контракт → тесты до тел)

- `scenarioDraft.spec.ts`: round-trip `from → toScenario` (стабильный порядок);
  `validate()` ловит каждый инвариант.
- `scenarioEditor.spec.ts`: каждый мутатор держит инварианты; каскад
  `removeEvent`; `recenter`.

## Фазы (коммит на фазу)

1. **types** — скелеты обоих классов + `ValidationIssue`, тела-заглушки.
2. **tests** — оба spec-файла.
3. **draft** — тела `ScenarioDraft`.
4. **editor** — тела `ScenarioEditor`, миграция `recenter`, удаление `mapTransforms.ts`.
5. **Vue** — `EditorView.vue`: клик по гексу → terrain/event, подсветка
   `validate()`; JSON-textarea остаётся escape hatch. Формы событий/карт/меты —
   следующим заходом.
