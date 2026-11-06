// Cửa hàng 9 Sạch (Bánh Sầu Riêng) — nhà phố 3 tầng mặt tiền bên phải đường làng, dựng theo ảnh cửa hàng khai trương thật:
// biển vàng viền xanh lá "Bánh Sầu Riêng" + logo tròn 9 SẠCH, băng rôn "TƯNG BỪNG KHAI TRƯƠNG", dải cam "Sạch là chính - ngon là mười",
// tầng trệt mở sáng đèn (tủ đông, quầy kính, kệ bánh), phông GRAND OPENING, hai giỏ hoa chúc mừng, standee "MUA 1 ĐƯỢC 3" có vòng quay + mã QR.
// DUY NHẤT khác ảnh gốc: địa chỉ ghi "124 Mậu Thân" (lấy từ STORE_9SACH.diaChi, cùng nguồn với dữ liệu va chạm ở js/world/outside.js).
// Dựng trong hệ tọa độ cục bộ: +x cục bộ hướng ra đường, nhóm quay π quanh y nên thế giới (x, z) = (front − lx, z0 − lz). Người đứng ngoài đường nhìn vào: TRÁI = lz dương, PHẢI = lz âm.
import * as THREE from 'three';
import { mulberry32 } from '../util.js';
import { pavingTexture } from './textures.js';
import { STORE_9SACH as S } from '../world/outside.js';

const FONT = (wt, px, it = '') => `${it} ${wt} ${px}px "Be Vietnam Pro", "Noto Sans", system-ui, sans-serif`.trim();
const GREEN = '#1b6f3a', YELLOW = '#f6c211', ORANGE = '#f2a31b', RED = '#d8262c';

// ---- Logo thật (assets/logo-9sach.webp): tải một lần, vẽ lại mọi texture khi tải xong; lỗi tải thì giữ bản vẽ tạm
const LOGO_URL = new URL('../../assets/logo-9sach.webp', import.meta.url).href;
let LOGO = null, logoOk = false; const redraws = [];
function loadLogo() {
  if (LOGO || typeof Image === 'undefined') return;
  LOGO = new Image(); LOGO.onload = () => { logoOk = true; redraws.forEach((f) => f()); }; LOGO.onerror = () => {}; LOGO.src = LOGO_URL;
}
function drawLogo(g, x, y, d) {
  if (logoOk) { g.drawImage(LOGO, x, y, d, d); return; }
  g.fillStyle = YELLOW; g.beginPath(); g.arc(x + d / 2, y + d / 2, d / 2, 0, Math.PI * 2); g.fill();
  g.strokeStyle = GREEN; g.lineWidth = d * 0.06; g.beginPath(); g.arc(x + d / 2, y + d / 2, d * 0.45, 0, Math.PI * 2); g.stroke();
  g.fillStyle = RED; g.font = FONT(900, d * 0.25); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('9 SẠCH', x + d / 2, y + d / 2 + d * 0.02, d * 0.7);
}

/** Texture canvas tự vẽ lại khi logo / phông chữ tải xong. */
function liveTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  const paint = () => { g.clearRect(0, 0, w, h); draw(g, w, h); t.needsUpdate = true; };
  paint(); redraws.push(paint);
  try { document.fonts?.ready?.then(paint); document.fonts?.load?.('900 64px "Be Vietnam Pro"').then(paint).catch(() => {}); } catch (e) { /* không có API phông: giữ phông dự phòng */ }
  return t;
}

