// Hình vẽ vật phẩm cho ô Túi đồ (Phiên 92). Mỗi hình là một SVG 48×48 dựng bằng createElementNS (không innerHTML, không tải ảnh). Loại hình: BAG_ICON_KINDS ở js/world/dock.js.
// icon({ k, c }) → phần tử <svg>; c là màu chủ đạo (#rrggbb), thiếu thì dùng màu mặc định của loại. Loại lạ → ô dấu hỏi.
const NS = 'http://www.w3.org/2000/svg';
const mk = (tag, a = {}, kids = []) => { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, a[k]); for (const c of kids) e.appendChild(c); return e; };
const rect = (x, y, w, h, fill, r = 0, extra = {}) => mk('rect', { x, y, width: w, height: h, rx: r, fill, ...extra });
const circ = (cx, cy, r, fill, extra = {}) => mk('circle', { cx, cy, r, fill, ...extra });
const ell = (cx, cy, rx, ry, fill, extra = {}) => mk('ellipse', { cx, cy, rx, ry, fill, ...extra });
const path = (d, fill, extra = {}) => mk('path', { d, fill, ...extra });
const line = (x1, y1, x2, y2, stroke, w = 2) => mk('line', { x1, y1, x2, y2, stroke, 'stroke-width': w, 'stroke-linecap': 'round' });

/** Làm đậm (amt<0) hoặc nhạt (amt>0) một màu #rrggbb. */
export function shade(hex, amt) {
  const m = /^#([0-9a-f]{6})$/i.exec(String(hex)); if (!m) return '#888888';
  const n = parseInt(m[1], 16), f = (v) => Math.max(0, Math.min(255, Math.round(amt >= 0 ? v + (255 - v) * amt : v * (1 + amt))));
  return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => f(v).toString(16).padStart(2, '0')).join('');
}

