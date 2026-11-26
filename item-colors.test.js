import { test } from 'node:test'
import assert from 'node:assert/strict'
import { contentPreview, itemColors } from './item-colors.js'
import { contrast, parseColor } from './contrast.js'

test('sticky notes: named fill, dark text, light text on black', () => {
  assert.deepEqual(itemColors({ type: 'sticky_note', style: { fillColor: 'light_yellow' } }), { label: 'Sticky note', text: '#1a1a1a', background: '#fff9b1' })
  assert.equal(itemColors({ type: 'sticky_note', style: { fillColor: 'black' } }).text, '#ffffff')
  assert.equal(itemColors({ type: 'sticky_note', style: { fillColor: 'unknown' } }).background, '#fff9b1')
})

test('shapes and text: own colours, transparent fill = board white, opacity kept', () => {
  assert.deepEqual(itemColors({ type: 'shape', style: { color: '#ffffff', fillColor: '#0040ff', fillOpacity: 1 } }), { label: 'Shape', text: '#ffffff', background: '#0040ff' })
  assert.equal(itemColors({ type: 'text', style: { color: '#999999', fillColor: 'transparent' } }).background, '#ffffff')
  assert.equal(itemColors({ type: 'shape', style: { color: '#000000', fillColor: '#000000', fillOpacity: 0.5 } }).background, 'rgba(0, 0, 0, 0.5)')
})

test('items without text colours are skipped', () => {
  assert.equal(itemColors({ type: 'image', style: {} }), null)
  assert.equal(itemColors({ type: 'connector' }), null)
  assert.equal(itemColors(null), null)
})

test('the pairs feed the contrast maths', () => {
  const c = itemColors({ type: 'shape', style: { color: '#ffffff', fillColor: '#0040ff' } })
  assert.equal(contrast(parseColor(c.text), parseColor(c.background)).label, '6.6:1')
  const half = itemColors({ type: 'shape', style: { color: '#ffffff', fillColor: '#000000', fillOpacity: 0.5 } })
  assert.equal(contrast(parseColor(half.text), parseColor(half.background)).label, '3.94:1')
})

test('contentPreview strips tags and truncates', () => {
  assert.equal(contentPreview('<p>Hello&nbsp;<b>world</b></p>'), 'Hello world')
  assert.equal(contentPreview('x'.repeat(50), 10), `${'x'.repeat(9)}…`)
  assert.equal(contentPreview(undefined), '')
})
