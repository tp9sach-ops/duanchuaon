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
    case 'hoi': {   // hai bàn tay nâng quả cầu sinh lực (như nút Hồi máu)
      el('circle', { cx: 27, cy: 22, r: 11, fill: pal.glow, opacity: 0.55, filter: gl }, p);
      for (let i = 0; i < 8; i++) { const a = i * 45 * Math.PI / 180; P(`M27 22L${(27 + 17 * Math.cos(a)).toFixed(1)} ${(22 + 17 * Math.sin(a)).toFixed(1)}`, { stroke: pal.core, 'stroke-width': 1, opacity: 0.55, 'stroke-linecap': 'round', fill: 'none' }, p); }
      el('circle', { cx: 27, cy: 22, r: 7, fill: 'url(#' + g + 'o)' }, p); P('M27 17.5V26.5M22.5 22H31.5', { stroke: '#2a7a2a', 'stroke-width': 2.4, 'stroke-linecap': 'round', fill: 'none', opacity: 0.8 }, p);
      const hand = 'M5 31C9 29 14 30 18 33L26 39C28 41 27 44 24 44C20 44 16 42 13 40C10 38 7 35 5 31Z', mir = (d) => d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => (54 - x) + ' ' + y);   // hai lòng bàn tay chụm đỡ quả cầu
      body(hand); body(mir(hand)); edge('M7 31C11 30 15 31 18 34'); edge(mir('M7 31C11 30 15 31 18 34')); P('M14 36L19 38M40 36L35 38', { stroke: '#120a10', 'stroke-width': 0.8, 'stroke-linecap': 'round', opacity: 0.6 }, p); spark(36, 13, 3); spark(17, 17, 2); spark(40, 24, 1.6); return;
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
    case 'khoa': {   // dấu ấn khống chế: vòng phong ấn + gai
      el('circle', { cx: 27, cy: 27, r: 17, fill: 'none', stroke: pal.glow, 'stroke-width': 3, opacity: 0.7, filter: gl }, p);
      el('circle', { cx: 27, cy: 27, r: 17, fill: 'none', stroke: '#120a10', 'stroke-width': 4.2 }, p); el('circle', { cx: 27, cy: 27, r: 17, fill: 'none', stroke: 'url(#' + g + 'v)', 'stroke-width': 2.6 }, p);
      for (let i = 0; i < 6; i++) { const a = (i * 60 - 90) * Math.PI / 180, c = Math.cos(a), sn = Math.sin(a), px = -sn, py = c; P(`M${(27 + 17 * c + 3 * px).toFixed(1)} ${(27 + 17 * sn + 3 * py).toFixed(1)}L${(27 + 25.5 * c).toFixed(1)} ${(27 + 25.5 * sn).toFixed(1)}L${(27 + 17 * c - 3 * px).toFixed(1)} ${(27 + 17 * sn - 3 * py).toFixed(1)}Z`, { fill: pal.core, stroke: '#120a10', 'stroke-width': 0.9, 'stroke-linejoin': 'round' }, p); }
      body('M27 15L37 27L27 39L17 27Z'); edge('M27 17L35 27'); el('circle', { cx: 27, cy: 27, r: 3, fill: '#120a10' }, p); el('circle', { cx: 27, cy: 27, r: 1.6, fill: pal.core }, p); return;
    }
    case 'lao': {   // lao tới: mũi tên lớn + vệt gió
      for (let i = 0; i < 5; i++) P(`M${2 + i * 2} ${15 + i * 6}H${22 - i}`, { stroke: pal.core, 'stroke-width': 1.5 - i * 0.18, opacity: 0.75 - i * 0.1, 'stroke-linecap': 'round' }, p);
      body('M23 14L47 27L23 40L28 31H12L12 23H28Z'); edge('M24 15.5L45 27'); edge('M14 24.3H29', 0.7); spark(40, 14, 2.2); return;
    }
    case 'tia': {   // kiếm khí: lưỡi kiếm chéo bùng sáng ở mũi, vệt chém phía sau
      P('M8 46L40 14', { stroke: pal.glow, 'stroke-width': 7, opacity: 0.55, 'stroke-linecap': 'round', filter: gl }, p);
      body('M48 5L49 12L29 34L22 27Z'); P('M47 8L27 31', { stroke: '#120a10', 'stroke-width': 0.8, opacity: 0.55, fill: 'none' }, p); edge('M48 6.5L25 29.5', 0.8);
      body('M14 33L30 38L26 42L10 37Z', { transform: 'rotate(0)' }); P('M15 28L26 39L22.5 42.5L11.5 31.5Z', { fill: pal.rim, stroke: '#120a10', 'stroke-width': 1.2, 'stroke-linejoin': 'round' }, p);
      P('M19 37L8 48L5 45L16 34Z', { fill: '#3a1d12', stroke: '#120a10', 'stroke-width': 1.2, 'stroke-linejoin': 'round' }, p); el('circle', { cx: 6.5, cy: 47, r: 2.4, fill: pal.rim, stroke: '#120a10', 'stroke-width': 1 }, p);
      el('circle', { cx: 44, cy: 10, r: 6, fill: 'url(#' + g + 'o)', opacity: 0.8 }, p); spark(44, 10, 5.5); spark(30, 22, 1.8); spark(16, 18, 1.5); return;
    }
    case 'vung': {   // sóng xung kích lan ra: vành + tia
      for (let i = 3; i >= 1; i--) { el('ellipse', { cx: 27, cy: 30, rx: 6 + i * 6.5, ry: 3 + i * 3.6, fill: 'none', stroke: '#120a10', 'stroke-width': 3.4 - i * 0.5, opacity: 0.8 }, p); el('ellipse', { cx: 27, cy: 30, rx: 6 + i * 6.5, ry: 3 + i * 3.6, fill: 'none', stroke: i === 1 ? pal.core : pal.glow, 'stroke-width': 2 - i * 0.3, opacity: 1 - i * 0.18 }, p); }
      for (let i = 0; i < 10; i++) { const a = i * 36 * Math.PI / 180; P(`M${(27 + 6 * Math.cos(a)).toFixed(1)} ${(30 + 3 * Math.sin(a)).toFixed(1)}L${(27 + 26 * Math.cos(a)).toFixed(1)} ${(30 + 15 * Math.sin(a)).toFixed(1)}`, { stroke: pal.core, 'stroke-width': 0.8, opacity: 0.5 }, p); }
      body('M27 10L31 24L27 30L23 24Z'); el('circle', { cx: 27, cy: 30, r: 4.5, fill: 'url(#' + g + 'o)' }, p); spark(38, 14, 2); return;
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
