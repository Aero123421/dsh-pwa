# dsh-pwa — PWA & Mobile

A [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) **Web** plugin that provides DeepSeek-branded home-screen icons, installable PWA metadata, installation guidance, and an optional phone layout. Use HTTPS for remote access, including an appropriately configured reverse proxy or **Tailscale Serve**; localhost is also supported for development.

The settings page is shown as **PWA & Mobile**. The package, bundle and plugin ID stay `dsh-pwa`, so existing installations and the updater keep working.

**Not an Electron/Desktop patch.** It does not change the native desktop app icon or add offline support. Actual home-screen installation still depends on the browser and deployment; no real-device test is claimed.

## Features

- Home-screen icon for Safari on iOS/iPadOS (opaque 180×180 PNG)
- PWA icons in 192×192 and 512×512 PNG sizes, plus separate maskable icons at both sizes with the artwork inside the center safe zone
- `DeepSeek Harness` app name, `DSH` short name, and `standalone` display mode
- Mount-relative manifest and icon links, with credentialed manifest discovery for authenticated proxies
- A Settings section with the app icon, installation action when the browser offers it, Safari instructions, HTTPS guidance, and manifest/icon checks
- No service worker, build step, external server, or new runtime dependency. The updater uses `semver` for the same prerelease-inclusive peer check DSH uses
- Uses official Cordis WebServer hooks; leaves DSH files untouched
- English/Japanese update controls and a profile-owned installation journal
- Mobile layout switch (Auto / On / Off): a dedicated header, overlay sidebar, full-width conversation and right panel, and narrow-screen Settings

## Installation

