// VẼ KIM LOẠI + SÉT THẬT (Phiên 181, mục 3 của docs/KE_HOACH_HIEU_UNG_3D.md). Số liệu/chuyển động: js/world/kim.js (có test). CHƯA nhìn bằng mắt (không có WebGL ở môi trường AI): cỡ, độ sáng là số TẠM.
// - VỆT CHÉM LƯỠI LIỀM: dải cong thon hai đầu (hình trăng khuyết) dựng bằng lưới, kết cấu "streak" sáng giữa mờ mép, cộng sáng, đổi màu trắng → bạc xanh theo tuổi.
// - MẢNH KIM LOẠI: InstancedMesh mũi nhọn bốn cạnh (vật liệu kim loại + tự sáng nhẹ), xoay lật; lóe sáng khi "bắt ánh" (sprite tia sao).
// - TIA SÉT: ruy-băng hai lớp (viền xanh rộng + lõi trắng hẹp) gồm hai mặt cắt chéo nhau (nhìn từ mọi hướng đều thấy), hình đổi theo từng lần nhấp nháy; chớp trúng đất có tia lóe.
// - VẾT CẮT TRÊN NỀN: vài vệt đen chéo nhau trên mặt đất sau nhát chém, mờ dần.
// KHÔNG đèn động. Không có document (môi trường test) → kết cấu null, vẫn không lỗi. Chiêu gọi dispose qua việc xóa group khỏi cảnh (chieuFx.free duyệt mọi con).
import * as THREE from 'three';
import { flare, glow, streak } from './fxTex.js';
import { lapKim, lietLiem, manhKim, setSet, zicZac, DIEM_SET } from '../world/kim.js';

