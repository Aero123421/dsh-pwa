import { createHash, randomUUID } from 'node:crypto'
import { mkdir, writeFile, readFile, rename, lstat } from 'node:fs/promises'
import { join } from 'node:path'
import manifest from './package.json' with { type: 'json' }

export const REPOSITORY = 'Aero123421/dsh-pwa'
export const PACKAGE = 'dsh-pwa'
export const RELEASES = `https://github.com/${REPOSITORY}/releases`
const ROOT = `https://api.github.com/repos/${REPOSITORY}`
const UUID = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/

function reasonOf(error) {
  const allowed = ['manager-unavailable', 'read-only', 'source', 'metadata', 'channel', 'incompatible', 'compatibility-unknown', 'busy', 'redirect', 'size', 'stale-candidate', 'release-unavailable', 'storage', 'interrupted']
  return allowed.includes(error?.message) ? error.message : 'network'
}

export function semanticVersion(value) {
  if (typeof value !== 'string') throw new Error('metadata')
  const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/.exec(value)
  if (!match || match[4]?.split('.').some(part => /^\d+$/.test(part) && part.length > 1 && part.startsWith('0'))) throw new Error('metadata')
  return { numbers: match.slice(1, 4).map(BigInt), pre: match[4]?.split('.') }
}
export function compareVersions(left, right) {
  const a = semanticVersion(left), b = semanticVersion(right)
  for (let i = 0; i < 3; i++) if (a.numbers[i] !== b.numbers[i]) return a.numbers[i] > b.numbers[i] ? 1 : -1
  if (!a.pre || !b.pre) return a.pre ? -1 : b.pre ? 1 : 0
  for (let i = 0; i < Math.max(a.pre.length, b.pre.length); i++) {
    const x = a.pre[i], y = b.pre[i]
    if (x === y) continue
    if (x === undefined || y === undefined) return x === undefined ? -1 : 1
    const nx = /^\d+$/.test(x), ny = /^\d+$/.test(y)
    if (nx && ny) return BigInt(x) > BigInt(y) ? 1 : -1
    if (nx !== ny) return nx ? -1 : 1
    return x > y ? 1 : -1
  }
  return 0
}

function allowedUrl(value) {
  const url = new URL(value)
  if (url.protocol !== 'https:' || url.username || url.password || url.port || url.hash) throw new Error('redirect')
  if (url.hostname === 'api.github.com' && url.pathname.startsWith(`/repos/${REPOSITORY}/`)) return url
  if (url.hostname === 'raw.githubusercontent.com' && url.pathname.startsWith(`/${REPOSITORY}/`)) return url
  throw new Error('redirect')
}
export async function boundedFetch(url, limit, { fetcher = fetch, signal } = {}) {
  const timeout = AbortSignal.timeout(20000)
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout
  for (let redirects = 0; redirects <= 4; redirects++) {
    const response = await fetcher(allowedUrl(url), { redirect: 'manual', signal: combined, headers: { accept: 'application/vnd.github+json' } })
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const next = response.headers.get('location'); await response.body?.cancel()
      if (!next) throw new Error('redirect')
      url = new URL(next, url).href; continue
    }
    if (!response.ok) { await response.body?.cancel(); throw new Error(response.status === 404 ? 'release-unavailable' : 'network') }
    if (Number(response.headers.get('content-length')) > limit) { await response.body?.cancel(); throw new Error('size') }
    const chunks = []; let bytes = 0
    const reader = response.body?.getReader()
    if (!reader) throw new Error('network')
    try {
      for (;;) {
        combined.throwIfAborted()
        const { done, value } = await reader.read()
        if (done) return Buffer.concat(chunks, bytes)
        bytes += value.byteLength
        if (bytes > limit) throw new Error('size')
        chunks.push(Buffer.from(value))
      }
    } finally { await reader.cancel().catch(() => {}); reader.releaseLock() }
  }
  throw new Error('redirect')
}

