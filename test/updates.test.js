import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID, createHash } from 'node:crypto'
import { PluginUpdates, REPOSITORY, PACKAGE, compareVersions, semanticVersion, releaseCandidate, releaseNotes, checkCompatibility, installBundleUpdating, resultState, sourceKind, boundedFetch } from '../updates.js'
const version = '0.3.0', tag = `v${version}`
const filename = `dsh-pwa-${version}.tgz`
const download = `https://github.com/${REPOSITORY}/releases/download/${tag}/`
const release = { id: 7, tag_name: tag, html_url: `https://github.com/${REPOSITORY}/releases/tag/${tag}`, draft: false, prerelease: false, body: 'Changes', assets: [filename, 'SHA256SUMS'].map((name, i) => ({ name, id: i + 1, size: 50, browser_download_url: download + name })) }
const pkg = { name: PACKAGE, version, main: './index.js', exports: { './client': './client.js' }, files: ['index.js', 'updates.js', 'client.js', 'cordis.patch.yml', 'assets/*.png'], dsh: { bundle: { patch: './cordis.patch.yml' }, client: { platform: 'web' } }, peerDependencies: { '@deepseek-ai/dsh-app-boot': '0.2.1-alpha.2' } }
async function fetcher(input) {
  const url = String(input)
  if (url.endsWith('/releases/latest')) return Response.json(release)
  if (url.endsWith('/package.json')) return Response.json(pkg)
  if (url.endsWith('/cordis.patch.yml')) return new Response('- insert:\n    - id: dsh-pwa\n      name: dsh-pwa\n')
  if (url.endsWith('.png')) return new Response(await readFile(new URL(`../assets/${url.split('/').at(-1)}`, import.meta.url)))
  if (url.endsWith('.js')) return new Response('source entry')
  throw new Error(url)
}
async function fixture(t, overrides = {}) {
  const directory = await mkdtemp(join(tmpdir(), 'pi-update-'))
  t.after(() => rm(directory, { recursive: true, force: true }))
  const calls = []
  const bundle = { name: PACKAGE, installed: true, enabled: false, version: '0.2.0', source: `github:${REPOSITORY}` }
  const manager = { listBundles: async () => [bundle], waitForInstall: async () => null, removeBundle: async () => { throw new Error('unexpected remove') }, installBundle: async (...args) => { calls.push(args); bundle.version = version; return { changed: true, application: 'restart-required', stage: 'install', target: PACKAGE, bundle: PACKAGE, version } } }
  const updater = new PluginUpdates({ manager: () => manager, profileDir: directory, runtimeVersion: async () => '0.2.1-alpha.2', fetcher, version: '0.2.0', ...overrides })
  t.after(() => updater.dispose())
  return { updater, manager, bundle, calls, directory }
}
async function settle(updater) { while (updater.running) await new Promise(resolve => setTimeout(resolve, 5)) }

