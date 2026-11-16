// VẼ KIM 3D (Phiên 212, MỤC 4 của docs/KE_HOACH_HIEU_UNG_3D_V2.md): khối kim loại THẬT cho chiêu Hệ kim (trước đây chỉ là chấm sáng + vệt phẳng). Chạy CÙNG bộ cũ js/scene/fxKim.js (sét, mảnh, vệt) — thêm khối vào, không thay.
// Số liệu/chuyển động thuần: js/world/kimFxMath.js (có test tests/kimfx.test.mjs). CHƯA nhìn bằng mắt trong game: mở fx-kim.html để xem; mọi số cỡ/màu là số TẠM.
// Đợt 1/2:  kim_1 liem_bac: lưỡi trăng khuyết bạc DÀY (khối ép có vát cạnh) + vệt bạc phía sau + mảnh kim loại văng khi tới đích
//           kim_2 khien_luc: khiên lục giác thép viền vàng lơ lửng trước người, xoay chậm + 6 tấm nhỏ quay ngược chiều + gợn sáng mỗi lần hấp thụ
//           kim_3 ky_binh: 3–7 kỵ sĩ vàng (khối đơn giản có giáo) hàng chữ V, mờ dần ở đuôi, bụi vàng dưới móng, sóng chấn ở đầu
// Đợt 2 (chưa làm): kim_kimcang_4 · kim_thietky_4 · kim_tuyet → taoKimThan trả null → chỉ còn bộ cũ.
// Cùng giao diện với taoTho/taoHoa: trả { group, update(t, after, than, gong, pz), kieu, n }; null nếu id lạ. Không đèn động. Hủy: chieuFx.free duyệt mọi con và dispose.
import * as THREE from 'three';
import { smoke, ring, streak, flare } from './fxTex.js';
import { kieuKim3, demKim3, liemBac, manhKim, sao, khienLuc, khienNho, kyBinh, buiVang, KIM3_T } from '../world/kimFxMath.js';

/** Lưỡi liềm ép khối: cung ±phi, dày giữa nhọn hai đầu (R = 1, đỉnh cung ở gốc, hai sừng kéo về phía sau), nằm ngang (mặt XZ), đỉnh hướng +z. */
function lieuKhoi(phi = 1.05, day = 0.34, N = 26) {
  const s = new THREE.Shape(), out = [], inn = [];
  for (let i = 0; i <= N; i++) {
    const f = i / N, th = (f * 2 - 1) * phi, bd = day * Math.pow(Math.max(0, 1 - Math.pow(f * 2 - 1, 2)), 0.85);
    out.push([Math.sin(th), Math.cos(th) - 1]); inn.push([Math.sin(th) * (1 - bd), Math.cos(th) * (1 - bd) - 1]);
  }
  s.moveTo(out[0][0], out[0][1]); for (let i = 1; i <= N; i++) s.lineTo(out[i][0], out[i][1]); for (let i = N; i >= 0; i--) s.lineTo(inn[i][0], inn[i][1]); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.07, bevelEnabled: true, bevelThickness: 0.045, bevelSize: 0.03, bevelSegments: 1, steps: 1 });
  g.translate(0, 0, -0.035); g.rotateX(Math.PI / 2);   // (x, y, z) → (x, -z, y): đỉnh cung (+y) → +z, độ dày → trục đứng
  return g;
}

