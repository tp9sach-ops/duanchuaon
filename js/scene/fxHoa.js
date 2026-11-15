// HỎA 3D (Phiên 202, docs/KE_HOACH_HIEU_UNG_3D_V2.md, MỤC 2): thay chùm lưỡi lửa Sprite phẳng (fxLua.js) bằng KHỐI lửa shader (fxShader.js) với 6 chữ ký hình ảnh riêng.
// Số liệu/chuyển động thuần: js/world/hoaFxMath.js (có test). CHƯA nhìn bằng mắt (môi trường AI không có WebGL): xem ở fx-hoa.html; mọi số cỡ/độ sáng là số TẠM.
// Cùng giao diện với taoLua: trả { group, update(t, after, than, gong, pz), n }; trả null nếu id lạ (chieuFx.js sẽ dùng taoLua cũ). Không đèn động. Hủy: chieuFx.free duyệt mọi con và dispose.
import * as THREE from 'three';
import { taoLuaMesh, taoKhoiMesh, taoHatPoints, taoVungMesh, capNhatThoiGian } from './fxShader.js';
import { kieuHoa, demHoa, songRong, thienThach, nuHoa, hoiRong, tuoiHat, h01 } from '../world/hoaFxMath.js';

const Y = new THREE.Vector3(0, 1, 0), V = new THREE.Vector3(), cl = (x, a, b) => Math.max(a, Math.min(b, x));
const pxHat = () => { try { const h = window.innerHeight || 720, d = Math.min(2, window.devicePixelRatio || 1); return h * d / (2 * Math.tan(25 * Math.PI / 180)); } catch (_) { return 600; } };   // số điểm ảnh cho vật cao 1 m ở cách camera 1 m (giả định FOV 50°)

