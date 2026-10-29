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
- No service worker, build step, external server, or new runtime dependency. The updater uses `semver` for the same engines.dsh-first, prerelease-inclusive compatibility check DSH uses
- Uses official Cordis WebServer hooks; leaves DSH files untouched
- English/Japanese update controls and a profile-owned installation journal
- Mobile layout switch (Auto / On / Off): menu button in the conversation header, overlay sidebar, full-width conversation and right panel, scrollable wide tables, keyboard-aware height, landscape safe areas, and narrow-screen Settings

## Installation

Requires a compatible [DeepSeek Harness Web](https://deepseek-harness.github.io/deepseek-harness/) build exposing `ctx.webServer.register()` and `webserver/index-inject`. The optional peer `@deepseek-ai/dsh-app-boot` is `>=0.2.1-alpha.2 <0.3.0-0`. That includes DSH 0.2.1-alpha.2, 0.2.1-alpha.3, and later 0.2.x releases, including prereleases. The range ends before `0.3.0-0`. The lower bound is 0.2.1-alpha.2, the API this plugin was written against; `0.2.0-rc.2` is older than that API. The current channel audit covers **0.2.1-rc.2** (`latest`), **0.2.1-rc.4** (`next`), and **0.2.2-alpha.2** (`alpha`); all are prereleases, and no stable DSH version was published as of 2026-10-29. See the [current compatibility results](docs/dsh-compatibility-2026-10-29.md) and [verification scope](docs/mobile-pwa-verification.md) for the distinction between source checks and browser tests.

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

- **Auto** (default): mobile layout on screens narrower than 768px, and on touch screens no taller than 500px (phones in landscape).
- **On**: always, for example on an iPad.
- **Off**: the stock DSH layout.

The choice is saved in that browser's `localStorage` only, so a phone and a desktop can differ. In mobile layout:

- DSH's existing UI and session state are kept. The frame becomes a single full-width content column, without translating the conversation out of view.
- In a conversation, the menu button sits in DSH's official `conversation.header.leading` seat, before the Session title, so the screen keeps one compact header. Pages without a conversation header (Plugins, Automation tasks) get a separate top bar with the same button. In landscape, the Chat/Trajectory tabs move onto the title row.
- The left sidebar overlays the conversation. The backdrop, choosing a session, panel or New Session, or a main-view change closes it. The settings screen and a modal dialog (`[role=dialog][aria-modal="true"]`) close it too. A confirmation or rename dialog opened from the drawer does not: the drawer stays so focus can return to the control that opened it. Escape closes Settings and the drawer together. On pages with the separate top bar, its menu button also closes the drawer. Hidden background controls are inert while it is open.
- The right panel (files, terminal…) uses the whole phone width and closes with its own panel button.
- Wide Markdown tables scroll sideways with a finger. Stock DSH shows their scrollbar only on mouse hover, so the right-hand columns were unreachable on a touch screen.
- Plain Enter inserts a newline in the composer; use the send button (or Ctrl/⌘+Enter) to send. Enter picks a command or file suggestion only while one is highlighted; while suggestions are still loading it inserts a newline. An IME commit that ends in a newline also becomes a newline instead of sending. The stock layout (including an iPad in Auto) keeps Enter-to-send.
- Inputs use at least 16px text. The app follows the visual viewport: when an on-screen keyboard opens, the app shrinks to the visible area and moves with it, and the bottom safe-area gap under the composer is dropped. Left and right safe areas (the notch in landscape) are kept clear. OS keyboard behavior still needs real-device verification.
- Settings puts its title, actions and close button on one row, with a horizontally scrollable navigation strip below. The PWA & Mobile section uses the same text sizes and colors as the built-in settings rows.
- DOM observation is limited to the frame state and right panel rather than every streaming conversation update.

### Touch screens

Touch adjustments apply whenever `(any-pointer: coarse)` matches, independently of Auto / On / Off. An iPad using the stock layout gets these adjustments too; **Off does not disable touch adjustments**.

- `html`, `body` and the conversation suppress overscroll, so the conversation does not rubber-band at its ends. This also suppresses Android pull-to-refresh and overscroll navigation. Actual iOS rubber-band behavior still needs device verification.
- Thinking and process groups expand inline instead of scrolling inside a capped box. A swipe that starts on them scrolls the conversation, so it no longer stops at the box edge, and DSH sees the reading gesture instead of pulling the conversation back to the latest reply. Opening a group makes the conversation longer; DSH can still move to the bottom when a group first opens while a reply is streaming.
- Editable inputs, textareas, selects and contenteditable surfaces use at least 16px text, including portalled search fields and stock-layout iPads, to avoid iOS input-focus zoom. Viewport zoom limits are not added.
- Double-tap zoom is disabled with low-specificity `touch-action: manipulation`; pinch zoom and DSH's explicit touch-action rules remain available. On a coarse-primary device, conversation width handles pass swipes through instead of resizing. Wide tables scroll sideways.
- The existing visual-viewport height and pan tracking also runs on touch tablets. Height changes under 4px are ignored, and the pan offset applies only while a keyboard is detected, so small viewport wobbles do not move the app. An Android keyboard that resizes the window is detected while an input has focus. While the terminal has focus under an overlay keyboard (iOS, iPadOS and current Chrome on Android), the app keeps its full height so the terminal is not resized; the browser pans to the cursor instead. Phone statistics hide while the keyboard is detected. Long drafts have a viewport-based height cap. At visible height ≤260px and width ≥max(480px, twice that height), compact mode keeps the menu/header, hides tabs/statistics, and puts the composer on one row. Menus and pickers keep DSH's own position, width and row height; while a keyboard is open or in compact mode, their height is limited to the room above their anchor.
- Modal dialogs use the visible viewport, including its pan offset. An obscured focused input inside a modal scrolls into view; composer scrolling stays with DSH. Question footers wrap and provider tabs share equal-width columns.
- Sidebar row actions are visible without hover. On phones, rows and menu items are at least 44px high; pin/archive remain available in the … menu rather than as duplicate row buttons. Reselecting a search result or reusing a workspace's New session draft also closes the drawer.
- Main composer controls, slash suggestions, message/code/process/tool controls, file rows, document tools/zoom, and this plugin's settings controls gain 44px targets. Settings switches keep their track size and expand only the hit area. This is not a claim that every DSH control is 44px.
- Escape closes an open right panel and returns focus to the menu after the panel closes; modal dialogs and menus keep ownership of Escape. A right panel cannot leave an open drawer hidden underneath it.

Touch CSS is scoped under `html[data-dsh-touch]`; shared viewport rules use the mobile or touch scope. The plugin does not write conversation scroll positions. OS keyboard/IME, safe areas, screen readers and home-screen installation require real-device checks.

Mobile CSS is scoped under `html[data-dsh-mobile]`, and the controls use the official `conversation.header.leading` and `shell.overlay` slots; no DSH file is changed. The rules target slot markers, data attributes, the stable `md-table-wide` class and direct wrappers rather than generated class names. This remains an internal DOM dependency; the [current compatibility results](docs/dsh-compatibility-2026-10-29.md) list checked releases. Switch to **Off** if a future DSH release changes that structure. [Root causes and verification notes](docs/mobile-pwa-verification.md).

## Plugin updates

The PWA page in Settings shows the running plugin version. Checking is separate from installing. It distinguishes no published Release, no newer stable version, API failure, unsupported DSH, installation failure, restart required, and confirmed running version. The page uses DSH's shared React and native Button; no build or prepare step is added.

Source installations from this GitHub repository keep the same source family and update to a validated `github:Aero123421/dsh-pwa#v<version>`. Local checkouts, tarballs, registry packages, read-only profiles, and installations without the manager stay manual. Release assets are not required for source delivery. Each candidate's package, client entry, bundle patch, and five PNG files (`apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `icon-192-maskable.png`, `icon-512-maskable.png`) are checked under the exact tag before installation. Its DSH compatibility follows the app-boot rule: the candidate's own `engines.dsh` range decides alone and peers are ignored; without it, every `@deepseek-ai/dsh*` peer must satisfy the running DSH version (`includePrerelease`), where `workspace:^`/`~`/`*` mean the running version. A release with no dsh requirement at all is loadable, as app-boot loads it without a warning; an unmet range is shown before any update. When app-boot exports `evaluatePluginCompatibility`, the updater delegates to that published evaluator and keeps the same rule as its fallback. Static PWA routes do not require the updater.

On DSH 0.2.1-alpha.3 with HMR, `installBundle` of a spec that names the saved dependency fails with `already-installed` before pnpm runs. A different git ref still installs. When the result is `already-installed`, this updater follows the official Plugins update: `removeBundle`, then `installBundle`, keeping the previous enabled selection and `saveExact`. If removal returns `stop-profile`, the bundle is still installed and `installBundle` runs over it. Any other removal failure leaves the package in place. The calls use the plugin manager service. With HMR, `removeBundle` stops this plugin before it returns; that service still accepts the following `installBundle`. The official update does the same pair from the plugin manager page, which stays loaded.

Before `removeBundle`, the updater keeps the installed spec and enabled state. After removal, it installs that spec again with a new request id when `resultState` is `failed` and `listBundles` shows this package is absent. `resultState` is `failed` for an install error, for `application: failed`, and for `restart-required` when `packageResult` exited non-zero or timed out. `cancelled` and `overridden` stay those outcomes. If `removeBundle` throws, the same restore runs only when the list confirms the package is absent. The original update stays failed. When the previous version is back, the settings page says so and asks for a DSH restart if the plugin does not return. When that restore fails too, the page says the plugin may have been removed and to install it again from GitHub Releases. A `listBundles` failure is treated as still installed, so the updater does not put a second copy on an unknown profile.

Operation IDs are saved before the first request. The Host stores only update metadata/results under the current profile's `.dsh-pwa-updates/`, so reconnecting browsers and replacement plugin instances reconcile the original operation. An unknown result is never automatically resubmitted. Disabled bundle selection is preserved, and an installed newer version is never downgraded by the updater. After a successful update (`applied`), the settings page does not show the manager stage name. After a finished update, installing an older release such as 0.4.0 again leaves **Check for updates** usable. Release notes are rendered from Markdown. A body marked `<!-- notes:en -->`, `<!-- notes:ja -->`, and `<!-- notes:zh -->` follows the UI language. zh and zh-CN use the `zh` section when it is present, and the English section when it is not. An unmarked body is treated as Japanese and is not shown for other languages.

Plugin updates keep the manifest name, `start_url: './'`, and `scope: './'`. The any-purpose icons stay at `./pwa/icon-192.png` and `./pwa/icon-512.png`. The manifest also publishes `./pwa/icon-192-maskable.png` and `./pwa/icon-512-maskable.png` for Android adaptive icons. Home-screen icon refresh is a separate browser operation; remove and add the shortcut again when necessary. This plugin has no service worker and never removes other workers or caches. It registers `en` and `ja` dictionaries and does not define the `ja` language. DSH 0.2.2-alpha.2 includes Japanese. Older checked releases need [dsh-japanese](https://github.com/Aero123421/dsh-japanese) to select this plugin's Japanese dictionary; otherwise the controls stay in English. Do not combine the old 0.2.3 language pack with the newer built-in Japanese dictionaries. It does not register a `zh` dictionary. DSH's built-in `zh` language, shown with the document language zh-CN, uses a `zh` dictionary when this plugin registers one. With none, DSH shows the English copy and does not show message keys.

[Current release notes](docs/release-0.4.5.md). Stable `v*` tags on reviewed `main` commits run the release workflow, verify the version and tests, and publish a GitHub Release with the packed plugin and `SHA256SUMS`. This does not publish to npm.

## Test

```bash
npm ci --ignore-scripts
npm test
npm run check:dsh-peer
npm install --global @deepseek-ai/dsh@0.2.2-alpha.2 pnpm@11.28.5
npx playwright install --with-deps chromium
node scripts/pwa-proxy-check.mjs
npm pack --ignore-scripts
npm run test:browser
npm run test:touch
```

`npm run check:dsh-peer` needs network. It resolves the CLI lower bound and `latest`/`next`/`alpha` channels, installs each exact matching `@deepseek-ai/dsh-app-boot` in a separate temporary directory, and compares `evaluatePluginCompatibility` with this package's peer check. It does not start DSH. Pass a version or channel to select one, for example `npm run check:dsh-peer -- 0.2.2-alpha.2`. Browser CI tests the same four targets.

Node's built-in runner checks touch attribute/viewport/compact handling, geometry read-before-write, modal input reveal and disposal, executable right-panel Escape/hidden-drawer/cleanup behavior, the mobile mode store, the landscape and keyboard viewport handling, the header-menu/top-bar switch, static routes, optional-service composition, update metadata/results, operation ownership, reconnects, profile isolation, cleanup, restore after a failed replacement, maskable icon safe zone, manifest normalization and install-prompt lifecycle.

The Playwright smoke installs the packed package into an isolated real DSH profile and restarts it. It uses DSH's published Japanese dictionary when present, and installs the pinned dsh-japanese fixture only on older hosts. It checks the browser-selected manifest, decoded Apple icon, Settings at 320/360/390/600/1280px, the 767/768px boundary, saved modes, the header menu and the top-bar fallback, drawers and reselection, a sideways-scrolling wide table, files, composer text size, a touch phone in landscape, light/dark appearance, reduced motion and desktop recovery. The smoke opens either the visible Settings button (alpha.2) or Account menu → Settings (alpha.3). Japanese comes from DSH or the older-host language fixture. Model requests go to a local stub inside the script that returns one fixed Markdown reply; no model API is called.

`npm run test:touch` installs the packed plugin into a disposable DSH profile and streams a long answer from a local stand-in Messages API. Chromium raw touch events check two-way conversation scrolling, top-edge overscroll, header swipes, page scroll 0 and computed touch/overscroll rules at iPad 820×1180 (stock layout) and phone 390×844 (mobile layout). It does not emulate iOS rubber-band physics.

The separate proxy regression uses the production metadata routes behind a cookie gate at `/ui/` with mobile/touch emulation. It checks the missing-credentials failure as a negative control, then credentialed server discovery and repair of an already open page. It does not connect to a user's proxy or credentials.

Screenshots and logs stay outside the repository; the browser workflow uploads screenshots only. Actual home-screen installation, OS keyboard behavior, user HTTPS/proxy configuration and third-party theme combinations require separate verification. **No iPhone/iPad/Android physical-device test is claimed.**

## License

Plugin code is [MIT](LICENSE). See [NOTICE.md](NOTICE.md) for the logo attribution and trademark note. Independently maintained and not an official DeepSeek distribution.
