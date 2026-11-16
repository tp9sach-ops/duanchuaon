// VẼ THỔ 3D (Phiên 211, MỤC 6 của docs/KE_HOACH_HIEU_UNG_3D_V2.md): 6 chiêu Thổ có VẬT THỂ riêng (trước đây Thổ chỉ có hạt đá + vầng sáng).
// Số liệu/chuyển động thuần: js/world/thoFxMath.js (có test). CHƯA nhìn bằng mắt (môi trường AI không có WebGL): mở fx-tho.html để xem; mọi số cỡ/màu là số TẠM.
//   tho_1 gai_da: hàng gai đá trồi dọc đường chiêu như sóng + vệt nứt sáng + vụn đá + sóng chấn
//   tho_2 khien_nham: bảy tấm đá xoay quanh người rồi vỡ văng ra
//   tho_3 ho_trong_luc: hai vòng ấn vàng quay ngược chiều + đá xoáy hút vào tâm
//   tho_daidia_4 thach_giap: mảnh giáp đá bám quanh người, bật ra khi hết
//   tho_hukhong_4 mach_dat: mạch nứt sáng tỏa từ tâm, tinh thể trồi lên, đá lơ lửng bị kéo vào tâm
//   tho_tuyet nui_roi: NÚI ĐÁ rơi từ trên cao (chạm đất đúng lúc "trúng"), bẹp rồi bật, sóng chấn, vòng gai, đá văng, bụi mù, rồi núi chìm xuống
// Cùng giao diện với taoKim/taoHoa: trả { group, update(t, after, than, gong, pz), n }; trả null nếu id lạ. Không đèn động (vật liệu có tự phát sáng nhẹ để thấy được ban đêm). Hủy: chieuFx.free duyệt mọi con và dispose.
import * as THREE from 'three';
import { smoke, ring, streak } from './fxTex.js';
import { kieuTho, demTho, tamDich, gaiDa, manhDa, gongDa, nuiRoi, bui, nutHinh, nutDiem, nutTienDo, songDia, runeQuay, NUI } from '../world/thoFxMath.js';

let runeTex;   // kết cấu vòng ấn: vẽ canvas 1 lần, dùng chung
function runeTexture() {
  if (runeTex !== undefined) return runeTex;
  runeTex = null;
  try {
    if (typeof document !== 'undefined') {
      const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
      if (g) {
        g.translate(128, 128); g.strokeStyle = '#fff'; g.lineWidth = 5; g.beginPath(); g.arc(0, 0, 120, 0, 6.2832); g.stroke(); g.lineWidth = 2.5; g.beginPath(); g.arc(0, 0, 98, 0, 6.2832); g.stroke();
        for (let i = 0; i < 24; i++) { g.save(); g.rotate((i / 24) * 6.2832); g.lineWidth = i % 2 ? 2 : 4; g.beginPath(); g.moveTo(0, -98); g.lineTo(0, i % 2 ? -108 : -118); g.stroke(); g.restore(); }
        g.lineWidth = 3; for (let k = 0; k < 2; k++) { g.beginPath(); for (let i = 0; i < 3; i++) { const a = k * Math.PI / 3 + i * 2.0944, x = Math.sin(a) * 86, y = -Math.cos(a) * 86; if (i) g.lineTo(x, y); else g.moveTo(x, y); } g.closePath(); g.stroke(); }
        runeTex = new THREE.CanvasTexture(c); runeTex.colorSpace = THREE.SRGBColorSpace;
      }
    }
  } catch (_) { runeTex = null; }
  return runeTex;
}

