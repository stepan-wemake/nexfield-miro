/**
 * Which two colours to compare for a Miro board item. Pure (no Miro SDK), so
 * it runs under `node --test`.
 *
 * - Sticky notes have a named fill (Web SDK reference, sticky note > style >
 *   fillColor) and no text-colour property: Miro draws dark text on every
 *   colour and light text on the black note.
 * - Shapes and text items carry `style.color` (text) and `style.fillColor`
 *   (+ `fillOpacity`); a transparent fill shows the board, taken as white.
 */

/** Hex values of the named sticky note colours, as the SDK reference lists them. */
export const STICKY_FILLS = {
  gray: '#f5f6f8',
  light_yellow: '#fff9b1',
  yellow: '#f5d128',
  orange: '#ff9d48',
  light_green: '#d5f692',
  green: '#c9df56',
  dark_green: '#93d275',
  cyan: '#67c6c0',
  light_pink: '#ffcee0',
  pink: '#ea94bb',
  violet: '#c6a2d2',
  red: '#f0939d',
  light_blue: '#a6ccf5',
  blue: '#6cd8fa',
  dark_blue: '#9ea9ff',
  black: '#000000',
}

export const BOARD_BACKGROUND = '#ffffff'
const DEFAULT_TEXT = '#1a1a1a'

const isHex = (v) => typeof v === 'string' && /^#[0-9a-f]{3,8}$/i.test(v)

/** `#rrggbb` + opacity 0..1 → `rgba(…)` string the contrast parser reads. */
function withOpacity(hex, opacity) {
  if (opacity === undefined || opacity === null || opacity >= 1) return hex
  const h = hex.replace('#', '')
  const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h.slice(0, 6)
  const n = (i) => parseInt(full.slice(i, i + 2), 16)
  return `rgba(${n(0)}, ${n(2)}, ${n(4)}, ${Math.max(0, opacity)})`
}

/**
 * @returns {{ label: string, text: string, background: string } | null}
 *   null for items without text colours (images, connectors, frames…).
 */
export function itemColors(item) {
  if (!item || !item.style) return null
  if (item.type === 'sticky_note') {
    const fill = STICKY_FILLS[item.style.fillColor] ?? (isHex(item.style.fillColor) ? item.style.fillColor : STICKY_FILLS.light_yellow)
    const text = item.style.fillColor === 'black' ? '#ffffff' : DEFAULT_TEXT
    return { label: 'Sticky note', text, background: fill }
  }
  if (item.type === 'shape' || item.type === 'text') {
    const text = isHex(item.style.color) ? item.style.color : DEFAULT_TEXT
    const fill = item.style.fillColor
    const background = isHex(fill) ? withOpacity(fill, item.style.fillOpacity) : BOARD_BACKGROUND
    return { label: item.type === 'shape' ? 'Shape' : 'Text', text, background }
  }
  return null
}

/** Short plain-text preview of an item's HTML content. */
export function contentPreview(content, max = 40) {
  const text = String(content ?? '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}
