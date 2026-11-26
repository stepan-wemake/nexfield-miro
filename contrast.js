// Generated from nexfield-vscode/src/contrast.ts (tsc, ES2020 module). Edit the source there.
/**
 * Colour parsing and WCAG 2.x contrast maths. Pure: no VS Code API here, so
 * the tests run on plain Node.
 *
 * Contrast ratio = (L1 + 0.05) / (L2 + 0.05), where L is the relative
 * luminance of the lighter (L1) and darker (L2) colour, per WCAG 2.2 §1.4.3,
 * §1.4.6 and §1.4.11. Thresholds are inclusive (4.5:1 passes AA), as the
 * specification words them ("at least").
 */
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
/** `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa` → colour; anything else → null. */
export function parseHex(text) {
    const m = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(text.trim());
    if (!m)
        return null;
    let hex = m[1];
    if (hex.length <= 4)
        hex = [...hex].map((c) => c + c).join('');
    const n = (i) => parseInt(hex.slice(i, i + 2), 16);
    return { r: n(0), g: n(2), b: n(4), a: hex.length === 8 ? n(6) / 255 : 1 };
}
function parseChannel(token, max) {
    const t = token.trim();
    if (t.endsWith('%')) {
        const v = Number(t.slice(0, -1));
        return Number.isFinite(v) ? clamp((v / 100) * max, 0, max) : null;
    }
    const v = Number(t);
    return Number.isFinite(v) ? clamp(v, 0, max) : null;
}
function parseAlpha(token) {
    if (token === undefined)
        return 1;
    return parseChannel(token, 1);
}
/** Splits `rgb(1 2 3 / 50%)` and `rgb(1, 2, 3, .5)` into channel tokens. */
function splitArgs(inner) {
    const [main, slashAlpha] = inner.split('/');
    const parts = main.split(/[\s,]+/).filter(Boolean);
    if (slashAlpha !== undefined)
        parts.push(slashAlpha.trim());
    return parts;
}
/** `rgb()` / `rgba()` in legacy (commas) or modern (spaces, `/ alpha`) syntax. */
export function parseRgbFunction(text) {
    const m = /^rgba?\(\s*([^)]*)\)$/i.exec(text.trim());
    if (!m)
        return null;
    const parts = splitArgs(m[1]);
    if (parts.length !== 3 && parts.length !== 4)
        return null;
    const [r, g, b] = parts.slice(0, 3).map((p) => parseChannel(p, 255));
    const a = parseAlpha(parts[3]);
    if (r === null || g === null || b === null || a === null)
        return null;
    return { r: Math.round(r), g: Math.round(g), b: Math.round(b), a };
}
/** `hsl()` / `hsla()`; hue in degrees (unit optional), saturation and lightness in %. */
export function parseHslFunction(text) {
    const m = /^hsla?\(\s*([^)]*)\)$/i.exec(text.trim());
    if (!m)
        return null;
    const parts = splitArgs(m[1]);
    if (parts.length !== 3 && parts.length !== 4)
        return null;
    const h = Number(parts[0].replace(/deg$/i, ''));
    const s = parseChannel(parts[1].endsWith('%') ? parts[1] : `${parts[1]}%`, 1);
    const l = parseChannel(parts[2].endsWith('%') ? parts[2] : `${parts[2]}%`, 1);
    const a = parseAlpha(parts[3]);
    if (!Number.isFinite(h) || s === null || l === null || a === null)
        return null;
    const hue = ((h % 360) + 360) % 360;
    const k = (n) => (n + hue / 30) % 12;
    const f = (n) => l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
    return { r: Math.round(f(0) * 255), g: Math.round(f(8) * 255), b: Math.round(f(4) * 255), a };
}
/** Any supported colour notation → colour, else null. */
export function parseColor(text) {
    return parseHex(text) ?? parseRgbFunction(text) ?? parseHslFunction(text);
}
const COLOR_RE = /#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})\b|\b(?:rgba?|hsla?)\([^()]*\)/gi;
/** Every colour literal in a line of text, in order. */
export function findColors(line) {
    const out = [];
    for (const m of line.matchAll(COLOR_RE)) {
        const start = m.index ?? 0;
        // `#abc` inside a word or URL fragment (`page#top`) is not a colour.
        if (m[0].startsWith('#') && start > 0 && /[\w&]/.test(line[start - 1]))
            continue;
        const color = parseColor(m[0]);
        if (color)
            out.push({ text: m[0], start, end: start + m[0].length, color });
    }
    return out;
}
/** A translucent colour painted over an opaque background. */
export function flatten(color, background) {
    const a = color.a;
    return {
        r: Math.round(color.r * a + background.r * (1 - a)),
        g: Math.round(color.g * a + background.g * (1 - a)),
        b: Math.round(color.b * a + background.b * (1 - a)),
        a: 1,
    };
}
/** WCAG relative luminance of an opaque colour. */
export function luminance({ r, g, b }) {
    const ch = (v) => {
        const c = v / 255;
        return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
}
export function formatRatio(ratio) {
    return `${(Math.floor(ratio * 100) / 100).toFixed(2).replace(/\.?0+$/, '')}:1`;
}
/**
 * Contrast of a foreground on a background. A translucent background is
 * first laid over white, a translucent foreground over that background.
 */
export function contrast(foreground, background) {
    const white = { r: 255, g: 255, b: 255, a: 1 };
    const bg = background.a < 1 ? flatten(background, white) : background;
    const fg = foreground.a < 1 ? flatten(foreground, bg) : foreground;
    const l1 = luminance(fg);
    const l2 = luminance(bg);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    // Floor to two decimals before comparing, so 4.499 never passes as «4.5».
    const r = Math.floor(ratio * 100) / 100;
    return {
        ratio,
        label: formatRatio(ratio),
        aaNormal: r >= 4.5,
        aaLarge: r >= 3,
        aaaNormal: r >= 7,
        aaaLarge: r >= 4.5,
        uiComponents: r >= 3,
    };
}
/** `#rrggbb` (alpha dropped) for display. */
export function toHex({ r, g, b }) {
    return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}
