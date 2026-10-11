# dsh-pwa

A small, installable [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) **Web** plugin that gives home-screen shortcuts a crisp DeepSeek-branded icon and installable PWA metadata. Works when the Web UI is opened locally or through an HTTPS reverse proxy, including **Tailscale Serve**, on iPad, iPhone, and other supported browsers.

**Not an Electron/Desktop patch.** It does not change the native desktop app icon, add offline support, or make the Web UI mobile-responsive.

## Features

- Home-screen icon for Safari on iOS/iPadOS (opaque 180×180 PNG)
- PWA icons in 192×192 and 512×512 PNG sizes
- `DeepSeek Harness` app name, `DSH` short name, and `standalone` display mode
- Relative URLs for correct PWA identity on supported proxy subpaths
- No service worker, build step, external server, credentials, or additional runtime dependencies
- Uses official Cordis WebServer hooks; leaves DSH files untouched

## Installation

Requires a compatible [DeepSeek Harness Web](https://deepseek-harness.github.io/deepseek-harness/) build exposing `ctx.webServer.register()` and `webserver/index-inject` (developed against the upstream `0.2.1-alpha.2` API).

Install directly from GitHub into the **web** profile:

```bash
dsh plugin --profile web add github:Aero123421/dsh-pwa
```

Or from a local checkout:

```bash
git clone https://github.com/Aero123421/dsh-pwa.git
dsh plugin --profile web add ./dsh-pwa
```

The project ships plain JavaScript and PNG files; **no prepare script or build approval is required**. Prefer pinning a reviewed Git commit with `github:Aero123421/dsh-pwa#<commit-sha>`.

Inspect the activation, then start the server:

```bash
dsh --profile web --dump-config
dsh web
```

Open the authenticated URL printed by DSH, then use Safari **Share → Add to Home Screen** on the iPad/iPhone. If an old shortcut already exists, remove and recreate it to refresh the icon.

### Tailscale Serve

Your existing DSH Web access and authorization must already work. With DSH on `127.0.0.1:3080`, a sample reverse-proxy setup is:

```bash
tailscale serve --bg 3080
dsh web --no-open --trusted-host my-server.my-tailnet.ts.net \
  --public-url https://my-server.my-tailnet.ts.net/
```

Replace the hostname; this is a **placeholder**, not an actual address. Open the tokenized startup URL through the Tailscale HTTPS domain once to establish the authenticated browser session. This plugin never bypasses DSH authentication or Host/Origin checks. Do not use `--host 0.0.0.0` or expose DSH to the open internet.

### Reverse-proxy mounts

Links use `./pwa/...` and the manifest uses `start_url: './'` and `scope: './'`. For a mount like `/ui/`, your proxy must strip the prefix, preserve the public Host, and forward WebSocket upgrades. Follow the [official proxy guide](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/guide/public-deployments.md).

## Design

The `cordis.patch.yml` bundle mounts `index.js` in the Web profile.

- `ctx.webServer.register()` serves three public PNGs and registers an exact `/manifest.webmanifest` route. Exact routes outrank the stock frontend fallback.
- `ctx.on('webserver/index-inject', ...)` adds `apple-touch-icon` and iOS home-screen metadata to the initial HTML response.
- Routes and listeners are removed on plugin unload.

Only static, publicly readable brand metadata is served. There are **no new API endpoints**, remote terminals, session handlers, secrets, or network bind changes.

To uninstall:

```bash
dsh plugin --profile web remove dsh-pwa
```

## Test

```bash
npm test
```

Node's built-in test runner checks the mock WebServer integration, manifest, PNG routes/dimensions, HTTP semantics, and cleanup. Also verify home-screen installation manually on iPadOS Safari and Chrome/Android; no real-device test is claimed.

## License

Plugin code is [MIT](LICENSE). See [NOTICE.md](NOTICE.md) for the logo attribution and trademark note. Independently maintained and not an official DeepSeek distribution.
