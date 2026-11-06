// Siêu thị điện máy "Điện Máy Lam Sen" — nhà phố lớn BÊN TRÁI đường làng, ngay sau cổng làng. Dựng theo ảnh siêu thị điện máy mặt tiền xanh-vàng của ptg:
// khối trên trắng có hàng cửa sổ, biển xanh dương lớn chữ vàng + biểu tượng tròn vàng, dải cam ghi nhóm hàng, hai băng rôn (đỏ + xanh đậm), tầng trệt khung cam với kính lớn
// nhìn thấy tivi/tủ lạnh/máy giặt sáng đèn, dàn đèn rọi trên mái, hàng xe máy đỗ trước cửa, chồng thùng hàng bên phải. Tên và hình hiệu là của riêng dự án (không dùng nhãn hiệu/hãng thật).
// Hệ tọa độ cục bộ: +x cục bộ hướng ra đường, nhóm KHÔNG quay: thế giới (x, z) = (front + lx, z0 + lz). Cùng quy ước với js/scene/didong.js.
import * as THREE from 'three';
import { mulberry32 } from '../util.js';
import { pavingTexture } from './textures.js';
import { STORE_DIENMAY as S } from '../world/outside.js';

const FONT = (wt, px, it = '') => `${it} ${wt} ${px}px "Be Vietnam Pro", "Noto Sans", system-ui, sans-serif`.trim();
const BLUE = '#1f64d0', GOLD = '#f6c515', ORANGE = '#f2a31b';

function liveTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  const paint = () => { g.clearRect(0, 0, w, h); draw(g, w, h); t.needsUpdate = true; };
  paint();
  try { document.fonts?.ready?.then(paint); document.fonts?.load?.('800 64px "Be Vietnam Pro"').then(paint).catch(() => {}); } catch (e) { /* giữ phông dự phòng */ }
  return t;
}
function text(g, s, x, y, font, fill, maxW, align = 'center') { g.font = font; g.fillStyle = fill; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(s, x, y, maxW); }

