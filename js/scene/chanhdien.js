// Chánh điện rộng (Phiên 14e): dựng THEO ĐÚNG số liệu của js/world/layout.js (HALL, COLUMNS) nên cột, tường, bàn thờ khớp va chạm.
// Nền đá cao, sàn gỗ ván dài, hai hàng cột dọc + hàng cột mặt tiền, tường lưới gỗ hai bên (nắng lọt qua đổ vạch sáng xuống sàn),
// mái hai tầng, bàn thờ ba bậc với ba pho tượng (ảnh assets/buddha.webp), đèn lồng, phướn, trống, chuông, mõ.
// Tọa độ THẾ GIỚI (group đặt ở gốc). Trả về { group, update(t, camera) } — update làm nến lung linh và xoay tượng về phía camera.
import * as THREE from 'three';
import { signTexture, coupletTexture, woodFloorTexture, pavingTexture, haloGlowTexture } from './textures.js';
import { HALL, COLUMNS } from '../world/layout.js';
import { M, roofWithRidge, box, pillar, makeLantern } from './temple.js';
import { buildBuddha } from './buddha.js';

const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...o });

function candle(parent, x, y, z, flames) {
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.7, 10), mat(0xc8322b, { emissive: 0x3a0806, emissiveIntensity: 0.6 }));
  body.position.set(x, y + 0.35, z); parent.add(body);
  const fl = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 8), new THREE.MeshBasicMaterial({ color: 0xffc860 }));
  fl.position.set(x, y + 0.82, z); parent.add(fl); flames.push(fl);
  const halo = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffa640, transparent: true, opacity: 0.22, depthWrite: false }));
  halo.position.copy(fl.position); parent.add(halo);
}

function fruitTray(parent, x, y, z, s = 1) {
  const tray = new THREE.Mesh(new THREE.CylinderGeometry(0.62 * s, 0.4 * s, 0.14 * s, 20), M.gold); tray.position.set(x, y + 0.07 * s, z); parent.add(tray);
  const cols = [0xf08a24, 0x7fb04a, 0xd8372c, 0xf2c230, 0xb06cb0];
  const pts = [[0, 0.3, 0], [0.3, 0.2, 0.1], [-0.3, 0.2, 0.1], [0.1, 0.2, -0.3], [-0.1, 0.2, 0.3], [0.05, 0.52, 0.02]];
  pts.forEach(([px, py, pz], i) => {
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.2 * s, 10, 8), mat(cols[i % cols.length], { roughness: 0.55 }));
    f.position.set(x + px * s, y + 0.1 * s + py * s, z + pz * s); parent.add(f);
  });
}

function vase(parent, x, y, z, s = 1) {
  const v = new THREE.Mesh(new THREE.CylinderGeometry(0.16 * s, 0.26 * s, 0.7 * s, 14), mat(0xd9b25f, { metalness: 0.6, roughness: 0.4 }));
  v.position.set(x, y + 0.35 * s, z); parent.add(v);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2, h = (0.55 + (i % 2) * 0.25) * s;
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, h, 5), mat(0x3f7a52));
    st.position.set(x + Math.cos(a) * 0.08 * s, y + 0.7 * s + h / 2, z + Math.sin(a) * 0.08 * s);
    st.rotation.set(Math.sin(a) * 0.2, 0, -Math.cos(a) * 0.2); parent.add(st);
    const fl = new THREE.Mesh(new THREE.SphereGeometry(0.1 * s, 8, 6), mat(i % 2 ? 0xf3b6c8 : 0xffe9d0, { emissive: 0x663344, emissiveIntensity: 0.5 }));
    fl.scale.y = 0.7; fl.position.set(x + Math.cos(a) * 0.16 * s, y + 0.7 * s + h, z + Math.sin(a) * 0.16 * s); parent.add(fl);
  }
}

function censerSmall(parent, x, y, z) {
  const b = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.26, 0.3, 16), M.bronze); b.position.set(x, y + 0.15, z); parent.add(b);
  for (let i = 0; i < 5; i++) {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.55, 4), mat(0x6b2a18)); s.position.set(x + (i - 2) * 0.07, y + 0.5, z); s.rotation.z = (i - 2) * 0.05; parent.add(s);
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.02, 5, 5), new THREE.MeshBasicMaterial({ color: 0xff5a2a })); e.position.set(x + (i - 2) * 0.07 - (i - 2) * 0.014, y + 0.78, z); parent.add(e);
  }
}

