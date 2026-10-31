import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import semver from 'semver'
import { checkCompatibility, PACKAGE } from '../updates.js'
import { parseNpmViewVersion } from '../scripts/npm-view-version.mjs'

test('npm view version accepts scalar or singleton array and rejects ambiguous results', () => {
  assert.equal(parseNpmViewVersion('"0.2.1-rc.5"'), '0.2.1-rc.5')
  assert.equal(parseNpmViewVersion('["0.2.1-rc.5"]'), '0.2.1-rc.5')
  for (const value of ['[]', '["0.2.1-rc.4","0.2.1-rc.5"]', '"latest"', '{}', 'null']) {
    assert.throws(() => parseNpmViewVersion(value), /Invalid published DSH version/)
  }
  assert.throws(() => parseNpmViewVersion('not json'), SyntaxError)
})

const options = { includePrerelease: true }
const accepted = ['0.2.1-alpha.2', '0.2.1-alpha.3', '0.2.1-alpha.10', '0.2.1-beta.1', '0.2.1', '0.2.2-alpha.1', '0.2.9']
const rejected = ['0.2.0-rc.2', '0.2.0', '0.2.1-alpha.1', '0.3.0-0', '0.3.0-alpha.1', '0.3.0-rc.1', '0.3.0', '1.0.0']

test('the published DSH peer is a range covering 0.2.1-alpha.2 through later 0.2.x prereleases', async () => {
  const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
  const range = manifest.peerDependencies['@deepseek-ai/dsh-app-boot']
  assert.equal(semver.valid(range), null)
  assert.equal(range, '>=0.2.1-alpha.2 <0.3.0-0')
  const candidate = { version: manifest.version }
  assert.equal(manifest.name, PACKAGE)
  for (const runtime of accepted) {
    assert.equal(semver.satisfies(runtime, range, options), true, runtime)
    assert.equal(checkCompatibility(manifest, candidate, runtime), runtime)
  }
  for (const runtime of rejected) {
    assert.equal(semver.satisfies(runtime, range, options), false, runtime)
    assert.throws(() => checkCompatibility(manifest, candidate, runtime), /incompatible/)
  }
  // `<0.3.0` without the `-0` floor would include 0.3.0 prereleases under DSH's includePrerelease rule.
  assert.equal(semver.satisfies('0.3.0-alpha.1', '>=0.2.1-alpha.2 <0.3.0', options), true)
})
