---
name: run-storyteller
description: Build, run, and drive the Storyteller Vue 3 SPA. Use when asked to start storyteller, run its dev server, run its tests, build it, take a screenshot of the game/editor views, or interact with the running app (move on the hex grid, play a card, check the editor).
---

Storyteller is a Vue 3 + Vite SPA (no backend). "Running" it means starting
the Vite dev server and driving headless Chromium against it with the
Playwright driver in this skill directory (`chromium-cli` is not available
in this environment). All paths below are relative to the repo root.

## Setup

Dependencies for the app are installed via the gated `Makefile`
(`make` / `make run` runs install → test → type-check → build). For just
driving the app you only need the dev server, so `pnpm install` is enough.

```bash
pnpm install
```

The driver needs Playwright + a Chromium binary, installed once inside the
skill directory (kept separate from the app's own dependencies, which
intentionally do not include Playwright):

```bash
cd .claude/skills/run-storyteller
npm install            # installs playwright into this dir's own node_modules
npx playwright install chromium
cd ../../..
```

## Run (agent path)

1. Start the dev server in the background and wait for it to respond:

```bash
pnpm dev > /tmp/storyteller-dev.log 2>&1 &
echo $! > /tmp/storyteller-dev.pid
timeout 30 bash -c 'until curl -sf http://localhost:5173 >/dev/null; do sleep 1; done'
```

2. Drive it with `driver.mjs` (`.claude/skills/run-storyteller/driver.mjs`).
   It takes a base URL, an output directory for screenshots, and a JSON file
   of steps, executed in order:

```bash
mkdir -p /tmp/storyteller-shots
cat > /tmp/steps.json <<'EOF'
[
  {"goto": "/"},
  {"waitFor": "text=Storyteller"},
  {"screenshot": "01-game.png"},
  {"click": ".hex.highlighted"},
  {"waitFor": ".event-panel"},
  {"drag": [".player-hand .card", ".event-drop"]},
  {"click": "button:has-text(\"End Turn\")"},
  {"waitFor": "text=Choose an adjacent hex"},
  {"screenshot": "02-outcome.png"},
  {"consoleErrors": true}
]
EOF
cd .claude/skills/run-storyteller
node driver.mjs http://localhost:5173 /tmp/storyteller-shots /tmp/steps.json
cd ../../..
```

Screenshots land in `/tmp/storyteller-shots/` (or whatever output dir you
pass). The script above exercises one full game-loop turn: move onto an
adjacent hex (opens the event panel), drag a card from the hand into the
event's active zone, end the turn, and land on the outcome screen.

3. Stop the dev server when done:

```bash
kill "$(cat /tmp/storyteller-dev.pid)"
```

### Driver step reference

| step | what it does |
|---|---|
| `{"goto": "/path"}` | navigate (relative to base URL, or absolute) |
| `{"waitFor": "<selector>"}` | wait for a selector/text to be visible (Playwright locator syntax, e.g. `text=Foo`, `.css-class`) |
| `{"click": "<selector>"}` | click the first matching element |
| `{"fill": ["<selector>", "value"]}` | fill an input |
| `{"drag": ["<from-selector>", "<to-selector>"]}` | drag-and-drop via real mousemove steps — needed for the `vuedraggable`/SortableJS hand and event drop zones; a plain Playwright `dragTo` does not trigger SortableJS |
| `{"screenshot": "name.png"}` | full-page screenshot, written to the output dir |
| `{"evalText": "<selector>"}` | print `textContent` of the first match |
| `{"consoleErrors": true}` | print any `console.error`/page errors seen so far |

## Run (human path)

`pnpm dev` serves at `http://localhost:5173/` (or `make dev` for the same
thing). `/` redirects to `/game` (the play view); `/editor` is the scenario
editor. Both routes work with no further setup — game state is generated
into `localStorage` on first load via `loadOrCreateScenario()`. Ctrl-C to
stop.

## Test / type-check / build

```bash
pnpm test:unit --run   # 1 file, 37 tests, ~1s
pnpm type-check         # vue-tsc --build, no output on success
```

(Equivalently `make test` / `make type-check`, but those also run
`pnpm install` first as part of the Makefile's gated chain.)

## Gotchas

- **`text=Storyteller` only matches `/game`.** The `/editor` view's `<h1>`
  is "Editor" — wait for `text=Regenerate` (or another editor-specific
  string) there instead.
- **Card drag-and-drop needs the `drag` step**, not `click` — both the
  player's hand and the event panel's drop zone are `vuedraggable`
  (SortableJS) lists that only respond to real `mousedown` → `mousemove`
  (several steps) → `mouseup`.
- **The highlighted/clickable hex is `.hex.highlighted`** inside the SVG
  (a `<g>` element with `@click`), not a `<polygon>` — click the `<g>`.
- Playwright's browser binaries are cached under `~/.cache/ms-playwright`
  and are shared regardless of which `node_modules` `playwright` itself
  lives in — `npx playwright install chromium` only needs to run once per
  container.