function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function text(g, s, x, y, font, fill, maxW, align = 'center') { g.font = font; g.fillStyle = fill; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(s, x, y, maxW); }
/** Chữ có viền (dùng cho chữ trắng viền xanh trên phông). */
function textOutline(g, s, x, y, font, fill, stroke, lw, maxW) { g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.lineWidth = lw; g.strokeStyle = stroke; g.strokeText(s, x, y, maxW); g.fillStyle = fill; g.fillText(s, x, y, maxW); }
function limeSlice(g, cx, cy, r) {
  g.fillStyle = '#3e9b2a'; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#d6ee7a'; g.beginPath(); g.arc(cx, cy, r * 0.86, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#fbffd6'; g.lineWidth = Math.max(2, r * 0.06);
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * r * 0.84, cy + Math.sin(a) * r * 0.84); g.stroke(); }
  g.fillStyle = '#f3ffb0'; g.beginPath(); g.arc(cx, cy, r * 0.12, 0, Math.PI * 2); g.fill();
}

// ---- Các texture
/** Biển hiệu lớn: nền vàng, viền xanh lá, "Bánh Sầu Riêng", ghim địa chỉ + số điện thoại (logo tròn là mặt phẳng riêng đè lên mép trên). */
const signTex = () => liveTex(2048, 700, (g, w, h) => {
  g.fillStyle = YELLOW; g.fillRect(0, 0, w, h);
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,240,150,.35)'); gr.addColorStop(0.5, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(210,150,0,.22)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.strokeStyle = GREEN; g.lineWidth = 34; rr(g, 17, 17, w - 34, h - 34, 40); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 4; rr(g, 46, 46, w - 92, h - 92, 26); g.stroke();
  text(g, 'Bánh Sầu Riêng', w / 2, 370, FONT(800, 215), GREEN, 1740);
  // ghim địa chỉ (trái)
  const py = 604; g.fillStyle = GREEN; g.beginPath(); g.arc(150, py - 8, 26, Math.PI, 0); g.lineTo(150, py + 36); g.closePath(); g.fill(); g.fillStyle = YELLOW; g.beginPath(); g.arc(150, py - 10, 10, 0, Math.PI * 2); g.fill();
  text(g, S.diaChi, 196, py, FONT(700, 74), '#243b2b', 980, 'left');
  // điện thoại (phải)
  g.fillStyle = GREEN; g.beginPath(); g.arc(1370, py, 36, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#fff'; g.lineWidth = 11; g.lineCap = 'round'; g.beginPath(); g.arc(1370, py, 15, Math.PI * 0.78, Math.PI * 1.22, true); g.stroke(); g.beginPath(); g.arc(1370, py, 15, -Math.PI * 0.22, Math.PI * 0.22, true); g.stroke();
  text(g, S.dienThoai, 1424, py, FONT(800, 78), '#243b2b', 540, 'left');
});

/** Băng rôn khai trương nằm ngang dưới biển. */
const bannerTex = () => liveTex(2080, 300, (g, w, h) => {
  g.fillStyle = YELLOW; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.22)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(w * 0.55, 0); g.lineTo(w * 0.42, h); g.lineTo(0, h); g.fill();
  g.fillStyle = GREEN; g.fillRect(0, 0, w, 10); g.fillRect(0, h - 10, w, 10);
  drawLogo(g, 26, 34, 232);
  textOutline(g, 'TƯNG BỪNG KHAI TRƯƠNG', 930, 150, FONT(900, 138, 'italic'), GREEN, '#fff7c2', 10, 1250);
  g.fillStyle = '#fffbe8'; rr(g, 1590, 38, 220, 224, 26); g.fill(); g.strokeStyle = GREEN; g.lineWidth = 6; g.stroke();
  text(g, 'Chi nhánh', 1700, 104, FONT(700, 46), RED, 200); text(g, 'Cần Thơ', 1700, 176, FONT(900, 58), GREEN, 200);
  g.fillStyle = RED; rr(g, 1836, 38, 220, 224, 26); g.fill();
  text(g, 'MUA 1', 1946, 106, FONT(900, 70), '#fff', 200); text(g, 'ĐƯỢC 3', 1946, 190, FONT(900, 70), '#ffe45a', 200);
});

