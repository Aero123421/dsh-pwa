import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('coarse-primary touch screens pass width-handle swipes through without disabling mouse-primary hybrids', async () => {
  const source = await readFile(new URL('../client.js', import.meta.url), 'utf8')
  assert.ok(source.includes('@media(pointer:coarse){${T} [data-width-handle]{pointer-events:none}}'))
})

test('touch process bodies share the conversation scrollport without changing desktop caps', async () => {
  const source = await readFile(new URL('../client.js', import.meta.url), 'utf8')
  assert.ok(source.includes('${T} [data-step-process-body]{max-height:none;overflow:visible;mask-image:none}'))
  assert.ok(source.includes('${T} [data-conversation-scroll]{overscroll-behavior-y:none}'))
})

test('phone question footers wrap actions without changing desktop or tablet cards', async () => {
  const source = await readFile(new URL('../client.js', import.meta.url), 'utf8')
  assert.ok(source.includes('${M} [data-question-key]>section>footer{flex-wrap:wrap;gap:8px}'))
  assert.ok(source.includes('${M} [data-question-key]>section>footer>div:last-child{margin-left:auto}'))
})

test('touch sidebar workspace and session action seats stay visible without hover', async () => {
  const source = await readFile(new URL('../client.js', import.meta.url), 'utf8')
  assert.ok(source.includes('${T} [data-slot=sidebar] [data-row-key]>span:has(button){display:flex!important}'))
})

test('touch message, code, and process chrome has scoped 44px targets without hashed classes', async () => {
  const source = await readFile(new URL('../client.js', import.meta.url), 'utf8')
  assert.ok(source.includes('${T} [data-conversation-scroll] [data-clock]{height:auto;min-height:44px;flex-wrap:wrap}'))
  assert.ok(source.includes('${T} [data-conversation-scroll] [data-clock] button,${T} [data-code-block-banner] button{min-width:44px;min-height:44px;flex-shrink:0}'))
  assert.ok(source.includes('${T} button[data-turn-process],${T} button[data-process-activity],${T} [data-slot="tool.call.toolview"] [role=button][data-expandable=true]{min-height:44px}'))
})

test('touch workspace rows and document tools grow in their own header seats', async () => {
  const source = await readFile(new URL('../client.js', import.meta.url), 'utf8')
  assert.ok(source.includes('${T} [data-files-entry]>button{min-height:44px}'))
  assert.ok(source.includes('${T} [data-textpreview-state=text]>div:has([data-document-viewer-menu]){height:48px}'))
  assert.ok(source.includes('${T} [data-files-reload],${T} [data-document-viewer-menu],${T} [data-textpreview-tool]{min-width:44px;min-height:44px}'))
  assert.ok(source.includes('${T} [data-files-body],${T} [data-textpreview-body]{overscroll-behavior:contain}'))
  assert.ok(source.includes('${T} [data-document-zoom-controls] button{min-width:44px;min-height:44px}'))
})

test('inline menus retain host anchors and row sizes, with measured caps only in constrained viewports', async () => {
  const source = await readFile(new URL('../client.js', import.meta.url), 'utf8')
  assert.ok(source.includes(':not([data-composer-overlay] button)'))
  assert.ok(source.includes(':is(${M},${T}) [data-composer-seat]:has([data-composer-overlay] [data-menu-material]){z-index:25}'))
  assert.ok(source.includes(':is([data-dsh-mobile-keyboard],[data-dsh-pwa-compact]) [data-composer-overlay] [data-menu-material]{max-height:min(320px,var(--dsh-pwa-menu-room,320px))!important;translate:0 var(--dsh-pwa-menu-shift,0px)}'))
  assert.ok(source.includes('[data-trigger-menu]{max-height:min(400px,var(--dsh-pwa-menu-room,400px))!important}'))
  assert.doesNotMatch(source, /\[data-composer-overlay\][^\n]+position:fixed/)
  assert.doesNotMatch(source, /\[role=menu\] \[role=menuitem\]\{min-height:44px|\[id\^=dsh-slash-option-\]\{min-height:44px/)
  assert.ok(source.includes("overlay.style.removeProperty('--dsh-pwa-menu-room')"))
  assert.ok(source.includes('watch.disconnect(); clear()'))
})


test('compact keeps upstream header navigation and shared height/pan without legacy keyboard state', async () => {
  const source = await readFile(new URL('../client.js', import.meta.url), 'utf8')
  assert.ok(source.includes(':is(${M},${T}) #root{height:var(--dsh-pwa-viewport,100dvh)!important;min-height:0;transform:var(--dsh-pwa-shift,none)}'))
  assert.ok(source.includes(':is(${T},${M})[data-dsh-pwa-compact] [data-slot="conversation.header"] header{min-height:44px;'))
  assert.doesNotMatch(source, /data-dsh-pwa-kbd|saveScrolls|restoreScrolls|scrollTo\(/)
  assert.doesNotMatch(source, /data-slot="conversation.header"\]\{display:none/)
  assert.ok(source.includes('${M}[data-dsh-mobile-keyboard] [data-composer-dock]{display:none}'))
})
