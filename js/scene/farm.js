// Cảnh 3D quái cố định ở bãi rừng (Phiên 107, G1.6a): thân khối đơn giản theo từng loại, thanh Oán Khí, vòng dưới chân quái tinh anh, vòng chọn mục tiêu, đá đang bay.
// Chỉ VẼ; trạng thái do js/ui/farm.js cập nhật vào LGT.farmView = { mons: [{ id, type, x, z, ry, oan, max, he, elite, flash }], target (id hoặc 0), stones: [{ x0, z0, x1, z1, t, dur }] }.
// Mô hình tạm (khối) — chờ bản GLB/hoạ sĩ. Dùng lại hình học/vật liệu giữa các con (clone nông) nên rẻ; tối đa POOL con cùng lúc (hai vùng × 12 là 24; chỉ vùng gần người chơi được đưa vào view).
import { ATTACK_CFG, BOSS_ATTACK_CFG } from '../data/monsterAI.js';
import * as THREE from 'three';
import { FARM_CFG } from '../data/monsters.js';

export const POOL = FARM_CFG.maxVisible;
const CULL = 70;
const HE_COLOR = { moc: 0x6fe08a, kim: 0xf0d060, thuy: 0x6ab8ff };
const mat = (c, e = 0, o = {}) => new THREE.MeshStandardMaterial({ color: c, emissive: e, emissiveIntensity: e ? 0.8 : 0, roughness: 0.85, flatShading: true, ...o });
const add = (g, geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); g.add(o); return o; };

// Chiều cao thân (m) để đặt thanh Oán Khí phía trên đầu.
export const HEIGHT = { dameo: 0.95, reutinh: 2.5, daotac: 2.0, cuopduong: 3.0, thuyquy: 1.7, lyngu: 2.8 };