test('strict SemVer ordering, numeric prereleases, build metadata and invalid metadata', () => {
  assert.equal(compareVersions('0.10.0', '0.9.0'), 1)
  assert.equal(compareVersions('1.0.0-alpha.10', '1.0.0-alpha.2'), 1)
  assert.equal(compareVersions('1.0.0', '1.0.0-rc.1'), 1)
  assert.equal(compareVersions('1.0.0+x', '1.0.0+y'), 0)
  for (const invalid of ['01.0.0', '1.0', '1.0.0-01', '', null]) assert.throws(() => semanticVersion(invalid))
})
test('release schema, stable channel and compatibility are fail closed without requiring assets', () => {
  const candidate = releaseCandidate(release, '0.2.0')
  assert.equal(releaseCandidate(release, version), null)
  assert.equal(checkCompatibility(pkg, candidate, '0.2.1-alpha.2'), '0.2.1-alpha.2')
  assert.throws(() => checkCompatibility(pkg, candidate, '0.2.1'), /incompatible/)
  assert.equal(checkCompatibility({ ...pkg, peerDependencies: { '@deepseek-ai/dsh-app-boot': '>=0.2.1-alpha.2 <0.3.0-0' } }, candidate, '0.2.1-alpha.3'), '0.2.1-alpha.3')
  assert.throws(() => checkCompatibility({ ...pkg, peerDependencies: { '@deepseek-ai/dsh-app-boot': '>=0.2.1-alpha.2 <0.3.0-0' } }, candidate, '0.3.0-alpha.1'), /incompatible/)
  assert.throws(() => checkCompatibility({ ...pkg, peerDependencies: { '@deepseek-ai/dsh-llm': 'not-a-range' } }, candidate, '0.2.1-alpha.3'), /incompatible/)
  assert.equal(checkCompatibility({ ...pkg, peerDependencies: { '@deepseek-ai/dsh': 'workspace:^' } }, candidate, '0.2.1-alpha.3'), '0.2.1-alpha.3')
  assert.throws(() => checkCompatibility({ ...pkg, peerDependencies: {} }, candidate, '0.2.1-alpha.3'), /compatibility-unknown/)
  for (const value of [{ ...release, prerelease: true }, { ...release, draft: true }, { ...release, assets: 'invalid' }, { ...release, tag_name: 'garbage' }]) assert.throws(() => releaseCandidate(value, '0.2.0'))
  assert.ok(candidate)
  assert.ok(releaseCandidate({ ...release, assets: [] }, '0.2.0'))
})
test('only the original GitHub source family can update; local/registry/tarballs stay manual', () => {
  for (const source of [`github:${REPOSITORY}#v0.2.0`, `git+https://github.com/${REPOSITORY}.git#abc`]) assert.equal(sourceKind(source), 'github')
  for (const source of ['/tmp/a.tgz', 'file:/tmp/a.tgz', PACKAGE, 'github:evil/repo', download + filename]) assert.throws(() => sourceKind(source))
})
test('bounded retrieval refuses hostile redirects, streaming oversize and network failure', async () => {
  const url = `https://api.github.com/repos/${REPOSITORY}/releases/latest`
  await assert.rejects(boundedFetch(url, 5, { fetcher: async () => new Response(null, { status: 302, headers: { location: 'https://evil.example/payload' } }) }), /redirect/)
  await assert.rejects(boundedFetch(url, 5, { fetcher: async () => new Response('123456') }), /size/)
  await assert.rejects(boundedFetch(url, 5, { fetcher: async () => new Response('', { status: 500 }) }), /network/)
  await assert.rejects(boundedFetch(url, 5, { signal: AbortSignal.abort(), fetcher: async () => new Response('123') }))
})
test('manager results distinguish application, failure, cancellation, override and unknown', () => {
  const result = { bundle: PACKAGE, version, application: 'applied', changed: true }
  assert.equal(resultState(result, version, version, { installed: true, version }), 'applied')
  assert.equal(resultState(result, version, '0.2.0'), 'unknown')
  for (const application of ['failed', 'cancelled', 'overridden', 'restart-required']) assert.equal(resultState({ ...result, application }, version, version, { installed: true, version }), application)
  assert.equal(resultState({ ...result, packageResult: { exitCode: 0, timedOut: true } }, version, version), 'failed')
  assert.equal(resultState({ ...result, application: 'restart-required', packageResult: { exitCode: 1, timedOut: false } }, version, version, { installed: true, version }), 'failed')
  assert.equal(resultState(null, version, version), 'unknown')
})
test('single pinned install preserves disabled selection; journal supports reconnection and runtime verification', async t => {
  const { updater, manager, calls, directory, bundle } = await fixture(t)
  const checked = await updater.check(), requestId = randomUUID()
  assert.equal(checked.status, 'available')
  await updater.begin(checked.candidate.id, requestId, updater.base().profileKey)
  await updater.begin(checked.candidate.id, requestId, updater.base().profileKey)
  await settle(updater)
  assert.equal(calls.length, 1)
  assert.equal(calls[0][0], `github:${REPOSITORY}#${tag}`)
  assert.deepEqual(calls[0][1], { enabled: false, requestId, saveExact: true })
  assert.equal((await updater.reconcile(requestId)).status, 'restart-required')
  const restarted = new PluginUpdates({ manager: () => manager, profileDir: directory, version, runtimeVersion: async () => '0.2.1-alpha.2' })
  bundle.version = '0.2.0'
  assert.equal((await restarted.reconcile(requestId)).status, 'unknown')
  bundle.version = version
  assert.equal((await restarted.reconcile(requestId)).status, 'applied')
  assert.equal(await restarted.lastOperation(), undefined)
})
test('missing manager/read-only/source reject before networking and an ongoing operation rejects begin', async t => {
  const { updater, bundle } = await fixture(t, { fetcher: async () => { throw new Error('unexpected fetch') } })
  bundle.readOnlyReason = 'management-required'
  assert.equal((await updater.check()).reason, 'read-only')
  delete bundle.readOnlyReason; bundle.source = 'file:/tmp/untrusted.tgz'
  assert.equal((await updater.check()).reason, 'source')
  const missing = await fixture(t, { manager: () => undefined })
  assert.equal((await missing.updater.status()).reason, 'manager-unavailable')
  const busy = await fixture(t, { isBusy: () => true })
  await busy.updater.check()
  await assert.rejects(busy.updater.begin('7', randomUUID(), busy.updater.base().profileKey), /busy/)
})
test('tag manifest and required icon/client/patch files are validated before manager', async t => {
  for (const badFile of ['package.json', 'client.js', 'cordis.patch.yml', 'icon-512.png', 'icon-192-maskable.png', 'icon-512-maskable.png']) {
    const h = await fixture(t, { fetcher: async url => String(url).endsWith(badFile) ? new Response(badFile === 'package.json' ? JSON.stringify({ ...pkg, name: 'other-package' }) : '') : fetcher(url) })
    assert.equal((await h.updater.check()).status, 'blocked')
    assert.equal(h.calls.length, 0)
  }
})
test('forgotten request is unknown, never successful or automatically resubmitted', async t => {
  const { updater, calls, directory } = await fixture(t)
  const id = randomUUID()
  await updater.privateDir()
  await writeFile(join(directory, '.dsh-pwa-updates', `${id}.json`), JSON.stringify({ requestId: id, version, status: 'installing' }))
  assert.equal((await updater.reconcile(id)).status, 'unknown')
  assert.equal(calls.length, 0)
  await writeFile(join(directory, '.dsh-pwa-updates', `${id}.json`), JSON.stringify({ requestId: id, version, status: 'preparing' }))
  assert.equal((await updater.reconcile(id)).status, 'failed')
})

