// Touch scrolling against a real DSH conversation. A local stand-in for the
// Messages API streams one long Markdown answer, so no model API is called.
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { createServer } from 'node:http'
import { spawn, spawnSync } from 'node:child_process'
import assert from 'node:assert/strict'
import { chromium } from 'playwright'

const answer = Array.from({ length: 60 }, (_, i) => `## Section ${i + 1}\n\nLine ${i + 1} of a long answer used to make the conversation scroll on a touch screen.\n\n\`\`\`js\nconst wide${i} = '${'x'.repeat(160)}'\n\`\`\`\n`).join('\n')
const sse = (event, data) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
const fake = createServer((req, res) => {
  req.resume()
  if (req.method !== 'POST' || !req.url.endsWith('/messages')) { res.writeHead(404).end(); return }
  res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-store' })
  res.write(sse('message_start', { type: 'message_start', message: { id: 'msg_touch', type: 'message', role: 'assistant', model: 'deepseek-chat', content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: 10, output_tokens: 0 } } }))
  res.write(sse('content_block_start', { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } }))
  for (let i = 0; i < answer.length; i += 2000) res.write(sse('content_block_delta', { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: answer.slice(i, i + 2000) } }))
  res.write(sse('content_block_stop', { type: 'content_block_stop', index: 0 }))
  res.write(sse('message_delta', { type: 'message_delta', delta: { stop_reason: 'end_turn', stop_sequence: null }, usage: { output_tokens: 2000 } }))
  res.end(sse('message_stop', { type: 'message_stop' }))
})
await new Promise(done => fake.listen(0, '127.0.0.1', done))
const api = `http://127.0.0.1:${fake.address().port}`

const world = await mkdtemp(join(tmpdir(), 'dsh-pwa-touch-'))
const env = { ...process.env, DSH_HOME: world, DSH_TELEMETRY_MODE: 'DISABLED', DEEPSEEK_API_KEY: 'pwa-touch-fixture-key', DEEPSEEK_BASE_URL: api, DEEPSEEK_SEARCH_BASE_URL: 'http://127.0.0.1:9' }
const manifest = JSON.parse(await readFile('package.json', 'utf8'))
const source = process.argv[2] ?? resolve(`dsh-pwa-${manifest.version}.tgz`)
const profile = 'pwa-touch'
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

