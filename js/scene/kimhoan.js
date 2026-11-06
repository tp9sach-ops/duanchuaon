// Trung tâm kim hoàn "Kim Hoàn Ngọc Lan" — nhà phố BÊN PHẢI đường làng, cạnh chợ. Dựng theo ảnh trung tâm kim hoàn mặt tiền của ptg:
// biển navy bo góc lớn với biểu tượng vàng, tường trắng ô thoi, hàng lam đứng trắng, dải biển chữ vàng nổi trên nền sọc chéo sáng, tầng trệt ốp đá xám với hai ô cửa kính vòm
// nhìn thấy quầy trang sức sáng đèn ấm, cột giữa có biểu tượng vàng, dù xanh navy + bàn bảo vệ, bảng quảng cáo đứng, xe tay ga đỗ, chậu cây lá lớn.
// Tên và hình hiệu là của riêng dự án (không dùng nhãn hiệu thật); KHÔNG chép địa chỉ, số điện thoại, khuyến mãi thật.
// Cùng quy ước với js/scene/tachhoa.js: hệ tọa độ cục bộ +x ra đường, nhóm quay π, thế giới (x, z) = (front − lx, z0 − lz).
import * as THREE from 'three';
import { mulberry32 } from '../util.js';
import { villageTileTexture } from './textures.js';
import { STORE_KIMHOAN as S } from '../world/outside.js';

const SERIF = (wt, px) => `${wt} ${px}px "Cormorant Garamond", "Be Vietnam Pro", Georgia, serif`;
const SANS = (wt, px) => `${wt} ${px}px "Be Vietnam Pro", "Noto Sans", system-ui, sans-serif`;
const NAVY = '#1f3a9c', GOLD = '#d9b25f', GOLD2 = '#f1d78d';

function liveTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  const paint = () => { g.clearRect(0, 0, w, h); draw(g, w, h); t.needsUpdate = true; };
  paint();
  try { document.fonts?.ready?.then(paint); document.fonts?.load?.('700 64px "Cormorant Garamond"').then(paint).catch(() => {}); } catch (e) { /* giữ phông dự phòng */ }
  return t;
}
function text(g, s, x, y, font, fill, maxW, align = 'center') { g.font = font; g.fillStyle = fill; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(s, x, y, maxW); }

/** Biểu tượng vàng: ba mảnh thoi chồng nhau như viên đá cắt. */
function gem(g, cx, cy, s) {
  const grad = g.createLinearGradient(cx - s, cy - s, cx + s, cy + s); grad.addColorStop(0, GOLD2); grad.addColorStop(0.5, GOLD); grad.addColorStop(1, '#a8802f');
  for (const [dy, k, a] of [[0, 1, 1], [s * 0.34, 0.8, 0.85], [s * 0.66, 0.6, 0.7]]) {
    g.globalAlpha = a; g.fillStyle = grad; g.beginPath(); g.moveTo(cx, cy - s * 0.55 * k + dy); g.lineTo(cx + s * 0.8 * k, cy + dy); g.lineTo(cx, cy + s * 0.32 * k + dy); g.lineTo(cx - s * 0.8 * k, cy + dy); g.closePath(); g.fill();
  }
  g.globalAlpha = 1;
}
/** Biển navy lớn: nền navy có ô chìm, biểu tượng vàng và chữ NGỌC LAN trắng. */
const panelTex = () => liveTex(1600, 1000, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#2a46ad'); gr.addColorStop(1, '#162c80'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(255,255,255,.06)'; g.lineWidth = 3; for (let x = 0; x <= w; x += 320) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = 0; y <= h; y += 250) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  gem(g, w / 2, 330, 250);
  text(g, 'NGỌC LAN', w / 2, 710, SERIF(700, 250), '#f3f1ea', 1400); text(g, 'K I M   H O À N', w / 2, 880, SERIF(600, 90), GOLD2, 1200);
});
/** Dải biển chữ vàng nổi trên nền sọc chéo sáng. */
const bandTex = () => liveTex(2000, 230, (g, w, h) => {
  g.fillStyle = '#e9e8e4'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(120,120,120,.28)'; g.lineWidth = 6; for (let x = -h; x < w; x += 34) { g.beginPath(); g.moveTo(x, h); g.lineTo(x + h, 0); g.stroke(); }
  g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 8; g.shadowOffsetX = 4; g.shadowOffsetY = 4;
  text(g, 'TRUNG TÂM KIM HOÀN NGỌC LAN', w / 2, 100, SANS(800, 112), '#b98f2c', 1900);
  g.shadowColor = 'transparent'; text(g, 'Trang sức · Vàng bạc · Đá quý', w / 2, 190, SANS(500, 38), '#6c6c6c', 1500);
});
/** Mặt đá xám ốp tường (đốm mịn). */
const stoneTex = () => { const t = liveTex(256, 256, (g, w, h) => { g.fillStyle = '#8a8a8a'; g.fillRect(0, 0, w, h); const r = mulberry32(5); for (let i = 0; i < 1400; i++) { const v = 100 + (r() * 90) | 0; g.fillStyle = `rgb(${v},${v},${v + 3})`; g.fillRect(r() * w, r() * h, 3 + r() * 5, 3 + r() * 5); } }); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 2); return t; };
/** Bảng quảng cáo đứng (nền xanh, chân dung giản lược, chữ trắng). */
const standTex = () => liveTex(260, 520, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2d5bc8'); gr.addColorStop(1, '#9bc3f4'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  text(g, 'Tỏa sáng', w / 2, 60, SERIF(700, 56), '#fff', 230); text(g, 'phong cách', w / 2, 112, SERIF(700, 50), '#fff', 230);
  g.fillStyle = '#f2d3b8'; g.beginPath(); g.arc(w / 2, 260, 48, 0, Math.PI * 2); g.fill(); g.fillStyle = '#2a1d1a'; g.beginPath(); g.arc(w / 2, 232, 52, Math.PI, 0); g.fill(); g.fillStyle = '#f6f6f6'; g.fillRect(w / 2 - 60, 308, 120, 150);
  gem(g, w / 2, 400, 40); text(g, 'ƯU ĐÃI THÀNH VIÊN', w / 2, 490, SANS(700, 26), '#fff', 230);
});
/** Chữ trên dù. */
const umbTex = () => liveTex(512, 96, (g, w, h) => { g.fillStyle = '#26356b'; g.fillRect(0, 0, w, h); text(g, 'KIM HOÀN NGỌC LAN · KÍNH CHÀO QUÝ KHÁCH', w / 2, h / 2, SANS(700, 26), '#e6e6ee', 500); });

