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
const names = ['dsh-pwa-0.4.2.tgz', 'SHA256SUMS']
const listArgs = ['release', 'list', '--limit', '1000', '--json', 'tagName,isDraft']

function listed(count, entry) {
  const items = Array.from({ length: count }, (_, index) => ({ tagName: `v9.${index}.0`, isDraft: false }))
  if (entry) items[0] = entry
  return JSON.stringify(items)
}

test('a missing Release is created, a draft can gain assets, and a published Release stops', () => {
  assert.deepEqual(releaseAssetPlan({ isDraft: undefined, uploadNames: names }), { action: 'create' })
  assert.deepEqual(releaseAssetPlan({ isDraft: true, existingNames: [], uploadNames: names }), { action: 'upload' })
  assert.deepEqual(releaseAssetPlan({ isDraft: true, existingNames: ['dsh-pwa-0.4.2.tgz'], uploadNames: names }), { action: 'fail', reason: 'asset', clash: ['dsh-pwa-0.4.2.tgz'] })
  assert.deepEqual(releaseAssetPlan({ isDraft: true, existingNames: ['SHA256SUMS'], uploadNames: names }), { action: 'fail', reason: 'asset', clash: ['SHA256SUMS'] })
  assert.deepEqual(releaseAssetPlan({ isDraft: false, existingNames: [], uploadNames: names }), { action: 'fail', reason: 'published' })
})

test('the release workflow does not publish, edit notes, or replace assets', async () => {
  const sources = await Promise.all([readFile(workflow, 'utf8'), readFile(script, 'utf8')])
  const combined = sources.join('\n')
  for (const forbidden of ['--clobber', '--latest', 'release edit', '--draft=false', '--notes ', 'not found']) {
    assert.equal(combined.includes(forbidden), false, forbidden)
  }
  assert.match(sources[0], /node scripts\/release-assets\.mjs/)
  assert.match(sources[1], /--draft/)
  assert.match(sources[1], /release', 'list', '--limit', '1000', '--json', 'tagName,isDraft'/)
  assert.doesNotMatch(sources[1], /release',\s*'edit'|release edit/)
})

async function fakeGh(dir, { listJson, viewJson = '{"assets":[]}' }) {
  const log = join(dir, 'gh.log')
  const bin = join(dir, 'gh')
  await writeFile(bin, `#!/usr/bin/env node
import { appendFileSync } from 'node:fs'
appendFileSync(process.env.GH_LOG, JSON.stringify(process.argv.slice(2)) + '\\n')
const sub = process.argv[3]
if (process.argv.includes('--clobber') || process.argv.includes('--latest') || sub === 'edit') process.exit(99)
if (process.argv[2] === 'release' && sub === 'list') {
  process.stdout.write(process.env.GH_LIST_JSON)
  process.exit(0)
}
if (process.argv[2] === 'release' && sub === 'view') {
  process.stdout.write(process.env.GH_VIEW_JSON)
  process.exit(0)
}
process.exit(0)
`)
  await chmod(bin, 0o755)
  return { log, bin: bin.slice(0, bin.lastIndexOf('/')), listJson, viewJson }
}

function runRelease(fake, files = names) {
  return spawnSync(process.execPath, [fileURLToPath(script), ...files], {
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: `${fake.bin}${delimiter}${process.env.PATH}`,
      RELEASE_TAG: 'v0.4.2',
      GH_LOG: join(fake.bin, 'gh.log'),
      GH_LIST_JSON: fake.listJson,
      GH_VIEW_JSON: fake.viewJson,
    },
  })
}

async function commands(fake) {
  const text = await readFile(join(fake.bin, 'gh.log'), 'utf8')
  return text.trim() ? text.trim().split('\n').map(line => JSON.parse(line)) : []
}

test('creating a Release uses --draft and does not mark it latest', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'pwa-release-'))
  const fake = await fakeGh(dir, { listJson: '[{"tagName":"v0.4.1","isDraft":false}]' })
  const result = runRelease(fake)
  assert.equal(result.status, 0, result.stderr)
  const [list, create] = await commands(fake)
  assert.deepEqual(list, listArgs)
  assert.deepEqual(create, ['release', 'create', 'v0.4.2', '--draft', '--verify-tag', '--title', 'v0.4.2 — PWA & Mobile', '--notes-file', 'docs/release-0.4.2.md', ...names])
})