test('disposal aborts source preparation before manager invocation', async t => {
  const h = await fixture(t)
  await h.updater.check()
  h.updater.fetcher = async (_url, { signal }) => { signal.throwIfAborted(); return Response.json(release) }
  await h.updater.begin('7', randomUUID(), h.updater.base().profileKey); h.updater.dispose(); await settle(h.updater)
  assert.equal(h.calls.length, 0)
})
test('post-invocation transport failure remains unknown and reconciles the original manager request', async t => {
  const { updater, manager, bundle, directory, calls } = await fixture(t)
  let waited = 0
  manager.installBundle = async (...args) => { calls.push(args); bundle.version = version; throw new Error('response lost after manager admission') }
  manager.waitForInstall = async () => { waited++; return { changed: true, application: 'restart-required', stage: 'install', target: PACKAGE, bundle: PACKAGE, version } }
  await updater.check(); const id = randomUUID(); await updater.begin('7', id, updater.base().profileKey); await settle(updater)
  assert.equal((await updater.reconcile(id)).status, 'restart-required')
  assert.equal(waited, 1); assert.equal(calls.length, 1)
  const restarted = new PluginUpdates({ manager: () => manager, profileDir: directory, version, runtimeVersion: async () => '0.2.1-alpha.2' })
  assert.equal((await restarted.reconcile(id)).status, 'applied')
  assert.equal(calls.length, 1)
})

test('disposal or busy state during the awaited journal save cannot start manager installation', async t => {
  for (const action of ['dispose', 'login']) {
    let busy = false, reached, release
    const waiting = new Promise(resolve => { reached = resolve })
    const gate = new Promise(resolve => { release = resolve })
    const { updater, calls } = await fixture(t, { isBusy: () => busy })
    const save = updater.save.bind(updater)
    updater.save = async operation => { await save(operation); if (operation.status === 'installing') { reached(); await gate } }
    await updater.check(); await updater.begin('7', randomUUID(), updater.base().profileKey); await waiting
    if (action === 'dispose') updater.dispose(); else busy = true
    release(); await settle(updater)
    assert.equal(calls.length, 0)
  }
})

test('Release absence, API failure and no newer candidate are distinct; checks coalesce', async t => {
  const missing = await fixture(t, { fetcher: async () => new Response('', { status: 404 }) })
  assert.equal((await missing.updater.check()).status, 'no-release')
  const unavailable = await fixture(t, { fetcher: async () => new Response('', { status: 500 }) })
  assert.equal((await unavailable.updater.check()).status, 'blocked')
  assert.equal((await unavailable.updater.check()).reason, 'network')
  const current = await fixture(t)
  current.bundle.version = version
  current.updater.version = version
  assert.equal((await current.updater.check()).status, 'current')
  let calls = 0
  const shared = await fixture(t, { fetcher: async url => { calls++; return fetcher(url) } })
  const [a, b] = await Promise.all([shared.updater.check(), shared.updater.check()])
  assert.deepEqual(a, b)
  assert.equal(calls, 11) // metadata, manifest, four entries, five icons
})

