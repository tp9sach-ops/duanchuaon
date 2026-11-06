// Tiệm điện thoại "Di Động Sen Vàng" — nhà phố mặt đường làng, BÊN TRÁI đường (đối diện hai cửa hàng bên phải), thiết kế riêng cho dự án (không dùng nhãn hiệu thật):
// biển trắng viền xanh ngọc với biểu tượng hoa sen vàng, băng rôn "MỪNG KHAI TRƯƠNG", tầng trệt kính sáng đèn (kệ điện thoại, quầy), biển trụ trên mái, dàn đèn rọi mái,
// hai dù trước cửa, hai cột bóng bay, giỏ hoa chúc mừng, hai xe máy đỗ. Nhân viên là NPC (js/world/npc.js, id nvdidong) đứng ở S.nv.
// Hệ tọa độ cục bộ: +x cục bộ hướng ra đường, nhóm KHÔNG quay (khác store9sach/tachhoa vì cửa hàng này ở bên trái đường): thế giới (x, z) = (front + lx, z0 + lz).
import * as THREE from 'three';
import { mulberry32 } from '../util.js';
import { villageTileTexture } from './textures.js';
import { STORE_DIDONG as S } from '../world/outside.js';

const FONT = (wt, px, it = '') => `${it} ${wt} ${px}px "Be Vietnam Pro", "Noto Sans", system-ui, sans-serif`.trim();
const TEAL = '#0f8f86', GOLD = '#e9b53a', CORAL = '#e8574a';

function liveTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  const paint = () => { g.clearRect(0, 0, w, h); draw(g, w, h); t.needsUpdate = true; };
  paint();
  try { document.fonts?.ready?.then(paint); document.fonts?.load?.('800 64px "Be Vietnam Pro"').then(paint).catch(() => {}); } catch (e) { /* giữ phông dự phòng */ }
  return t;
}
function text(g, s, x, y, font, fill, maxW, align = 'center') { g.font = font; g.fillStyle = fill; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(s, x, y, maxW); }

/** Hoa sen vàng: hai lớp cánh xòe hình quạt quanh nhụy. */
function lotus(g, cx, cy, r, c1, c2) {
  for (const [n, k, col] of [[7, 1, c1], [5, 0.62, c2]]) {
    g.fillStyle = col;
    for (let i = 0; i < n; i++) { g.save(); g.translate(cx, cy + r * 0.45); g.rotate((-1 + 2 * i / (n - 1)) * Math.PI * 0.42); g.beginPath(); g.ellipse(0, -r * 0.6 * k, r * 0.2 * k + 2, r * 0.6 * k, 0, 0, Math.PI * 2); g.fill(); g.restore(); }
  }
  g.fillStyle = '#fff6d8'; g.beginPath(); g.arc(cx, cy + r * 0.45, r * 0.12, 0, Math.PI * 2); g.fill();
}

/** Biển hiệu: nền trắng ngà, viền xanh ngọc, biểu tượng sen + chữ "Di Động" lớn và "SEN VÀNG" nhỏ bên dưới. */
const signTex = () => liveTex(1700, 520, (g, w, h) => {
  g.fillStyle = '#fbf8ef'; g.fillRect(0, 0, w, h); g.strokeStyle = TEAL; g.lineWidth = 22; g.strokeRect(11, 11, w - 22, h - 22);
  g.fillStyle = TEAL; g.beginPath(); g.arc(250, 260, 170, 0, Math.PI * 2); g.fill(); lotus(g, 250, 250, 150, GOLD, '#fff1b8');
  text(g, 'Di Động', 1000, 215, FONT(800, 230, 'italic'), TEAL, 1150, 'center');
  text(g, 'S E N   V À N G', 1000, 395, FONT(700, 96), '#b8871a', 1100, 'center');
});
/** Biển trụ trên mái: hai mặt giống nhau. */
const pylonTex = () => liveTex(420, 600, (g, w, h) => {
  g.fillStyle = TEAL; g.fillRect(0, 0, w, h); g.strokeStyle = '#fff1b8'; g.lineWidth = 10; g.strokeRect(10, 10, w - 20, h - 20);
  g.fillStyle = '#fbf8ef'; g.beginPath(); g.arc(w / 2, 220, 150, 0, Math.PI * 2); g.fill(); lotus(g, w / 2, 212, 128, GOLD, '#fff1b8');
  text(g, 'Di Động', w / 2, 440, FONT(800, 78, 'italic'), '#fbf8ef', 380); text(g, 'SEN VÀNG', w / 2, 520, FONT(700, 48), '#fff1b8', 380);
});
/** Băng rôn khai trương: nửa trái xanh ngọc "MỪNG KHAI TRƯƠNG", nửa phải vàng nhạt với dòng khuyến mãi chung chung (không số tiền, không thương hiệu). */
const bannerTex = () => liveTex(1800, 160, (g, w, h) => {
  g.fillStyle = CORAL; g.fillRect(0, 0, 640, h); g.fillStyle = '#fff2b0'; g.fillRect(640, 0, w - 640, h);
  text(g, 'MỪNG', 320, 50, FONT(800, 58), '#fff', 600); text(g, 'KHAI TRƯƠNG', 320, 116, FONT(800, 58), '#fff', 600);
  text(g, 'Ưu đãi lớn cho điện thoại và phụ kiện', 1240, 60, FONT(700, 58), '#0b6b64', 1100); text(g, 'Trả góp nhẹ nhàng, bảo hành tận tâm', 1240, 120, FONT(600, 44), '#c4423a', 1100);
});
/** Khung quảng cáo trong tiệm: màn hình điện thoại màu. */
const phoneTex = (a, b) => liveTex(96, 160, (g, w, h) => { g.fillStyle = '#1a1c20'; g.fillRect(0, 0, w, h); const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, a); gr.addColorStop(1, b); g.fillStyle = gr; g.fillRect(6, 10, w - 12, h - 22); g.fillStyle = '#1a1c20'; g.fillRect(w / 2 - 12, 12, 24, 5); });

