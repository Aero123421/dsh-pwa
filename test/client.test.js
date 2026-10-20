import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { runInNewContext } from 'node:vm'
import { webcrypto } from 'node:crypto'

export async function clientExports() {
  let exports
  runInNewContext(await readFile(new URL('../client.js', import.meta.url), 'utf8'), {
    window: { __ModuleLoader__: { load: entry => { exports = entry.factory(() => ({})) } } },
    crypto: webcrypto, setTimeout, clearTimeout,
  })
  return exports
}
function storage() { const values = new Map(); return { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) } }

test('Client owns ID before first request; lost reply and another Client discover one operation', async () => {
  const { UpdateController } = await clientExports()
  const saved = storage(), calls = []
  let accepted
  const connection = { rpc: { call: async (_path, method, payload) => {
    calls.push(method)
    if (method.endsWith('begin')) { assert.equal(payload.profileKey, 'profileA'); accepted = payload.requestId; assert.equal(saved.getItem('dsh-pwa:update:profileA'), accepted); throw new Error('disconnected') }
    return { ok: true, value: { profileKey: 'profileA', requestId: accepted, status: accepted ? 'restart-required' : 'idle' } }
  } } }
  const first = new UpdateController(connection, saved)
  first.profileKey = 'profileA'; first.publish({ status: 'available', candidate: { id: '7' } })
  await Promise.all([first.begin(), first.begin()])
  assert.equal(first.state.status, 'unknown'); first.dispose()
  const replacement = new UpdateController(connection, saved)
  await replacement.load()
  assert.equal(replacement.state.status, 'restart-required')
  assert.equal(replacement.requestId, accepted)
  const other = new UpdateController(connection, storage())
  await other.load(); assert.equal(other.requestId, accepted)
  assert.equal(calls.filter(method => method.endsWith('begin')).length, 1)
  replacement.dispose(); other.dispose()
})

test('authoritative busy refusal clears rejected UUID and later status discovers accepted request', async () => {
  const { UpdateController } = await clientExports()
  const saved = storage(), calls = []
  const controller = new UpdateController({ rpc: { call: async (_path, method) => {
    calls.push(method)
    return method.endsWith('begin') ? { ok: false, error: { code: 'dsh-pwa/busy' } } : { ok: true, value: { profileKey: 'p', requestId: 'accepted', status: 'restart-required' } }
  } } }, saved)
  controller.profileKey = 'p'; controller.publish({ status: 'available', candidate: { id: '7' } })
  await controller.begin(); assert.equal(saved.getItem('dsh-pwa:update:p'), undefined)
  await controller.load(); assert.equal(controller.requestId, 'accepted')
  assert.equal(calls.at(-1), 'dsh-pwa/update-status'); controller.dispose()
})

test('profile change does not read another profile\'s pending sessionStorage UUID', async () => {
  const { UpdateController } = await clientExports()
  const saved = storage(), calls = []
  saved.setItem('dsh-pwa:update:profileA', 'old-pending')
  const controller = new UpdateController({ rpc: { call: async (_path, method) => { calls.push(method); return { ok: true, value: { profileKey: 'profileB', status: 'idle' } } } } }, saved)
  await controller.load(); assert.equal(controller.state.status, 'idle')
  assert.equal(calls.length, 1); controller.dispose()
})

test('old responses after connection reset/disposal cannot mutate state or storage; locale keys match', async () => {
  const { UpdateController, copy } = await clientExports()
  let complete
  const check = new Promise(resolve => { complete = resolve })
  const controller = new UpdateController({ rpc: { call: async (_path, method) => method.endsWith('check') ? check : { ok: true, value: { profileKey: 'p', status: 'idle' } } } }, storage())
  const pending = controller.check(); await controller.load()
  complete({ ok: true, value: { status: 'available' } }); await pending
  assert.equal(controller.state.status, 'idle'); controller.dispose()
  assert.deepEqual(Object.keys(copy.en).sort(), Object.keys(copy.ja).sort())
  assert.match(copy.en['reason.restored'], /previous version was installed again/)
  assert.match(copy.ja['reason.restored'], /以前の版を入れ直しました/)
  assert.match(copy.en['reason.plugin-missing'], /may have been removed/)
  assert.match(copy.ja['reason.plugin-missing'], /消えている可能性があります/)
})