test('unknown original operation blocks any newer candidate and two profiles keep separate journals', async t => {
  const h = await fixture(t)
  h.manager.installBundle = async () => { h.calls.push('started'); throw new Error('reply lost') }
  await h.updater.check()
  const id = randomUUID(); await h.updater.begin('7', id, h.updater.base().profileKey); await settle(h.updater)
  assert.equal((await h.updater.reconcile(id)).status, 'unknown')
  h.updater.candidate = { ...h.updater.candidate, id: '8', version: '0.4.0' }
  await assert.rejects(h.updater.begin('8', randomUUID(), h.updater.base().profileKey), /busy/)
  assert.equal(h.calls.length, 1)
  const other = await fixture(t)
  assert.equal((await other.updater.status()).status, 'idle')
  assert.notEqual(other.updater.base().profileKey, h.updater.base().profileKey)
  await other.updater.check(); await other.updater.begin('7', randomUUID(), other.updater.base().profileKey); await settle(other.updater)
  assert.equal(other.calls.length, 1)
})

test('nominal success with wrong actual installed version stays unknown and never resends', async t => {
  const h = await fixture(t)
  h.manager.installBundle = async (...args) => { h.calls.push(args); return { changed: true, application: 'restart-required', stage: 'install', target: PACKAGE, bundle: PACKAGE, version } }
  await h.updater.check(); const id = randomUUID(); await h.updater.begin('7', id, h.updater.base().profileKey); await settle(h.updater)
  assert.equal((await h.updater.reconcile(id)).status, 'unknown')
  assert.equal((await h.updater.reconcile(id)).installedVersion, '0.2.0')
  await assert.rejects(h.updater.begin('7', randomUUID(), h.updater.base().profileKey), /busy/)
  assert.equal(h.calls.length, 1)
  h.bundle.version = version
  assert.equal((await h.updater.reconcile(id)).status, 'restart-required')
  h.updater.version = version
  assert.equal((await h.updater.reconcile(id)).status, 'applied')
})

test('external newer version during installing receipt write prevents a downgrade', async t => {
  const h = await fixture(t)
  const save = h.updater.save.bind(h.updater)
  h.updater.save = async (operation, claim) => { await save(operation, claim); if (operation.status === 'installing') h.bundle.version = '0.4.0' }
  await h.updater.check(); const id = randomUUID(); await h.updater.begin('7', id, h.updater.base().profileKey); await settle(h.updater)
  assert.equal((await h.updater.reconcile(id)).reason, 'stale-candidate')
  assert.equal(h.calls.length, 0)
})

test('delayed request from another profile is refused before admission', async t => {
  const first = await fixture(t), second = await fixture(t)
  await first.updater.check(); await second.updater.check()
  await assert.rejects(second.updater.begin('7', randomUUID(), first.updater.base().profileKey), /invalid-request/)
  await assert.rejects(second.updater.begin('7', randomUUID()), /invalid-request/)
  assert.equal(second.calls.length, 0); assert.equal(await second.updater.lastOperation(), undefined)
})

test('a semver peer range accepts the running 0.2.1 prereleases and rejects the next major', async t => {
  const ranged = { ...pkg, peerDependencies: { '@deepseek-ai/dsh-app-boot': '>=0.2.1-alpha.2 <0.3.0-0' } }
  const accept = await fixture(t, { runtimeVersion: async () => '0.2.1-alpha.3', fetcher: async url => String(url).endsWith('/package.json') ? Response.json(ranged) : fetcher(url) })
  const checked = await accept.updater.check()
  assert.equal(checked.status, 'available')
  assert.equal(checked.candidate.compatibility, '0.2.1-alpha.3')
  const reject = await fixture(t, { runtimeVersion: async () => '0.3.0-alpha.1', fetcher: async url => String(url).endsWith('/package.json') ? Response.json(ranged) : fetcher(url) })
  assert.equal((await reject.updater.check()).reason, 'incompatible')
  assert.equal(reject.calls.length, 0)
})

test('already-installed removes then installs, including after this plugin is stopped', async t => {
  const h = await fixture(t)
  const seen = []
  h.manager.installBundle = async (...args) => {
    seen.push(['install', args[0], args[1]])
    if (seen.filter(row => row[0] === 'install').length === 1) return { application: 'failed', changed: false, error: { code: 'already-installed' }, stage: 'install', target: args[0], bundle: PACKAGE }
    h.bundle.version = version
    return { changed: true, application: 'applied', stage: 'install', target: PACKAGE, bundle: PACKAGE, version }
  }
  h.manager.removeBundle = async (name) => {
    seen.push(['remove', name])
    h.updater.dispose()
    return { application: 'applied', changed: true, stage: 'remove', target: name }
  }
  await h.updater.check()
  const id = randomUUID()
  await h.updater.begin('7', id, h.updater.base().profileKey)
  await settle(h.updater)
  assert.deepEqual(seen.map(row => row[0]), ['install', 'remove', 'install'])
  assert.equal(seen[0][1], `github:${REPOSITORY}#${tag}`)
  assert.deepEqual(seen[2][2], { enabled: false, requestId: id, saveExact: true })
  assert.equal((await h.updater.reconcile(id)).status, 'unknown')
  const restarted = new PluginUpdates({ manager: () => h.manager, profileDir: h.directory, version, runtimeVersion: async () => '0.2.1-alpha.3' })
  t.after(() => restarted.dispose())
  assert.equal((await restarted.reconcile(id)).status, 'applied')
})

