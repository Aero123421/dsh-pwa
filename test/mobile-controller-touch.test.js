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
  const attrs = new Set(), props = new Map(), order = [], styleCalls = [], focus = new Set(), focusEvents = new Map(), vvEvents = new Map()
  const root = { toggleAttribute: (key, on) => { order.push('write'); on ? attrs.add(key) : attrs.delete(key) }, removeAttribute: key => attrs.delete(key),
    style: { setProperty: (key, value) => { order.push('write'); styleCalls.push({ key, value }); props.set(key, value) }, removeProperty: key => { order.push('write'); styleCalls.push({ key, value: null }); props.delete(key) } } }
  const document = { activeElement: null,
    addEventListener: (type, fn) => { focus.add(fn); focusEvents.set(type, fn) },
    removeEventListener: (type, fn) => { focus.delete(fn); focusEvents.delete(type) } }
  const view = { document, height: 844, get innerHeight() { order.push('read-height'); return this.height }, get innerWidth() { order.push('read-width'); return 810 } }
  const viewport = { height: 844, width: 810, offsetTop: 0, scale: 1, addEventListener: (type, fn) => vvEvents.set(type, fn), removeEventListener: type => vvEvents.delete(type) }
  const coarse = query(touch), small = query(narrow)
  const mobile = new MobileController({ root, view, viewport, storage: null, matchMedia: q => q.includes('any-pointer') ? coarse : small })
  return { mobile, attrs, props, order, styleCalls, focus, focusEvents, vvEvents, viewport, document, view, coarse, small }
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
  assert.equal(f.focusEvents.size, 0); assert.equal(f.mobile.viewportBaseline, null)
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

test('Android resizes-content detects an editable-focused keyboard and clears on focusout/close', async () => {
  const f = await fixture({ narrow: true })
  f.document.activeElement = { matches: () => true, closest: () => true }
  f.viewport.height = f.view.height = 524
  f.order.length = 0; f.mobile.measure()
  assert.ok(f.attrs.has('data-dsh-mobile-keyboard'))
  assert.ok(f.order.indexOf('read-height') < f.order.indexOf('write'))
  f.document.activeElement = null; f.focusEvents.get('focusout')()
  assert.equal(f.attrs.has('data-dsh-mobile-keyboard'), false)
  f.document.activeElement = { isContentEditable: true, closest: () => true }
  f.focusEvents.get('focusin')(); assert.ok(f.attrs.has('data-dsh-mobile-keyboard'))
  f.viewport.height = f.view.height = 844; f.mobile.measure()
  assert.equal(f.attrs.has('data-dsh-mobile-keyboard'), false)
  f.mobile.dispose(); assert.equal(f.focusEvents.size, 0)
})

test('layout resize without editable focus is not a keyboard, and a width change resets the reference', async () => {
  const f = await fixture()
  f.viewport.height = f.view.height = 500; f.mobile.measure()
  assert.equal(f.attrs.has('data-dsh-mobile-keyboard'), false)
  f.document.activeElement = { matches: () => true, closest: () => true }
  f.mobile.measure(); assert.ok(f.attrs.has('data-dsh-mobile-keyboard'))
  f.viewport.width = 1080; f.mobile.measure()
  assert.equal(f.attrs.has('data-dsh-mobile-keyboard'), false)
  f.viewport.height = f.view.height = 621; f.mobile.measure()
  f.viewport.height = f.view.height = 501; f.mobile.measure()
  assert.equal(f.attrs.has('data-dsh-mobile-keyboard'), false)
  f.viewport.height = f.view.height = 500; f.mobile.measure()
  assert.ok(f.attrs.has('data-dsh-mobile-keyboard'))
  f.mobile.dispose()
})

