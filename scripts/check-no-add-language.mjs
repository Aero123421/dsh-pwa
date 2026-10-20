// Fail when the published package contains addLanguage.
// The search target is the packed plugin (client.js and the other published files).
// Test files are not in that package and are not searched.
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const needle = 'addLanguage'

function search(directory) {
  const result = spawnSync('rg', ['-n', needle, directory], { encoding: 'utf8' })
  if (result.error) {
    console.error(result.error.message)
    return 2
  }
  if (result.status === 0) {
    process.stdout.write(result.stdout)
    console.error('The published package contains addLanguage. This plugin registers dictionaries and does not define a language.')
    return 1
  }
  if (result.status !== 1) {
    process.stderr.write(result.stderr ?? '')
    console.error('Could not search the published package.')
    return result.status ?? 2
  }
  console.log('Published package has no addLanguage.')
  return 0
}

const given = process.argv[2]
if (given) process.exit(search(given))

const directory = mkdtempSync(join(tmpdir(), 'dsh-pwa-published-'))
try {
  const packed = spawnSync('npm', ['pack', '--ignore-scripts', '--pack-destination', directory], { cwd: root, encoding: 'utf8' })
  if (packed.status !== 0) {
    process.stderr.write(packed.stderr ?? '')
    process.exit(packed.status ?? 1)
  }
  const archive = readdirSync(directory).find(name => name.endsWith('.tgz'))
  if (!archive) {
    console.error('npm pack did not write a tarball.')
    process.exit(1)
  }
  const extracted = join(directory, 'package')
  const tar = spawnSync('tar', ['-xzf', join(directory, archive), '-C', directory], { encoding: 'utf8' })
  if (tar.status !== 0) {
    process.stderr.write(tar.stderr ?? '')
    process.exit(tar.status ?? 1)
  }
  process.exit(search(extracted))
} finally {
  rmSync(directory, { recursive: true, force: true })
}
