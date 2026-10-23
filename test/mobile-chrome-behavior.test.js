import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { runInNewContext } from 'node:vm'

// Deliberately small DOM: only MobileChrome's selector/visibility contract.
// This does not emulate browser layout, native Tab navigation or native inert clicks.
class Element {
  constructor(doc, tag = 'div', attrs = {}, parent = null) {
    this.nodeType = 1; this.doc = doc; this.tag = tag; this.attrs = new Map(Object.entries(attrs)); this.parent = parent
    this.children = []; parent?.children.push(this); this.tabIndex = ['button', 'input', 'a'].includes(tag) ? 0 : -1
    this.disabled = false; this.visible = true; this.visibility = 'visible'; this.isConnected = true; this._inert = false
    this.classList = { contains: name => (this.attrs.get('class') ?? '').split(' ').includes(name) }
  }
  get inert() { return this._inert }
  set inert(value) { this._inert = value; if (value && this.contains(this.doc.activeElement)) this.doc.activeElement = this.doc.body }
  hasAttribute(name) { return this.attrs.has(name) }
  getAttribute(name) { return this.attrs.get(name) ?? null }
  setAttribute(name, value) { this.attrs.set(name, String(value)) }
  removeAttribute(name) { this.attrs.delete(name) }
  contains(node) { return node === this || this.children.some(child => child.contains(node)) }
  matches(selector) {
    return selector.split(',').some(part => {
      part = part.trim()
      if (part === '[inert]') return this.inert
      if (part === 'nav button') return this.tag === 'button' && !!this.parent?.closest('nav')
      const tag = part.match(/^[a-z]+/)?.[0]
      if (tag && tag !== this.tag) return false
      const attrs = [...part.matchAll(/\[([^\]^=]+)(\^=|=)?(?:"([^"]*)"|([^\]]*))?\]/g)]
      if (!tag && !attrs.length) throw new Error(`Unsupported selector: ${part}`)
      return attrs.every(([, name, op, quoted, bare]) => {
        if (!this.hasAttribute(name)) return false
        const value = quoted ?? bare
        return !op || (op === '^=' ? this.getAttribute(name).startsWith(value) : this.getAttribute(name) === value)
      })
    })
  }
  closest(selector) { return this.matches(selector) ? this : this.parent?.closest(selector) ?? null }
  querySelectorAll(selector) { return this.children.flatMap(child => [child, ...child.descendants()]).filter(el => el.matches(selector)) }
  descendants() { return this.children.flatMap(child => [child, ...child.descendants()]) }
  querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null }
  getClientRects() { return this.visible && !this.closest('[hidden]') ? [{}] : [] }
  focus() { if (!this.closest('[inert],[hidden]') && this.visible) this.doc.activeElement = this }
  click() { this.onClick?.() }
}
function store(initial) {
  let value = initial
  const listeners = new Set()
  return { listeners, getSnapshot: () => value, subscribe: fn => { listeners.add(fn); return () => listeners.delete(fn) },
    set(next) { value = next; for (const fn of [...listeners]) fn() } }
}
function queue() {
  let id = 0
  const pending = new Map()
  return { pending, add: fn => { pending.set(++id, fn); return id }, cancel: id => pending.delete(id),
    drain() { const callbacks = [...pending.values()]; pending.clear(); for (const fn of callbacks) fn() } }
}
function hooks(menu) {
  const slots = []; let index = 0, dirty = false, layout = [], effects = []
  const changed = (a, b) => !a || !b || a.length !== b.length || a.some((v, i) => !Object.is(v, b[i]))
  const effect = list => (fn, deps) => {
    const i = index++, old = slots[i]
    if (changed(old?.deps, deps)) list.push(() => { old?.cleanup?.(); slots[i] = { deps, cleanup: fn() } })
  }
  const React = {
    Fragment: Symbol('Fragment'), createElement: (type, props, ...children) => ({ type, props: props ?? {}, children }),
    useState(initial) { const i = index++; slots[i] ??= { value: initial }; return [slots[i].value, next => {
      const value = typeof next === 'function' ? next(slots[i].value) : next
      if (!Object.is(value, slots[i].value)) { slots[i].value = value; dirty = true }
    }] },
    useRef(initial) { const i = index++; slots[i] ??= { current: initial }; return slots[i] },
    useEffect: (fn, deps) => effect(effects)(fn, deps), useLayoutEffect: (fn, deps) => effect(layout)(fn, deps),
    useSyncExternalStore(subscribe, getSnapshot) { React.useEffect(() => subscribe(() => { dirty = true }), [subscribe]); return getSnapshot() },
  }
  function attach(node) {
    if (!node || typeof node !== 'object') return
    if (node.props?.ref) { node.props.ref.current = menu; menu.onClick = node.props.onClick
      for (const name of ['aria-label', 'title', 'aria-expanded']) menu.setAttribute(name, node.props[name]) }
    for (const child of node.children ?? []) (Array.isArray(child) ? child : [child]).forEach(attach)
  }
  return { React, render(component, props) {
    let result, turns = 0
    do { assert.ok(++turns < 20, 'hook renders converge'); dirty = false; index = 0; layout = []; effects = []
      result = component(props); attach(result); for (const fn of layout) fn(); for (const fn of effects) fn()
    } while (dirty)
    return result
  }, unmount() { for (const slot of slots) slot?.cleanup?.() } }
}
async function fixture(t, { active = true, leftOpen = false, rightOpen = false, initialInert = [false, false, false] } = {}) {
  const listeners = new Map(), observers = [], timers = queue(), raf = queue()
  const document = {
    addEventListener(type, fn, capture = false) { (listeners.get(type) ?? listeners.set(type, new Map()).get(type)).set(fn, capture) },
    removeEventListener(type, fn, capture = false) { assert.equal(listeners.get(type)?.get(fn), capture); listeners.get(type)?.delete(fn) },
  }
  const el = (tag, attrs, parent) => new Element(document, tag, attrs, parent)
  const body = document.body = el('body'); document.activeElement = body
  const frame = el('div', leftOpen ? {} : { 'data-sidebar-collapsed': '' }, body)
  const sidebar = el('div', {}, frame), sidebarSlot = el('div', { 'data-slot': 'sidebar' }, sidebar)
  const first = el('button', {}, sidebarSlot), last = el('button', {}, sidebarSlot)
  const center = el('div', {}, frame), opener = el('button', {}, center), input = el('input', {}, center)
  const right = el('div', { 'data-rightbar-col': '' }, frame)
  const panel = el('section', { 'data-sidebar-right-panel': '', ...(rightOpen ? { 'data-sidebar-right-open': '' } : {}) }, right)
  const rightFirst = el('button', {}, panel), rightLast = el('button', { 'data-sidebar-right-toggle': '' }, panel)
  const float = el('button', { 'data-dockkit-float': '' }, right)
  const menu = el('button', { class: 'dsh-pwa-menu' }, body)
  const normalQuery = frame.querySelector.bind(frame)
  frame.querySelector = selector => selector === ':scope > div:has(> [data-slot=main])' ? center : selector === ':scope > div:has(> [data-slot=sidebar])' ? sidebar : normalQuery(selector)
  document.querySelector = selector => selector === '[data-slot=root] > div' ? frame : body.querySelector(selector)
  document.querySelectorAll = selector => body.querySelectorAll(selector)
  ;[center, sidebar, right].forEach((node, i) => { node.inert = initialInert[i] })
  let toggles = 0, panelCloses = 0
  const panelInfo = store({ activePanelId: 'a' }), selection = store({ sessionId: 'a' })
  const mobile = store({ active }), localeState = store({ revision: 0 })
  const locale = { ...localeState, bind: ns => key => `${ns}:${key}` }
  const layout = { panelInfo, toggleSidebar() { toggles++; if (frame.hasAttribute('data-sidebar-collapsed')) frame.removeAttribute('data-sidebar-collapsed'); else frame.setAttribute('data-sidebar-collapsed', '') } }
  const ctx = { get: name => ({ layout, uiWorkspace: { selection } })[name] }
  rightLast.onClick = () => { panelCloses++; panel.removeAttribute('data-sidebar-right-open') }
  mobile.chrome = store({ open: null, inline: 1 }); mobile.chrome.get = mobile.chrome.getSnapshot
  mobile.focusMenu = () => menu.focus()
  const runtime = hooks(menu)
  let exported
  runInNewContext(await readFile(new URL('../client.js', import.meta.url), 'utf8'), {
    location: { pathname: '/', search: '', hash: '' }, HTMLElement: Element, CSS: { escape: value => value },
    window: { addEventListener: document.addEventListener, removeEventListener: document.removeEventListener, __ModuleLoader__: { load: entry => { exported = entry.factory(name => name === 'react' ? runtime.React : {}) } } },
    document, getComputedStyle: node => ({ visibility: node.visibility }),
    MutationObserver: class {
      constructor(callback) { this.callback = callback; this.targets = []; this.connected = true; observers.push(this) }
      observe(target, options) { this.targets.push({ target, options }) }
      disconnect() { this.connected = false }
    },
    setTimeout: timers.add, clearTimeout: timers.cancel, requestAnimationFrame: raf.add, cancelAnimationFrame: raf.cancel,
  })
  const render = () => runtime.render(exported.MobileChrome, { ctx, mobile, locale })
  const notify = () => { for (const observer of observers) if (observer.connected) observer.callback([]); return render() }
  let unmounted = false
  const unmount = () => { if (!unmounted) { runtime.unmount(); unmounted = true } }
  t.after(unmount)
  const fire = (type, values) => { const event = { defaultPrevented: false, preventDefault() { this.defaultPrevented = true }, ...values }
    for (const fn of [...(listeners.get(type)?.keys() ?? [])]) fn(event)
    return event
  }
  return { body, frame, sidebar, sidebarSlot, first, last, center, opener, input, right, panel, rightFirst, rightLast, float, menu,
    el, mobile, layout, panelInfo, selection, observers, listeners, timers, raf, render, notify, unmount, fire,
    get toggles() { return toggles }, get panelCloses() { return panelCloses } }
}


