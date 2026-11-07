// Khu dân cư "xóm" (Phiên 36, bước 2): đường lát gạch xuống xóm + đường giữa, 10 lô đất có cột mốc và bảng số, nhà trống thô sơ được tặng.
// Dữ liệu ở js/world/land.js (có test). refresh(land, reg) dựng lại bảng trạng thái từng lô và nhà theo xóm đang XEM.
// Nhà trống thô sơ: vách ván, mái tôn, cửa gỗ, chưa có nội thất. Phiên 37 (3b): thêm nhà lầu, nhà hoa viên, villa hồ bơi (houseModel theo cấp lv).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { villageTileTexture } from './textures.js';
import { PLOTS, LAND_WALKS, LANE_Z, LOT_W, LOT_D, HOUSE_LEVELS, houseLevel, houseRect, plotById } from '../world/land.js';

const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, ...o });
const SANS = '700 40px "Be Vietnam Pro", "Noto Sans", system-ui, sans-serif';

function labelTex(lines, colors) {
  const w = 256, h = 128, c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  const paint = () => {
    g.clearRect(0, 0, w, h); g.fillStyle = colors.bg; g.fillRect(0, 0, w, h); g.strokeStyle = colors.line; g.lineWidth = 6; g.strokeRect(4, 4, w - 8, h - 8);
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = colors.fg;
    g.font = SANS; g.fillText(lines[0], w / 2, 40, w - 24); g.font = SANS.replace('40px', '26px'); g.fillText(lines[1], w / 2, 90, w - 24); t.needsUpdate = true;
  };
  paint(); try { document.fonts?.ready?.then(paint); } catch (e) { /* giữ phông dự phòng */ }
  return t;
}
const OPEN = { bg: '#2b3a2a', line: '#8fd6bf', fg: '#f3ead4' }, MINE = { bg: '#5a3a14', line: '#f1db9f', fg: '#fff3d0' }, TAKEN = { bg: '#3a2a2a', line: '#c9a36a', fg: '#f3ead4' };

// ---- Hình nhà (Phiên 42, việc 5: chi tiết hơn). Hình/vật liệu dùng CHUNG (đánh dấu userData.shared) để 10 nhà không tốn thêm bộ nhớ; dọn nhà cũ chỉ hủy phần riêng.
// Thân nhà GIỮ NGUYÊN kích thước (hw, hd), vị trí cửa chính và hồ bơi (khớp js/world/land.js: houseRect, doorPoint, poolRect) nên va chạm/nút "Vào nhà" không đổi.
const shared = (o) => { o.userData.shared = true; return o; };
const UB = shared(new THREE.BoxGeometry(1, 1, 1)), UC = shared(new THREE.CylinderGeometry(1, 1, 1, 12)), US = shared(new THREE.SphereGeometry(1, 10, 8));
const MATS = new Map();
/** Vật liệu dùng chung theo màu + tùy chọn; glow = vật liệu sáng không phụ thuộc đèn. */
const smat = (c, o = {}) => { const k = c + JSON.stringify(o); let m = MATS.get(k); if (!m) { m = shared(new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, ...o })); MATS.set(k, m); } return m; };
const glow = (c) => { const k = 'g' + c; let m = MATS.get(k); if (!m) { m = shared(new THREE.MeshBasicMaterial({ color: c })); MATS.set(k, m); } return m; };
const WIN = () => smat(0xf0d9a0, { emissive: 0xffb050, emissiveIntensity: 0.25 });
const STONE = 0x8c867a, FRAME = 0xf2ead8, DARKW = 0x4a2f1a;
const box = (w, h, d, mat, x, y, z) => { const m = new THREE.Mesh(UB, mat); m.scale.set(w, h, d); m.position.set(x, y, z); m.castShadow = Math.max(w, h, d) > 0.6; m.receiveShadow = true; return m; };
const cyl = (r, h, mat, x, y, z) => { const m = new THREE.Mesh(UC, mat); m.scale.set(r, h, r); m.position.set(x, y, z); m.castShadow = h > 1; return m; };
const ball = (r, mat, x, y, z, sy = 1) => { const m = new THREE.Mesh(US, mat); m.scale.set(r, r * sy, r); m.position.set(x, y, z); m.castShadow = r > 0.5; return m; };
/** Chậu cây nhỏ: chậu + tán lá. */
const pot = (x, z, c = 0x3f8a3a) => { const g = new THREE.Group(); g.add(cyl(0.2, 0.34, smat(0xb0603a), x, 0.17, z), ball(0.26, smat(c), x, 0.55, z)); return g; };
/** Cửa sổ có khung, bệ và 2 cánh chớp ở mặt +z (z = mặt tường). Mặt hông dùng rotate nhóm. */
function windowAt(g, x, y, z, w, h, shut) {
  g.add(box(w + 0.16, h + 0.16, 0.05, smat(FRAME), x, y, z), box(w, h, 0.07, WIN(), x, y, z + 0.01), box(w + 0.3, 0.07, 0.17, smat(STONE), x, y - h / 2 - 0.1, z + 0.06), box(0.03, h, 0.08, smat(FRAME), x, y, z + 0.02), box(w, 0.03, 0.08, smat(FRAME), x, y, z + 0.02));
  if (shut) for (const s of [-1, 1]) g.add(box(w * 0.38, h + 0.1, 0.04, smat(shut), x + s * (w / 2 + w * 0.19 + 0.08), y, z + 0.02));
}
/** Hai cửa sổ ở hông nhà (x = ±(hw)), quay mặt ra ngoài. */
function sideWindows(g, hw, zs, ys, w, h, shut) {
  for (const sx of [-1, 1]) { const p = new THREE.Group(); p.position.set(sx * hw, 0, 0); p.rotation.y = sx * Math.PI / 2; g.add(p); for (const z of zs) for (const y of ys) windowAt(p, z * sx, y, 0.01, w, h, shut); }
}