const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8, ...o });
const glow = (c, k = 0.5) => { const m = std(c, { emissive: c, emissiveIntensity: k }); m.userData.nightGlow = { day: k, night: k * 2.4 + 0.4 }; return m; };   // Phiên 30: biển/đèn cửa hàng sáng hơn về đêm
const basic = (map, o = {}) => new THREE.MeshBasicMaterial({ map, toneMapped: false, ...o });
const glass = (c = 0xcfe8ff, op = 0.3) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.1, transparent: true, opacity: op, depthWrite: false });
function box(w, h, d, m, x, y, z, parent) { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); parent.add(o); return o; }
function cyl(rt, rb, h, m, x, y, z, parent, seg = 12) { const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m); o.position.set(x, y, z); parent.add(o); return o; }
function ball(r, m, x, y, z, parent) { const o = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8), m); o.position.set(x, y, z); parent.add(o); return o; }
function face(w, h, m, x, y, z, parent, ry = Math.PI / 2) { const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); o.rotation.y = ry; o.position.set(x, y, z); parent.add(o); return o; }
const toLocal = (p) => ({ x: p.x - S.front, z: p.z - S.z });

function buildFacade(g) {
  const W = S.rong, D = S.sau, teal = std(0x0f8f86, { roughness: 0.4 }), white = std(0xf4f1e8), pillar = std(0x0b6b64, { roughness: 0.4 });
  const pv = villageTileTexture().clone(); pv.needsUpdate = true; pv.repeat.set(1.1, 1.6);
  const yard = new THREE.Mesh(new THREE.PlaneGeometry(6, W), new THREE.MeshStandardMaterial({ map: pv, roughness: 0.8, color: 0xd8d8d8 })); yard.rotation.x = -Math.PI / 2; yard.position.set(3, 0.05, 0); yard.receiveShadow = true; g.add(yard);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(D, W), std(0xece8de)); floor.rotation.x = -Math.PI / 2; floor.position.set(-D / 2, 0.06, 0); floor.receiveShadow = true; g.add(floor);
  // khối nhà phía sau (mái bằng) + tường bên + tường hậu
  box(D, 4.6, W, white, -D / 2, 5.9, 0, g);                                       // tầng trên kín, y 3.6 → 8.2
  box(D, 0.3, W, std(0xe4e0d4), -D / 2, 3.75, 0, g);                              // trần tầng trệt
  box(D + 0.2, 0.3, W + 0.3, std(0xd6d2c6), -D / 2, 8.35, 0, g);                  // gờ mái
  for (const sz of [-1, 1]) box(D, 3.6, 0.3, std(0xf1eee4), -D / 2, 1.8, sz * (W / 2 - 0.15), g);
  box(0.3, 3.6, W, std(0xf1eee4), -D + 0.15, 1.8, 0, g);
  // mặt tiền tầng trệt: 5 trụ xanh ngọc (hai đầu + ba trụ giữa), kính ở giữa, cửa kính đôi ở tâm
  for (const lz of [-W / 2 + 0.25, -2.6, 2.6, W / 2 - 0.25]) box(0.5, 3.6, 0.5, pillar, 0.05, 1.8, lz, g);
  for (const [z0, z1] of [[-W / 2 + 0.5, -2.6], [2.6, W / 2 - 0.5]]) box(0.06, 3.0, z1 - z0 - 0.5, glass(0xcfe8ff, 0.28), 0.1, 1.75, (z0 + z1) / 2, g);
  box(0.06, 3.0, 5.2 - 0.5, glass(0xcfe8ff, 0.2), 0.1, 1.75, 0, g);               // cửa chính (kính đôi) rộng gần 4,7 m: lối đi thông qua, không có vật chặn
  box(0.5, 0.12, W - 0.2, pillar, 0.08, 0.06, 0, g);                              // bậc chân
  box(0.5, 0.25, W, pillar, 0.08, 3.5, 0, g);                                     // dầm trên
  // băng rôn khai trương ngay trên dầm
  face(W - 0.4, 0.9, basic(bannerTex()), 0.2, 4.1, 0, g);
  // biển hiệu: khối xanh ngọc nhô ra + mặt biển
  box(0.45, 3.5, W + 0.5, teal, 0.45, 6.4, 0, g);                                 // y 4.65 → 8.15
  face(W + 0.2, 3.2, basic(signTex()), 0.69, 6.4, 0, g);
  box(0.1, 0.1, W + 0.5, glow(0xfff1b8, 1), 0.66, 8.12, 0, g);
  // dàn đèn rọi trên mái: 8 cần cong + đầu đèn sáng
  for (let i = 0; i < 8; i++) { const lz = -W / 2 + 0.8 + i * ((W - 1.6) / 7); const arm = cyl(0.025, 0.025, 1.2, std(0x303030), 0.5, 8.9, lz, g, 5); arm.rotation.z = -0.55; box(0.28, 0.14, 0.2, glow(0xfff6d0, 0.9), 0.95, 9.4, lz, g); }
}

