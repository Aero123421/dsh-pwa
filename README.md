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
- Optional PWA settings page with English/Japanese update controls and a profile-owned installation journal

## Installation

Requires a compatible [DeepSeek Harness Web](https://deepseek-harness.github.io/deepseek-harness/) build exposing `ctx.webServer.register()` and `webserver/index-inject` (developed against the upstream `0.2.1-alpha.2` API).

Install directly from GitHub into the **web** profile:

```bash
dsh plugin --profile web add -w github:Aero123421/dsh-pwa
```

`-w` targets the Web profile's workspace root.

Or from a local checkout:

```bash
git clone https://github.com/Aero123421/dsh-pwa.git
dsh plugin --profile web add -w ./dsh-pwa
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

The public WebServer routes still serve only static brand metadata. When DSH Connection is available, four authenticated `dsh-pwa/update-*` endpoints support the optional updater. They do not add public API routes, remote terminals, session handlers, secrets, or network bind changes. Manifest/icon registration remains independent of Connection, settings slots, and the plugin manager.

To uninstall:

```bash
dsh plugin --profile web remove -w dsh-pwa
```

## Plugin updates

The PWA page in Settings shows the running plugin version. Checking is separate from installing. It distinguishes no published Release, no newer stable version, API failure, unsupported DSH, installation failure, restart required, and confirmed running version. The page uses DSH's shared React and native Button; no build or prepare step is added.

Source installations from this GitHub repository keep the same source family and update to a validated `github:Aero123421/dsh-pwa#v<version>`. Local checkouts, tarballs, registry packages, read-only profiles, and installations without the manager stay manual. This first versioned release is prepared as **v0.2.0**; publication is a separate reviewed step. Release assets are not required for source delivery. Each candidate's package, client entry, bundle patch, and three PNG files are checked under the exact tag before installation. The updater's optional DSH peer is `0.2.1-alpha.2`; existing static PWA features do not require updater services.

Operation IDs are saved before the first request. The Host stores only update metadata/results under the current profile's `.dsh-pwa-updates/`, so reconnecting browsers and replacement plugin instances reconcile the original operation. An unknown result is never automatically resubmitted. Disabled bundle selection is preserved, and an installed newer version is never downgraded by the updater.

Plugin updates do not change manifest identity, `start_url`, `scope`, or icon URLs. Home-screen icon refresh is a separate browser operation; remove and add the shortcut again when necessary. This plugin has no service worker and never removes other workers or caches. It respects the selected UI language.

[Release preparation and verification](docs/release-0.2.0.md).

## Test

```bash
npm ci
npm test
npm pack --ignore-scripts
npm run test:browser
```

Node's built-in runner checks static routes, optional-service composition, update metadata/results, operation ownership, reconnects, profile isolation, and cleanup. The optional Playwright smoke installs the packed package into an isolated real DSH profile, restarts it, and checks native Japanese controls and the unchanged manifest/icons. Screenshots and logs are saved outside the repository. The smoke registers Japanese only in its test context and uses a fixture provider key; it does not make model API calls. Also verify home-screen installation manually on iPadOS Safari and Chrome/Android; no real-device test is claimed.

## License

Plugin code is [MIT](LICENSE). See [NOTICE.md](NOTICE.md) for the logo attribution and trademark note. Independently maintained and not an official DeepSeek distribution.
