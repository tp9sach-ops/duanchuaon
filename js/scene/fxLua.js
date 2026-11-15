// VẼ LỬA THẬT (Phiên 177, mục 1 của docs/KE_HOACH_HIEU_UNG_3D.md). Số liệu/chuyển động: js/world/lua.js (có test). CHƯA nhìn bằng mắt (không có WebGL ở môi trường AI): cỡ, độ sáng là số TẠM.
// Lưỡi lửa = Sprite quay mặt về camera, kết cấu canvas vẽ hình giọt nhiều lớp (đỏ ngoài → cam → vàng → trắng nóng ở gốc), cộng sáng (AdditiveBlending), đổi màu nguội dần theo tuổi.
// Khói = Sprite đen xám mờ (không cộng sáng). Tàn lửa = Points tròn mềm, sáng nhấp nháy. Vũng sáng cam trên nền nhấp nháy. KHÔNG dùng đèn động (rẻ cho điện thoại).
// Không có document (môi trường test) → kết cấu null, lưỡi lửa thành chấm trắng nhưng không lỗi. Chiêu gọi dispose qua việc xóa group khỏi cảnh (chieuFx.free duyệt mọi con).
import * as THREE from 'three';
import { glow, softDot, smoke } from './fxTex.js';
import { lapLua, ngonLua, khoiLua, tanLua, viTriLua, SO_KIEU } from '../world/lua.js';

const cache = {};
function veLuoi(g, w, h, seed) {   // vẽ MỘT lưỡi lửa hình giọt, mũi nhọn hướng lên
  let s = seed * 9973 + 17; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  g.clearRect(0, 0, w, h); g.globalCompositeOperation = 'lighter';
  const dom = (x, y, rx, ry, rgb, a) => { g.save(); g.translate(x, y); g.scale(rx, ry); const q = g.createRadialGradient(0, 0, 0, 0, 0, 1); q.addColorStop(0, `rgba(${rgb},${a})`); q.addColorStop(0.5, `rgba(${rgb},${a * 0.45})`); q.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = q; g.beginPath(); g.arc(0, 0, 1, 0, 6.2832); g.fill(); g.restore(); };
  const lop = (n, rgb, a, rBase, rBot, y0, y1) => { for (let i = 0; i < n; i++) { const k = i / (n - 1), y = h * (y0 + (y1 - y0) * k), lech = Math.sin(k * 3.4 + seed * 1.7) * w * 0.07 * k + (rnd() - 0.5) * w * 0.05, r = w * (rBot + (rBase - rBot) * (1 - k)) * (0.85 + 0.3 * rnd()); dom(w / 2 + lech, y, r, r * 1.55, rgb, a); } };
  lop(22, '205,38,8', 0.5, 0.34, 0.07, 0.84, 0.1);   // thân đỏ sẫm, rộng ở gốc, thon dần lên
  lop(18, '255,115,18', 0.55, 0.27, 0.05, 0.86, 0.22);   // lớp cam
  lop(14, '255,205,70', 0.6, 0.2, 0.04, 0.87, 0.45);   // lớp vàng
  lop(6, '255,248,225', 0.7, 0.12, 0.03, 0.85, 0.66);   // lõi trắng nóng, chỉ ở gốc
  for (let i = 0; i < 2 + (seed % 2); i++) { const x = w * (0.4 + rnd() * 0.2), y = h * (0.12 + rnd() * 0.12); dom(x, y, w * 0.05, h * 0.09, '255,140,30', 0.6); }   // mũi lưỡi lửa nhọn bên trên
  g.globalCompositeOperation = 'destination-in';
  const m = g.createLinearGradient(0, 0, 0, h); m.addColorStop(0, 'rgba(0,0,0,0)'); m.addColorStop(0.1, 'rgba(0,0,0,0.65)'); m.addColorStop(0.3, 'rgba(0,0,0,1)'); m.addColorStop(0.92, 'rgba(0,0,0,1)'); m.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = m; g.fillRect(0, 0, w, h);
}
const luoiTex = (k) => { const key = 'luoi' + k; if (key in cache) return cache[key]; let t = null; try { if (typeof document !== 'undefined') { const c = document.createElement('canvas'); c.width = 128; c.height = 256; const g = c.getContext('2d'); if (g) { veLuoi(g, 128, 256, k + 1); t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true; } } } catch (_) { t = null; } return (cache[key] = t); };

/**
 * Dựng bộ lửa cho một chiêu Hệ hỏa. o = { tier, mode, co (cỡ lõi chiêu), reach, R2, zD }. Thêm `.group` vào gốc của chiêu (cùng hệ tọa độ với lõi/quầng).
 * Mỗi khung hình gọi update(t, after, than, gong, pz): t = giây từ lúc bắt đầu gồng, after = giây từ lúc phát (âm = đang gồng), than/gong = độ sáng 0..1 của lớp thân/lõi, pz = vị trí đầu chiêu dọc hướng bay.
 */
