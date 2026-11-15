// THỦY 3D (Phiên 203, docs/KE_HOACH_HIEU_UNG_3D_V2.md, MỤC 3): tinh thể băng + nước có bọt bằng shader (js/world/fxGlslThuy.js), 6 chữ ký riêng. Không còn Sprite phẳng.
// Số liệu/chuyển động thuần: js/world/thuyFxMath.js (có test). CHƯA nhìn bằng mắt (không có WebGL ở môi trường AI): xem fx-thuy.html; mọi số cỡ/độ sáng là số TẠM.
// Cùng giao diện taoHoa/taoBang: trả { group, update(t, after, than, gong, pz), n }; null nếu id lạ (chieuFx.js dùng taoBang cũ). Không đèn động. Hủy: chieuFx.free duyệt mọi con và dispose.
import * as THREE from 'three';
import { taoKhoiMesh, taoHatPoints, capNhatThoiGian } from './fxShader.js';
import { BANG_VERT, BANG_FRAG, NUOC_VERT, NUOC_FRAG, VUNG_LANH_VERT, VUNG_LANH_FRAG } from '../world/fxGlslThuy.js';
import { kieuThuy, demThuy, gaiBang, xichBang, quanhGiot, songThan } from '../world/thuyFxMath.js';
import { h01, tuoiHat, nuHoa } from '../world/hoaFxMath.js';

const cl = (x, a, b) => Math.max(a, Math.min(b, x)), PI = Math.PI;
const pxHat = () => { try { const h = window.innerHeight || 720, d = Math.min(2, window.devicePixelRatio || 1); return h * d / (2 * Math.tan(25 * PI / 180)); } catch (_) { return 600; } };
const rgb = (a) => new THREE.Color().setRGB(a[0], a[1], a[2]);   // setRGB: không đổi không gian màu (shader xuất thẳng)
const sh = (vs, fs, u, o = {}) => new THREE.ShaderMaterial({ vertexShader: vs, fragmentShader: fs, uniforms: u, transparent: true, depthWrite: false, side: THREE.DoubleSide, ...o });
const bangMat = (seed, tint) => sh(BANG_VERT, BANG_FRAG, { uTime: { value: 0 }, uSeed: { value: seed }, uPower: { value: 1 }, uTint: { value: rgb(tint) } });
const nuocMat = ({ seed = 0, deep = [0.04, 0.35, 0.62], light = [0.6, 0.9, 1], foam = 0, wave = 0 } = {}) => sh(NUOC_VERT, NUOC_FRAG, { uTime: { value: 0 }, uSeed: { value: seed }, uPower: { value: 1 }, uFoam: { value: foam }, uWave: { value: wave }, uDeep: { value: rgb(deep) }, uLight: { value: rgb(light) } });