export function taoTho(o = {}) {
  const kieu = kieuTho(o.id); if (!kieu) return null;
  const P = demTho(kieu, o.tier), reach = Math.max(1.5, o.reach || 4), R2 = Math.max(1, o.R2 || 2), W = Math.max(0.6, Math.min(1.6, reach * 0.3));
  const ctx = { reach, R2, W }, S = Math.max(0.7, Math.min(2.2, R2 / 3)), yeu = o.tier === 'yeu';
  const grp = new THREE.Group(); grp.frustumCulled = false;
  const tam = new THREE.Group(); tam.position.set(0, 0, tamDich(kieu) ? (o.zD || 0) : 0); grp.add(tam);   // mọi thứ trừ sỏi lúc gồng nằm trong nhóm này
  const da = (c, e) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.96, metalness: 0.02, flatShading: true, emissive: e, emissiveIntensity: 0.55 });
  const dm = new THREE.Object3D(), eu = new THREE.Euler(0, 0, 0, 'YXZ');
  const put = (m, i, v) => {
    if (v.hien) { dm.position.set(v.x, v.y, v.z); eu.set(v.rx || 0, v.ry || 0, v.rz || 0); dm.quaternion.setFromEuler(eu); dm.scale.set(v.sx != null ? v.sx : v.kich, v.sy != null ? v.sy : v.kich, v.sz != null ? v.sz : v.kich); }
    else { dm.position.set(0, -50, 0); dm.scale.setScalar(0.001); }
    dm.updateMatrix(); m.setMatrixAt(i, dm.matrix);
  };
  const inst = (geo, mat, n, parent) => { if (n <= 0) return null; const m = new THREE.InstancedMesh(geo, mat, n); m.frustumCulled = false; m.visible = false; parent.add(m); return m; };

  // ---- sỏi lúc gồng (quanh người, ngoài nhóm tâm) ----
  const gongM = inst(new THREE.IcosahedronGeometry(0.1, 0), da(0x8a7858, 0x2a1d0e), 4, grp);
  // ---- gai đá (cột nhọn, đáy ở mặt đất) ----
  const gG = new THREE.ConeGeometry(0.5, 1, 5, 1); gG.translate(0, 0.5, 0);
  const gai = inst(gG, da(0x8f7d5e, 0x2b1e0f), P.gai, tam);
  // ---- mảnh đá (hình tùy kiểu: tấm · mảnh giáp · tảng) ----
  const mG = kieu === 'khien_nham' ? new THREE.BoxGeometry(0.62, 0.82, 0.16) : kieu === 'giap_da' ? new THREE.OctahedronGeometry(0.17, 0) : new THREE.IcosahedronGeometry(0.2, 0);
  if (kieu === 'giap_da') mG.scale(1, 1.6, 0.6);
  const manh = inst(mG, da(0x7a6a50, 0x22170b), P.manh, tam);
  // ---- núi đá (chỉ tuyệt học) ----
  let nui = null;
  if (P.nui > 0) {
    nui = new THREE.Group(); nui.visible = false; const mt = da(0x7d6c52, 0x2e2010);
    const nonDa = (r, h, x, z, seg) => { const g = new THREE.ConeGeometry(r, h, seg, 1); g.translate(0, h / 2, 0); const m = new THREE.Mesh(g, mt); m.position.set(x, 0, z); m.rotation.y = x * 3 + z; m.frustumCulled = false; nui.add(m); };
    nonDa(1.9, 4.4, 0, 0, 7); nonDa(1.2, 2.9, 1.3, 0.7, 6); nonDa(1.0, 2.4, -1.2, -0.6, 6); nonDa(0.8, 1.8, 0.2, -1.5, 5);
    nui.scale.setScalar(S); tam.add(nui);
  }
  // ---- vệt nứt sáng (dải gấp khúc trên nền, hiện dần từ gốc ra ngoài bằng drawRange) ----
  const K = 9, nut = [];
  for (let i = 0; i < P.nut; i++) {
    const h = nutHinh(kieu, i, P.nut, ctx); if (!h) continue;
    const pts = nutDiem(h.a, h.z0, h.dai, K, i), pos = new Float32Array(K * 2 * 3), uv = new Float32Array(K * 2 * 2), idx = [];
    for (let j = 0; j < K; j++) {
      const p = pts[j], q = pts[Math.min(K - 1, j + 1)], r = pts[Math.max(0, j - 1)], dx = q[0] - r[0], dz = q[1] - r[1], l = Math.hypot(dx, dz) || 1, w = 0.16 * (1 - 0.55 * (j / (K - 1)));
      const px = (dz / l) * w, pz = (-dx / l) * w;
      pos.set([p[0] + px, 0.04, p[1] + pz, p[0] - px, 0.04, p[1] - pz], j * 6); uv.set([0, j / (K - 1), 1, j / (K - 1)], j * 4);
      if (j < K - 1) { const a = j * 2; idx.push(a, a + 1, a + 3, a, a + 3, a + 2); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx); g.setDrawRange(0, 0);
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xffbf5e, map: streak(), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); m.frustumCulled = false; m.visible = false; tam.add(m);
    nut.push({ m, tre: h.tre });
  }
  // ---- bụi (sprite khói nâu) ----
  const buiS = []; for (let i = 0; i < P.bui; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: smoke(), color: 0xb59a6c, transparent: true, opacity: 0, depthWrite: false })); s.frustumCulled = false; s.visible = false; s.material.rotation = i * 1.7; tam.add(s); buiS.push(s); }
  // ---- sóng chấn nền (bỏ ở máy yếu) ----
  let song = null;
  if (!yeu && (kieu === 'gai_da' || kieu === 'mach_dat' || kieu === 'nui_roi')) { song = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0xffd58a, map: ring(), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); song.rotation.x = -Math.PI / 2; song.position.set(0, 0.05, kieu === 'gai_da' ? 1.0 : 0); song.frustumCulled = false; song.visible = false; tam.add(song); }
  // ---- vòng ấn trên nền (xoay ngược chiều nhau) ----
  const an = [], tamNguoi = kieu === 'giap_da' || kieu === 'khien_nham';
  for (let j = 0; j < P.an; j++) {
    const piv = new THREE.Group(), m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: j ? 0xffe3a6 : 0xffc15a, map: runeTexture(), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    m.rotation.x = -Math.PI / 2; m.frustumCulled = false; piv.position.set(0, 0.06 + j * 0.01, 0); piv.visible = false; piv.add(m); tam.add(piv);
    an.push({ piv, m, co: (tamNguoi ? 2.4 : R2 * 2.1) * (j ? 0.7 : 1) });
  }

  const dong = (m, n, fn) => { if (!m) return; let any = false; for (let i = 0; i < n; i++) { const v = fn(i); if (v.hien) any = true; put(m, i, v); } m.visible = any; m.instanceMatrix.needsUpdate = true; };
  function update(t, after, than, gong, pz) {
    const dangGong = after < 0;
    if (gongM) { const any = dangGong && (gong || 0) > 0.02; for (let i = 0; i < 4; i++) put(gongM, i, any ? gongDa(i, t, gong) : { hien: false }); gongM.visible = any; gongM.instanceMatrix.needsUpdate = true; }
    const on = after >= NUI.start - 0.01 && after < 1.75; tam.visible = on; if (!on) return;
    if (nui) { const v = nuiRoi(after, S); nui.visible = v.hien; if (v.hien) { nui.position.y = v.y; nui.scale.set(S * v.sx, S * v.sy, S * v.sx); } }
    dong(gai, P.gai, (i) => { const v = gaiDa(kieu, i, P.gai, after, ctx); return v.hien ? { hien: true, x: v.x, y: 0, z: v.z, rx: v.ngh * 0.6, rz: v.ngh, sx: v.rong, sy: v.cao, sz: v.rong } : { hien: false }; });
    dong(manh, P.manh, (i) => manhDa(kieu, i, P.manh, after, ctx));
    for (const c of nut) { const v = nutTienDo(c.tre, after), vis = v.op > 0.01 && v.k > 0.01; c.m.visible = vis; if (vis) { c.m.geometry.setDrawRange(0, Math.max(1, Math.floor(v.k * (K - 1))) * 6); c.m.material.opacity = 0.95 * v.op; } }
    for (let i = 0; i < buiS.length; i++) { const s = buiS[i], v = bui(kieu, i, P.bui, after, ctx); s.visible = v.hien; if (v.hien) { s.position.set(v.x, v.y, v.z); s.scale.setScalar(v.co); s.material.opacity = v.op; } }
    if (song) { const v = songDia(kieu, after); song.visible = v.hien; if (v.hien) { song.scale.setScalar(Math.max(0.05, (kieu === 'gai_da' ? W * 2.4 : R2 * 1.7) * v.k)); song.material.opacity = 0.7 * v.op; } }
    for (let j = 0; j < an.length; j++) { const a = an[j], op = after < 0 ? 0 : 0.85 * Math.min(1, after / 0.1) * (1 - Math.min(1, Math.max(0, (after - 1.0) / 0.5))); a.piv.visible = op > 0.01; if (a.piv.visible) { a.piv.rotation.y = runeQuay(j, t); a.m.scale.setScalar(a.co * (0.92 + 0.08 * Math.sin(t * 6 + j))); a.m.material.opacity = op; } }
  }
  return { group: grp, update, kieu, get n() { return P.khoi; } };
}