/** Biểu tượng tròn vàng: hoa sen xanh + bóng đèn nhỏ ở giữa (ý "điện"). */
function badge(g, cx, cy, r) {
  g.fillStyle = GOLD; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
  g.fillStyle = BLUE;
  for (let i = 0; i < 7; i++) { g.save(); g.translate(cx, cy + r * 0.45); g.rotate((-1 + 2 * i / 6) * Math.PI * 0.42); g.beginPath(); g.ellipse(0, -r * 0.56, r * 0.17, r * 0.5, 0, 0, Math.PI * 2); g.fill(); g.restore(); }
  g.fillStyle = '#fff6c8'; g.beginPath(); g.arc(cx, cy - r * 0.12, r * 0.2, 0, Math.PI * 2); g.fill(); g.fillRect(cx - r * 0.08, cy + r * 0.04, r * 0.16, r * 0.1);
}
/** Biển hiệu: nền xanh dương, biểu tượng tròn, chữ "Điện máy" (nghiêng) và "LAM SEN" (đậm) vàng. */
const signTex = () => liveTex(2000, 560, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2a76e0'); gr.addColorStop(1, '#1b58bf'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  badge(g, 250, 280, 190);
  const A = 'Điện máy ', B = 'LAM SEN'; g.font = FONT(600, 250, 'italic'); const aw0 = g.measureText(A).width; g.font = FONT(800, 250); const bw0 = g.measureText(B).width;
  const k = Math.min(1, 1340 / (aw0 + bw0)), px = Math.round(250 * k), x0 = 540 + (1380 - (aw0 + bw0) * k) / 2;   // thu nhỏ vừa khung bên phải biểu tượng
  g.textAlign = 'left'; g.textBaseline = 'middle';
  g.font = FONT(600, px, 'italic'); const aw = g.measureText(A).width; g.fillStyle = 'rgba(0,0,60,.4)'; g.fillText(A, x0 + 6, 296); g.fillStyle = GOLD; g.fillText(A, x0, 290);
  g.font = FONT(800, px); g.fillStyle = 'rgba(0,0,60,.4)'; g.fillText(B, x0 + aw + 6, 296); g.fillStyle = GOLD; g.fillText(B, x0 + aw, 290);
});
/** Dải cam ghi nhóm hàng (chữ xanh đậm). */
const stripTex = () => liveTex(2000, 140, (g, w, h) => {
  g.fillStyle = ORANGE; g.fillRect(0, 0, w, h);
  text(g, 'TIVI  •  TỦ LẠNH  •  MÁY GIẶT  •  ĐIỀU HÒA  •  GIA DỤNG  •  ĐIỆN THOẠI', w / 2, h / 2, FONT(800, 62), '#12358a', 1900);
});
/** Hai băng rôn: trái đỏ, phải xanh đậm. Chữ chung chung, không số tiền, không tên hãng. */
const bannerTex = () => liveTex(2000, 200, (g, w, h) => {
  g.fillStyle = '#d8262c'; g.fillRect(0, 0, 640, h); g.fillStyle = '#15307c'; g.fillRect(640, 0, w - 640, h);
  text(g, 'RINH ƯU ĐÃI', 320, 70, FONT(800, 64), '#fff', 600); text(g, 'MÙA MUA SẮM', 320, 140, FONT(800, 64), '#ffe27a', 600);
  text(g, 'GIẢM SÂU ĐIỆN MÁY GIA DỤNG', 1320, 78, FONT(800, 78), '#ffd23a', 1300); text(g, 'Trả chậm lãi suất thấp · Giao tận nhà', 1320, 150, FONT(600, 52), '#fff', 1300);
});
/** Màn hình tivi sáng (phối màu ngẫu nhiên). */
const screenTex = (a, b) => liveTex(160, 96, (g, w, h) => { g.fillStyle = '#10141c'; g.fillRect(0, 0, w, h); const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, a); gr.addColorStop(1, b); g.fillStyle = gr; g.fillRect(5, 5, w - 10, h - 10); });
/** Cửa sổ tầng trên. */
const winTex = () => liveTex(96, 140, (g, w, h) => { g.fillStyle = '#e9edf2'; g.fillRect(0, 0, w, h); g.fillStyle = '#5a86b8'; g.fillRect(6, 6, w - 12, h - 12); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(6, 6, (w - 12) / 2 - 2, h - 12); g.fillStyle = '#e9edf2'; g.fillRect(w / 2 - 2, 6, 4, h - 12); });

const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8, ...o });
const glow = (c, k = 0.5) => std(c, { emissive: c, emissiveIntensity: k });
const basic = (map, o = {}) => new THREE.MeshBasicMaterial({ map, toneMapped: false, ...o });
const glass = (c = 0xcfe8ff, op = 0.25) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.1, transparent: true, opacity: op, depthWrite: false });
function box(w, h, d, m, x, y, z, parent) { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); parent.add(o); return o; }
function cyl(rt, rb, h, m, x, y, z, parent, seg = 12) { const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m); o.position.set(x, y, z); parent.add(o); return o; }
function face(w, h, m, x, y, z, parent, ry = Math.PI / 2) { const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); o.rotation.y = ry; o.position.set(x, y, z); parent.add(o); return o; }
const toLocal = (p) => ({ x: p.x - S.front, z: p.z - S.z });

