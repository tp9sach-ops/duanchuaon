// Vật dụng ngoài sân chùa: nghê đá, cột cờ Phật giáo, dây đèn lồng, bia đá rùa, đỉnh hương, bàn thờ Thiên.
import * as THREE from 'three';
import { M, box, makeLantern } from './temple.js';

const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, ...o });

// Nghê / sư tử đá ngồi trên bệ (dáng đơn giản: thân, ngực, đầu, bờm, hai chân trước)
function stoneLion(x, z, face) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = face;
  const st = mat(0x8a929a);
  box(1.8, 0.9, 1.8, M.stone, 0, 0.45, 0, g);
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.75, 14, 10), st); body.scale.set(0.9, 0.85, 1.25); body.position.set(0, 1.5, -0.1); g.add(body);
  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 10), st); chest.position.set(0, 1.85, 0.4); g.add(chest);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 14, 10), st); head.position.set(0, 2.35, 0.5); g.add(head);
  const mane = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.14, 8, 14), st); mane.position.set(0, 2.3, 0.4); g.add(mane);
  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.2, 0.3), st); snout.position.set(0, 2.25, 0.88); g.add(snout);
  for (const s of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.17, 1.0, 8), st); leg.position.set(s * 0.32, 1.1, 0.62); g.add(leg);
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.22, 6), st); ear.position.set(s * 0.3, 2.7, 0.45); g.add(ear);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), mat(0x222222)); eye.position.set(s * 0.17, 2.42, 0.88); g.add(eye);
  }
  return g;
}

// Cột cờ Phật giáo (cờ ngũ sắc: sọc đứng xanh, vàng, đỏ, trắng, cam)
function flagPole(x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z);
  box(1.2, 0.6, 1.2, M.stone, 0, 0.3, 0, g);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 13, 8), M.wood); pole.position.y = 7; g.add(pole);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), M.gold); tip.position.y = 13.6; g.add(tip);
  const cols = [0x2a62c9, 0xf2c230, 0xd8372c, 0xf4f4f0, 0xf08a24];
  cols.forEach((c, i) => {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 2.2), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide }));
    s.position.set(0.2 + i * 0.34, 12.2, 0); g.add(s);
  });
  return g;
}

// Bia đá đặt trên lưng rùa
function stele(x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z);
  const st = mat(0x7d858c);
  const shell = new THREE.Mesh(new THREE.SphereGeometry(1.1, 14, 10), st); shell.scale.set(1.3, 0.45, 1.0); shell.position.y = 0.55; g.add(shell);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 10, 8), st); head.position.set(0, 0.55, 1.15); g.add(head);
  box(1.6, 2.6, 0.32, st, 0, 2.2, 0, g);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.0, 0.9, 0.5, 4), M.stone); cap.rotation.y = Math.PI / 4; cap.position.y = 3.75; cap.scale.z = 0.25; g.add(cap);
  return g;
}

// Đỉnh hương đồng ba chân, nhỏ
function incenseUrn(x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z);
  box(1.4, 0.4, 1.4, M.stone, 0, 0.2, 0, g);
  const b = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.36, 0.7, 14), M.bronze); b.position.y = 0.75; g.add(b);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.06, 6, 18), M.bronze); rim.rotation.x = Math.PI / 2; rim.position.y = 1.1; g.add(rim);
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.04, 6, 10, Math.PI), M.bronze); e.position.set(s * 0.5, 0.95, 0); e.rotation.z = s > 0 ? -Math.PI / 2 : Math.PI / 2; g.add(e); }
  const lid = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.5, 10), M.gold); lid.position.y = 1.4; g.add(lid);
  return g;
}

// Bàn thờ Thiên ngoài trời: bàn gỗ, bát hương, đèn, mâm quả
function outdoorAltar(x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z);
  box(2.4, 0.18, 1.2, M.lacquer, 0, 1.3, 0, g);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(0.14, 1.2, 0.14, M.wood, sx * 1.05, 0.6, sz * 0.45, g);
  const u = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.2, 0.26, 12), M.bronze); u.position.set(0, 1.52, 0); g.add(u);
  for (const s of [-1, 1]) {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.5, 8), mat(0xc8322b)); c.position.set(s * 0.8, 1.64, 0); g.add(c);
    const f = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.14, 6), new THREE.MeshBasicMaterial({ color: 0xffc860 })); f.position.set(s * 0.8, 1.96, 0); g.add(f);
  }
  const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.24, 0.1, 14), M.gold); pl.position.set(0, 1.45, 0.35); g.add(pl);
  [0xf08a24, 0xd8372c, 0x7fb04a].forEach((c, i) => { const fr = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), mat(c, { roughness: 0.5 })); fr.position.set((i - 1) * 0.16, 1.62, 0.35); g.add(fr); });
  return g;
}

export function buildProps() {
  const g = new THREE.Group();
  // Nghê đá hai bên lối vào Tam quan (nhìn ra phía người vào, +z)
  g.add(stoneLion(-6.6, 41, 0), stoneLion(6.6, 41, 0));
  // Cột cờ Phật giáo hai bên lối đi giữa Tam quan và ao
  g.add(flagPole(-9, 26), flagPole(9, 26));
  // Dây đèn lồng dọc hai bên lối chính, từ ao sen tới chánh điện
  for (let i = 0; i < 5; i++) {
    const z = 4 - i * 4.2;
    for (const s of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 3.6, 6), M.wood); post.position.set(s * 4.4, 1.8, z); g.add(post);
      makeLantern(g, s * 4.4, 3.9, z, 0.7);
    }
  }
  // Đỉnh hương, bia đá, bàn thờ Thiên
  g.add(incenseUrn(-6.5, -14), incenseUrn(6.5, -14));
  g.add(stele(-15, -12));
  g.add(outdoorAltar(14, -14));
  return g;
}