/** Dải cam trên cửa. */
const stripTex = () => liveTex(2000, 150, (g, w, h) => { g.fillStyle = ORANGE; g.fillRect(0, 0, w, h); text(g, 'Sạch là chính - ngon là mười', w / 2, h / 2 + 4, FONT(800, 92), '#1d5a30', 1700); });

/** Phông GRAND OPENING dựng trước cửa (nghiêng nhẹ): chữ trắng viền xanh, ngày khai trương, lát chanh. */
const backdropTex = () => liveTex(720, 840, (g, w, h) => {
  g.fillStyle = YELLOW; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.28)'; g.beginPath(); g.moveTo(w * 0.35, 0); g.lineTo(w * 0.7, 0); g.lineTo(w * 0.2, h); g.lineTo(-w * 0.15, h); g.fill();
  g.fillStyle = GREEN; g.beginPath(); g.moveTo(w, 0); g.lineTo(w, 150); g.lineTo(w - 190, 0); g.fill();
  drawLogo(g, 30, 30, 170);
  textOutline(g, 'GRAND', w / 2 + 20, 330, FONT(900, 130), '#fff', GREEN, 16, 620); textOutline(g, 'OPENING', w / 2 + 20, 460, FONT(900, 120), '#fff', GREEN, 16, 620);
  text(g, 'Chi nhánh Cần Thơ', w / 2, 585, FONT(800, 52), '#e8262c', 640);
  limeSlice(g, 560, 735, 105); limeSlice(g, 360, 790, 62); limeSlice(g, 90, 760, 50);
});

/** Standee cuốn màu xanh: MUA 1 ĐƯỢC 3, vòng quay may mắn, mã QR. */
const standeeTex = () => liveTex(440, 1040, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#56b64a'); gr.addColorStop(1, '#2c8a3c'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = YELLOW; rr(g, 18, 18, w - 36, 118, 20); g.fill(); text(g, 'Bánh Sầu Riêng', w / 2, 62, FONT(900, 42), GREEN, 360); text(g, '9 Sạch', w / 2, 108, FONT(800, 38), RED, 360);
  textOutline(g, 'MUA 1', w / 2, 232, FONT(900, 112), '#ffe45a', '#1c5a2a', 12, 380); textOutline(g, 'ĐƯỢC 3', w / 2, 352, FONT(900, 112), '#fff', '#1c5a2a', 12, 380);
  limeSlice(g, 90, 480, 56); limeSlice(g, 350, 470, 44);
  const cx = w / 2, cy = 640, R = 130, cols = ['#e8262c', '#ffd23a', '#fff', '#7ccf3c', '#ff8a2a', '#c36bd9', '#4fb3e8', '#f7a0c0'];
  g.fillStyle = '#fff'; g.beginPath(); g.arc(cx, cy, R + 14, 0, Math.PI * 2); g.fill();
  for (let i = 0; i < 8; i++) { g.fillStyle = cols[i]; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R, i / 8 * Math.PI * 2, (i + 1) / 8 * Math.PI * 2); g.closePath(); g.fill(); }
  g.fillStyle = '#fff'; g.beginPath(); g.arc(cx, cy, 24, 0, Math.PI * 2); g.fill(); g.fillStyle = '#e8262c'; g.beginPath(); g.moveTo(cx - 14, cy - R - 26); g.lineTo(cx + 14, cy - R - 26); g.lineTo(cx, cy - R + 8); g.fill();
  text(g, 'QUAY LÀ TRÚNG', cx, 810, FONT(900, 40), '#fff', 380);
  // mã QR giả (chỉ để trang trí; không dẫn tới đâu)
  const q = 21, m = 5, qx = (w - q * m) / 2, qy = 850, r = mulberry32(7); g.fillStyle = '#fff'; g.fillRect(qx - 8, qy - 8, q * m + 16, q * m + 16); g.fillStyle = '#111';
  for (let i = 0; i < q; i++) for (let j = 0; j < q; j++) { const fin = (i < 7 && j < 7) || (i < 7 && j > q - 8) || (i > q - 8 && j < 7); if (fin) { const a = i < 7 ? i : i - (q - 7), b = j < 7 ? j : j - (q - 7); if (a === 0 || a === 6 || b === 0 || b === 6 || (a >= 2 && a <= 4 && b >= 2 && b <= 4)) g.fillRect(qx + j * m, qy + i * m, m, m); } else if (r() < 0.5) g.fillRect(qx + j * m, qy + i * m, m, m); }
});