test('a draft Release only receives assets that are not already attached', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'pwa-release-'))
  const draft = await fakeGh(dir, { listJson: '[{"tagName":"v0.4.2","isDraft":true}]', viewJson: '{"assets":[]}' })
  const added = runRelease(draft)
  assert.equal(added.status, 0, added.stderr)
  const uploaded = await commands(draft)
  assert.deepEqual(uploaded[0], listArgs)
  assert.equal(uploaded.filter(args => args[1] === 'upload').length, 1)
  assert.deepEqual(uploaded[1], ['release', 'view', 'v0.4.2', '--json', 'assets'])
  assert.deepEqual(uploaded[2], ['release', 'upload', 'v0.4.2', ...names])
  assert.equal(uploaded.some(args => args.includes('edit') || args.includes('--latest') || args.includes('--clobber') || args.includes('--notes')), false)

  const clashDir = await mkdtemp(join(tmpdir(), 'pwa-release-'))
  const clash = await fakeGh(clashDir, {
    listJson: '[{"tagName":"v0.4.2","isDraft":true}]',
    viewJson: '{"assets":[{"name":"dsh-pwa-0.4.2.tgz"},{"name":"SHA256SUMS"}]}',
  })
  const blocked = runRelease(clash)
  assert.equal(blocked.status, 1)
  assert.match(blocked.stderr, /left unchanged: dsh-pwa-0.4.2.tgz, SHA256SUMS/)
  const clashCommands = await commands(clash)
  assert.deepEqual(clashCommands.map(args => args[1]), ['list', 'view'])
  assert.equal(clashCommands.filter(args => args[1] === 'upload' || args[1] === 'create').length, 0)

  const oneDir = await mkdtemp(join(tmpdir(), 'pwa-release-'))
  const one = await fakeGh(oneDir, {
    listJson: '[{"tagName":"v0.4.2","isDraft":true}]',
    viewJson: '{"assets":[{"name":"SHA256SUMS"}]}',
  })
  const oneBlocked = runRelease(one)
  assert.equal(oneBlocked.status, 1)
  assert.equal((await commands(one)).filter(args => args[1] === 'upload').length, 0)
})

test('a published Release is left unchanged, including its assets', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'pwa-release-'))
  const published = await fakeGh(dir, { listJson: '[{"tagName":"v0.4.2","isDraft":false}]' })
  const result = runRelease(published)
  assert.equal(result.status, 1)
  assert.match(result.stderr, /already published and was left unchanged/)
  assert.deepEqual(await commands(published), [listArgs])
})

test('the list asks for 1000 entries, and a full page without the tag does not create a Release', async () => {
  const full = await mkdtemp(join(tmpdir(), 'pwa-release-'))
  const capped = await fakeGh(full, { listJson: listed(1000) })
  const stopped = runRelease(capped)
  assert.equal(stopped.status, 1)
  assert.match(stopped.stderr, /release list returned 1000 entries and did not include v0\.4\.2; not creating a release/)
  assert.deepEqual(await commands(capped), [listArgs])

  const short = await mkdtemp(join(tmpdir(), 'pwa-release-'))
  const page = await fakeGh(short, { listJson: listed(999) })
  const created = runRelease(page)
  assert.equal(created.status, 0, created.stderr)
  const followed = await commands(page)
  assert.deepEqual(followed[0], listArgs)
  assert.equal(followed[1][1], 'create')
  assert.equal(followed.filter(args => args[1] === 'upload').length, 0)

  const draftDir = await mkdtemp(join(tmpdir(), 'pwa-release-'))
  const draft = await fakeGh(draftDir, { listJson: listed(1000, { tagName: 'v0.4.2', isDraft: true }), viewJson: '{"assets":[]}' })
  const added = runRelease(draft)
  assert.equal(added.status, 0, added.stderr)
  const draftCommands = await commands(draft)
  assert.deepEqual(draftCommands[2], ['release', 'upload', 'v0.4.2', ...names])
  assert.equal(draftCommands.filter(args => args[1] === 'upload').length, 1)

  const publishedDir = await mkdtemp(join(tmpdir(), 'pwa-release-'))
  const published = await fakeGh(publishedDir, { listJson: listed(1000, { tagName: 'v0.4.2', isDraft: false }) })
  const held = runRelease(published)
  assert.equal(held.status, 1)
  assert.match(held.stderr, /already published and was left unchanged/)
  assert.deepEqual(await commands(published), [listArgs])
})

test('a release list that is empty, not JSON, or not an array does not create or upload', async () => {
  for (const listJson of ['', '{', '{"tagName":"v0.4.2"}']) {
    const dir = await mkdtemp(join(tmpdir(), 'pwa-release-'))
    const fake = await fakeGh(dir, { listJson })
    const result = runRelease(fake)
    assert.equal(result.status, 1)
    assert.match(result.stderr, /release list was (empty|not valid JSON|not an array)/)
    assert.doesNotMatch(result.stderr, /SyntaxError/)
    const ran = await commands(fake)
    assert.deepEqual(ran, [listArgs])
    assert.equal(ran.filter(args => args[1] === 'upload' || args[1] === 'create').length, 0)
  }
})