test('inactive chrome installs no DOM listeners or observers', async t => {
  const f = await fixture(t, { active: false }); assert.equal(f.render(), null)
  assert.equal(f.observers.length, 0); assert.equal(f.listeners.size, 0); assert.equal(f.panelInfo.listeners.size, 0)
})

test('Escape closes the right occupant and returns focus to the upstream menu', async t => {
  const f = await fixture(t, { rightOpen: true }); f.render(); f.rightFirst.focus()
  assert.equal(f.fire('keydown', { key: 'Escape' }).defaultPrevented, true)
  assert.equal(f.panelCloses, 1); assert.equal(f.toggles, 0)
  f.notify(); assert.equal(f.body.doc.activeElement, f.menu)
})

for (const role of ['dialog', 'menu']) {
  test(`right Escape defers to ${role} and preserves its focus`, async t => {
    const f = await fixture(t, { rightOpen: true }); f.render()
    const popup = f.el('div', { role, ...(role === 'dialog' ? { 'aria-modal': 'true' } : {}) }, f.body)
    const input = f.el('input', {}, popup); input.focus()
    assert.equal(f.fire('keydown', { key: 'Escape' }).defaultPrevented, false)
    assert.equal(f.panelCloses, 0); assert.equal(f.toggles, 0); assert.equal(f.body.doc.activeElement, input)
  })
}

