import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { runInNewContext } from 'node:vm'
import { webcrypto } from 'node:crypto'

export async function clientExports() {
  let exports
  runInNewContext(await readFile(new URL('../client.js', import.meta.url), 'utf8'), {
    window: { __ModuleLoader__: { load: entry => { exports = entry.factory(() => ({})) } } },
    crypto: webcrypto, setTimeout, clearTimeout,
  })
  return exports
}
function storage() { const values = new Map(); return { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) } }

test('Client owns ID before first request; lost reply and another Client discover one operation', async () => {
  const { UpdateController } = await clientExports()
  const saved = storage(), calls = []
  let accepted
  const connection = { rpc: { call: async (_path, method, payload) => {
    calls.push(method)
    if (method.endsWith('begin')) { assert.equal(payload.profileKey, 'profileA'); accepted = payload.requestId; assert.equal(saved.getItem('dsh-pwa:update:profileA'), accepted); throw new Error('disconnected') }
    return { ok: true, value: { profileKey: 'profileA', requestId: accepted, status: accepted ? 'restart-required' : 'idle' } }
  } } }
  const first = new UpdateController(connection, saved)
  first.profileKey = 'profileA'; first.publish({ status: 'available', candidate: { id: '7' } })
  await Promise.all([first.begin(), first.begin()])
  assert.equal(first.state.status, 'unknown'); first.dispose()
  const replacement = new UpdateController(connection, saved)
  await replacement.load()
  assert.equal(replacement.state.status, 'restart-required')
  assert.equal(replacement.requestId, accepted)
  const other = new UpdateController(connection, storage())
  await other.load(); assert.equal(other.requestId, accepted)
  assert.equal(calls.filter(method => method.endsWith('begin')).length, 1)
  replacement.dispose(); other.dispose()
})

test('authoritative busy refusal clears rejected UUID and later status discovers accepted request', async () => {
  const { UpdateController } = await clientExports()
  const saved = storage(), calls = []
  const controller = new UpdateController({ rpc: { call: async (_path, method) => {
    calls.push(method)
    return method.endsWith('begin') ? { ok: false, error: { code: 'dsh-pwa/busy' } } : { ok: true, value: { profileKey: 'p', requestId: 'accepted', status: 'restart-required' } }
  } } }, saved)
  controller.profileKey = 'p'; controller.publish({ status: 'available', candidate: { id: '7' } })
  await controller.begin(); assert.equal(saved.getItem('dsh-pwa:update:p'), undefined)
  await controller.load(); assert.equal(controller.requestId, 'accepted')
  assert.equal(calls.at(-1), 'dsh-pwa/update-status'); controller.dispose()
})

test('profile change does not read another profile\'s pending sessionStorage UUID', async () => {
  const { UpdateController } = await clientExports()
  const saved = storage(), calls = []
  saved.setItem('dsh-pwa:update:profileA', 'old-pending')
  const controller = new UpdateController({ rpc: { call: async (_path, method) => { calls.push(method); return { ok: true, value: { profileKey: 'profileB', status: 'idle' } } } } }, saved)
  await controller.load(); assert.equal(controller.state.status, 'idle')
  assert.equal(calls.length, 1); controller.dispose()
})

test('old responses after connection reset/disposal cannot mutate state or storage; locale keys match', async () => {
  const { UpdateController, copy } = await clientExports()
  let complete
  const check = new Promise(resolve => { complete = resolve })
  const controller = new UpdateController({ rpc: { call: async (_path, method) => method.endsWith('check') ? check : { ok: true, value: { profileKey: 'p', status: 'idle' } } } }, storage())
  const pending = controller.check(); await controller.load()
  complete({ ok: true, value: { status: 'available' } }); await pending
  assert.equal(controller.state.status, 'idle'); controller.dispose()
  assert.deepEqual(Object.keys(copy.en).sort(), Object.keys(copy.ja).sort())
})

test('Client contribution stays optional without settings, locale or connection', async () => {
  const { apply } = await clientExports()
  assert.equal(apply({}), undefined)
  assert.equal(apply({ slots: { inject() { throw new Error('unexpected contribution') } } }), undefined)
})
