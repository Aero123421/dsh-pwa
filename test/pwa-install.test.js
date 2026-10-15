import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { runInNewContext } from 'node:vm'
import { normalizePwaHead } from '../index.js'

async function exports() {
  let result
  runInNewContext(await readFile(new URL('../client.js', import.meta.url), 'utf8'), {
    window: { __ModuleLoader__: { load: entry => { result = entry.factory(() => ({})) } } },
    AbortController, URL, Uint8Array, DataView, setTimeout, clearTimeout,
  })
  return result
}
function target() {
  const events = new Map(), display = { matches: false, addEventListener() {}, removeEventListener() {} }
  return { isSecureContext: true, navigator: {}, document: { baseURI: 'https://dsh.example/ui/?token=never-copy' }, matchMedia: () => display,
    addEventListener: (type, fn) => events.set(type, fn), removeEventListener: type => events.delete(type), events,
  }
}

test('server discovery has one mount-relative manifest and preserves zoom directives', () => {
  const html = '<head><link data-dsh-pwa rel="manifest" href="./manifest.webmanifest"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=auto"><link rel="manifest" href="/manifest.webmanifest"><link rel="icon" href="/favicon.svg"></head><body>unchanged</body>'
  const result = normalizePwaHead(html)
  assert.equal((result.match(/rel="manifest"/g) ?? []).length, 1)
  assert.match(result, /href="\.\/manifest.webmanifest"/)
  assert.match(result, /initial-scale=1, viewport-fit=cover/)
  assert.match(result, /favicon.svg/)
  assert.match(result, /<body>unchanged<\/body>/)
  assert.equal(normalizePwaHead(result), result)
})

test('install prompt is user-triggered, one-use and does not equate accepted with installed', async () => {
  const { InstallController } = await exports(), win = target(), install = new InstallController(win)
  let prompted = 0, prevented = false
  win.events.get('beforeinstallprompt')({ preventDefault() { prevented = true }, prompt() { prompted++; return Promise.resolve() }, userChoice: Promise.resolve({ outcome: 'accepted' }) })
  assert.equal(prevented, true); assert.equal(prompted, 0); assert.equal(install.state.prompt, true)
  await Promise.all([install.install(), install.install()])
  assert.equal(prompted, 1); assert.equal(install.state.installed, false); assert.equal(install.state.outcome, 'accepted')
  win.events.get('appinstalled')(); assert.equal(install.state.installed, true)
  install.dispose(); assert.equal(win.events.size, 0)
})

test('insecure origins and iPad desktop user agents get actionable installation state', async () => {
  const { InstallController } = await exports(), win = target()
  win.isSecureContext = false; win.navigator = { platform: 'MacIntel', maxTouchPoints: 5 }
  const install = new InstallController(win)
  assert.equal(install.state.secure, false); assert.equal(install.state.ios, true)
  install.dispose()
})

test('PWA diagnosis validates scoped PNG metadata and never fetches a foreign icon', async () => {
  const { InstallController } = await exports(), win = target(), calls = []
  let foreign = false
  win.fetch = async (url, options) => {
    calls.push(url); assert.equal(options.redirect, 'error'); assert.equal(new URL(url).search, '')
    if (url.endsWith('.webmanifest')) return { ok: true, headers: new Headers({ 'content-type': 'application/manifest+json' }), json: async () => ({ name: 'DSH', start_url: './', scope: './', display: 'standalone', icons: [192, 512].map(size => ({ sizes: `${size}x${size}`, src: foreign ? 'https://foreign.example/icon.png' : `./pwa/icon-${size}.png` })) }) }
    const size = url.includes('apple-touch') ? 180 : url.includes('192') ? 192 : 512
    const png = Buffer.alloc(24); Buffer.from('89504e470d0a1a0a', 'hex').copy(png); png.writeUInt32BE(size, 16); png.writeUInt32BE(size, 20)
    return { ok: true, headers: new Headers({ 'content-type': 'image/png' }), arrayBuffer: async () => png.buffer.slice(png.byteOffset, png.byteOffset + png.byteLength) }
  }
  const install = new InstallController(win)
  await install.check(); assert.equal(install.state.check, 'ready'); assert.equal(calls.length, 4)
  foreign = true; await install.check(); assert.equal(install.state.check, 'failed')
  assert.ok(calls.every(url => url.startsWith('https://dsh.example/ui/')))
  install.dispose()
})

test('unload cancels metadata requests and late prompt completion cannot revive state', async () => {
  const { InstallController } = await exports(), win = target()
  let resolvePrompt
  win.fetch = (_url, { signal }) => new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new Error('aborted'))))
  const install = new InstallController(win)
  win.events.get('beforeinstallprompt')({ preventDefault() {}, prompt: async () => {}, userChoice: new Promise(resolve => { resolvePrompt = resolve }) })
  const prompt = install.install(), check = install.check()
  install.dispose(); const last = install.state
  resolvePrompt({ outcome: 'accepted' }); await Promise.all([prompt, check])
  assert.equal(install.state, last); assert.equal(win.events.size, 0)
})