/** Nhà trống thô sơ quay mặt ra đường (face = +1: cửa hướng +z; −1: hướng −z). Gốc nhóm ở tâm thân nhà. */
function hut(face) {
  const { hw, hd } = HOUSE_LEVELS[0], g = new THREE.Group(), fz = face * (hd + 0.04);
  const wall = smat(0x9b7a52), wall2 = smat(0x7d5f3d), roof = smat(0x8a8f96, { roughness: 0.6, metalness: 0.3 }), frame = smat(0x5a3d22);
  g.add(box(hw * 2 + 0.24, 0.2, hd * 2 + 0.24, smat(STONE), 0, 0.1, 0));                                  // nền đá
  g.add(box(hw * 2, 2.3, hd * 2, wall, 0, 1.15, 0));
  for (let i = 0; i < 6; i++) g.add(box(hw * 2 + 0.06, 0.06, hd * 2 + 0.06, wall2, 0, 0.3 + i * 0.38, 0));  // đường ván ngang
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(box(0.16, 2.3, 0.16, frame, sx * hw, 1.15, sz * hd));   // cột góc
  const sh = new THREE.Shape(); sh.moveTo(-hw - 0.5, 0); sh.lineTo(hw + 0.5, 0); sh.lineTo(0, 1.4); sh.closePath();
  const rg = new THREE.ExtrudeGeometry(sh, { depth: hd * 2 + 1, bevelEnabled: false }); rg.translate(0, 0, -hd - 0.5);
  const r = new THREE.Mesh(rg, roof); r.position.y = 2.3; r.castShadow = true; g.add(r);
  g.add(box(0.12, 0.1, hd * 2 + 1.06, smat(0x5a5f66), 0, 3.72, 0));                                       // nóc
  for (const s of [-1, 1]) g.add(box(0.05, 0.06, hd * 2 + 1.02, smat(0x6a7078), s * (hw + 0.5), 2.34, 0));  // mép mái
  g.add(box(1.15, 1.85, 0.06, frame, 0, 0.93, fz - face * 0.02), box(0.95, 1.7, 0.1, smat(DARKW), 0, 0.85, fz), box(0.06, 0.06, 0.1, smat(0xd9b25f), 0.32, 0.85, fz + face * 0.05));   // khung cửa + cánh + tay nắm
  g.add(box(1.4, 0.12, 0.5, smat(STONE), 0, 0.06 + 0.1, face * (hd + 0.4)));                                // bậc thềm
  const w = new THREE.Group(); windowAt(w, 0, 1.3, 0, 0.8, 0.7, 0x5a3d22); w.position.set(hw * 0.55, 0, fz); w.rotation.y = face > 0 ? 0 : Math.PI; g.add(w);
  for (const sz of [-0.6, 0.6]) { const p = new THREE.Group(); p.position.set(hw + 0.01, 0, sz); p.rotation.y = Math.PI / 2; windowAt(p, 0, 1.3, 0, 0.7, 0.6, 0x5a3d22); g.add(p); }   // cửa sổ hông
  g.add(pot(-hw * 0.5, face * (hd + 0.45)), pot(hw * 0.3, face * (hd + 0.45), 0x5a9a3a));
  g.add(cyl(0.3, 0.7, smat(0x4a6a8a), hw + 0.4, 0.35, -face * (hd - 0.5)));                               // thùng nước mưa
  return g;
}