test('stop-profile leaves the package installed and installs over it', async t => {
  const h = await fixture(t)
  let installs = 0
  h.manager.installBundle = async (...args) => {
    h.calls.push(args)
    installs += 1
    if (installs === 1) return { application: 'failed', changed: false, error: { code: 'already-installed' }, stage: 'install', target: args[0] }
    h.bundle.version = version
    return { changed: true, application: 'restart-required', stage: 'install', target: PACKAGE, bundle: PACKAGE, version }
  }
  h.manager.removeBundle = async () => ({ application: 'failed', changed: false, error: { code: 'stop-profile' }, stage: 'remove', target: PACKAGE })
  await h.updater.check()
  const id = randomUUID()
  await h.updater.begin('7', id, h.updater.base().profileKey)
  await settle(h.updater)
  assert.equal(h.calls.length, 2)
  assert.equal((await h.updater.reconcile(id)).status, 'restart-required')
})

test('a failed removal does not install another copy', async t => {
  const h = await fixture(t)
  h.manager.installBundle = async (...args) => {
    h.calls.push(args)
    return { application: 'failed', changed: false, error: { code: 'already-installed' }, stage: 'install', target: args[0] }
  }
  h.manager.removeBundle = async () => ({ application: 'failed', changed: false, error: { code: 'bundle-in-use' }, stage: 'remove', target: PACKAGE })
  await h.updater.check()
  const id = randomUUID()
  await h.updater.begin('7', id, h.updater.base().profileKey)
  await settle(h.updater)
  assert.equal(h.calls.length, 1)
  const settled = await h.updater.reconcile(id)
  assert.equal(settled.status, 'failed')
  assert.equal(settled.result.error.code, 'bundle-in-use')
})

test('already-installed without removeBundle stays failed and does not throw', async () => {
  const manager = { installBundle: async () => ({ application: 'failed', changed: false, error: { code: 'already-installed' } }) }
  const result = await installBundleUpdating(manager, `github:${REPOSITORY}#${tag}`, { enabled: true, saveExact: true })
  assert.equal(result.error.code, 'already-installed')
})

test('a failed install after remove restores the previous spec when the package is gone', async t => {
  const h = await fixture(t)
  const seen = []
  let installs = 0
  h.manager.installBundle = async (spec, options) => {
    installs += 1
    seen.push({ spec, options })
    if (installs === 1) return { application: 'failed', changed: false, error: { code: 'already-installed' }, stage: 'install', target: spec }
    if (installs === 2) {
      h.bundle.installed = false
      return { application: 'failed', changed: false, error: { code: 'operation-error' }, stage: 'install', target: spec, packageResult: { exitCode: 1, timedOut: false } }
    }
    const journal = JSON.parse(await readFile(join(h.directory, '.dsh-pwa-updates', `${id}.json`), 'utf8'))
    assert.equal(journal.status, 'failed')
    assert.equal(journal.result.error.code, 'operation-error')
    assert.equal(journal.reason, undefined)
    h.bundle.installed = true
    h.bundle.version = '0.2.0'
    h.bundle.source = spec
    return { application: 'applied', changed: true, stage: 'install', target: spec, bundle: PACKAGE, version: '0.2.0' }
  }
  h.manager.removeBundle = async name => {
    seen.push({ remove: name })
    h.bundle.installed = false
    return { application: 'applied', changed: true, stage: 'remove', target: name }
  }
  await h.updater.check()
  const id = randomUUID()
  await h.updater.begin('7', id, h.updater.base().profileKey)
  await settle(h.updater)
  assert.deepEqual(seen.map(row => row.remove ? 'remove' : 'install'), ['install', 'remove', 'install', 'install'])
  assert.equal(seen[3].spec, `github:${REPOSITORY}`)
  assert.equal(seen[3].options.enabled, false)
  assert.equal(seen[3].options.saveExact, true)
  assert.notEqual(seen[3].options.requestId, id)
  assert.equal(h.bundle.installed, true)
  const settled = await h.updater.reconcile(id)
  assert.equal(settled.status, 'failed')
  assert.equal(settled.reason, 'restored')
  assert.equal(settled.result.error.code, 'operation-error')
  assert.equal(settled.result.packageResult.exitCode, 1)
  const restarted = new PluginUpdates({ manager: () => h.manager, profileDir: h.directory, version: '0.2.0', runtimeVersion: async () => '0.2.1-alpha.3' })
  t.after(() => restarted.dispose())
  const again = await restarted.reconcile(id)
  assert.equal(again.status, 'failed')
  assert.equal(again.reason, 'restored')
})