test('defaultPrevented Escape is not handled twice', async t => {
  const f = await fixture(t, { rightOpen: true }); f.render()
  f.fire('keydown', { key: 'Escape', defaultPrevented: true }); assert.equal(f.panelCloses, 0)
})

test('a right panel already open on mount closes a hidden left drawer', async t => {
  const f = await fixture(t, { leftOpen: true, rightOpen: true }); f.render()
  assert.equal(f.toggles, 1); assert.ok(f.frame.hasAttribute('data-sidebar-collapsed'))
  f.notify(); assert.equal(f.toggles, 1); assert.equal(f.right.inert, false)
  // A later toggle must not queue another hidden drawer even when previous is right.
  f.frame.removeAttribute('data-sidebar-collapsed'); f.notify(); assert.equal(f.toggles, 2)
  f.panel.removeAttribute('data-sidebar-right-open'); f.notify()
  assert.equal(f.mobile.chrome.get().open, null)
})

test('upstream left Escape is retained and right floats never become inert', async t => {
  const f = await fixture(t, { leftOpen: true }); f.render()
  assert.equal(f.center.inert, true); assert.equal(f.sidebar.inert, false); assert.equal(f.right.inert, false)
  assert.equal(f.fire('keydown', { key: 'Escape' }).defaultPrevented, true)
  assert.equal(f.toggles, 1); assert.equal(f.panelCloses, 0); assert.equal(f.body.doc.activeElement, f.menu)
})

