// Cảnh 3D yêu quái (Phiên 64, dựng lại Phiên 100): 3 mô hình có hoạt ảnh (js/scene/yqModels.js), vùng đỏ báo đòn có đồng hồ lấp đầy, sóng xung kích khi đánh, đá bay có đuôi lửa, luồng khí 3 lớp,
// tia lửa + số sát thương bay lên khi trúng đòn, nháy trắng khi bị đánh, nổ tung khi bị thu phục, túi lá bồ đề rơi. Chỉ VẼ; trạng thái ở js/world/yeuquai.js (LGT.yqView do js/ui/yeuquai.js cập nhật).
// view = { boss, shapes, wt (0..1 khi gồng, −1 khi vừa đánh), flash (0,35 → 0 sau khi đánh), loot, stones, waves, hits: [{ id, dmg, kind, x, z, px, pz }] }.
import * as THREE from 'three';
import { YQ } from '../world/yeuquai.js';
import { wavePoint } from '../world/conKhi.js';
import { hitStyle } from '../world/yqFx.js';
import { BUILDERS } from './yqModels.js';

const mat = (c, e = 0) => new THREE.MeshStandardMaterial({ color: c, emissive: e, emissiveIntensity: e ? 0.7 : 0, roughness: 0.8 });
const WHITE = () => new THREE.Color(0xffffff);

