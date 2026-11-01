// Chánh điện: nhà thờ Phật mở mặt trước, bệ đá, cột son, mái hai tầng, bàn thờ ba bậc với ba pho tượng Phật,
// mâm ngũ quả, nến, bình hoa, bát hương, mõ, chuông, trống, phướn, đèn lồng, đệm ngồi.
// Trả về { group, update(t), buddhaAnchor } — update làm nến lung linh.
import * as THREE from 'three';
import { signTexture, coupletTexture } from './textures.js';
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
  const g = new THREE.Group(), flames = [];
  const W = 22, D = 13, H = 5.4, y0 = 1.0;
  const front = D / 2 - 0.8, back = -D / 2 + 0.7;

  // Bệ đá + bậc thềm phía trước
  box(W + 4, 1.0, D + 4, M.stone, 0, 0.5, 0, g);
  for (let i = 0; i < 4; i++) box(8 - i * 0.3, 0.25, 0.8, M.stone, 0, 0.12 + i * 0.25, D / 2 + 2 + (3 - i) * 0.8, g);
  // Sàn lát gỗ + thảm đỏ lối giữa
  box(W - 0.6, 0.12, D - 1.2, M.wood, 0, y0 + 0.06, 0, g);
  box(4.2, 0.04, D - 1.4, mat(0x8f1f1a, { roughness: 0.95 }), 0, y0 + 0.14, 0, g);

  // Cột son: hàng trước và hàng sau, tường hậu, hai vách bên
  const nCol = 5;
  for (let i = 0; i < nCol; i++) {
    const x = -W / 2 + 1.6 + i * ((W - 3.2) / (nCol - 1));
    pillar(0.36, H, M.lacquer, x, y0, front, g);
    pillar(0.36, H, M.lacquer, x, y0, back + 1.4, g);
  }
  box(W - 1, H, 0.5, M.wall, 0, y0 + H / 2, back, g);
  for (const s of [-1, 1]) box(0.5, H, D - 1.4, M.wall, s * (W / 2 - 0.8), y0 + H / 2, 0, g);
  // Gian giữa phát sáng sau lưng tượng (ánh vàng)
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(10, H - 0.8), new THREE.MeshBasicMaterial({ color: 0xffa84a, transparent: true, opacity: 0.55 }));
  glow.position.set(0, y0 + H / 2, back + 0.3); g.add(glow);

  // Xà ngang, hoành phi, câu đối
  box(W + 1, 0.7, D - 0.6, M.lacquer, 0, y0 + H + 0.1, 0, g);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(6.2, 1.55), new THREE.MeshBasicMaterial({ map: signTexture('DIỆU GIANG TỰ') }));
  sign.position.set(0, y0 + H + 1.1, D / 2 - 0.2); g.add(sign);
  [['PHẬT', 'PHÁP', 'VÔ', 'BIÊN'], ['TỪ', 'BI', 'HỶ', 'XẢ']].forEach((w, i) => {
    const c = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 4.2), new THREE.MeshBasicMaterial({ map: coupletTexture(w) }));
    c.position.set(i ? 2.2 : -2.2, y0 + 3.0, front + 0.42); g.add(c);
  });

  // Mái hai tầng
  const low = roofWithRidge(W + 6, D + 4, 3.0, 1.6); low.position.y = y0 + H + 0.4; g.add(low);
  box(W - 6, 2.2, D - 4, M.lacquer, 0, y0 + H + 0.5 + 1.1, 0, g);
  const up = roofWithRidge(W - 2, D - 1, 2.8, 1.8); up.position.y = y0 + H + 2.9; g.add(up);

  // Bàn thờ ba bậc (bậc cao nhất ở giữa, sau cùng)
  const az = back + 2.2;
  box(14, 0.5, 3.8, M.lacquer, 0, y0 + 0.4, az + 0.9, g);
  box(11, 0.45, 2.8, M.lacquer, 0, y0 + 0.9, az + 0.3, g);
  box(7.4, 0.45, 2.0, M.lacquer, 0, y0 + 1.35, az - 0.1, g);
  for (const yy of [0.66, 1.14, 1.59]) box(14 - (yy - 0.66) * 4, 0.05, 3.9 - (yy - 0.66) * 0.9, M.gold, 0, y0 + yy, az + 0.9 - (yy - 0.66) * 0.7, g);
  const topY = y0 + 1.6;

  // Ba pho tượng: giữa lớn, hai bên nhỏ hơn đặt bậc thấp
  const mainB = buildBuddha(); mainB.position.set(0, topY, az - 0.2); mainB.scale.setScalar(0.95); g.add(mainB);
  for (const s of [-1, 1]) { const b = buildBuddha(); b.position.set(s * 3.6, y0 + 1.12, az + 0.3); b.scale.setScalar(0.6); g.add(b); }

  // Vật dụng trên bàn thờ
  fruitTray(g, -1.9, y0 + 0.62, az + 2.2, 1); fruitTray(g, 1.9, y0 + 0.62, az + 2.2, 1);
  fruitTray(g, -5.4, y0 + 0.62, az + 1.8, 0.8); fruitTray(g, 5.4, y0 + 0.62, az + 1.8, 0.8);
  [-1, 1].forEach((s) => { candle(g, s * 1.2, y0 + 1.15, az + 1.0, flames); candle(g, s * 4.6, y0 + 0.62, az + 2.6, flames); candle(g, s * 2.6, topY, az - 0.2, flames); });
  vase(g, -3.0, y0 + 1.15, az + 0.9, 1); vase(g, 3.0, y0 + 1.15, az + 0.9, 1);
  censerSmall(g, 0, y0 + 1.15, az + 1.6);
  censerSmall(g, 0, y0 + 0.62, az + 2.9);

  // Vật dụng trong điện
  woodenFish(g, -4.6, y0 + 0.12, front - 2.2); bellStand(g, -5.5, y0 + 0.12, front - 2.2);
  drum(g, 8.2, y0 + 0.12, back + 3.2);
  [-2.6, 0, 2.6].forEach((x) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 0.16, 16), mat(0xe2b95c, { emissive: 0x5a3e0c, emissiveIntensity: 0.4 })); c.position.set(x, y0 + 0.22, front - 3.4 - (x === 0 ? 0.8 : 0)); g.add(c); }); // đệm ngồi
  // Phướn (cờ dài) treo giữa điện
  [[-3.4, 0xd9a421], [3.4, 0xc8322b]].forEach(([x, c]) => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 3.2), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide }));
    p.position.set(x, y0 + H - 1.8, front - 3.8); g.add(p);
  });
  // Đèn lồng dọc hiên
  for (let i = 0; i < 5; i++) makeLantern(g, -W / 2 + 3 + i * ((W - 6) / 4), y0 + H - 0.7, front + 0.9, 0.8);
  makeLantern(g, -2.2, y0 + H - 1.3, front - 3.4, 0.7); makeLantern(g, 2.2, y0 + H - 1.3, front - 3.4, 0.7);

  // Ánh sáng ấm trong điện
  const light = new THREE.PointLight(0xffb060, 60, 26, 2); light.position.set(0, y0 + 3.2, az + 3); g.add(light);

  return {
    group: g,
    update(t) {
      flames.forEach((f, i) => { const k = 1 + 0.18 * Math.sin(t * 9 + i * 1.7) * Math.sin(t * 5.3 + i); f.scale.set(1, k, 1); });
      light.intensity = 56 + 6 * Math.sin(t * 6.1) * Math.sin(t * 2.3);
    },
  };
}
