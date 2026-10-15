import assert from 'node:assert/strict'
import { inflateSync } from 'node:zlib'
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

function paeth(left, up, upLeft) {
  const estimate = left + up - upLeft
  const dl = Math.abs(estimate - left), du = Math.abs(estimate - up), dul = Math.abs(estimate - upLeft)
  if (dl <= du && dl <= dul) return left
  return du <= dul ? up : upLeft
}

/** Non-interlaced 8-bit RGB or RGBA. Used to check the maskable safe zone without a PNG dependency. */
function decodePng(png) {
  const [width, height] = dimensions(png)
  let offset = 8
  const chunks = []
  let colorType
  while (offset < png.length) {
    const length = png.readUInt32BE(offset)
    const type = png.subarray(offset + 4, offset + 8).toString()
    const data = png.subarray(offset + 8, offset + 8 + length)
    if (type === 'IHDR') { colorType = data[9]; assert.equal(data[8], 8); assert.equal(data[12], 0) }
    else if (type === 'IDAT') chunks.push(data)
    else if (type === 'IEND') break
    offset += 12 + length
  }
  const channels = colorType === 2 ? 3 : colorType === 6 ? 4 : 0
  assert.ok(channels, `unsupported color type ${colorType}`)
  const raw = inflateSync(Buffer.concat(chunks))
  const stride = width * channels
  let cursor = 0
  let previous = Buffer.alloc(stride)
  const rows = []
  for (let y = 0; y < height; y++) {
    const filter = raw[cursor]
    const row = Buffer.from(raw.subarray(cursor + 1, cursor + 1 + stride))
    cursor += 1 + stride
    if (filter === 1 || filter === 3 || filter === 4) {
      for (let x = 0; x < stride; x++) {
        const left = x >= channels ? row[x - channels] : 0
        const up = previous[x]
        const upLeft = x >= channels ? previous[x - channels] : 0
        const predictor = filter === 1 ? left : filter === 3 ? Math.floor((left + up) / 2) : paeth(left, up, upLeft)
        row[x] = (row[x] + predictor) & 255
      }
    } else if (filter === 2) {
      for (let x = 0; x < stride; x++) row[x] = (row[x] + previous[x]) & 255
    } else assert.equal(filter, 0)
    previous = row
    rows.push(row)
  }
  return { width, height, channels, pixel: (x, y) => rows[y].subarray(x * channels, x * channels + 3) }
}

test('exports Cordis entry and cleanly unregisters every contribution', () => {
  assert.equal(name, 'dsh-pwa')
  assert.deepEqual(inject, ['webServer'])
  const app = harness()
  assert.deepEqual([...app.routes.keys()], [
    '/manifest.webmanifest', '/pwa/apple-touch-icon.png',
    '/pwa/icon-192.png', '/pwa/icon-512.png', '/pwa/icon-192-maskable.png', '/pwa/icon-512-maskable.png',
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
  assert.deepEqual(body.icons.map(icon => icon.sizes), ['192x192', '512x512', '192x192', '512x512'])
  assert.deepEqual(body.icons.map(icon => icon.src), ['./pwa/icon-192.png', './pwa/icon-512.png', './pwa/icon-192-maskable.png', './pwa/icon-512-maskable.png'])
  assert.deepEqual(body.icons.map(icon => icon.purpose), ['any', 'any', 'maskable', 'maskable'])
  assert.equal((await call(route, 'HEAD')).body, undefined)
  assert.equal((await call(route, 'POST')).status, 405)
  app.dispose()
})

test('serves opaque PNG assets with correct dimensions', async () => {
  const app = harness()
  for (const [name, size] of [['apple-touch-icon', 180], ['icon-192', 192], ['icon-512', 512], ['icon-192-maskable', 192], ['icon-512-maskable', 512]]) {
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

test('maskable icons are separate images and their artwork stays inside the safe circle', async () => {
  const app = harness()
  const manifest = JSON.parse((await call(app.routes.get('/manifest.webmanifest'))).body)
  const maskable = manifest.icons.filter(icon => icon.purpose === 'maskable')
  assert.deepEqual(maskable.map(icon => [icon.src, icon.sizes]), [
    ['./pwa/icon-192-maskable.png', '192x192'],
    ['./pwa/icon-512-maskable.png', '512x512'],
  ])
  for (const icon of maskable) {
    const png = (await call(app.routes.get(icon.src.replace('./', '/')))).body
    const any = (await call(app.routes.get(icon.sizes === '192x192' ? '/pwa/icon-192.png' : '/pwa/icon-512.png'))).body
    assert.notEqual(Buffer.compare(png, any), 0)
    const image = decodePng(png)
    const radius = 0.4 * image.width
    let content = 0
    for (let y = 0; y < image.height; y++) {
      for (let x = 0; x < image.width; x++) {
        const pixel = image.pixel(x, y)
        if (pixel[0] >= 250 && pixel[1] >= 250 && pixel[2] >= 250) continue
        content += 1
        assert.ok(Math.hypot(x + 0.5 - image.width / 2, y + 0.5 - image.height / 2) <= radius, `${icon.src} content outside the maskable safe circle at ${x},${y}`)
      }
    }
    assert.ok(content > 1000, icon.src)
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
