// Cảnh 3D quái cố định ở bãi rừng (Phiên 107, G1.6a): thân khối đơn giản theo từng loại, thanh Oán Khí, vòng dưới chân quái tinh anh, vòng chọn mục tiêu, đá đang bay.
// Chỉ VẼ; trạng thái do js/ui/farm.js cập nhật vào LGT.farmView = { mons: [{ id, type, x, z, ry, oan, max, he, elite, flash }], target (id hoặc 0), stones: [{ x0, z0, x1, z1, t, dur }] }.
// Mô hình tạm (khối) — chờ bản GLB/hoạ sĩ. Dùng lại hình học/vật liệu giữa các con (clone nông) nên rẻ; tối đa POOL con cùng lúc (hai vùng × 12 là 24; chỉ vùng gần người chơi được đưa vào view).
import { rxPose } from '../world/hitReact.js';
import { ATTACK_CFG, BOSS_ATTACK_CFG } from '../data/monsterAI.js';
import { zoneOf } from '../world/monsterAttack.js';
import { buildMonster } from './monsterModels.js';
import * as THREE from 'three';
import { FARM_CFG } from '../data/monsters.js';

export const POOL = FARM_CFG.maxVisible;
const CULL = 70;
const HE_COLOR = { moc: 0x6fe08a, kim: 0xf0d060, thuy: 0x6ab8ff, hoa: 0xff7a5a, tho: 0xc8a06a };
const mat = (c, e = 0, o = {}) => new THREE.MeshStandardMaterial({ color: c, emissive: e, emissiveIntensity: e ? 0.8 : 0, roughness: 0.85, flatShading: true, ...o });
const add = (g, geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); g.add(o); return o; };

// Phiên 232: hình + hoạt ảnh cho đủ 21 loại quái ở js/scene/monsterModels.js (trước chỉ 6 loại có hình riêng). Chiều cao thân để đặt thanh Oán Khí lấy từ chính mô hình.
export const HEIGHT = Object.freeze({ dameo: 1.1, reutinh: 3.1, daotac: 2.2, cuopduong: 2.9, thuyquy: 2.0, lyngu: 3.2 });
const ZCOL = { tron: 0xff2a2a, non: 0xff7a1a, duong: 0xff2ad0 };   // màu vòng báo đòn theo kiểu vùng đánh
const clamp01 = (k) => Math.min(1, Math.max(0, k));