function drum(parent, x, y, z) {
  const frame = new THREE.Group(); frame.position.set(x, y, z);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 1.0, 20), mat(0xb8302a, { roughness: 0.5 })); body.rotation.z = Math.PI / 2; body.position.y = 1.3; frame.add(body);
  for (const s of [-1, 1]) {
    const skin = new THREE.Mesh(new THREE.CircleGeometry(0.58, 20), mat(0xe8d3a6)); skin.rotation.y = s * Math.PI / 2; skin.position.set(s * 0.51, 1.3, 0); frame.add(skin);
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.3, 0.9), M.wood); leg.position.set(s * 0.62, 0.65, 0); frame.add(leg);
  }
  parent.add(frame);
}

function woodenFish(parent, x, y, z) {
  const cush = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.38, 0.14, 14), mat(0xc8322b)); cush.position.set(x, y + 0.07, z); parent.add(cush);
  const mo = new THREE.Mesh(new THREE.SphereGeometry(0.26, 14, 10), mat(0x8a5a2a, { roughness: 0.55 })); mo.scale.set(1, 0.8, 1.15); mo.position.set(x, y + 0.34, z); parent.add(mo);
  const slit = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.025, 0.04), mat(0x1a0d05)); slit.position.set(x, y + 0.3, z + 0.28); parent.add(slit);
}

function bellStand(parent, x, y, z) {
  const cup = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), M.gold); cup.rotation.x = Math.PI; cup.position.set(x, y + 0.5, z); parent.add(cup);
  const st = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.36, 0.26, 12), mat(0xc8322b)); st.position.set(x, y + 0.13, z); parent.add(st);
}

