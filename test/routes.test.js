import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { apply } from '../index.js'

function scope(services = {}) {
  const routes = new Map(), listeners = new Map(), disposers = [], injections = []
  const ctx = { ...services,
    get: key => services[key],
    effect: setup => { const dispose = setup(); if (typeof dispose === 'function') disposers.push(dispose) },
    on: (name, fn) => { listeners.set(name, fn); disposers.push(() => listeners.delete(name)) },
    inject: (names, setup) => { injections.push({ names, setup }) },
    webServer: { register: route => { assert.equal(routes.has(route.path), false); routes.set(route.path, route); return () => routes.delete(route.path) } },
  }
  const api = new Map()
  function connectionChild() {
    const childDisposers = []
    const child = { connection: { fetch: { register(route) { assert.equal(api.has(route.path), false); api.set(route.path, route); childDisposers.push(() => api.delete(route.path)) } } } }
    injections[0].setup(child)
    return () => { for (const dispose of childDisposers) dispose() }
  }
  return { ctx, routes, listeners, injections, api, connectionChild, dispose: () => { for (const dispose of disposers.reverse()) dispose() } }
}
async function call(route, method, payload = {}, envelope = {}) {
  return route.fetch(new Request(`http://localhost${route.path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: 'client-request', rpcId: 'r', method, payload, ...envelope }) }))
}

test('missing optional connection/manager never removes public PWA routes; reconnect owns only API routes', async () => {
  const app = scope()
  apply(app.ctx)
  assert.equal(app.routes.size, 6)
  assert.deepEqual(app.injections[0].names, ['connection'])
  const disconnect = app.connectionChild()
  assert.equal(app.api.size, 4)
  const response = await call(app.api.get('/api/dsh-pwa/update-status'), 'dsh-pwa/update-status')
  const state = (await response.json()).result
  assert.equal(state.ok, true)
  assert.equal(state.value.status, 'blocked')
  assert.equal(state.value.reason, 'manager-unavailable')
  disconnect(); assert.equal(app.api.size, 0); assert.equal(app.routes.size, 6)
  const next = app.connectionChild(); assert.equal(app.api.size, 4)
  next(); app.dispose(); assert.equal(app.routes.size, 0); assert.equal(app.listeners.size, 0)
  const reenabled = scope(); apply(reenabled.ctx); assert.equal(reenabled.routes.size, 6); reenabled.dispose()
})

test('authenticated Connection envelopes are validated; updater failures do not leak diagnostics', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'pwa-route-'))
  const app = scope({ profileContext: { dir: directory }, pluginManager: {
    listBundles: async () => [{ name: 'dsh-pwa', version: '0.2.0', installed: true, enabled: true, source: 'github:Aero123421/dsh-pwa' }],
    installBundle: async () => { throw new Error('private diagnostic') }, waitForInstall: async () => null,
  } })
  apply(app.ctx, undefined, { updates: { runtimeVersion: async () => '0.2.1-alpha.2', fetcher: async () => new Response('', { status: 404 }) } })
  const disconnect = app.connectionChild()
  try {
    const route = app.api.get('/api/dsh-pwa/update-check')
    assert.equal((await call(route, 'other-method')).status, 400)
    const result = (await (await call(route, 'dsh-pwa/update-check')).json()).result
    assert.equal(result.ok, true); assert.equal(result.value.status, 'no-release')
    const refused = await call(app.api.get('/api/dsh-pwa/update-begin'), 'dsh-pwa/update-begin', { candidateId: 'https://evil.test/file', requestId: '../secret' })
    const text = await refused.text(); assert.ok(!text.includes('private diagnostic')); assert.ok(text.includes('invalid-request'))
  } finally { disconnect(); app.dispose(); await rm(directory, { recursive: true, force: true }) }
})