/** Dải băng chúc mừng treo cạnh giỏ hoa: chữ xếp dọc. */
const ribbonTex = (bg, fg, lines) => liveTex(140, 520, (g, w, h) => { g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = fg; g.fillRect(0, 0, w, 8); g.fillRect(0, h - 8, w, 8); lines.forEach((s, i) => text(g, s, w / 2, 70 + i * 92, FONT(800, 40), fg, 120)); });

/** Tranh treo tường trong tiệm: quả sầu riêng cách điệu. */
const pictureTex = () => liveTex(256, 192, (g, w, h) => {
  g.fillStyle = '#fff4c8'; g.fillRect(0, 0, w, h); g.fillStyle = '#f2c32e'; g.beginPath(); g.ellipse(w / 2, h / 2 + 6, 78, 58, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#4f9a2c'; for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, x = w / 2 + Math.cos(a) * 78, y = h / 2 + 6 + Math.sin(a) * 58; g.beginPath(); g.moveTo(x - 7, y); g.lineTo(x + 7, y); g.lineTo(x + Math.cos(a) * 14, y + Math.sin(a) * 14); g.fill(); }
  g.strokeStyle = '#8a6a1a'; g.lineWidth = 3; g.beginPath(); g.ellipse(w / 2, h / 2 + 6, 40, 30, 0, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.moveTo(w / 2 - 40, h / 2 + 6); g.lineTo(w / 2 + 40, h / 2 + 6); g.stroke();
});

// ---- Vật liệu + khối cơ bản
const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, ...o });
const glow = (c, k = 0.5) => { const m = std(c, { emissive: c, emissiveIntensity: k }); m.userData.nightGlow = { day: k, night: k * 2.4 + 0.4 }; return m; };   // Phiên 30: biển/đèn cửa hàng sáng hơn về đêm
const basic = (map, o = {}) => new THREE.MeshBasicMaterial({ map, toneMapped: false, ...o });
const glass = (c = 0x9fd0e8) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.35, depthWrite: false });
function box(w, h, d, m, x, y, z, parent) { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); parent.add(o); return o; }
function cyl(rt, rb, h, m, x, y, z, parent, seg = 10) { const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m); o.position.set(x, y, z); parent.add(o); return o; }
function ball(r, m, x, y, z, parent) { const o = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), m); o.position.set(x, y, z); parent.add(o); return o; }
/** Mặt phẳng hướng +x cục bộ (ra đường): rotation.y = π/2. `faceZ`: hướng -z / +z thay vì +x. */
function face(w, h, m, x, y, z, parent, ry = Math.PI / 2) { const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); o.rotation.y = ry; o.position.set(x, y, z); parent.add(o); return o; }
const toLocal = (p) => ({ x: S.front - p.x, z: S.z - p.z });