const child = spawn('dsh', ['--profile', profile, '--no-open', '--port', '0'], { env, stdio: ['ignore', 'pipe', 'pipe'] })
let log = ''; child.stdout.on('data', chunk => { log += chunk }); child.stderr.on('data', chunk => { log += chunk })
const exited = new Promise(done => child.once('exit', done))
let browser
try {
  let url
  for (let count = 0; count < 300 && !url; count++) {
    const match = log.match(/http:\/\/(?:127\.0\.0\.1|localhost):\d+\S*/)
    if (match) url = match[0].replace(/\x1b\[[0-9;]*m/g, '')
    else if (child.exitCode !== null) throw new Error('DSH exited before startup')
    else await new Promise(done => setTimeout(done, 100))
  }
  assert.ok(url, 'DSH startup URL')
  browser = await chromium.launch({ headless: true, ...(process.env.DSH_TEST_CHROMIUM ? { executablePath: process.env.DSH_TEST_CHROMIUM } : {}) })
  // iPad portrait keeps the stock layout in Auto; a phone gets the mobile layout.
  for (const device of [{ name: 'ipad', width: 820, height: 1180, mobile: false }, { name: 'phone', width: 390, height: 844, mobile: true }]) {
    const context = await browser.newContext({ viewport: { width: device.width, height: device.height }, hasTouch: true, isMobile: device.mobile, deviceScaleFactor: 2 })
    const page = await context.newPage(), errors = []
    page.on('pageerror', error => errors.push(error.message))
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
    for (const name of [/Continue|继续|続ける/, /^Configure later$/]) {
      const button = page.getByRole('button', { name }).first()
      if (await button.waitFor({ state: 'visible', timeout: 4000 }).then(() => true, () => false)) await button.click()
    }
    assert.equal(await page.evaluate(() => matchMedia('(any-pointer: coarse)').matches), true, 'touch emulation matches any-pointer: coarse')
    assert.equal(await page.evaluate(() => document.documentElement.hasAttribute('data-dsh-touch')), true)
    assert.equal(await page.evaluate(() => document.documentElement.hasAttribute('data-dsh-mobile')), device.mobile)
    const id = await page.evaluate(async cwd => {
      const ctx = window.__pwaTestContext, workspace = await ctx.get('workspaces').create({ path: cwd })
      const id = await ctx.get('sessions').create({ workspaceId: workspace.workspaceId })
      ctx.get('uiWorkspace').openSession(id); return id
    }, world)
    await page.waitForFunction(id => document.querySelector('[data-conversation-session]')?.dataset.conversationSession === id, id)
    const input = page.locator('[data-composer-input]')
    await input.click(); await page.keyboard.type('Write a long answer.'); await page.getByRole('button', { name: 'Send message', exact: true }).click()
    await page.getByText('Section 60', { exact: true }).waitFor({ timeout: 60000 })
    await page.waitForTimeout(500)
    const scroll = page.locator('[data-conversation-scroll]')
    const styles = await page.evaluate(() => {
      const css = el => getComputedStyle(el)
      const sc = document.querySelector('[data-conversation-scroll]')
      return {
        html: css(document.documentElement).overscrollBehaviorY, body: css(document.body).overscrollBehaviorY,
        scroller: css(sc).overscrollBehaviorY, touch: css(sc.querySelector('p') ?? sc).touchAction,
        page: document.scrollingElement.scrollHeight - document.scrollingElement.clientHeight,
        overflow: sc.scrollHeight - sc.clientHeight,
      }
    })
    assert.equal(styles.html, 'none'); assert.equal(styles.body, 'none'); assert.equal(styles.scroller, 'none')
    assert.equal(styles.touch, 'manipulation')
    assert.ok(styles.page <= 0, `${device.name}: the document itself does not scroll (${styles.page}px)`)
    assert.ok(styles.overflow > device.height, `${device.name}: the conversation is long enough to scroll`)
    const box = await scroll.boundingBox()
    const cdp = await context.newCDPSession(page)
    // Raw touch points go through the same hit testing, touch-action and overscroll path as a finger.
    const swipe = async (x, y, distance) => {
      const steps = 12, point = dy => [{ x: Math.round(x), y: Math.round(y + dy), id: 1 }]
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: point(0) })
      for (let step = 1; step <= steps; step++) {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: point(distance * step / steps) })
        await page.waitForTimeout(16)
      }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
      await page.waitForTimeout(400)
    }
    const read = () => page.evaluate(() => ({ chat: document.querySelector('[data-conversation-scroll]').scrollTop, page: scrollY, root: document.documentElement.scrollTop }))
    const atEnd = await read()
    await swipe(box.x + box.width / 2, box.y + box.height / 2, 500) // finger down: content moves toward the top
    const up = await read()
    assert.ok(up.chat < atEnd.chat - 100, `${device.name}: a touch swipe scrolls the conversation (${atEnd.chat} → ${up.chat})`)
    assert.equal(up.page, 0); assert.equal(up.root, 0)
    // At the top edge the swipe must not move the page.
    await page.evaluate(() => { document.querySelector('[data-conversation-scroll]').scrollTop = 0 })
    await swipe(box.x + box.width / 2, box.y + box.height / 2, 400)
    const top = await read()
    assert.equal(top.page, 0, `${device.name}: overscroll at the top does not scroll the page`)
    // A swipe that starts outside the conversation (header or toolbar) does not move the page either.
    await swipe(box.x + box.width / 2, Math.max(8, box.y - 20), -400)
    assert.equal((await read()).page, 0, `${device.name}: a swipe on the header does not scroll the page`)
    await swipe(box.x + box.width / 2, box.y + box.height / 2, -900)
    const down = await read()
    assert.ok(down.chat > 300, `${device.name}: scrolling back down works (${down.chat})`)
    await page.screenshot({ path: join(world, `touch-${device.name}.png`) })
    await cdp.detach()
    assert.equal(errors.length, 0, errors.join('\n'))
    console.log(`${device.name} ${device.width}x${device.height}: touch scope, page overscroll none, conversation overscroll none, swipe ${atEnd.chat}→${up.chat}→${down.chat}, page scroll 0`)
    await context.close()
  }
  console.log(`Touch scroll check passed; evidence ${world}`)
} catch (error) {
  await writeFile(join(world, 'startup.log'), log)
  console.error('Evidence ' + world); throw error
} finally {
  await browser?.close(); child.kill('SIGTERM'); await exited; fake.close()
}
