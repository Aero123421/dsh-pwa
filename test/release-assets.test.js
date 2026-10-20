import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtemp, readFile, writeFile, chmod } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { delimiter, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { releaseAssetPlan } from '../scripts/release-assets.mjs'

const script = new URL('../scripts/release-assets.mjs', import.meta.url)
const workflow = new URL('../.github/workflows/release.yml', import.meta.url)

test('a new Release is a draft and an existing asset name is left in place', () => {
  assert.deepEqual(releaseAssetPlan({ releaseExists: false, existingNames: [], uploadNames: ['dsh-pwa-0.4.2.tgz', 'SHA256SUMS'] }), { action: 'create' })
  assert.deepEqual(releaseAssetPlan({ releaseExists: true, existingNames: ['other.txt'], uploadNames: ['dsh-pwa-0.4.2.tgz', 'SHA256SUMS'] }), { action: 'upload' })
  assert.deepEqual(releaseAssetPlan({ releaseExists: true, existingNames: ['dsh-pwa-0.4.2.tgz'], uploadNames: ['dsh-pwa-0.4.2.tgz', 'SHA256SUMS'] }), { action: 'fail', clash: ['dsh-pwa-0.4.2.tgz'] })
  assert.deepEqual(releaseAssetPlan({ releaseExists: true, existingNames: ['SHA256SUMS'], uploadNames: ['dsh-pwa-0.4.2.tgz', 'SHA256SUMS'] }), { action: 'fail', clash: ['SHA256SUMS'] })
})

test('the release workflow does not publish, edit notes, or replace assets', async () => {
  const sources = await Promise.all([readFile(workflow, 'utf8'), readFile(script, 'utf8')])
  const combined = sources.join('\n')
  for (const forbidden of ['--clobber', '--latest', 'release edit', '--draft=false', '--notes ']) {
    assert.equal(combined.includes(forbidden), false, forbidden)
  }
  assert.match(sources[0], /node scripts\/release-assets\.mjs/)
  assert.match(sources[1], /--draft/)
  assert.doesNotMatch(sources[1], /release',\s*'edit'|release edit/)
})

async function fakeGh(dir, { viewStatus, viewJson = '{"assets":[]}' }) {
  const log = join(dir, 'gh.log')
  const bin = join(dir, 'gh')
  await writeFile(bin, `#!/usr/bin/env node
import { appendFileSync } from 'node:fs'
appendFileSync(process.env.GH_LOG, JSON.stringify(process.argv.slice(2)) + '\\n')
const sub = process.argv[3]
if (process.argv.includes('--clobber') || process.argv.includes('--latest') || sub === 'edit') process.exit(99)
if (process.argv[2] === 'release' && sub === 'view') {
  if (process.env.GH_VIEW_STATUS === '0') {
    process.stdout.write(process.env.GH_VIEW_JSON)
    process.exit(0)
  }
  process.stderr.write('release not found\\n')
  process.exit(1)
}
process.exit(0)
`)
  await chmod(bin, 0o755)
  return { log, bin, viewStatus, viewJson }
}

function runRelease(fake, files = ['dsh-pwa-0.4.2.tgz', 'SHA256SUMS']) {
  return spawnSync(process.execPath, [fileURLToPath(script), ...files], {
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: `${fake.bin.slice(0, fake.bin.lastIndexOf('/'))}${delimiter}${process.env.PATH}`,
      RELEASE_TAG: 'v0.4.2',
      GH_LOG: fake.log,
      GH_VIEW_STATUS: fake.viewStatus,
      GH_VIEW_JSON: fake.viewJson,
    },
  })
}

async function commands(fake) {
  const text = await readFile(fake.log, 'utf8')
  return text.trim() ? text.trim().split('\n').map(line => JSON.parse(line)) : []
}

test('creating a Release uses --draft and does not mark it latest', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'pwa-release-'))
  const fake = await fakeGh(dir, { viewStatus: '1' })
  const result = runRelease(fake)
  assert.equal(result.status, 0, result.stderr)
  const [view, create] = await commands(fake)
  assert.deepEqual(view, ['release', 'view', 'v0.4.2', '--json', 'assets'])
  assert.deepEqual(create, ['release', 'create', 'v0.4.2', '--draft', '--verify-tag', '--title', 'v0.4.2 — PWA & Mobile', '--notes-file', 'docs/release-0.4.2.md', 'dsh-pwa-0.4.2.tgz', 'SHA256SUMS'])
})

test('an existing Release, including a draft, only receives assets that are not already attached', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'pwa-release-'))
  const published = await fakeGh(dir, { viewStatus: '0', viewJson: '{"isDraft":false,"assets":[]}' })
  const added = runRelease(published)
  assert.equal(added.status, 0, added.stderr)
  const uploaded = await commands(published)
  assert.deepEqual(uploaded[1], ['release', 'upload', 'v0.4.2', 'dsh-pwa-0.4.2.tgz', 'SHA256SUMS'])
  assert.equal(uploaded.some(args => args.includes('edit') || args.includes('--draft') || args.includes('--latest') || args.includes('--clobber') || args.includes('--notes')), false)

  const clashDir = await mkdtemp(join(tmpdir(), 'pwa-release-'))
  const clash = await fakeGh(clashDir, { viewStatus: '0', viewJson: '{"isDraft":true,"assets":[{"name":"dsh-pwa-0.4.2.tgz"},{"name":"SHA256SUMS"}]}' })
  const blocked = runRelease(clash)
  assert.equal(blocked.status, 1)
  assert.match(blocked.stderr, /left unchanged: dsh-pwa-0.4.2.tgz, SHA256SUMS/)
  assert.deepEqual(await commands(clash), [['release', 'view', 'v0.4.2', '--json', 'assets']])
})