/** Hai hàng cửa sổ ở mặt trước (z = +hd, hướng +z) + cửa chính có khung, hiên và bậc thềm. */
function frontDetails(g, hw, hd, floors, fh, shut) {
  const fz = hd + 0.04;
  g.add(box(1.2, 1.95, 0.07, smat(FRAME), 0, 0.98, fz - 0.01), box(0.95, 1.8, 0.1, smat(DARKW), 0, 0.9, fz), box(0.06, 0.06, 0.1, smat(0xd9b25f), 0.32, 0.9, fz + 0.05));
  for (let f = 0; f < floors; f++) for (const sx of f === 0 ? [-1, 1] : [-1, 0, 1]) windowAt(g, sx * hw * 0.55, f * fh + 1.5, fz, 0.8, 0.9, shut);
  g.add(box(1.9, 0.12, 0.6, smat(STONE), 0, 0.06, hd + 0.5), box(1.6, 0.12, 0.38, smat(STONE), 0, 0.18, hd + 0.4));   // bậc thềm
}
/** Nhà lầu 2 tầng, mái ngói chóp, ban công tầng 2. */
function mansion(hw, hd) {
  const g = new THREE.Group(), wall = smat(0xeadfc6), trim = smat(0xb89a6a), tile = smat(0xb04a2a, { roughness: 0.7 }), brick = smat(0x9a4a32);
  g.add(box(hw * 2 + 0.3, 0.35, hd * 2 + 0.3, smat(STONE), 0, 0.175, 0));                                  // bệ nhà
  g.add(box(hw * 2, 5.2, hd * 2, wall, 0, 2.6, 0), box(hw * 2 + 0.2, 0.18, hd * 2 + 0.2, trim, 0, 2.62, 0));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(box(0.3, 5.2, 0.3, trim, sx * hw, 2.6, sz * hd));   // trụ góc
  g.add(box(hw * 2 + 0.3, 0.2, hd * 2 + 0.3, trim, 0, 5.2, 0));                                            // gờ mái
  g.add(hipRoof(hw * 2 + 1, hd * 2 + 1, 1.9, 5.2, tile));
  g.add(box(0.55, 1.5, 0.55, brick, hw * 0.6, 6.1, -hd * 0.3), box(0.7, 0.1, 0.7, smat(0x6a3a28), hw * 0.6, 6.9, -hd * 0.3));   // ống khói
  frontDetails(g, hw, hd, 2, 2.6, 0x3f6a5a);
  sideWindows(g, hw, [-hd * 0.4, hd * 0.4], [1.5, 4.1], 0.8, 0.9, 0x3f6a5a);
  g.add(box(hw * 1.2, 0.12, 0.9, trim, 0, 2.6, hd + 0.45));                                                // sàn ban công (cũng là mái hiên cửa)
  for (const sx of [-1, 1]) g.add(cyl(0.09, 2.55, smat(FRAME), sx * 1.15, 1.3, hd + 0.8));                  // hai cột hiên
  for (let i = 0; i <= 6; i++) g.add(box(0.06, 0.8, 0.06, trim, -hw * 0.6 + i * hw * 0.2, 3.04, hd + 0.88));
  g.add(box(hw * 1.2, 0.07, 0.07, trim, 0, 3.46, hd + 0.88), box(0.07, 0.07, 0.9, trim, -hw * 0.6, 3.46, hd + 0.45), box(0.07, 0.07, 0.9, trim, hw * 0.6, 3.46, hd + 0.45));
  g.add(pot(-1.7, hd + 0.4), pot(1.7, hd + 0.4, 0x5a9a3a));
  return g;
}
/** Nhà hoa viên: nhà lầu + vườn trước nhà (hàng rào, lối đá, cổng vòm hoa, đèn, luống hoa, cây). */
function gardenHouse(hw, hd) {
  const g = mansion(hw, hd), grass = smat(0x5f9a4a), fence = smat(0xf3ead4), leaf = smat(0x3f8a3a), trunk = smat(0x6a4a2a), hedge = smat(0x357a35);
  const gz0 = hd + 1.4, gz1 = hd + 3.6, gw = hw * 2 - 0.2, zm = (gz0 + gz1) / 2;
  const lawn = new THREE.Mesh(new THREE.PlaneGeometry(gw, gz1 - gz0), grass); lawn.rotation.x = -Math.PI / 2; lawn.position.set(0, 0.06, zm); lawn.receiveShadow = true; g.add(lawn);
  for (const x of [-gw / 2, gw / 2]) g.add(box(0.06, 0.55, gz1 - gz0, fence, x, 0.3, zm));
  for (const s of [-1, 1]) g.add(box(gw / 2 - 0.75, 0.55, 0.06, fence, s * (gw / 4 + 0.375), 0.3, gz1));        // hàng rào trước, chừa cổng giữa
  for (const s of [-1, 1]) { g.add(box(0.14, 1.5, 0.14, fence, s * 0.7, 0.75, gz1)); g.add(ball(0.12, glow(0xffd98a), s * 0.7, 1.58, gz1)); }
  g.add(box(1.54, 0.1, 0.14, fence, 0, 1.45, gz1));                                                       // xà cổng
  for (let i = 0; i < 6; i++) g.add(ball(0.1, smat([0xe8508a, 0xf2c230, 0xffffff][i % 3]), -0.6 + i * 0.24, 1.55, gz1));   // hoa trên cổng
  for (let i = 0; i < 6; i++) g.add(box(0.9, 0.05, 0.5, smat(STONE), 0, 0.09, hd + 0.9 + i * 0.5));        // lối đá từ cửa ra cổng
  for (const x of [-gw / 2 + 0.2, gw / 2 - 0.2]) g.add(box(0.4, 0.5, gz1 - gz0 - 0.2, hedge, x, 0.31, zm));   // bờ cây xanh hai bên
  const cols = [0xe8508a, 0xf2c230, 0xffffff, 0xd9482b, 0xb06ae0];
  for (let i = 0; i < 12; i++) g.add(ball(0.17, smat(cols[i % cols.length]), -gw / 2 + 0.45 + (i % 6) * (gw - 0.9) / 5 + (i % 6 < 3 ? 0 : 0.2), 0.22, gz0 + 0.5 + (i < 6 ? 0 : 1.1)));
  for (const x of [-hw - 0.9, hw + 0.9]) g.add(box(0.22, 1.3, 0.22, trunk, x, 0.65, hd + 2.2), ball(0.95, leaf, x, 1.9, hd + 2.2));
  for (const s of [-1, 1]) { g.add(cyl(0.04, 1.1, smat(0x2a2a30), s * 1.25, 0.55, gz0 + 0.3), ball(0.12, glow(0xffe2a0), s * 1.25, 1.15, gz0 + 0.3)); }   // đèn lối đi
  g.add(box(1.2, 0.08, 0.4, smat(0x9a6a3a), -hw + 1.2, 0.42, hd + 0.5), box(0.06, 0.4, 0.34, smat(0x6a4a2a), -hw + 0.7, 0.2, hd + 0.5), box(0.06, 0.4, 0.34, smat(0x6a4a2a), -hw + 1.7, 0.2, hd + 0.5));   // ghế dài cạnh cửa
  return g;
}
/** Villa hồ bơi: khối hiện đại mái phẳng, cửa kính lớn, hồ bơi nước xanh trước nhà (hồ chỉ trang trí, va chạm hồ làm ở 3d). */
function villa(hw, hd) {
  const g = new THREE.Group(), wall = smat(0xf4f1ea), dark = smat(0x3a3f47), wood = smat(0x9a6a3a), door = smat(DARKW);
  const glass = smat(0x8fd0e8, { roughness: 0.15, metalness: 0.3, emissive: 0x2a5a70, emissiveIntensity: 0.2 });
  const rail = smat(0xcfeaf2, { roughness: 0.1, transparent: true, opacity: 0.45, depthWrite: false });
  g.add(box(hw * 2 + 0.3, 0.3, hd * 2 + 0.3, smat(0x6a665e), 0, 0.15, 0));                                  // bệ nhà
  g.add(box(hw * 2, 3, hd * 2, wall, 0, 1.5, 0));
  g.add(box(hw * 1.3, 3, hd * 1.6, wall, -hw * 0.35, 4.5, -hd * 0.2));   // tầng 2 thụt lệch
  g.add(box(hw * 2 + 0.5, 0.25, hd * 2 + 0.5, dark, 0, 3.12, 0), box(hw * 1.3 + 0.4, 0.25, hd * 1.6 + 0.4, dark, -hw * 0.35, 6.12, -hd * 0.2));
  g.add(box(hw * 0.7, 0.55, 0.05, rail, hw * 0.65, 3.52, hd - 0.05), box(0.05, 0.55, hd * 0.8, rail, hw - 0.05, 3.52, hd * 0.6));   // lan can kính sân thượng
  g.add(box(hw * 1.5, 2.2, 0.1, glass, -hw * 0.1, 1.2, hd + 0.04));   // vách kính tầng trệt
  for (let i = 0; i <= 4; i++) g.add(box(0.05, 2.3, 0.14, dark, -hw * 0.85 + i * hw * 0.375, 1.2, hd + 0.05));   // chia ô kính
  g.add(box(hw * 1.0, 1.4, 0.1, glass, -hw * 0.35, 4.3, hd * 1.4 + 0.04));
  for (let i = 0; i <= 2; i++) g.add(box(0.05, 1.5, 0.12, dark, -hw * 0.85 + i * hw * 0.5, 4.3, hd * 1.4 + 0.05));
  g.add(box(1.15, 2.05, 0.06, wood, hw * 0.65, 1.0, hd + 0.03), box(0.95, 1.9, 0.1, door, hw * 0.65, 0.95, hd + 0.05), box(0.06, 0.06, 0.1, smat(0xd9b25f), hw * 0.65 + 0.32, 0.95, hd + 0.11));
  g.add(box(hw * 0.5, 0.1, 1.1, wood, hw * 0.65, 3.0, hd + 0.5));   // mái hiên cửa
  g.add(box(1.7, 0.12, 0.5, smat(STONE), hw * 0.65, 0.06, hd + 0.45));                                      // bậc thềm
  for (let i = 0; i < 3; i++) g.add(box(0.07, 0.4, 0.05, wood, hw * 0.65 - 0.3 + i * 0.3, 3.3, hd + 0.9));   // lam gỗ trang trí
  const pw = hw * 1.7, pz0 = hd + 0.8, pz1 = hd + 3.8;
  g.add(box(pw + 0.5, 0.08, pz1 - pz0 + 0.5, wood, 0, 0.04, (pz0 + pz1) / 2));   // sàn gỗ quanh hồ
  const water = new THREE.Mesh(new THREE.PlaneGeometry(pw, pz1 - pz0), new THREE.MeshStandardMaterial({ color: 0x38b6d8, roughness: 0.1, metalness: 0.2, emissive: 0x1a6a88, emissiveIntensity: 0.35 }));
  water.rotation.x = -Math.PI / 2; water.position.set(0, 0.1, (pz0 + pz1) / 2); g.add(water);
  const cp = smat(0xf4f1ea), zc = (pz0 + pz1) / 2;   // viền hồ
  g.add(box(pw + 0.2, 0.1, 0.1, cp, 0, 0.11, pz0), box(pw + 0.2, 0.1, 0.1, cp, 0, 0.11, pz1), box(0.1, 0.1, pz1 - pz0, cp, -pw / 2, 0.11, zc), box(0.1, 0.1, pz1 - pz0, cp, pw / 2, 0.11, zc));
  for (const sx of [-1, 1]) { g.add(box(0.2, 0.9, 0.2, dark, sx * (pw / 2 + 0.3), 0.45, pz1 + 0.3), ball(0.13, glow(0xffe2a0), sx * (pw / 2 + 0.3), 1.0, pz1 + 0.3)); }   // cột cổng hồ + đèn
  for (const sx of [-0.25, 0.25]) g.add(cyl(0.025, 0.7, smat(0xc8ccd0, { metalness: 0.6 }), -pw / 2 + 0.6 + sx, 0.4, pz0 + 0.15));   // thang xuống hồ
  for (const x of [-2.9, -0.9]) g.add(box(1.8, 0.1, 0.6, wood, x, 0.28, hd + 0.4), box(1.7, 0.08, 0.55, smat(0xffffff), x, 0.36, hd + 0.4), box(0.06, 0.28, 0.5, wood, x - 0.8, 0.14, hd + 0.4), box(0.06, 0.28, 0.5, wood, x + 0.8, 0.14, hd + 0.4));   // hai ghế nằm hồ bơi
  g.add(pot(hw * 0.65 - 1.2, hd + 0.5), pot(hw * 0.65 + 1.2, hd + 0.5, 0x5a9a3a));
  return g;
}