test('iOS visual-only shrink still detects keyboard without editable focus', async () => {
  const f = await fixture()
  f.viewport.height = 500; f.mobile.measure()
  assert.equal(f.document.activeElement, null)
  assert.ok(f.attrs.has('data-dsh-mobile-keyboard'))
  f.viewport.height = 844; f.mobile.measure()
  assert.equal(f.attrs.has('data-dsh-mobile-keyboard'), false)
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


test('viewport event pairs with unchanged or 1–2px geometry noise do not write CSS', async () => {
  const f = await fixture(); f.styleCalls.length = 0
  for (let i = 0; i < 60; i++) {
    f.viewport.height = 844 - [0, 1, 0, 2, 1, 0][i % 6]
    f.viewport.offsetTop = [0, 1, 0, 2, 1, 0][i % 6]
    f.vvEvents.get('scroll')(); f.vvEvents.get('resize')()
  }
  assert.equal(f.styleCalls.length, 0)
  assert.equal(f.props.get('--dsh-pwa-viewport'), '844px')
  assert.equal(f.props.has('--dsh-pwa-shift'), false)
  assert.equal(f.attrs.has('data-dsh-mobile-keyboard'), false)
  f.mobile.dispose()
})

test('height hysteresis uses the last committed height and width changes land immediately', async () => {
  const f = await fixture(); f.styleCalls.length = 0
  for (const h of [843, 842, 841]) { f.viewport.height = h; f.mobile.measure() }
  assert.equal(f.styleCalls.length, 0)
  f.viewport.height = 840; f.mobile.measure()
  assert.equal(f.props.get('--dsh-pwa-viewport'), '840px')
  f.viewport.height = 839; f.mobile.measure()
  assert.equal(f.props.get('--dsh-pwa-viewport'), '840px')
  f.viewport.width = 1080; f.mobile.measure()
  assert.equal(f.props.get('--dsh-pwa-viewport'), '839px')
  assert.equal(f.mobile.viewportBaseline.width, 1080)
  assert.equal(f.mobile.viewportBaseline.height, 839)
  f.mobile.dispose()
})

test('keyboard transitions bypass height hysteresis and shift applies only while detected', async () => {
  const f = await fixture()
  f.viewport.offsetTop = 40; f.mobile.measure()
  assert.equal(f.props.has('--dsh-pwa-shift'), false)
  f.viewport.height = 724; f.mobile.measure()
  assert.equal(f.attrs.has('data-dsh-mobile-keyboard'), false)
  f.viewport.height = 723; f.mobile.measure()
  assert.equal(f.props.get('--dsh-pwa-viewport'), '723px')
  assert.equal(f.props.get('--dsh-pwa-shift'), 'translateY(40px)')
  assert.ok(f.attrs.has('data-dsh-mobile-keyboard'))
  f.styleCalls.length = 0; f.mobile.measure()
  assert.equal(f.styleCalls.length, 0)
  f.viewport.offsetTop = 41; f.mobile.measure()
  assert.equal(f.props.get('--dsh-pwa-shift'), 'translateY(41px)')
  f.viewport.height = 724; f.mobile.measure()
  assert.equal(f.props.get('--dsh-pwa-viewport'), '724px')
  assert.equal(f.props.has('--dsh-pwa-shift'), false)
  assert.equal(f.attrs.has('data-dsh-mobile-keyboard'), false)
  f.mobile.dispose()
})

test('touch tracking resets committed geometry so reactivation writes a fresh small size change', async () => {
  const f = await fixture()
  f.coarse.set(false)
  assert.equal(f.mobile.viewportSize, null); assert.equal(f.mobile.viewportShift, null)
  f.viewport.height = 842; f.coarse.set(true)
  assert.equal(f.props.get('--dsh-pwa-viewport'), '842px')
  f.mobile.dispose()
  assert.equal(f.mobile.viewportSize, null); assert.equal(f.mobile.viewportShift, null)
})

function focused(selector) {
  return { matches: s => s.split(',').some(part => part.trim() === 'textarea'), isContentEditable: false, closest: s => s === selector ? {} : null }
}

test('an overlay keyboard over a focused terminal keeps the full layout height and no shift', async () => {
  const f = await fixture()
  f.document.activeElement = focused('.xterm')
  f.viewport.height = 500; f.viewport.offsetTop = 40; f.mobile.measure()
  assert.ok(f.attrs.has('data-dsh-mobile-keyboard'), 'still a keyboard for the rest of the UI')
  assert.equal(f.props.get('--dsh-pwa-viewport'), '844px', 'the terminal box, and so the shell size, stays put')
  assert.equal(f.props.has('--dsh-pwa-shift'), false, 'the browser pans to the cursor instead')
  f.viewport.height = 844; f.viewport.offsetTop = 0; f.mobile.measure()
  assert.equal(f.props.get('--dsh-pwa-viewport'), '844px')
  assert.equal(f.styleCalls.filter(call => call.key === '--dsh-pwa-viewport' && call.value !== '844px').length, 0, 'no terminal resize across open and close')
  f.mobile.dispose()
})

test('the terminal hold applies only to the terminal and only to overlay keyboards', async () => {
  const composer = await fixture()
  composer.document.activeElement = focused('[data-composer-input]')
  composer.viewport.height = 500; composer.viewport.offsetTop = 40; composer.mobile.measure()
  assert.equal(composer.props.get('--dsh-pwa-viewport'), '500px'); assert.equal(composer.props.get('--dsh-pwa-shift'), 'translateY(40px)')
  composer.mobile.dispose()
  const resizing = await fixture()
  resizing.document.activeElement = focused('.xterm')
  // resizes-content: the window itself shrinks, so innerHeight follows the visual height.
  resizing.view.height = 500; resizing.viewport.height = 500; resizing.mobile.measure()
  assert.equal(resizing.props.get('--dsh-pwa-viewport'), '500px', 'a resizing keyboard shrinks the window; the plugin does not oversize the app')
  resizing.mobile.dispose()
})
