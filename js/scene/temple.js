// Kiến trúc chùa Việt: mái đầu đao, Tam quan, chính điện, gác chuông, đèn lồng, lư hương.
import * as THREE from 'three';
import { signTexture } from './textures.js';

const M = {}; // vật liệu dùng chung, tạo một lần
export function makeMaterials() {
  M.stone = new THREE.MeshStandardMaterial({ color: 0x77808a, roughness: 0.92 });
  M.wall = new THREE.MeshStandardMaterial({ color: 0xd2a850, roughness: 0.95 });   // tường vàng
  M.lacquer = new THREE.MeshStandardMaterial({ color: 0xb8302a, roughness: 0.5, metalness: 0.05 }); // cột sơn son
  M.wood = new THREE.MeshStandardMaterial({ color: 0x6a4e3a, roughness: 0.85 });
  M.tile = new THREE.MeshStandardMaterial({ color: 0x7a665a, roughness: 0.8, side: THREE.DoubleSide });
  M.gold = new THREE.MeshStandardMaterial({ color: 0xd9b25f, roughness: 0.35, metalness: 0.7, emissive: 0x5a3e0c, emissiveIntensity: 0.8 });
  M.bronze = new THREE.MeshStandardMaterial({ color: 0xb08a3e, roughness: 0.4, metalness: 0.6 });
  M.paper = new THREE.MeshBasicMaterial({ color: 0xffc977 });                      // ô cửa sáng đèn
  M.lantern = new THREE.MeshStandardMaterial({ color: 0xc8322b, emissive: 0xff3a1f, emissiveIntensity: 1.6, roughness: 0.6 });
  return M;
}

/* Mái cong đầu đao.
   u: ngang mái (-1..1), v: dọc nóc (-1..1).
   Mặt cắt lõm (pow), mũi mái hất lên, hai đầu nóc cong vút. */
export function makeRoof(w, d, h, curl = 1.4) {
  const nu = 14, nv = 28, pos = [], idx = [];
  for (let j = 0; j <= nv; j++) {
    const v = (j / nv) * 2 - 1;
    for (let i = 0; i <= nu; i++) {
      const u = (i / nu) * 2 - 1, t = Math.abs(u), av = Math.abs(v);
      let y = h * Math.pow(1 - t, 1.7);
      y += 0.16 * h * Math.pow(t, 6);                                   // mũi mái hất lên
      y += curl * Math.pow(av, 4) * (0.3 + 0.7 * t);                    // đầu đao cong
      pos.push(u * w / 2, y, v * d / 2);
    }
  }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, e = c + 1;
    idx.push(a, c, b, b, c, e);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return new THREE.Mesh(g, M.tile);
}

// Nóc mái: thanh nóc vàng + "lưỡng long chầu nguyệt" (đĩa tròn giữa, hai cung cong hai bên)
function ridgeOrnament(len, curl) {
  const g = new THREE.Group();
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.3, len), M.gold);
  g.add(bar);
  const moon = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.12, 24), M.gold);
  moon.rotation.z = Math.PI / 2; moon.position.y = 0.6; g.add(moon);
  for (const s of [-1, 1]) {
    const arc = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.07, 6, 16, Math.PI * 1.1), M.gold);
    arc.rotation.y = Math.PI / 2; arc.rotation.z = s > 0 ? 0.2 : Math.PI - 0.2;
    arc.position.set(0, 0.45, s * 1.0); g.add(arc);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.9, 6), M.gold);   // đầu đao
    tip.position.set(0, curl + 0.15, s * (len / 2)); tip.rotation.x = s * 0.5; g.add(tip);
  }
  return g;
}

function roofWithRidge(w, d, h, curl) {
  const g = new THREE.Group();
  g.add(makeRoof(w, d, h, curl));
  const r = ridgeOrnament(d, curl); r.position.y = h + 0.12; g.add(r);
  return g;
}

function box(w, h, d, mat, x, y, z, parent) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z); parent.add(m); return m;
}
function pillar(r, h, mat, x, y, z, parent) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.9, r, h, 14), mat);
  m.position.set(x, y + h / 2, z); parent.add(m); return m;
}

export function makeLantern(parent, x, y, z, s = 1) {
  const l = new THREE.Mesh(new THREE.SphereGeometry(0.5 * s, 16, 12), M.lantern);
  l.scale.y = 0.82; l.position.set(x, y, z); parent.add(l);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.2 * s, 0.26 * s, 0.1 * s, 10), M.gold);
  cap.position.set(x, y + 0.44 * s, z); parent.add(cap);
  const tassel = new THREE.Mesh(new THREE.CylinderGeometry(0.04 * s, 0.04 * s, 0.5 * s, 6), M.gold);
  tassel.position.set(x, y - 0.6 * s, z); parent.add(tassel);
  return l;
}

