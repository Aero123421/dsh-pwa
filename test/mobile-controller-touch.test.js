import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { runInNewContext } from 'node:vm'

async function clientExports() {
  let result
  runInNewContext(await readFile(new URL('../client.js', import.meta.url), 'utf8'), {
    window: { __ModuleLoader__: { load: entry => { result = entry.factory(() => ({})) } } }, setTimeout, clearTimeout,
  })
  return result
}

function query(matches) {
  const listeners = new Set()
  return { matches, listeners, addEventListener: (_, fn) => listeners.add(fn), removeEventListener: (_, fn) => listeners.delete(fn),
    set(value) { this.matches = value; for (const fn of listeners) fn() } }
}
async function fixture({ touch = true, narrow = false } = {}) {
  const { MobileController } = await clientExports()
  const attrs = new Set(), props = new Map(), order = [], focus = new Set(), vvEvents = new Map()
  const root = { toggleAttribute: (key, on) => { order.push('write'); on ? attrs.add(key) : attrs.delete(key) }, removeAttribute: key => attrs.delete(key),
    style: { setProperty: (key, value) => { order.push('write'); props.set(key, value) }, removeProperty: key => { order.push('write'); props.delete(key) } } }
  const document = { activeElement: null, addEventListener: (_, fn) => focus.add(fn), removeEventListener: (_, fn) => focus.delete(fn) }
  const view = { document, get innerHeight() { order.push('read-height'); return 844 }, get innerWidth() { order.push('read-width'); return 810 } }
  const viewport = { height: 844, width: 810, offsetTop: 0, scale: 1, addEventListener: (type, fn) => vvEvents.set(type, fn), removeEventListener: type => vvEvents.delete(type) }
  const coarse = query(touch), small = query(narrow)
  const mobile = new MobileController({ root, view, viewport, storage: null, matchMedia: q => q.includes('any-pointer') ? coarse : small })
  return { mobile, attrs, props, order, focus, vvEvents, viewport, document, coarse, small }
}

test('touch attribute and viewport follow any-pointer independently of mobile mode, with full cleanup', async () => {
  const f = await fixture()
  assert.equal(f.mobile.state.active, false); assert.ok(f.attrs.has('data-dsh-touch'))
  assert.equal(f.props.get('--dsh-pwa-viewport'), '844px')
  f.mobile.setMode('off'); f.viewport.height = 240; f.viewport.offsetTop = 12; f.mobile.measure()
  assert.ok(f.attrs.has('data-dsh-mobile-keyboard')); assert.ok(f.attrs.has('data-dsh-pwa-compact'))
  assert.equal(f.props.get('--dsh-pwa-shift'), 'translateY(12px)')
  f.coarse.set(false)
  assert.equal(f.props.size, 0); assert.equal(f.attrs.size, 0)
  f.coarse.set(true); f.mobile.dispose()
  assert.equal(f.attrs.size, 0); assert.equal(f.props.size, 0); assert.equal(f.focus.size, 0)
  assert.equal(f.vvEvents.size, 0); assert.equal(f.coarse.listeners.size, 0); assert.equal(f.small.listeners.size, 0)
})

test('measure reads window geometry before its first CSS write and uses visual height for compact', async () => {
  const f = await fixture(); f.order.length = 0
  f.viewport.height = 260; f.viewport.width = 520; f.mobile.measure()
  assert.ok(f.order.indexOf('read-height') < f.order.indexOf('write'))
  assert.ok(f.attrs.has('data-dsh-pwa-compact'))
  f.viewport.width = 519; f.mobile.measure(); assert.equal(f.attrs.has('data-dsh-pwa-compact'), false)
  f.viewport.width = 480; f.viewport.height = 200; f.mobile.measure(); assert.ok(f.attrs.has('data-dsh-pwa-compact'))
  f.viewport.height = 261; f.mobile.measure(); assert.equal(f.attrs.has('data-dsh-pwa-compact'), false)
  f.viewport.height = 724; f.mobile.measure(); assert.equal(f.attrs.has('data-dsh-mobile-keyboard'), false)
  f.viewport.height = 723; f.mobile.measure(); assert.ok(f.attrs.has('data-dsh-mobile-keyboard'))
  f.viewport.scale = 2; f.viewport.height = 200; f.mobile.measure(); assert.equal(f.props.get('--dsh-pwa-viewport'), '723px')
  f.mobile.dispose()
})

test('modal focus is revealed on keyboard measure and short-viewport focusin, excluding composer/non-modal/visible fields', async () => {
  const f = await fixture(), scrolled = []
  let rect = { top: 700, bottom: 730 }, modal = true, composer = false, editable = true
  const input = { matches: () => editable, closest: selector => selector.includes('composer') ? composer : modal,
    getBoundingClientRect: () => rect, scrollIntoView: options => scrolled.push({ ...options }) }
  f.document.activeElement = input
  f.viewport.height = 400; f.viewport.offsetTop = 100; f.mobile.measure()
  assert.deepEqual(scrolled, [{ block: 'nearest', inline: 'nearest' }])
  const focus = () => { for (const fn of f.focus) fn({ target: input }) }
  rect = { top: 90, bottom: 120 }; focus(); assert.equal(scrolled.length, 2)
  rect = { top: 110, bottom: 490 }; focus(); assert.equal(scrolled.length, 2)
  rect = { top: 500, bottom: 530 }; composer = true; focus(); composer = false; modal = false; focus()
  modal = true; editable = false; focus(); assert.equal(scrolled.length, 2)
  editable = true; f.viewport.height = 844; f.mobile.measure(); focus(); assert.equal(scrolled.length, 2)
  f.mobile.dispose(); focus(); assert.equal(scrolled.length, 2)
})