/** Trả { group, update(t, view, camera) }. */
export function buildFarm() {
  const group = new THREE.Group(); group.name = 'farm-monsters';
  const barBack = new THREE.MeshBasicMaterial({ color: 0x10141a, transparent: true, opacity: 0.75, depthTest: false, fog: false }), planeGeo = new THREE.PlaneGeometry(1, 1);
  const lineGeo = new THREE.PlaneGeometry(1, 1), coneCache = new Map(), coneGeo = (goc) => { let g = coneCache.get(goc); if (!g) { g = new THREE.CircleGeometry(1, 32, -Math.PI / 2 - (goc * Math.PI) / 360, (goc * Math.PI) / 180); coneCache.set(goc, g); } return g; };
  const dangerGeo = new THREE.CircleGeometry(1, 40), eliteGeo = new THREE.RingGeometry(1.2, 1.5, 36), tgtGeo = new THREE.RingGeometry(0.85, 1.0, 32);
  const slots = Array.from({ length: POOL }, () => {
    const root = new THREE.Group(), body = new THREE.Group(); root.visible = false; root.add(body);
    const bar = new THREE.Group(), back = new THREE.Mesh(planeGeo, barBack), fillMat = new THREE.MeshBasicMaterial({ color: 0x6fe08a, depthTest: false, fog: false }), fill = new THREE.Mesh(planeGeo, fillMat);
    back.scale.set(1.2, 0.14, 1); fill.position.z = 0.001; back.renderOrder = 998; fill.renderOrder = 999; bar.add(back, fill); root.add(bar);
    const ring = new THREE.Mesh(eliteGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false, fog: false })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.05; ring.visible = false; root.add(ring);
    // Phiên 124: VÒNG ĐỎ báo đòn — hiện khi quái gồng chiêu, đúng bán kính trúng đòn (tầm × missSlack); đứng ngoài vòng khi hết gồng là né được. Lớn dần theo tiến độ gồng.
    // Phiên 232: vùng báo đòn CÓ HƯỚNG — nhóm xoay theo hướng quái đã khóa lúc gồng; bên trong 3 hình (vòng tròn / quạt / đường) chỉ hiện đúng một hình theo kiểu đòn.
    const dmat = () => new THREE.MeshBasicMaterial({ color: 0xff2a2a, transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false, fog: false });
    const dgrp = new THREE.Group(); dgrp.position.y = 0.06; dgrp.visible = false; root.add(dgrp);
    const dTron = new THREE.Mesh(dangerGeo, dmat()); dTron.rotation.x = -Math.PI / 2; const dLine = new THREE.Mesh(lineGeo, dmat()); dLine.rotation.x = -Math.PI / 2;
    const dNon = new THREE.Mesh(coneGeo(120), dmat()); dNon.rotation.x = -Math.PI / 2; dgrp.add(dTron, dLine, dNon);
    const shadow = new THREE.Mesh(dangerGeo, new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false, fog: false })); shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.03; root.add(shadow);   // bóng dưới chân: quái bám đất
    group.add(root); return { root, body, bar, fill, fillMat, ring, dgrp, dTron, dLine, dNon, shadow, type: '', id: 0, model: null, lx: 0, lz: 0, mv: 0 };
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
        if (s.type !== m.type) { s.body.clear(); s.model = buildMonster(m.type); s.body.add(s.model.g); s.type = m.type; s.lx = m.x; s.lz = m.z; }
        const flash = Math.max(0, m.flash || 0), sc = (m.size ? (m.elite && !m.boss ? 1.15 : 1) * m.size : (m.boss ? 1.7 : m.elite ? 1.15 : 1)) * (1 + 0.14 * flash), phase = (m.id || 0) * 1.7;
        s.root.visible = true; s.root.position.set(m.x, 0, m.z);
        const po = m.rx ? rxPose(m.rx, performance.now() / 1000) : null;   // Phiên 213: tư thế bị trúng chiêu (giật/lùi/ngã theo hướng đòn) — tính ở js/world/hitReact.js
        if (po && !po.done) { s.root.position.x += po.dx; s.root.position.z += po.dz; } else if (m.rx && po && po.done) m.rx = null;
        const wdur = m.slam ? BOSS_ATTACK_CFG.slamWindup : ATTACK_CFG.windup, aW = m.wind > 0 ? clamp01(1 - m.wind / wdur) : 0, pS = m.strikeT > 0 ? clamp01(1 - m.strikeT / 0.45) : 0;   // Phiên 232: gồng 0..1, vung đòn 0..1
        const mvNow = Math.hypot(m.x - s.lx, m.z - s.lz) > 0.004 ? 1 : 0; s.mv += (mvNow - s.mv) * 0.25; s.lx = m.x; s.lz = m.z;
        const sleep = !m.eng && !m.pbCong;   // Phiên 235: quái phó bản luôn đứng canh (không nằm ngủ trong bụi)   // Phiên 118: quái chưa bị đánh thì NGỦ trong bụi (nằm thấp, thở chậm); bị đánh mới nổi giận và đứng dậy
        s.body.position.y = sleep ? 0 : Math.abs(Math.sin(t * 2.2 + phase)) * 0.07; s.body.rotation.y = m.ry + (sleep ? 0 : Math.sin(t * 0.9 + phase) * 0.3); s.body.scale.setScalar(sc);
        if (po && !po.done) { s.body.rotation.x = po.rx; s.body.rotation.z = po.rz; s.body.rotation.y += po.ry; } else { s.body.rotation.x = 0; s.body.rotation.z = 0; }
        if (s.model) { s.model.anim(t + phase, { a: aW, p: m.strikeT > 0 ? Math.max(0.001, pS) : 0, mv: s.mv, sleep }); if (pS > 0 && m.strikeT > 0) { const zz = zoneOf(m), lunge = zz.kieu === 'duong' ? (zz.lao || 0) * Math.sin(Math.PI * pS) : 0; s.body.position.x = Math.sin(m.ry) * lunge; s.body.position.z = Math.cos(m.ry) * lunge; } else { s.body.position.x = 0; s.body.position.z = 0; } }
        s.shadow.scale.setScalar(0.55 * sc * (m.boss ? 1.5 : m.elite ? 1.15 : 0.9) * (HEIGHT[m.type] ? 1 : 1.2));
        if (sleep) s.body.scale.set(sc * 1.05, sc * (0.72 + 0.03 * Math.sin(t * 0.8 + phase)), sc * 1.05);
        const h = ((s.model && s.model.h) || HEIGHT[m.type] || 1.5) * sc + 0.5, hurt = m.oan < m.max, isT = view.target === m.uid;
        s.bar.visible = hurt || isT; s.bar.position.y = h; if (camera) s.bar.quaternion.copy(camera.quaternion);
        const pct = Math.max(0, Math.min(1, m.oan / Math.max(1, m.max))); s.fill.scale.set(1.16 * pct, 0.1, 1); s.fill.position.x = -0.58 * (1 - pct);
        s.fillMat.color.setHex(pct <= 0.25 ? 0x62c8ff : (HE_COLOR[m.he] || 0xffffff));   // ≤ 25%: xanh dương = sắp thu phục
        if (m.wind > 0 || m.strikeT > 0) {   // Phiên 232: vùng báo đòn đúng HÌNH và HƯỚNG; sau khi vung còn nháy sáng ngắn ở đúng vùng vừa đánh
          const zz = zoneOf(m), u = m.wind > 0 ? clamp01(1 - m.wind / wdur) : 1, k = 0.35 + 0.65 * u, hit = m.wind > 0 ? 0 : clamp01(m.strikeT / 0.45);
          s.dgrp.visible = true; s.dgrp.rotation.y = m.ry; s.dTron.visible = zz.kieu === 'tron'; s.dLine.visible = zz.kieu === 'duong'; s.dNon.visible = zz.kieu === 'non';
          const col = m.slam ? 0xff1a1a : ZCOL[zz.kieu] || 0xff2a2a, op = m.wind > 0 ? 0.22 + 0.2 * u : 0.15 + 0.5 * hit;
          if (zz.kieu === 'tron') { s.dTron.scale.setScalar(zz.dai * k); s.dTron.material.color.setHex(col); s.dTron.material.opacity = op; }
          else if (zz.kieu === 'duong') { s.dLine.scale.set(zz.rong, zz.dai * k, 1); s.dLine.position.z = (zz.dai * k) / 2; s.dLine.material.color.setHex(col); s.dLine.material.opacity = op; }
          else { s.dNon.geometry = coneGeo(zz.goc || 120); s.dNon.scale.setScalar(zz.dai * k); s.dNon.material.color.setHex(col); s.dNon.material.opacity = op; }
        } else s.dgrp.visible = false;
        s.ring.visible = !!(m.elite || m.boss); if (m.elite || m.boss) s.ring.material.color.setHex(HE_COLOR[m.he] || 0xffffff);
        if (isT) tg = m;
      });
      if (tg) { tgt.visible = true; tgt.position.set(tg.x, 0.07, tg.z); const k = 1.1 + 0.08 * Math.sin(t * 5) + (tg.boss ? 1.8 : tg.elite ? 0.9 : 0); tgt.scale.set(k, k, 1); } else tgt.visible = false;
      const ss = (view && view.stones) || [];
      stones.forEach((m, i) => { const s = ss[i]; if (!s) { m.visible = false; return; } const u = Math.min(1, s.t / s.dur); m.visible = true; m.position.set(s.x0 + (s.x1 - s.x0) * u, 1.4 + 1.8 * u * (1 - u) * 2 - u * 0.6, s.z0 + (s.z1 - s.z0) * u); m.rotation.x += 0.4; });
    },
  };
}
