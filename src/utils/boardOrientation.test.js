import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveBoardOrientation } from './boardOrientation.js'

test('las negras ven el tablero desde su propia perspectiva', () => {
  assert.equal(resolveBoardOrientation('b', false), true)
  assert.equal(resolveBoardOrientation('b', true), false)
  assert.equal(resolveBoardOrientation('w', false), false)
  assert.equal(resolveBoardOrientation('w', true), true)
})