export function buildChanhDien() {
  const g = new THREE.Group(), flames = [], statues = [];
  const { platX, platZ0, platZ1, wallX, wallZ0, wallZ1, h: Y0 } = HALL;
  const W = wallX * 2, D = wallZ1 - wallZ0, zc = (wallZ0 + wallZ1) / 2, H = 9.0;     // lòng điện 39 × 25,8 m, cột cao 9 m
  const yb = Y0 + H;                                                                  // đỉnh cột / đáy xà
  const front = wallZ1, back = wallZ0;

  // ----- Nền đá + mặt lát đá hiên + bậc thềm
  box(platX * 2, Y0 - 0.02, platZ1 - platZ0, M.stone, 0, (Y0 - 0.02) / 2, (platZ0 + platZ1) / 2, g);
  const slabTex = pavingTexture().clone(); slabTex.needsUpdate = true; slabTex.repeat.set(platX * 2 / 6, (platZ1 - platZ0) / 6);
  const porch = new THREE.Mesh(new THREE.PlaneGeometry(platX * 2, platZ1 - platZ0), new THREE.MeshStandardMaterial({ map: slabTex, roughness: 0.85, color: 0xd8d2c6 }));
  porch.rotation.x = -Math.PI / 2; porch.position.set(0, Y0 + 0.001, (platZ0 + platZ1) / 2); g.add(porch);
  for (let i = 0; i < 5; i++) box(10, (i + 1) * Y0 / 5, 0.88, M.stone, 0, (i + 1) * Y0 / 10, HALL.step.z1 - 0.44 - i * 0.88, g);   // 5 bậc, bậc cao nhất sát hiên
  for (const s of [-1, 1]) box(0.45, Y0 + 0.5, 4.8, M.stone, s * 5.45, (Y0 + 0.5) / 2, (HALL.step.z0 + HALL.step.z1) / 2, g);        // thành bậc

  // ----- Sàn gỗ ván dài, bóng nhẹ
  const wt = woodFloorTexture().clone(); wt.needsUpdate = true; wt.repeat.set(W / 4.8, D / 4.8);
  const woodMat = new THREE.MeshStandardMaterial({ map: wt, bumpMap: wt, bumpScale: 0.6, roughness: 0.42, metalness: 0.04, color: 0xffffff });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), woodMat);
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, Y0 + 0.004, zc); g.add(floor);

  // ----- Cột son: chân đá, thân sơn mài, mũ vàng
  const plinthM = M.stone, capM = M.gold;
  for (const c of COLUMNS) {
    const sh = new THREE.Mesh(new THREE.CylinderGeometry(c.r * 0.9, c.r, H, 24), M.lacquer); sh.position.set(c.x, Y0 + H / 2, c.z); g.add(sh);
    const pl = new THREE.Mesh(new THREE.CylinderGeometry(c.r * 1.45, c.r * 1.6, 0.34, 20), plinthM); pl.position.set(c.x, Y0 + 0.17, c.z); g.add(pl);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(c.r * 1.25, c.r * 0.95, 0.4, 20), capM); cap.position.set(c.x, yb - 0.2, c.z); g.add(cap);
  }
  // ----- Xà ngang dọc: hàng trước, hai hàng bên, ba xà ngang giữa lòng điện, xà sau
  const beam = (w, d, x, z) => box(w, 0.62, d, M.lacquer, x, yb + 0.31, z, g);
  beam(W + 3, 0.6, 0, front);
  for (const s of [-1, 1]) beam(0.6, D, s * 17, zc);
  for (const z of [-27, -33, -39, -45]) beam(34, 0.5, 0, z);
  beam(W + 1, 0.6, 0, back + 0.2);
  for (const z of [-27, -33, -39, -45]) for (let i = -3; i <= 3; i++) box(0.18, 0.5, 0.18, M.gold, i * 4.8, yb - 0.25, z, g);   // quả nhót (nút gỗ vàng) dọc xà

  // ----- Tường hậu (vữa vàng), tường bên: chân tường đặc + lưới gỗ + xà trên
  box(W + 1, H + 0.6, 0.5, M.wall, 0, Y0 + (H + 0.6) / 2, back - 0.25, g);
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(26, H - 0.6), new THREE.MeshBasicMaterial({ color: 0xffa84a, transparent: true, opacity: 0.42, depthWrite: false }));
  glow.position.set(0, Y0 + H / 2 + 0.2, back + 0.02); g.add(glow);
  const barM = new THREE.MeshStandardMaterial({ color: 0x5a2f18, roughness: 0.7 });
  const nBars = Math.floor(D / 0.34), bars = new THREE.InstancedMesh(new THREE.BoxGeometry(0.1, 5.4, 0.12), barM, nBars * 2), m4 = new THREE.Matrix4();
  for (const s of [-1, 1]) {
    box(0.5, 1.5, D, M.wall, s * (wallX + 0.25), Y0 + 0.75, zc, g);                                        // chân tường đặc
    box(0.5, H - 7.0, D, M.wall, s * (wallX + 0.25), Y0 + 7.0 + (H - 7.0) / 2, zc, g);                     // mảng tường trên
    box(0.4, 0.22, D, barM, s * (wallX + 0.1), Y0 + 1.5, zc, g); box(0.4, 0.22, D, barM, s * (wallX + 0.1), Y0 + 7.0, zc, g);   // thanh ngang
    for (let i = 0; i < nBars; i++) bars.setMatrixAt(s < 0 ? i : nBars + i, m4.makeTranslation(s * (wallX + 0.1), Y0 + 4.25, wallZ0 + 0.4 + i * 0.34));
  }
  bars.instanceMatrix.needsUpdate = true; g.add(bars);

  // ----- Trần gỗ
  const ceilT = wt.clone(); ceilT.needsUpdate = true; ceilT.repeat.set(W / 3, D / 3);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ map: ceilT, color: 0xa86a3a, roughness: 0.85, side: THREE.DoubleSide }));
  ceil.rotation.x = Math.PI / 2; ceil.position.set(0, yb + 0.02, zc); g.add(ceil);

  // ----- Hoành phi + câu đối mặt tiền
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(8.4, 2.1), new THREE.MeshBasicMaterial({ map: signTexture('DIỆU GIANG TỰ') }));
  sign.position.set(0, yb + 1.7, front + 1.4); g.add(sign);
  [['PHẬT', 'PHÁP', 'VÔ', 'BIÊN'], ['TỪ', 'BI', 'HỶ', 'XẢ']].forEach((w, i) => {
    const c = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 4.9), new THREE.MeshBasicMaterial({ map: coupletTexture(w) }));
    c.position.set(i ? 2.5 : -2.5, Y0 + 4.2, front + 0.62); g.add(c);
  });

  // ----- Mái hai tầng (đổ bóng xuống sân và lòng điện)
  const low = roofWithRidge(W + 9, D + 8, 5.0, 2.4); low.position.set(0, yb + 0.45, zc); g.add(low);
  box(W - 9, 3.8, D - 7, M.lacquer, 0, yb + 0.45 + 2.2, zc, g);
  const up = roofWithRidge(W - 3, D - 2, 4.0, 2.2); up.position.set(0, yb + 0.45 + 4.0, zc); g.add(up);

  // ----- Bàn thờ ba bậc sát tường hậu
  const aT = (w, d, y0, hh, z, c) => { box(w, hh, d, M.lacquer, 0, Y0 + y0 + hh / 2, z, g); box(w + 0.1, 0.07, d + 0.1, M.gold, 0, Y0 + y0 + hh + 0.03, z, g); };
  aT(18, 4.1, 0, 0.6, -45.45); aT(14, 3.0, 0.6, 0.6, -45.9); aT(9, 2.2, 1.2, 0.6, -46.2);
  const topY = Y0 + 1.87;
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshBasicMaterial({ map: haloGlowTexture(), transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.position.set(0, topY + 3.6, back + 0.12); g.add(halo);
  const mainB = buildBuddha(6.6); mainB.group.position.set(0, topY, -46.3); g.add(mainB.group); statues.push(mainB);
  for (const s of [-1, 1]) { const b = buildBuddha(4.2); b.group.position.set(s * 6.6, Y0 + 1.27, -45.7); g.add(b.group); statues.push(b); }

  // ----- Lễ vật trên bàn thờ
  fruitTray(g, -3.6, Y0 + 0.66, -44.2, 1.1); fruitTray(g, 3.6, Y0 + 0.66, -44.2, 1.1); fruitTray(g, -7.2, Y0 + 0.66, -44.4, 0.9); fruitTray(g, 7.2, Y0 + 0.66, -44.4, 0.9);
  for (const s of [-1, 1]) { candle(g, s * 1.6, Y0 + 0.66, -44.1, flames); candle(g, s * 5.2, Y0 + 0.66, -44.3, flames); candle(g, s * 3.4, Y0 + 1.27, -45.0, flames); candle(g, s * 8.2, Y0 + 0.66, -44.6, flames); }
  vase(g, -2.4, Y0 + 0.66, -43.9, 1.2); vase(g, 2.4, Y0 + 0.66, -43.9, 1.2); vase(g, -5.4, Y0 + 1.27, -45.0, 1.1); vase(g, 5.4, Y0 + 1.27, -45.0, 1.1);
  censerSmall(g, 0, Y0 + 0.66, -43.9);
  // bàn lễ giữa lối đi (trước bàn thờ) + lư đồng lớn
  box(3.4, 0.95, 1.3, M.lacquer, 0, Y0 + 0.475, -42.0, g); box(3.5, 0.06, 1.4, M.gold, 0, Y0 + 0.97, -42.0, g);
  censerSmall(g, 0, Y0 + 0.96, -42.0); fruitTray(g, -1.1, Y0 + 0.96, -42.0, 0.6); fruitTray(g, 1.1, Y0 + 0.96, -42.0, 0.6);

  // ----- Vật dụng trong điện: trống bên phải, chuông + mõ bên trái, phướn, đèn lồng
  drum(g, 15.4, Y0, -44.4); woodenFish(g, -14.8, Y0, -44.6); bellStand(g, -16.0, Y0, -44.6);
  for (const x of [-15, 15]) for (const z of [-30, -36, -42]) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 4.6), new THREE.MeshBasicMaterial({ color: (x + z) % 2 ? 0xd9a421 : 0xc8322b, side: THREE.DoubleSide }));
    p.position.set(x, yb - 2.9, z); g.add(p);
  }
  for (let i = 0; i < 9; i++) makeLantern(g, -17.5 + i * 4.375, yb - 0.9, front + 0.9, 0.85);
  for (const z of [-27, -33, -39]) for (const x of [-9, 0, 9]) makeLantern(g, x, yb - 1.1, z, 0.8);
  for (const x of [-12, 12]) makeLantern(g, x, yb - 1.1, -45, 0.8);

  // ----- Ánh sáng ấm trong điện (không đổ bóng)
  const lights = [];
  for (const z of [-29, -37, -44]) { const L = new THREE.PointLight(0xffb060, 42, 30, 2); L.position.set(0, Y0 + 5.2, z); g.add(L); lights.push(L); }

  // ----- Đổ bóng: mọi khối đặc đều đổ + nhận bóng; sàn/trần/tấm phẳng sáng chỉ nhận
  g.traverse((o) => {
    if (!o.isMesh || o.material.isMeshBasicMaterial || o.material.transparent) return;
    o.castShadow = o.receiveShadow = true;
  });
  floor.castShadow = porch.castShadow = ceil.castShadow = false; floor.receiveShadow = porch.receiveShadow = true;

  return {
    group: g,
    update(t, camera) {
      flames.forEach((f, i) => { const k = 1 + 0.18 * Math.sin(t * 9 + i * 1.7) * Math.sin(t * 5.3 + i); f.scale.set(1, k, 1); });
      lights.forEach((L, i) => { L.intensity = 40 + 5 * Math.sin(t * 6.1 + i) * Math.sin(t * 2.3 + i * 2); });
      if (camera) statues.forEach((b) => b.face(camera));
    },
  };
}