function buildInterior(g) {
  const D = S.sau, rnd = mulberry32(17);
  const phoneMats = [phoneTex('#16a39a', '#fff1b8'), phoneTex('#e8574a', '#ffd9a0'), phoneTex('#3b6fd8', '#bfe3ff'), phoneTex('#8a5cd6', '#f0d2ff')];
  // kệ trưng bày dọc tường hậu: 3 tầng, mỗi tầng một hàng điện thoại màn hình sáng
  box(0.3, 3.0, 8.6, std(0xf1eee4), -D + 0.5, 1.5, 0, g);
  for (let r = 0; r < 3; r++) { box(0.5, 0.06, 8.4, std(0xe0b84a), -D + 0.75, 0.9 + r * 0.8, 0, g); for (let k = 0; k < 11; k++) face(0.3, 0.5, basic(phoneMats[(rnd() * 4) | 0]), -D + 0.92, 1.2 + r * 0.8, -4 + k * 0.78, g); }
  // hai bàn trưng bày kính ở giữa tiệm + quầy tính tiền bên phải
  for (const lz of [-2.4, 2.4]) { box(1.2, 0.9, 2.4, std(0xf6f3ea), -2.8, 0.45, lz, g); box(1.24, 0.06, 2.44, glass(0xbfe6f0, 0.5), -2.8, 0.93, lz, g); for (let k = 0; k < 4; k++) box(0.16, 0.02, 0.28, std(0x202226), -2.8, 0.98, lz - 0.9 + k * 0.6, g); }
  box(1.0, 1.1, 2.6, std(0x0b6b64), -4.6, 0.55, -0.1, g); box(1.06, 0.06, 2.7, std(0xe9b53a), -4.6, 1.13, -0.1, g); box(0.4, 0.4, 0.5, std(0x202226), -4.5, 1.4, 0.4, g);
  // đèn trần: 6 tấm sáng
  for (const x of [-1.6, -3.6, -5.6]) for (const z of [-2.6, 2.6]) box(1.2, 0.05, 0.5, new THREE.MeshBasicMaterial({ color: 0xffffff }), x, 3.58, z, g);
}