/** Mái chóp 4 mặt phủ hình chữ nhật W×D, cao h, đáy ở y. */
function hipRoof(W, D, h, y, mat) { const m = new THREE.Mesh(new THREE.ConeGeometry(W / Math.SQRT2, h, 4), mat); m.rotation.y = Math.PI / 4; m.scale.z = D / W; m.position.y = y + h / 2; m.castShadow = true; return m; }

/** Gộp mọi khối của nhà theo (vật liệu, có đổ bóng) thành vài khối lớn: nhà có ~170 chi tiết nhưng chỉ còn ~15 lần vẽ. Không gộp được thì trả nguyên nhóm. */
function mergeStatic(root) {
  try {
    root.updateMatrixWorld(true);
    const buckets = new Map();
    root.traverse((o) => { if (!o.isMesh) return; const k = o.material, sub = buckets.get(k) || buckets.set(k, new Map()).get(k), key = o.castShadow ? 's' : 'n'; (sub.get(key) || sub.set(key, []).get(key)).push(o); });
    const out = new THREE.Group();
    for (const [mat, sub] of buckets) for (const [key, list] of sub) {
      const geos = list.map((o) => { const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); for (const n of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(n)) g.deleteAttribute(n); g.clearGroups(); g.applyMatrix4(o.matrixWorld); return g; });
      const merged = mergeGeometries(geos, false); geos.forEach((g) => g.dispose()); if (!merged) throw new Error('merge');
      for (const o of list) if (!o.geometry.userData.shared) o.geometry.dispose();
      const m = new THREE.Mesh(merged, mat); m.castShadow = key === 's'; m.receiveShadow = true; out.add(m);
    }
    return out;
  } catch (e) { return root; }
}