test('Client contribution stays optional without settings, locale or connection', async () => {
  const { apply } = await clientExports()
  assert.equal(apply({}), undefined)
  assert.equal(apply({ slots: { inject() { throw new Error('unexpected contribution') } } }), undefined)
})

test('profile change clears old in-memory request before later connection failure', async () => {
  const { UpdateController } = await clientExports()
  let fail = false
  const controller = new UpdateController({ rpc: { call: async () => { if (fail) throw new Error('network'); return { ok: true, value: { profileKey: 'B', status: 'idle' } } } } }, storage())
  controller.profileKey = 'A'; controller.requestId = 'old-A'; controller.publish({ status: 'unknown' })
  await controller.load(); assert.equal(controller.requestId, undefined)
  fail = true; await controller.load(); assert.equal(controller.state.status, 'blocked'); controller.dispose()
})

function media(matches) {
  const listeners = new Set()
  return { query: { get matches() { return matches }, addEventListener: (_type, fn) => listeners.add(fn), removeEventListener: (_type, fn) => listeners.delete(fn) },
    set(value) { matches = value; for (const fn of listeners) fn() }, listeners }
}
function root() { const attrs = new Set(); return { attrs, toggleAttribute: (name, on) => { if (on) attrs.add(name); else attrs.delete(name) }, removeAttribute: name => attrs.delete(name) } }

test('mobile layout defaults to auto and follows the narrow-screen query', async () => {
  const { MobileController } = await clientExports()
  const narrow = media(false), html = root(), seen = []
  const mobile = new MobileController({ storage: storage(), matchMedia: () => narrow.query, root: html })
  mobile.subscribe(() => seen.push(mobile.getSnapshot().active))
  assert.deepEqual({ ...mobile.getSnapshot() }, { mode: 'auto', active: false }); assert.equal(html.attrs.has('data-dsh-mobile'), false)
  narrow.set(true); assert.equal(html.attrs.has('data-dsh-mobile'), true)
  narrow.set(false); assert.deepEqual(seen, [true, false])
  mobile.dispose(); assert.equal(narrow.listeners.size, 0); assert.equal(html.attrs.has('data-dsh-mobile'), false)
})

test('mobile layout choice is saved per browser and ignores unknown modes', async () => {
  const { MobileController } = await clientExports()
  const saved = storage(), narrow = media(true), html = root()
  const first = new MobileController({ storage: saved, matchMedia: () => narrow.query, root: html })
  first.setMode('off'); assert.equal(saved.getItem('dsh-pwa:mobile-ui'), 'off'); assert.equal(html.attrs.has('data-dsh-mobile'), false)
  first.setMode('sideways'); assert.equal(first.getSnapshot().mode, 'off'); first.dispose()
  const desktop = media(false)
  const second = new MobileController({ storage: saved, matchMedia: () => desktop.query, root: html })
  assert.equal(second.getSnapshot().mode, 'off'); second.setMode('on')
  assert.deepEqual({ ...second.getSnapshot() }, { mode: 'on', active: true }); assert.equal(html.attrs.has('data-dsh-mobile'), true)
  saved.setItem('dsh-pwa:mobile-ui', 'bogus'); second.dispose()
  const fallback = new MobileController({ storage: saved, matchMedia: () => desktop.query, root: html })
  assert.equal(fallback.getSnapshot().mode, 'auto'); fallback.dispose()
})

test('mobile layout survives missing storage and matchMedia', async () => {
  const { MobileController } = await clientExports()
  const broken = { getItem() { throw new Error('denied') }, setItem() { throw new Error('denied') } }
  const mobile = new MobileController({ storage: broken, matchMedia: () => undefined, root: root() })
  assert.deepEqual({ ...mobile.getSnapshot() }, { mode: 'auto', active: false })
  mobile.setMode('on'); assert.equal(mobile.getSnapshot().active, true); mobile.dispose()
})