test('a failed restore reports that the plugin may have been removed', async t => {
  const h = await fixture(t)
  let installs = 0
  h.manager.installBundle = async (spec, options) => {
    installs += 1
    h.calls.push([spec, options])
    if (installs === 1) return { application: 'failed', changed: false, error: { code: 'already-installed' }, stage: 'install', target: spec }
    if (installs === 2) {
      h.bundle.installed = false
      return { application: 'failed', changed: false, error: { code: 'operation-error' }, stage: 'install', target: spec }
    }
    return { application: 'failed', changed: false, error: { code: 'operation-error' }, stage: 'install', target: spec }
  }
  h.manager.removeBundle = async () => {
    h.bundle.installed = false
    return { application: 'applied', changed: true, stage: 'remove', target: PACKAGE }
  }
  await h.updater.check()
  const id = randomUUID()
  await h.updater.begin('7', id, h.updater.base().profileKey)
  await settle(h.updater)
  assert.equal(installs, 3)
  assert.equal(h.calls[2][0], `github:${REPOSITORY}`)
  assert.equal(h.calls[2][1].enabled, false)
  assert.notEqual(h.calls[2][1].requestId, id)
  assert.equal(h.bundle.installed, false)
  const settled = await h.updater.reconcile(id)
  assert.equal(settled.status, 'failed')
  assert.equal(settled.reason, 'plugin-missing')
  const restarted = new PluginUpdates({ manager: () => h.manager, profileDir: h.directory, version: '0.2.0', runtimeVersion: async () => '0.2.1-alpha.2' })
  t.after(() => restarted.dispose())
  assert.equal((await restarted.reconcile(id)).reason, 'plugin-missing')
})

test('a failed replacement that leaves the package installed does not restore it', async t => {
  const h = await fixture(t)
  let installs = 0
  h.manager.installBundle = async (spec) => {
    installs += 1
    h.calls.push(spec)
    if (installs === 1) return { application: 'failed', changed: false, error: { code: 'already-installed' }, stage: 'install', target: spec }
    return { application: 'failed', changed: false, error: { code: 'operation-error' }, stage: 'install', target: spec }
  }
  h.manager.removeBundle = async () => ({ application: 'applied', changed: true, stage: 'remove', target: PACKAGE })
  await h.updater.check()
  const id = randomUUID()
  await h.updater.begin('7', id, h.updater.base().profileKey)
  await settle(h.updater)
  assert.equal(installs, 2)
  assert.equal(h.bundle.installed, true)
  const settled = await h.updater.reconcile(id)
  assert.equal(settled.status, 'failed')
  assert.equal(settled.reason, undefined)
})

test('an install throw after removal restores only when the package is confirmed gone', async () => {
  const previous = { source: `github:${REPOSITORY}`, enabled: true }
  const options = { enabled: true, requestId: randomUUID(), saveExact: true }
  let installs = 0
  let installed = true
  const manager = {
    listBundles: async () => [{ name: PACKAGE, installed, version: '0.2.0', source: previous.source }],
    removeBundle: async () => { installed = false; return { application: 'applied', changed: true, stage: 'remove', target: PACKAGE } },
    installBundle: async (spec) => {
      installs += 1
      if (installs === 1) return { application: 'failed', changed: false, error: { code: 'already-installed' }, stage: 'install', target: spec }
      if (installs === 2) throw new Error('pnpm failed')
      installed = true
      return { application: 'applied', changed: true, stage: 'install', target: spec, bundle: PACKAGE, version: '0.2.0' }
    },
  }
  const restored = await installBundleUpdating(manager, `github:${REPOSITORY}#${tag}`, options, previous)
  assert.equal(restored.restore.application, 'applied')
  assert.equal(restored.error.code, 'operation-error')
  assert.equal(installs, 3)
  assert.equal(installed, true)

  installs = 0
  installed = true
  manager.installBundle = async (spec) => {
    installs += 1
    if (installs === 1) return { application: 'failed', changed: false, error: { code: 'already-installed' }, stage: 'install', target: spec }
    throw new Error('pnpm failed')
  }
  manager.removeBundle = async () => ({ application: 'applied', changed: true, stage: 'remove', target: PACKAGE })
  await assert.rejects(installBundleUpdating(manager, `github:${REPOSITORY}#${tag}`, options, previous), /pnpm failed/)
  assert.equal(installs, 2)
  assert.equal(installed, true)

  installs = 0
  installed = false
  manager.listBundles = async () => { throw new Error('unavailable') }
  manager.removeBundle = async () => ({ application: 'applied', changed: true, stage: 'remove', target: PACKAGE })
  manager.installBundle = async (spec) => {
    installs += 1
    if (installs === 1) return { application: 'failed', changed: false, error: { code: 'already-installed' }, stage: 'install', target: spec }
    throw new Error('pnpm failed')
  }
  await assert.rejects(installBundleUpdating(manager, `github:${REPOSITORY}#${tag}`, options, previous), /pnpm failed/)
  assert.equal(installs, 2)
})

