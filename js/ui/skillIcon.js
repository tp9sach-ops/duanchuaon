// Hình biểu tượng chiêu (Phiên 187, tách riêng Phiên 189 để heSkill.js và luyenChieu.js cùng dùng): SVG tự vẽ, không innerHTML.
// Phiên 193: vẽ theo phong cách nút kỹ năng MOBA. Phiên 194 (YC ptg: "phải đẹp như ảnh Liên Quân"): VẼ LẠI thành TRANH MINH HỌA thay vì nét phẳng —
//   viền kim loại mảnh có KHẤC NHỌN ở đỉnh (như nút Liên Quân), nền là cảnh theo Hệ (Hỏa: lưỡi lửa · Thủy: sóng + bong bóng · Mộc: dây leo + lá · Thổ: tinh thể đá · Kim: tia kim quang),
//   chủ thể là hình TÔ MÀU có chiều sâu (khiên, bàn tay hồi máu, bóng ẩn thân, tia, nhát chém, sóng xung kích…) với ánh sáng viền, hào quang, hạt sáng và lớp kính bóng.
// Chữ ký hàm giữ nguyên: drawGlyphIcon(mau, glyph, tuyet, dim) — Hệ được nhận ra từ màu (HE_BY_COLOR), nên heSkill.js/luyenChieu.js không phải đổi.
const SVGNS = 'http://www.w3.org/2000/svg';
const el = (n, a, p) => { const e = document.createElementNS(SVGNS, n); for (const k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; };
// Đường nét cũ — giữ để test/biểu tượng cũ (và chỗ khác) còn dùng được.
export const GLYPH_D = {
  hoi: 'M27 12V42M12 27H42', an: 'M15 41V26a12 12 0 0 1 24 0V41l-6-4-6 4-6-4ZM22 26h.1M32 26h.1', khien: 'M27 10L41 16V28C41 37 34 42 27 45C20 42 13 37 13 28V16Z',
  toc: 'M12 14L25 27L12 40M26 14L39 27L26 40', khoa: 'M27 9V45M11 18L43 36M11 36L43 18', lao: 'M9 27H41M31 16L43 27L31 38M9 19H21M9 35H21',
  tia: 'M10 44L40 14M31 12H42V23M14 30L24 40', vung: 'M27 21a6 6 0 1 0 .1 0ZM27 12a15 15 0 1 0 .1 0Z', chem: 'M12 43Q14 18 43 12M20 43Q23 26 43 20M9 36Q11 25 25 21',
  chon: 'M12 19H42M12 35H42M19 12L12 19L19 26M35 28L42 35L35 42',
};
const hex = (m) => (/^#[0-9a-f]{6}$/i.test(String(m)) ? String(m).toLowerCase() : '#d9b25f');
const mix = (c, t, a) => { const n = parseInt(c.slice(1), 16), f = (v) => Math.round(v + (t - v) * a); return '#' + [n >> 16 & 255, n >> 8 & 255, n & 255].map((v) => f(v).toString(16).padStart(2, '0')).join(''); };
// Màu Hệ (trùng HE_COLOR ở js/world/chieuInfo.js) → Hệ. Màu lạ → 'kim'.
const HE_BY_COLOR = { '#dfe3e8': 'kim', '#3f9b4a': 'moc', '#2f6fd0': 'thuy', '#d9432b': 'hoa', '#c9a227': 'tho' };
// Bảng màu từng Hệ: nền tối / nền sáng / ánh chủ đạo / lõi nóng (chủ thể) — chọn để mỗi Hệ nhìn là biết ngay, không chỉ đổi một màu.
const PAL = {
  hoa: { bg0: '#3a0a06', bg1: '#b3260f', glow: '#ff8a3c', core: '#fff1a8', rim: '#ffd27a' },
  thuy: { bg0: '#04163a', bg1: '#1b62c8', glow: '#52c8ff', core: '#e6fbff', rim: '#9fe6ff' },
  moc: { bg0: '#052410', bg1: '#2d8a3c', glow: '#8bf06a', core: '#f4ffd0', rim: '#c8ff9a' },
  tho: { bg0: '#2b1b04', bg1: '#a87a14', glow: '#ffd24a', core: '#fff6cf', rim: '#ffe49a' },
  kim: { bg0: '#161b26', bg1: '#6b7a93', glow: '#bfe3ff', core: '#ffffff', rim: '#e8f2ff' },
};
let uid = 0;
const P = (d, a, p) => el('path', Object.assign({ d }, a), p);
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// Cảnh nền theo Hệ (vẽ trong vòng tròn nghệ thuật r=23).
function scene(he, pal, g, p) {
  if (he === 'hoa') {
    for (let i = 0; i < 7; i++) { const x = 6 + i * 7 + rnd(i) * 3, h = 16 + rnd(i + 9) * 16, w = 4 + rnd(i + 3) * 3; P(`M${x - w} 54Q${x - w * 0.5} ${54 - h * 0.5} ${x + (rnd(i + 5) - 0.5) * 6} ${54 - h}Q${x + w * 0.4} ${54 - h * 0.45} ${x + w} 54Z`, { fill: i % 2 ? pal.glow : '#ff5a1f', opacity: 0.55 }, p); }
    for (let i = 0; i < 5; i++) { const x = 11 + i * 8 + rnd(i + 20) * 3, h = 9 + rnd(i + 30) * 10; P(`M${x - 3} 54Q${x - 1} ${54 - h * 0.5} ${x} ${54 - h}Q${x + 2} ${54 - h * 0.5} ${x + 3} 54Z`, { fill: pal.core, opacity: 0.45 }, p); }
  } else if (he === 'thuy') {
    for (let k = 0; k < 4; k++) { const y = 24 + k * 7; P(`M0 ${y}Q7 ${y - 5} 14 ${y}T27 ${y}T41 ${y}T54 ${y}V54H0Z`, { fill: k % 2 ? pal.glow : '#1f78e0', opacity: 0.22 + k * 0.05 }, p); P(`M0 ${y}Q7 ${y - 5} 14 ${y}T27 ${y}T41 ${y}T54 ${y}`, { fill: 'none', stroke: pal.rim, 'stroke-width': 0.7, opacity: 0.55 }, p); }
    for (let i = 0; i < 8; i++) el('circle', { cx: 8 + rnd(i) * 38, cy: 10 + rnd(i + 7) * 34, r: 0.8 + rnd(i + 2) * 1.8, fill: 'none', stroke: pal.core, 'stroke-width': 0.6, opacity: 0.6 }, p);
  } else if (he === 'moc') {
    for (let i = 0; i < 3; i++) { P(`M${-2 + i * 6} 56C${12 + i * 5} 40 ${2 + i * 9} 28 ${24 + i * 8} ${8 + i * 4}`, { fill: 'none', stroke: pal.glow, 'stroke-width': 1.4, opacity: 0.45, 'stroke-linecap': 'round' }, p); }
    for (let i = 0; i < 9; i++) { const x = 6 + rnd(i) * 42, y = 8 + rnd(i + 4) * 40, a = rnd(i + 8) * 360; P('M0 0Q4 -3 8 0Q4 3 0 0Z', { fill: i % 2 ? pal.rim : pal.glow, opacity: 0.5, transform: `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${a.toFixed(0)})` }, p); }
  } else if (he === 'tho') {
    for (let i = 0; i < 6; i++) { const x = 4 + i * 9, h = 12 + rnd(i) * 18; P(`M${x} 54L${x + 3} ${54 - h}L${x + 6} ${54 - h * 0.7}L${x + 9} 54Z`, { fill: i % 2 ? '#e0b030' : '#7a5410', opacity: 0.6 }, p); P(`M${x + 3} ${54 - h}L${x + 6} ${54 - h * 0.7}L${x + 5} 54L${x + 2.5} 54Z`, { fill: pal.core, opacity: 0.22 }, p); }
    for (let i = 0; i < 7; i++) P(`M${6 + rnd(i) * 40} ${6 + rnd(i + 3) * 30}l2 -3l2 3l-2 3Z`, { fill: pal.rim, opacity: 0.55 }, p);
  } else {
    for (let i = 0; i < 9; i++) { const a = (i * 40 + 8) * Math.PI / 180, b = a + 0.11; P(`M27 27L${(27 + 40 * Math.cos(a)).toFixed(1)} ${(27 + 40 * Math.sin(a)).toFixed(1)}L${(27 + 40 * Math.cos(b)).toFixed(1)} ${(27 + 40 * Math.sin(b)).toFixed(1)}Z`, { fill: '#fff', opacity: 0.16 }, p); }
    P('M-2 40L56 14', { stroke: pal.rim, 'stroke-width': 0.8, opacity: 0.5, fill: 'none' }, p); P('M-2 48L56 24', { stroke: '#fff', 'stroke-width': 0.5, opacity: 0.4, fill: 'none' }, p);
  }
}

// Chủ thể từng glyph: mỗi hình gồm hào quang mờ + khối tô gradient + nét sáng viền + vài chi tiết. s = bộ vẽ chung.
function subject(glyph, pal, g, p, s) {
  const fill = 'url(#' + g + 'm)', gl = s.glowF;
  const body = (d, extra) => { P(d, { fill: pal.glow, opacity: 0.9, filter: gl, transform: 'translate(0 .6)' }, p); P(d, Object.assign({ fill, stroke: '#120a10', 'stroke-width': 1.6, 'stroke-linejoin': 'round' }, extra), p); return d; };
  const edge = (d, w) => P(d, { fill: 'none', stroke: pal.core, 'stroke-width': w || 0.9, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.9 }, p);
  const spark = (x, y, r) => P(`M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z`, { fill: '#fff', opacity: 0.95 }, p);
  switch (glyph) {
    case 'hoi': {   // hai bàn tay (có ngón) nâng quả cầu sinh lực, tia sáng tỏa + vòng phép
      el('circle', { cx: 27, cy: 20, r: 14, fill: pal.glow, opacity: 0.5, filter: gl }, p);
      for (let i = 0; i < 12; i++) { const a = (i * 30 + 8) * Math.PI / 180, r1 = 9, r2 = i % 2 ? 17 : 22; P(`M${(27 + r1 * Math.cos(a)).toFixed(1)} ${(20 + r1 * Math.sin(a)).toFixed(1)}L${(27 + r2 * Math.cos(a)).toFixed(1)} ${(20 + r2 * Math.sin(a)).toFixed(1)}`, { stroke: pal.core, 'stroke-width': i % 2 ? 0.8 : 1.3, opacity: 0.6, 'stroke-linecap': 'round', fill: 'none' }, p); }
      el('ellipse', { cx: 27, cy: 21, rx: 17, ry: 5, fill: 'none', stroke: pal.rim, 'stroke-width': 0.8, opacity: 0.7, transform: 'rotate(-12 27 21)' }, p);
      el('circle', { cx: 27, cy: 20, r: 8.2, fill: '#120a10' }, p); el('circle', { cx: 27, cy: 20, r: 7.2, fill: 'url(#' + g + 'o)' }, p);
      P('M27 15V25M22 20H32', { stroke: '#1f7a2a', 'stroke-width': 2.6, 'stroke-linecap': 'round', fill: 'none', opacity: 0.85 }, p); el('circle', { cx: 24.6, cy: 17.6, r: 1.6, fill: '#fff', opacity: 0.9 }, p);
      const hand = 'M3 46C3 40 7 35 13 33L18.5 31.5C20.4 31 21.6 33 20.4 34.4L18.2 36.6L23 35.4C25 35 26.2 37 24.8 38.3L20.4 41.2L25 41C26.8 41 27.4 43 26 44L20.4 47.6C16.6 50.2 12 51.6 7.6 51C4.8 50.6 3 48.8 3 46Z';
      const mir = (d) => d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => (54 - x) + ' ' + y);
      const hg = el('linearGradient', { id: g + 'h', x1: 0, y1: 0, x2: 0, y2: 1 }, p); for (const [o, c] of [[0, '#fff0c8'], [0.5, '#f0b866'], [1, '#a8651e']]) el('stop', { offset: o, 'stop-color': c }, hg);   // da tay ấm, tách khỏi nền cảnh
      const hs = el('g', { transform: 'translate(27 47) scale(0.84) translate(-27 -47)' }, p);
      const sh = (d, a) => P(d, Object.assign({ fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, a), hs);
      for (const d of [hand, mir(hand)]) { P(d, { fill: pal.core, opacity: 0.7, filter: gl }, hs); P(d, { fill: 'url(#' + g + 'h)', stroke: '#120a10', 'stroke-width': 1.7, 'stroke-linejoin': 'round' }, hs); }
      for (const d of ['M5 45C6 40 10 36 15 34.5', 'M20.6 34.8L18 37', 'M24.2 38.4L20.6 41.4']) { sh(d, { stroke: '#fff8e0', 'stroke-width': 1, opacity: 0.9 }); sh(mir(d), { stroke: '#fff8e0', 'stroke-width': 1, opacity: 0.9 }); }
      for (const d of ['M12 46C15 45 19 46 22 47', 'M13 41.5C16 41 18 42 20 43.6']) { sh(d, { stroke: '#6b3a10', 'stroke-width': 0.8, opacity: 0.7 }); sh(mir(d), { stroke: '#6b3a10', 'stroke-width': 0.8, opacity: 0.7 }); }
      for (let i = 0; i < 6; i++) el('circle', { cx: 15 + rnd(i) * 24, cy: 24 + rnd(i + 5) * 14, r: 0.6 + rnd(i + 2) * 1, fill: '#fff', opacity: 0.8 }, p);
      spark(38, 10, 3); spark(15, 12, 2.2); spark(41, 27, 1.6); return;
    }
    case 'an': {   // bóng người trùm mũ tan thành khói
      P('M27 8C19 8 14 14 14 22C14 27 16 30 15 34L10 46Q18 42 22 46Q27 49 32 46Q36 42 44 46L39 34C38 30 40 27 40 22C40 14 35 8 27 8Z', { fill: pal.glow, opacity: 0.6, filter: gl }, p);
      P('M27 9C20 9 15.5 14 15.5 21.5C15.5 26 17.5 29 16.5 33.5L12 45Q18.5 41.5 22.5 45.5Q27 48 31.5 45.5Q35.5 41.5 42 45L37.5 33.5C36.5 29 38.5 26 38.5 21.5C38.5 14 34 9 27 9Z', { fill: 'url(#' + g + 'v)', stroke: '#120a10', 'stroke-width': 1.5, 'stroke-linejoin': 'round' }, p);
      P('M27 14C21.5 14 19 18 19 22.5C19 26 22 29 27 29C32 29 35 26 35 22.5C35 18 32.5 14 27 14Z', { fill: '#05030a' }, p);
      el('ellipse', { cx: 23.3, cy: 22.3, rx: 1.9, ry: 1.2, fill: pal.core }, p); el('ellipse', { cx: 30.7, cy: 22.3, rx: 1.9, ry: 1.2, fill: pal.core }, p);
      edge('M17 21C17 14 22 10 27 10', 1); for (let i = 0; i < 6; i++) el('circle', { cx: 12 + rnd(i) * 30, cy: 38 + rnd(i + 5) * 12, r: 1 + rnd(i + 2) * 2, fill: pal.rim, opacity: 0.45 }, p); spark(38, 14, 2.2); return;
    }
    case 'khien': {   // khiên có gờ, huy hiệu và ánh kim
      body('M27 6L43 12V26C43 36 36 43 27 48C18 43 11 36 11 26V12Z');
      P('M27 11L38.5 15.5V26C38.5 33.5 33.5 39 27 43C20.5 39 15.5 33.5 15.5 26V15.5Z', { fill: 'url(#' + g + 'v)', stroke: '#120a10', 'stroke-width': 1 }, p);
      P('M27 11V43M15.5 25H38.5', { stroke: pal.core, 'stroke-width': 0.7, opacity: 0.5, fill: 'none' }, p);
      P('M27 18L31.5 26L27 35L22.5 26Z', { fill: pal.core, stroke: '#120a10', 'stroke-width': 0.9, 'stroke-linejoin': 'round' }, p); edge('M27 7L42 12.5'); edge('M12 13L12.5 26', 0.7); spark(38, 14, 2); return;
    }
    case 'toc': {   // tia chớp + vệt tốc độ
      for (let i = 0; i < 4; i++) P(`M${4 + i * 3} ${14 + i * 9}H${22 - i * 2}`, { stroke: pal.core, 'stroke-width': 1.4 - i * 0.2, opacity: 0.7 - i * 0.1, 'stroke-linecap': 'round' }, p);
      body('M33 5L15 29H25L19 49L40 22H29.5Z'); edge('M33 7L18 28.5'); edge('M28 24L22 40', 0.7); spark(40, 14, 2.4); spark(13, 40, 1.8); return;
    }
    case 'khoa': {   // ấn phong: vòng phép có chữ, ngôi sao sáu cánh, mắt ấn ở giữa
      el('circle', { cx: 27, cy: 27, r: 20, fill: 'none', stroke: pal.glow, 'stroke-width': 3, opacity: 0.6, filter: gl }, p);
      for (const [r, w, c] of [[21, 3, '#120a10'], [21, 1.8, 'url(#' + g + 'v)'], [15.5, 2.6, '#120a10'], [15.5, 1.2, pal.core]]) el('circle', { cx: 27, cy: 27, r, fill: 'none', stroke: c, 'stroke-width': w }, p);
      for (let i = 0; i < 24; i++) { const a = i * 15 * Math.PI / 180, r1 = 17.5, r2 = i % 2 ? 19 : 20; P(`M${(27 + r1 * Math.cos(a)).toFixed(1)} ${(27 + r1 * Math.sin(a)).toFixed(1)}L${(27 + r2 * Math.cos(a)).toFixed(1)} ${(27 + r2 * Math.sin(a)).toFixed(1)}`, { stroke: pal.core, 'stroke-width': 0.7, opacity: 0.85 }, p); }
      const tri = (o) => { let d = ''; for (let i = 0; i < 3; i++) { const a = (o + i * 120) * Math.PI / 180; d += (i ? 'L' : 'M') + (27 + 15.5 * Math.cos(a)).toFixed(1) + ' ' + (27 + 15.5 * Math.sin(a)).toFixed(1); } return d + 'Z'; };
      P(tri(-90), { fill: pal.glow, opacity: 0.35, stroke: pal.core, 'stroke-width': 1.1, 'stroke-linejoin': 'round' }, p); P(tri(90), { fill: pal.glow, opacity: 0.35, stroke: pal.core, 'stroke-width': 1.1, 'stroke-linejoin': 'round' }, p);
      el('circle', { cx: 27, cy: 27, r: 7, fill: '#120a10' }, p); el('circle', { cx: 27, cy: 27, r: 5.6, fill: 'url(#' + g + 'o)' }, p); el('ellipse', { cx: 27, cy: 27, rx: 1.5, ry: 4.6, fill: '#120a10' }, p); el('circle', { cx: 25.3, cy: 24.8, r: 1.2, fill: '#fff' }, p); spark(40, 11, 2.2); spark(13, 42, 1.8); return;
    }
    case 'lao': {   // lao tới: mũi lao có đuôi lông + vòng gió xé, vệt tốc độ
      for (let i = 0; i < 5; i++) P(`M${1 + i * 2} ${14 + i * 6.5}H${24 - i * 2}`, { stroke: pal.core, 'stroke-width': 1.5 - i * 0.18, opacity: 0.75 - i * 0.1, 'stroke-linecap': 'round' }, p);
      for (const [x, k] of [[36, 1], [40, 0.7]]) P(`M${x} ${27 - 11 * k}C${x + 6} ${27 - 7 * k} ${x + 6} ${27 + 7 * k} ${x} ${27 + 11 * k}`, { fill: 'none', stroke: pal.rim, 'stroke-width': 1, opacity: 0.6, 'stroke-linecap': 'round' }, p);
      P('M8 27H38', { stroke: pal.glow, 'stroke-width': 6, opacity: 0.6, filter: gl, 'stroke-linecap': 'round' }, p);
      body('M33 18L51 27L33 36L36.5 27Z'); P('M7 27H35', { stroke: '#120a10', 'stroke-width': 3.4, 'stroke-linecap': 'round' }, p); P('M7 27H35', { stroke: 'url(#' + g + 'v)', 'stroke-width': 1.8, 'stroke-linecap': 'round' }, p);
      P('M7 27L3 22L10 24.6ZM7 27L3 32L10 29.4Z', { fill: pal.core, stroke: '#120a10', 'stroke-width': 0.9, 'stroke-linejoin': 'round' }, p); edge('M34 19.5L49 27', 0.8); spark(42, 17, 2); return;
    }
    case 'tia': {   // kiếm khí: thanh kiếm đủ chuôi + chắn kiếm, vệt chém bay theo
      P('M5 44C14 24 30 12 49 8C36 16 24 28 18 46Z', { fill: pal.glow, opacity: 0.5, filter: gl }, p); P('M7 43C16 26 31 15 47 10', { stroke: pal.core, 'stroke-width': 1, fill: 'none', opacity: 0.7, 'stroke-linecap': 'round' }, p);
      const sw = el('g', { transform: 'rotate(38 27 27)' }, p);
      P('M27 1L32 8V34H22V8Z', { fill: pal.glow, opacity: 0.8, filter: gl }, sw);
      P('M27 1L32 8V34H22V8Z', { fill: 'url(#' + g + 'm)', stroke: '#120a10', 'stroke-width': 1.5, 'stroke-linejoin': 'round' }, sw); P('M27 4V34', { stroke: '#120a10', 'stroke-width': 0.9, opacity: 0.5 }, sw); P('M24.6 10V33', { stroke: '#fff', 'stroke-width': 0.7, opacity: 0.8 }, sw);
      P('M15 34H39L36.5 39H17.5Z', { fill: '#f3c24a', stroke: '#120a10', 'stroke-width': 1.4, 'stroke-linejoin': 'round' }, sw); P('M17 35.4H37', { stroke: '#fff3c4', 'stroke-width': 0.8, opacity: 0.8 }, sw);
      P('M24.6 39H29.4V47H24.6Z', { fill: '#4a2616', stroke: '#120a10', 'stroke-width': 1.2 }, sw); P('M24.6 41.5L29.4 43M24.6 44.5L29.4 46', { stroke: '#120a10', 'stroke-width': 0.7, opacity: 0.6 }, sw);
      el('circle', { cx: 27, cy: 49.2, r: 3, fill: '#f3c24a', stroke: '#120a10', 'stroke-width': 1.2 }, sw); el('circle', { cx: 27, cy: 18, r: 0.01 }, sw);
      el('circle', { cx: 44.5, cy: 9, r: 6.5, fill: 'url(#' + g + 'o)', opacity: 0.8 }, p); spark(44.5, 9, 6); spark(30, 24, 1.8); spark(13, 18, 1.5); return;
    }
    case 'vung': {   // sóng xung kích: tâm nổ hình sao, vành sóng lan, mảnh vỡ văng
      for (let i = 3; i >= 1; i--) { el('ellipse', { cx: 27, cy: 33, rx: 5 + i * 7, ry: 2.5 + i * 3.4, fill: 'none', stroke: '#120a10', 'stroke-width': 3.6 - i * 0.5, opacity: 0.8 }, p); el('ellipse', { cx: 27, cy: 33, rx: 5 + i * 7, ry: 2.5 + i * 3.4, fill: 'none', stroke: i === 1 ? pal.core : pal.glow, 'stroke-width': 2.1 - i * 0.3, opacity: 1 - i * 0.18 }, p); }
      let d = ''; for (let i = 0; i < 16; i++) { const a = (i * 22.5 - 90) * Math.PI / 180, r = i % 2 ? 6 : 15; d += (i ? 'L' : 'M') + (27 + r * Math.cos(a)).toFixed(1) + ' ' + (27 + r * 0.95 * Math.sin(a)).toFixed(1); }
      body(d + 'Z'); el('circle', { cx: 27, cy: 27, r: 5.4, fill: 'url(#' + g + 'o)' }, p); el('circle', { cx: 25.6, cy: 25.6, r: 1.6, fill: '#fff' }, p);
      for (const [x, y, a] of [[8, 14, -40], [44, 12, 30], [10, 44, 10], [46, 42, -20]]) P('M0 0L4 -2L2 3Z', { fill: pal.rim, stroke: '#120a10', 'stroke-width': 0.8, 'stroke-linejoin': 'round', transform: `translate(${x} ${y}) rotate(${a})` }, p); spark(40, 17, 2); return;
    }
    case 'chon': {   // chọn Pháp Môn: ngôi sao bốn cánh
      body('M27 5L32 22L49 27L32 32L27 49L22 32L5 27L22 22Z'); P('M27 14L29.6 24.4L40 27L29.6 29.6L27 40L24.4 29.6L14 27L24.4 24.4Z', { fill: pal.core, opacity: 0.9 }, p); edge('M27 6L31 22'); return;
    }
    default: {   // chem: hai nhát chém cong có vệt sáng
      for (const [d, k] of [['M6 46C10 22 28 10 48 8C34 14 20 26 14 46Z', 1], ['M16 48C20 32 32 22 48 20C38 26 28 34 24 48Z', 0.8]]) { P(d, { fill: pal.glow, opacity: 0.7 * k, filter: gl }, p); P(d, { fill: k === 1 ? fill : 'url(#' + g + 'v)', stroke: '#120a10', 'stroke-width': 1.5, 'stroke-linejoin': 'round' }, p); }
      edge('M8 42C12 22 29 12 46 9.5'); edge('M18 44C22 31 33 23 46 21', 0.7); spark(40, 14, 2.4); spark(14, 26, 1.8); return;
    }
  }
}

/** Trả <svg viewBox 0 0 54 54>. mau '#rrggbb' (màu Hệ); glyph: khoá trong GLYPH_D; tuyet: chiêu Tuyệt Học; dim: chưa mở (mờ). */
export function drawGlyphIcon(mau, glyph, tuyet, dim) {
  const m = hex(mau), he = HE_BY_COLOR[m] || 'kim', pal = PAL[he], id = 'gi' + (++uid), svg = el('svg', { viewBox: '0 0 54 54', 'aria-hidden': 'true' }), defs = el('defs', {}, svg);
  const stops = (g, list) => { for (const [o, c, a] of list) el('stop', { offset: o, 'stop-color': c, 'stop-opacity': a == null ? 1 : a }, g); return g; };
  stops(el('radialGradient', { id: id + 'b', cx: '.5', cy: '.38', r: '.8' }, defs), [[0, pal.bg1], [0.65, mix(pal.bg1, 0, 0.55)], [1, pal.bg0]]);
  stops(el('linearGradient', { id: id + 'r', x1: 0, y1: 0, x2: 1, y2: 1 }, defs), tuyet ? [[0, '#fff3c4'], [0.35, '#e6b73a'], [0.7, '#8a5d12'], [1, '#f3d27a']] : [[0, '#f4f7fb'], [0.4, '#9aa6b8'], [0.75, '#39414f'], [1, '#c9d2de']]);
  stops(el('linearGradient', { id: id + 'm', x1: 0.2, y1: 0, x2: 0.8, y2: 1 }, defs), [[0, '#ffffff'], [0.35, pal.core], [0.7, pal.glow], [1, mix(pal.glow, 0, 0.35)]]);
  stops(el('linearGradient', { id: id + 'v', x1: 0, y1: 0, x2: 0, y2: 1 }, defs), [[0, mix(pal.glow, 255, 0.35)], [1, mix(pal.bg1, 0, 0.35)]]);
  stops(el('radialGradient', { id: id + 'o', cx: '.4', cy: '.35', r: '.75' }, defs), [[0, '#ffffff'], [0.45, pal.core], [1, pal.glow]]);
  stops(el('linearGradient', { id: id + 's', x1: 0, y1: 0, x2: 0, y2: 1 }, defs), [[0, '#fff', 0.5], [1, '#fff', 0]]);
  stops(el('radialGradient', { id: id + 'w', cx: '.5', cy: '.5', r: '.5' }, defs), [[0.6, '#000', 0], [1, '#000', 0.55]]);
  const flt = el('filter', { id: id + 'f', x: '-40%', y: '-40%', width: '180%', height: '180%' }, defs); el('feGaussianBlur', { stdDeviation: 1.8 }, flt);
  const clip = el('clipPath', { id: id + 'c' }, defs); el('circle', { cx: 27, cy: 27, r: 22.6 }, clip);
  const root = el('g', { opacity: dim ? 0.5 : 1 }, svg);
  el('circle', { cx: 27, cy: 27, r: 26.6, fill: '#05040a' }, root);                                                          // viền ngoài tối
  el('circle', { cx: 27, cy: 27, r: 25.4, fill: 'url(#' + id + 'r)' }, root);                                                 // vòng kim loại mảnh
  el('circle', { cx: 27, cy: 27, r: 23.8, fill: '#07050c' }, root);                                                          // rãnh
  el('circle', { cx: 27, cy: 27, r: 22.6, fill: 'url(#' + id + 'b)' }, root);                                                // nền theo Hệ
  const art = el('g', { 'clip-path': 'url(#' + id + 'c)' }, root);
  scene(he, pal, id, art);
  el('ellipse', { cx: 27, cy: 54, rx: 24, ry: 10, fill: '#000', opacity: 0.3 }, art);
  subject(glyph in GLYPH_D ? glyph : 'chem', pal, id, art, { glowF: 'url(#' + id + 'f)' });
  el('circle', { cx: 27, cy: 27, r: 22.6, fill: 'url(#' + id + 'w)' }, art);                                                 // tối viền (chiều sâu)
  el('ellipse', { cx: 27, cy: 12.5, rx: 16, ry: 8, fill: 'url(#' + id + 's)' }, art);                                         // lớp kính bóng
  el('circle', { cx: 27, cy: 27, r: 22.6, fill: 'none', stroke: pal.rim, 'stroke-width': 0.6, opacity: 0.45 }, root);
  P('M27 -0.4L30.2 3.4L27 6.2L23.8 3.4Z', { fill: tuyet ? '#ffe28a' : '#dfe6f0', stroke: '#05040a', 'stroke-width': 0.8, 'stroke-linejoin': 'round' }, root);   // khấc nhọn ở đỉnh như nút Liên Quân
  if (tuyet) {   // Tuyệt Học: vòng vàng + hai cánh + ngọc đáy
    el('circle', { cx: 27, cy: 27, r: 24.6, fill: 'none', stroke: '#ffe9a8', 'stroke-width': 0.7, opacity: 0.9 }, root);
    P('M0.4 27L4.8 22.6V31.4Z', { fill: '#f3c24a', stroke: '#6e4a10', 'stroke-width': 0.8, 'stroke-linejoin': 'round' }, root); P('M53.6 27L49.2 22.6V31.4Z', { fill: '#f3c24a', stroke: '#6e4a10', 'stroke-width': 0.8, 'stroke-linejoin': 'round' }, root);
    P('M27 53.6L24 50L27 47.6L30 50Z', { fill: '#ffd25a', stroke: '#6e4a10', 'stroke-width': 0.7 }, root);
  }
  if (dim) el('circle', { cx: 27, cy: 27, r: 26, fill: '#000', opacity: 0.35 }, svg);
  return svg;
}
