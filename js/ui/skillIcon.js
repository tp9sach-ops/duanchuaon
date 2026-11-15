// Hình biểu tượng chiêu (Phiên 187, tách riêng Phiên 189 để heSkill.js và luyenChieu.js cùng dùng): SVG tự vẽ, không innerHTML.
const SVGNS = 'http://www.w3.org/2000/svg';
const el = (n, a, p) => { const e = document.createElementNS(SVGNS, n); for (const k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; };
export const GLYPH_D = {
  hoi: 'M27 12V42M12 27H42', an: 'M15 41V26a12 12 0 0 1 24 0V41l-6-4-6 4-6-4ZM22 26h.1M32 26h.1', khien: 'M27 10L41 16V28C41 37 34 42 27 45C20 42 13 37 13 28V16Z',
  toc: 'M12 14L25 27L12 40M26 14L39 27L26 40', khoa: 'M27 9V45M11 18L43 36M11 36L43 18', lao: 'M9 27H41M31 16L43 27L31 38M9 19H21M9 35H21',
  tia: 'M10 44L40 14M31 12H42V23M14 30L24 40', vung: 'M27 21a6 6 0 1 0 .1 0ZM27 12a15 15 0 1 0 .1 0Z', chem: 'M12 43Q14 18 43 12M20 43Q23 26 43 20M9 36Q11 25 25 21',
  chon: 'M12 19H42M12 35H42M19 12L12 19L19 26M35 28L42 35L35 42',
};
export function drawGlyphIcon(mau, glyph, tuyet, dim) {
  const svg = el('svg', { viewBox: '0 0 54 54', 'aria-hidden': 'true' });
  el('circle', { cx: 27, cy: 27, r: 26, fill: '#1c1309' }, svg);
  el('circle', { cx: 27, cy: 27, r: 24, fill: mau, opacity: dim ? 0.35 : tuyet ? 0.85 : 0.72 }, svg);
  el('circle', { cx: 27, cy: 27, r: 25, fill: 'none', stroke: mau, 'stroke-width': 2 }, svg);
  if (tuyet) el('circle', { cx: 27, cy: 27, r: 22.5, stroke: '#f1db9f', 'stroke-width': 1.6, fill: 'none' }, svg);
  const d = GLYPH_D[glyph] || GLYPH_D.chem;
  el('path', { d, fill: 'none', stroke: '#000', 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.6, transform: 'translate(27 27) scale(.88) translate(-27 -27)' }, svg);
  el('path', { d, fill: 'none', stroke: '#fff', 'stroke-width': 3.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: dim ? 0.6 : 1, transform: 'translate(27 27) scale(.88) translate(-27 -27)' }, svg);
  return svg;
}
