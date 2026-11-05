// Cửa hàng trà Tách Hoa — nhà phố mặt đường làng, dựng theo ảnh khai trương: biển xanh dương sáng viền LED với logo tách-hoa và chữ "Tách Hoa" (chữ o là bông hoa),
// mái hiên xanh nhô ra có 4 đèn âm trần, tường trắng chữ xanh "Một tách trà / Một chút hương hoa", cửa mở sáng đèn (vòm xanh "Tách Hoa" + đèn tròn, rèm noren xanh nhạt,
// quầy trắng, ghế đẩu cam, tủ đông, sàn gỗ sáng), cột menu hộp màu pastel, hộp acrylic đựng cốc xanh-tím, xe tay ga hồng đỗ trước cửa.
// Cùng quy ước với js/scene/store9sach.js: hệ tọa độ cục bộ +x ra đường, nhóm quay π, thế giới (x, z) = (front − lx, z0 − lz); người đứng ngoài nhìn vào: TRÁI = lz dương, PHẢI = lz âm.
import * as THREE from 'three';
import { mulberry32 } from '../util.js';
import { pavingTexture } from './textures.js';
import { STORE_TACHHOA as S } from '../world/outside.js';

const FONT = (wt, px, it = '') => `${it} ${wt} ${px}px "Be Vietnam Pro", "Noto Sans", system-ui, sans-serif`.trim();
const BLUE = '#0b4fc4', LBLUE = '#7cc3ec';

function liveTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  const paint = () => { g.clearRect(0, 0, w, h); draw(g, w, h); t.needsUpdate = true; };
  paint();
  try { document.fonts?.ready?.then(paint); document.fonts?.load?.('800 64px "Be Vietnam Pro"').then(paint).catch(() => {}); } catch (e) { /* giữ phông dự phòng */ }
  return t;
}
function text(g, s, x, y, font, fill, maxW, align = 'center') { g.font = font; g.fillStyle = fill; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(s, x, y, maxW); }

/** Bông hoa 5 cánh (logo): cánh trắng/xanh, nhụy chấm. */
function flower(g, cx, cy, r, petal, dot) {
  g.fillStyle = petal; for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 - Math.PI / 2; g.beginPath(); g.ellipse(cx + Math.cos(a) * r * 0.5, cy + Math.sin(a) * r * 0.5, r * 0.5, r * 0.36, a, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = dot; for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 - Math.PI / 2; g.beginPath(); g.arc(cx + Math.cos(a) * r * 0.2, cy + Math.sin(a) * r * 0.2, r * 0.06, 0, Math.PI * 2); g.fill(); }
}
/** Logo tách có hoa: bát + quai + bông hoa trên miệng bát, nét trắng. */
function cupLogo(g, x, y, s, col) {
  g.strokeStyle = col; g.lineWidth = s * 0.07; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x + s * 0.12, y + s * 0.55); g.quadraticCurveTo(x + s * 0.15, y + s * 0.95, x + s * 0.5, y + s * 0.95); g.quadraticCurveTo(x + s * 0.85, y + s * 0.95, x + s * 0.88, y + s * 0.55); g.stroke();
  g.beginPath(); g.ellipse(x + s * 0.5, y + s * 0.55, s * 0.38, s * 0.1, 0, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.arc(x + s * 0.92, y + s * 0.68, s * 0.14, -Math.PI / 2, Math.PI / 2); g.stroke();
  flower(g, x + s * 0.48, y + s * 0.3, s * 0.34, col, '#0b4fc4');
}

