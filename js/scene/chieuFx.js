// CẢNH hiệu ứng 30 chiêu (Phiên 165, Bản 2 mục 6): vùng cảnh báo (viền + hoa văn Hệ), hạt, vệt, quầng sáng, rung, khựng, tiếng. CHƯA nhìn bằng mắt (không có WebGL ở môi trường AI).
// Logic/số liệu: js/world/chieuFxPlan.js + js/data/chieuFx.js (có test). Mạng: chỉ cần gửi skillId + t0, mỗi máy tự dựng lại theo bậc máy của mình. Không dùng đèn động (rẻ cho điện thoại).
// Mọi lỗi (thiếu WebGL, thiếu tiếng…) bị nuốt: hiệu ứng hỏng thì game vẫn chạy. Gọi dispose() khi rời zone.
import * as THREE from 'three';
import { lapKeHoach } from '../world/chieuFxPlan.js';
import { FX_LOAI, HAT_TOI_DA } from '../data/chieuFx.js';
import { lapLop, doSangLop, chiaHat, CO_HAT } from '../world/chieuLop.js';
import { taoBang } from './fxBang.js';   // Phiên 183: nối BĂNG + NƯỚC thật (mã Phiên 180 đã viết nhưng chưa được gọi) cho chiêu Hệ thủy
import { taoKim } from './fxKim.js';   // Phiên 183: nối KIM LOẠI + SÉT thật (mã Phiên 181 đã viết nhưng chưa được gọi) cho chiêu Hệ kim
import { taoLua } from './fxLua.js';   // Phiên 177 (mục 1): lửa thật cho chiêu Hệ hỏa — lưỡi lửa nhiều lớp, khói, tàn lửa, vũng sáng nền (Sprite phẳng; Phiên 202 dùng làm bản dự phòng)
import { taoHoa } from './fxHoa.js';   // Phiên 202 (mục 2 hiệu ứng 3D V2): lửa KHỐI shader, 6 chữ ký riêng cho 6 chiêu Hỏa
import { taoTho } from './fxTho.js';   // Phiên 211 (mục 6 hiệu ứng 3D V2): ĐẤT ĐÁ KHỐI 3D — gai đá, tấm đá, núi rơi, nền nứt tỏa tia; 6 chữ ký riêng cho 6 chiêu Thổ
import * as TX from './fxTex.js';   // Phiên 176: kết cấu tròn mềm/quầng/khói/vệt/sóng/tia sao (hết ô vuông)
import { lapAm } from '../world/chieuAm.js';   // Phiên 173: gồng/phát/trúng/dư âm theo Hệ + chất liệu kẻ địch   // Phiên 172: sáu lớp (lõi, thân, quầng+vệt, hạt 3 cỡ, decal nền, tàn dư), màu từ bảng màu

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
  function cast(id, { x = 0, z = 0, ry = 0, tx = null, tz = null, chatLieu = 'dathit', khoangCach = 0 } = {}) {
    try {
      const p = lapKeHoach(id, getTier()); if (!p) return null;
      const vz = p.vung, ox = vz.taiMucTieu && tx != null ? tx : x, oz = vz.taiMucTieu && tz != null ? tz : z, g0 = p.gong;
      const root = new THREE.Group(); root.position.set(ox, 0.12, oz); root.rotation.y = vz.taiMucTieu || vz.hinh.kieu === 'tron' ? 0 : ry;
      const warn = new THREE.Group(); warn.add(lines(vz.vien, true, vz.mau), segs(vz.van, vz.mau)); root.add(warn);
      const objs = [root], mats = warn.children.map((c) => c.material);
      const L = lapLop(id, getTier()), lp = L.lop, h = vz.hinh, reach = h.dai || h.r || 4, W = h.rong ? h.rong / 2 : (h.dai || h.r) * 0.3;
      const R2 = h.r || Math.min(3, W * 1.2 + 0.8), zD = h.r || h.taiMucTieu ? 0 : reach * 0.7;   // chỗ in decal / tàn dư (tâm vùng tròn hoặc điểm trúng của vùng dài)
      // lớp 3a: quầng sáng lúc phát (cộng sáng, không đèn động)
      let glow = null; if (lp.quang.bat) { const rr = h.r || Math.min(4, (h.dai || 4) * 0.5); glow = new THREE.Mesh(new THREE.CircleGeometry(rr, 28), new THREE.MeshBasicMaterial({ color: lp.quang.mau, map: TX.glow(), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); glow.rotation.x = -Math.PI / 2; root.add(glow); }
      // lớp 1: lõi sáng (gần trắng, nhỏ, đỉnh sáng nhất, "thở" 3–8%); bắt đầu từ lúc gồng (hút ánh sáng vào người)
      const core = new THREE.Mesh(new THREE.SphereGeometry(lp.loi.co, 12, 8), new THREE.MeshBasicMaterial({ color: lp.loi.mau, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); core.position.set(0, 1.1, 0); core.frustumCulled = false; root.add(core);
      const spr = (tex, mau, ty) => { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: mau, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: true })); m.frustumCulled = false; m.position.set(0, 1.1, 0); root.add(m); return m; };
      const halo1 = spr(TX.glow(), lp.loi.mau), halo2 = spr(TX.glow(), lp.quang.mau), flare = spr(TX.flare(), lp.loi.mau);   // quầng trắng ngà + quầng màu Hệ (bloom giả) + tia sao lúc bùng nổ
      // lớp 2: thân năng lượng — Hệ hỏa vẽ LỬA THẬT (Phiên 177; Phiên 202: khối shader 6 chữ ký); Hệ khác chưa có bộ riêng thì bỏ qua
      let lua = null;   // tên giữ nguyên cho gọn: là bộ vật thể "thân" của Hệ (lửa / băng·nước / kim·sét / đất đá); Hệ mộc chưa có thì null
      if (lp.than.bat) {
        const o2 = { tier: p.tier, mode: p.mode, co: lp.loi.co, reach, R2, zD };
        try {
          if (p.he === 'hoa') { try { lua = taoHoa({ ...o2, id }); } catch (_) { lua = null; } if (!lua) lua = taoLua(o2); }   // Phiên 202: khối shader; chiêu lạ hoặc dựng lỗi → lối cũ
          else if (p.he === 'thuy' && (p.loai === 'bang' || p.loai === 'nuoc')) lua = taoBang({ ...o2, loai: p.loai });
          else if (p.he === 'kim' && p.loai === 'kim') lua = taoKim(o2);
          else if (p.he === 'tho') lua = taoTho({ ...o2, id });   // Phiên 211: Thổ 3D; id lạ → null (bỏ lớp thân), dựng lỗi → bắt ở catch dưới
          if (lua) root.add(lua.group);
        } catch (_) { lua = null; }   // vẽ hỏng thì bỏ lớp thân, game vẫn chạy
      }
      // lớp 4: hạt chia 3 cỡ cùng lúc (lớn chậm, vừa, nhỏ nhanh); vị trí là hàm của (hạt, u) nên không cộng dồn
      const cap = HAT_TOI_DA[p.tier] * 2 - total(), n = Math.max(0, Math.min(p.n, cap)), split = chiaHat(n), groups = [], lo = FX_LOAI[p.loai], mixC = new THREE.Color();
      for (const [k, cnt] of [['lon', split.lon], ['vua', split.vua], ['nho', split.nho]]) {
        if (cnt <= 0) continue;
        const pos = new Float32Array(cnt * 3), col = new Float32Array(cnt * 3), seed = [];
        for (let i = 0; i < cnt; i++) { seed.push({ a: R(0, 6.283), r: Math.sqrt(Math.random()), s: R(0.6, 1), h: Math.random() }); const bs = Math.random() < lp.hat.tiLeBuSung ? lp.hat.buSung : lp.hat.mau[i % 3]; mixC.setHex(bs).multiplyScalar(lo.sang); col.set([mixC.r, mixC.g, mixC.b], i * 3); }
        const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
        const pt = new THREE.Points(geo, new THREE.PointsMaterial({ size: lo.co * CO_HAT[k].co * 2.4, vertexColors: true, map: TX.softDot(), alphaTest: 0.004, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true })); pt.frustumCulled = false; root.add(pt);
        groups.push({ pt, seed, cnt, toc: CO_HAT[k].toc });
      }
      // lớp 3b: vệt thon dần (ribbon): rộng ở gốc, nhọn ở đầu, hẹp dần + nhạt dần
      let vet = null; if (p.vet && h.dai) { const w = Math.max(0.3, W) / 2, g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-w, 0.05, 0, w, 0.05, 0, 0.04, 0.05, h.dai, -0.04, 0.05, h.dai], 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0.55, 1, 0.45, 1], 2)); g.setIndex([0, 1, 2, 0, 2, 3]); vet = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: lp.quang.mau, map: TX.streak(), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); root.add(vet); }
      // lớp 5: tác động môi trường — decal nền (vết cháy/nứt/băng… tan 3–5 s) + sóng chấn (máy mạnh, chiêu mạnh)
      let decal = null, wave = null;
      if (lp.moiTruong.bat) {
        decal = new THREE.Group(); decal.position.set(0, -0.08, zD);
        const dk = new THREE.Mesh(new THREE.CircleGeometry(R2, 24), new THREE.MeshBasicMaterial({ color: lp.moiTruong.mau, transparent: true, opacity: 0, depthWrite: false })); dk.rotation.x = -Math.PI / 2;
        const dl = segs(vz.van.map((q) => [q[0] * 0.9, q[1] * 0.9, q[2] * 0.9, q[3] * 0.9]), lp.moiTruong.vienMau); dl.material.opacity = 0; if (zD) dl.position.z = -zD;
        decal.add(dk, dl); root.add(decal);
        if (lp.moiTruong.songChan) { wave = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), new THREE.MeshBasicMaterial({ color: lp.quang.mau, map: TX.ring(), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); wave.rotation.x = -Math.PI / 2; wave.position.set(0, -0.06, zD); root.add(wave); }
      }
      // lớp 6: tàn dư — khói/tro/sương/tinh thể bay lên chậm và tan dần 1–2 s sau khi hết hiệu lực
      let tan = null; const tn = Math.max(0, Math.min(lp.tanDu.n, HAT_TOI_DA[p.tier] * 2 - total() - n)), tseed = [];
      if (lp.tanDu.bat && tn > 0) {
        const pos = new Float32Array(tn * 3), geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        for (let i = 0; i < tn; i++) tseed.push({ a: R(0, 6.283), r: Math.sqrt(Math.random()), v: R(0.3, 0.9) });
        tan = new THREE.Points(geo, new THREE.PointsMaterial({ color: lp.tanDu.mau, map: TX.smoke(), size: FX_LOAI[lp.tanDu.loai].co * 5, transparent: true, opacity: 0, depthWrite: false, sizeAttenuation: true })); tan.frustumCulled = false; root.add(tan);
      }
      const place = (i, u, sd) => {   // u 0..1 từ lúc phát; trả [x,y,z] CỤC BỘ (z = hướng chiêu với vùng dài, tâm với vùng tròn)
        const s = sd[i], e = 1 - (1 - u) * (1 - u);
        switch (p.mode) {
          case 'tia': return [(s.r - 0.5) * 2 * W * (0.4 + 0.6 * e), 0.5 + s.h * 1.2, Math.min(reach, e * reach * s.s)];
          case 'xoay': { const a = s.a + u * 7 * s.s, rr = (vz.hinh.r || 1.5) * (0.5 + 0.5 * s.r); return [Math.sin(a) * rr, 0.2 + u * 2.2 * s.s, Math.cos(a) * rr]; }
          case 'mua': { const a = s.a, rr = reach * s.r; return [Math.sin(a) * rr, Math.max(0.05, 6 * (1 - Math.min(1, u * 1.6 * s.s))), Math.cos(a) * rr]; }
          case 'hut': { const a = s.a, rr = reach * (0.3 + 0.7 * s.r) * (1 - e * 0.85); return [Math.sin(a) * rr, 0.2 + s.h * 0.8, Math.cos(a) * rr]; }
          default: { const a = s.a, rr = reach * s.r * e; return [Math.sin(a) * rr, 0.2 + s.h * 1.4 * (1 - u * 0.5), Math.cos(a) * rr]; }   // 'no'
        }
      };
      // Âm thanh: kho chiêu thức (gồng → phát → trúng → dư âm); chưa có LGT.sfx.playFile (hoặc có hàm play tự truyền vào) thì dùng cue cũ
      const am = lapAm(id, { chatLieu, coTrung: !!p.am.trung, khoangCach }), sf = () => { try { return window.LGT && window.LGT.sfx; } catch (_) { return null; } };
      const nghe = (k, cueCu) => { const s2 = sf(), it = am && am[k]; if (!play && s2 && s2.playFile && it) s2.playFile(it.file, { gain: it.gain }); else say(cueCu); };
      try { const s2 = sf(); if (!play && s2 && s2.preloadFiles && am) s2.preloadFiles([am.gong, am.phat, am.trung, am.duAm].filter(Boolean).map((q) => q.file)); } catch (_) { /* bỏ qua */ }
      const evts = [{ t: 0, fn: () => nghe('gong', p.am.gong) }, { t: g0, fn: () => { nghe('phat', p.am.phat); if (p.rung > 0) onShake(p.rung); } }, { t: g0 + (am ? am.duAm.tre : 0.12), fn: () => { if (am && am.duAm) nghe('duAm', null); } }];
      if (p.am.trung) evts.push({ t: g0 + 0.12, fn: () => { nghe('trung', p.am.trung); if (p.dung > 0) onHitStop(p.dung); } });
      evts.sort((a, b) => a.t - b.t);
      const job = { objs, t: 0, life: g0 + Math.max(LIFE + 0.05, lp.moiTruong.bat ? lp.moiTruong.t1 : 0, lp.tanDu.bat ? lp.tanDu.t1 : 0) + 0.05, n, evts, upd: null };
      job.upd = (t) => {
        const after = t - g0, u = Math.max(0, Math.min(1, after / LIFE));
        const wop = after < 0 ? 1 : Math.max(0, 1 - after / FADE);
        mats.forEach((m, k) => { m.opacity = (k ? 0.55 : 0.9) * wop; });
        if (vz.coDan && after < 0) warn.scale.setScalar(1 - 0.6 * Math.max(0, Math.min(1, t / g0)));
        else warn.scale.setScalar(1);
        // lớp 1: lõi — hút sáng lúc gồng (to dần tại người), bay theo đầu chiêu khi phát
        const bl = doSangLop(L, 'loi', after); core.material.opacity = (after < 0 && vz.taiMucTieu) ? 0 : bl;
        const ce = 1 - (1 - Math.min(1, Math.max(0, after) / 0.35)) ** 2; core.scale.setScalar(0.6 + 0.9 * bl); core.position.set(0, 1.1, p.mode === 'tia' && after > 0 ? Math.min(reach, ce * reach) : 0);
        const pz = p.mode === 'tia' && after > 0 ? Math.min(reach, ce * reach) : 0, br = 1 + 0.06 * Math.sin(t * 17);   // quầng "thở"
        halo1.position.set(0, 1.1, pz); halo2.position.set(0, 1.1, pz); flare.position.set(0, 1.1, pz);
        halo1.material.opacity = Math.min(1, bl * 0.9); halo1.scale.setScalar(lp.loi.co * 7 * br * (0.6 + 0.8 * bl)); halo2.material.opacity = Math.min(1, bl * 0.55); halo2.scale.setScalar(lp.loi.co * 15 * br * (0.5 + 0.7 * bl));
        { const fk = Math.max(0, Math.min(1, after / 0.28)); flare.material.opacity = after < 0 ? 0 : 0.95 * (1 - fk) * (1 - fk); flare.scale.setScalar(lp.loi.co * (6 + 22 * fk)); flare.material.rotation = fk * 0.8; }   // tia sao bùng lúc phát
        if (lua) lua.update(t, after, doSangLop(L, 'than', after), bl, pz);
        if (glow) glow.material.opacity = p.sang * 0.5 * doSangLop(L, 'quang', after);
        if (vet) { vet.material.opacity = 0.5 * doSangLop(L, 'quang', after); vet.scale.x = 1 - 0.6 * Math.max(0, Math.min(1, after / 0.5)); }
        const bh = doSangLop(L, 'hat', after);
        for (const gr of groups) {
          gr.pt.material.opacity = after < 0 ? 0 : Math.min(1, bh * 1.6);
          if (after >= 0) { const a = gr.pt.geometry.attributes.position.array, uu = Math.min(1, u * gr.toc); for (let i = 0; i < gr.cnt; i++) { const q = place(i, uu, gr.seed); a[i * 3] = q[0]; a[i * 3 + 1] = q[1]; a[i * 3 + 2] = q[2]; } gr.pt.geometry.attributes.position.needsUpdate = true; }
        }
        if (after > LIFE) job.n = 0;   // hạt đã tan: không tính vào trần số hạt của các chiêu sau
        if (decal) { const d = doSangLop(L, 'moiTruong', after); decal.children[0].material.opacity = 0.5 * d; decal.children[1].material.opacity = 0.8 * d; }
        if (wave) { const k = Math.max(0, Math.min(1, after / 0.45)); wave.scale.setScalar(Math.max(0.01, R2 * 1.2 * (1 - (1 - k) * (1 - k)))); wave.material.opacity = after < 0 ? 0 : 0.7 * (1 - k); }
        if (tan) {
          const tt = after - lp.tanDu.t0, bt = doSangLop(L, 'tanDu', after); tan.material.opacity = 0.6 * bt;
          if (tt >= 0 && bt > 0) { const a = tan.geometry.attributes.position.array; for (let i = 0; i < tn; i++) { const s = tseed[i], rr = R2 * s.r; a[i * 3] = Math.sin(s.a + tt * 0.3) * rr; a[i * 3 + 1] = 0.2 + tt * s.v; a[i * 3 + 2] = Math.cos(s.a + tt * 0.3) * rr + zD; } tan.geometry.attributes.position.needsUpdate = true; }
        }
      };
      add(job);
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