function styledRoot() {
  const attrs = new Set(), props = new Map()
  return { attrs, props, toggleAttribute: (name, on) => { if (on) attrs.add(name); else attrs.delete(name) }, removeAttribute: name => attrs.delete(name),
    style: { setProperty: (name, value) => props.set(name, value), removeProperty: name => props.delete(name) } }
}
function visualViewport(values) {
  const listeners = new Map()
  return { ...values, addEventListener: (type, fn) => listeners.set(type, fn), removeEventListener: type => listeners.delete(type), listeners,
    set(next) { Object.assign(this, next); for (const fn of listeners.values()) fn() } }
}

test('auto mode also covers phones in landscape', async () => {
  const { MobileController } = await clientExports()
  let query
  const mobile = new MobileController({ storage: storage(), matchMedia: value => { query = value; return media(false).query }, root: root(), viewport: null })
  assert.match(query, /max-width: 767px/); assert.match(query, /max-height: 500px\) and \(pointer: coarse\)/)
  mobile.dispose()
})

test('mobile layout follows the visual viewport when an on-screen keyboard opens', async () => {
  const { MobileController } = await clientExports()
  const html = styledRoot(), viewport = visualViewport({ height: 844, offsetTop: 0, scale: 1 })
  const mobile = new MobileController({ storage: storage(), matchMedia: () => media(true).query, root: html, viewport, view: { innerHeight: 844 } })
  assert.equal(html.props.get('--dsh-pwa-viewport'), '844px'); assert.equal(html.props.has('--dsh-pwa-shift'), false)
  assert.equal(html.attrs.has('data-dsh-mobile-keyboard'), false)
  // iOS keeps the window height and pans the shorter visual viewport down.
  viewport.set({ height: 500.4, offsetTop: 343.6 })
  assert.equal(html.props.get('--dsh-pwa-viewport'), '500px'); assert.equal(html.props.get('--dsh-pwa-shift'), 'translateY(344px)')
  assert.equal(html.attrs.has('data-dsh-mobile-keyboard'), true)
  // Pinch zoom moves the visual viewport too; the last unzoomed frame stays.
  viewport.set({ scale: 2, height: 300, offsetTop: 10 })
  assert.equal(html.props.get('--dsh-pwa-viewport'), '500px')
  viewport.set({ scale: 1, height: 844, offsetTop: 0 })
  assert.equal(html.props.has('--dsh-pwa-shift'), false); assert.equal(html.attrs.has('data-dsh-mobile-keyboard'), false)
  mobile.setMode('off')
  assert.equal(html.props.has('--dsh-pwa-viewport'), false)
  mobile.dispose(); assert.equal(viewport.listeners.size, 0)
})

test('a successful update hides the stage name and a settings dialog is recognized', async () => {
  const source = await readFile(new URL('../client.js', import.meta.url), 'utf8')
  const { showUpdateStage, openedDialog, drawerDialogKeepsDrawer } = await clientExports()
  assert.equal(showUpdateStage({ status: 'applied', result: { stage: 'enable' } }), false)
  assert.equal(showUpdateStage({ status: 'failed', result: { stage: 'enable' } }), true)
  assert.equal(showUpdateStage({ status: 'applied' }), false)
  assert.equal(source.includes('scrollIntoView'), false)
  assert.equal(source.includes('position:sticky'), false)
  const probe = present => ({ nodeType: 1, matches: () => false, querySelector: selector => present(selector) ? {} : null })
  assert.equal(openedDialog(probe(selector => selector.includes('[role=dialog][aria-modal="true"]'))), true)
  assert.equal(openedDialog(probe(selector => selector.includes('[data-shortcut-modal=settings]'))), true)
  assert.equal(openedDialog(probe(selector => selector === '[role=dialog]')), false)
  assert.equal(openedDialog({ nodeType: 3 }), false)
  assert.equal(drawerDialogKeepsDrawer({ settings: true, modal: true, fromDrawer: true }), false)
  assert.equal(drawerDialogKeepsDrawer({ modal: true, fromDrawer: true }), true)
  assert.equal(drawerDialogKeepsDrawer({ modal: true, focusInSidebar: true }), true)
  assert.equal(drawerDialogKeepsDrawer({ modal: true }), false)
})