function buildProps(g) {
  const rnd = mulberry32(73), P = S.props;
  // hai chiếc dù trước cửa (xanh ngọc – trắng, kẻ sọc): cột + tán nón
  { const p = toLocal(P.du); for (const [dx, dz, c] of [[0, -0.5, 0x0f8f86], [0.6, 0.7, 0xf4f1e8]]) {
      const grp = new THREE.Group(); grp.position.set(p.x + dx, 0, p.z + dz); cyl(0.04, 0.04, 2.4, std(0x555555), 0, 1.2, 0, grp, 6);
      const cone = new THREE.Mesh(new THREE.ConeGeometry(1.3, 0.5, 12, 1, true), new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, side: THREE.DoubleSide })); cone.position.y = 2.55; grp.add(cone); cyl(0.4, 0.4, 0.04, std(0xe9b53a), 0, 2.78, 0, grp, 10); g.add(grp); }
    cyl(0.5, 0.5, 0.05, std(0xf4f1e8), p.x + 0.3, 0.65, p.z + 0.1, g, 12); cyl(0.04, 0.04, 0.65, std(0x555555), p.x + 0.3, 0.33, p.z + 0.1, g, 6); }   // bàn nhỏ dưới dù
  // hai cột bóng bay (vàng + trắng xếp xen) cao ~2,6 m
  for (const k of ['bongbay1', 'bongbay2']) { const p = toLocal(P[k]); for (let i = 0; i < 9; i++) ball(0.22, std(i % 2 ? 0xf4f1e8 : 0xf0c23a, { roughness: 0.3 }), p.x + (rnd() - 0.5) * 0.12, 0.3 + i * 0.28, p.z + (rnd() - 0.5) * 0.12, g); }
  // giỏ hoa chúc mừng: giá gỗ + bó hoa nhiều màu
  { const p = toLocal(P.hoa); cyl(0.04, 0.04, 1.0, std(0x6b3a22), p.x, 0.5, p.z, g, 6); const cols = [0xe8574a, 0xf4c32a, 0xffffff, 0xf08cb6, 0x6fc7ea];
    for (let i = 0; i < 18; i++) ball(0.13, std(cols[(rnd() * cols.length) | 0], { roughness: 0.6 }), p.x + (rnd() - 0.5) * 0.5, 1.15 + rnd() * 0.5, p.z + (rnd() - 0.5) * 0.5, g);
    box(0.6, 0.35, 0.6, std(0xdff0ec), p.x, 0.95, p.z, g); }
  // hai xe máy đỗ trước cửa (một xanh ngọc, một xám)
  { const p = toLocal(P.xe); for (const [dz, c, ry] of [[-0.45, 0x2a8c84, 0.15], [0.55, 0x8a8f96, -0.1]]) {
      const grp = new THREE.Group(); grp.position.set(p.x, 0, p.z + dz); grp.rotation.y = Math.PI / 2 + ry; const body = std(c, { roughness: 0.3 }), wh = std(0x222222);
      box(1.5, 0.16, 0.42, body, 0, 0.32, 0, grp); box(0.45, 0.46, 0.4, body, 0.42, 0.58, 0, grp); box(0.1, 0.7, 0.4, body, 0.72, 0.78, 0, grp); box(0.5, 0.12, 0.34, std(0x1c1c1c), -0.4, 0.78, 0, grp); box(0.6, 0.4, 0.42, body, -0.62, 0.54, 0, grp);
      box(0.05, 0.05, 0.7, std(0xcccccc), 0.76, 1.15, 0, grp); for (const lx of [-0.65, 0.7]) cyl(0.24, 0.24, 0.1, wh, lx, 0.24, 0, grp, 14).rotation.x = Math.PI / 2; g.add(grp); } }
  // biển trụ trên mái: cột thép + tấm hai mặt xoay nhẹ ra đường
  { const grp = new THREE.Group(); grp.position.set(-1.6, 0, -W_HALF() + 0.6); cyl(0.12, 0.14, 11.5, std(0x3a3d42), 0, 5.75, 0, grp, 8);
    const panel = new THREE.Group(); panel.position.y = 12.6; panel.rotation.y = 0.4; box(0.18, 3.4, 2.4, std(0x0b6b64), 0, 0, 0, panel); face(2.2, 3.2, basic(pylonTex()), 0.1, 0, 0, panel); face(2.2, 3.2, basic(pylonTex()), -0.1, 0, 0, panel, -Math.PI / 2); grp.add(panel); g.add(grp); }
}
const W_HALF = () => S.rong / 2;

export function buildPhoneShop() {
  const group = new THREE.Group();
  buildFacade(group); buildInterior(group); buildProps(group);
  group.position.set(S.front, 0, S.z);
  group.name = 'didongsenvang';
  return group;
}