export function sourceKind(source) {
  if (typeof source !== 'string') throw new Error('source')
  if (/^github:Aero123421\/dsh-pwa(?:#[A-Za-z0-9._+/-]+)?$/.test(source) || /^(?:git\+)?https:\/\/github\.com\/Aero123421\/dsh-pwa(?:\.git)?(?:#[A-Za-z0-9._+/-]+)?$/.test(source)) return 'github'
  // This release preserves source delivery. Local directories and archives stay manual.
  throw new Error('source')
}
function updateRequestId(value) {
  if (typeof value !== 'string' || !UUID.test(value)) throw new Error('invalid-request')
  return value
}
export function releaseCandidate(release, current) {
  if (!release || !Number.isSafeInteger(release.id) || release.id <= 0 || release.draft !== false || release.prerelease !== false || typeof release.tag_name !== 'string' || !release.tag_name.startsWith('v')) throw new Error('metadata')
  const version = release.tag_name.slice(1)
  if (semanticVersion(version).pre) throw new Error('channel')
  const expectedLink = `${RELEASES}/tag/${release.tag_name}`
  if (release.html_url !== expectedLink || typeof release.body !== 'string' || (release.assets !== undefined && !Array.isArray(release.assets))) throw new Error('metadata')
  const candidate = { id: String(release.id), version, tag: release.tag_name, url: expectedLink, notes: release.body.slice(0, 6000) }
  return compareVersions(version, current) > 0 ? candidate : null
}
/** Compare the exact optional DSH peer declared by source releases; unknown ranges stay manual. */
export function checkCompatibility(packageJson, candidate, runtime) {
  semanticVersion(runtime)
  if (!packageJson || packageJson.name !== PACKAGE || packageJson.version !== candidate.version || typeof packageJson.dsh?.bundle?.patch !== 'string') throw new Error('metadata')
  const peers = Object.entries(packageJson.peerDependencies ?? {}).filter(([name]) => name === '@deepseek-ai/dsh' || name.startsWith('@deepseek-ai/dsh-'))
  if (!peers.length || peers.some(([, range]) => typeof range !== 'string')) throw new Error('compatibility-unknown')
  // PWA update releases declare exact DSH peers. Other ranges require review.
  for (const [, range] of peers) {
    try { semanticVersion(range) } catch { throw new Error('compatibility-unknown') }
    if (range !== runtime) throw new Error('incompatible')
  }
  return runtime
}
function safeResult(result) {
  if (!result) return null
  return { changed: result.changed, application: result.application, stage: result.stage,
    target: PACKAGE, bundle: result.bundle, version: result.version, enabled: result.enabled,
    ...(result.error ? { error: { code: result.error.code } } : {}),
    ...(result.packageResult ? { packageResult: { exitCode: result.packageResult.exitCode, timedOut: result.packageResult.timedOut, kind: result.packageResult.kind } } : {}),
  }
}

export function resultState(result, expected, runtime, installed) {
  if (!result) return 'unknown'
  if (['cancelled', 'overridden'].includes(result.application)) return result.application
  if (result.error || result.application === 'failed' || (result.packageResult && (result.packageResult.exitCode !== 0 || result.packageResult.timedOut))) return 'failed'
  if (result.bundle !== PACKAGE || result.version !== expected || !installed?.installed || installed.version !== expected || installed.error || installed.readOnlyReason) return 'unknown'
  if (result.application === 'restart-required') return 'restart-required'
  return result.application === 'applied' && runtime === expected ? 'applied' : 'unknown'
}

/** Optional manager is resolved for every operation; static PWA routes never depend on it. */
export class PluginUpdates {
  constructor({ manager, profileDir, runtimeVersion, isBusy = () => false, fetcher = fetch, version = manifest.version }) {
    Object.assign(this, { manager, profileDir, runtimeVersion, isBusy, fetcher, version })
    this.candidate = null; this.checking = null; this.running = null; this.closed = false; this.abort = new AbortController()
  }
  get cacheDir() { return this.profileDir && join(this.profileDir, '.dsh-pwa-updates') }
  async capability() {
    const manager = this.manager()
    if (!manager || typeof manager.listBundles !== 'function' || typeof manager.installBundle !== 'function' || typeof manager.waitForInstall !== 'function' || !this.profileDir) throw new Error('manager-unavailable')
    const bundle = (await manager.listBundles()).find(item => item.name === PACKAGE)
    if (!bundle?.installed || bundle.readOnlyReason || bundle.error) throw new Error('read-only')
    semanticVersion(bundle.version)
    const source = sourceKind(bundle.source)
    let dshVersion
    try { dshVersion = await this.runtimeVersion(); semanticVersion(dshVersion) } catch { throw new Error('compatibility-unknown') }
    return { manager, bundle, source, dshVersion }
  }
  base() { return { runtimeVersion: this.version, releases: RELEASES, profileKey: this.profileDir ? createHash('sha256').update(this.profileDir).digest('hex').slice(0, 24) : null } }
  async lastOperation() {
    try {
      const value = JSON.parse(await readFile(join(this.cacheDir, 'latest.json'), 'utf8'))
      return typeof value.requestId === 'string' && UUID.test(value.requestId) ? value.requestId : undefined
    } catch { return undefined }
  }
  async status() { try {
    const { dshVersion, bundle } = await this.capability()
    const requestId = this.running?.requestId ?? await this.lastOperation()
    return requestId ? { ...(await this.reconcile(requestId)), dshVersion } : { ...this.base(), dshVersion, installedVersion: bundle.version, status: bundle.version === this.version ? 'idle' : 'restart-required' }
  } catch (error) { return { ...this.base(), status: 'blocked', reason: reasonOf(error) } } }
  async privateDir() {
    await mkdir(this.cacheDir, { recursive: true, mode: 0o700 })
    if (!(await lstat(this.cacheDir)).isDirectory() || (await lstat(this.cacheDir)).isSymbolicLink()) throw new Error('storage')
    return this.cacheDir
  }
  async getCandidate(current) {
    const options = { fetcher: this.fetcher, signal: this.abort.signal }
    const release = JSON.parse((await boundedFetch(`${ROOT}/releases/latest`, 256 * 1024, options)).toString())
    const candidate = releaseCandidate(release, current)
    if (!candidate) return null
    const packageJson = JSON.parse((await boundedFetch(`https://raw.githubusercontent.com/${REPOSITORY}/${candidate.tag}/package.json`, 64 * 1024, options)).toString())
    candidate.compatibility = checkCompatibility(packageJson, candidate, await this.runtimeVersion())
    const files = ['index.js', 'updates.js', 'client.js', 'cordis.patch.yml']
    if (packageJson.main !== './index.js' || packageJson.exports?.['./client'] !== './client.js' || !Array.isArray(packageJson.files) || files.some(file => !packageJson.files.includes(file)) || !packageJson.files.includes('assets/*.png')) throw new Error('metadata')
    for (const file of files) {
      const bytes = await boundedFetch(`https://raw.githubusercontent.com/${REPOSITORY}/${candidate.tag}/${file}`, 256 * 1024, options)
      if (!bytes.length || (file === 'cordis.patch.yml' && (!bytes.toString().includes('id: dsh-pwa') || !bytes.toString().includes('name: dsh-pwa')))) throw new Error('metadata')
    }
    for (const [file, size] of [['apple-touch-icon.png', 180], ['icon-192.png', 192], ['icon-512.png', 512]]) {
      const png = await boundedFetch(`https://raw.githubusercontent.com/${REPOSITORY}/${candidate.tag}/assets/${file}`, 512 * 1024, options)
      if (png.length < 24 || png.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' || png.readUInt32BE(16) !== size || png.readUInt32BE(20) !== size) throw new Error('metadata')
    }
    return candidate
  }
  check() {
    if (this.checking) return this.checking
    this.checking = (async () => {
      try {
        if (this.closed || this.running) throw new Error('busy')
        const { bundle } = await this.capability()
        const last = await this.lastOperation()
        if (last && ['installing', 'unknown', 'restart-required'].includes((await this.reconcile(last)).status)) throw new Error('busy')
        this.candidate = await this.getCandidate(bundle.version ?? this.version)
        return { ...this.base(), installedVersion: bundle.version, status: this.candidate ? 'available' : bundle.version === this.version ? 'current' : 'restart-required', candidate: this.candidate && this.publicCandidate(this.candidate), checkedAt: new Date().toISOString() }
      } catch (error) { this.candidate = null; return { ...this.base(), status: error.message === 'release-unavailable' ? 'no-release' : 'blocked', reason: reasonOf(error) } }
    })().finally(() => { this.checking = null })
    return this.checking
  }
  publicCandidate(candidate) { const { id, version, url, notes, compatibility } = candidate; return { id, version, url, notes, compatibility } }
  async begin(id, operationId, profileKey) {
    if (!profileKey || profileKey !== this.base().profileKey) throw new Error('invalid-request')
    if (typeof operationId !== 'string') throw new Error('invalid-request')
    const requestId = updateRequestId(operationId)
    await this.capability()
    if (this.running?.requestId === requestId) return this.running
    try { await readFile(join(this.cacheDir, `${requestId}.json`)); return this.reconcile(requestId) } catch (error) { if (error.code !== 'ENOENT') throw error }
    const last = await this.lastOperation()
    if (last && ['installing', 'unknown', 'restart-required'].includes((await this.reconcile(last)).status)) throw new Error('busy')
    if (this.closed || this.running || this.checking || this.isBusy()) throw new Error('busy')
    if (typeof id !== 'string' || !this.candidate || id !== this.candidate.id) throw new Error('stale-candidate')
    const candidate = this.candidate
    this.running = { requestId, version: candidate.version, status: 'preparing' }
    try {
      await this.privateDir()
      await this.save(this.running, true)
    } catch (error) { this.running = null; throw error }
    // Do not await install in an RPC owned by the plugin being replaced.
    void this.execute(candidate, this.running).finally(() => { this.running = null })
    return this.running
  }
  async save(operation, claim = false) {
    const directory = await this.privateDir(), file = join(directory, `${operation.requestId}.json`)
    const temp = join(directory, `${operation.requestId}.${randomUUID()}.tmp`)
    await writeFile(temp, JSON.stringify(operation), { flag: 'wx', mode: 0o600 }); await rename(temp, file)
    if (claim) {
      const index = join(directory, `${randomUUID()}.tmp`)
      await writeFile(index, JSON.stringify({ requestId: operation.requestId }), { flag: 'wx', mode: 0o600 }); await rename(index, join(directory, 'latest.json'))
    }
  }
  async execute(candidate, operation) {
    let managerInvoked = false
    try {
      const before = await this.capability()
      const fresh = await this.getCandidate(before.bundle.version ?? this.version)
      if (!fresh || fresh.id !== candidate.id || fresh.version !== candidate.version || fresh.tag !== candidate.tag) throw new Error('stale-candidate')
      const latest = await this.capability()
      if (latest.bundle.source !== before.bundle.source || latest.bundle.enabled !== before.bundle.enabled || this.isBusy() || this.closed) throw new Error('busy')
      const spec = `github:${REPOSITORY}#${candidate.tag}`
      operation.status = 'installing'; await this.save(operation)
      if (this.closed || this.isBusy()) throw new Error('busy')
      const final = await this.capability()
      if (this.closed || this.isBusy() || final.bundle.source !== before.bundle.source) throw new Error('busy')
      if (compareVersions(candidate.version, final.bundle.version) <= 0) throw new Error('stale-candidate')
      managerInvoked = true
      const result = await final.manager.installBundle(spec, { enabled: final.bundle.enabled, requestId: operation.requestId, saveExact: true })
      operation.result = safeResult(result)
      const installed = (await final.manager.listBundles()).find(bundle => bundle.name === PACKAGE)
      operation.status = resultState(result, operation.version, this.version, installed)
    } catch (error) { operation.status = managerInvoked ? 'unknown' : 'failed'; operation.reason = reasonOf(error) }
    try { await this.save(operation) } catch { /* Manager retains its running operation; reconcile still checks it. */ }
  }
  async reconcile(requestId) {
    if (typeof requestId !== 'string' || !UUID.test(requestId)) throw new Error('invalid-request')
    let operation
    try { operation = JSON.parse(await readFile(join(this.cacheDir, `${requestId}.json`), 'utf8')) } catch { return { ...this.base(), status: 'unknown', requestId } }
    if (!operation || operation.requestId !== requestId || typeof operation.version !== 'string' || !['preparing', 'installing', 'unknown', 'restart-required', 'applied', 'failed', 'cancelled', 'overridden'].includes(operation.status)) return { ...this.base(), status: 'unknown', requestId }
    semanticVersion(operation.version)
    if (this.running?.requestId === requestId) return { ...this.base(), ...this.running }
    if (operation.status === 'preparing') { operation.status = 'failed'; operation.reason = 'interrupted'; await this.save(operation) }
    if (['installing', 'unknown'].includes(operation.status) && !operation.result) {
      const manager = this.manager()
      const result = manager && await manager.waitForInstall(requestId)
      if (result) operation.result = safeResult(result)
      else operation.status = 'unknown'
    }
    const bundle = (await this.manager()?.listBundles())?.find(item => item.name === PACKAGE)
    const installed = bundle?.version
    if (operation.result) operation.status = resultState(operation.result, operation.version, this.version, bundle)
    if (['installing', 'restart-required', 'unknown', 'applied'].includes(operation.status) && this.version === operation.version) {
      operation.status = bundle?.installed && !bundle.error && !bundle.readOnlyReason && installed === operation.version ? 'applied' : 'unknown'
    }
    await this.save(operation)
    return { ...this.base(), ...operation, installedVersion: installed }
  }
  dispose() { this.closed = true; this.abort.abort() }
}