const DRAW = {
  sen: () => [0, 1, 2, 3, 4].map((i) => ell(24, 18, 5, 10, i % 2 ? '#f7b8cf' : '#f4a0bf', { transform: `rotate(${(i - 2) * 26} 24 34)` })).concat([ell(24, 34, 10, 5, '#e9d36a'), circ(24, 34, 3, '#c9a93a')]),
  la: () => [path('M24 43 C6 31 6 13 24 6 C42 13 42 31 24 43Z', '#5cb85c', { stroke: '#2f7a37', 'stroke-width': 1.5 }), line(24, 40, 24, 14, '#2f7a37', 1.5), line(24, 28, 15, 21, '#2f7a37', 1.2), line(24, 28, 33, 21, '#2f7a37', 1.2)],
  orb: (c) => [circ(24, 25, 17, c, { stroke: shade(c, -0.4), 'stroke-width': 2 }), circ(24, 25, 12, shade(c, 0.18)), ell(19, 18, 5, 3, '#ffffff', { opacity: 0.55, transform: 'rotate(-30 19 18)' }), rect(20, 5, 8, 5, '#6b4a2a', 2)],
  fish: (c) => [path('M36 24 L45 15 L45 33Z', shade(c, -0.15)), ell(22, 24, 15, 10, c), path('M16 15 Q22 8 29 15Z', shade(c, -0.2)), ell(21, 28, 10, 4, shade(c, 0.45), { opacity: 0.7 }), circ(12, 22, 2.4, '#ffffff'), circ(11.5, 22, 1.2, '#222')],
  turtle: (c) => [ell(24, 28, 15, 9, shade(c, -0.1)), path('M10 28 Q24 4 38 28Z', c, { stroke: shade(c, -0.35), 'stroke-width': 1.5 }), line(24, 12, 24, 28, shade(c, -0.35), 1.2), line(17, 17, 15, 28, shade(c, -0.35), 1.2), line(31, 17, 33, 28, shade(c, -0.35), 1.2), circ(40, 27, 4.5, '#8fb36a'), circ(41.5, 26, 1, '#222'), ell(14, 38, 4, 3, '#8fb36a'), ell(32, 38, 4, 3, '#8fb36a')],
  squid: (c) => [path('M24 4 Q38 14 34 28 L14 28 Q10 14 24 4Z', c), ell(24, 30, 10, 3, shade(c, -0.2)), ...[14, 19, 24, 29, 34].map((x, i) => path(`M${x} 30 Q${x + (i % 2 ? 3 : -3)} 38 ${x} 44`, 'none', { stroke: shade(c, -0.1), 'stroke-width': 2.5, 'stroke-linecap': 'round' })), circ(19, 21, 2.2, '#fff'), circ(29, 21, 2.2, '#fff'), circ(19, 21, 1, '#222'), circ(29, 21, 1, '#222')],
  power: () => [rect(5, 20, 7, 12, '#4a4f58', 2), rect(12, 17, 6, 18, '#6a707c', 2), rect(18, 23, 12, 6, '#b9bec8', 2), rect(30, 17, 6, 18, '#6a707c', 2), rect(36, 20, 7, 12, '#4a4f58', 2)],
  bell: (c) => [path('M24 6 C15 6 12 16 11 27 L8 35 L40 35 L37 27 C36 16 33 6 24 6Z', c, { stroke: shade(c, -0.5), 'stroke-width': 1.6 }), path('M15 14 L21 8 L19 20 Z', shade(c, 0.35), { opacity: 0.55 }), line(8, 35, 40, 35, shade(c, -0.5), 2.4), circ(24, 39, 3, shade(c, -0.3)), line(24, 4, 24, 7, shade(c, -0.5), 2)],
  wing: () => [path('M8 36 C10 16 26 8 42 8 C38 26 28 36 8 36Z', '#e9eef5', { stroke: '#9fb2c9', 'stroke-width': 1.5 }), line(10, 35, 36, 12, '#9fb2c9', 1.5), line(18, 33, 27, 22, '#9fb2c9', 1.2), line(14, 34, 22, 25, '#9fb2c9', 1.2)],
  house: () => [path('M5 24 L24 8 L43 24Z', '#b5523b', { stroke: '#7a3322', 'stroke-width': 1.5 }), rect(10, 24, 28, 17, '#e9dcc0'), rect(20, 29, 8, 12, '#7a5230', 1), rect(12, 27, 5, 5, '#8fc6ea'), rect(31, 27, 5, 5, '#8fc6ea')],
  board: (c) => [rect(5, 20, 38, 8, c, 4, { stroke: shade(c, -0.4), 'stroke-width': 1.5 }), rect(14, 20, 5, 8, '#1f64d0'), rect(29, 20, 5, 8, '#1f64d0'), circ(13, 35, 4, '#2a2a2a'), circ(35, 35, 4, '#2a2a2a'), circ(13, 35, 1.5, '#bbb'), circ(35, 35, 1.5, '#bbb'), rect(11, 28, 3, 3, '#555'), rect(34, 28, 3, 3, '#555')],
  bed: (c) => [rect(6, 12, 5, 28, shade(c, -0.35), 1), rect(8, 24, 34, 11, c, 2), rect(10, 19, 10, 6, '#fbfaf5', 3), rect(8, 24, 34, 4, shade(c, 0.3)), rect(38, 35, 4, 5, shade(c, -0.35)), rect(8, 35, 4, 5, shade(c, -0.35))],
  sofa: (c) => [rect(7, 14, 34, 14, shade(c, -0.15), 5), rect(4, 22, 9, 16, c, 4), rect(35, 22, 9, 16, c, 4), rect(11, 25, 26, 10, shade(c, 0.12), 3), rect(8, 38, 3, 4, '#4a3a2a'), rect(37, 38, 3, 4, '#4a3a2a')],
  table: (c) => [rect(6, 17, 36, 6, c, 2, { stroke: shade(c, -0.35), 'stroke-width': 1 }), rect(10, 23, 4, 18, shade(c, -0.25)), rect(34, 23, 4, 18, shade(c, -0.25))],
  chair: (c) => [rect(13, 5, 5, 22, shade(c, -0.1), 1), rect(13, 5, 21, 4, c, 1), rect(11, 25, 26, 6, c, 2), rect(12, 31, 4, 12, shade(c, -0.25)), rect(32, 31, 4, 12, shade(c, -0.25))],
  bench: (c) => [rect(5, 20, 38, 7, c, 2), rect(9, 27, 4, 14, shade(c, -0.25)), rect(35, 27, 4, 14, shade(c, -0.25)), rect(9, 33, 30, 3, shade(c, -0.15))],
  altar: (c) => [rect(8, 22, 32, 6, c, 2), rect(10, 28, 28, 13, shade(c, -0.15)), rect(20, 12, 8, 10, '#d9a63a', 2), line(24, 12, 24, 5, '#c0392b', 2), circ(24, 4, 1.8, '#ff9d3c'), rect(11, 17, 6, 5, '#e8574a', 1), rect(31, 17, 6, 5, '#e8574a', 1)],
  crate: (c) => [rect(7, 9, 34, 31, c, 2, { stroke: shade(c, -0.4), 'stroke-width': 2 }), line(7, 20, 41, 20, shade(c, -0.4), 2), line(7, 30, 41, 30, shade(c, -0.4), 2), line(7, 9, 41, 40, shade(c, -0.25), 1.5)],
  floorlamp: (c) => [path('M14 6 L34 6 L40 20 L8 20Z', '#fbe7a6', { stroke: shade(c, -0.2), 'stroke-width': 1.5 }), rect(22.5, 20, 3, 20, c), ell(24, 41, 9, 3, shade(c, -0.2))],
  lamp: (c) => [path('M15 10 L33 10 L38 24 L10 24Z', '#fbe7a6', { stroke: shade(c, -0.2), 'stroke-width': 1.5 }), rect(22, 24, 4, 10, c), ell(24, 37, 9, 4, shade(c, -0.15))],
  lantern: (c) => [rect(19, 4, 10, 5, '#6b4a2a', 1), ell(24, 24, 14, 14, c), line(24, 10, 24, 38, shade(c, -0.3), 1.2), line(16, 14, 16, 34, shade(c, -0.3), 1), line(32, 14, 32, 34, shade(c, -0.3), 1), rect(19, 38, 10, 4, '#6b4a2a', 1), line(24, 42, 24, 46, '#d9a63a', 2)],
  plant: (c) => [path('M24 30 C10 28 8 14 14 8 C22 12 26 20 24 30Z', '#4da34d'), path('M24 30 C36 26 40 14 34 6 C26 12 22 20 24 30Z', '#62b862'), path('M24 30 C20 20 22 10 24 6 C28 12 28 22 24 30Z', '#3d8f3d'), path('M13 30 L35 30 L32 43 L16 43Z', c, { stroke: shade(c, -0.35), 'stroke-width': 1.2 })],
  rug: (c) => [rect(4, 14, 40, 22, c, 5, { stroke: shade(c, -0.35), 'stroke-width': 1.5 }), rect(9, 19, 30, 12, 'none', 3, { stroke: shade(c, 0.4), 'stroke-width': 2 }), circ(24, 25, 3, shade(c, 0.4))],
  shelf: (c) => [rect(8, 5, 32, 38, c, 2, { stroke: shade(c, -0.35), 'stroke-width': 1.5 }), rect(10, 17, 28, 3, shade(c, -0.25)), rect(10, 30, 28, 3, shade(c, -0.25)), rect(13, 9, 6, 8, '#c0504a'), rect(21, 11, 5, 6, '#4a7ec0'), rect(14, 22, 8, 8, '#e9c46a'), rect(26, 24, 8, 6, '#6aa84f'), rect(12, 35, 10, 8, shade(c, 0.3))],
  statue: (c) => [rect(12, 36, 24, 6, '#9a9a96', 2), circ(24, 11, 5, c), path('M14 36 Q14 20 24 17 Q34 20 34 36Z', c), path('M18 30 Q24 26 30 30 Q24 34 18 30Z', shade(c, -0.25))],
  stool: (c) => [ell(24, 16, 14, 5, c, { stroke: shade(c, -0.35), 'stroke-width': 1.2 }), rect(12, 17, 3.5, 24, shade(c, -0.25)), rect(32.5, 17, 3.5, 24, shade(c, -0.25)), rect(22.5, 19, 3, 22, shade(c, -0.15))],
  tank: () => [rect(6, 10, 36, 28, '#bfe3f5', 3, { stroke: '#6fa8c9', 'stroke-width': 2, opacity: 0.95 }), rect(8, 24, 32, 12, '#6fb7e0', 2, { opacity: 0.8 }), ell(20, 28, 5, 3, '#f0883a'), path('M25 28 L30 24 L30 32Z', '#f0883a'), rect(6, 38, 36, 4, '#5a4a3a', 1)],
  tvunit: (c) => [rect(7, 6, 34, 21, '#222a36', 2, { stroke: '#555', 'stroke-width': 1.5 }), rect(10, 9, 28, 15, '#5aa0d8', 1), rect(8, 28, 32, 13, c, 2), line(24, 29, 24, 40, shade(c, -0.35), 1.2)],
  wardrobe: (c) => [rect(9, 4, 30, 38, c, 2, { stroke: shade(c, -0.35), 'stroke-width': 1.5 }), line(24, 5, 24, 41, shade(c, -0.35), 1.5), circ(21, 24, 1.6, '#d9a63a'), circ(27, 24, 1.6, '#d9a63a'), rect(11, 7, 11, 14, shade(c, 0.12), 1), rect(26, 7, 11, 14, shade(c, 0.12), 1)],
};
const DEFAULT_COLOR = { orb: '#8d98a3', fish: '#e8863a', turtle: '#6b8f4e', squid: '#c9a0c9', board: '#f2a31b', bell: '#b9b2a4' };

export function icon(ic) {
  const k = ic && typeof ic.k === 'string' ? ic.k : '', fn = DRAW[k];
  const svg = mk('svg', { viewBox: '0 0 48 48', width: 48, height: 48, 'aria-hidden': 'true', focusable: 'false' });
  svg.classList.add('bg-ic');
  const c = ic && /^#[0-9a-f]{6}$/i.test(ic.c || '') ? ic.c : DEFAULT_COLOR[k] || '#a8794a';
  if (!fn) { svg.appendChild(rect(8, 8, 32, 32, '#555a66', 6)); svg.appendChild(mk('text', { x: 24, y: 32, 'text-anchor': 'middle', 'font-size': 22, fill: '#fff' }, [document.createTextNode('?')])); return svg; }
  for (const part of fn(c)) svg.appendChild(part);
  return svg;
}
