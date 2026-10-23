import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('touch composer controls retain finger targets without expanding popup rows or inline chips', async () => {
  const source = await readFile(new URL('../client.js', import.meta.url), 'utf8')
  assert.ok(source.includes('${T} [data-composer-card] button:not([contenteditable] button):not([data-composer-overlay] button):not([data-slot="conversation.input.attachments"] button),${T} [data-composer-seat] button[aria-haspopup=dialog]{min-width:44px;min-height:44px}'))
  assert.ok(source.includes('${T} [data-input-scroll]{max-height:min(336px,max(36px,calc(var(--dsh-pwa-viewport,100dvh) - 260px)))}'))
  assert.ok(source.includes(':is(${M},${T}) [data-composer-seat]:has([data-composer-overlay] [data-menu-material]){z-index:25}'))
  assert.doesNotMatch(source, /\[data-composer-overlay\][^\n]+position:fixed/)
  assert.equal(source.includes('${T} [id^=dsh-slash-option-]{min-height:44px}'), false)
})

test('touch modal portals use the visible viewport and retain vertical scroll access to actions', async () => {
  const source = await readFile(new URL('../client.js', import.meta.url), 'utf8')
  assert.ok(source.includes('${T} body>[role=presentation]:has(>[role=dialog][aria-modal=true]){top:0;bottom:auto;transform:var(--dsh-pwa-shift,none);height:var(--dsh-pwa-viewport,100dvh);max-height:var(--dsh-pwa-viewport,100dvh);padding:12px;box-sizing:border-box}'))
  assert.ok(source.includes('${T} body>[role=presentation]>[role=dialog][aria-modal=true]{top:auto;margin-block:0;max-height:calc(var(--dsh-pwa-viewport,100dvh) - 24px);max-width:calc(100vw - 24px);overflow-y:auto}'))
  assert.ok(source.includes('${T} [data-shortcut-modal=shortcuts]{transform:none}'))
})