/** Mô hình nhà theo cấp lv, quay mặt ra đường (face = +1 hướng +z; −1 hướng −z). Gốc ở tâm thân nhà. */
export function houseModel(lv, face) {
  const L = houseLevel(lv);
  if (L.lv === 0) return mergeStatic(hut(face));
  const g = new THREE.Group(); g.add(mergeStatic(L.lv === 1 ? mansion(L.hw, L.hd) : L.lv === 2 ? gardenHouse(L.hw, L.hd) : villa(L.hw, L.hd)));
  g.rotation.y = face > 0 ? 0 : Math.PI; return g;
}

/** Dựng khu dân cư. Trả { group, refresh(land, reg, ownerName), plotPose(id) }. */
export function buildLand() {
  const group = new THREE.Group(), tile = villageTileTexture().clone(); tile.needsUpdate = true;
  const pave = (x0, x1, z0, z1, y) => { const t = tile.clone(); t.needsUpdate = true; t.repeat.set((x1 - x0) / 5.9, (z1 - z0) / 5.9); const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), new THREE.MeshStandardMaterial({ map: t, roughness: 0.85 })); m.rotation.x = -Math.PI / 2; m.position.set((x0 + x1) / 2, y, (z0 + z1) / 2); m.receiveShadow = true; group.add(m); };
  const road = LAND_WALKS[0], area = LAND_WALKS[1];
  pave(road.x0, road.x1, 146, 162, 0.052); pave(area.x0, area.x1, LANE_Z.z0, LANE_Z.z1, 0.052);
  // cột mốc bốn góc mỗi lô (InstancedMesh) + viền đá thấp phía sau
  const postG = new THREE.CylinderGeometry(0.1, 0.12, 0.9, 6); postG.translate(0, 0.45, 0);
  const posts = new THREE.InstancedMesh(postG, std(0xd9c9a0), PLOTS.length * 4), d = new THREE.Object3D(); let k = 0;
  for (const p of PLOTS) for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { d.position.set(p.x + sx * (LOT_W / 2 - 0.15), 0, p.z + sz * (LOT_D / 2 - 0.15)); d.updateMatrix(); posts.setMatrixAt(k++, d.matrix); }
  posts.castShadow = true; group.add(posts);
  // bảng cổng xóm
  const sg = new THREE.Mesh(new THREE.PlaneGeometry(5, 1.2), new THREE.MeshBasicMaterial({ map: labelTex(['KHU DÂN CƯ', 'Diệu Giang'], { bg: '#5a2a14', line: '#d9b25f', fg: '#f6d98a' }), side: THREE.DoubleSide }));
  sg.position.set(0, 3.4, 159.5); group.add(sg);
  for (const x of [-2.6, 2.6]) { const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 3.6, 6), std(0x7a2c12)); pole.position.set(x, 1.8, 159.5); pole.castShadow = true; group.add(pole); }

  const signs = new Map(), huts = new Map();
  for (const p of PLOTS) {
    const sm = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.85), new THREE.MeshBasicMaterial({ map: labelTex([`Lô ${p.id}`, '…'], OPEN), side: THREE.DoubleSide }));
    sm.position.set(p.x, 1.35, p.front.z - p.face * 0.2); sm.rotation.y = p.face > 0 ? 0 : Math.PI; group.add(sm); signs.set(p.id, sm);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.3, 6), std(0x5a3a1a)); pole.position.set(p.x, 0.65, p.front.z - p.face * 0.2); group.add(pole);
    const h = new THREE.Group(), r = houseRect(p); h.position.set((r.x0 + r.x1) / 2, 0, (r.z0 + r.z1) / 2); h.visible = false; h.userData.lv = -1; group.add(h); huts.set(p.id, h);
  }
  const labelFor = (st, owner, lv) => (st === 'mine' ? [['Nhà của bạn', houseLevel(lv).ten], MINE] : st === 'taken' ? [['Có chủ', owner || 'Hàng xóm'], TAKEN] : [['Đất trống', '100 lá bồ đề'], OPEN]);
  /** reg: sổ xóm; view: xóm đang xem; me: { xom, plot } | null. */
  function refresh(reg, view, me) {
    for (const p of PLOTS) {
      const rec = reg && reg[view] && reg[view][p.id], mine = !!(me && me.xom === view && me.plot === p.id), st = mine ? 'mine' : rec ? 'taken' : 'open';
      const [lines, colors] = labelFor(st, rec && rec.name, (mine && me.lv != null ? me.lv : rec && rec.lv) | 0), sm = signs.get(p.id), old = sm.material.map;
      sm.material.map = labelTex(lines, colors); sm.material.needsUpdate = true; if (old) old.dispose();
      const hg = huts.get(p.id), lv = houseLevel(mine && me.lv != null ? me.lv : rec && rec.lv).lv;
      if ((rec || mine) && hg.userData.lv !== lv) {   // đổi cấp: dựng lại mô hình, đặt tâm theo houseRect(plot, lv)
        for (const c of [...hg.children]) { hg.remove(c); c.traverse((o) => { if (o.geometry && !o.geometry.userData.shared) o.geometry.dispose(); if (o.material && o.material.dispose && !o.material.userData.shared) o.material.dispose(); }); }   // hình/vật liệu dùng chung (shared) thì giữ
        const r = houseRect(p, lv); hg.position.set((r.x0 + r.x1) / 2, 0, (r.z0 + r.z1) / 2); hg.add(houseModel(lv, p.face)); hg.userData.lv = lv;
      }
      hg.visible = !!rec || mine;
    }
  }
  const plotPose = (id) => { const p = plotById(id); return p ? { x: p.x, z: p.z } : null; };
  return { group, refresh, plotPose };
}