export function taoLua(o = {}) {
  const P = lapLua(o.tier, o.mode, { co: o.co }), grp = new THREE.Group(), reach = o.reach || 4, R2 = o.R2 || 2, zD = o.zD || 0;
  grp.frustumCulled = false;
  const nhom = P.luoi.map((s) => { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: luoiTex(s.kieu), color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: true })); m.center.set(0.5, 0.08); m.frustumCulled = false; m.visible = false; grp.add(m); return m; });
  const khoi = P.khoi.map(() => { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: smoke(), color: 0x2a2521, transparent: true, opacity: 0, depthWrite: false })); m.frustumCulled = false; m.visible = false; grp.add(m); return m; });
  let tan = null, tanCol = null;
  if (P.nTan > 0) {
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P.nTan * 3), 3)); tanCol = new Float32Array(P.nTan * 3); g.setAttribute('color', new THREE.BufferAttribute(tanCol, 3));
    tan = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.16, vertexColors: true, map: softDot(), alphaTest: 0.004, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true })); tan.frustumCulled = false; grp.add(tan);
  }
  let vung = null;   // vũng sáng cam trên nền (bỏ ở máy yếu)
  if (o.tier !== 'yeu') { vung = new THREE.Mesh(new THREE.CircleGeometry(Math.max(1.2, Math.min(R2, reach * 0.5) * 1.1), 24), new THREE.MeshBasicMaterial({ color: 0xff6a1a, map: glow(), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); vung.rotation.x = -Math.PI / 2; vung.position.set(0, 0.07, o.mode === 'tia' ? 0 : zD); grp.add(vung); }
  const S = P.kichCo, ban = [];   // gốc từng lưỡi (để tàn lửa bay từ đúng chỗ)

  function update(t, after, than, gong, pz) {
    const k = Math.max(than, 0), ctx = { reach, R2, zD, pz: pz || 0, after, u: Math.max(0, Math.min(1, after / 0.9)) }, dangGong = after < 0;
    // lưỡi lửa
    for (let i = 0; i < P.luoi.length; i++) {
      const s = P.luoi[i], m = nhom[i];
      if (dangGong) {   // đang gồng: chỉ vài lưỡi nhỏ bốc lên ở tay/người, to dần theo độ sáng lõi
        if (!s.gong || gong <= 0.01) { m.visible = false; continue; }
        const st = ngonLua(s, t), c = gong * 0.4; m.visible = true; m.position.set((s.r - 0.5) * 0.5, 0.7 + st.cao * S * 0.5, (s.a - 3.14) * 0.05);
        m.scale.set(S * 0.5 * st.sx * c, S * st.sy * c, 1); m.material.opacity = st.op * Math.min(1, gong * 1.2) * 0.7; m.material.color.setRGB(st.tint[0], st.tint[1], st.tint[2]); m.material.rotation = st.lac * 0.25; ban[i] = [m.position.x, 0.7, m.position.z]; continue;
      }
      const v = viTriLua(P.mode, s, ctx);
      if (!v.hien || k <= 0.005) { m.visible = false; continue; }
      const st = ngonLua(s, t), mul = v.mul * (0.4 + 0.6 * Math.min(1, k * 1.3));
      m.visible = true; m.position.set(v.x + st.lac * S * 0.4, v.y0 + (v.roi ? 0 : st.cao * S), v.z);
      const luc = v.roi ? 1 : st.op;   // lưỡi đang rơi (sao băng) sáng liên tục
      m.scale.set(S * 0.52 * st.sx * mul * (v.roi ? 0.8 : 1), S * st.sy * mul * (v.roi ? 1.25 : 1), 1);
      m.material.opacity = Math.min(1, luc * Math.min(1, k * 1.5)) * 0.85; m.material.color.setRGB(st.tint[0], st.tint[1], st.tint[2]); m.material.rotation = v.roi ? 0 : st.lac * 0.3; ban[i] = [v.x, v.y0, v.z];
    }
    // khói đen mỏng bốc lên phía trên ngọn lửa (nghe lửa cháy thật, không phải ánh sáng suông)
    for (let i = 0; i < P.khoi.length; i++) {
      const s = P.khoi[i], m = khoi[i]; if (dangGong || k <= 0.05) { m.visible = false; continue; }
      const b = viTriLua(P.mode, { ...s, dau: s.r < 0.4, tre: s.vet, toc: s.toc }, ctx); if (!b.hien) { m.visible = false; continue; }
      const sm = khoiLua(s, t), cs = sm.kichCo * S; m.visible = true; m.position.set(b.x + sm.x, b.y0 + sm.cao * (S / 1.6), b.z + sm.z); m.scale.set(cs, cs, 1); m.material.opacity = sm.op * Math.min(1, k * 1.2); m.material.rotation = s.a + t * 0.2;
    }
    // tàn lửa bay lên, nhấp nháy rồi tắt
    if (tan) {
      const a = tan.geometry.attributes.position.array;
      for (let i = 0; i < P.tan.length; i++) {
        const s = P.tan[i], g = ban[(i * 7) % Math.max(1, P.luoi.length)] || [0, 0, 0], q = tanLua(s, t), on = (dangGong || k <= 0.05) ? 0 : q.op * Math.min(1, k * 1.4);
        a[i * 3] = g[0] + q.x; a[i * 3 + 1] = g[1] + q.y; a[i * 3 + 2] = g[2] + q.z;
        const sang = on * (0.55 + 0.45 * (1 - q.p)); tanCol[i * 3] = 1 * sang; tanCol[i * 3 + 1] = (0.55 + 0.3 * (1 - q.p)) * sang; tanCol[i * 3 + 2] = (0.12 + 0.2 * (1 - q.p)) * sang;
      }
      tan.geometry.attributes.position.needsUpdate = true; tan.geometry.attributes.color.needsUpdate = true;
    }
    // vũng sáng nền nhấp nháy như ánh lửa chiếu xuống đất
    if (vung) { const nh = 0.82 + 0.1 * Math.sin(t * 23) + 0.08 * Math.sin(t * 37 + 1.3); vung.material.opacity = dangGong ? 0 : 0.5 * k * nh; if (P.mode === 'tia') vung.position.z = Math.min(reach, pz || 0); }
  }
  return { group: grp, update, plan: P, get n() { return P.nLuoi + P.nKhoi + P.nTan; } };
}
export { SO_KIEU };
