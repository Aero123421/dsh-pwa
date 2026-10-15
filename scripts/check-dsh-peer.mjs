/**
 * Compare this package's DSH peer with the published @deepseek-ai/dsh-app-boot alpha.
 * The temporary install uses that package's evaluatePluginCompatibility, the boot check that skips a bundle.
 * Network is required. This does not start DSH or publish this package.
 */
import { execFile } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'
import semver from 'semver'
import { promisify } from 'node:util'
import { checkCompatibility } from '../updates.js'

const exec = promisify(execFile)
const root = dirname(fileURLToPath(new URL('../package.json', import.meta.url)))
const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const peer = manifest.peerDependencies['@deepseek-ai/dsh-app-boot']
if (typeof peer !== 'string' || semver.valid(peer) !== null) {
  console.error('peerDependencies["@deepseek-ai/dsh-app-boot"] must be a semver range, not an exact version')
  process.exit(1)
}

const directory = await mkdtemp(join(tmpdir(), 'dsh-peer-'))
let failed = false
try {
  await writeFile(join(directory, 'package.json'), JSON.stringify({ name: 'dsh-peer-probe', private: true, version: '0.0.0' }))
  await exec('npm', ['install', '--ignore-scripts', '--no-fund', '--no-audit', '@deepseek-ai/dsh-app-boot@alpha'], { cwd: directory, timeout: 120000 })
  const boot = await import(pathToFileURL(createRequire(join(directory, 'package.json')).resolve('@deepseek-ai/dsh-app-boot')).href)
  const runtime = boot.getDshRuntimeVersion()
  const versions = [...new Set([runtime, '0.2.1-alpha.2', '0.2.1-alpha.3', '0.2.2-alpha.1', '0.2.1-alpha.1', '0.3.0-alpha.1', '0.3.0'])]
  const mismatches = []
  let runtimeSkipped = false
  for (const version of versions) {
    const issue = boot.evaluatePluginCompatibility(manifest, {}, version)
    const skipped = issue !== undefined && issue.exempted !== true
    if (version === runtime) runtimeSkipped = skipped
    let rejected = false
    try { checkCompatibility(manifest, { version: manifest.version }, version) }
    catch (error) {
      if (error.message !== 'incompatible') throw error
      rejected = true
    }
    if (skipped !== rejected) mismatches.push(`${version}: app-boot ${skipped ? 'skips' : 'loads'} the bundle, updater ${rejected ? 'rejects' : 'accepts'} it`)
  }
  if (runtimeSkipped) console.error(`@deepseek-ai/dsh-app-boot@${runtime} does not satisfy ${peer}. DSH would skip this plugin at boot.`)
  if (mismatches.length > 0) console.error(mismatches.join('\n'))
  failed = runtimeSkipped || mismatches.length > 0
  if (!failed) console.log(`peer ${peer} matches @deepseek-ai/dsh-app-boot@${runtime}`)
} finally {
  await rm(directory, { recursive: true, force: true })
}
if (failed) process.exit(1)