export function taoThuy(o = {}) {
  const kieu = kieuThuy(o.id); if (!kieu) return null;
  const P = demThuy(kieu, o.tier), grp = new THREE.Group(), reach = Math.max(1.5, o.reach || 4), R2 = Math.max(1, o.R2 || 2), RR = Math.min(8, Math.max(R2, reach));
  grp.frustumCulled = false;
  const ice = kieu === 'giao_bang' || kieu === 'tham_bang' || kieu === 'xich_bang';
  const lat = new THREE.LatheGeometry([new THREE.Vector2(0, 0), new THREE.Vector2(1, 0), new THREE.Vector2(1, 0.68), new THREE.Vector2(0, 1)], 6).toNonIndexed(); lat.computeVertexNormals();   // lăng trụ lục giác nhọn đầu, gốc y=0, ngọn y=1, pháp tuyến phẳng từng mặt
  const mk = (geo, mat, parent = grp) => { const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.visible = false; m.renderOrder = 2; parent.add(m); return m; };
  const setP = (m, on, a) => { m.visible = on; if (on) m.material.uniforms.uPower.value = a; };
  const khoi = (n, col, alpha) => Array.from({ length: n }, (_, i) => { const m = taoKhoiMesh({ seed: i * 0.37 + 0.1, alpha, col }); m.visible = false; grp.add(m); return m; });
  const vungL = (r, c) => { const m = new THREE.Mesh(new THREE.CircleGeometry(r, 40), sh(VUNG_LANH_VERT, VUNG_LANH_FRAG, { uTime: { value: 0 }, uR: { value: r }, uPower: { value: 1 }, uCol: { value: rgb(c) } }, { blending: THREE.AdditiveBlending })); m.rotation.x = -PI / 2; m.position.y = 0.02; m.frustumCulled = false; m.visible = false; m.renderOrder = 0; grp.add(m); return m; };
  const mau = { giao_bang: [0xeafcff, 0x59b8ff, 0.8], tham_bang: [0xeafcff, 0x59b8ff, 0.8], xich_bang: [0xeafcff, 0x59b8ff, 0.8], bong_nuoc: [0xf0ffff, 0x3aa8d8, 0], song_than: [0xf0ffff, 0x3aa8d8, 0], sen_nuoc: [0xdcfff0, 0x28c8a0, 0] }[kieu];
  const ham = taoHatPoints(Math.max(1, P.hat), { colA: mau[0], colB: mau[1], spark: mau[2], px: pxHat() }); grp.add(ham);
  const out = [0, 0, 0, 1, 0.08];
  const hat = (f, on, t) => {
    const A = ham.geometry.attributes, pos = A.position.array, ag = A.aAge.array, sz = A.aSize.array;
    for (let i = 0; i < P.hat; i++) { if (!on) { ag[i] = 1; continue; } f(i, t, out); pos[i * 3] = out[0]; pos[i * 3 + 1] = out[1]; pos[i * 3 + 2] = out[2]; ag[i] = out[3]; sz[i] = out[4]; }
    A.position.needsUpdate = true; A.aAge.needsUpdate = true; A.aSize.needsUpdate = true;
  };
  const bud = ice ? mk(lat, bangMat(0.9, [0.5, 0.9, 1])) : mk(new THREE.SphereGeometry(1, 12, 8), nuocMat({ seed: 0.9 }));   // chồi tinh thể / giọt nước lúc gồng

  // ---- 1. GIÁO BĂNG (thuy_1): tinh thể dài nhọn bay thẳng, vài mảnh nhỏ xoay quanh trục, sương lạnh phía sau, hạt ánh bƒÉng lấp lánh ----
  const giao = () => {
    const main = mk(lat, bangMat(0.2, [0.45, 0.85, 1])), sd = Array.from({ length: Math.max(0, P.mesh - 1) }, (_, i) => mk(lat, bangMat(0.4 + i * 0.13, [0.5, 0.9, 1])));
    const kh = khoi(P.khoi, 0xbfe6ff, 0.3), vg = vungL(1.8, [0.45, 0.85, 1]);
    return (t, after, k, g, pz) => {
      const on = after >= 0 && k > 0.01, L = 2.6;
      setP(main, on, k); if (on) { main.rotation.set(PI / 2, 0, 0); main.position.set(0, 1.1, pz - L + 0.5); main.scale.set(0.2, L, 0.2); }
      sd.forEach((m, i) => { setP(m, on, k * 0.9); if (on) { const a = i / sd.length * 6.2832 + t * 3; m.rotation.set(PI / 2, 0, 0); m.position.set(Math.cos(a) * 0.33, 1.1 + Math.sin(a) * 0.33, pz - 0.7 - i * 0.5); m.scale.set(0.07, 0.9, 0.07); } });
      kh.forEach((m, i) => { m.visible = on; if (on) { m.position.set(Math.sin(t * 2 + i) * 0.2, 1.1 + 0.2 * i, pz - 1.4 - i * 1.0); m.scale.setScalar(1.1 + 0.5 * i); m.material.uniforms.uAlpha.value = 0.3 * k * (1 - i * 0.2); } });
      vg.visible = on; if (on) { vg.position.set(0, 0.02, pz); vg.material.uniforms.uPower.value = 0.8 * k; }
      hat((i, tt, q) => { const u = tuoiHat(i, tt, 0.8); q[0] = (h01(i, 1) - 0.5) * 0.7 * (0.4 + u); q[1] = 1.1 + (h01(i, 2) - 0.5) * 0.6 - u * 0.3; q[2] = pz - u * 3.0 - h01(i, 3) * 0.4; q[3] = u; q[4] = 0.04 + 0.06 * h01(i, 4); }, on, t);
    };
  };

  // ---- 2. BONG BÓNG NƯỚC (thuy_2): vỏ bong bóng trong suốt quanh người, các giọt ngọc lơ lửng xoay trong, bọt nhỏ nổi lên ----
  const bong = () => {
    const shell = mk(new THREE.SphereGeometry(1, 24, 16), nuocMat({ seed: 0.2, deep: [0.1, 0.5, 0.75], light: [0.7, 0.95, 1], wave: 0.015 }));
    const dr = Array.from({ length: P.mesh }, (_, i) => mk(new THREE.SphereGeometry(1, 14, 10), nuocMat({ seed: 0.3 + i * 0.1, deep: [0.02, 0.4, 0.45], light: [0.5, 1, 0.85] })));
    const vg = vungL(1.8, [0.3, 0.7, 1]);
    return (t, after, k, g) => {
      const lvl = after < 0 ? g * 0.35 : k, on = lvl > 0.02;
      setP(shell, on, 0.55 * Math.min(1, lvl * 1.3)); if (on) { shell.position.set(0, 1.0, 0); shell.scale.setScalar((1.0 + 0.15 * Math.min(1, lvl)) * (1 + 0.03 * Math.sin(t * 4))); }
      dr.forEach((m, i) => { setP(m, on, 0.9 * Math.min(1, lvl * 1.3)); if (on) { const q = quanhGiot(i, dr.length, t); m.position.set(q.x, q.y, q.z); m.scale.setScalar(0.12 + 0.03 * Math.sin(t * 5 + i)); } });
      vg.visible = on; if (on) { vg.position.set(0, 0.02, 0); vg.material.uniforms.uPower.value = 0.7 * lvl; }
      hat((i, tt, q) => { const u = tuoiHat(i, tt, 0.4), a = h01(i, 1) * 6.283 + tt, r = 0.85 * Math.sqrt(h01(i, 2)); q[0] = Math.cos(a) * r; q[1] = 0.1 + u * 1.9; q[2] = Math.sin(a) * r; q[3] = u; q[4] = 0.03 + 0.05 * h01(i, 3); }, on && after >= 0, t);
    };
  };

  // ---- 3. THẢM BĂNG (thuy_3): mặt băng bóng lan từ tâm ra, gai tinh thể mọc trồi (xa tâm mọc muộn), sương lạnh + hạt lấp lánh ----
  const tham = () => {
    const N = P.mesh, S = Array.from({ length: N }, (_, i) => gaiBang(i, N, RR)), ma = bangMat(0.3, [0.45, 0.85, 1]), mb = bangMat(0.7, [0.6, 0.92, 1]);
    const sheet = mk(new THREE.CircleGeometry(1, 40), bangMat(0.5, [0.5, 0.88, 1])); sheet.rotation.x = -PI / 2; sheet.position.y = 0.03;
    const sp = S.map((s, i) => mk(lat, i % 2 ? ma : mb)), kh = khoi(P.khoi, 0xcfeeff, 0.28), vg = vungL(RR, [0.4, 0.8, 1]);
    return (t, after, k) => {
      const on = after >= 0 && k > 0.01, e = 1 - (1 - cl(after / 0.5, 0, 1)) ** 2;
      setP(sheet, on, 0.85 * k); if (on) sheet.scale.set(Math.max(0.01, RR * e), Math.max(0.01, RR * e), 1);
      ma.uniforms.uPower.value = k; mb.uniforms.uPower.value = k;
      sp.forEach((m, i) => { const s = S[i], tt = after - s.delay, v = on && tt > 0; m.visible = v; if (v) { const gr = 1 - (1 - cl(tt / 0.25, 0, 1)) ** 2; m.position.set(s.x, 0.03, s.z); m.rotation.set(s.lean * Math.sin(s.yaw), 0, s.lean * Math.cos(s.yaw)); m.scale.set(s.w * gr, s.h * gr, s.w * gr); } });
      kh.forEach((m, i) => { m.visible = on; if (on) { m.position.set(Math.sin(t + i * 2) * RR * 0.3, 0.8 + 0.4 * i, Math.cos(t * 0.7 + i * 2) * RR * 0.3); m.scale.setScalar(2.0 + i); m.material.uniforms.uAlpha.value = 0.26 * k; } });
      vg.visible = on; if (on) { vg.position.set(0, 0.02, 0); vg.material.uniforms.uPower.value = 0.7 * k * e; }
      hat((i, tt, q) => { const s = S[i % N], u = tuoiHat(i, tt, 0.6); q[0] = s.x + (h01(i, 1) - 0.5) * 0.5; q[1] = s.h * (0.4 + u * 0.9); q[2] = s.z + (h01(i, 2) - 0.5) * 0.5; q[3] = after >= s.delay ? u : 1; q[4] = 0.04 + 0.05 * h01(i, 3); }, on, t);
    };
  };

  // ---- 4. SEN NƯỚC (thuy_camlo_4, Thanh Tâm Chú): búp sen bằng nước ngọc lục nở ra, trụ nước ở giữa, hào quang xanh lục, hạt sáng bay lên ----
  const sen = () => {
    const geoP = new THREE.ConeGeometry(1, 1, 10, 1); geoP.translate(0, 0.5, 0);
    const rings = [], NP = P.mesh, ngoc = { deep: [0.02, 0.45, 0.42], light: [0.65, 1, 0.88], foam: 0.6, wave: 0.02 };
    for (let r = 0; r < P.vong; r++) { const pv = []; for (let i = 0; i < NP; i++) { const piv = new THREE.Group(); piv.rotation.y = i / NP * 6.2832 + r * PI / NP; piv.visible = false; grp.add(piv); pv.push({ piv, m: mk(geoP, nuocMat({ seed: h01(i + r * 17, 5), ...ngoc }), piv) }); } rings.push(pv); }
    const tru = mk(geoP, nuocMat({ seed: 0.66, ...ngoc })), vg = vungL(2.2, [0.3, 0.9, 0.7]);
    return (t, after, k) => {
      const u = nuHoa(after, 0.7), on = after >= 0 && k > 0.01;
      rings.forEach((pv, r) => pv.forEach(({ piv, m }, i) => { piv.visible = on; setP(m, on, 0.85 * k); if (on) { m.rotation.x = (r ? 0.05 : 0.15) + (r ? 1.4 : 1.1) * u; m.position.z = 0.1 + (r ? 0.7 : 0.45) * u; m.scale.set(r ? 0.32 : 0.4, (r ? 1.2 : 1.7) * (0.3 + 0.7 * u) * (1 + 0.04 * Math.sin(t * 6 + i)), 0.1); } }));
      setP(tru, on, 0.8 * k); if (on) tru.scale.set(0.13, 2.4 * (0.2 + 0.8 * u), 0.13);
      vg.visible = on; if (on) { vg.position.set(0, 0.02, 0); vg.material.uniforms.uPower.value = k * (0.3 + 0.7 * u); }
      hat((i, tt, q) => { const u2 = tuoiHat(i, tt, 0.4), a = h01(i, 1) * 6.283 + tt * 0.6, r = (0.2 + 1.6 * h01(i, 2)) * (0.3 + 0.7 * u); q[0] = Math.cos(a) * r; q[1] = 0.2 + u2 * 3.0; q[2] = Math.sin(a) * r; q[3] = u2; q[4] = 0.04 + 0.05 * h01(i, 3); }, on, t);
    };
  };

  // ---- 5. XÍCH BĂNG (thuy_huyenbang_4): chuỗi mắt xích tinh thể (mắt lẻ xoay vuông góc) bay thẳng, vòng cùm băng xoay ở đầu ----
  const xich = () => {
    const N = P.mesh, lk = Array.from({ length: N }, (_, i) => mk(lat, bangMat(0.1 + i * 0.07, [0.5, 0.9, 1]))), ring = mk(new THREE.TorusGeometry(0.55, 0.07, 6, 24), bangMat(0.77, [0.55, 0.92, 1]));
    const kh = khoi(P.khoi, 0xbfe6ff, 0.28), vg = vungL(1.6, [0.45, 0.85, 1]);
    return (t, after, k, g, pz) => {
      const on = after >= 0 && k > 0.01;
      lk.forEach((m, i) => { setP(m, on, k); if (on) { const q = xichBang(i, N, t, pz); m.position.set(q.x, q.y, q.z); m.rotation.set(PI / 2, 0, q.odd ? PI / 2 : 0); m.scale.set(q.odd ? 0.11 : 0.08, 0.45, q.odd ? 0.05 : 0.08); } });
      setP(ring, on, k); if (on) { ring.position.set(0, 1.1, pz); ring.rotation.set(0, t * 2, 0); }
      kh.forEach((m, i) => { m.visible = on; if (on) { m.position.set(Math.sin(t * 2 + i) * 0.2, 1.1, pz * (0.3 + 0.3 * i)); m.scale.setScalar(1.0 + 0.4 * i); m.material.uniforms.uAlpha.value = 0.26 * k; } });
      vg.visible = on; if (on) { vg.position.set(0, 0.02, pz); vg.material.uniforms.uPower.value = 0.8 * k; }
      hat((i, tt, q) => { const u = tuoiHat(i, tt, 0.9), z = 0.4 + (Math.max(0.4, pz) - 0.4) * h01(i, 1); q[0] = (h01(i, 2) - 0.5) * 0.5; q[1] = 1.1 + (h01(i, 3) - 0.5) * 0.5 - u * 0.3; q[2] = z - u * 0.6; q[3] = u; q[4] = 0.04 + 0.05 * h01(i, 4); }, on, t);
    };
  };

  // ---- 6. SÓNG THẦN (thuy_tuyet): bức tường nước cong lao ra, đỉnh sóng có BỌT trắng, con sóng thứ hai thấp hơn theo sau, nước bật tung té và sương ----
  const song = () => {
    const W = P.mesh, geo = new THREE.CylinderGeometry(1, 1, 1, 28, 8, true, -1.15, 2.3); geo.translate(0, 0.5, 0);
    const ws = Array.from({ length: W }, (_, j) => mk(geo, nuocMat({ seed: j * 0.3, deep: [0.02, 0.28, 0.5], light: [0.55, 0.88, 1], foam: 1, wave: 0.12 })));
    const kh = khoi(P.khoi, 0xdff4ff, 0.32), vg = vungL(RR, [0.3, 0.7, 1]);
    return (t, after, k) => {
      const on = after >= 0 && k > 0.01, S = ws.map((m, j) => songThan(after - j * 0.12, RR));
      ws.forEach((m, j) => { const s = S[j], v = on && s.r > 0.05; setP(m, v, k * (0.9 - 0.15 * j)); if (v) m.scale.set(s.r, Math.max(0.05, s.h * (1 - 0.18 * j)), s.r); });
      kh.forEach((m, i) => { m.visible = on && S[0].r > 0.05; if (m.visible) { m.position.set((i - 1) * 1.2, S[0].h * 0.7, S[0].r); m.scale.setScalar(1.4 + 0.5 * i); m.material.uniforms.uAlpha.value = 0.3 * k; } });
      vg.visible = on; if (on) { vg.position.set(0, 0.02, 0); vg.material.uniforms.uPower.value = 0.6 * k; }
      hat((i, tt, q) => { const s = S[i % W], u = tuoiHat(i, tt, 1.3), th = (h01(i, 1) - 0.5) * 2.3; q[0] = Math.sin(th) * s.r; q[1] = Math.max(0.1, s.h * (0.7 + 0.5 * u) - u * u * 0.6); q[2] = Math.cos(th) * s.r + u * 0.5; q[3] = s.r > 0.05 ? u : 1; q[4] = 0.05 + 0.06 * h01(i, 2); }, on, t);
    };
  };

  const upd = { giao_bang: giao, bong_nuoc: bong, tham_bang: tham, sen_nuoc: sen, xich_bang: xich, song_than: song }[kieu]();
  function update(t, after, than, gong, pz) {
    capNhatThoiGian(grp, t);
    const k = Math.max(than || 0, 0), g = Math.max(gong || 0, 0), on = after < 0 && g > 0.02;
    setP(bud, on, Math.min(1, g * 1.2));
    if (on) { bud.position.set(0.12, 0.85, 0.4); if (ice) { bud.rotation.set(PI / 2, 0, 0); bud.scale.set(0.05 + 0.07 * g, 0.15 + 0.35 * g, 0.05 + 0.07 * g); } else bud.scale.setScalar(0.04 + 0.1 * g); }
    upd(t, after, k, g, pz || 0);
  }
  return { group: grp, update, kieu, get n() { return P.mesh * Math.max(1, P.vong) + P.khoi + P.hat; } };
}