/* Tam quan: bốn trụ vuông lớn, ba lối đi, lầu gác hai tầng mái, hoành phi chữ Việt. */
export function buildTamQuan() {
  const g = new THREE.Group();
  const W = 22, pillarX = [-W / 2, -4.2, 4.2, W / 2], H = 8;
  box(W + 4, 0.8, 5.5, M.stone, 0, 0.4, 0, g);                                // bệ
  pillarX.forEach((x) => box(1.7, H, 1.7, M.wall, x, 0.8 + H / 2, 0, g));     // trụ vuông
  // Hai trụ phụ cao hơn kiểu "trụ biểu" ở lối giữa
  [-4.2, 4.2].forEach((x) => { box(1.1, 3, 1.1, M.wall, x, 0.8 + H + 1.5, 0, g);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 10), M.gold); lamp.position.set(x, 0.8 + H + 3.4, 0); g.add(lamp); });
  box(W + 1.6, 1.0, 2.4, M.lacquer, 0, 0.8 + H - 0.5, 0, g);                  // xà ngang
  // Lầu gác giữa
  box(8.4, 3.2, 3.4, M.lacquer, 0, 0.8 + H + 1.6 + 0.5, 0, g);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 1.65),
    new THREE.MeshBasicMaterial({ map: signTexture('DIỆU GIANG TỰ') }));
  sign.position.set(0, 0.8 + H + 2.2, 1.75); g.add(sign);                      // hoành phi
  const roofMid = roofWithRidge(11.5, 6.4, 2.6, 1.3); roofMid.position.y = 0.8 + H + 3.4; g.add(roofMid);
  // Hai mái thấp hai bên
  for (const s of [-1, 1]) {
    const r = roofWithRidge(5.8, 6.6, 1.6, 1.0); r.position.set(s * 9.2, 0.8 + H + 0.6, 0); g.add(r);
    box(5, 1.6, 2.4, M.lacquer, s * 9.2, 0.8 + H - 0.3 + 1.4, 0, g);
  }
  // Đèn lồng treo dưới xà
  [-8, -3, 0, 3, 8].forEach((x) => makeLantern(g, x, 0.8 + H - 1.5, 1.3, 0.8));
  // Cổng tròn giữa: cánh cửa gỗ mở hé, ánh đèn sau cổng
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(6.2, 6.4), new THREE.MeshBasicMaterial({ color: 0xffb25e, transparent: true, opacity: 0.2 }));
  glow.position.set(0, 0.8 + 3.2, -0.2); g.add(glow);
  return g;
}

/* Chính điện: bệ đá, hai hàng cột sơn son, tường sau, mái chồng diêm hai tầng, cửa sáng đèn. */
export function buildHall() {
  const g = new THREE.Group();
  const W = 28, D = 15, H = 6.2;
  box(W + 6, 1.5, D + 6, M.stone, 0, 0.75, 0, g);                              // bệ
  for (let i = 0; i < 7; i++) box(10 - i * 0.2, 0.22, 0.8, M.stone, 0, 0.11 + i * 0.2, D / 2 + 3 + (6 - i) * 0.8 - 0.4, g); // bậc thềm
  const y0 = 1.5;
  // Hai hàng cột mặt trước + cột trong
  for (let i = 0; i < 7; i++) {
    const x = -W / 2 + 1.5 + i * ((W - 3) / 6);
    pillar(0.42, H, M.lacquer, x, y0, D / 2 - 1, g);
    pillar(0.42, H, M.lacquer, x, y0, -D / 2 + 1, g);
  }
  box(W - 1, H, 0.5, M.wall, 0, y0 + H / 2, -D / 2 + 0.3, g);                  // tường hậu
  // Gian giữa phát sáng (ánh nến, bàn thờ)
  const inner = new THREE.Mesh(new THREE.PlaneGeometry(W - 6, H - 1.2), new THREE.MeshBasicMaterial({ color: 0xffb35c }));
  inner.position.set(0, y0 + H / 2 - 0.2, -D / 2 + 0.6); g.add(inner);
  // Cửa lùa: khung gỗ chia ô (giữ nhịp sáng/tối)
  for (let i = 0; i <= 9; i++) box(0.12, H - 1, 0.1, M.wood, -((W - 6) / 2) + i * ((W - 6) / 9), y0 + H / 2 - 0.2, -D / 2 + 0.7, g);
  for (let j = 0; j <= 4; j++) box(W - 6, 0.1, 0.1, M.wood, 0, y0 + 0.5 + j * ((H - 1.4) / 4), -D / 2 + 0.7, g);
  // Xà + bảng
  box(W + 1, 0.9, D, M.lacquer, 0, y0 + H + 0.2, 0, g);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 1.9), new THREE.MeshBasicMaterial({ map: signTexture('ĐẠI HÙNG BẢO ĐIỆN') }));
  sign.position.set(0, y0 + H + 1.4, D / 2 + 0.35); g.add(sign);
  // Mái hai tầng
  const low = roofWithRidge(W + 7, D + 5, 3.4, 1.8); low.position.y = y0 + H + 0.7; g.add(low);
  box(W - 6, 2.6, D - 4, M.lacquer, 0, y0 + H + 0.9 + 1.3, 0, g);
  const up = roofWithRidge(W - 2, D, 3.2, 2.0); up.position.y = y0 + H + 3.5; g.add(up);
  // Đèn lồng dọc hiên
  for (let i = 0; i < 6; i++) makeLantern(g, -W / 2 + 3 + i * ((W - 6) / 5), y0 + H - 0.6, D / 2 + 1.4, 0.85);
  return g;
}

