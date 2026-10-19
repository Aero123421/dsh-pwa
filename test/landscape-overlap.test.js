import test from 'node:test'
import assert from 'node:assert/strict'
import { headerBackgroundOpaque, messageHeaderOverlap } from '../scripts/landscape-overlap.mjs'

// Measured on DSH 0.2.1-rc.2 with dsh-pwa 0.4.1 at 844×390, scrollTop 30.
const header = { top: 0, bottom: 37, left: 0, right: 844 }
const scroll = { top: 37, bottom: 390, left: 0, right: 844 }
const message = { top: 23, bottom: 141, left: 281, right: 758 }

test('a scrolled message clipped at the header edge does not count as overlap', () => {
  assert.equal(headerBackgroundOpaque('rgba(0, 0, 0, 0)'), false)
  assert.equal(messageHeaderOverlap({ header, scroll, message }), 0)
  assert.equal(headerBackgroundOpaque('rgb(21, 21, 23)'), true)
})

test('a message actually visible inside the header still overlaps an opaque bar', () => {
  const covering = { top: 0, bottom: 390, left: 0, right: 844 }
  const visible = { top: 10, bottom: 80, left: 281, right: 758 }
  assert.ok(messageHeaderOverlap({ header, scroll: covering, message: visible, headerOpaque: true }) > 0)
})