function buildType(type) {
  const g = new THREE.Group();
  if (type === 'dameo') {   // mèo rừng: thân dẹt dài, tai nhọn, đuôi, mắt xanh lá phát sáng
    const fur = mat(0x7a6a46), dark = mat(0x4a3f2a), eye = mat(0xc8ff6a, 0x9be83a);
    add(g, new THREE.SphereGeometry(0.42, 10, 8), fur, 0, 0.5, 0).scale.set(1, 0.85, 1.5);
    add(g, new THREE.SphereGeometry(0.28, 10, 8), fur, 0, 0.78, 0.58);
    for (const s of [-1, 1]) { add(g, new THREE.ConeGeometry(0.1, 0.24, 6), dark, s * 0.17, 1.05, 0.55); add(g, new THREE.SphereGeometry(0.05, 6, 5), eye, s * 0.11, 0.82, 0.82); }
    for (const [x, z] of [[-0.2, 0.4], [0.2, 0.4], [-0.2, -0.4], [0.2, -0.4]]) add(g, new THREE.CylinderGeometry(0.07, 0.06, 0.32, 6), dark, x, 0.16, z);
    const tail = add(g, new THREE.CylinderGeometry(0.05, 0.08, 0.7, 6), dark, 0, 0.75, -0.75); tail.rotation.x = -0.9;
  } else if (type === 'reutinh') {   // Rêu Tinh: tảng đá phủ rêu, hai tay đá, mắt vàng; lớn hơn
    const stone = mat(0x6e7a68), moss = mat(0x4f9a3c, 0x1c4a12), eye = mat(0xffe27a, 0xffc400);
    add(g, new THREE.DodecahedronGeometry(1.0, 0), stone, 0, 1.15, 0);
    add(g, new THREE.DodecahedronGeometry(0.72, 0), moss, 0, 1.75, -0.05).scale.set(1.1, 0.55, 1.1);
    add(g, new THREE.DodecahedronGeometry(0.42, 0), stone, 0, 2.05, 0.35);
    for (const s of [-1, 1]) { add(g, new THREE.DodecahedronGeometry(0.4, 0), stone, s * 1.15, 0.95, 0.1); add(g, new THREE.SphereGeometry(0.09, 8, 6), eye, s * 0.2, 2.1, 0.7); }
    for (let i = 0; i < 6; i++) { const a = i * 1.05; add(g, new THREE.ConeGeometry(0.12, 0.45, 5), moss, Math.cos(a) * 0.7, 0.2, Math.sin(a) * 0.7); }
  } else if (type === 'daotac') {   // Đạo Tặc Sơn Cước: người mặc áo xám, nón lá, cầm đao
    const robe = mat(0x7d8696), hat = mat(0xc9b36b), skin = mat(0xd7a97a), blade = mat(0xdfe6ee, 0x6a7a90);
    add(g, new THREE.CylinderGeometry(0.34, 0.46, 1.25, 8), robe, 0, 0.75, 0);
    add(g, new THREE.SphereGeometry(0.26, 10, 8), skin, 0, 1.55, 0);
    add(g, new THREE.ConeGeometry(0.62, 0.38, 10), hat, 0, 1.88, 0);
    add(g, new THREE.BoxGeometry(0.08, 0.9, 0.2), blade, 0.55, 1.0, 0.25).rotation.z = -0.35;
    for (const s of [-1, 1]) add(g, new THREE.CylinderGeometry(0.1, 0.1, 0.5, 6), robe, s * 0.17, 0.12, 0);
  } else if (type === 'thuyquy') {   // Thủy Quỷ Hồ Thác: thân nước xanh trong, đầu tròn, hai tay dài, mắt trắng sáng
    const water = mat(0x3f8fd0, 0x0c3a66, { transparent: true, opacity: 0.85 }), weed = mat(0x2f6a4a), eye = mat(0xe8faff, 0xbfefff);
    add(g, new THREE.ConeGeometry(0.62, 1.3, 9), water, 0, 0.65, 0);
    add(g, new THREE.SphereGeometry(0.34, 10, 8), water, 0, 1.45, 0);
    for (const s of [-1, 1]) { add(g, new THREE.CylinderGeometry(0.09, 0.07, 0.9, 6), water, s * 0.62, 0.95, 0.1).rotation.z = s * 0.5; add(g, new THREE.SphereGeometry(0.06, 6, 5), eye, s * 0.13, 1.5, 0.3); }
    for (let i = 0; i < 5; i++) { const a = i * 1.26; add(g, new THREE.ConeGeometry(0.07, 0.4, 5), weed, Math.cos(a) * 0.3, 1.8, Math.sin(a) * 0.3); }
  } else if (type === 'lyngu') {   // Lý Ngư Tinh (tinh anh): cá chép lớn đứng thẳng, vảy đỏ cam, râu dài, vây lưng xanh
    const scale = mat(0xe8742a, 0x6a2200), fin = mat(0x3fa0d8, 0x0c4a6a), eye = mat(0xfff3b0, 0xffd400), whisk = mat(0xf6d27a);
    add(g, new THREE.SphereGeometry(0.85, 12, 10), scale, 0, 1.35, 0).scale.set(0.85, 1.5, 0.85);
    add(g, new THREE.SphereGeometry(0.5, 10, 8), scale, 0, 2.5, 0.12);
    add(g, new THREE.ConeGeometry(0.55, 0.9, 6), fin, 0, 0.35, -0.2).rotation.x = Math.PI;
    add(g, new THREE.ConeGeometry(0.3, 1.0, 5), fin, 0, 1.6, -0.75).rotation.x = -0.6;
    for (const s of [-1, 1]) { add(g, new THREE.SphereGeometry(0.09, 6, 5), eye, s * 0.27, 2.6, 0.55); add(g, new THREE.CylinderGeometry(0.02, 0.02, 0.9, 4), whisk, s * 0.2, 2.35, 0.65).rotation.z = s * 1.1; add(g, new THREE.ConeGeometry(0.22, 0.7, 5), fin, s * 0.85, 1.3, 0).rotation.z = s * -1.2; }
  } else {   // cuopduong: Cướp Đường — to lớn, giáp xám viền vàng, đao lớn
    const armor = mat(0x555a66), gold = mat(0xd4af37, 0x5a4300), skin = mat(0xc98f64), blade = mat(0xe8eef6, 0x7a8aa0);
    add(g, new THREE.CylinderGeometry(0.55, 0.7, 1.7, 8), armor, 0, 1.05, 0);
    add(g, new THREE.TorusGeometry(0.62, 0.07, 6, 14), gold, 0, 1.55, 0).rotation.x = Math.PI / 2;
    add(g, new THREE.SphereGeometry(0.34, 10, 8), skin, 0, 2.25, 0);
    add(g, new THREE.CylinderGeometry(0.36, 0.4, 0.22, 10), gold, 0, 2.5, 0);
    for (const s of [-1, 1]) { add(g, new THREE.SphereGeometry(0.34, 8, 6), armor, s * 0.78, 1.8, 0); add(g, new THREE.CylinderGeometry(0.14, 0.14, 0.7, 6), armor, s * 0.28, 0.2, 0); }
    add(g, new THREE.BoxGeometry(0.12, 1.5, 0.3), blade, 0.95, 1.3, 0.3).rotation.z = -0.3;
  }
  return g;
}