// ---- Thân nhà + mặt tiền
function buildFacade(g) {
  const W = S.rong, D = S.sau, cream = std(0xeadfc6), orange = glow(0xf0a21c, 0.45), col = std(0xe9a31d), brown = std(0x6b3a22);
  // sàn sân trước (gạch xám) và sàn trong tiệm (gạch be)
  const pv = pavingTexture().clone(); pv.needsUpdate = true; pv.repeat.set(1.1, 2);
  const yard = new THREE.Mesh(new THREE.PlaneGeometry(6, W), new THREE.MeshStandardMaterial({ map: pv, roughness: 0.8 })); yard.rotation.x = -Math.PI / 2; yard.position.set(3, 0.05, 0); yard.receiveShadow = true; g.add(yard);
  const tile = new THREE.Mesh(new THREE.PlaneGeometry(D, W), std(0xefe6d2)); tile.rotation.x = -Math.PI / 2; tile.position.set(-D / 2, 0.06, 0); tile.receiveShadow = true; g.add(tile);
  // thân: tầng trệt mở mặt tiền (hai cột hai bên), tầng 2-3 kín
  box(D, 6.6, W, cream, -D / 2, 6.9, 0, g);                                  // y 3.6 → 10.2
  box(D, 0.4, W + 0.3, std(0xd7ccb0), -D / 2, 10.4, 0, g);                   // mái bằng + gờ
  box(D, 0.3, W, std(0xf4ecd8), -D / 2, 3.75, 0, g);                         // trần tầng trệt
  for (const sz of [-1, 1]) { box(0.8, 3.6, 0.8, col, -0.2, 1.8, sz * (W / 2 - 0.4), g); box(D, 3.6, 0.3, orange, -D / 2, 1.8, sz * (W / 2 - 0.15), g); }
  box(0.3, 3.6, W, orange, -D + 0.15, 1.8, 0, g);                            // vách sau
  box(0.4, 0.3, W - 1.5, brown, 0.0, 3.55, 0, g);                            // dầm khung cửa
  // dải cam, băng rôn, biển
  face(10.1, 0.75, basic(stripTex()), 0.06, 4.0, 0, g);
  box(0.12, 0.07, 10.2, std(0x7a1c1c), 0.08, 4.4, 0, g);
  face(10.4, 1.5, basic(bannerTex()), 0.12, 5.2, 0, g);
  box(0.12, 0.07, 10.5, std(0x7a1c1c), 0.1, 5.98, 0, g);
  box(0.55, 3.75, 10.6, std(0x16643a), 0.22, 7.9, 0, g);                      // khung xanh lá của biển (y 6.0 → 9.8)
  face(10.2, 3.5, basic(signTex()), 0.52, 7.9, 0, g);
  // logo tròn đè lên mép trên biển
  loadLogo(); const ring = new THREE.Mesh(new THREE.CircleGeometry(1.12, 40), new THREE.MeshBasicMaterial({ color: 0x16643a })); ring.rotation.y = Math.PI / 2; ring.position.set(0.56, 9.85, 0); g.add(ring);
  const lt = liveTex(256, 256, (c) => drawLogo(c, 0, 0, 256)); const logo = new THREE.Mesh(new THREE.CircleGeometry(1.04, 40), basic(lt, { transparent: true })); logo.rotation.y = Math.PI / 2; logo.position.set(0.575, 9.85, 0); g.add(logo);
  // đèn rọi biển
  for (const z of [-3.6, -1.2, 1.2, 3.6]) box(0.18, 0.12, 0.5, std(0x333333), 0.7, 9.95, z, g);
}

