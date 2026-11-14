// CẢNH hiệu ứng 30 chiêu (Phiên 165, Bản 2 mục 6): vùng cảnh báo (viền + hoa văn Hệ), hạt, vệt, quầng sáng, rung, khựng, tiếng. CHƯA nhìn bằng mắt (không có WebGL ở môi trường AI).
// Logic/số liệu: js/world/chieuFxPlan.js + js/data/chieuFx.js (có test). Mạng: chỉ cần gửi skillId + t0, mỗi máy tự dựng lại theo bậc máy của mình. Không dùng đèn động (rẻ cho điện thoại).
// Mọi lỗi (thiếu WebGL, thiếu tiếng…) bị nuốt: hiệu ứng hỏng thì game vẫn chạy. Gọi dispose() khi rời zone.
import * as THREE from 'three';
import { lapKeHoach } from '../world/chieuFxPlan.js';
import { FX_COLOR, FX_LOAI, HAT_TOI_DA } from '../data/chieuFx.js';

const LIFE = 0.9, FADE = 0.3;   // giây: hạt sống sau lúc phát; vùng cảnh báo mờ dần sau lúc phát

export function createChieuFx(scene, { getTier = () => 'vua', onShake = () => {}, onHitStop = () => {}, play = null } = {}) {
  const jobs = []; let raf = 0, last = 0;
  const say = (cue) => { if (!cue) return; try { if (play) play(cue); else { const s = window.LGT && window.LGT.sfx; if (s && s.play) s.play(cue); } } catch (_) { /* bỏ qua */ } };
  const free = (j) => j.objs.forEach((o) => { scene.remove(o); o.traverse((c) => { if (c.geometry) c.geometry.dispose(); if (c.material) c.material.dispose(); }); });
  const total = () => jobs.reduce((a, j) => a + (j.n || 0), 0), R = (a, b) => a + Math.random() * (b - a);
  function loop(now) {
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    for (let i = jobs.length - 1; i >= 0; i--) {
      const j = jobs[i]; j.t += dt;
      while (j.evts.length && j.evts[0].t <= j.t) { try { j.evts.shift().fn(); } catch (_) { /* bỏ qua */ } }
      try { j.upd(j.t); } catch (_) { j.t = j.life; }
      if (j.t >= j.life) { free(j); jobs.splice(i, 1); }
    }
    raf = jobs.length ? requestAnimationFrame(loop) : 0;
  }
  function add(j) { scene.add(...j.objs); jobs.push(j); if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); } }
  const lines = (pts, loop2, color) => { const g = new THREE.BufferGeometry(); const a = []; const n = pts.length; for (let i = 0; i < (loop2 ? n : n - 1); i++) { const p = pts[i], q = pts[(i + 1) % n]; a.push(p[0], 0, p[1], q[0], 0, q[1]); } g.setAttribute('position', new THREE.Float32BufferAttribute(a, 3)); return new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.9, depthWrite: false })); };
  const segs = (sg, color) => { const a = []; for (const q of sg) a.push(q[0], 0, q[1], q[2], 0, q[3]); const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(a, 3)); return new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.55, depthWrite: false })); };

  /** Dựng hiệu ứng chiêu `id` tại người dùng (x,z) hướng ry; (tx,tz) = mục tiêu (vùng "tại mục tiêu"). Trả kế hoạch đã dùng, hoặc null nếu chiêu lạ / lỗi. */
  function cast(id, { x = 0, z = 0, ry = 0, tx = null, tz = null } = {}) {
    try {
      const p = lapKeHoach(id, getTier()); if (!p) return null;
      const vz = p.vung, ox = vz.taiMucTieu && tx != null ? tx : x, oz = vz.taiMucTieu && tz != null ? tz : z, g0 = p.gong;
      const root = new THREE.Group(); root.position.set(ox, 0.12, oz); root.rotation.y = vz.taiMucTieu || vz.hinh.kieu === 'tron' ? 0 : ry;
      const warn = new THREE.Group(); warn.add(lines(vz.vien, true, vz.mau), segs(vz.van, vz.mau)); root.add(warn);
      const objs = [root], mats = warn.children.map((c) => c.material);
      // quầng sáng lúc phát (cộng sáng, không đèn động)
      let glow = null; if (p.sang > 0) { const rr = vz.hinh.r || Math.min(4, (vz.hinh.dai || 4) * 0.5); glow = new THREE.Mesh(new THREE.CircleGeometry(rr, 28), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); glow.rotation.x = -Math.PI / 2; root.add(glow); }
      // hạt (Points, một lần vẽ): vị trí tính theo hàm của (hạt, u) nên không cộng dồn
      const cap = HAT_TOI_DA[p.tier] * 2 - total(), n = Math.max(0, Math.min(p.n, cap)); let pts = null; const seed = [];
      if (n > 0) {
        const cols = FX_COLOR[p.he], lo = FX_LOAI[p.loai], pos = new Float32Array(n * 3), col = new Float32Array(n * 3), c = new THREE.Color();
        for (let i = 0; i < n; i++) { seed.push({ a: R(0, 6.283), r: Math.sqrt(Math.random()), s: R(0.6, 1), h: Math.random() }); c.setHex(cols[i % 2]).multiplyScalar(lo.sang); col.set([c.r, c.g, c.b], i * 3); }
        const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
        pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: lo.co, vertexColors: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true })); pts.frustumCulled = false; root.add(pts);
      }
      const h = vz.hinh, reach = h.dai || h.r || 4, W = h.rong ? h.rong / 2 : (h.dai || h.r) * 0.3;
      let vet = null; if (p.vet && h.dai) { vet = new THREE.Mesh(new THREE.PlaneGeometry(Math.max(0.3, W), h.dai), new THREE.MeshBasicMaterial({ color: FX_COLOR[p.he][0], transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); vet.rotation.x = -Math.PI / 2; vet.position.set(0, 0.05, h.dai / 2); root.add(vet); }
      const place = (i, u) => {   // u 0..1 từ lúc phát; trả [x,y,z] CỤC BỘ (z = hướng chiêu với vùng dài, tâm với vùng tròn)
        const s = seed[i], e = 1 - (1 - u) * (1 - u);
        switch (p.mode) {
          case 'tia': return [(s.r - 0.5) * 2 * W * (0.4 + 0.6 * e), 0.5 + s.h * 1.2, Math.min(reach, e * reach * s.s)];
          case 'xoay': { const a = s.a + u * 7 * s.s, rr = (vz.hinh.r || 1.5) * (0.5 + 0.5 * s.r); return [Math.sin(a) * rr, 0.2 + u * 2.2 * s.s, Math.cos(a) * rr]; }
          case 'mua': { const a = s.a, rr = reach * s.r; return [Math.sin(a) * rr, Math.max(0.05, 6 * (1 - Math.min(1, u * 1.6 * s.s))), Math.cos(a) * rr]; }
          case 'hut': { const a = s.a, rr = reach * (0.3 + 0.7 * s.r) * (1 - e * 0.85); return [Math.sin(a) * rr, 0.2 + s.h * 0.8, Math.cos(a) * rr]; }
          default: { const a = s.a, rr = reach * s.r * e; return [Math.sin(a) * rr, 0.2 + s.h * 1.4 * (1 - u * 0.5), Math.cos(a) * rr]; }   // 'no'
        }
      };
      const evts = [{ t: 0, fn: () => say(p.am.gong) }, { t: g0, fn: () => { say(p.am.phat); if (p.rung > 0) onShake(p.rung); } }];
      if (p.am.trung) evts.push({ t: g0 + 0.12, fn: () => { say(p.am.trung); if (p.dung > 0) onHitStop(p.dung); } });
      evts.sort((a, b) => a.t - b.t);
      const upd = (t) => {
        const u = Math.max(0, Math.min(1, (t - g0) / LIFE)), after = t - g0;
        const wop = after < 0 ? 1 : Math.max(0, 1 - after / FADE);
        mats.forEach((m, k) => { m.opacity = (k ? 0.55 : 0.9) * wop; });
        if (vz.coDan && after < 0) warn.scale.setScalar(1 - 0.6 * Math.max(0, Math.min(1, t / g0)));
        else warn.scale.setScalar(1);
        if (glow) glow.material.opacity = after < 0 ? 0 : p.sang * 0.5 * Math.max(0, 1 - after / 0.35);
        if (vet) vet.material.opacity = after < 0 ? 0 : 0.5 * Math.max(0, 1 - after / 0.4);
        if (pts) {
          pts.material.opacity = after < 0 ? 0 : Math.min(1, (1 - u) * 1.6);
          if (after >= 0) { const a = pts.geometry.attributes.position.array; for (let i = 0; i < n; i++) { const q = place(i, u); a[i * 3] = q[0]; a[i * 3 + 1] = q[1]; a[i * 3 + 2] = q[2]; } pts.geometry.attributes.position.needsUpdate = true; }
        }
      };
      add({ objs, t: 0, life: g0 + LIFE + 0.05, n, evts, upd });
      return p;
    } catch (_) { return null; }
  }
  return {
    cast,
    clear() { for (const j of jobs.splice(0)) free(j); if (raf) { cancelAnimationFrame(raf); raf = 0; } },
    get active() { return jobs.length; },
    dispose() { this.clear(); },
  };
}
