// Browser-level regression: protected /ui/ manifest, with an actual cookie gate.
// Uses the production host routes/head and client head lifecycle, no user profile.
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { readFile } from 'node:fs/promises'
import { chromium } from 'playwright'
import { apply } from '../index.js'

const routes = new Map(), events = new Map(), disposers = [], transforms = []
apply({
  effect: factory => disposers.push(factory()),
  on: (name, callback) => { events.set(name, callback) },
  webServer: {
    register(route) { routes.set(route.path, route); return () => routes.delete(route.path) },
    tapIndex(transform) { transforms.push(transform); return () => {} },
  },
})
const rows = []; events.get('webserver/index-inject')(rows)
let html = `<html><head><base href="./">${rows.map(row => row.html).join('')}<link rel="manifest" href="/manifest.webmanifest"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"></head><body>Cookie-protected PWA fixture</body></html>`
for (const transform of transforms) html = transform(html)
let denied = 0, authenticated = 0
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost')
    if (url.pathname === '/ui/') {
      res.writeHead(200, { 'content-type': 'text/html', 'set-cookie': 'pwa_fixture=1; HttpOnly; SameSite=Lax; Path=/ui/' })
      res.end(url.searchParams.has('anonymous') ? html.replaceAll(' crossorigin="use-credentials"', '') : html)
      return
    }
    if (url.pathname === '/ui/login') {
      res.writeHead(200, { 'content-type': 'text/html' }); res.end('Sign in'); return
    }
    const route = routes.get(url.pathname.replace(/^\/ui(?=\/)/, ''))
    if (!route) { res.writeHead(404); res.end(); return }
    if (!req.headers.cookie?.split(';').some(cookie => cookie.trim() === 'pwa_fixture=1')) {
      denied++; res.writeHead(302, { location: '/ui/login' }); res.end(); return
    }
    authenticated++; await route.handler(req, res)
  } catch { res.writeHead(500); res.end() }
})
server.listen(0, '127.0.0.1'); await once(server, 'listening')
const origin = `http://127.0.0.1:${server.address().port}`
const browser = await chromium.launch({ headless: true })
try {
  // Phone emulation exercises the same metadata in the mobile browser context.
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  const page = await context.newPage(), cdp = await context.newCDPSession(page)
  await page.goto(`${origin}/ui/?anonymous`)
  const broken = await cdp.send('Page.getAppManifest')
  assert.ok(denied > 0, 'negative control: an authenticated page does not imply an authenticated manifest fetch')
  assert.ok(!broken.data || broken.errors.some(error => error.critical), 'negative control must not load a valid manifest')
  // Repair an already open page through the shipped client lifecycle, not a test-authored link patch.
  await page.evaluate(() => { window.__ModuleLoader__ = { load: registration => { window.pwa = registration.factory(() => ({})) } } })
  await page.addScriptTag({ content: await readFile(new URL('../client.js', import.meta.url), 'utf8') })
  await page.evaluate(() => { window.disposeHead = window.pwa.mountPwaHead() })
  assert.equal(await page.locator('link[rel=manifest]').getAttribute('crossorigin'), 'use-credentials')
  const repaired = await cdp.send('Page.getAppManifest')
  assert.equal(repaired.errors.filter(error => error.critical).length, 0)
  assert.equal(JSON.parse(repaired.data).name, 'DeepSeek Harness')
  assert.equal(repaired.url, `${origin}/ui/manifest.webmanifest`)
  await page.evaluate(() => window.disposeHead())
  assert.equal(await page.locator('link[rel=manifest]').getAttribute('crossorigin'), null, 'unload restores the previous owner')
  // A fresh document must be correct before any client JavaScript runs.
  await page.goto(`${origin}/ui/`)
  const fresh = await cdp.send('Page.getAppManifest')
  assert.equal(fresh.errors.filter(error => error.critical).length, 0)
  const manifest = JSON.parse(fresh.data)
  assert.equal(new URL(manifest.start_url, fresh.url).href, `${origin}/ui/`)
  assert.equal(new URL(manifest.scope, fresh.url).href, `${origin}/ui/`)
  assert.equal(await page.locator('link[rel=manifest]').count(), 1)
  assert.ok(await page.evaluate(async () => { const image = new Image(); image.src = document.querySelector('link[rel="apple-touch-icon"]').href; await image.decode(); return image.naturalWidth === 180 }))
  assert.ok(authenticated >= 3)
  await cdp.detach(); await context.close()
  console.log('Cookie-gated /ui/ PWA: missing-credentials failure reproduced; server head, hot activation, cleanup, scoped identity and Apple icon decode passed (mobile/touch emulation).')
} finally {
  await browser.close()
  server.closeAllConnections(); await new Promise(resolve => server.close(resolve))
  for (const dispose of disposers.reverse()) dispose()
}