// ---- Nội thất tầng trệt (sáng đèn)
function buildInterior(g) {
  const W = S.rong, D = S.sau, rnd = mulberry32(31), wood = std(0x9a6a3a), top = std(0xf6f0e0), cakeBox = [0xf6c211, 0xfff3c4, 0x4f9a2c, 0xf2a31b];
  for (const x of [-2, -4.6, -7.2]) for (const z of [-2.4, 2.4]) cyl(0.14, 0.14, 0.06, new THREE.MeshBasicMaterial({ color: 0xfffbe8 }), x, 3.58, z, g, 12);
  // quầy sau + kệ bánh
  box(0.9, 1.0, 7.6, wood, -D + 0.9, 0.5, 0, g); box(1.0, 0.06, 7.8, top, -D + 0.9, 1.03, 0, g);
  for (const y of [1.9, 2.55]) { box(0.5, 0.06, 7.2, std(0xd9b27a), -D + 0.55, y, 0, g); for (let k = 0; k < 11; k++) box(0.34, 0.3, 0.5, std(cakeBox[(rnd() * 4) | 0]), -D + 0.55, y + 0.18, -3.4 + k * 0.66, g); }
  // tủ đông (mặt kính phía trên, mặt trước vàng có logo)
  const fz = -0.6; box(1.2, 1.0, 2.9, std(0xf4f4f0), -2.3, 0.5, fz, g); box(1.22, 0.3, 2.92, std(0xf6c211), -2.3, 0.9, fz, g);
  box(1.1, 0.14, 2.8, glass(), -2.3, 1.12, fz, g);
  for (let k = 0; k < 6; k++) cyl(0.2, 0.2, 0.12, std(0xf2c32e), -2.3 + (rnd() - 0.5) * 0.4, 1.0, fz - 1.1 + k * 0.45, g, 10);
  loadLogo(); const fl = new THREE.Mesh(new THREE.CircleGeometry(0.34, 24), basic(liveTex(128, 128, (c) => drawLogo(c, 0, 0, 128)), { transparent: true })); fl.rotation.y = Math.PI / 2; fl.position.set(-2.3 + 0.62, 0.5, fz); g.add(fl);
  // quầy kính trưng bày bên trái (lz dương) + bàn thu ngân bên phải
  box(1.0, 0.9, 2.1, std(0xe08a1a), -3.3, 0.45, 2.7, g); box(0.9, 0.7, 2.0, glass(), -3.3, 1.25, 2.7, g); for (let k = 0; k < 5; k++) cyl(0.17, 0.17, 0.1, std(0xf6c211), -3.3, 0.95, 1.9 + k * 0.4, g, 10);
  box(1.0, 1.0, 1.7, std(0xf2c32e), -3.4, 0.5, -3.5, g); box(1.05, 0.06, 1.75, top, -3.4, 1.03, -3.5, g); box(0.3, 0.22, 0.3, std(0x2a2a2a), -3.4, 1.17, -3.3, g);
  // tranh treo vách trái
  const pt = pictureTex(); for (const x of [-2.6, -4.8, -7.0]) { box(1.2, 0.9, 0.06, std(0x5a3820), x, 2.2, W / 2 - 0.34, g); face(1.08, 0.78, new THREE.MeshBasicMaterial({ map: pt, toneMapped: false }), x, 2.2, W / 2 - 0.37, g, Math.PI); }
  // ghế đẩu cam ở sân trước, sát cột trái
  cyl(0.3, 0.3, 0.06, std(0xf08a1a), 0.9, 0.6, 3.5, g, 12); for (const [dx, dz] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) cyl(0.03, 0.03, 0.6, std(0x5a3820), 0.9 + dx, 0.3, 3.5 + dz, g, 5);
}

