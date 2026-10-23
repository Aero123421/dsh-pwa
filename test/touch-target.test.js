import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('settings switch hit expansion stays touch-scoped and does not resize its track', async () => {
  const source = await readFile(new URL('../client.js', import.meta.url), 'utf8')
  const rules = source.split('\n').filter(line => line.includes('button[role=switch]'))
  assert.equal(rules.length, 2)
  assert.ok(rules.every(line => line.trim().startsWith('${T} [data-shortcut-modal=settings]')))
  assert.match(rules[0], /position:relative;overflow:visible/)
  assert.doesNotMatch(rules[0], /min-width|min-height|width:|height:/)
  assert.match(rules[1], /::after\{content:"";position:absolute/)
  assert.match(rules[1], /min-width:44px;min-height:44px;pointer-events:auto/)
})

test('PWA-owned actions and manual release link gain 44px touch targets only under touch scope', async () => {
  const source = await readFile(new URL('../client.js', import.meta.url), 'utf8')
  assert.ok(source.includes(':is(${M},${T}) :is(.dsh-pwa-actions button,.dsh-pwa-segment button){min-width:44px;min-height:44px}'))
  assert.ok(source.includes('${T} .dsh-pwa-link{display:flex;align-items:center;min-height:44px'))
  assert.ok(source.includes('${T} .dsh-pwa-segment{grid-template-columns:repeat(auto-fit,minmax(44px,1fr))}'))
})