function buildFacade(g) {
  const W = S.rong, D = S.sau, orange = std(0xf2a31b, { roughness: 0.45 }), white = std(0xeceae4), blue = std(0x1f64d0, { roughness: 0.4 });
  const pv = pavingTexture().clone(); pv.needsUpdate = true; pv.repeat.set(1.1, 2);
  const yard = new THREE.Mesh(new THREE.PlaneGeometry(6, W), new THREE.MeshStandardMaterial({ map: pv, roughness: 0.8, color: 0xd8d8d8 })); yard.rotation.x = -Math.PI / 2; yard.position.set(3, 0.05, 0); yard.receiveShadow = true; g.add(yard);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(D, W), std(0xe6e2d8)); floor.rotation.x = -Math.PI / 2; floor.position.set(-D / 2, 0.06, 0); floor.receiveShadow = true; g.add(floor);
  // thân nhà: tầng trên kín trắng (y 8.6 → 12.4) có cửa sổ, hai tường bên và tường hậu cao tới 12.4
  box(D, 3.8, W, white, -D / 2, 10.5, 0, g); box(D + 0.2, 0.3, W + 0.3, std(0xd6d2c6), -D / 2, 12.55, 0, g);
  const wt = winTex(); for (let k = 0; k < 6; k++) face(1.2, 1.9, basic(wt), 0.02, 10.5, -W / 2 + 1.1 + k * ((W - 2.2) / 5), g);
  box(D, 8.6, 0.3, std(0xe4e1d8), -D / 2, 4.3, W / 2 - 0.15, g); box(D, 8.6, 0.3, std(0xe4e1d8), -D / 2, 4.3, -W / 2 + 0.15, g); box(0.3, 8.6, W, std(0xe4e1d8), -D + 0.15, 4.3, 0, g);
  box(D, 0.3, W, std(0xe4e0d4), -D / 2, 3.45, 0, g);                              // trần tầng trệt
  // tầng trệt: 5 trụ cam, bốn ô kính lớn (cao 3,3 m); lối đi giữa là cửa kính đôi
  for (const lz of [-W / 2 + 0.3, -W / 4, 0, W / 4, W / 2 - 0.3]) box(0.5, 3.4, 0.5, orange, 0.05, 1.7, lz, g);
  for (const [c, wd] of [[-W * 3 / 8, W / 4 - 0.6], [-W / 8, W / 4 - 0.6], [W / 8, W / 4 - 0.6], [W * 3 / 8, W / 4 - 0.6]]) box(0.06, 3.0, wd, glass(0xcfe8ff, 0.22), 0.1, 1.7, c, g);
  box(0.5, 0.12, W - 0.2, orange, 0.08, 0.06, 0, g);
  // băng rôn trên kính, dải cam, biển xanh
  face(W - 0.4, 0.75, basic(bannerTex()), 0.2, 3.85, 0, g);
  box(0.55, 0.9, W + 0.2, orange, 0.28, 4.7, 0, g); face(W, 0.78, basic(stripTex()), 0.57, 4.7, 0, g);
  box(0.45, 4.1, W + 0.2, blue, 0.4, 7.2, 0, g); face(W - 0.5, 3.7, basic(signTex()), 0.64, 7.2, 0, g);
  box(0.6, 0.18, W + 0.3, orange, 0.32, 9.25, 0, g);
  // dàn đèn rọi trên mái: 10 cần cong + đầu đèn
  for (let i = 0; i < 10; i++) { const lz = -W / 2 + 0.7 + i * ((W - 1.4) / 9); const arm = cyl(0.025, 0.025, 1.3, std(0x303030), 0.4, 13.2, lz, g, 5); arm.rotation.z = -0.5; box(0.28, 0.14, 0.2, glow(0xfff6d0, 0.9), 0.85, 13.7, lz, g); }
}