const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8, ...o });
const glow = (c, k = 0.5) => { const m = std(c, { emissive: c, emissiveIntensity: k }); m.userData.nightGlow = { day: k, night: k * 2.4 + 0.4 }; return m; };   // Phiên 30: biển/đèn cửa hàng sáng hơn về đêm
const basic = (map, o = {}) => new THREE.MeshBasicMaterial({ map, toneMapped: false, ...o });
const glass = (c = 0xcfe8ff, op = 0.22) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.1, transparent: true, opacity: op, depthWrite: false });
function box(w, h, d, m, x, y, z, parent) { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); parent.add(o); return o; }
function cyl(rt, rb, h, m, x, y, z, parent, seg = 12) { const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m); o.position.set(x, y, z); parent.add(o); return o; }
function ball(r, m, x, y, z, parent) { const o = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8), m); o.position.set(x, y, z); parent.add(o); return o; }
function face(w, h, m, x, y, z, parent, ry = Math.PI / 2) { const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); o.rotation.y = ry; o.position.set(x, y, z); parent.add(o); return o; }
/** Tấm phẳng hình vòm (đáy phẳng, đỉnh bo tròn) quay ra +x, rộng w, cao h, bán kính bo r. */
function arch(w, h, r, m, x, y, z, parent) {
  const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(-w / 2, h - r); s.quadraticCurveTo(-w / 2, h, -w / 2 + r, h); s.lineTo(w / 2 - r, h); s.quadraticCurveTo(w / 2, h, w / 2, h - r); s.lineTo(w / 2, 0); s.closePath();
  const o = new THREE.Mesh(new THREE.ShapeGeometry(s), m); o.rotation.y = Math.PI / 2; o.position.set(x, y, z); parent.add(o); return o;
}
const toLocal = (p) => ({ x: S.front - p.x, z: S.z - p.z });

