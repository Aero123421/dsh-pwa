// Real DSH + its frozen React/primitives module table. No product build or server is added.
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawn, spawnSync } from 'node:child_process'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { chromium } from 'playwright'
const world = await mkdtemp(join(tmpdir(), 'dsh-pwa-smoke-'))
// Local Anthropic-format stub: one fixed Markdown reply with a wide table. No model API is called.
const reply = '| Column A | Column B | A much longer column C | Column D |\n| --- | --- | --- | --- |\n| 1 | value | a long cell that needs more than the narrow phone width | ok |\n\nEnd of fixture reply.'
const stub = createServer((req, res) => {
  let body = ''
  req.on('data', chunk => { body += chunk })
  req.on('end', () => {
    if (req.method !== 'POST' || !req.url.endsWith('/messages')) { res.writeHead(404); res.end(); return }
    let stream = false
    try { stream = JSON.parse(body).stream === true } catch {}
    const message = { id: 'msg_fixture', type: 'message', role: 'assistant', model: 'fixture', content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: 1, output_tokens: 0 } }
    if (!stream) { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ ...message, content: [{ type: 'text', text: 'Fixture' }], stop_reason: 'end_turn' })); return }
    res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' })
    for (const event of [{ type: 'message_start', message }, { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } }, { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: reply } }, { type: 'content_block_stop', index: 0 }, { type: 'message_delta', delta: { stop_reason: 'end_turn', stop_sequence: null }, usage: { output_tokens: 1 } }, { type: 'message_stop' }]) res.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`)
    res.end()
  })
})
await new Promise(resolve => stub.listen(0, '127.0.0.1', resolve))
const modelUrl = `http://127.0.0.1:${stub.address().port}`
const env = { ...process.env, DSH_HOME: world, DSH_TELEMETRY_MODE: 'DISABLED', DEEPSEEK_API_KEY: 'pwa-smoke-fixture-key', DEEPSEEK_BASE_URL: modelUrl, DEEPSEEK_SEARCH_BASE_URL: 'http://127.0.0.1:9' }
const manifest = JSON.parse(await readFile('package.json', 'utf8'))
const source = process.argv[2] ?? resolve(`dsh-pwa-${manifest.version}.tgz`)
const profile = 'pwa-update-smoke'
function command(args) {
  const result = spawnSync('dsh', args, { env, encoding: 'utf8', timeout: 240000 })
  if (result.status !== 0) { void writeFile(join(world, 'command.log'), result.stdout + result.stderr); throw new Error(`DSH command failed; evidence ${world}`) }
}
command(['--profile', profile, '--from-default-profile', 'web', '--dump-config'])
command(['plugin', '--profile', profile, 'add', '-w', '--ignore-scripts', source])
const profileFile = join(world, 'profiles', profile, 'package.json')
const settings = JSON.parse(await readFile(profileFile, 'utf8'))
settings.dsh.profile.bundles = [...new Set([...settings.dsh.profile.bundles, 'dsh-pwa'])]
await writeFile(profileFile, JSON.stringify(settings, null, 2))
let browser
try {
  browser = await chromium.launch({ headless: true, ...(process.env.DSH_TEST_CHROMIUM ? { executablePath: process.env.DSH_TEST_CHROMIUM } : {}) })
  for (let restart = 0; restart < 2; restart++) {
    const child = spawn('dsh', ['--profile', profile, '--no-open', '--port', '0'], { env, stdio: ['ignore', 'pipe', 'pipe'] })
    let log = ''; child.stdout.on('data', chunk => { log += chunk }); child.stderr.on('data', chunk => { log += chunk })
    const done = new Promise(resolve => child.once('exit', resolve))
    const context = await browser.newContext({ locale: 'ja-JP', viewport: { width: 1280, height: 900 } })
    try {
      let url
      for (let count = 0; count < 300; count++) {
        const match = log.match(/http:\/\/(?:127\.0\.0\.1|localhost):\d+\S*/)
        if (match) { url = match[0].replace(/\x1b\[[0-9;]*m/g, ''); break }
        if (child.exitCode !== null) throw new Error('DSH exited before startup')
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      assert.ok(url, 'DSH startup URL')
      const origin = new URL(url).origin
      const unauthorized = await fetch(`${origin}/api/dsh-pwa/update-status`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })
      assert.equal(unauthorized.status, 401)
      const foreign = await fetch(`${origin}/api/dsh-pwa/update-status`, { method: 'POST', headers: { origin: 'https://untrusted.example', 'content-type': 'application/json' }, body: '{}' })
      assert.equal(foreign.status, 403)
      const page = await context.newPage(), errors = [], consoleMessages = []
      page.on('pageerror', error => errors.push(error.message))
      page.on('console', message => { if (['error', 'warning'].includes(message.type())) consoleMessages.push(message.text()) })
      // Capture only this plugin's real Context for a test-owned Japanese language registration.
      await page.addInitScript(() => {
        let current
        Object.defineProperty(window, '__ModuleLoader__', { configurable: true, get: () => current, set(value) {
          current = value
          let load = value.load
          Object.defineProperty(value, 'load', { configurable: true, get: () => function(registration) {
            if (registration.id === 'dsh-pwa') {
              const factory = registration.factory
              registration = { ...registration, factory(require) {
                const exports = factory(require), original = exports.apply
                exports.apply = ctx => { window.__pwaTestContext = ctx; window.__pwaTestExports = exports; return original(ctx) }
                return exports
              } }
            }
            return load.call(value, registration)
          }, set(fn) { load = fn } })
        } })
      })
      await page.goto(url)
      await page.waitForFunction(() => { const ctx = window.__pwaTestContext; return ctx?.get('sessions')?.list.getSnapshot().phase === 'ready' && ctx?.get('workspaces')?.list.getSnapshot().phase === 'ready' })
      const notice = page.getByRole('button', { name: /Continue|继续|続ける/ }).first()
      if (await notice.waitFor({ state: 'visible', timeout: 6000 }).then(() => true, () => false)) await notice.click()
      await page.waitForFunction(() => !!window.__pwaTestContext)
      await page.evaluate(() => {
        const locale = window.__pwaTestContext.locale
        if (!locale.getSnapshot().locales.some(language => language.id === 'ja')) locale.addLanguage({ id: 'ja', label: '日本語', fallback: 'en' })
        locale.setLocale('ja')
      })
      const onboarding = page.getByRole('button', { name: 'Configure later', exact: true })
      if (await onboarding.waitFor({ state: 'visible', timeout: 6000 }).then(() => true, () => false)) await onboarding.click()
      // The account launcher replaces the sidebar Settings button. Its accessible
      // name is "Account menu" and the visible label is More. Settings is a
      // menuitem in that menu, so a role=button query does not reach it.
      async function openSettings() {
        const direct = page.getByRole('button', { name: /^(Settings|設定|设置)$/ }).filter({ visible: true })
        if (await direct.count()) {
          await direct.click()
          return
        }
        const trigger = page.getByRole('button', { name: /^(Account menu|账号菜单)$/ }).filter({ visible: true })
        if (await trigger.count()) await trigger.click()
        else await page.locator('button:visible').filter({ hasText: /^(More|更多)$/ }).click()
        await page.getByRole('menuitem', { name: /^(Settings|設定|设置)$/ }).click()
      }
      await openSettings()
      await page.getByRole('dialog').getByText('PWA・モバイル', { exact: true }).first().click()
      const panel = page.locator('.dsh-pwa-updates')
      await panel.getByText(`プラグインの実行版: ${manifest.version}`, { exact: true }).waitFor()
      const state = await page.evaluate(async () => {
        const method = 'dsh-pwa/update-status'
        return (await fetch(`/api/${method}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: 'client-request', rpcId: 'smoke', method, payload: {} }) })).json()
      })
      assert.equal(state.result.ok, true); assert.equal(state.result.value.runtimeVersion, manifest.version)
      if (source.startsWith('github:')) {
        const checked = await page.evaluate(async () => {
          const method = 'dsh-pwa/update-check'
          return (await fetch(`/api/${method}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: 'client-request', rpcId: 'release-smoke', method, payload: {} }) })).json()
        })
        assert.equal(checked.result.ok, true)
        assert.ok(['no-release', 'current', 'available'].includes(checked.result.value.status), 'published source can check stable releases')
      }
      // Validate the browser's selected manifest, not only a manually requested URL.
      const cdp = await context.newCDPSession(page)
      const selected = await cdp.send('Page.getAppManifest')
      assert.equal(new URL(selected.url).pathname, '/manifest.webmanifest')
      assert.equal(selected.errors.filter(error => error.critical).length, 0)
      assert.equal(JSON.parse(selected.data).short_name, 'DSH')
      assert.equal(await page.locator('link[rel=manifest]').count(), 1)
      assert.match(await page.locator('meta[name=viewport]').getAttribute('content'), /viewport-fit=cover/)
      await page.locator('.dsh-pwa-install').getByText('manifestとホーム画面用アイコンを取得できました。', { exact: true }).waitFor()
      assert.ok(await page.locator('.dsh-pwa-identity img').evaluate(async image => { await image.decode(); return image.naturalWidth === 180 }))
      // A late enable must repair head metadata without a full document reload.
      await page.evaluate(() => {
        const link = document.querySelector('link[rel=manifest]'), old = link.getAttribute('href')
        link.setAttribute('href', '/stale.webmanifest')
        const dispose = window.__pwaTestExports.mountPwaHead()
        if (link.getAttribute('href') !== './manifest.webmanifest') throw new Error('hot activation did not repair manifest')
        dispose()
        if (link.getAttribute('href') !== '/stale.webmanifest') throw new Error('head cleanup did not restore owner')
        link.setAttribute('href', old)
      })
      await cdp.detach()
      const freshManifest = await (await page.request.get(`${origin}/manifest.webmanifest`)).json()
      assert.equal(freshManifest.start_url, './'); assert.equal(freshManifest.scope, './'); assert.equal(freshManifest.id, undefined)
      const maskable = freshManifest.icons.filter(icon => String(icon.purpose ?? '').split(/\s+/).includes('maskable'))
      assert.deepEqual(maskable.map(icon => icon.sizes), ['192x192', '512x512'])
      assert.deepEqual(maskable.map(icon => icon.src), ['./pwa/icon-192-maskable.png', './pwa/icon-512-maskable.png'])
      assert.ok(freshManifest.icons.some(icon => icon.purpose === 'any' && icon.sizes === '192x192'))
      assert.ok(freshManifest.icons.some(icon => icon.purpose === 'any' && icon.sizes === '512x512'))
      for (const [filename, size] of [['apple-touch-icon.png', 180], ['icon-192.png', 192], ['icon-512.png', 512], ['icon-192-maskable.png', 192], ['icon-512-maskable.png', 512]]) {
        const response = await page.request.get(`${origin}/pwa/${filename}`), png = await response.body()
        assert.equal(response.status(), 200); assert.equal(png.readUInt32BE(16), size); assert.equal(png.readUInt32BE(20), size)
      }
      for (const width of [1280, 600, 390, 360, 320]) {
        await page.setViewportSize({ width, height: 900 })
        await panel.getByRole('button', { name: '更新を確認', exact: true }).click()
        await panel.getByRole('button', { name: '更新を確認', exact: true }).waitFor()
        await page.waitForFunction(() => !document.querySelector('.dsh-pwa-updates button')?.disabled)
        assert.equal(await page.evaluate(() => document.documentElement.hasAttribute('data-dsh-mobile')), width < 768, `mobile layout follows auto mode at ${width}px`)
        if (width < 768) {
          const dialog = await page.getByRole('dialog').boundingBox()
          assert.ok(dialog.x >= 0 && dialog.x + dialog.width <= width + 1, `settings fits ${width}px`)
          assert.ok(await page.locator('.dsh-pwa-install').evaluate(el => el.scrollWidth <= el.clientWidth + 1))
        }
        const overflow = await panel.evaluate(element => element.scrollWidth - element.clientWidth)
        assert.ok(overflow <= 1, `PWA panel overflow at ${width}px: ${overflow}`)
        await page.screenshot({ path: join(world, `pwa-${restart}-${width}-ja.png`), fullPage: false })
      }
      const mobile = page.locator('.dsh-pwa-mobile')
      async function active(value) { await page.waitForFunction(value => document.documentElement.hasAttribute('data-dsh-mobile') === value, value) }
      for (const width of [767, 768, 1280]) {
        await page.setViewportSize({ width, height: 900 }); await active(width < 768)
      }
      await mobile.getByRole('button', { name: 'オン', exact: true }).click(); await active(true)
      await mobile.getByRole('button', { name: 'オフ', exact: true }).click(); await active(false)
      await page.setViewportSize({ width: 390, height: 900 }); await active(false)
      await page.reload(); await page.waitForFunction(() => window.__pwaTestContext?.get('sessions')?.list.getSnapshot().phase === 'ready'); await active(false)
      assert.equal(await page.locator('.dsh-pwa-menu').count(), 0)
      await page.evaluate(() => { const locale = window.__pwaTestContext.locale; if (!locale.getSnapshot().locales.some(x => x.id === 'ja')) locale.addLanguage({ id: 'ja', label: '日本語', fallback: 'en' }); locale.setLocale('ja') })
      await openSettings()
      await page.getByRole('dialog').getByText('PWA・モバイル', { exact: true }).first().click()
      await mobile.getByRole('button', { name: '自動', exact: true }).click(); await active(true)
      assert.ok((await panel.innerText()).includes('ホーム画面'))
      await page.keyboard.press('Escape'); await page.getByRole('dialog').waitFor({ state: 'hidden' })
      assert.equal(await page.locator('vite-error-overlay,nextjs-portal').count(), 0)
      const menu = page.getByRole('button', { name: 'サイドバーを開く', exact: true })
      async function drawer() {
        await menu.click()
        await page.waitForFunction(() => { const side = document.querySelector('[data-slot=root]>div>div:has(>[data-slot=sidebar])'); return side?.getBoundingClientRect().x >= -.5 })
      }
      for (const width of [320, 360, 390]) {
        await page.setViewportSize({ width, height: 740 })
        const center = await page.locator('[data-slot=root]>div>div:has(>[data-slot=main])').boundingBox()
        assert.ok(Math.abs(center.x) < 1 && Math.abs(center.width - width) < 1, `single-column shell at ${width}px`)
      }
      await page.setViewportSize({ width: 390, height: 900 })
      await drawer()
      await page.keyboard.press('Escape'); await menu.waitFor()
      await drawer()
      await page.screenshot({ path: join(world, 'mobile-drawer-open.png'), animations: 'disabled' })
      // The header menu is behind the open drawer; the backdrop closes it.
      const scrim = page.getByRole('button', { name: 'サイドバーの背景を閉じる', exact: true })
      await scrim.click(); await menu.waitFor()
      await drawer(); await page.getByRole('button', { name: 'New session', exact: true }).last().click(); await menu.waitFor()
      await drawer(); await page.getByRole('button', { name: 'New session', exact: true }).first().click(); await menu.waitFor()
      assert.equal(await page.locator('.dsh-pwa-toolbar').count(), 0, 'conversation views use the header menu, not the fallback toolbar')
      assert.equal(await page.locator('[data-conversation-header-leading] .dsh-pwa-menu-inline').count(), 1)
      await drawer(); await page.getByRole('button', { name: 'Plugins', exact: true }).click(); await menu.waitFor()
      await page.locator('.dsh-pwa-toolbar').waitFor()
      assert.equal(await page.evaluate(() => document.documentElement.hasAttribute('data-dsh-mobile-toolbar')), true, 'pages without a conversation header keep the toolbar')
      await drawer(); await page.getByRole('button', { name: 'Plugins', exact: true }).click(); await menu.waitFor()
      await drawer(); await page.getByRole('button', { name: 'New session', exact: true }).last().click(); await menu.waitFor()
      const id = await page.evaluate(async cwd => {
        const ctx = window.__pwaTestContext, workspace = await ctx.get('workspaces').create({ path: cwd })
        const id = await ctx.get('sessions').create({ workspaceId: workspace.workspaceId })
        ctx.get('uiWorkspace').openSession(id); return id
      }, world)
      await page.waitForFunction(id => document.querySelector('[data-conversation-session]')?.dataset.conversationSession === id, id)
      await page.locator('[data-composer-input]').waitFor()
      assert.ok(await page.locator('[data-composer-input]').evaluate(el => parseFloat(getComputedStyle(el).fontSize) >= 16), 'mobile composer avoids iOS focus zoom')
      const header = await page.locator('[data-slot="conversation.header"] > header').boundingBox()
      assert.ok(header.height <= 72, `conversation header stays compact: ${header.height}`)
      if (restart === 0) {
        await page.locator('[data-composer-input]').fill('Show the fixture table.')
        await page.locator('[data-composer-input]').press('Enter')
        await page.getByText('End of fixture reply.', { exact: true }).waitFor({ timeout: 30000 })
        const table = page.locator('[data-conversation-content] .md-table-wide').first()
        await table.scrollIntoViewIfNeeded()
        assert.equal(await table.evaluate(el => getComputedStyle(el).overflowX), 'auto', 'wide tables scroll on touch screens without hover')
        assert.ok(await table.evaluate(el => { el.scrollLeft = el.scrollWidth; return el.scrollLeft > 0 }), 'wide table scrolls horizontally')
        await page.screenshot({ path: join(world, 'mobile-table.png'), animations: 'disabled' })
      }
      const panelToggle = page.locator('[data-sidebar-right-panel][data-sidebar-right-open] button[data-sidebar-right-toggle]')
      await page.getByRole('button', { name: 'Open right sidebar', exact: true }).click()
      await panelToggle.waitFor()
      await page.waitForFunction(() => { const p = document.querySelector('[data-sidebar-right-panel][data-sidebar-right-open]'); return p && p.getBoundingClientRect().right <= innerWidth + 1 })
      const right = await page.locator('[data-sidebar-right-panel][data-sidebar-right-open]').boundingBox()
      assert.ok(Math.abs(right.width - 390) < 1 && Math.abs(right.x) < 1, 'files use the entire phone width')
      await page.screenshot({ path: join(world, 'mobile-right-panel.png'), animations: 'disabled' })
      await panelToggle.click()
      await page.waitForFunction(() => !window.__pwaTestContext.get('sidebarRight').isExpanded())
      await page.getByRole('button', { name: 'Open right sidebar', exact: true }).click()
      await panelToggle.waitFor()
      await page.getByText('Workspace files', { exact: true }).click()
      await page.locator('[data-sidebar-right-panel] button[data-sidebar-right-toggle]').click()
      await menu.waitFor()
      await page.screenshot({ path: join(world, 'mobile-conversation.png'), animations: 'disabled' })
      await drawer(); await page.locator(`[data-row-key="session:${id}"]`).click(); await menu.waitFor()
      await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' })
      await drawer()
      assert.equal(await page.locator('[data-slot=root]>div>div[data-side]').first().evaluate(el => getComputedStyle(el).display), 'none')
      await page.screenshot({ path: join(world, `mobile-drawer-dark-${restart}.png`), animations: 'disabled' })
      await scrim.click(); await menu.waitFor()
      await page.getByRole('button', { name: 'Open right sidebar', exact: true }).click()
      await panelToggle.waitFor()
      assert.equal(await page.locator('[data-sidebar-right-panel][data-sidebar-right-open]').evaluate(el => getComputedStyle(el).animationName), 'none')
      await page.screenshot({ path: join(world, `mobile-right-dark-${restart}.png`), animations: 'disabled' })
      await panelToggle.click(); await menu.waitFor()
      await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'no-preference' })
      await page.setViewportSize({ width: 1280, height: 900 }); await active(false)
      assert.equal(await page.locator('.dsh-pwa-menu,.dsh-pwa-scrim').count(), 0)
      // The header seat holds one entry; outside the mobile layout it must stay free for other plugins.
      assert.equal(await page.evaluate(() => window.__pwaTestContext.slots.entries?.('conversation.header.leading')?.length ?? 0), 0, 'header seat is released on desktop')
      await page.screenshot({ path: join(world, `desktop-conversation-${restart}.png`), animations: 'disabled' })
      if (restart === 0) {
        // Auto mode treats a touch phone in landscape as mobile even though it is wider than 767px.
        const phone = await browser.newContext({ locale: 'ja-JP', viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true })
        try {
          const landscape = await phone.newPage()
          landscape.on('pageerror', error => errors.push(error.message))
          await landscape.goto(url)
          await landscape.waitForFunction(() => document.documentElement.hasAttribute('data-dsh-mobile'))
          await landscape.locator('.dsh-pwa-menu').first().waitFor()
          const center = await landscape.locator('[data-slot=root]>div>div:has(>[data-slot=main])').boundingBox()
          assert.ok(Math.abs(center.x) < 1 && Math.abs(center.width - 844) < 1, 'single-column shell in landscape')
          await landscape.screenshot({ path: join(world, 'mobile-landscape.png'), animations: 'disabled' })
        } finally { await phone.close() }
      }
      assert.equal(errors.length, 0, errors.join('\n'))
      // Judge only the message line: DSH serves several plugins from one combined URL, so a stack
      // trace from another plugin can name dsh-pwa/client.js. The fixture directory is dsh-pwa-smoke-*.
      const own = consoleMessages.filter(message => /\bdsh-pwa\b(?!-smoke)|PWA update/i.test(message.split('\n')[0]))
      assert.equal(own.length, 0, own.join('\n'))
      await writeFile(join(world, `console-${restart}.json`), JSON.stringify(consoleMessages))
      assert.equal(new URL(page.url()).origin, origin)
      assert.ok((await page.title()).length > 0)
      console.log(`DSH startup ${restart + 1}: version ${manifest.version}, authenticated routes, manifest/icons, Japanese UI 1280/600/390px, 767/768px boundary, persistent modes, header menu/toolbar fallback, drawers/reselection, ${restart === 0 ? 'wide table scroll, landscape phone, ' : ''}reduced motion and desktop recovery passed; source ${source.startsWith('github:') ? 'GitHub commit' : 'local package'}; evidence ${world}`)
    } catch (error) { await writeFile(join(world, `startup-${restart}.log`), log); const page = context.pages()[0]; if (page) { await page.screenshot({ path: join(world, 'failure.png') }).catch(() => {}); await writeFile(join(world, 'failure-dom.txt'), await page.locator('body').innerText()).catch(() => {}) } console.error('Evidence '+world); throw error }
    finally { await context.close(); child.kill('SIGTERM'); await done }
  }
} finally { await browser?.close(); stub.close() }