function buildInterior(g) {
  const D = S.sau, rnd = mulberry32(29), pal = [['#2b7bdc', '#9fd0ff'], ['#e8574a', '#ffd9a0'], ['#16a39a', '#d8ffe9'], ['#8a5cd6', '#f0d2ff']];
  const mats = pal.map(([a, b]) => basic(screenTex(a, b)));
  // tường hậu: ba hàng tivi sáng
  box(0.3, 3.0, 11, std(0xf0eee8), -D + 0.5, 1.5, 0, g);
  for (let r = 0; r < 3; r++) for (let k = 0; k < 8; k++) face(1.0, 0.6, mats[(rnd() * 4) | 0], -D + 0.68, 0.8 + r * 0.85, -4.9 + k * 1.4, g);
  // dãy tủ lạnh, máy giặt, điều hòa trên bục giữa nhà
  for (let k = 0; k < 4; k++) { box(0.9, 1.9, 0.8, std(0xeeeeee, { roughness: 0.3 }), -2.2, 0.95, -4.4 + k * 1.15, g); box(0.04, 0.5, 0.05, std(0x999999), -1.72, 1.2, -4.4 + k * 1.15 + 0.3, g); }
  for (let k = 0; k < 4; k++) { box(0.8, 0.95, 0.8, std(0xf4f4f4, { roughness: 0.3 }), -2.2, 0.48, 1.0 + k * 1.1, g); cyl(0.26, 0.26, 0.04, glass(0x7ab8e8, 0.7), -1.78, 0.55, 1.0 + k * 1.1, g, 14).rotation.z = Math.PI / 2; }
  for (let k = 0; k < 3; k++) box(0.5, 0.35, 1.4, std(0xf4f4f4), -4.2, 2.3, -3 + k * 3, g);
  box(1.0, 1.0, 2.6, std(0x1b58bf), -5.6, 0.5, 0, g); box(1.06, 0.06, 2.7, std(GOLD), -5.6, 1.03, 0, g);   // quầy tính tiền
  for (const x of [-1.6, -3.6, -5.6]) for (const z of [-4, -1.3, 1.3, 4]) box(1.2, 0.05, 0.5, new THREE.MeshBasicMaterial({ color: 0xffffff }), x, 3.3, z, g);
}

function moto(grp, x, z, ry, c) {
  const m = new THREE.Group(); m.position.set(x, 0, z); m.rotation.y = ry; const body = std(c, { roughness: 0.35 }), wh = std(0x1d1d1d);
  box(1.5, 0.16, 0.42, body, 0, 0.32, 0, m); box(0.45, 0.46, 0.4, body, 0.42, 0.58, 0, m); box(0.1, 0.7, 0.4, body, 0.72, 0.78, 0, m); box(0.5, 0.12, 0.34, std(0x181818), -0.4, 0.78, 0, m); box(0.6, 0.4, 0.42, body, -0.62, 0.54, 0, m);
  box(0.05, 0.05, 0.7, std(0xcccccc), 0.76, 1.15, 0, m); for (const lx of [-0.65, 0.7]) cyl(0.24, 0.24, 0.1, wh, lx, 0.24, 0, m, 14).rotation.x = Math.PI / 2; grp.add(m);
}
function buildProps(g) {
  const P = S.props, rnd = mulberry32(83);
  { const p = toLocal(P.xeA); [[0, -0.9, 0x1c1c1c], [0.1, 0, 0x8b1e1e], [0, 0.9, 0x24272c]].forEach(([dx, dz, c], i) => moto(g, p.x + dx, p.z + dz, Math.PI / 2 + (i - 1) * 0.12, c)); }
  { const p = toLocal(P.xeB); [[0, -0.5, 0x2a2d33], [0.1, 0.6, 0xc9ccd2]].forEach(([dx, dz, c], i) => moto(g, p.x + dx, p.z + dz, Math.PI / 2 - 0.08 + i * 0.12, c)); }
  { const p = toLocal(P.thung); for (let lv = 0; lv < 3; lv++) for (let k = 0; k < 2 - (lv > 1 ? 1 : 0); k++) { box(0.62, 0.42, 0.62, std(0xf1ede4, { roughness: 0.7 }), p.x + (k - 0.5) * 0.62, 0.22 + lv * 0.43, p.z + (rnd() - 0.5) * 0.06, g); box(0.2, 0.12, 0.64, std(0xd8262c), p.x + (k - 0.5) * 0.62, 0.3 + lv * 0.43, p.z, g); } }
  // biển chỉ dẫn gắn trên cột trước cửa (giữ tối giản)
}

export function buildElectronicsStore() {
  const group = new THREE.Group();
  buildFacade(group); buildInterior(group); buildProps(group);
  group.position.set(S.front, 0, S.z);
  group.name = 'dienmaylamsen';
  return group;
}