function buildFacade(g) {
  const W = S.rong, D = S.sau, white = std(0xf1f0ec), stone = std(0xffffff, { map: stoneTex(), roughness: 0.9 });
  const pv = villageTileTexture().clone(); pv.needsUpdate = true; pv.repeat.set(1.1, 1.8);
  const yard = new THREE.Mesh(new THREE.PlaneGeometry(6, W), new THREE.MeshStandardMaterial({ map: pv, roughness: 0.8, color: 0xcfcfcf })); yard.rotation.x = -Math.PI / 2; yard.position.set(3, 0.05, 0); yard.receiveShadow = true; g.add(yard);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(D, W), std(0xd9cbb4, { roughness: 0.4 })); floor.rotation.x = -Math.PI / 2; floor.position.set(-D / 2, 0.06, 0); floor.receiveShadow = true; g.add(floor);
  // khối trên: tường trắng (y 4.3 → 10.6); tầng trệt: trụ + tường hai bên ốp đá xám
  box(D, 6.3, W, white, -D / 2, 7.45, 0, g); box(D + 0.2, 0.3, W + 0.3, std(0xdcdad4), -D / 2, 10.75, 0, g);
  box(D, 4.3, 0.3, stone, -D / 2, 2.15, W / 2 - 0.15, g); box(D, 4.3, 0.3, stone, -D / 2, 2.15, -W / 2 + 0.15, g); box(0.3, 4.3, W, std(0xe9e4d8), -D + 0.15, 2.15, 0, g);
  // mặt tiền ốp đá xám: khối ngoài bo hai ô vòm kính + cột giữa
  const back = box(0.3, 4.3, W, stone, -0.15, 2.15, 0, g); back.name = 'mattien';
  const wl = 3.5, cz = 2.15;
  for (const sz of [-1, 1]) { const z = sz * cz; arch(wl, 3.3, 0.9, glass(0xd6e8f5, 0.22), 0.045, 0.0, z, g).position.y = 0.0; box(0.2, 0.2, wl + 0.2, std(0x6e6e6e), 0.1, 3.4, z, g); }   // kính + gờ trên vòm
  box(0.28, 4.3, 0.9, std(0x6a6a6a), 0.12, 2.15, 0, g); for (const sz of [-1, 1]) box(0.28, 4.3, 0.16, std(0x6a6a6a), 0.12, 2.15, sz * (cz + wl / 2 + 0.2), g);
  // biểu tượng vàng ở cột giữa
  { const e = glow(0xd9b25f, 0.8); face(0.5, 0.4, e, 0.28, 2.9, 0, g); box(0.05, 0.4, 0.05, e, 0.27, 2.1, 0, g); }
  // dải biển chữ vàng + hàng lam trắng đứng + biển navy bo góc
  box(0.5, 1.1, W + 0.3, std(0xe9e8e4), 0.28, 4.8, 0, g); face(W + 0.1, 0.98, basic(bandTex()), 0.54, 4.8, 0, g);
  for (let i = 0; i < 20; i++) box(0.14, 1.4, 0.12, std(0xe6e6e2), 0.25, 5.95, -W / 2 + 0.2 + i * ((W - 0.4) / 19), g);
  box(0.4, 4.6, 6.2, std(0x1f3a9c, { roughness: 0.4 }), 0.35, 8.55, 0.4, g); face(6.0, 4.4, basic(panelTex()), 0.56, 8.55, 0.4, g);
  // ô thoi mờ trên tường trắng
  const rnd = mulberry32(7); for (let i = 0; i < 6; i++) face(0.7, 0.7, std(0xe3e2de), 0.02, 7.0 + (rnd() * 3), -W / 2 + 0.9 + i * 1.5, g, Math.PI / 2).rotation.z = Math.PI / 4;
}

function buildInterior(g) {
  const D = S.sau, W = S.rong, rnd = mulberry32(31), warm = new THREE.MeshBasicMaterial({ color: 0xfff1cc });
  // quầy trang sức: hai dãy tủ kính đặt song song với mặt tiền (lz hai bên), mặt đỏ sẫm, nền vàng sáng
  for (const lz of [-2.15, 2.15]) {
    box(1.0, 1.0, 2.6, std(0x5b1a22), -2.6, 0.5, lz, g); box(1.04, 0.05, 2.64, glass(0xcfe6ee, 0.5), -2.6, 1.02, lz, g);
    for (let k = 0; k < 6; k++) { const c = rnd() > 0.5 ? 0xf0c850 : 0xe6e6f2; ball(0.05, glow(c, 0.9), -2.6, 1.07, lz - 1.0 + k * 0.4, g); }
    box(0.6, 0.06, 2.2, std(0xe9c35a, { metalness: 0.6, roughness: 0.3, emissive: 0x4a3410, emissiveIntensity: 0.4 }), -4.6, 1.2, lz, g); // tủ trưng bày sau
  }
  for (const [x, z] of [[-1.0, -2.0], [-1.0, 2.0], [-1.0, 0.0]]) { cyl(0.22, 0.18, 0.05, std(0x303030), x, 0.78, z, g, 10); cyl(0.03, 0.03, 0.75, std(0x202020), x, 0.4, z, g, 6); }   // ghế cao
  // vách sau: các hộp quà nhung màu + khung ảnh
  box(0.3, 3.2, W - 0.6, std(0x4a3a2a), -D + 0.5, 1.6, 0, g); for (let r = 0; r < 3; r++) for (let k = 0; k < 8; k++) box(0.25, 0.5, 0.7, std([0x7a1c26, 0x1f2e5c, 0xb7873a, 0x2a2a2a][(rnd() * 4) | 0]), -D + 0.72, 0.6 + r * 0.9, -3.5 + k * 1.0, g);
  for (const lz of [-3.2, 0, 3.2]) box(0.1, 1.4, 1.0, glow(0xf5e3b0, 0.5), -D + 0.8, 2.7, lz, g);
  for (const x of [-1.5, -3.5, -5.5]) for (const z of [-3, 0, 3]) cyl(0.14, 0.14, 0.04, warm, x, 3.88, z, g, 12);
}

