import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = readFile(new URL('../client.js', import.meta.url), 'utf8')

test('a collapsed drawer hides a stale React backdrop without waiting for navigation rendering', async () => {
  assert.ok((await source).includes('${M}:has(${FRAME}[data-sidebar-collapsed]) .dsh-pwa-scrim{display:none}'))
})

test('PWA action buttons and the release link keep 44px targets on desktop-sized touch screens too', async () => {
  const client = await source
  assert.ok(client.includes(':is(${M},${T}) :is(.dsh-pwa-actions button,.dsh-pwa-segment button){min-width:44px;min-height:44px}'))
  assert.ok(client.includes('${T} .dsh-pwa-link{display:flex;align-items:center;min-height:44px;'))
})