test('restart-required with a failed package result restores when the package is gone', async t => {
  const h = await fixture(t)
  const seen = []
  let installs = 0
  h.manager.installBundle = async (spec, options) => {
    installs += 1
    seen.push({ spec, options })
    if (installs === 1) return { application: 'failed', changed: false, error: { code: 'already-installed' }, stage: 'install', target: spec }
    if (installs === 2) {
      h.bundle.installed = false
      return { changed: false, application: 'restart-required', stage: 'install', target: PACKAGE, bundle: PACKAGE, version, packageResult: { exitCode: 1, timedOut: false } }
    }
    const journal = JSON.parse(await readFile(join(h.directory, '.dsh-pwa-updates', `${id}.json`), 'utf8'))
    assert.equal(journal.status, 'failed')
    assert.equal(journal.result.application, 'restart-required')
    assert.equal(journal.result.packageResult.exitCode, 1)
    assert.equal(journal.reason, undefined)
    h.bundle.installed = true
    h.bundle.version = '0.2.0'
    h.bundle.source = spec
    return { application: 'applied', changed: true, stage: 'install', target: spec, bundle: PACKAGE, version: '0.2.0' }
  }
  h.manager.removeBundle = async name => {
    seen.push({ remove: name })
    h.bundle.installed = false
    return { application: 'applied', changed: true, stage: 'remove', target: name }
  }
  await h.updater.check()
  const id = randomUUID()
  await h.updater.begin('7', id, h.updater.base().profileKey)
  await settle(h.updater)
  assert.deepEqual(seen.map(row => row.remove ? 'remove' : 'install'), ['install', 'remove', 'install', 'install'])
  assert.equal(seen[3].spec, `github:${REPOSITORY}`)
  assert.equal(seen[3].options.enabled, false)
  assert.equal(seen[3].options.saveExact, true)
  assert.notEqual(seen[3].options.requestId, id)
  const settled = await h.updater.reconcile(id)
  assert.equal(settled.status, 'failed')
  assert.equal(settled.reason, 'restored')
  assert.equal(settled.result.application, 'restart-required')
  assert.equal(settled.result.packageResult.exitCode, 1)

  installs = 0
  h.bundle.installed = true
  const options = { enabled: false, requestId: randomUUID(), saveExact: true }
  const previous = { source: `github:${REPOSITORY}`, enabled: false }
  h.manager.installBundle = async (spec) => {
    installs += 1
    if (installs === 1) return { application: 'failed', changed: false, error: { code: 'already-installed' }, stage: 'install', target: spec }
    return { changed: true, application: 'restart-required', stage: 'install', target: PACKAGE, bundle: PACKAGE, version }
  }
  h.manager.removeBundle = async () => { h.bundle.installed = false; return { application: 'applied', changed: true, stage: 'remove', target: PACKAGE } }
  const clean = await installBundleUpdating(h.manager, `github:${REPOSITORY}#${tag}`, options, previous)
  assert.equal(clean.restore, undefined)
  assert.equal(installs, 2)
  assert.equal(h.bundle.installed, false)

  installs = 0
  h.bundle.installed = true
  h.manager.installBundle = async (spec) => {
    installs += 1
    if (installs === 1) return { application: 'failed', changed: false, error: { code: 'already-installed' }, stage: 'install', target: spec }
    return { changed: false, application: 'restart-required', stage: 'install', target: PACKAGE, bundle: PACKAGE, version, packageResult: { exitCode: 1, timedOut: false } }
  }
  h.manager.removeBundle = async () => ({ application: 'applied', changed: true, stage: 'remove', target: PACKAGE })
  const stayed = await installBundleUpdating(h.manager, `github:${REPOSITORY}#${tag}`, options, previous)
  assert.equal(stayed.restore, undefined)
  assert.equal(installs, 2)
  assert.equal(h.bundle.installed, true)
})

