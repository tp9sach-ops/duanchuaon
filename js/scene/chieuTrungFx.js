// CẢNH kẻ địch trúng đòn (Phiên 174, prompt chiêu thức 3D mục 7): giật/lùi/ngã theo hướng đòn, tia lóe, sóng chấn, số sát thương nảy, chữ phản ứng giữa Hệ, trạng thái nhìn thấy được + vòng đếm ngược.
// Logic/số liệu: js/world/chieuTrung.js (có test). CHƯA nhìn bằng mắt (không có WebGL ở môi trường AI): kích thước, độ sáng là số TẠM.
// Mục tiêu (target) = { g: THREE.Object3D, ry?: góc nhìn, co?: 'thuong'|'elite'|'boss', dai?: chiều cao (m) }. Mọi lỗi bị nuốt: hỏng thì game vẫn chạy. Gọi dispose() khi rời zone.
import * as THREE from 'three';
import { mucTrung, phanUngTrung, kieuSo, soNay, SO, TRANG_THAI, dongHoTrangThai, hieuUngPhanUng, GIAY_PHAN_UNG } from '../world/chieuTrung.js';

const ease = (k) => 1 - (1 - Math.min(1, Math.max(0, k))) ** 2;
function chuSprite(text, mau, co) {   // chữ/số dựng bằng canvas → Sprite (không cần font file); không có document (môi trường test) → null
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas'), x = c.getContext && c.getContext('2d'); if (!x) return null;
  c.width = 256; c.height = 96; x.font = `bold ${co * 2.4}px sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.lineWidth = 8; x.strokeStyle = 'rgba(20,10,5,0.85)'; x.strokeText(text, 128, 48); x.fillStyle = mau; x.fillText(text, 128, 48);
  const tex = new THREE.CanvasTexture(c), sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false }));
  sp.scale.set(1.6, 0.6, 1); sp.renderOrder = 10; return sp;
}

export function createChieuTrungFx(scene, { getTier = () => 'vua', onShake = () => {}, onHitStop = () => {} } = {}) {
  const fx = [], states = new Map(), nhe = () => getTier() === 'yeu';   // bậc máy yếu: bỏ sóng chấn + hạt trạng thái, giữ số + giật + vòng đếm ngược (không mất thông tin chơi)
  let raf = 0, last = 0;
  const dispose1 = (o) => { scene.remove(o); o.traverse((c) => { if (c.geometry) c.geometry.dispose(); if (c.material) { if (c.material.map) c.material.map.dispose(); c.material.dispose(); } }); };
  const wpos = (t) => { const v = new THREE.Vector3(); t.g.getWorldPosition(v); return v; };
  function loop(now) {
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    for (let i = fx.length - 1; i >= 0; i--) { const f = fx[i]; f.t += dt; try { f.upd(f.t); } catch (_) { f.t = f.life; } if (f.t >= f.life) { try { f.done && f.done(); } catch (_) { /* bỏ qua */ } fx.splice(i, 1); } }
    for (const [tg, st] of states) { try { st.upd(dt); } catch (_) { st.xong = true; } if (st.xong) { st.free(); states.delete(tg); } }
    raf = (fx.length || states.size) ? requestAnimationFrame(loop) : 0;
  }
  const run = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); } };
  const add = (f) => { fx.push(f); run(); };

  /** Kẻ địch `tg` trúng đòn. o = { ax, az (vị trí kẻ đánh), id (chiêu), muc?, chiMang?, ketLieu?, nho?, damage?, loai? ('thuong'|'chiMang'|'ketLieu'|'thieuDot'|'doc'), trenKhong?, luc? }. Trả kế hoạch phản ứng (hoặc null). */
  function hit(tg, o = {}) {
    try {
      if (!tg || !tg.g) return null;
      const g = tg.g, p0 = g.position.clone(), r0 = g.rotation.clone(), hg = { ax: o.ax, az: o.az, x: p0.x, z: p0.z, ry: tg.ry || 0, trenKhong: !!o.trenKhong };
      const muc = o.muc || mucTrung({ id: o.id, chiMang: o.chiMang, ketLieu: o.ketLieu, nho: o.nho });
      const plan = phanUngTrung({ muc, co: tg.co || 'thuong', luc: o.luc == null ? 0.5 : o.luc, ...hg });
      const M = plan, gx = M.giat[0], gz = M.giat[1], T = Math.max(0.08, M.giatMs / 1000), cao = tg.dai || 2.2;
      // 1) giật + lùi (+ nghiêng/ngã): ra nhanh, về chậm. Giật theo hướng thân bị đẩy (ngược hướng đòn).
      add({ t: 0, life: T * 2.2 + (M.nga ? 0.5 : 0), upd(t) {
        const out = ease(t / (T * 0.45)), back = t > T * 0.45 ? ease((t - T * 0.45) / (T * 1.75)) : 0, k = Math.max(0, out - back), pen = M.nga ? Math.max(0, 1 - Math.max(0, t - T * 2.2) / 0.5) : 0;
        g.position.set(p0.x + gx * M.lui * k, p0.y, p0.z + gz * M.lui * k);
        g.rotation.set(r0.x + (-gz) * 0.35 * k + (M.nga ? -gz * 1.1 * pen * k : 0), r0.y + M.xoay * k, r0.z + gx * 0.35 * k + (M.nga ? gx * 1.1 * pen * k : 0));
      }, done() { g.position.copy(p0); g.rotation.copy(r0); } });
      // 2) tia lóe (cộng sáng, nhỏ hoặc lớn) + sóng chấn (chỉ mức nặng, máy không yếu)
      const c = wpos(tg); c.y += cao * 0.55;
      const fl = new THREE.Mesh(new THREE.SphereGeometry(M.tia === 'lon' ? 0.55 : 0.3, 10, 8), new THREE.MeshBasicMaterial({ color: 0xfff1c9, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })); fl.position.copy(c); scene.add(fl);
      add({ t: 0, life: 0.14, upd(t) { const k = t / 0.14; fl.scale.setScalar(0.6 + k * 1.2); fl.material.opacity = 0.9 * (1 - k); }, done() { dispose1(fl); } });
      if (M.songChan && !nhe()) {
        const w = new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 32), new THREE.MeshBasicMaterial({ color: 0xffd9a0, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); w.rotation.x = -Math.PI / 2; w.position.set(p0.x, p0.y + 0.1, p0.z); scene.add(w);
        add({ t: 0, life: 0.45, upd(t) { const k = ease(t / 0.45); w.scale.setScalar(0.3 + 2.4 * k); w.material.opacity = 0.7 * (1 - k); }, done() { dispose1(w); } });
      }
      // 3) khựng hình + rung màn (chỉ báo cho nơi gọi; khựng chỉ nên áp cho hai nhân vật liên quan)
      if (M.dungMs > 0) onHitStop(M.dungMs / 1000); if (M.rung > 0) onShake(M.rung);
      // 4) số sát thương nảy lên
      if (o.damage != null) {
        const ks = kieuSo({ loai: o.loai || (o.ketLieu ? 'ketLieu' : o.chiMang ? 'chiMang' : 'thuong'), muc: M.muc }), sp = chuSprite(String(Math.round(o.damage)), ks.mau, ks.co);
        if (sp) { const lech = (Math.random() - 0.5) * 2, b = wpos(tg); sp.position.copy(b); scene.add(sp); add({ t: 0, life: SO.song, upd(t) { const s = soNay(t, { lech }); sp.position.set(b.x + s.x, b.y + s.y * (cao / 2.2), b.z); sp.scale.set(1.6 * s.scale, 0.6 * s.scale, 1); sp.material.opacity = s.alpha; }, done() { dispose1(sp); } }); }
      }
      return plan;
    } catch (_) { return null; }
  }

  /** Phản ứng giữa Hệ trên `tg`: hiệu ứng 0,5 s + chữ nổi ngắn trên đầu. Không phản ứng → null. */
  function phanUng(tg, heA, heB) {
    try {
      const r = hieuUngPhanUng(heA, heB); if (!r || !tg || !tg.g) return null;
      const b = wpos(tg), cao = tg.dai || 2.2, sp = chuSprite(r.chu, r.mau, 24);
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 8), new THREE.MeshBasicMaterial({ color: r.mau, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false })); orb.position.set(b.x, b.y + cao * 0.5, b.z); scene.add(orb);
      add({ t: 0, life: GIAY_PHAN_UNG, upd(t) { const k = t / GIAY_PHAN_UNG; orb.scale.setScalar(0.8 + 1.6 * ease(k)); orb.material.opacity = 0.8 * (1 - k); }, done() { dispose1(orb); } });
      if (sp) { sp.position.set(b.x, b.y + cao + 0.5, b.z); scene.add(sp); add({ t: 0, life: 1.1, upd(t) { sp.position.y = b.y + cao + 0.5 + 0.5 * ease(t / 1.1); sp.material.opacity = t > 0.7 ? 1 - (t - 0.7) / 0.4 : 1; }, done() { dispose1(sp); } }); }
      return r;
    } catch (_) { return null; }
  }

  /** Gắn trạng thái `loai` (thieuDot|choang|hatTung|troi|lamCham|dongBang|moMat) lên `tg` trong `giay`: biểu tượng trên đầu + vòng đếm ngược dưới chân (nếu là khống chế) + dấu hiệu màu quanh người. Gọi lại = làm mới thời gian. */
  function status(tg, loai, giay = 2) {
    try {
      const T = TRANG_THAI[loai]; if (!T || !tg || !tg.g) return null;
      let st = states.get(tg); if (!st) { st = { dang: new Map(), upd() {}, xong: false, free() {} }; states.set(tg, st); }
      const old = st.dang.get(loai); if (old) { old.tong = giay; old.con = giay; run(); return dongHoTrangThai(loai, giay, giay); }
      const cao = tg.dai || 2.2, grp = new THREE.Group(), b = wpos(tg);
      let vong = null; if (T.vong) { vong = new THREE.Mesh(new THREE.RingGeometry(0.75, 0.9, 40, 1, 0, Math.PI * 2), new THREE.MeshBasicMaterial({ color: T.mau, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false })); vong.rotation.x = -Math.PI / 2; vong.position.y = 0.08; grp.add(vong); }
      const aura = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, cao, 14, 1, true), new THREE.MeshBasicMaterial({ color: T.mau, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); aura.position.y = cao / 2; grp.add(aura);
      const ico = chuSprite(T.chu, T.mau, 20); if (ico) { ico.position.y = cao + 0.45; grp.add(ico); }
      grp.position.set(b.x, b.y, b.z); scene.add(grp);
      const item = { tong: giay, con: giay, grp, vong, aura, ico }; st.dang.set(loai, item);
      const prevU = st.upd, prevF = st.free;
      st.upd = (dt) => {
        prevU(dt); if (item.chet) return; item.con -= dt; const p = wpos(tg); grp.position.set(p.x, p.y, p.z); const d = dongHoTrangThai(loai, item.con, item.tong);
        aura.material.opacity = 0.14 + 0.06 * Math.sin(performance.now() / 150);
        if (vong) { vong.geometry.dispose(); vong.geometry = new THREE.RingGeometry(0.75, 0.9, 40, 1, 0, Math.PI * 2 * Math.max(0.001, d.tiLe)); }
        if (item.con <= 0) { item.chet = true; dispose1(grp); st.dang.delete(loai); }
        if (!st.dang.size) st.xong = true;
      };
      st.free = () => { prevF(); if (grp.parent) dispose1(grp); };
      run(); return dongHoTrangThai(loai, giay, giay);
    } catch (_) { return null; }
  }

  return {
    hit, phanUng, status,
    clear() { for (const f of fx.splice(0)) { try { f.done && f.done(); } catch (_) { /* bỏ qua */ } } for (const st of states.values()) { try { st.free(); } catch (_) { /* bỏ qua */ } } states.clear(); if (raf) { cancelAnimationFrame(raf); raf = 0; } },
    get active() { return fx.length + states.size; },
    dispose() { this.clear(); },
  };
}
