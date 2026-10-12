/**
 * Installable PWA identity for the browser-based DeepSeek Harness application.
 * The host's existing WebServer owns all routes; no file in DSH is modified.
 */
import { readFile } from 'node:fs/promises'

export const name = 'dsh-pwa'
export const inject = ['webServer']

const iconPaths = [
  ['/pwa/apple-touch-icon.png', 'apple-touch-icon.png'],
  ['/pwa/icon-192.png', 'icon-192.png'],
  ['/pwa/icon-512.png', 'icon-512.png'],
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

/** Mount routes before the stock SPA static-file fallback. */
export function apply(ctx) {
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

  // Rendered on the server before the page is sent, so iPadOS Safari sees
  // the icon and metadata when the user first chooses Add to Home Screen.
  ctx.on('webserver/index-inject', (rows) => {
    rows.push({
      kind: 'html',
      placement: 'head',
      html: [
        '<link rel="apple-touch-icon" sizes="180x180" href="./pwa/apple-touch-icon.png">',
        '<meta name="apple-mobile-web-app-title" content="DeepSeek Harness">',
        '<meta name="apple-mobile-web-app-capable" content="yes">',
        '<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">',
        '<meta name="theme-color" content="#151517" media="(prefers-color-scheme: dark)">',
      ].join(''),
    })
  })
}