test('a removeBundle throw restores when the package is confirmed gone', async t => {
  const h = await fixture(t)
  const seen = []
  let installs = 0
  h.manager.installBundle = async (spec, options) => {
    installs += 1
    seen.push({ spec, options })
    if (installs === 1) return { application: 'failed', changed: false, error: { code: 'already-installed' }, stage: 'install', target: spec }
    const journal = JSON.parse(await readFile(join(h.directory, '.dsh-pwa-updates', `${id}.json`), 'utf8'))
    assert.equal(journal.status, 'failed')
    assert.equal(journal.result.error.code, 'operation-error')
    assert.equal(journal.result.stage, 'remove')
    assert.equal(journal.reason, undefined)
    h.bundle.installed = true
    h.bundle.version = '0.2.0'
    h.bundle.source = spec
    return { application: 'restart-required', changed: true, stage: 'install', target: spec, bundle: PACKAGE, version: '0.2.0' }
  }
  h.manager.removeBundle = async name => {
    seen.push({ remove: name })
    h.bundle.installed = false
    throw new Error('remove failed')
  }
  await h.updater.check()
  const id = randomUUID()
  await h.updater.begin('7', id, h.updater.base().profileKey)
  await settle(h.updater)
  assert.deepEqual(seen.map(row => row.remove ? 'remove' : 'install'), ['install', 'remove', 'install'])
  assert.equal(seen[2].spec, `github:${REPOSITORY}`)
  assert.equal(seen[2].options.enabled, false)
  assert.notEqual(seen[2].options.requestId, id)
  const settled = await h.updater.reconcile(id)
  assert.equal(settled.status, 'failed')
  assert.equal(settled.reason, 'restored')
  assert.equal(settled.result.error.code, 'operation-error')
  assert.equal(h.bundle.installed, true)

  const options = { enabled: true, requestId: randomUUID(), saveExact: true }
  const previous = { source: `github:${REPOSITORY}`, enabled: true }
  installs = 0
  h.bundle.installed = true
  h.manager.installBundle = async (spec) => {
    installs += 1
    if (installs === 1) return { application: 'failed', changed: false, error: { code: 'already-installed' }, stage: 'install', target: spec }
    throw new Error('restore should not run')
  }
  h.manager.removeBundle = async () => { throw new Error('remove failed') }
  await assert.rejects(installBundleUpdating(h.manager, `github:${REPOSITORY}#${tag}`, options, previous), /remove failed/)
  assert.equal(installs, 1)
  assert.equal(h.bundle.installed, true)

  installs = 0
  h.bundle.installed = false
  h.manager.listBundles = async () => { throw new Error('unavailable') }
  h.manager.removeBundle = async () => { throw new Error('remove failed') }
  await assert.rejects(installBundleUpdating(h.manager, `github:${REPOSITORY}#${tag}`, options, previous), /remove failed/)
  assert.equal(installs, 1)
})

test('manager cancellation and override retain their terminal outcome despite package exit', () => {
  for (const application of ['cancelled', 'overridden']) assert.equal(resultState({ application, packageResult: { exitCode: 130, timedOut: true } }, '0.3.0', '0.2.0'), application)
})

test('release notes keep en and ja sections; an unmarked body stays Japanese', () => {
  assert.deepEqual(releaseNotes('<!-- notes:en -->\nHello\n<!-- notes:ja -->\n日本語'), { en: 'Hello', ja: '日本語' })
  assert.deepEqual(releaseNotes('日本語だけ'), { ja: '日本語だけ' })
  assert.deepEqual(releaseNotes('  '), {})
})

test('installing 0.4.0 again after a finished update still allows a check', async t => {
  const { updater, bundle, directory, manager } = await fixture(t)
  const checked = await updater.check()
  const id = randomUUID()
  await updater.begin(checked.candidate.id, id, updater.base().profileKey)
  await settle(updater)
  bundle.version = version
  const restarted = new PluginUpdates({ manager: () => manager, profileDir: directory, version, runtimeVersion: async () => '0.2.1-alpha.2' })
  t.after(() => restarted.dispose())
  assert.equal((await restarted.reconcile(id)).status, 'applied')
  assert.equal(await restarted.lastOperation(), undefined)
  bundle.version = '0.2.0'
  const downgraded = new PluginUpdates({ manager: () => manager, profileDir: directory, version: '0.2.0', runtimeVersion: async () => '0.2.1-alpha.2', fetcher })
  t.after(() => downgraded.dispose())
  assert.equal((await downgraded.reconcile(id)).status, 'idle')
  const again = await downgraded.check()
  assert.equal(again.status, 'available')
  assert.equal(again.candidate.version, version)
  assert.deepEqual(again.candidate.notes, { ja: 'Changes' })
})