/** Hình trăng khuyết nằm ngang (Phiên 93): trục "tiến" là +z, sừng hai bên chĩa ra sau; W = nửa bề rộng, H = độ cong về phía trước, T = độ dày ở giữa. */
function crescentGeo(W = 1.5, H = 1.1, T = 0.5) {
  const sh = new THREE.Shape(), N = 16;
  for (let i = 0; i <= N; i++) { const u = -1 + 2 * i / N, x = u * W, y = H * (1 - u * u); if (i) sh.lineTo(x, y); else sh.moveTo(x, y); }
  for (let i = N; i >= 0; i--) { const u = -1 + 2 * i / N; sh.lineTo(u * W, (H - T) * (1 - u * u)); }
  const g = new THREE.ShapeGeometry(sh); g.rotateX(Math.PI / 2); return g;   // y của hình phẳng → +z của cảnh
}
function radialTex() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/** Trả { group, update(t, view) }. t = giây. */
export function buildYeuQuai() {
  const group = new THREE.Group(); group.name = 'yeu-quai';
  const rigs = {}; for (const id of Object.keys(YQ)) { const r = BUILDERS[id](YQ[id]); r.g.visible = false; group.add(r.g); rigs[id] = r; for (const m of r.mats) { m.userData.e0 = m.emissive ? m.emissive.clone() : null; m.userData.i0 = m.emissiveIntensity; } }

  // ---- vùng đỏ báo đòn: nền + viền + (hình tròn) đĩa lấp đầy theo thời gian gồng; (vành khuyên) vành nháy
  const basicM = (c, o = {}) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, fog: false, ...o });
  const flatMesh = (geo, m) => { const o = new THREE.Mesh(geo, m); o.rotation.x = -Math.PI / 2; o.visible = false; o.renderOrder = 2; group.add(o); return o; };
  const unitCircle = new THREE.CircleGeometry(1, 56), unitEdge = new THREE.RingGeometry(0.93, 1, 64), ringCache = new Map();
  const ringGeo = (a, b) => { const k = `${a.toFixed(2)}_${b.toFixed(2)}`; let g = ringCache.get(k); if (!g) { if (ringCache.size > 24) { for (const v of ringCache.values()) v.dispose(); ringCache.clear(); } g = new THREE.RingGeometry(a, b, 64); ringCache.set(k, g); } return g; };
  const marks = [0, 1, 2].map(() => ({ base: flatMesh(unitCircle, basicM(0xff2a1a)), edge: flatMesh(unitEdge, basicM(0xff7a5a)), edge2: flatMesh(unitEdge, basicM(0xff7a5a)), prog: flatMesh(unitCircle, basicM(0xff9a3a, { blending: THREE.AdditiveBlending })), key: '' }));

  // ---- đá / lá bồ đề
  const stoneGeo = new THREE.DodecahedronGeometry(0.24, 0), rockM = mat(0x8c9096, 0xff7a20);
  const stones = [0, 1, 2, 3, 4, 5].map(() => { const m = new THREE.Mesh(stoneGeo, rockM); m.visible = false; m.castShadow = true; group.add(m); return m; });
  const lootGeo = new THREE.SphereGeometry(0.28, 12, 10), loots = Array.from({ length: 24 }, () => { const m = new THREE.Mesh(lootGeo, mat(0x6fe0a0, 0x2fd078)); m.visible = false; group.add(m); return m; });

  // ---- luồng khí Côn Khí Trảm: 3 luồng dùng lại, mỗi luồng 3 lớp (lõi trắng, quầng xanh, 2 bóng mờ phía sau)
  const khiGeo = crescentGeo(), khiGlowGeo = crescentGeo(1.9, 1.5, 0.95), khiGhostGeo = crescentGeo(1.3, 0.95, 0.35);
  const khiMat = (c, o) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
  const waves = [0, 1, 2].map(() => {
    const g = new THREE.Group(), core = new THREE.Mesh(khiGeo, khiMat(0xf4fbff, 0.95)), glow = new THREE.Mesh(khiGlowGeo, khiMat(0x6fc8ff, 0.4));
    const g1 = new THREE.Mesh(khiGhostGeo, khiMat(0x9fe0ff, 0.5)), g2 = new THREE.Mesh(khiGhostGeo, khiMat(0x6fc8ff, 0.28));
    core.position.z = 0.05; g1.position.z = -1.0; g2.position.z = -2.0; g.add(glow, core, g1, g2); g.visible = false; group.add(g); return { g, core, glow, g1, g2 };
  });

  // ---- tia lửa (Sprite cộng sáng), sóng xung kích, vệt thương, số sát thương
  const tex = radialTex(), sparks = Array.from({ length: 64 }, () => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); s.visible = false; s.userData = { vx: 0, vy: 0, vz: 0, life: 0, max: 1, size: 0.3 }; group.add(s); return s; });
  let sparkI = 0;
  function burst(x, y, z, hex, n, speed = 5, size = 0.4, life = 0.6, up = 2) {
    for (let i = 0; i < n; i++) {
      const s = sparks[sparkI++ % sparks.length], u = s.userData, a = Math.random() * Math.PI * 2, e = (Math.random() - 0.3) * 1.2, sp = speed * (0.35 + Math.random() * 0.65);
      s.position.set(x, y, z); u.vx = Math.cos(a) * Math.cos(e) * sp; u.vz = Math.sin(a) * Math.cos(e) * sp; u.vy = Math.sin(e) * sp + up; u.life = u.max = life * (0.6 + Math.random() * 0.6); u.size = size * (0.5 + Math.random() * 0.8);
      s.material.color.setHex(hex); s.visible = true;
    }
  }
  const rings = Array.from({ length: 5 }, () => { const m = new THREE.Mesh(new THREE.RingGeometry(0.86, 1, 48), basicM(0xffffff, { blending: THREE.AdditiveBlending })); m.rotation.x = -Math.PI / 2; m.visible = false; m.renderOrder = 3; group.add(m); m.userData = { life: 0, max: 1, r0: 0.5, r1: 4 }; return m; });
  let ringI = 0;
  function ring(x, z, r0, r1, dur, hex, y = 0.1) { const m = rings[ringI++ % rings.length], u = m.userData; m.position.set(x, y, z); u.life = u.max = dur; u.r0 = r0; u.r1 = r1; m.material.color.setHex(hex); m.visible = true; }
  const streaks = [0, 1].map(() => { const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); m.visible = false; m.userData = { life: 0, len: 1 }; group.add(m); return m; });
  let streakI = 0;
  const dmgs = Array.from({ length: 8 }, () => {
    const c = document.createElement('canvas'); c.width = 192; c.height = 96; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, depthWrite: false, fog: false })); s.visible = false; s.renderOrder = 10; s.userData = { life: 0, max: 1, c, t, x: 0, y: 0, z: 0, k: 1 }; group.add(s); return s;
  });
  let dmgI = 0;
  function popDamage(x, y, z, st) {
    const s = dmgs[dmgI++ % dmgs.length], u = s.userData, g = u.c.getContext('2d'); g.clearRect(0, 0, 192, 96); g.font = `800 ${st.big ? 66 : 50}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 9; g.strokeStyle = 'rgba(30,8,4,.92)'; g.lineJoin = 'round'; g.strokeText(st.text, 96, 50); g.fillStyle = st.css; g.fillText(st.text, 96, 50); u.t.needsUpdate = true;
    u.x = x + (Math.random() - 0.5) * 0.8; u.y = y; u.z = z + (Math.random() - 0.5) * 0.8; u.k = st.scale; u.life = u.max = st.big ? 1.1 : 0.85; s.position.set(u.x, u.y, u.z); s.visible = true;
  }
  const glowSprite = (hex, size) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: hex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, opacity: 0.9 })); s.scale.set(size, size, 1); s.visible = false; group.add(s); return s; };
  const stoneGlows = stones.map(() => glowSprite(0xff9a30, 1.1));

  // ---- trạng thái giữa các khung hình
  let lastT = null, seenHit = 0, prevFlash = 0, hitAt = -1e9, prevAlive = false, lx = 0, lz = 0, lastBoss = null, lastType = '';
  const mv = { x: 0, z: 0 };

  return {
    group,
    update(t, view) {
      const dt = lastT == null ? 0.016 : Math.min(0.1, Math.max(0, t - lastT)); lastT = t;
      const b = view && view.boss, v = view || {}, alive = !!b && !b.dead, nowMs = performance.now();
      // ---- xuất hiện / chết
      if (alive && !prevAlive) { ring(b.x, b.z, 0.5, YQ[b.type].body * 3, 0.8, YQ[b.type].color); burst(b.x, 0.4, b.z, YQ[b.type].color, 22, 6, 0.5, 0.8, 3); lx = b.x; lz = b.z; }
      if (!alive && prevAlive && lastBoss) {
        const k = YQ[lastType] || YQ.da, y = k.body * 1.3;
        burst(lastBoss.x, y, lastBoss.z, 0xffe9a0, 30, 9, 0.7, 1.1, 4); burst(lastBoss.x, y, lastBoss.z, k.color, 26, 7, 0.55, 1.0, 3);
        ring(lastBoss.x, lastBoss.z, 0.5, k.body * 5, 0.9, 0xfff0b0); ring(lastBoss.x, lastBoss.z, 0.3, k.body * 3, 0.6, k.color);
      }
      prevAlive = alive; if (alive) { lastBoss = { x: b.x, z: b.z }; lastType = b.type; }
      // ---- mô hình
      for (const id of Object.keys(rigs)) rigs[id].g.visible = alive && b.type === id;
      if (alive) {
        const r = rigs[b.type], m = r.g, wind = b.state === 'windup' ? Math.max(0, v.wt || 0) : 0, strike = (v.flash || 0) > 0 ? Math.min(1, v.flash / 0.35) : 0;
        mv.x = b.x - lx; mv.z = b.z - lz; lx = b.x; lz = b.z; const moving = b.state === 'move' && (mv.x * mv.x + mv.z * mv.z) > 1e-6;
        m.position.set(b.x, 0, b.z); m.rotation.y = b.ry;
        r.anim(t, { wind, strike, move: moving });
        const hitK = Math.max(0, 1 - (nowMs - hitAt) / 190);
        for (const mt of r.mats) {
          if (!mt.emissive) continue;
          if (hitK > 0.01) { mt.emissive.copy(mt.userData.e0 || mt.color).lerp(WHITE(), hitK); mt.emissiveIntensity = Math.max(mt.emissiveIntensity, 1.1 * hitK); mt.userData.fl = true; }
          else if (mt.userData.fl) { if (mt.userData.e0) mt.emissive.copy(mt.userData.e0); mt.emissiveIntensity = mt.userData.i0; mt.userData.fl = false; }
        }
        const sc = 1 + (b.state === 'windup' ? Math.sin(t * 40) * 0.012 * wind : 0) - 0.02 * strike; m.scale.setScalar(sc);
      }
      // ---- vùng đỏ báo đòn
      const shapes = alive ? v.shapes || [] : [], wt = v.wt, fk = Math.min(1, (v.flash || 0) / 0.35), pulse = 0.5 + 0.5 * Math.sin(t * 14);
      marks.forEach((mk, i) => {
        const s = shapes[i]; const all = [mk.base, mk.edge, mk.edge2, mk.prog]; if (!s) { all.forEach((o) => { o.visible = false; }); return; }
        const ringShape = s.k === 'ring', key = ringShape ? `r${s.r0}_${s.r}` : 'c'; if (key !== mk.key) { mk.key = key; mk.base.geometry = ringShape ? ringGeo(s.r0, s.r) : unitCircle; }
        mk.base.visible = mk.edge.visible = true; mk.edge2.visible = ringShape; mk.prog.visible = !ringShape;
        for (const o of all) o.position.set(s.x, 0.06, s.z);
        const gather = wt >= 0, w = gather ? wt : 0, flashing = !gather;
        mk.base.scale.set(ringShape ? 1 : s.r, ringShape ? 1 : s.r, 1); mk.edge.scale.set(s.r, s.r, 1); if (ringShape) mk.edge2.scale.set(s.r0, s.r0, 1);
        mk.prog.scale.set(Math.max(0.001, s.r * w), Math.max(0.001, s.r * w), 1);
        mk.base.material.opacity = flashing ? 0.75 * fk : 0.16 + 0.16 * w; mk.base.material.color.setHex(flashing ? 0xffd0b0 : 0xff2a1a);
        const eo = flashing ? fk : 0.55 + 0.4 * pulse; mk.edge.material.opacity = mk.edge2.material.opacity = eo;
        mk.prog.material.opacity = flashing ? 0 : 0.28 + 0.3 * w * (0.7 + 0.3 * pulse);
      });
      // ---- phát hiện đòn của yêu quái (sóng xung kích + bụi)
      if ((v.flash || 0) > prevFlash + 0.2) for (const s of (v.shapes || [])) { const rr = s.k === 'ring' ? s.r : s.r; ring(s.x, s.z, Math.max(0.5, s.k === 'ring' ? s.r0 : 0.5), rr * 1.05, 0.5, 0xffa070); burst(s.x, 0.3, s.z, 0xd9b48a, s.k === 'ring' ? 8 : 12, 5, 0.5, 0.7, 2.2); }
      prevFlash = v.flash || 0;
      // ---- sự kiện đánh trúng: tia lửa, số, sóng
      for (const h of (v.hits || [])) {
        if (h.id <= seenHit) continue; seenHit = Math.max(seenHit, h.id); if (!alive) continue;
        const st = hitStyle(h.kind, h.dmg), k = YQ[b.type], y = k.body * 1.3, dx = (h.px ?? b.x) - b.x, dz = (h.pz ?? b.z) - b.z, d = Math.hypot(dx, dz) || 1, ox = dx / d * k.body * 0.7, oz = dz / d * k.body * 0.7;
        hitAt = nowMs; burst(b.x + ox, y, b.z + oz, st.hex, st.sparks, st.big ? 8 : 5, st.big ? 0.55 : 0.4, 0.55, 2.5); burst(b.x + ox, y, b.z + oz, 0xffffff, st.big ? 8 : 4, 4, 0.3, 0.35, 1);
        if (st.ring) ring(b.x, b.z, 0.6, k.body * 2.8, 0.45, st.hex, 0.12);
        popDamage(b.x + ox, y + k.body * 0.9, b.z + oz, st);
        if (h.kind === 'thuong' && h.px != null) { const s = streaks[streakI++ % streaks.length], u = s.userData; u.life = 0.18; u.len = Math.hypot(b.x - h.px, b.z - h.pz); s.position.set((b.x + h.px) / 2, 1.1, (b.z + h.pz) / 2); s.rotation.y = Math.atan2(b.x - h.px, b.z - h.pz); s.material.color.setHex(st.hex); s.visible = true; }
      }
      // ---- đá đang bay (có quầng sáng + đuôi lửa)
      const ss = v.stones || [];
      ss.forEach((s, i) => {
        const m = stones[i]; if (!m) return; const u = Math.min(1, s.t / s.dur);
        m.visible = true; m.position.set(s.x0 + (s.x1 - s.x0) * u, 1.6 + 2.2 * u * (1 - u) * 2 - u * 0.4, s.z0 + (s.z1 - s.z0) * u); m.rotation.set(t * 8, t * 6, 0);
        const gl = stoneGlows[i]; gl.visible = true; gl.position.copy(m.position); gl.material.opacity = 0.7 + 0.3 * Math.sin(t * 30);
        if (Math.random() < 0.7) burst(m.position.x, m.position.y, m.position.z, 0xff9a30, 1, 0.8, 0.28, 0.35, 0);
      });
      for (let i = ss.length; i < stones.length; i++) { stones[i].visible = false; stoneGlows[i].visible = false; }
      // ---- luồng khí: u = 0..1 đang bay, > 1 vừa chạm (nổ tan ra)
      const ws = v.waves || [];
      waves.forEach((o, i) => {
        const w = ws[ws.length - 1 - i]; if (!w) { o.g.visible = false; return; }
        const u = (nowMs - w.t0) / Math.max(50, w.dur * 1000); if (u < 0 || u > 1.3) { o.g.visible = false; return; }
        const q = wavePoint(w, Math.min(1, u)), fade = u > 1 ? Math.max(0, 1 - (u - 1) / 0.3) : 1, grow = u > 1 ? 1 + (u - 1) * 1.6 : 0.7 + 0.3 * u;
        o.g.visible = true; o.g.position.set(q.x, 1.0, q.z); o.g.rotation.set(0, w.ry, 0.38); o.g.scale.set(grow * 1.1, 1, grow);
        o.core.material.opacity = 0.95 * fade; o.glow.material.opacity = 0.4 * fade * (0.8 + 0.2 * Math.sin(t * 40)); o.g1.material.opacity = 0.5 * fade; o.g2.material.opacity = 0.28 * fade;
        if (u <= 1 && Math.random() < 0.8) burst(q.x - Math.sin(w.ry) * 0.6, 1.0, q.z - Math.cos(w.ry) * 0.6, 0x9fe6ff, 1, 1.2, 0.34, 0.45, 0.2);
      });
      loots.forEach((m, i) => { const d = (v.loot || [])[i]; m.visible = !!d; if (d) m.position.set(d.x, 0.5 + Math.sin(t * 3 + i) * 0.12, d.z); });
      // ---- cập nhật FX
      for (const s of sparks) { if (!s.visible) continue; const u = s.userData; u.life -= dt; if (u.life <= 0) { s.visible = false; continue; } u.vy -= 9 * dt; s.position.x += u.vx * dt; s.position.y = Math.max(0.05, s.position.y + u.vy * dt); s.position.z += u.vz * dt; const k = u.life / u.max; s.scale.setScalar(u.size * (0.4 + k)); s.material.opacity = Math.min(1, k * 1.6); }
      for (const m of rings) { if (!m.visible) continue; const u = m.userData; u.life -= dt; if (u.life <= 0) { m.visible = false; continue; } const k = 1 - u.life / u.max; m.scale.setScalar(u.r0 + (u.r1 - u.r0) * (1 - (1 - k) * (1 - k))); m.material.opacity = 0.85 * (1 - k); }
      for (const s of streaks) { if (!s.visible) continue; const u = s.userData; u.life -= dt; if (u.life <= 0) { s.visible = false; continue; } const k = u.life / 0.18; s.scale.set(0.16 * k + 0.02, 0.16 * k + 0.02, u.len); s.material.opacity = k; }
      for (const s of dmgs) { if (!s.visible) continue; const u = s.userData; u.life -= dt; if (u.life <= 0) { s.visible = false; continue; } const k = 1 - u.life / u.max; s.position.set(u.x, u.y + 1.9 * (1 - (1 - k) * (1 - k)), u.z); const pop = k < 0.12 ? 0.6 + k / 0.12 * 0.6 : 1.2 - 0.2 * Math.min(1, (k - 0.12) * 3); s.scale.set(2.2 * u.k * pop, 1.1 * u.k * pop, 1); s.material.opacity = k > 0.65 ? 1 - (k - 0.65) / 0.35 : 1; }
    },
  };
}