export function taoHoa(o = {}) {
  const kieu = kieuHoa(o.id); if (!kieu) return null;
  const P = demHoa(kieu, o.tier), grp = new THREE.Group(), reach = Math.max(1.5, o.reach || 4), R2 = Math.max(1, o.R2 || 2);
  grp.frustumCulled = false;
  // ---- dụng cụ dựng ----
  const lua = (opt, ra, parent = grp) => { const m = taoLuaMesh(opt); m.userData.p0 = opt.power || 1; m.userData.c0 = opt.cao || 1; m.visible = false; if (ra) m.rotation.x = ra; parent.add(m); return m; };
  const khoi = (n, col, alpha) => Array.from({ length: n }, (_, i) => { const m = taoKhoiMesh({ seed: i * 0.37 + 0.1, alpha, col }); m.visible = false; grp.add(m); return m; });
  const vung = (r, power) => { const m = taoVungMesh({ r, power }); m.visible = false; grp.add(m); return m; };
  const set = (m, on, a) => { m.visible = on; if (on) m.material.uniforms.uPower.value = m.userData.p0 * a; };
  const ham = taoHatPoints(Math.max(1, P.hat), { colA: 0xffe9a0, colB: 0xff3a08, spark: 0.6, px: pxHat() }); grp.add(ham);
  const out = [0, 0, 0, 1, 0.08];
  const hat = (f, on, t) => {   // f(i, t, out) ghi [x, y, z, tuổi 0..1, cỡ m]
    const A = ham.geometry.attributes, pos = A.position.array, ag = A.aAge.array, sz = A.aSize.array;
    for (let i = 0; i < P.hat; i++) { if (!on) { ag[i] = 1; continue; } f(i, t, out); pos[i * 3] = out[0]; pos[i * 3 + 1] = out[1]; pos[i * 3 + 2] = out[2]; ag[i] = out[3]; sz[i] = out[4]; }
    A.position.needsUpdate = true; A.aAge.needsUpdate = true; A.aSize.needsUpdate = true;
  };
  const gongM = lua({ seed: 0.31, bk: 0.16, cao: 0.65, power: 0.9 });   // chồi lửa bên bàn tay lúc gồng

  // ---- 1. SAO CHỔI (hoa_1): đầu cầu lửa to ở trước, đuôi thon dài kéo lùi sau, tia lửa rơi dọc đường, khói đen phía sau ----
  const saoChoi = () => {
    const L = [[0.42, 2.5, 1, 1, 0.1], [0.27, 1.8, 1.4, 1, 0.5], [0.52, 3.4, 0.8, 0.6, 0.8]].slice(0, P.mesh).map(([bk, cao, heat, power, seed]) => lua({ seed, bk, cao, heat, power }, -Math.PI / 2));
    const kh = khoi(P.khoi, 0x1c1713, 0.35), vg = vung(2.2, 0.85);
    return (t, after, k, g, pz) => {
      const on = after >= 0 && k > 0.01;
      L.forEach((m, i) => { set(m, on, k); if (on) { m.position.set(0, 1.1, pz); m.scale.y = m.userData.c0 * (1 + 0.1 * Math.sin(t * 14 + i * 2)); } });
      kh.forEach((m, i) => { m.visible = on; if (on) { m.position.set(Math.sin(t * 2 + i) * 0.2, 1.1 + 0.3 * i, pz - 1.3 - i * 1.1); m.scale.setScalar(1.1 + 0.5 * i); m.material.uniforms.uAlpha.value = 0.32 * k * (1 - i * 0.2); } });
      vg.visible = on; if (on) { vg.position.set(0, 0.02, pz); vg.material.uniforms.uPower.value = 0.85 * k; }
      hat((i, tt, q) => { const u = tuoiHat(i, tt, 0.9); q[0] = (h01(i, 1) - 0.5) * 0.6 * (0.4 + u); q[1] = 1.1 + (h01(i, 2) - 0.4) * 0.5 + u * 0.7 - u * u * 0.9; q[2] = pz - u * 3.4 - h01(i, 3) * 0.4; q[3] = u; q[4] = 0.05 + 0.07 * h01(i, 4); }, on, t);
    };
  };

  // ---- 2. ÁO CHOÀNG LỬA (hoa_2): vòng lưỡi lửa dựng quanh người, xoay; vòng trong ngược chiều (máy mạnh); tàn lửa xoáy bay lên ----
  const aoLua = () => {
    const N = P.mesh, A = Array.from({ length: N }, (_, i) => lua({ seed: h01(i, 9), bk: 0.2, cao: 1.5 + 0.6 * h01(i, 8), heat: 1.05, power: 0.95 }));
    const B = Array.from({ length: P.trong }, (_, i) => lua({ seed: h01(i, 6), bk: 0.15, cao: 1.1, heat: 1.35, power: 0.9 })), vg = vung(1.9, 0.7);
    return (t, after, k, g) => {
      const lvl = after < 0 ? g * 0.35 : k, on = lvl > 0.02, c = Math.min(1, lvl * 1.2);
      const dat = (m, i, n, r0, w) => { set(m, on, Math.min(1, lvl * 1.3)); if (!on) return; const a = i / n * 6.2832 + t * w, r = r0 + 0.08 * Math.sin(t * 3 + i), s = 0.5 + 0.5 * Math.min(1, lvl); m.position.set(Math.cos(a) * r, 0.05, Math.sin(a) * r); m.scale.set(s, m.userData.c0 * (0.3 + 0.7 * c) * (1 + 0.12 * Math.sin(t * 9 + i * 1.7)), s); };
      A.forEach((m, i) => dat(m, i, N, 0.85, 1.8)); B.forEach((m, i) => dat(m, i, B.length, 0.5, -2.4));
      vg.visible = on; if (on) { vg.position.set(0, 0.02, 0); vg.material.uniforms.uPower.value = 0.7 * lvl; }
      hat((i, tt, q) => { const u = tuoiHat(i, tt, 0.5), a = h01(i, 1) * 6.283 + u * 4 + tt * 1.8, r = 0.55 + 0.35 * h01(i, 2) + u * 0.4; q[0] = Math.cos(a) * r; q[1] = 0.2 + u * 2.5; q[2] = Math.sin(a) * r; q[3] = u; q[4] = 0.05 + 0.05 * h01(i, 3); }, on && after >= 0, t);
    };
  };

  // ---- 3. RỒNG LỬA (hoa_3): chuỗi nhiều đốt lửa uốn lượn nối đuôi (đầu to, hai sừng lửa, đuôi nhỏ dần), tàn lửa rơi khỏi thân ----
  const rongLua = () => {
    const N = P.mesh, seg = Array.from({ length: N }, (_, i) => lua({ seed: h01(i, 7), bk: i ? 0.36 : 0.5, cao: i ? 1.25 : 1.7, heat: i ? 1.05 - 0.3 * i / N : 1.3, power: 1 }, -Math.PI / 2));
    const horn = [-1, 1].map((sg) => { const m = lua({ seed: 0.4 + sg * 0.1, bk: 0.07, cao: 0.8, heat: 1.5, power: 1 }); m.rotation.set(-1.0, 0, sg * 0.35); return m; });
    const kh = khoi(P.khoi, 0x1c1713, 0.3), vg = vung(2.4, 0.85);
    return (t, after, k, g, pz) => {
      const on = after >= 0 && k > 0.01, q = []; for (let i = 0; i < N; i++) q.push(songRong(i, t, pz, N));
      seg.forEach((m, i) => { set(m, on, k); if (on) { const s = q[i].s; m.position.set(q[i].x, q[i].y, q[i].z); m.scale.set(s, m.userData.c0 * s * (1 + 0.08 * Math.sin(t * 11 + i)), s); } });
      horn.forEach((m, i) => { set(m, on, k); if (on) m.position.set(q[0].x + (i ? 0.16 : -0.16), q[0].y + 0.32, q[0].z + 0.15); });
      kh.forEach((m, i) => { m.visible = on; if (on) { const b = q[Math.min(N - 1, 1 + i * 3)]; m.position.set(b.x, b.y + 0.55, b.z); m.scale.setScalar(1 + 0.3 * i); m.material.uniforms.uAlpha.value = 0.3 * k; } });
      vg.visible = on; if (on) { vg.position.set(0, 0.02, pz); vg.material.uniforms.uPower.value = 0.85 * k; }
      hat((i, tt, p) => { const u = tuoiHat(i, tt, 0.8), b = q[i % N]; p[0] = b.x + (h01(i, 1) - 0.5) * 0.6; p[1] = b.y + 0.2 + u * 1.3 - u * u * 0.5; p[2] = b.z - u * 0.8; p[3] = u; p[4] = 0.05 + 0.06 * h01(i, 2); }, on, t);
    };
  };

  // ---- 4. MƯA THIÊN THẠCH (hoa_liethoa_4): các viên sao băng rơi chéo (đuôi lửa dài phía sau), chạm đất bùng cột lửa + vũng sáng + tóe tàn lửa ----
  const thienThachFx = () => {
    const M2 = P.mesh, RR = Math.min(reach, 8.5), S = Array.from({ length: M2 }, (_, j) => thienThach(j, M2, RR));
    const sao = S.map((s, j) => lua({ seed: j * 0.21, bk: 0.34, cao: 2.4, heat: 1.15, power: 1 })), bung = S.map((s, j) => lua({ seed: j * 0.21 + 0.5, bk: 0.6, cao: 2.2, heat: 1, power: 1 })), vg = S.map(() => vung(1.6, 0.9));
    return (t, after, k) => {
      const on = after >= 0 && k > 0.01;
      S.forEach((s, j) => {
        const tt = after - s.delay, roi = on && tt >= 0 && tt < s.fall, tb = tt - s.fall, no = on && tb >= 0 && tb < s.burst;
        set(sao[j], roi, k);
        if (roi) { const u = Math.pow(tt / s.fall, 1.5); V.set(s.dx, s.h, s.dz); sao[j].position.set(s.x + s.dx * (1 - u), Math.max(0.1, s.h * (1 - u)), s.z + s.dz * (1 - u)); V.normalize(); sao[j].quaternion.setFromUnitVectors(Y, V); }
        set(bung[j], no, k * (tb < 0.25 ? 1 : 1 - (tb - 0.25) / (s.burst - 0.25)));
        vg[j].visible = no;
        if (no) { const gr = Math.min(1, tb / 0.16); bung[j].position.set(s.x, 0, s.z); bung[j].scale.set(gr, bung[j].userData.c0 * gr * (1 + 0.1 * Math.sin(t * 15 + j)), gr); vg[j].position.set(s.x, 0.02, s.z); vg[j].material.uniforms.uPower.value = 0.9 * k * (1 - tb / s.burst); }
      });
      hat((i, tt, q) => { const s = S[i % M2], u = cl((after - s.delay - s.fall) / 0.6, 0, 1), a = h01(i, 1) * 6.283, sp = 1.2 + 2 * h01(i, 2); q[0] = s.x + Math.cos(a) * sp * u * 1.2; q[1] = Math.max(0.05, 0.2 + sp * u * 2 - 4.5 * u * u); q[2] = s.z + Math.sin(a) * sp * u * 1.2; q[3] = u > 0 ? u : 1; q[4] = 0.05 + 0.05 * h01(i, 3); }, on, t);
    };
  };

  // ---- 5. HƠI THỞ RỒNG (hoa_hoalong_4): tia lửa phóng ra từ miệng (to ở miệng, thon dần phía xa; lõi trắng nóng, vỏ đỏ), cháy sém dọc đường, tia lửa văng ----
  const longTuc = () => {
    const Ls = [[0.95, 0.85, 0.75, 0.2, 1], [0.62, 1.1, 0.9, 0.55, 0.82], [0.3, 1.55, 1, 0.8, 0.62]].slice(0, P.mesh).map(([bk, heat, power, seed, kc]) => { const m = lua({ seed, bk, cao: 1, heat, power }, Math.PI / 2); m.userData.kc = kc; return m; });
    const kh = khoi(P.khoi, 0x2a2420, 0.3), vg = [0.35, 0.7, 1].slice(0, P.hat > 90 ? 3 : P.hat > 40 ? 1 : 0).map((z) => { const m = vung(1.5, 0.8); m.userData.z = z; return m; });
    return (t, after, k) => {
      const on = after >= 0 && k > 0.01, Ld = hoiRong(after, reach);
      Ls.forEach((m, i) => { set(m, on, k); if (on) { m.position.set(0, 1.35, 0.3); m.scale.set(1, Math.max(0.01, Ld * m.userData.kc * (1 + 0.04 * Math.sin(t * 13 + i))), 1); } });
      kh.forEach((m, i) => { m.visible = on; if (on) { m.position.set(Math.sin(t + i) * 0.3, 1.5 + i * 0.2, 0.3 + Ld * (0.5 + 0.25 * i)); m.scale.setScalar(1.2 + 0.4 * i); m.material.uniforms.uAlpha.value = 0.28 * k; } });
      vg.forEach((m) => { m.visible = on; if (on) { m.position.set(0, 0.02, 0.3 + Ld * m.userData.z); m.material.uniforms.uPower.value = 0.8 * k; } });
      hat((i, tt, q) => { const u = tuoiHat(i, tt, 1.1), w = 0.3 + u * 1.2; q[0] = (h01(i, 1) - 0.5) * w; q[1] = 1.35 + (h01(i, 2) - 0.5) * w * 0.8 - u * u * 0.5; q[2] = 0.3 + u * Ld * 1.1; q[3] = u; q[4] = 0.05 + 0.06 * h01(i, 3); }, on, t);
    };
  };

  // ---- 6. SEN LỬA 9 CÁNH (hoa_tuyet): búp lửa nở thành hoa — 9 cánh (máy mạnh thêm vòng cánh ngoài thấp hơn), trụ lửa trắng nóng ở giữa, vũng sáng rộng, tàn lửa bay lên ----
  const senLua = () => {
    const NP = P.mesh, rings = [];
    for (let r = 0; r < P.vong; r++) { const pv = []; for (let i = 0; i < NP; i++) { const piv = new THREE.Group(); piv.rotation.y = i / NP * 6.2832 + r * Math.PI / NP; piv.visible = false; grp.add(piv); pv.push({ piv, m: lua({ seed: h01(i + r * 17, 5), bk: r ? 0.36 : 0.46, cao: r ? 1.7 : 2.4, heat: r ? 1.1 : 0.95, power: 0.95 }, 0, piv) }); } rings.push(pv); }
    const tru = lua({ seed: 0.66, bk: 0.34, cao: 3.2, heat: 1.5, power: 1 }), vg = vung(R2 * 1.1, 1);
    return (t, after, k) => {
      const u = nuHoa(after, 0.7), on = after >= 0 && k > 0.01;
      rings.forEach((pv, r) => pv.forEach(({ piv, m }, i) => { piv.visible = on; set(m, on, k); if (on) { m.rotation.x = (r ? 0.05 : 0.12) + (r ? 1.45 : 1.15) * u; m.position.z = 0.12 + (r ? 0.75 : 0.5) * u; m.scale.set(1, m.userData.c0 * (0.3 + 0.7 * u) * (1 + 0.06 * Math.sin(t * 8 + i)), 1); } }));
      set(tru, on, k); if (on) tru.scale.y = tru.userData.c0 * (0.2 + 0.8 * u) * (1 + 0.05 * Math.sin(t * 10));
      vg.visible = on; if (on) { vg.position.set(0, 0.02, 0); vg.material.uniforms.uPower.value = k * (0.3 + 0.7 * u); }
      hat((i, tt, q) => { const u2 = tuoiHat(i, tt, 0.45), a = h01(i, 1) * 6.283 + tt * 0.5, r = (0.25 + 1.9 * h01(i, 2)) * (0.3 + 0.7 * u); q[0] = Math.cos(a) * r; q[1] = 0.3 + u2 * 3.4; q[2] = Math.sin(a) * r; q[3] = u2; q[4] = 0.05 + 0.06 * h01(i, 3); }, on, t);
    };
  };

  const upd = { sao_choi: saoChoi, ao_lua: aoLua, rong_lua: rongLua, thien_thach: thienThachFx, long_tuc: longTuc, sen_lua: senLua }[kieu]();
  function update(t, after, than, gong, pz) {
    capNhatThoiGian(grp, t);
    const k = Math.max(than || 0, 0), g = Math.max(gong || 0, 0), bud = after < 0 && g > 0.02;
    set(gongM, bud, Math.min(1, g * 1.2)); if (bud) { gongM.position.set(0.12, 0.85, 0.4); gongM.scale.set(0.2 + 0.8 * g, gongM.userData.c0 * (0.3 + 0.7 * g), 0.2 + 0.8 * g); }
    upd(t, after, k, g, pz || 0);
  }
  return { group: grp, update, kieu, get n() { return P.mesh + P.khoi + P.hat; } };
}