Requires a compatible [DeepSeek Harness Web](https://deepseek-harness.github.io/deepseek-harness/) build exposing `ctx.webServer.register()` and `webserver/index-inject`. The optional peer `@deepseek-ai/dsh-app-boot` is `>=0.2.1-alpha.2 <0.3.0-0`. That includes DSH 0.2.1-alpha.2, 0.2.1-alpha.3, and later 0.2.x releases, including prereleases. The range ends before `0.3.0-0`. The lower bound is 0.2.1-alpha.2, the API this plugin was written against; `0.2.0-rc.2` is older than that API. The revised mobile layout is checked against the published **0.2.1-alpha.3** package; see [verification scope](docs/mobile-pwa-verification.md) for the upstream source revision and limits.

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

Open the authenticated URL printed by DSH. In **Settings → PWA & Mobile → Add to Home Screen**, check the icon and metadata status. Supported browsers offer an install button when their `beforeinstallprompt` event is available; otherwise use the browser's installation menu. On iPhone/iPad, open Safari and choose **Share → Add to Home Screen**. If an old shortcut already exists, remove and recreate it to refresh the icon.

A successful metadata check means the manifest and PNGs are available, not that the OS has installed the app. An accepted browser prompt is also separate from the `appinstalled` confirmation. Ordinary LAN HTTP addresses are not secure contexts; use the server's HTTPS address rather than bypassing security checks.

### Tailscale Serve

Your existing DSH Web access and authorization must already work. With DSH on `127.0.0.1:3080`, a sample reverse-proxy setup is:

```bash
tailscale serve --bg 3080
dsh web --no-open --trusted-host my-server.my-tailnet.ts.net \
  --public-url https://my-server.my-tailnet.ts.net/
```

Replace the hostname; this is a **placeholder**, not an actual address. Open the tokenized startup URL through the Tailscale HTTPS domain once to establish the authenticated browser session. This plugin never bypasses DSH authentication or Host/Origin checks. Do not use `--host 0.0.0.0` or expose DSH to the open internet.

### Reverse-proxy mounts

Links use `./manifest.webmanifest` and `./pwa/...`; the manifest uses `start_url: './'` and `scope: './'`. For a mount like `/ui/`, your proxy must strip the prefix, preserve the public Host, and forward WebSocket upgrades. Follow the [official proxy guide](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/guide/public-deployments.md).

The manifest link explicitly uses `crossorigin="use-credentials"`. Without it, a browser can omit the authentication cookie when fetching a same-origin manifest even though the main page is signed in; an authenticated proxy can then return its login page instead. This behavior and the required attribute are documented by [MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest#deploying_a_manifest). The plugin does not loosen proxy policies, add CORS wildcards, or copy login tokens into the manifest. The metadata check reports redirects, HTML responses and inaccessible images as failures.

## Design

The `cordis.patch.yml` bundle mounts `index.js` in the Web profile.

- `ctx.webServer.register()` serves five public PNGs and registers an exact `/manifest.webmanifest` route. Exact routes outrank the stock frontend fallback.
- `ctx.on('webserver/index-inject', ...)` adds the credentialed manifest link, `apple-touch-icon` and iOS home-screen metadata to the initial HTML response. The public `tapIndex` hook removes the duplicate stock manifest link and adds `viewport-fit=cover` without disabling zoom.
- Client activation repairs discovery metadata in an already open document. Unload restores only its own attribute changes; routes, listeners and styles are also removed.

The public WebServer routes still serve only static brand metadata. When DSH Connection is available, four authenticated `dsh-pwa/update-*` endpoints support the optional updater. They do not add public API routes, remote terminals, session handlers, secrets, or network bind changes. Manifest/icon registration remains independent of Connection, settings slots, and the plugin manager.

To uninstall:

```bash
dsh plugin --profile web remove -w dsh-pwa
```

## Mobile layout

Open **Settings → PWA & Mobile → Mobile layout** and choose:

- **Auto** (default): mobile layout on screens narrower than 768px.
- **On**: always, for example on an iPad.
- **Off**: the stock DSH layout.

The choice is saved in that browser's `localStorage` only, so a phone and a desktop can differ. In mobile layout:

- DSH's existing UI and session state are kept. The frame becomes a single full-width content column, without translating the conversation out of view.
- The left sidebar overlays the conversation. A dedicated header button, the backdrop, Escape, or choosing a session, panel or New Session closes it. Hidden background controls are inert while it is open.
- The right panel (files, terminal…) uses the whole phone width. The header close button invokes the existing panel control so its state remains synchronized.
- Inputs use at least 16px text; safe-area insets and the visual viewport height are respected. OS keyboard behavior still needs real-device verification.
- Settings places a horizontally scrollable navigation strip above its content. The dialog, close button and content scrolling fit narrow screens.
- DOM observation is limited to the frame state and right panel rather than every streaming conversation update.

Mobile CSS is scoped under `html[data-dsh-mobile]` and the controls use the official `shell.overlay` slot; no DSH file is changed. The rules target slot markers, data attributes and their direct wrappers rather than generated class names. This remains an internal DOM dependency, checked against **0.2.1-alpha.3** — switch to **Off** if a future DSH release changes that structure. [Root causes and verification notes](docs/mobile-pwa-verification.md).

## Plugin updates

The PWA page in Settings shows the running plugin version. Checking is separate from installing. It distinguishes no published Release, no newer stable version, API failure, unsupported DSH, installation failure, restart required, and confirmed running version. The page uses DSH's shared React and native Button; no build or prepare step is added.

Source installations from this GitHub repository keep the same source family and update to a validated `github:Aero123421/dsh-pwa#v<version>`. Local checkouts, tarballs, registry packages, read-only profiles, and installations without the manager stay manual. Release assets are not required for source delivery. Each candidate's package, client entry, bundle patch, and five PNG files (`apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `icon-192-maskable.png`, `icon-512-maskable.png`) are checked under the exact tag before installation. Its `@deepseek-ai/dsh*` peers must satisfy the running DSH version under the same rule as app-boot (`includePrerelease`). A release with no such peer stays manual. Static PWA routes do not require the updater.

On DSH 0.2.1-alpha.3 with HMR, `installBundle` of a spec that names the saved dependency fails with `already-installed` before pnpm runs. A different git ref still installs. When the result is `already-installed`, this updater follows the official Plugins update: `removeBundle`, then `installBundle`, keeping the previous enabled selection and `saveExact`. If removal returns `stop-profile`, the bundle is still installed and `installBundle` runs over it. Any other removal failure leaves the package in place. The calls use the plugin manager service. With HMR, `removeBundle` stops this plugin before it returns; that service still accepts the following `installBundle`. The official update does the same pair from the plugin manager page, which stays loaded.

Before `removeBundle`, the updater keeps the installed spec and enabled state. After removal, it installs that spec again with a new request id when `resultState` is `failed` and `listBundles` shows this package is absent. `resultState` is `failed` for an install error, for `application: failed`, and for `restart-required` when `packageResult` exited non-zero or timed out. `cancelled` and `overridden` stay those outcomes. If `removeBundle` throws, the same restore runs only when the list confirms the package is absent. The original update stays failed. When the previous version is back, the settings page says so and asks for a DSH restart if the plugin does not return. When that restore fails too, the page says the plugin may have been removed and to install it again from GitHub Releases. A `listBundles` failure is treated as still installed, so the updater does not put a second copy on an unknown profile.

Operation IDs are saved before the first request. The Host stores only update metadata/results under the current profile's `.dsh-pwa-updates/`, so reconnecting browsers and replacement plugin instances reconcile the original operation. An unknown result is never automatically resubmitted. Disabled bundle selection is preserved, and an installed newer version is never downgraded by the updater.

Plugin updates keep the manifest name, `start_url: './'`, and `scope: './'`. The any-purpose icons stay at `./pwa/icon-192.png` and `./pwa/icon-512.png`. The manifest also publishes `./pwa/icon-192-maskable.png` and `./pwa/icon-512-maskable.png` for Android adaptive icons. Home-screen icon refresh is a separate browser operation; remove and add the shortcut again when necessary. This plugin has no service worker and never removes other workers or caches. It respects the selected UI language.

[Current release notes](docs/release-0.3.1.md). Stable `v*` tags on reviewed `main` commits run the release workflow, verify the version and tests, and publish a GitHub Release with the packed plugin and `SHA256SUMS`. This does not publish to npm.

## Test

```bash
npm ci --ignore-scripts
npm test
npm run check:dsh-peer
npm install --global @deepseek-ai/dsh@0.2.1-alpha.3 pnpm@11.28.5
npx playwright install --with-deps chromium
node scripts/pwa-proxy-check.mjs
npm pack --ignore-scripts
npm run test:browser
```

`npm run check:dsh-peer` needs network. It installs the published `@deepseek-ai/dsh-app-boot@alpha` in a temporary directory and compares `evaluatePluginCompatibility` with this package's peer check. It does not start DSH.

Node's built-in runner checks the mobile mode store, static routes, optional-service composition, update metadata/results, operation ownership, reconnects, profile isolation, cleanup, restore after a failed replacement, maskable icon safe zone, manifest normalization and install-prompt lifecycle.

The Playwright smoke installs the packed package into an isolated real DSH profile and restarts it. It checks the browser-selected manifest, decoded Apple icon, Settings at 320/360/390/600/1280px, the 767/768px boundary, saved modes, drawers and reselection, files, composer text size, light/dark appearance, reduced motion and desktop recovery. The smoke opens either the visible Settings button (alpha.2) or Account menu → Settings (alpha.3). Japanese is registered only in the test context, and fixture provider credentials prevent model API calls.

The separate proxy regression uses the production metadata routes behind a cookie gate at `/ui/` with mobile/touch emulation. It checks the missing-credentials failure as a negative control, then credentialed server discovery and repair of an already open page. It does not connect to a user's proxy or credentials.

Screenshots and logs stay outside the repository; the browser workflow uploads screenshots only. Actual home-screen installation, OS keyboard behavior, user HTTPS/proxy configuration and third-party theme combinations require separate verification. **No iPhone/iPad/Android physical-device test is claimed.**

## License

Plugin code is [MIT](LICENSE). See [NOTICE.md](NOTICE.md) for the logo attribution and trademark note. Independently maintained and not an official DeepSeek distribution.
