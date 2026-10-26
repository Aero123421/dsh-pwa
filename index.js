/**
 * Installable PWA identity for the browser-based DeepSeek Harness application.
 * The host's existing WebServer owns all routes; no file in DSH is modified.
 */
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { PluginUpdates, unmetDshRequirements } from './updates.js'

export const name = 'dsh-pwa'
export const inject = ['webServer']

const iconPaths = [
  ['/pwa/apple-touch-icon.png', 'apple-touch-icon.png'],
  ['/pwa/icon-192.png', 'icon-192.png'],
  ['/pwa/icon-512.png', 'icon-512.png'],
  ['/pwa/icon-192-maskable.png', 'icon-192-maskable.png'],
  ['/pwa/icon-512-maskable.png', 'icon-512-maskable.png'],
]

const manifest = JSON.stringify({
  name: 'DeepSeek Harness',
  short_name: 'DSH',
  start_url: './',
  scope: './',
  display: 'standalone',
  background_color: '#FFFFFF',
  theme_color: '#151517',
  icons: [
    { src: './pwa/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: './pwa/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    // Separate from the any icons so Android can crop the full-bleed square. The whale stays inside the center 80% circle.
    { src: './pwa/icon-192-maskable.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
    { src: './pwa/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
})

function send(req, res, body, contentType, cacheControl) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { allow: 'GET, HEAD' })
    res.end()
    return
  }
  res.writeHead(200, {
    'content-type': contentType,
    'content-length': Buffer.byteLength(body),
    'cache-control': cacheControl,
    'x-content-type-options': 'nosniff',
  })
  res.end(req.method === 'HEAD' ? undefined : body)
}

/** Keep a single, mount-relative discovery link and enable safe-area insets. */
export function normalizePwaHead(html) {
  return html.replace(/<head(?:\s[^>]*)?>[\s\S]*?<\/head>/i, head => head
    .replace(/<link\b[^>]*>/gi, tag => /\brel\s*=\s*["']manifest["']/i.test(tag) && !/\bdata-dsh-pwa\b/i.test(tag) ? '' : tag)
    .replace(/<meta\b[^>]*>/gi, tag => {
      if (!/\bname\s*=\s*["']viewport["']/i.test(tag)) return tag
      return tag.replace(/\bcontent\s*=\s*(["'])(.*?)\1/i, (_match, quote, value) =>
        `content=${quote}${value.replace(/,?\s*viewport-fit\s*=\s*[^,]+/gi, '')}, viewport-fit=cover${quote}`)
    }))
}

/** Mount routes before the stock SPA static-file fallback. */
/** Map a published app-boot compatibility result to unmet requirements. app-boot 0.2.1-alpha.2 named them `peers`; rc.2 renamed them to `requirements`. */
export function publishedDshRequirements(issue) {
  if (!issue || issue.exempted === true) return {}
  return issue.requirements ?? issue.peers ?? {}
}
export function apply(ctx, _config, options = {}) {
  // Updater ownership stays at the plugin root; optional connection routes may be remounted.
  const profile = ctx.get?.('profileContext')
  // Delegate the boot-time compatibility decision to the published app-boot evaluator
  // once its module is loaded for the runtime version; updates.js keeps the same rule
  // as the fallback when app-boot exports no evaluator.
  let evaluatePublished
  const appBoot = async () => {
    const moduleName = '@deepseek-ai/dsh-app-boot'
    const resolved = profile?.installAnchor ? pathToFileURL(createRequire(profile.installAnchor).resolve(moduleName)).href : moduleName
    const boot = await import(resolved)
    if (typeof boot.evaluatePluginCompatibility === 'function') evaluatePublished = boot.evaluatePluginCompatibility
    return boot
  }
  const updates = new PluginUpdates({
    manager: () => ctx.get?.('pluginManager'), profileDir: profile?.dir,
    runtimeVersion: async () => (await appBoot()).getDshRuntimeVersion(),
    evaluateDsh(packageJson, runtime) {
      if (!evaluatePublished) return unmetDshRequirements(packageJson, runtime)
      try {
        // Host-granted exemptions are not published here, so an exempted mismatch stays manual.
        return publishedDshRequirements(evaluatePublished(packageJson, {}, runtime))
      } catch { throw new Error('metadata') }
    },
    ...options.updates,
  })
  ctx.effect(() => () => updates.dispose())
  if (typeof ctx.inject === 'function') ctx.inject(['connection'], child => registerUpdateRoutes(child, updates))
  else if (ctx.connection?.fetch?.register) registerUpdateRoutes(ctx, updates)

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: '/manifest.webmanifest',
    handler(req, res) {
      send(req, res, manifest, 'application/manifest+json; charset=utf-8', 'no-cache')
    },
  }))

  for (const [path, filename] of iconPaths) {
    const fileUrl = new URL(`./assets/${filename}`, import.meta.url)
    // Cache each immutable file only after a successful read; a missing asset
    // should fail loudly rather than being replaced by a broken PNG response.
    let image
    ctx.effect(() => ctx.webServer.register({
      kind: 'exact', path,
      async handler(req, res) {
        if (req.method !== 'GET' && req.method !== 'HEAD') {
          send(req, res, '', 'image/png', 'public, max-age=3600')
          return
        }
        image ??= await readFile(fileUrl)
        send(req, res, image, 'image/png', 'public, max-age=3600')
      },
    }))
  }

  // Structured rows can add metadata, but cannot update the stock viewport or
  // remove its manifest link. tapIndex is the host's public HTML transform hook.
  if (ctx.webServer.tapIndex) ctx.effect(() => ctx.webServer.tapIndex(normalizePwaHead))

  // Rendered on the server before the page is sent, so iPadOS Safari sees
  // the icon and metadata when the user first chooses Add to Home Screen.
  ctx.on('webserver/index-inject', (rows) => {
    rows.push({
      kind: 'html',
      placement: 'head',
      html: [
        '<link data-dsh-pwa rel="manifest" href="./manifest.webmanifest" crossorigin="use-credentials">',
        '<link rel="apple-touch-icon" sizes="180x180" href="./pwa/apple-touch-icon.png">',
        '<meta name="apple-mobile-web-app-title" content="DeepSeek Harness">',
        '<meta name="apple-mobile-web-app-capable" content="yes">',
        '<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">',
        '<meta name="theme-color" content="#151517" media="(prefers-color-scheme: dark)">',
      ].join(''),
    })
  })
}

/** These endpoints only mount through DSH's authenticated Connection, never on the public WebServer. */
export function registerUpdateRoutes(ctx, updates) {
  for (const action of ['status', 'check', 'begin', 'reconcile']) {
    const method = `dsh-pwa/update-${action}`
    ctx.connection.fetch.register({
      path: `/api/${method}`, methods: ['POST'], requestBody: 'buffered',
      async fetch(request) {
        let rpcId
        try {
          if (request.headers.get('content-type')?.split(';')[0] !== 'application/json') return new Response('unsupported media type', { status: 415 })
          const envelope = await request.json()
          if (envelope?.type !== 'client-request' || typeof envelope.rpcId !== 'string' || envelope.rpcId.length > 100 || envelope.method !== method) return new Response('invalid request', { status: 400 })
          rpcId = envelope.rpcId
          request.signal.throwIfAborted()
          const payload = envelope.payload
          if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('invalid-request')
          const value = action === 'begin' ? await updates.begin(payload.candidateId, payload.requestId, payload.profileKey) : action === 'reconcile' ? await updates.reconcile(payload.requestId) : await updates[action]()
          return Response.json({ type: 'server-response', rpcId, result: { ok: true, value } }, { headers: { 'cache-control': 'no-store' } })
        } catch (error) {
          if (rpcId === undefined) return new Response('invalid request', { status: 400 })
          const code = ['invalid-request', 'busy', 'stale-candidate'].includes(error.message) ? error.message : 'update-failed'
          return Response.json({ type: 'server-response', rpcId, result: { ok: false, error: { code: `dsh-pwa/${code}`, message: code, details: {} } } }, { headers: { 'cache-control': 'no-store' } })
        }
      },
    })
  }
}
