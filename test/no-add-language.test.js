import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const script = fileURLToPath(new URL('../scripts/check-no-add-language.mjs', import.meta.url))

function run(directory) {
  return spawnSync(process.execPath, [script, directory], { encoding: 'utf8' })
}

test('one addLanguage call in a published file fails the check', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'pwa-published-'))
  try {
    await writeFile(join(directory, 'client.js'), 'locale.addLanguage({ id: "ja", fallback: "en" })\n')
    const result = run(directory)
    assert.equal(result.status, 1, result.stderr)
    assert.match(result.stdout, /client\.js:\d+:.*addLanguage/)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('a clean published file passes, and a test file outside that directory is ignored', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'pwa-published-'))
  const tests = await mkdtemp(join(tmpdir(), 'pwa-tests-'))
  try {
    await writeFile(join(directory, 'client.js'), 'ctx.locale.register(NS, copy)\n')
    await mkdir(join(tests, 'test'), { recursive: true })
    await writeFile(join(tests, 'test', 'client.test.js'), 'source.includes("addLanguage")\n')
    const result = run(directory)
    assert.equal(result.status, 0, result.stderr)
    assert.match(result.stdout, /no addLanguage/)
  } finally {
    await rm(directory, { recursive: true, force: true })
    await rm(tests, { recursive: true, force: true })
  }
})

test('the packed plugin has no addLanguage', () => {
  const result = spawnSync(process.execPath, [script], { encoding: 'utf8', cwd: fileURLToPath(new URL('..', import.meta.url)) })
  assert.equal(result.status, 0, result.stderr || result.stdout)
})