/** Biển hiệu: nền xanh dương, viền LED trắng ấm, logo tách-hoa và chữ "Tách Hoa" với chữ o là bông hoa trong vòng tròn trắng. */
const signTex = () => liveTex(1600, 520, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0a49bb'); gr.addColorStop(1, '#0e5ed8'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#fff3cf'; g.lineWidth = 10; g.strokeRect(9, 9, w - 18, h - 18);
  cupLogo(g, 70, 90, 340, '#fff');
  const px = 190, a = 'Tách H', f = FONT(800, px, 'italic'); g.font = f; const aw = g.measureText(a).width, d = px * 0.78, bw = g.measureText('a').width, tot = aw + d + 14 + bw, x0 = 470 + (1090 - tot) / 2, cy = 300;
  g.fillStyle = 'rgba(0,30,110,.55)'; g.font = f; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(a, x0 + 8, cy + 10); g.fillStyle = '#fff'; g.fillText(a, x0, cy);
  const ox = x0 + aw + 7 + d / 2; g.fillStyle = '#fff'; g.beginPath(); g.arc(ox, cy + 18, d / 2, 0, Math.PI * 2); g.fill(); flower(g, ox, cy + 18, d * 0.4, '#0b4fc4', '#fff');
  const ax = x0 + aw + d + 14; g.fillStyle = 'rgba(0,30,110,.55)'; g.fillText('a', ax + 8, cy + 10); g.fillStyle = '#fff'; g.fillText('a', ax, cy);
});
/** Hai dòng chữ xanh viết tay trên tường trắng phía trên cửa. */
const mottoTex = () => liveTex(1300, 260, (g, w, h) => { text(g, 'Một tách trà', 40, 70, FONT(700, 100, 'italic'), '#0a3fb0', 1200, 'left'); text(g, 'Một chút hương hoa', 330, 190, FONT(700, 100, 'italic'), '#0a3fb0', 940, 'left'); });
/** Biển vòm treo trong tiệm: hai thanh vòm xanh + chữ Tách Hoa xanh. */
const archTex = () => liveTex(900, 300, (g, w, h) => {
  g.strokeStyle = '#1d6fe0'; g.lineWidth = 12; g.beginPath(); g.moveTo(40, 120); g.quadraticCurveTo(w / 2, -20, w - 40, 120); g.stroke(); g.beginPath(); g.moveTo(40, 150); g.quadraticCurveTo(w / 2, 10, w - 40, 150); g.stroke();
  g.lineWidth = 8; for (const x of [90, 300, 600, 810]) { g.beginPath(); g.moveTo(x, 70 + Math.abs(x - w / 2) * 0.12); g.lineTo(x, 150); g.stroke(); }
  g.font = FONT(800, 130, 'italic'); const a = 'Tách H', aw = g.measureText(a).width, d = 96, bw = g.measureText('a').width, x0 = (w - (aw + d + bw + 10)) / 2, cy = 175;
  g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = '#1560d8'; g.fillText(a, x0, cy); g.fillStyle = '#fff'; g.beginPath(); g.arc(x0 + aw + d / 2 + 5, cy + 10, d / 2, 0, Math.PI * 2); g.fill(); flower(g, x0 + aw + d / 2 + 5, cy + 10, d * 0.4, '#1560d8', '#fff'); g.fillStyle = '#1560d8'; g.fillText('a', x0 + aw + d + 10, cy);
});
/** Rèm noren xanh nhạt có logo mờ. */
const norenTex = () => liveTex(256, 360, (g, w, h) => { g.fillStyle = LBLUE; g.fillRect(0, 0, w, h); g.fillStyle = '#5fa9d6'; g.fillRect(0, 0, w, 14); g.fillRect(w / 2 - 2, 120, 4, h - 120); cupLogo(g, 20, 210, 90, '#fff'); });
/** Mặt hộp menu: ly nâu kem trên nền pastel. */
const cupFaceTex = (bg) => liveTex(128, 128, (g, w, h) => { g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = '#fff6e6'; g.beginPath(); g.moveTo(34, 26); g.lineTo(94, 26); g.lineTo(82, 108); g.lineTo(46, 108); g.fill(); g.fillStyle = '#7a4a2a'; g.fillRect(38, 40, 52, 30); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0, 0, w, 10); });

const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8, ...o });
const glow = (c, k = 0.5) => std(c, { emissive: c, emissiveIntensity: k });
const basic = (map, o = {}) => new THREE.MeshBasicMaterial({ map, toneMapped: false, ...o });
const glass = (c = 0xcfe8ff, op = 0.35) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.1, transparent: true, opacity: op, depthWrite: false });
function box(w, h, d, m, x, y, z, parent) { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); parent.add(o); return o; }
function cyl(rt, rb, h, m, x, y, z, parent, seg = 12) { const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m); o.position.set(x, y, z); parent.add(o); return o; }
function ball(r, m, x, y, z, parent) { const o = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8), m); o.position.set(x, y, z); parent.add(o); return o; }
function face(w, h, m, x, y, z, parent, ry = Math.PI / 2) { const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); o.rotation.y = ry; o.position.set(x, y, z); parent.add(o); return o; }
const toLocal = (p) => ({ x: S.front - p.x, z: S.z - p.z });

