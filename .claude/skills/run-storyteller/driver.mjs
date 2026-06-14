#!/usr/bin/env node
// Minimal Playwright-based driver for Storyteller (used when chromium-cli is unavailable).
//
// Usage:
//   node driver.mjs <url> <out-dir> <script.json>
//
// <script.json> is an array of step objects, executed in order:
//   { "goto": "/" }
//   { "waitFor": "text=Resources" }
//   { "screenshot": "01-game.png" }
//   { "click": "button:has-text(\"Play\")" }
//   { "fill": ["input[name=title]", "hello"] }
//   { "evalText": "h1" }        -> prints textContent of the matched element
//   { "consoleErrors": true }    -> prints any console errors seen so far
//
// Screenshots are written to <out-dir>/<name>.

import { chromium } from 'playwright'
import { resolve } from 'node:path'

const [, , baseUrl, outDir, scriptPath] = process.argv

if (!baseUrl || !outDir || !scriptPath) {
  console.error('usage: node driver.mjs <base-url> <out-dir> <script.json>')
  process.exit(1)
}

const steps = JSON.parse(await import('node:fs').then((fs) => fs.readFileSync(scriptPath, 'utf8')))

const browser = await chromium.launch({ args: ['--no-sandbox'] })
const page = await browser.newPage()

const consoleMessages = []
page.on('console', (msg) => {
  consoleMessages.push({ type: msg.type(), text: msg.text() })
})
page.on('pageerror', (err) => {
  consoleMessages.push({ type: 'pageerror', text: String(err) })
})

for (const step of steps) {
  if (step.goto !== undefined) {
    const url = step.goto.startsWith('http') ? step.goto : new URL(step.goto, baseUrl).toString()
    console.log(`> goto ${url}`)
    await page.goto(url, { waitUntil: 'load' })
  } else if (step.waitFor !== undefined) {
    console.log(`> waitFor ${step.waitFor}`)
    await page.waitForSelector(step.waitFor, { timeout: 15000 })
  } else if (step.click !== undefined) {
    console.log(`> click ${step.click}`)
    await page.click(step.click)
  } else if (step.fill !== undefined) {
    const [selector, value] = step.fill
    console.log(`> fill ${selector} = ${value}`)
    await page.fill(selector, value)
  } else if (step.screenshot !== undefined) {
    const dest = resolve(outDir, step.screenshot)
    console.log(`> screenshot -> ${dest}`)
    await page.screenshot({ path: dest, fullPage: true })
  } else if (step.drag !== undefined) {
    // SortableJS (vuedraggable) needs real mousemove steps between down and up,
    // a plain Playwright dragTo does not trigger it reliably.
    const [fromSelector, toSelector] = step.drag
    console.log(`> drag ${fromSelector} -> ${toSelector}`)
    const from = page.locator(fromSelector).first()
    const to = page.locator(toSelector).first()
    const fromBox = await from.boundingBox()
    const toBox = await to.boundingBox()
    const start = { x: fromBox.x + fromBox.width / 2, y: fromBox.y + fromBox.height / 2 }
    const end = { x: toBox.x + toBox.width / 2, y: toBox.y + toBox.height / 2 }
    await page.mouse.move(start.x, start.y)
    await page.mouse.down()
    const steps = 8
    for (let i = 1; i <= steps; i++) {
      await page.mouse.move(
        start.x + ((end.x - start.x) * i) / steps,
        start.y + ((end.y - start.y) * i) / steps,
      )
      await page.waitForTimeout(30)
    }
    await page.mouse.up()
  } else if (step.evalText !== undefined) {
    const text = await page.textContent(step.evalText)
    console.log(`> evalText ${step.evalText} = ${JSON.stringify(text)}`)
  } else if (step.consoleErrors !== undefined) {
    const errors = consoleMessages.filter((m) => m.type === 'error' || m.type === 'pageerror')
    console.log(`> consoleErrors = ${JSON.stringify(errors)}`)
  } else {
    console.warn(`unknown step: ${JSON.stringify(step)}`)
  }
}

await browser.close()
