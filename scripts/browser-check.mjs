// Real DSH + its frozen React/primitives module table. No product build or server is added.
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawn, spawnSync } from 'node:child_process'
import assert from 'node:assert/strict'
import { chromium } from 'playwright'
const world = await mkdtemp(join(tmpdir(), 'dsh-pwa-smoke-'))
const env = { ...process.env, DSH_HOME: world, DSH_TELEMETRY_MODE: 'DISABLED', DEEPSEEK_API_KEY: 'pwa-smoke-fixture-key', DEEPSEEK_BASE_URL: 'http://127.0.0.1:9', DEEPSEEK_SEARCH_BASE_URL: 'http://127.0.0.1:9' }
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
                exports.apply = ctx => { window.__pwaTestContext = ctx; return original(ctx) }
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
      await page.getByRole('button', { name: /Settings|設定/ }).first().click()
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
      const freshManifest = await (await page.request.get(`${origin}/manifest.webmanifest`)).json()
      assert.equal(freshManifest.start_url, './'); assert.equal(freshManifest.scope, './'); assert.equal(freshManifest.id, undefined)
      const maskable = freshManifest.icons.find(icon => String(icon.purpose ?? '').split(/\s+/).includes('maskable'))
      assert.equal(maskable?.sizes, '512x512')
      assert.equal(maskable?.src, './pwa/icon-512-maskable.png')
      assert.ok(freshManifest.icons.some(icon => icon.purpose === 'any' && icon.sizes === '192x192'))
      assert.ok(freshManifest.icons.some(icon => icon.purpose === 'any' && icon.sizes === '512x512'))
      for (const [filename, size] of [['apple-touch-icon.png', 180], ['icon-192.png', 192], ['icon-512.png', 512], ['icon-512-maskable.png', 512]]) {
        const response = await page.request.get(`${origin}/pwa/${filename}`), png = await response.body()
        assert.equal(response.status(), 200); assert.equal(png.readUInt32BE(16), size); assert.equal(png.readUInt32BE(20), size)
      }
      for (const width of [1280, 600, 390]) {
        await page.setViewportSize({ width, height: 900 })
        await panel.getByRole('button', { name: '更新を確認', exact: true }).click()
        await panel.getByRole('button', { name: '更新を確認', exact: true }).waitFor()
        await page.waitForFunction(() => !document.querySelector('.dsh-pwa-updates button')?.disabled)
        assert.equal(await page.evaluate(() => document.documentElement.hasAttribute('data-dsh-mobile')), width < 768, `mobile layout follows auto mode at ${width}px`)
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
      await page.getByRole('button', { name: 'Settings', exact: true }).click()
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
      await drawer()
      await page.screenshot({ path: join(world, 'mobile-drawer-open.png'), animations: 'disabled' })
      await page.getByRole('button', { name: 'サイドバーを閉じる', exact: true }).click(); await menu.waitFor()
      await drawer(); await page.getByRole('button', { name: 'New session', exact: true }).last().click(); await menu.waitFor()
      await drawer(); await page.getByRole('button', { name: 'New session', exact: true }).first().click(); await menu.waitFor()
      await drawer(); await page.getByRole('button', { name: 'Plugins', exact: true }).click(); await menu.waitFor()
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
      await page.getByRole('button', { name: 'Open right sidebar', exact: true }).click()
      await page.getByRole('button', { name: 'パネルを閉じる', exact: true }).waitFor()
      await page.waitForFunction(() => { const p = document.querySelector('[data-sidebar-right-panel][data-sidebar-right-open]'); return p && p.getBoundingClientRect().right <= innerWidth + 1 })
      const right = await page.locator('[data-sidebar-right-panel][data-sidebar-right-open]').boundingBox()
      assert.ok(right.width < 390 && right.x > 0, 'right drawer leaves conversation visible')
      await page.screenshot({ path: join(world, 'mobile-right-panel.png'), animations: 'disabled' })
      await page.getByRole('button', { name: 'パネルを閉じる', exact: true }).click()
      await page.waitForFunction(() => !window.__pwaTestContext.get('sidebarRight').isExpanded())
      await page.getByRole('button', { name: 'Open right sidebar', exact: true }).click()
      await page.getByRole('button', { name: 'パネルを閉じる', exact: true }).waitFor()
      await page.getByText('Workspace files', { exact: true }).click()
      await page.locator('[data-sidebar-right-panel] button[data-sidebar-right-toggle]').click()
      await menu.waitFor()
      await page.screenshot({ path: join(world, 'mobile-conversation.png'), animations: 'disabled' })
      await drawer(); await page.locator(`[data-row-key="session:${id}"]`).click(); await menu.waitFor()
      await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' })
      await drawer()
      assert.equal(await page.locator('[data-slot=root]>div>div[data-side]').first().evaluate(el => getComputedStyle(el).display), 'none')
      await page.screenshot({ path: join(world, `mobile-drawer-dark-${restart}.png`), animations: 'disabled' })
      await page.getByRole('button', { name: 'サイドバーを閉じる', exact: true }).click(); await menu.waitFor()
      await page.getByRole('button', { name: 'Open right sidebar', exact: true }).click()
      await page.getByRole('button', { name: 'パネルを閉じる', exact: true }).waitFor()
      assert.equal(await page.locator('[data-sidebar-right-panel][data-sidebar-right-open]').evaluate(el => getComputedStyle(el).animationName), 'none')
      await page.screenshot({ path: join(world, `mobile-right-dark-${restart}.png`), animations: 'disabled' })
      await page.getByRole('button', { name: 'パネルを閉じる', exact: true }).click(); await menu.waitFor()
      await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'no-preference' })
      await page.setViewportSize({ width: 1280, height: 900 }); await active(false)
      assert.equal(await page.locator('.dsh-pwa-menu,.dsh-pwa-scrim').count(), 0)
      await page.screenshot({ path: join(world, `desktop-conversation-${restart}.png`), animations: 'disabled' })
      assert.equal(errors.length, 0, errors.join('\n'))
      assert.ok(!consoleMessages.some(message => /dsh-pwa|PWA update/i.test(message)), consoleMessages.join('\n'))
      await writeFile(join(world, `console-${restart}.json`), JSON.stringify(consoleMessages))
      assert.equal(new URL(page.url()).origin, origin)
      assert.ok((await page.title()).length > 0)
      console.log(`DSH startup ${restart + 1}: version ${manifest.version}, authenticated routes, manifest/icons, Japanese UI 1280/600/390px, 767/768px boundary, persistent modes, drawers/reselection, reduced motion and desktop recovery passed; source ${source.startsWith('github:') ? 'GitHub commit' : 'local package'}; evidence ${world}`)
    } catch (error) { await writeFile(join(world, `startup-${restart}.log`), log); const page = context.pages()[0]; if (page) { await page.screenshot({ path: join(world, 'failure.png') }).catch(() => {}); await writeFile(join(world, 'failure-dom.txt'), await page.locator('body').innerText()).catch(() => {}) } console.error('Evidence '+world); throw error }
    finally { await context.close(); child.kill('SIGTERM'); await done }
  }
} finally { await browser?.close() }