/** Trả { group, update(t, view, camera) }. */
export function buildFarm() {
  const group = new THREE.Group(); group.name = 'farm-monsters';
  const tpl = {}, barBack = new THREE.MeshBasicMaterial({ color: 0x10141a, transparent: true, opacity: 0.75, depthTest: false, fog: false }), planeGeo = new THREE.PlaneGeometry(1, 1);
  const dangerGeo = new THREE.CircleGeometry(1, 40), eliteGeo = new THREE.RingGeometry(1.2, 1.5, 36), tgtGeo = new THREE.RingGeometry(0.85, 1.0, 32);
  const slots = Array.from({ length: POOL }, () => {
    const root = new THREE.Group(), body = new THREE.Group(); root.visible = false; root.add(body);
    const bar = new THREE.Group(), back = new THREE.Mesh(planeGeo, barBack), fillMat = new THREE.MeshBasicMaterial({ color: 0x6fe08a, depthTest: false, fog: false }), fill = new THREE.Mesh(planeGeo, fillMat);
    back.scale.set(1.2, 0.14, 1); fill.position.z = 0.001; back.renderOrder = 998; fill.renderOrder = 999; bar.add(back, fill); root.add(bar);
    const ring = new THREE.Mesh(eliteGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false, fog: false })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.05; ring.visible = false; root.add(ring);
    // Phiên 124: VÒNG ĐỎ báo đòn — hiện khi quái gồng chiêu, đúng bán kính trúng đòn (tầm × missSlack); đứng ngoài vòng khi hết gồng là né được. Lớn dần theo tiến độ gồng.
    const danger = new THREE.Mesh(dangerGeo, new THREE.MeshBasicMaterial({ color: 0xff2a2a, transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false, fog: false })); danger.rotation.x = -Math.PI / 2; danger.position.y = 0.06; danger.visible = false; root.add(danger);
    group.add(root); return { root, body, bar, fill, fillMat, ring, danger, type: '', id: 0 };
  });
  const tgt = new THREE.Mesh(tgtGeo, new THREE.MeshBasicMaterial({ color: 0xfff2a8, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false, fog: false })); tgt.rotation.x = -Math.PI / 2; tgt.visible = false; group.add(tgt);
  const stoneGeo = new THREE.DodecahedronGeometry(0.2, 0), stones = [0, 1, 2, 3].map(() => { const m = new THREE.Mesh(stoneGeo, mat(0x8c9096)); m.visible = false; group.add(m); return m; });

  return {
    group,
    update(t, view, camera) {
      const mons = (view && view.mons) || [];
      let tg = null;
      slots.forEach((s, i) => {
        const m = mons[i]; if (!m || (camera && Math.hypot(m.x - camera.position.x, m.z - camera.position.z) > CULL)) { s.root.visible = false; return; }   // xa camera quá CULL m thì không vẽ (tiết kiệm lượt vẽ trên điện thoại)
        if (s.type !== m.type) { s.body.clear(); (tpl[m.type] = tpl[m.type] || buildType(m.type)); s.body.add(tpl[m.type].clone()); s.type = m.type; }
        const flash = Math.max(0, m.flash || 0), sc = (m.boss ? 1.7 : m.elite ? 1.15 : 1) * (1 + 0.14 * flash), phase = (m.id || 0) * 1.7;
        s.root.visible = true; s.root.position.set(m.x, 0, m.z);
        const sleep = !m.eng;   // Phiên 118: quái chưa bị đánh thì NGỦ trong bụi (nằm thấp, thở chậm); bị đánh mới nổi giận và đứng dậy
        s.body.position.y = sleep ? 0 : Math.abs(Math.sin(t * 2.2 + phase)) * 0.07; s.body.rotation.y = m.ry + (sleep ? 0 : Math.sin(t * 0.9 + phase) * 0.3); s.body.scale.setScalar(sc);
        if (sleep) s.body.scale.set(sc * 1.05, sc * (0.72 + 0.03 * Math.sin(t * 0.8 + phase)), sc * 1.05);
        const h = (HEIGHT[m.type] || 1.5) * sc + 0.5, hurt = m.oan < m.max, isT = view.target === m.uid;
        s.bar.visible = hurt || isT; s.bar.position.y = h; if (camera) s.bar.quaternion.copy(camera.quaternion);
        const pct = Math.max(0, Math.min(1, m.oan / Math.max(1, m.max))); s.fill.scale.set(1.16 * pct, 0.1, 1); s.fill.position.x = -0.58 * (1 - pct);
        s.fillMat.color.setHex(pct <= 0.25 ? 0x62c8ff : (HE_COLOR[m.he] || 0xffffff));   // ≤ 25%: xanh dương = sắp thu phục
        if (m.wind > 0) { const R = m.slam ? BOSS_ATTACK_CFG.slamReach : ATTACK_CFG.reach[(m.elite || m.boss) ? 'elite' : 'normal'] * ATTACK_CFG.missSlack, u = Math.max(0, Math.min(1, 1 - m.wind / (m.slam ? BOSS_ATTACK_CFG.slamWindup : ATTACK_CFG.windup))); s.danger.visible = true; s.danger.scale.setScalar(R * (0.35 + 0.65 * u)); s.danger.material.opacity = 0.18 + 0.32 * u; } else s.danger.visible = false;
        s.ring.visible = !!(m.elite || m.boss); if (m.elite || m.boss) s.ring.material.color.setHex(HE_COLOR[m.he] || 0xffffff);
        if (isT) tg = m;
      });
      if (tg) { tgt.visible = true; tgt.position.set(tg.x, 0.07, tg.z); const k = 1.1 + 0.08 * Math.sin(t * 5) + (tg.boss ? 1.8 : tg.elite ? 0.9 : 0); tgt.scale.set(k, k, 1); } else tgt.visible = false;
      const ss = (view && view.stones) || [];
      stones.forEach((m, i) => { const s = ss[i]; if (!s) { m.visible = false; return; } const u = Math.min(1, s.t / s.dur); m.visible = true; m.position.set(s.x0 + (s.x1 - s.x0) * u, 1.4 + 1.8 * u * (1 - u) * 2 - u * 0.6, s.z0 + (s.z1 - s.z0) * u); m.rotation.x += 0.4; });
    },
  };
}