export function taoKimThan(o = {}) {
  const kieu = kieuKim3(o.id); if (!kieu) return null;
  const P = demKim3(kieu, o.tier), reach = Math.max(1.5, o.reach || 4), W = Math.max(0.6, Math.min(1.6, reach * 0.3)), yeu = o.tier === 'yeu';
  const grp = new THREE.Group(); grp.frustumCulled = false;
  const thep = new THREE.MeshStandardMaterial({ color: 0xc3cfe0, metalness: 0.72, roughness: 0.26, flatShading: true, emissive: 0x1f2e4a, emissiveIntensity: 0.7 });
  const vang = new THREE.MeshStandardMaterial({ color: 0xe8c46e, metalness: 0.7, roughness: 0.3, flatShading: true, emissive: 0x5a3c0e, emissiveIntensity: 0.8 });
  const add = (mat) => { mat.transparent = true; mat.blending = THREE.AdditiveBlending; mat.depthWrite = false; return mat; };
  const dm = new THREE.Object3D(), eu = new THREE.Euler(0, 0, 0, 'YXZ');
  const put = (m, i, v) => {
    if (v.hien) { dm.position.set(v.x, v.y, v.z); eu.set(v.rx || 0, v.ry || 0, v.rz || 0); dm.quaternion.setFromEuler(eu); dm.scale.setScalar(Math.max(0.001, v.kich)); } else { dm.position.set(0, -50, 0); dm.scale.setScalar(0.001); }
    dm.updateMatrix(); m.setMatrixAt(i, dm.matrix);
  };
  const inst = (geo, mat, n, parent) => { if (n <= 0) return null; const m = new THREE.InstancedMesh(geo, mat, n); m.frustumCulled = false; m.visible = false; parent.add(m); return m; };
  const spr = (tex, color, parent) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); s.frustumCulled = false; s.visible = false; parent.add(s); return s; };
  const saoS = []; for (let i = 0; i < P.sao; i++) saoS.push(spr(flare(), kieu === 'ky_binh' ? 0xffe39a : 0xeaf3ff, grp));
  let upd = () => {};

  if (kieu === 'liem_bac') {
    const blade = new THREE.Group(); blade.visible = false; grp.add(blade);
    const kg = lieuKhoi(), tilt = new THREE.Group(); tilt.rotation.set(-0.3, 0, 0.55); blade.add(tilt);   // lưỡi hơi nghiêng (~30°, mũi chếch lên) để nhìn từ sau-trên vẫn thấy hình cung, không bị nhìn ngang cạnh
    const thanM = new THREE.Mesh(kg, thep); thanM.scale.set(W, W, W); tilt.add(thanM);
    const vien = new THREE.Mesh(kg, add(new THREE.MeshBasicMaterial({ color: 0xdff0ff, opacity: 0.4 }))); vien.scale.set(W * 1.05, W * 1.4, W * 1.05); tilt.add(vien);   // viền sáng bạc quanh lưỡi
    const vg = new THREE.PlaneGeometry(1, 1); vg.translate(0, 0, -0.5); const vetM = new THREE.Mesh(vg, add(new THREE.MeshBasicMaterial({ color: 0xbcd8f2, map: streak(), opacity: 0, side: THREE.DoubleSide }))); vetM.rotation.x = -Math.PI / 2; vetM.position.y = 1.1; vetM.frustumCulled = false; vetM.visible = false; grp.add(vetM);
    const mg = new THREE.ConeGeometry(0.5, 1.7, 4); const manh = inst(mg, new THREE.MeshBasicMaterial({ color: 0xffd9a0 }), P.manh, grp);
    upd = (t, after, pz) => {
      const v = liemBac(after, pz, reach); blade.visible = v.hien; vetM.visible = v.hien && v.ve > 0.02;
      if (v.hien) { blade.position.set(0, v.y, v.z); blade.rotation.y = Math.sin(v.quay) * 0.18; blade.scale.setScalar(v.sc); vien.material.opacity = 0.45 * v.op; vetM.scale.set(W * 1.1 * v.sc, 1, Math.max(0.2, v.z * 0.9 * v.ve + 0.5)); vetM.position.z = v.z; vetM.material.opacity = 0.5 * v.op; }
      if (manh) { let any = false; for (let i = 0; i < P.manh; i++) { const m = manhKim(i, P.manh, after, reach); if (m.hien) any = true; put(manh, i, m); } manh.visible = any; manh.instanceMatrix.needsUpdate = true; }
    };
  } else if (kieu === 'khien_luc') {
    const sk = new THREE.Group(); sk.position.set(0, 1.15, 1.1); sk.visible = false; grp.add(sk);
    const hex = new THREE.CylinderGeometry(0.85, 0.85, 0.13, 6); hex.rotateX(Math.PI / 2);
    const mat = thep.clone(); mat.transparent = true; const khien = new THREE.Group(); sk.add(khien);
    const mt = new THREE.Mesh(hex, mat); khien.add(mt);
    const vienV = new THREE.Mesh(new THREE.RingGeometry(0.66, 0.9, 6), add(new THREE.MeshBasicMaterial({ color: 0xffd98a, opacity: 0.9, side: THREE.DoubleSide }))); vienV.position.z = 0.075; khien.add(vienV);
    const trong = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.38, 6), add(new THREE.MeshBasicMaterial({ color: 0xfff0c0, opacity: 0.8, side: THREE.DoubleSide }))); trong.position.z = 0.08; khien.add(trong);
    const boss = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), vang.clone()); boss.position.z = 0.1; boss.scale.z = 0.6; boss.material.transparent = true; khien.add(boss);
    for (let k = 0; k < 6; k++) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.035, 0.03), add(new THREE.MeshBasicMaterial({ color: 0xffe3a0, opacity: 0.7 }))); const a = k * Math.PI / 3 + Math.PI / 6; r.position.set(Math.cos(a) * 0.5, Math.sin(a) * 0.5, 0.08); r.rotation.z = a; khien.add(r); }
    const gon = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), add(new THREE.MeshBasicMaterial({ color: 0xffe9b0, map: ring(), opacity: 0, side: THREE.DoubleSide }))); gon.position.z = 0.12; gon.visible = false; sk.add(gon);
    const ng = new THREE.CylinderGeometry(0.5, 0.5, 0.09, 6); ng.rotateX(Math.PI / 2); const nho = inst(ng, new THREE.MeshBasicMaterial({ color: 0xf2d27e }), P.nho, sk);
    upd = (t, after) => {
      const v = khienLuc(after, t); sk.visible = v.hien;
      if (v.hien) { sk.scale.setScalar(v.sc * Math.max(0.8, W) * 1.5); khien.rotation.z = v.quay; mat.opacity = Math.max(0.05, v.op); vienV.material.opacity = 0.9 * v.op; trong.material.opacity = 0.8 * v.op; boss.material.opacity = v.op; gon.visible = v.gon > 0.02; if (gon.visible) { gon.scale.setScalar(2.2 + 1.2 * (1 - v.gon)); gon.material.opacity = 0.8 * v.gon; } }
      if (nho) { let any = false; for (let i = 0; i < P.nho; i++) { const m = khienNho(i, P.nho, after, t); if (m.hien) any = true; put(nho, i, { ...m, rz: t * 2 }); } nho.visible = any; nho.instanceMatrix.needsUpdate = true; }
      // tia lóe nằm trong hệ khiên → gắn vị trí theo khiên
      for (let i = 0; i < saoS.length; i++) { const s = sao(i, after, kieu), q = saoS[i]; q.visible = s.hien; if (s.hien) { q.position.set(sk.position.x + s.dx * sk.scale.x, sk.position.y + s.dy * sk.scale.x, sk.position.z + 0.2); q.scale.setScalar(s.co); q.material.opacity = s.op; } }
    };
    for (const q of saoS) q.userData.khien = true;
  } else if (kieu === 'ky_binh') {
    const gM = new THREE.BoxGeometry(0.34, 0.42, 1.0), gC = new THREE.BoxGeometry(0.16, 0.2, 0.34), gT = new THREE.BoxGeometry(0.26, 0.42, 0.2), gD = new THREE.SphereGeometry(0.12, 8, 6), gG = new THREE.CylinderGeometry(0.018, 0.018, 1.7, 5), gMu = new THREE.ConeGeometry(0.05, 0.22, 5);
    const ky = [];
    for (let i = 0; i < P.ky; i++) {
      const m = new THREE.MeshBasicMaterial({ color: 0xeab94c, transparent: true, opacity: 0 }), r = new THREE.Group();   // vật liệu đặc (không cộng sáng) để thấy khối kỵ sĩ
       r.visible = false; r.frustumCulled = false;
      const mk = (g, x, y, z, rx = 0) => { const q = new THREE.Mesh(g, m); q.position.set(x, y, z); q.rotation.x = rx; r.add(q); return q; };
      mk(gM, 0, 0, 0); mk(gC, 0, 0.3, 0.55, -0.5); mk(gT, 0, 0.5, -0.05); mk(gD, 0, 0.82, -0.02); mk(gG, 0.2, 0.55, 0.55, Math.PI / 2); mk(gMu, 0.2, 0.55, 1.46, Math.PI / 2);
      r.scale.setScalar(0.9); grp.add(r); ky.push({ r, m });
    }
    const buiS = []; if (!yeu) for (let i = 0; i < P.ky * 2; i++) buiS.push(spr(smoke(), 0xe0c070, grp));
    const song = yeu ? null : new THREE.Mesh(new THREE.PlaneGeometry(1, 1), add(new THREE.MeshBasicMaterial({ color: 0xffe3a0, map: ring(), opacity: 0, side: THREE.DoubleSide }))); if (song) { song.rotation.x = -Math.PI / 2; song.position.y = 0.06; song.frustumCulled = false; song.visible = false; grp.add(song); }
    upd = (t, after, pz) => {
      for (let i = 0; i < ky.length; i++) { const v = kyBinh(i, ky.length, after, pz, reach), c = ky[i]; c.r.visible = v.hien && v.op > 0.02; if (c.r.visible) { c.r.position.set(v.x, v.y, v.z); c.m.opacity = 0.85 * v.op; } }
      for (let j = 0; j < buiS.length; j++) { const v = buiVang(j, ky.length, after, pz, reach), s = buiS[j]; s.visible = v.hien && v.op > 0.01; if (s.visible) { s.position.set(v.x, v.y, v.z); s.scale.setScalar(v.co); s.material.opacity = v.op; } }
      const a = after - KIM3_T.hit; if (song) { song.visible = a > 0 && a < 0.5; if (song.visible) { song.position.z = reach; song.scale.setScalar(1 + 6 * Math.min(1, a / 0.4)); song.material.opacity = 0.8 * (1 - a / 0.5); } }
      for (let i = 0; i < saoS.length; i++) { const s = sao(i, after, kieu), q = saoS[i]; q.visible = s.hien; if (s.hien) { q.position.set(s.dx, 1 + s.dy, reach); q.scale.setScalar(s.co); q.material.opacity = s.op; } }
    };
  }
  if (kieu === 'liem_bac') for (let i = 0; i < saoS.length; i++) saoS[i].userData.hit = true;
  function update(t, after, than, gong, pz) {
    upd(t, after, pz || 0);
    if (kieu === 'liem_bac') for (let i = 0; i < saoS.length; i++) { const s = sao(i, after, kieu), q = saoS[i]; q.visible = s.hien; if (s.hien) { q.position.set(s.dx, 1.1 + s.dy, reach); q.scale.setScalar(s.co); q.material.opacity = s.op; } }
  }
  return { group: grp, update, kieu, get n() { return P.khoi; } };
}