for (const initialInert of [[false, false, false], [true, false, true]]) {
  test(`upstream cleanup restores inert and removes owned resources: ${initialInert}`, async t => {
    const f = await fixture(t, { initialInert }); f.render()
    assert.equal(f.panelInfo.listeners.size, 1)
    const nav = f.el('nav', {}, f.sidebarSlot), button = f.el('button', {}, nav)
    f.fire('click', { target: button }); assert.equal(f.timers.pending.size, 1)
    f.unmount()
    assert.deepEqual([f.center.inert, f.sidebar.inert, f.right.inert], initialInert)
    assert.equal(f.panelInfo.listeners.size, 0); assert.equal(f.mobile.listeners.size, 0)
    assert.ok([...f.listeners.values()].every(set => set.size === 0))
    assert.ok(f.observers.every(observer => !observer.connected)); assert.equal(f.timers.pending.size, 0)
    f.fire('keydown', { key: 'Escape' }); f.timers.drain(); assert.equal(f.panelCloses, 0)
  })
}

test('search treeitem reselection closes but nested buttons and inputs do not', async t => {
  const f = await fixture(t, { leftOpen: true }); f.render()
  const row = f.el('div', { role: 'treeitem', 'aria-selected': 'true' }, f.sidebarSlot)
  const label = f.el('span', {}, row), action = f.el('button', {}, row), input = f.el('input', {}, row)
  f.fire('click', { target: action }); f.fire('click', { target: input }); assert.equal(f.timers.pending.size, 0)
  f.fire('click', { target: label }); f.timers.drain(); assert.equal(f.toggles, 1)
})

test('workspace New session closes while its menu and double-click rename keep the drawer', async t => {
  const f = await fixture(t, { leftOpen: true }); f.render()
  const row = f.el('div', { 'data-row-key': 'workspace:w' }, f.sidebarSlot)
  const menu = f.el('button', {}, row), create = f.el('button', {}, row), icon = f.el('span', {}, create)
  f.fire('click', { target: menu }); assert.equal(f.timers.pending.size, 0)
  f.fire('click', { target: icon, detail: 2 }); assert.equal(f.timers.pending.size, 0)
  f.fire('click', { target: icon }); f.timers.drain(); assert.equal(f.toggles, 1)
})

test('right-panel mutations do not toggle twice before the hidden drawer collapse commits', async t => {
  const f = await fixture(t, { leftOpen: true, rightOpen: true })
  let requested = 0
  f.layout.toggleSidebar = () => { requested++ }
  f.render(); assert.equal(requested, 1)
  f.notify(); f.notify(); assert.equal(requested, 1)
  f.frame.setAttribute('data-sidebar-collapsed', ''); f.notify()
  f.frame.removeAttribute('data-sidebar-collapsed'); f.notify(); assert.equal(requested, 2)
})

test('unmount right after a drawer dialog closes cancels the pending focus return', async t => {
  const f = await fixture(t, { leftOpen: true }); f.render()
  // A rename/confirm dialog opened from the drawer keeps it open and later returns focus to the opener.
  f.fire('pointerdown', { target: f.first })
  const dialog = f.el('div', { role: 'dialog', 'aria-modal': 'true' }, f.body)
  const bodyWatch = f.observers.find(o => o.connected && o.targets.some(({ target, options }) => target === f.body && options.childList && !options.subtree))
  bodyWatch.callback([{ addedNodes: [dialog] }])
  assert.equal(f.toggles, 0, 'a dialog from the drawer keeps the drawer')
  f.body.children.splice(f.body.children.indexOf(dialog), 1)
  const dialogWatch = f.observers.find(o => o.connected && o.targets.some(({ target, options }) => target === f.body && options.subtree))
  dialogWatch.callback([])
  assert.equal(f.body.doc.activeElement, f.first, 'focus returns to the drawer opener')
  assert.ok(f.raf.pending.size > 0 && f.timers.pending.size > 0, 'late retries are scheduled')
  // The user moves on, then the chrome unmounts before the retries run.
  const elsewhere = f.el('input', {}, f.body); elsewhere.focus(); f.unmount()
  assert.equal(f.raf.pending.size, 0); assert.equal(f.timers.pending.size, 0)
  f.raf.drain(); f.timers.drain()
  assert.equal(f.body.doc.activeElement, elsewhere, 'no stale retry steals focus after unmount')
})