// ---- Đồ trước cửa
function buildProps(g) {
  const rnd = mulberry32(44), P = S.props;
  // phông GRAND OPENING nghiêng nhẹ về phía giữa cửa
  { const p = toLocal(P.phong), grp = new THREE.Group(); grp.position.set(p.x, 0, p.z); grp.rotation.y = 0.3;
    face(3.0, 3.5, basic(backdropTex(), { side: THREE.DoubleSide }), 0, 2.35, 0, grp); for (const lz of [-1.25, 1.25]) cyl(0.05, 0.05, 4.2, std(0x2a2a2a), -0.08, 2.1, lz, grp, 6); box(0.1, 0.1, 3.2, std(0x2a2a2a), -0.08, 4.12, 0, grp); box(0.5, 0.06, 2.7, std(0x2a2a2a), -0.3, 0.03, 0, grp); g.add(grp); }
  // giỏ hoa hồng đỏ (cao, chân ba), băng đỏ chữ vàng
  { const p = toLocal(P.hoaDo), grp = new THREE.Group(); grp.position.set(p.x, 0, p.z);
    for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; cyl(0.03, 0.03, 1.7, std(0x6a4a2a), Math.cos(a) * 0.35, 0.8, Math.sin(a) * 0.35, grp, 5).rotation.set(Math.sin(a) * 0.22, 0, -Math.cos(a) * 0.22); }
    cyl(0.5, 0.35, 0.18, std(0x3a2a1a), 0, 1.62, 0, grp, 12);
    const reds = [0xb3141c, 0xd2202a, 0x8f0f18, 0xe33a3f];
    for (let k = 0; k < 46; k++) { const a = rnd() * Math.PI * 2, t = Math.acos(rnd() * 0.95), r = 0.62 + rnd() * 0.12; ball(0.15 + rnd() * 0.07, std(reds[(rnd() * 4) | 0]), Math.sin(t) * Math.cos(a) * r, 2.05 + Math.cos(t) * r * 0.95, Math.sin(t) * Math.sin(a) * r, grp); }
    for (let k = 0; k < 9; k++) ball(0.13, std(0x2f7a35), Math.cos(k) * 0.55, 1.78, Math.sin(k) * 0.55, grp);
    face(0.5, 1.85, new THREE.MeshBasicMaterial({ map: ribbonTex('#c8161e', '#ffe08a', ['KHAI', 'TRƯƠNG', 'HỒNG', 'PHÁT']), toneMapped: false, side: THREE.DoubleSide }), 0.05, 1.05, 0.7, grp); g.add(grp); }
  // giỏ hoa hồng phấn + trắng, to hơn, băng hồng
  { const p = toLocal(P.hoaHong), grp = new THREE.Group(); grp.position.set(p.x, 0, p.z);
    for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; cyl(0.03, 0.03, 1.5, std(0x6a4a2a), Math.cos(a) * 0.4, 0.7, Math.sin(a) * 0.4, grp, 5).rotation.set(Math.sin(a) * 0.25, 0, -Math.cos(a) * 0.25); }
    cyl(0.6, 0.4, 0.18, std(0x3a2a1a), 0, 1.45, 0, grp, 12);
    const pk = [0xf4a6c0, 0xfbd0de, 0xffffff, 0xe97fa6, 0xfff0c0];
    for (let k = 0; k < 56; k++) { const a = rnd() * Math.PI * 2, t = Math.acos(rnd() * 0.95), r = 0.75 + rnd() * 0.16; ball(0.17 + rnd() * 0.09, std(pk[(rnd() * 5) | 0]), Math.sin(t) * Math.cos(a) * r, 1.95 + Math.cos(t) * r * 0.95, Math.sin(t) * Math.sin(a) * r, grp); }
    for (let k = 0; k < 10; k++) ball(0.14, std(0x3f8f45), Math.cos(k) * 0.66, 1.58, Math.sin(k) * 0.66, grp);
    face(0.55, 2.0, new THREE.MeshBasicMaterial({ map: ribbonTex('#f4a6c0', '#ffffff', ['CHÚC', 'MỪNG', 'KHAI', 'TRƯƠNG']), toneMapped: false, side: THREE.DoubleSide }), 0.05, 1.1, -0.85, grp); g.add(grp); }
  // standee cuốn xanh lá
  { const p = toLocal(P.standee), grp = new THREE.Group(); grp.position.set(p.x, 0, p.z); grp.rotation.y = -0.12;
    box(0.5, 0.12, 1.2, std(0x2a2a2a), 0, 0.06, 0, grp); face(1.1, 2.6, basic(standeeTex(), { side: THREE.DoubleSide }), 0, 1.45, 0, grp); box(0.06, 0.06, 1.14, std(0x2a2a2a), 0, 2.78, 0, grp); g.add(grp); }
}

export function buildStore9Sach() {
  loadLogo();
  const group = new THREE.Group();
  buildFacade(group); buildInterior(group); buildProps(group);
  group.position.set(S.front, 0, S.z); group.rotation.y = Math.PI;
  group.name = 'cuahang9sach';
  return group;
}