function buildFacade(g) {
  const W = S.rong, D = S.sau, white = std(0xf4f3ee), lit = glow(0xfafaf6, 0.4), blue = std(0x0b4fc4, { roughness: 0.35 });
  const pv = pavingTexture().clone(); pv.needsUpdate = true; pv.repeat.set(1.1, 1.6);
  const yard = new THREE.Mesh(new THREE.PlaneGeometry(6, W), new THREE.MeshStandardMaterial({ map: pv, roughness: 0.8, color: 0xd8d8d8 })); yard.rotation.x = -Math.PI / 2; yard.position.set(3, 0.05, 0); yard.receiveShadow = true; g.add(yard);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(D, W), std(0xd2b896)); floor.rotation.x = -Math.PI / 2; floor.position.set(-D / 2, 0.06, 0); floor.receiveShadow = true; g.add(floor);
  // thân: tầng trệt tường trắng có ô cửa mở (rộng 5,2 m, cao 2,5 m), tầng trên kín
  box(D, 4.4, W, white, -D / 2, 5.8, 0, g);                                   // y 3.6 → 8.0
  box(D, 0.3, W, std(0xe8e8e2), -D / 2, 3.75, 0, g);                          // trần tầng trệt
  box(D + 0.2, 0.35, W + 0.3, std(0xdcdcd6), -D / 2, 8.2, 0, g);              // gờ mái
  const side = (W - 5.2) / 2;                                                  // hai mảng tường hai bên ô cửa
  for (const sz of [-1, 1]) box(0.3, 3.6, side, white, -0.15, 1.8, sz * (5.2 / 2 + side / 2), g);
  box(0.3, 1.1, 5.2, white, -0.15, 3.05, 0, g);                                // tường trên ô cửa (3,5 − 3,6 ; chữ viết ở đây)
  for (const sz of [-1, 1]) box(D, 3.6, 0.3, lit, -D / 2, 1.8, sz * (W / 2 - 0.15), g);
  box(0.3, 3.6, W, lit, -D + 0.15, 1.8, 0, g);
  // chữ khẩu hiệu trên tường
  face(5.6, 1.12, basic(mottoTex(), { transparent: true }), 0.03, 3.0, 0.2, g);
  // mái hiên xanh nhô ra + 4 đèn âm trần + biển
  box(1.7, 0.26, W + 0.2, blue, 0.85, 3.85, 0, g);
  for (const lz of [-2.3, -0.8, 0.8, 2.3]) cyl(0.17, 0.17, 0.03, new THREE.MeshBasicMaterial({ color: 0xffffff }), 0.9, 3.7, lz, g, 16);
  box(0.4, 2.8, W + 0.2, blue, 1.55, 5.35, 0, g);                              // thân biển (y 3.95 → 6.75)
  const sg = face(W + 0.0, 2.6, basic(signTex()), 1.77, 5.35, 0, g);
  box(0.06, 0.06, W + 0.2, glow(0xfff3cf, 1), 1.76, 6.7, 0, g);
  // vòm Tách Hoa treo trong tiệm + 4 đèn tròn kem
  loadArch(g);
  // rèm noren + quầy + menu
  face(1.6, 2.25, basic(norenTex()), -D + 0.4, 1.3, -0.2, g);
}
function loadArch(g) {
  face(3.0, 1.0, basic(archTex(), { transparent: true }), -1.2, 2.9, 0, g);
  for (const lz of [-1.05, -0.35, 0.35, 1.05]) ball(0.22, glow(0xfff0c0, 0.9), -1.1, 2.4, lz, g);
}

