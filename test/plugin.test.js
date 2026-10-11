import assert from 'node:assert/strict'
import { test } from 'node:test'
import { apply, inject, name } from '../index.js'

function harness() {
  const routes = new Map()
  const handlers = new Map()
  const disposers = []
  const ctx = {
    webServer: {
      register(route) {
        assert.equal(route.kind, 'exact')
        assert.equal(routes.has(route.path), false)
        routes.set(route.path, route)
        return () => { routes.delete(route.path) }
      },
    },
    effect(factory) { disposers.push(factory()) },
    on(event, handler) {
      handlers.set(event, handler)
      disposers.push(() => handlers.delete(event))
    },
  }
  apply(ctx)
  return {
    routes, handlers,
    dispose() { for (const disposer of disposers.reverse()) disposer() },
  }
}

async function call(route, method = 'GET') {
  let status
  let headers
  let body
  await route.handler({ method }, {
    writeHead(code, fields) { status = code; headers = fields },
    end(data) { body = data },
  })
  return { status, headers, body }
}

function dimensions(png) {
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
  return [png.readUInt32BE(16), png.readUInt32BE(20)]
}

test('exports Cordis entry and cleanly unregisters every contribution', () => {
  assert.equal(name, 'dsh-pwa')
  assert.deepEqual(inject, ['webServer'])
  const app = harness()
  assert.deepEqual([...app.routes.keys()], [
    '/manifest.webmanifest', '/pwa/apple-touch-icon.png',
    '/pwa/icon-192.png', '/pwa/icon-512.png',
  ])
  assert.equal(app.handlers.has('webserver/index-inject'), true)
  app.dispose()
  assert.equal(app.routes.size, 0)
  assert.equal(app.handlers.size, 0)
})

test('manifest uses relative paths and provides installable raster icons', async () => {
  const app = harness()
  const route = app.routes.get('/manifest.webmanifest')
  const res = await call(route)
  assert.equal(res.status, 200)
  assert.match(res.headers['content-type'], /application\/manifest\+json/)
  const body = JSON.parse(res.body)
  assert.equal(body.name, 'DeepSeek Harness')
  assert.equal(body.short_name, 'DSH')
  assert.equal(body.display, 'standalone')
  assert.equal(body.start_url, './')
  assert.equal(body.scope, './')
  assert.equal(body.id, undefined)
  assert.deepEqual(body.icons.map(icon => icon.sizes), ['192x192', '512x512'])
  assert.deepEqual(body.icons.map(icon => icon.src), ['./pwa/icon-192.png', './pwa/icon-512.png'])
  assert.equal((await call(route, 'HEAD')).body, undefined)
  assert.equal((await call(route, 'POST')).status, 405)
  app.dispose()
})

test('serves opaque PNG assets with correct dimensions', async () => {
  const app = harness()
  for (const [name, size] of [['apple-touch-icon', 180], ['icon-192', 192], ['icon-512', 512]]) {
    const route = app.routes.get(`/pwa/${name}.png`)
    const res = await call(route)
    assert.equal(res.status, 200)
    assert.equal(res.headers['content-type'], 'image/png')
    assert.equal(res.headers['content-length'], res.body.length)
    assert.deepEqual(dimensions(res.body), [size, size])
    const head = await call(route, 'HEAD')
    assert.equal(head.status, 200)
    assert.equal(head.headers['content-length'], res.body.length)
    assert.equal(head.body, undefined)
    assert.equal((await call(route, 'PUT')).status, 405)
  }
  app.dispose()
})

test('inserts head metadata using mount-relative icon links', () => {
  const app = harness()
  const rows = []
  app.handlers.get('webserver/index-inject')(rows)
  assert.equal(rows.length, 1)
  assert.equal(rows[0].kind, 'html')
  assert.equal(rows[0].placement, 'head')
  assert.match(rows[0].html, /rel="apple-touch-icon"/)
  assert.match(rows[0].html, /href="\.\/pwa\/apple-touch-icon\.png"/)
  assert.match(rows[0].html, /apple-mobile-web-app-title/)
  app.dispose()
})
