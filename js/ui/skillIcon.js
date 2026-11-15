// Hình biểu tượng chiêu (Phiên 187, tách riêng Phiên 189 để heSkill.js và luyenChieu.js cùng dùng): SVG tự vẽ, không innerHTML.
// Phiên 193: VẼ LẠI theo phong cách nút kỹ năng MOBA — viền kim loại hai lớp (chiêu Tuyệt Học viền vàng + ngọc đỉnh + cánh), nền hào quang tỏa tia theo màu Hệ,
// hình chiêu có quầng sáng + bóng đổ + nét sáng chuyển màu, lớp kính bóng phía trên. Chữ ký hàm giữ nguyên (mau, glyph, tuyet, dim).
const SVGNS = 'http://www.w3.org/2000/svg';
const el = (n, a, p) => { const e = document.createElementNS(SVGNS, n); for (const k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; };
export const GLYPH_D = {
  hoi: 'M27 12V42M12 27H42', an: 'M15 41V26a12 12 0 0 1 24 0V41l-6-4-6 4-6-4ZM22 26h.1M32 26h.1', khien: 'M27 10L41 16V28C41 37 34 42 27 45C20 42 13 37 13 28V16Z',
  toc: 'M12 14L25 27L12 40M26 14L39 27L26 40', khoa: 'M27 9V45M11 18L43 36M11 36L43 18', lao: 'M9 27H41M31 16L43 27L31 38M9 19H21M9 35H21',
  tia: 'M10 44L40 14M31 12H42V23M14 30L24 40', vung: 'M27 21a6 6 0 1 0 .1 0ZM27 12a15 15 0 1 0 .1 0Z', chem: 'M12 43Q14 18 43 12M20 43Q23 26 43 20M9 36Q11 25 25 21',
  chon: 'M12 19H42M12 35H42M19 12L12 19L19 26M35 28L42 35L35 42',
};
const hex = (m) => (/^#[0-9a-f]{6}$/i.test(String(m)) ? String(m) : '#d9b25f');
const mix = (c, t, a) => { const n = parseInt(c.slice(1), 16), f = (v) => Math.round(v + (t - v) * a); return '#' + [n >> 16 & 255, n >> 8 & 255, n & 255].map((v) => f(v).toString(16).padStart(2, '0')).join(''); };
const light = (c, a) => mix(c, 255, a), dark = (c, a) => mix(c, 0, a);
let uid = 0;
/** Trả <svg viewBox 0 0 54 54>. mau '#rrggbb' (màu Hệ); glyph: khoá trong GLYPH_D; tuyet: chiêu Tuyệt Học; dim: chưa mở (mờ). */
export function drawGlyphIcon(mau, glyph, tuyet, dim) {
  const m = hex(mau), id = 'gi' + (++uid), svg = el('svg', { viewBox: '0 0 54 54', 'aria-hidden': 'true' }), defs = el('defs', {}, svg);
  const stops = (g, list) => { for (const [o, c, a] of list) el('stop', { offset: o, 'stop-color': c, 'stop-opacity': a == null ? 1 : a }, g); return g; };
  stops(el('radialGradient', { id: id + 'b', cx: '.38', cy: '.3', r: '.85' }, defs), [[0, light(m, 0.5)], [0.5, m], [1, dark(m, 0.75)]]);
  stops(el('linearGradient', { id: id + 'r', x1: 0, y1: 0, x2: 1, y2: 1 }, defs), tuyet ? [[0, '#fff3c4'], [0.5, '#d9a62b'], [1, '#6e4a10']] : [[0, '#f1f4f8'], [0.5, '#8d98aa'], [1, '#2a2f3a']]);
  stops(el('linearGradient', { id: id + 'g', x1: 0, y1: 0, x2: 0, y2: 1 }, defs), [[0, '#ffffff'], [1, light(m, 0.7)]]);
  stops(el('linearGradient', { id: id + 's', x1: 0, y1: 0, x2: 0, y2: 1 }, defs), [[0, '#fff', 0.6], [1, '#fff', 0]]);
  const flt = el('filter', { id: id + 'f', x: '-40%', y: '-40%', width: '180%', height: '180%' }, defs); el('feGaussianBlur', { stdDeviation: 1.7 }, flt);
  const clip = el('clipPath', { id: id + 'c' }, defs); el('circle', { cx: 27, cy: 27, r: 23.2 }, clip);
  const root = el('g', { opacity: dim ? 0.5 : 1 }, svg);
  el('circle', { cx: 27, cy: 27, r: 26.6, fill: 'url(#' + id + 'r)' }, root);                 // viền kim loại ngoài
  el('circle', { cx: 27, cy: 27, r: 24.3, fill: '#0a0910' }, root);                           // rãnh đen
  el('circle', { cx: 27, cy: 27, r: 23.2, fill: 'url(#' + id + 'b)' }, root);                 // nền hào quang theo màu Hệ
  const body = el('g', { 'clip-path': 'url(#' + id + 'c)' }, root);
  for (let i = 0; i < 8; i++) { const a = (i * 45 + 12) * Math.PI / 180, b = a + 0.16; el('path', { d: `M27 27L${(27 + 34 * Math.cos(a)).toFixed(1)} ${(27 + 34 * Math.sin(a)).toFixed(1)}L${(27 + 34 * Math.cos(b)).toFixed(1)} ${(27 + 34 * Math.sin(b)).toFixed(1)}Z`, fill: '#fff', opacity: 0.1 }, body); }   // tia sáng
  el('path', { d: 'M3 36Q27 18 51 38', fill: 'none', stroke: light(m, 0.6), 'stroke-width': 1.2, opacity: 0.35 }, body);   // vệt năng lượng
  el('path', { d: 'M5 44Q27 30 49 46', fill: 'none', stroke: light(m, 0.4), 'stroke-width': 0.8, opacity: 0.25 }, body);
  el('ellipse', { cx: 27, cy: 49, rx: 22, ry: 9, fill: '#000', opacity: 0.28 }, body);                                // bóng đáy
  const d = GLYPH_D[glyph] || GLYPH_D.chem, tf = 'translate(27 27) scale(.88) translate(-27 -27)';
  el('path', { d, fill: 'none', stroke: light(m, 0.55), 'stroke-width': 9, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.85, filter: 'url(#' + id + 'f)', transform: tf }, body);   // quầng sáng
  el('path', { d, fill: 'none', stroke: '#000', 'stroke-width': 6.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.6, transform: 'translate(0.8 1.3) ' + tf }, body);                 // bóng đổ
  el('path', { d, fill: 'none', stroke: '#16101a', 'stroke-width': 5.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', transform: tf }, body);                                                   // viền tối
  el('path', { d, fill: 'none', stroke: 'url(#' + id + 'g)', 'stroke-width': 3.3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', transform: tf }, body);                                       // nét sáng
  el('ellipse', { cx: 27, cy: 13.5, rx: 17, ry: 9, fill: 'url(#' + id + 's)' }, body);                                // lớp kính bóng
  el('circle', { cx: 27, cy: 27, r: 23.2, fill: 'none', stroke: '#fff', 'stroke-width': 0.8, opacity: 0.3 }, root);   // viền sáng bên trong
  if (tuyet) {   // Tuyệt Học: ngọc đỉnh + hai cánh vàng
    el('path', { d: 'M27 -0.6L31.2 3.6L27 8.2L22.8 3.6Z', fill: '#ffe28a', stroke: '#6e4a10', 'stroke-width': 0.9 }, root);
    el('path', { d: 'M0.6 27L4.6 23.4V30.6Z', fill: '#f3c24a', stroke: '#6e4a10', 'stroke-width': 0.8 }, root); el('path', { d: 'M53.4 27L49.4 23.4V30.6Z', fill: '#f3c24a', stroke: '#6e4a10', 'stroke-width': 0.8 }, root);
    el('circle', { cx: 27, cy: 27, r: 22, fill: 'none', stroke: '#ffe9a8', 'stroke-width': 0.9, opacity: 0.8 }, root);
  }
  if (dim) el('circle', { cx: 27, cy: 27, r: 26, fill: '#000', opacity: 0.35 }, svg);
  return svg;
}