function moto(grp, x, z, ry, c) {
  const m = new THREE.Group(); m.position.set(x, 0, z); m.rotation.y = ry; const body = std(c, { roughness: 0.3 }), wh = std(0x1d1d1d);
  box(1.6, 0.18, 0.48, body, 0, 0.3, 0, m); box(0.5, 0.5, 0.44, body, 0.45, 0.58, 0, m); box(0.12, 0.8, 0.44, body, 0.8, 0.8, 0, m); box(0.55, 0.14, 0.38, std(0x1c1c1c), -0.45, 0.78, 0, m); box(0.7, 0.44, 0.46, body, -0.7, 0.55, 0, m);
  box(0.06, 0.06, 0.78, std(0xdddddd), 0.85, 1.25, 0, m); ball(0.11, glow(0xffffff, 0.7), 0.9, 1.05, 0, m); for (const lx of [-0.75, 0.8]) cyl(0.26, 0.26, 0.12, wh, lx, 0.26, 0, m, 16).rotation.x = Math.PI / 2; grp.add(m);
}
function buildProps(g) {
  const P = S.props;
  { const p = toLocal(P.du), grp = new THREE.Group(); grp.position.set(p.x, 0, p.z); cyl(0.04, 0.04, 2.5, std(0x444444), 0, 1.25, 0, grp, 6);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.55, 14, 1, true), new THREE.MeshStandardMaterial({ color: 0x26356b, roughness: 0.7, side: THREE.DoubleSide })); cone.position.y = 2.6; grp.add(cone);
    face(1.6, 0.3, basic(umbTex()), 0.0, 2.35, 1.12, grp, 0).rotation.x = 0.0;   // vành chữ phía đường
    box(0.7, 0.9, 0.6, std(0x2b2018), -0.3, 0.45, 0.55, grp); box(0.5, 0.05, 0.4, std(0x5a4a38), -0.3, 0.92, 0.55, grp);   // quầy bảo vệ nhỏ
    cyl(0.24, 0.2, 0.05, std(0x2f6bd8), 0.55, 0.5, -0.45, grp, 8); cyl(0.03, 0.03, 0.48, std(0x555555), 0.55, 0.25, -0.45, grp, 5);   // ghế xếp xanh
    g.add(grp); }
  { const p = toLocal(P.bang), grp = new THREE.Group(); grp.position.set(p.x, 0, p.z); grp.rotation.y = Math.PI / 2 - 0.15; box(0.62, 1.4, 0.05, std(0x2a2a2a), 0, 0.82, 0, grp); face(0.54, 1.3, basic(standTex()), 0, 0.82, 0.03, grp, 0); box(0.7, 0.05, 0.3, std(0x2a2a2a), 0, 0.03, 0, grp); g.add(grp); }
  { const p = toLocal(P.xe); [[0, -0.9, 0xf0f0f2], [-0.15, 0.1, 0x1c1c1c], [0, 1.0, 0x20242c]].forEach(([dx, dz, c], i) => moto(g, p.x + dx, p.z + dz, Math.PI / 2 + (i - 1) * 0.1, c)); }
  { const p = toLocal(P.chau); cyl(0.4, 0.3, 0.7, std(0xe9e6df, { roughness: 0.6 }), p.x, 0.35, p.z, g, 14); for (let i = 0; i < 9; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), std(0x2f7a3f, { roughness: 0.7 })); l.scale.set(0.5, 1.5, 0.15); l.position.set(p.x + (i - 4) * 0.08, 1.05 + (i % 3) * 0.12, p.z + (i % 2 ? 0.1 : -0.1)); l.rotation.z = (i - 4) * 0.18; g.add(l); } }
}

export function buildJewelryStore() {
  const group = new THREE.Group();
  buildFacade(group); buildInterior(group); buildProps(group);
  group.position.set(S.front, 0, S.z); group.rotation.y = Math.PI;
  group.name = 'kimhoanngoclan';
  return group;
}