function buildInterior(g) {
  const D = S.sau, W = S.rong, wood = std(0xe9dfd2);
  // quầy trắng + bảng menu + máy
  box(1.0, 1.1, 2.6, std(0xffffff), -3.4, 0.55, -0.6, g); box(1.06, 0.06, 2.7, std(0xe8e8e8), -3.4, 1.13, -0.6, g);
  box(0.5, 0.6, 0.9, std(0x303030), -3.3, 1.45, -0.9, g); box(0.1, 0.5, 1.2, std(0x2a6a3a), -3.9, 1.5, 0.2, g);
  // ghế đẩu cam + bàn nhỏ bên trái (lz dương)
  for (const [lx, lz] of [[-5.4, 2.8], [-6.3, 2.2], [-5.0, 1.9], [-6.2, 3.1]]) { cyl(0.26, 0.2, 0.06, std(0xf08a1a), lx, 0.52, lz, g); cyl(0.04, 0.12, 0.5, std(0xf08a1a), lx, 0.26, lz, g, 6); }
  // tủ đông trắng
  box(1.0, 0.85, 1.8, std(0xf4f4f4), -2.0, 0.43, 3.0, g); box(1.02, 0.08, 1.82, glass(0xb8d8ee, 0.5), -2.0, 0.88, 3.0, g);
  // vách tường sau có hoa văn vòm (ô trắng) — vài ô lõm giả
  const rnd = mulberry32(5); for (let i = 0; i < 12; i++) face(0.4, 0.9, std(0xe6e9ee), -D + 0.32, 1.6 + (i % 3) * 0.85, -3 + Math.floor(i / 3) * 1.5 + (rnd() - 0.5) * 0.1, g);
  for (const x of [-2, -5, -8]) for (const z of [-2, 2]) cyl(0.13, 0.13, 0.04, new THREE.MeshBasicMaterial({ color: 0xffffff }), x, 3.58, z, g, 12);
}

function buildProps(g) {
  const rnd = mulberry32(61);
  // cột menu hộp màu pastel gắn ở mảng tường bên phải cửa
  { const grp = new THREE.Group(); grp.position.set(0.55, 0, -3.25); const cols = [0xf3b27a, 0xe9d86c, 0xf3df9f, 0xf0b08a, 0xdcc9a0];
    cyl(0.04, 0.04, 3.3, std(0x2a6ab0), 0, 1.65, 0, grp, 6);
    cols.forEach((c, i) => { const b = new THREE.Group(); b.position.set(0, 0.95 + i * 0.5, 0); b.rotation.y = (i % 2 ? 0.3 : -0.25); box(0.5, 0.46, 0.5, std(c), 0, 0, 0, b); face(0.42, 0.38, basic(cupFaceTex('#' + c.toString(16).padStart(6, '0'))), 0.26, 0, 0, b); grp.add(b); });
    g.add(grp); }
  // hộp acrylic đựng cốc xanh-tím gắn cạnh mái hiên, bên phải
  { const grp = new THREE.Group(); grp.position.set(0.9, 3.2, -4.2); box(1.1, 1.3, 1.0, glass(0xf0f6ff, 0.28), 0, 0, 0, grp); const cc = [0x6fc7ea, 0xc9b6e4, 0xf0d0e6, 0x5fb4e0];
    for (let k = 0; k < 22; k++) { const m = cyl(0.12, 0.09, 0.26, std(cc[(rnd() * 4) | 0]), (rnd() - 0.5) * 0.8, -0.5 + rnd() * 0.9, (rnd() - 0.5) * 0.7, grp, 8); m.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3); }
    g.add(grp); }
  // xe tay ga hồng + mũ bảo hiểm hồng
  { const p = toLocal(S.props.xe), grp = new THREE.Group(); grp.position.set(p.x, 0, p.z); grp.rotation.y = 0.6; const pink = std(0xf6a9c4, { roughness: 0.3 }), wh = std(0x222222);
    box(1.7, 0.18, 0.5, pink, 0, 0.3, 0, grp); box(0.5, 0.5, 0.46, pink, 0.45, 0.58, 0, grp); box(0.12, 0.8, 0.46, pink, 0.8, 0.8, 0, grp);
    box(0.55, 0.14, 0.4, std(0xffffff), -0.45, 0.78, 0, grp); box(0.7, 0.44, 0.48, pink, -0.7, 0.55, 0, grp);
    box(0.06, 0.06, 0.8, std(0xdddddd), 0.85, 1.25, 0, grp); ball(0.12, glow(0xffffff, 0.8), 0.9, 1.05, 0, grp);
    for (const lx of [-0.75, 0.8]) cyl(0.26, 0.26, 0.12, wh, lx, 0.26, 0, grp, 16).rotation.x = Math.PI / 2;
    const hm = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), std(0xf6a9c4, { roughness: 0.25 })); hm.position.set(-0.45, 0.88, 0); grp.add(hm);
    g.add(grp); }
}

export function buildTachHoa() {
  const group = new THREE.Group();
  buildFacade(group); buildInterior(group); buildProps(group);
  group.position.set(S.front, 0, S.z); group.rotation.y = Math.PI;
  group.name = 'tachhoa';
  return group;
}
