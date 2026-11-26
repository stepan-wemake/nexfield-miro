/**
 * Panel of the Contrast Checker Miro app: shows WCAG contrast for the selected
 * board items and for any two colours typed in. Colour maths: ./contrast.js;
 * which colours an item has: ./item-colors.js.
 */
import { contrast, parseColor, toHex } from './contrast.js'
import { contentPreview, itemColors } from './item-colors.js'

const MAX_ITEMS = 20

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag)
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v
    else if (k === 'style') node.setAttribute('style', v)
    else node.setAttribute(k, v)
  }
  for (const c of [].concat(children)) node.append(c instanceof Node ? c : document.createTextNode(String(c)))
  return node
}

function badge(label, ok) {
  return el('span', { class: `badge ${ok ? 'pass' : 'fail'}` }, `${ok ? '✓' : '✕'} ${label}`)
}

/** One result card: a swatch showing the pair, the ratio and the WCAG levels. */
function resultCard(title, textColor, background) {
  const fg = parseColor(textColor)
  const bg = parseColor(background)
  if (!fg || !bg) return el('p', { class: 'error' }, 'Enter colours like #1a1a1a, rgb(26 26 26) or hsl(0 0% 10%).')
  const v = contrast(fg, bg)
  return el('div', { class: 'card' }, [
    el('div', { class: 'swatch', style: `color:${toHex(fg)};background:${background}` }, 'Aa'),
    el('div', { class: 'info' }, [
      title ? el('div', { class: 'title' }, title) : '',
      el('div', { class: 'ratio' }, v.label),
      el('div', { class: 'badges' }, [
        badge('AA text', v.aaNormal),
        badge('AA large', v.aaLarge),
        badge('AAA text', v.aaaNormal),
        badge('UI 3:1', v.uiComponents),
      ]),
    ]),
  ])
}

function renderSelection(items) {
  const box = document.getElementById('selection')
  box.replaceChildren()
  const checked = items.map((item) => ({ item, colors: itemColors(item) })).filter((x) => x.colors)
  if (checked.length === 0) {
    box.append(el('p', { class: 'empty' }, items.length ? 'The selection has no text colours to check.' : 'Nothing selected.'))
    return
  }
  for (const { item, colors } of checked.slice(0, MAX_ITEMS)) {
    const preview = contentPreview(item.content)
    box.append(resultCard(preview ? `${colors.label}: ${preview}` : colors.label, colors.text, colors.background))
  }
  if (checked.length > MAX_ITEMS) box.append(el('p', { class: 'empty' }, `Showing the first ${MAX_ITEMS} of ${checked.length}.`))
}

function wireManual() {
  const pairs = [['fg', 'fg-picker'], ['bg', 'bg-picker']]
  const update = () => {
    const out = document.getElementById('manual-result')
    out.replaceChildren(resultCard('', document.getElementById('fg').value.trim(), document.getElementById('bg').value.trim()))
  }
  for (const [textId, pickerId] of pairs) {
    const text = document.getElementById(textId)
    const picker = document.getElementById(pickerId)
    picker.addEventListener('input', () => { text.value = picker.value; update() })
    text.addEventListener('input', () => {
      const c = parseColor(text.value.trim())
      if (c) picker.value = toHex(c)
      update()
    })
  }
  document.getElementById('manual').addEventListener('submit', (e) => e.preventDefault())
  update()
}

async function init() {
  wireManual()
  if (!window.miro) {
    renderSelection([])
    return
  }
  renderSelection(await miro.board.getSelection())
  miro.board.ui.on('selection:update', (event) => renderSelection(event.items))
}

init()