test('a modal, a route change, or Escape closes an open drawer once', async () => {
  const { drawerShouldClose } = await clientExports()
  assert.equal(drawerShouldClose({ open: true, modal: true }), true)
  assert.equal(drawerShouldClose({ open: true, route: true }), true)
  assert.equal(drawerShouldClose({ open: true, escape: true }), true)
  assert.equal(drawerShouldClose({ open: true, escape: true, menu: true }), false)
  assert.equal(drawerShouldClose({ open: false, modal: true }), false)
})

test('release notes follow the UI language and are not left as one raw markdown string', async () => {
  const { notesForLocale, releaseNoteBlocks, inlineParts } = await clientExports()
  const notes = { en: '# Hello\n\n- See [notes](https://example.com/n)\n\n`code`', ja: '# 日本語\n\n- 項目' }
  assert.equal(notesForLocale(notes, 'en'), notes.en)
  assert.equal(notesForLocale(notes, 'zh'), notes.en)
  assert.equal(notesForLocale(notes, 'zh-CN'), notes.en)
  assert.equal(notesForLocale({ ...notes, zh: '# 中文' }, 'zh'), '# 中文')
  assert.equal(notesForLocale({ ...notes, zh: '# 中文' }, 'zh-CN'), '# 中文')
  assert.equal(notesForLocale(notes, 'ja-JP'), notes.ja)
  assert.equal(notesForLocale('日本語だけ', 'en'), '')
  assert.equal(notesForLocale('日本語だけ', 'ja'), '日本語だけ')
  const published = { notes: '日本語だけ', notesByLocale: { en: '# Hello', ja: '# 日本語', zh: '# 中文' } }
  assert.equal(notesForLocale(published, 'en'), '# Hello')
  assert.equal(notesForLocale(published, 'ja-JP'), '# 日本語')
  assert.equal(notesForLocale(published, 'zh-CN'), '# 中文')
  assert.equal(notesForLocale({ notes: '日本語だけ' }, 'en'), '')
  assert.equal(notesForLocale({ notes: '日本語だけ' }, 'ja'), '日本語だけ')
  const blocks = releaseNoteBlocks(notes.en)
  assert.equal(blocks.map(block => block.type).join(','), 'h,ul,p')
  assert.equal(inlineParts(blocks.items ? '' : 'See [notes](https://example.com/n)')[1].href, 'https://example.com/n')
  assert.equal(blocks[0].text, 'Hello')
  assert.equal(blocks[1].items[0].includes('[notes]'), true)
})

test('the plugin registers its dictionary and does not define ja', async () => {
  const source = await readFile(new URL('../client.js', import.meta.url), 'utf8')
  assert.equal(source.includes('addLanguage'), false)
  assert.match(source, /ctx\.locale\.register\(NS, copy\)/)
  const check = await readFile(new URL('../scripts/browser-check.mjs', import.meta.url), 'utf8')
  assert.equal(check.includes('addLanguage'), false)
  assert.match(check, /dsh-japanese/)
  assert.match(check, /setLocale\('ja'\)/)
})

test('a conversation header menu replaces the fallback toolbar only while mounted', async () => {
  const { MobileController } = await clientExports()
  const html = styledRoot()
  const mobile = new MobileController({ storage: storage(), matchMedia: () => media(true).query, root: html, viewport: null })
  assert.equal(html.attrs.has('data-dsh-mobile-toolbar'), true)
  const toolbar = mobile.claimMenu({}, false)
  assert.equal(mobile.chrome.get().inline, 0); assert.equal(html.attrs.has('data-dsh-mobile-toolbar'), true)
  const header = mobile.claimMenu({}, true)
  assert.equal(mobile.chrome.get().inline, 1); assert.equal(html.attrs.has('data-dsh-mobile-toolbar'), false)
  header(); header()
  assert.equal(mobile.chrome.get().inline, 0); assert.equal(html.attrs.has('data-dsh-mobile-toolbar'), true)
  mobile.chrome.set({ open: 'left' }); mobile.setMode('off')
  assert.equal(mobile.chrome.get().open, null); assert.equal(html.attrs.has('data-dsh-mobile-toolbar'), false)
  toolbar(); mobile.dispose()
  assert.deepEqual([...html.attrs], [])
})