/** Lưỡi liềm trong mặt phẳng ngang (XZ): cung góc ±phi, dày nhất ở giữa (`day`), thon về hai đầu. `lech` = 1: đỉnh cung ở gốc, hai sừng kéo về phía sau (liềm bay); 0: tâm cung ở gốc (liềm vòng). uv.x chạy ngang bề dày (giữa sáng), uv.y dọc theo cung. */
function lieuGeom(phi, day, lech, N = 28) {
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= N; i++) {
    const f = i / N, th = (f * 2 - 1) * phi, bd = day * Math.pow(Math.max(0, 1 - Math.pow(f * 2 - 1, 2)), 0.85);
    const s = Math.sin(th), c = Math.cos(th), ro = 1, ri = 1 - bd;
    pos.push(s * ri, 0, c * ri - lech, s * ro, 0, c * ro - lech); uv.push(0, f, 1, f);
    if (i < N) { const a = i * 2; idx.push(a, a + 1, a + 3, a, a + 3, a + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  return g;
}

/** Ruy-băng tia sét: n điểm, mỗi điểm 4 đỉnh (±u, ±v) → hai mặt cắt chéo nhau. Hình (vị trí) được ghi lại mỗi lần nhấp nháy. */
function tiaGeom(n) {
  const uv = [], idx = [];
  for (let i = 0; i < n; i++) { const f = i / (n - 1); uv.push(1, f, 0, f, 1, f, 0, f); }
  for (let i = 0; i < n - 1; i++) { const a = i * 4, b = (i + 1) * 4; idx.push(a, a + 1, b + 1, a, b + 1, b, a + 2, a + 3, b + 3, a + 2, b + 3, b + 2); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 4 * 3), 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  return g;
}
const norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
/** Ghi các điểm tia sét `pts` vào hình `g` với độ rộng `w` (tapering: dày giữa, nhọn hai đầu). */
function ghiTia(g, pts, w) {
  const n = pts.length, d = norm([pts[n - 1][0] - pts[0][0], pts[n - 1][1] - pts[0][1], pts[n - 1][2] - pts[0][2]]);
  const up = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], u = norm(cross(d, up)), v = norm(cross(d, u)), a = g.attributes.position.array;
  for (let i = 0; i < n; i++) {
    const f = i / (n - 1), ww = w * (0.25 + 0.75 * Math.sin(f * Math.PI)), p = pts[i], o = i * 12;
    a[o] = p[0] + u[0] * ww; a[o + 1] = p[1] + u[1] * ww; a[o + 2] = p[2] + u[2] * ww;
    a[o + 3] = p[0] - u[0] * ww; a[o + 4] = p[1] - u[1] * ww; a[o + 5] = p[2] - u[2] * ww;
    a[o + 6] = p[0] + v[0] * ww; a[o + 7] = p[1] + v[1] * ww; a[o + 8] = p[2] + v[2] * ww;
    a[o + 9] = p[0] - v[0] * ww; a[o + 10] = p[1] - v[1] * ww; a[o + 11] = p[2] - v[2] * ww;
  }
  g.attributes.position.needsUpdate = true;
}

/**
 * Dựng bộ kim loại/sét cho một chiêu Hệ kim. o = { tier, mode, co (cỡ lõi chiêu), reach, R2, zD, tNen }. Thêm `.group` vào gốc của chiêu (cùng hệ tọa độ với lõi/quầng).
 * Mỗi khung hình gọi update(t, after, than, gong, pz): t = giây từ lúc bắt đầu gồng, after = giây từ lúc phát (âm = đang gồng), than/gong = độ sáng 0..1 của lớp thân/lõi, pz = vị trí đầu chiêu dọc hướng bay.
 */
export function taoKim(o = {}) {
  const P = lapKim(o.tier, o.mode, { co: o.co }), grp = new THREE.Group(), reach = o.reach || 4, R2 = o.R2 || 2, zD = o.zD || 0, tNen = o.tNen || 2.4, yeu = P.tier === 'yeu', mode = P.mode;
  const W = Math.max(0.6, Math.min(1.6, reach * 0.3));
  grp.frustumCulled = false;
  const tex = streak();
  // ---- vệt chém lưỡi liềm (hai kiểu hình: liềm bay · liềm vòng) ----
  const gSong = lieuGeom(1.05, 0.34, 1, 28), gVong = lieuGeom(2.35, 0.2, 0, 40);
  const liem = P.liem.map(() => { const m = new THREE.Mesh(gSong, new THREE.MeshBasicMaterial({ color: 0xffffff, map: tex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); m.rotation.order = 'YZX'; m.frustumCulled = false; m.visible = false; grp.add(m); return m; });
  // ---- mảnh kim loại ----
  let manh = null; const dm = new THREE.Object3D(), eu = new THREE.Euler(0, 0, 0, 'YXZ');
  if (P.nManh > 0) {
    manh = new THREE.InstancedMesh(new THREE.ConeGeometry(0.06, 0.42, 4), new THREE.MeshStandardMaterial({ color: 0xdde3ea, metalness: 0.85, roughness: 0.28, emissive: 0x8d98a8, emissiveIntensity: 0.55, transparent: true, opacity: 1 }), P.nManh);
    manh.frustumCulled = false; manh.visible = false; grp.add(manh);
  }
  // ---- tia lóe kim loại (bắt ánh sáng trên mảnh) ----
  const loe = []; for (let i = 0; i < P.nLoe; i++) { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: flare(), color: 0xf6f2e4, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: true })); m.frustumCulled = false; m.visible = false; grp.add(m); loe.push(m); }
  // ---- tia sét: lớp viền xanh rộng + lõi trắng hẹp, cùng một dãy điểm ----
  const set = P.set.map(() => {
    const gO = tiaGeom(DIEM_SET), gI = tiaGeom(DIEM_SET);
    const mO = new THREE.Mesh(gO, new THREE.MeshBasicMaterial({ color: 0x7f9dff, map: tex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    const mI = new THREE.Mesh(gI, new THREE.MeshBasicMaterial({ color: 0xffffff, map: tex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    mO.frustumCulled = false; mI.frustumCulled = false; mO.visible = false; mI.visible = false; grp.add(mO, mI);
    const fl = new THREE.Sprite(new THREE.SpriteMaterial({ map: flare(), color: 0xcfe0ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: true })); fl.frustumCulled = false; fl.visible = false; grp.add(fl);
    return { gO, gI, mO, mI, fl, tick: -1 };
  });
  // ---- vết cắt trên nền: vài vệt đen chéo nhau (bỏ ở máy yếu) ----
  const vet = [];
  if (!yeu) for (let i = 0; i < 3; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.16), new THREE.MeshBasicMaterial({ color: 0x14161a, map: tex, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
    m.rotation.x = -Math.PI / 2; m.rotation.z = (i - 1) * 0.55 + (i % 2 ? 0.2 : -0.2); m.position.set(0, -0.07 - i * 0.003, mode === 'tia' ? reach * 0.7 : zD); m.scale.set(Math.max(1.6, Math.min(R2 * 1.7, reach * 0.9)) * (0.8 + 0.2 * i), 1, 1); m.frustumCulled = false; m.visible = false; grp.add(m); vet.push(m);
  }
  let nVat = P.nLiem + P.nManh + P.nLoe + P.nSet + vet.length;

  function update(t, after, than, gong, pz) {
    const k = Math.max(than, 0), ctx = { reach, R2, zD, W, pz: pz || 0 }, dangGong = after < 0, kk = Math.min(1, k * 1.4);
    // vệt chém lưỡi liềm
    for (let i = 0; i < P.liem.length; i++) {
      const s = P.liem[i], m = liem[i], v = dangGong ? { hien: false } : lietLiem(s, mode, after, ctx);
      if (!v.hien || kk <= 0.01) { m.visible = false; continue; }
      m.visible = true; m.geometry = v.kieu === 'vong' ? gVong : gSong;
      m.position.set(v.x, v.y, v.z + (v.kieu === 'vong' ? zD : 0)); m.rotation.set(0, v.ry, v.roll); m.scale.setScalar(Math.max(0.05, v.co));
      m.material.opacity = Math.min(1, v.op * kk) * 0.95; m.material.color.setRGB(1 - 0.18 * v.k, 1 - 0.1 * v.k, 1);   // trắng nóng → bạc xanh
    }
    // mảnh kim loại + tia lóe
    if (manh) {
      let any = false;
      for (let i = 0; i < P.manh.length; i++) {
        const m = P.manh[i];
        let v;
        if (dangGong) {   // đang gồng: 3 mảnh lơ lửng quanh người, to dần theo độ sáng lõi
          if (i >= 3 || gong <= 0.02) v = { hien: false }; else { const a = m.a + t * 3; v = { hien: true, x: Math.sin(a) * 0.55, y: 0.8 + 0.5 * (i / 3), z: Math.cos(a) * 0.55, rx: Math.PI / 2, ry: a + Math.PI / 2, rz: t * 2, kich: m.kich * 0.6, op: Math.min(1, gong * 1.2), loe: 0 }; }
        } else v = manhKim(m, mode, t, after, ctx);
        if (v.hien) { any = true; dm.position.set(v.x, v.y, v.z); eu.set(v.rx, v.ry, v.rz); dm.quaternion.setFromEuler(eu); dm.scale.setScalar(Math.max(0.001, v.kich * Math.sqrt(v.op))); } else { dm.position.set(0, -50, 0); dm.scale.setScalar(0.001); }
        dm.updateMatrix(); manh.setMatrixAt(i, dm.matrix);
        if (i < loe.length) { const s = loe[i]; if (v.hien && v.loe > 0.05 && !dangGong) { s.visible = true; s.position.set(v.x, v.y, v.z); s.scale.setScalar((0.25 + 0.7 * v.loe) * v.kich); s.material.opacity = Math.min(1, v.loe * v.op); s.material.rotation = t * 2 + i; } else s.visible = false; }
      }
      manh.visible = any; manh.instanceMatrix.needsUpdate = true;
    }
    // tia sét
    for (let i = 0; i < P.set.length; i++) {
      const s = P.set[i], h = set[i], v = dangGong ? { hien: false } : setSet(s, mode, after, ctx);
      if (!v.hien || v.op <= 0.01 || kk <= 0.01) { h.mO.visible = false; h.mI.visible = false; h.fl.visible = false; continue; }
      if (v.tick !== h.tick) {   // hình tia sét chỉ đổi khi sang lần nhấp nháy mới
        h.tick = v.tick; const pts = zicZac(s.hat, v.tick, DIEM_SET, v.a, v.b, v.bien); ghiTia(h.gO, pts, v.rong * 2.6); ghiTia(h.gI, pts, v.rong * 0.85);
      }
      h.mO.visible = true; h.mI.visible = true; h.mO.material.opacity = Math.min(1, v.op * kk) * 0.65; h.mI.material.opacity = Math.min(1, v.op * kk);
      if (v.lop > 0.02) { h.fl.visible = true; h.fl.position.set(v.b[0], v.b[1] + 0.2, v.b[2]); h.fl.scale.setScalar(1.2 + 2.4 * v.lop); h.fl.material.opacity = v.lop * kk; h.fl.material.rotation = v.tick * 0.7; } else h.fl.visible = false;
    }
    // vết cắt trên nền: hiện sau nhát chém, giữ đến gần hết rồi mờ
    if (vet.length) {
      const f = after < 0.06 ? 0 : Math.min(1, (after - 0.06) / 0.1) * Math.max(0, Math.min(1, (tNen - after) / Math.max(0.4, tNen * 0.4)));
      for (const m of vet) { m.visible = f > 0.01; m.material.opacity = 0.55 * f; }
    }
  }
  return { group: grp, update, plan: P, get n() { return nVat; } };
}