/* Gác chuông: bốn cột, hai tầng mái, quả chuông đồng bên trong. Trả về { group, bell }. */
export function buildBellTower() {
  const g = new THREE.Group();
  box(8, 0.9, 8, M.stone, 0, 0.45, 0, g);
  box(6.4, 3.4, 6.4, M.wall, 0, 0.9 + 1.7, 0, g);                              // tầng dưới xây
  const y1 = 0.9 + 3.4;
  [[-2.8, -2.8], [2.8, -2.8], [-2.8, 2.8], [2.8, 2.8]].forEach(([x, z]) => pillar(0.3, 4.2, M.lacquer, x, y1 + 1.4, z, g));
  const r1 = roofWithRidge(9.2, 9.2, 2.2, 1.2); r1.position.y = y1 + 1.2; g.add(r1);
  box(7, 0.4, 7, M.lacquer, 0, y1 + 1.2, 0, g);
  [[-2.8, -2.8], [2.8, -2.8], [-2.8, 2.8], [2.8, 2.8]].forEach(([x, z]) => pillar(0.26, 3.6, M.lacquer, x, y1 + 3.4, z, g));
  const r2 = roofWithRidge(8.2, 8.2, 2.4, 1.3); r2.position.y = y1 + 6.6; g.add(r2);
  const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 1.2, 2.2, 18, 1, true), M.bronze);
  bell.material = M.bronze.clone(); bell.material.side = THREE.DoubleSide;
  bell.position.set(0, y1 + 5.4, 0); g.add(bell);
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 6, 8), M.wood);
  bar.rotation.z = Math.PI / 2; bar.position.set(0, y1 + 6.6, 0); g.add(bar);
  const glow = new THREE.PointLight(0xffa860, 14, 22, 2); glow.position.set(0, y1 + 4, 0); g.add(glow);
  makeLantern(g, 0, y1 + 3.2, 3.4, 0.8);
  return { group: g, bell };
}

/* Lư hương đồng: thân tròn, hai quai, ba chân, nhang cắm trên miệng. Trả về điểm phát khói. */
export function buildCenser() {
  const g = new THREE.Group();
  box(3.4, 0.5, 3.4, M.stone, 0, 0.25, 0, g);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 0.8, 1.2, 24), M.bronze); body.position.y = 1.1; g.add(body);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.09, 8, 28), M.bronze); rim.rotation.x = Math.PI / 2; rim.position.y = 1.72; g.add(rim);
  const ash = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.06, 24), new THREE.MeshStandardMaterial({ color: 0x6e6a64, roughness: 1 }));
  ash.position.y = 1.7; g.add(ash);
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.07, 8, 14, Math.PI), M.bronze);
    ear.position.set(s * 1.08, 1.5, 0); ear.rotation.z = s > 0 ? -Math.PI / 2 : Math.PI / 2; g.add(ear);
  }
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2, leg = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.7, 8), M.bronze);
    leg.position.set(Math.cos(a) * 0.62, 0.55, Math.sin(a) * 0.62); leg.rotation.x = Math.PI; g.add(leg);
  }
  const sticks = [];
  for (let i = 0; i < 3; i++) {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.5, 5), new THREE.MeshStandardMaterial({ color: 0x6b2a18 }));
    s.position.set((i - 1) * 0.28, 2.4, 0); s.rotation.z = (i - 1) * -0.08; g.add(s);
    const ember = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 6), new THREE.MeshBasicMaterial({ color: 0xff5a2a }));
    ember.position.set((i - 1) * 0.28 - (i - 1) * 0.06, 3.14, 0); g.add(ember); sticks.push(ember);
  }
  return { group: g, smokeOrigin: new THREE.Vector3(0, 3.15, 0), embers: sticks };
}
