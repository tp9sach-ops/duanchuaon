// VẼ BĂNG THẬT + NƯỚC THẬT (Phiên 180, mục 2 của docs/KE_HOACH_HIEU_UNG_3D.md). Số liệu/chuyển động: js/world/bang.js (có test). CHƯA nhìn bằng mắt (không có WebGL ở môi trường AI): cỡ, độ sáng là số TẠM.
// BĂNG = tinh thể 3D thật (lăng trụ sáu cạnh nhọn đầu, mặt phẳng phản sáng, trong mờ ánh xanh, lõi sáng bên trong, viền sáng) mọc từ đất, vỡ thành mảnh đa diện (InstancedMesh) bay tung rồi rơi; sương lạnh; mặt đất đóng băng loang (kết cấu nhánh tinh thể); lấp lánh sao.
// NƯỚC = dải nước xoáy hình xoắn ốc (ống 3D, kết cấu dòng chảy cuộn), sóng vành mép cuộn (mặt tròn xoay), cột nước bùng lên rồi sập, giọt nước (InstancedMesh) bắn tóe, bọt trắng, vòng sóng loang trên nền.
// KHÔNG đèn động (rẻ cho điện thoại): vật liệu có thành phần tự phát sáng nhẹ để vẫn đọc được ở cảnh tối. Không có document (môi trường test) → kết cấu null, vật thể vẫn dựng được, không lỗi.
// Chiêu gọi dispose qua việc xóa group khỏi cảnh (chieuFx.free duyệt mọi con, giải phóng hình + vật liệu; kết cấu dùng chung không giải phóng).
import * as THREE from 'three';
import { glow, smoke, ring, flare } from './fxTex.js';
import { lapBang, tinhTheBang, viTriBang, manhBang, suongBang, nenBang, songNuoc, cotNuoc, xoayNuoc, giotNuoc, botNuoc, SO_KIEU_BANG } from '../world/bang.js';

const cache = {};
const mkTex = (key, w, h, draw, lap) => {
  if (key in cache) return cache[key];
  let t = null;
  try {
    if (typeof document !== 'undefined') {
      const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
      if (g) { draw(g, w, h); t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; if (lap) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(lap[0], lap[1]); } t.needsUpdate = true; }
    }
  } catch (_) { t = null; }
  return (cache[key] = t);
};
const rng = (seed) => { let s = seed * 9973 + 17; return () => (s = (s * 16807) % 2147483647) / 2147483647; };

/** Mặt đất đóng băng: nền sương băng mờ + nhánh tinh thể (hình bông tuyết) tỏa từ tâm, mép tan dần. */
const frostTex = () => mkTex('frost', 256, 256, (g, w, h) => {
  const rnd = rng(31), cx = w / 2, cy = h / 2;
  const base = g.createRadialGradient(cx, cy, 0, cx, cy, w / 2); base.addColorStop(0, 'rgba(225,245,255,0.62)'); base.addColorStop(0.5, 'rgba(205,236,253,0.38)'); base.addColorStop(0.85, 'rgba(190,226,250,0.14)'); base.addColorStop(1, 'rgba(190,226,250,0)');
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 46; i++) { const a = rnd() * 6.2832, r = Math.sqrt(rnd()) * w * 0.4, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r, rr = 4 + rnd() * 12, q = g.createRadialGradient(x, y, 0, x, y, rr); q.addColorStop(0, 'rgba(245,252,255,0.35)'); q.addColorStop(1, 'rgba(245,252,255,0)'); g.fillStyle = q; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
  g.lineCap = 'round';
  const nhanh = (x, y, a, len, d) => { const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len; g.strokeStyle = `rgba(240,252,255,${0.5 + d * 0.12})`; g.lineWidth = 0.8 + d * 1.1; g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke(); if (d > 0) for (const f of [0.45, 0.72]) { const bx = x + Math.cos(a) * len * f, by = y + Math.sin(a) * len * f; nhanh(bx, by, a + 0.75, len * 0.38, d - 1); nhanh(bx, by, a - 0.75, len * 0.38, d - 1); } };
  for (let i = 0; i < 14; i++) nhanh(cx, cy, (i / 14) * 6.2832 + rnd() * 0.25, w * (0.26 + rnd() * 0.2), 2);
  g.globalCompositeOperation = 'destination-in'; const m = g.createRadialGradient(cx, cy, w * 0.3, cx, cy, w / 2); m.addColorStop(0, 'rgba(0,0,0,1)'); m.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = m; g.fillRect(0, 0, w, h);
});
/** Dòng nước chảy: dải xanh đậm nhạt, vệt trắng gợn sóng, bọt nhỏ; ghép liền theo chiều dọc (cuộn được). */
const nuocTex = () => mkTex('nuoc', 128, 128, (g, w, h) => {
  const rnd = rng(57);
  for (let y = 0; y < h; y++) { const v = 0.5 + 0.5 * Math.sin((y / h) * 6.2832 * 2), r = 70 + v * 60, gg = 160 + v * 55, b = 215 + v * 30; g.fillStyle = `rgba(${r | 0},${gg | 0},${b | 0},0.88)`; g.fillRect(0, y, w, 1); }
  for (let i = 0; i < 30; i++) {
    const x0 = rnd() * w, y0 = rnd() * h, len = h * (0.2 + 0.4 * rnd()), ph = rnd() * 6; g.strokeStyle = `rgba(255,255,255,${0.2 + rnd() * 0.3})`; g.lineWidth = 1 + rnd() * 2.2;
    for (const off of [0, -h]) { g.beginPath(); for (let k = 0; k <= 10; k++) { const y = y0 + off + (k / 10) * len, x = x0 + Math.sin(ph + k * 0.7) * 3; if (k) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke(); }
  }
  for (let i = 0; i < 24; i++) { const x = rnd() * w, y = rnd() * h, r = 2 + rnd() * 4, q = g.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, 'rgba(255,255,255,0.5)'); q.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = q; g.fillRect(x - r, y - r, r * 2, r * 2); }
}, [3, 2]);

/** Tinh thể: lăng trụ sáu cạnh, vai ở độ cao `vai` (0..1), mũi nhọn. Cao 1, bán kính chân 1 (nhân sau theo từng tinh thể). */
const hinhTinhThe = (kieu) => {
  const vai = [0.5, 0.66, 0.82][kieu % SO_KIEU_BANG], thon = [1, 0.85, 0.62][kieu % SO_KIEU_BANG];
  const pts = [new THREE.Vector2(0.001, 0), new THREE.Vector2(thon, 0.03), new THREE.Vector2(thon, vai), new THREE.Vector2(0.001, 1)];
  return new THREE.LatheGeometry(pts, 6);
};

export function taoBang(o = {}) {
  const P = lapBang(o.tier, o.mode, { co: o.co }), grp = new THREE.Group(), reach = o.reach || 4, R2 = o.R2 || 2, zD = o.zD || 0, tNen = o.tNen || 2.4, tia = P.mode === 'tia';
  const loai = o.loai === 'nuoc' ? 'nuoc' : 'bang', yeu = P.tier === 'yeu';
  grp.frustumCulled = false;
  const Rm = tia ? Math.min(2.2, reach * 0.32) : R2, zM = tia ? reach * 0.5 : zD;   // vùng sương/bọt: dọc đường đi (tia) hoặc quanh tâm
  const ham = [];   // các hàm cập nhật từng phần
  let nVat = 0;

  if (loai === 'bang') {
    // ---- tinh thể ----
    const ice = P.tinhThe.map((s) => {
      const geo = hinhTinhThe(s.kieu), g = new THREE.Group();
      const th = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xcfeeff, emissive: 0x3fb0ee, emissiveIntensity: 0.55, roughness: 0.06, metalness: 0.15, transparent: true, opacity: 0, flatShading: true, side: THREE.DoubleSide, depthWrite: false }));
      const loi = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xbfeaff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); loi.scale.set(0.5, 0.82, 0.5);
      const vien = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0xf0fcff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
      g.add(th, loi, vien); g.visible = false; g.frustumCulled = false; th.frustumCulled = false; loi.frustumCulled = false; vien.frustumCulled = false; grp.add(g);
      return { g, th, loi, vien };
    });
    nVat += ice.length;
    // ---- gồng: 3 tinh thể nhỏ xoay quanh người ----
    const gongG = [0, 1, 2].map((i) => { const m = new THREE.Mesh(hinhTinhThe(2), new THREE.MeshStandardMaterial({ color: 0xcfeeff, emissive: 0x4fc0ff, emissiveIntensity: 0.7, roughness: 0.08, transparent: true, opacity: 0, flatShading: true, depthWrite: false })); m.visible = false; m.frustumCulled = false; grp.add(m); return m; });
    // ---- mũi băng ở đầu chiêu bay (tia) ----
    let dau = null;
    if (tia) { const gg = hinhTinhThe(2); gg.rotateX(Math.PI / 2); const d = new THREE.Group(), a = new THREE.Mesh(gg, new THREE.MeshStandardMaterial({ color: 0xdff5ff, emissive: 0x58c8ff, emissiveIntensity: 0.8, roughness: 0.05, transparent: true, opacity: 0, flatShading: true, depthWrite: false })), b = new THREE.Mesh(gg, new THREE.MeshBasicMaterial({ color: 0xeaf9ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); b.scale.set(0.55, 0.55, 0.9); d.add(a, b); d.visible = false; d.frustumCulled = false; a.frustumCulled = false; b.frustumCulled = false; grp.add(d); dau = { d, a, b }; nVat += 1; }
    // ---- mảnh vỡ (một InstancedMesh) ----
    let manh = null; const dm = new THREE.Object3D();
    if (P.nManh > 0) { manh = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.13, 0), new THREE.MeshStandardMaterial({ color: 0xd8f2ff, emissive: 0x3aa6e8, emissiveIntensity: 0.5, roughness: 0.1, transparent: true, opacity: 0.88, flatShading: true }), P.nManh); manh.frustumCulled = false; manh.count = P.nManh; grp.add(manh); nVat += P.nManh; }
    // ---- lấp lánh sao ở ngọn ----
    const sao = []; if (!yeu) for (let i = 0; i < 4; i++) { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: flare(), color: 0xeaf9ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); m.frustumCulled = false; m.visible = false; grp.add(m); sao.push(m); }
    // ---- sương lạnh ----
    const suong = P.suong.map(() => { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: smoke(), color: 0xd6efff, transparent: true, opacity: 0, depthWrite: false })); m.frustumCulled = false; m.visible = false; grp.add(m); return m; });
    // ---- mặt đất đóng băng ----
    let nen = null;
    if (!yeu) { nen = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: frostTex(), color: 0xe4f6ff, transparent: true, opacity: 0, depthWrite: false })); nen.rotation.x = -Math.PI / 2; nen.position.set(0, 0.05, tia ? 0 : zD); nen.frustumCulled = false; grp.add(nen); }
    const ban = P.tinhThe.map(() => ({ x: 0, z: 0, tre: 0 }));

    ham.push((t, after, than, gong, pz) => {
      const dangGong = after < 0, ctx = { reach, R2, zD, pz: pz || 0, after };
      // gồng
      for (let i = 0; i < gongG.length; i++) { const m = gongG[i]; if (!dangGong || gong <= 0.01) { m.visible = false; continue; } const a = t * 4.2 + i * 2.094, c = 0.18 + 0.3 * gong; m.visible = true; m.position.set(Math.cos(a) * 0.62, 1.0 + 0.18 * Math.sin(t * 3 + i), Math.sin(a) * 0.62); m.scale.set(c * 0.55, c * 1.5, c * 0.55); m.rotation.set(0.5, a, 0.4); m.material.opacity = Math.min(1, gong * 1.4) * 0.85; }
      // tinh thể
      let nSao = 0;
      for (let i = 0; i < P.tinhThe.length; i++) {
        const s = P.tinhThe[i], ob = ice[i];
        if (dangGong) { ob.g.visible = false; continue; }
        const v = viTriBang(P.mode, s, ctx), st = tinhTheBang(s, after, v.tre);
        ban[i].x = v.x; ban[i].z = v.z; ban[i].tre = v.tre;
        if (!v.hien || !st.hien || st.op <= 0.003) { ob.g.visible = false; continue; }
        const mul = v.mul, h = s.cao * mul * st.moc * (1 - 0.35 * st.vo), r = s.rong * mul * (0.7 + 0.3 * Math.min(1, st.moc)) * (1 - 0.2 * st.vo);
        ob.g.visible = true; ob.g.position.set(v.x, 0, v.z); ob.g.scale.set(r, h, r);
        const ra = Math.atan2(v.x, v.z - (tia ? v.z : zD)); ob.g.rotation.set(s.ngh * 0.8 + (tia ? 0.1 : 0.12 * Math.cos(ra)), s.xoay, s.ngh + (tia ? 0 : 0.12 * Math.sin(ra)));
        const nh = 0.9 + 0.1 * Math.sin(after * 11 + s.phi * 30);
        ob.th.material.opacity = 0.72 * st.op; ob.th.material.emissiveIntensity = 0.5 + 0.3 * nh;
        ob.loi.material.opacity = 0.35 * st.op * nh; ob.vien.material.opacity = 0.85 * st.op;
        if (nSao < sao.length && s.kieu === 2 && st.moc > 0.9) { const m = sao[nSao++]; m.visible = true; m.position.set(v.x, h * 0.98, v.z); m.scale.setScalar(0.5 + 0.5 * nh); m.material.opacity = st.op * (0.45 + 0.55 * Math.max(0, Math.sin(after * 13 + s.phi * 20))); m.material.rotation = after * 0.6; }
      }
      for (let k = nSao; k < sao.length; k++) sao[k].visible = false;
      // mũi băng đầu chiêu (tia)
      if (dau) {
        const vis = after >= 0, vo = Math.max(0, Math.min(1, (after - 0.42) / 0.2));
        dau.d.visible = vis && vo < 1;
        if (dau.d.visible) { const k = Math.min(1, after / 0.12), s = (0.28 + 0.12 * P.kc) * k * (1 - 0.5 * vo); dau.d.position.set(0, 1.0, Math.min(reach, pz || 0)); dau.d.rotation.z = after * 14; dau.d.scale.set(s, s, s * 3.2); dau.a.material.opacity = 0.85 * (1 - vo); dau.b.material.opacity = 0.7 * (1 - vo); }
      }
      // mảnh vỡ
      if (manh) {
        for (let i = 0; i < P.manh.length; i++) {
          const m = P.manh[i], g = P.tinhThe[m.goc] || P.tinhThe[0], b = ban[m.goc] || ban[0], q = manhBang(m, after, g, b.tre);
          if (dangGong || !q.hien) { dm.scale.setScalar(0.0001); dm.position.set(0, -5, 0); } else { dm.position.set(b.x + q.dx, q.dy, b.z + q.dz); dm.rotation.set(q.quay, q.quay * 0.7, q.quay * 0.4); dm.scale.setScalar(Math.max(0.0001, q.co * q.op * (0.9 + 0.3 * P.kc * 0.3))); }
          dm.updateMatrix(); manh.setMatrixAt(i, dm.matrix);
        }
        manh.instanceMatrix.needsUpdate = true;
      }
      // sương lạnh trôi sát đất
      const rs = Math.max(0, Math.min(1, after / 0.15)) * Math.max(0, Math.min(1, (tNen * 0.7 - after) / 0.6));
      for (let i = 0; i < P.suong.length; i++) { const m = suong[i]; if (dangGong || rs <= 0.01) { m.visible = false; continue; } const q = suongBang(P.suong[i], t, Rm); m.visible = true; m.position.set(q.x, q.y, zM + q.z); m.scale.set(q.kichCo, q.kichCo * 0.6, 1); m.material.opacity = q.op * rs; m.material.rotation = P.suong[i].a + t * 0.12; }
      // mặt đất đóng băng loang
      if (nen) { const q = nenBang(after, tNen); nen.visible = q.op > 0.003; if (tia) { const L = Math.max(1, Math.min(reach, (pz || 0) + 1.2)), W2 = Math.min(3.2, reach * 0.5); nen.position.z = L / 2; nen.scale.set(W2 * (0.4 + 0.6 * q.k), L, 1); } else { const d = R2 * 2.3 * q.k; nen.scale.set(Math.max(0.01, d), Math.max(0.01, d), 1); } nen.material.opacity = 0.85 * q.op; }
    });
  } else {
    // ================= NƯỚC =================
    const dongChay = nuocTex();
    const matNuoc = (op = 0) => new THREE.MeshStandardMaterial({ color: 0x7ecff5, map: dongChay, emissive: 0x2a86c8, emissiveIntensity: 0.55, roughness: 0.05, metalness: 0.05, transparent: true, opacity: op, side: THREE.DoubleSide, depthWrite: false });
    const xoay = P.mode === 'xoay';
    // sóng vành mép cuộn (mặt tròn xoay): thân thẳng, đỉnh cuộn vào trong
    const profSong = [[0.9, 0], [0.97, 0.22], [1, 0.52], [0.96, 0.82], [0.86, 1], [0.78, 0.93], [0.84, 0.66], [0.87, 0.28], [0.86, 0]].map((p) => new THREE.Vector2(p[0], p[1]));
    const songs = xoay ? [] : Array.from({ length: P.nSong }, () => { const m = new THREE.Mesh(new THREE.LatheGeometry(profSong, 40), matNuoc()); m.visible = false; m.frustumCulled = false; grp.add(m); const rg = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0xcdeeff, map: ring(), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); rg.rotation.x = -Math.PI / 2; rg.position.y = 0.06; rg.visible = false; rg.frustumCulled = false; grp.add(rg); return { m, rg }; });
    // cột nước giữa (chiêu nổ): ống mở, miệng loe
    let cot = null, cotBot = null;
    if (!xoay) { const cg = new THREE.CylinderGeometry(1, 0.62, 1, 22, 5, true); cg.translate(0, 0.5, 0); cot = new THREE.Mesh(cg, matNuoc()); cot.visible = false; cot.frustumCulled = false; grp.add(cot); cotBot = new THREE.Sprite(new THREE.SpriteMaterial({ map: smoke(), color: 0xf2fbff, transparent: true, opacity: 0, depthWrite: false })); cotBot.visible = false; cotBot.frustumCulled = false; grp.add(cotBot); }
    // dải nước xoáy quanh người (chiêu xoay): ống xoắn ốc
    const dai = xoay ? Array.from({ length: P.nSong + 1 }, (_, i) => { const pts = []; for (let k = 0; k <= 40; k++) { const q = k / 40, a = q * 6.2832 * 1.7 + i * 1.7; pts.push(new THREE.Vector3(Math.cos(a), q * 1.8, Math.sin(a))); } const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.11, 6, false), matNuoc()); m.visible = false; m.frustumCulled = false; grp.add(m); return m; }) : [];
    nVat += songs.length + dai.length + (cot ? 1 : 0);
    // giọt nước (một InstancedMesh)
    let giot = null; const dg = new THREE.Object3D();
    if (P.nGiot > 0) { giot = new THREE.InstancedMesh(new THREE.SphereGeometry(0.09, 8, 6), new THREE.MeshStandardMaterial({ color: 0xbfeaff, emissive: 0x3a98d8, emissiveIntensity: 0.55, roughness: 0.05, transparent: true, opacity: 0.9 }), P.nGiot); giot.frustumCulled = false; giot.count = P.nGiot; grp.add(giot); nVat += P.nGiot; }
    // bọt trắng
    const bot = P.bot.map(() => { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: smoke(), color: 0xf4fbff, transparent: true, opacity: 0, depthWrite: false })); m.frustumCulled = false; m.visible = false; grp.add(m); return m; });
    // quầng nước nhỏ lúc gồng
    const gongG = [0, 1, 2].map(() => { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow(), color: 0x8fdcff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); m.visible = false; m.frustumCulled = false; grp.add(m); return m; });
    const kc = P.kc;

    ham.push((t, after, than, gong) => {
      const dangGong = after < 0, cuon = -((typeof performance !== 'undefined' ? performance.now() : 0) / 1000) * 1.1;
      if (dongChay) dongChay.offset.y = cuon % 1;
      for (let i = 0; i < gongG.length; i++) { const m = gongG[i]; if (!dangGong || gong <= 0.01) { m.visible = false; continue; } const a = t * 4 + i * 2.094; m.visible = true; m.position.set(Math.cos(a) * 0.6, 1.05 + 0.15 * Math.sin(t * 3 + i), Math.sin(a) * 0.6); m.scale.setScalar(0.35 + 0.55 * gong); m.material.opacity = Math.min(1, gong * 1.3) * 0.8; }
      // sóng vành + vòng sóng loang trên nền
      for (let i = 0; i < songs.length; i++) {
        const q = songNuoc(i, dangGong ? -1 : after, R2, o.co), { m, rg } = songs[i];
        if (!q.hien) { m.visible = false; rg.visible = false; continue; }
        m.visible = true; m.position.set(0, 0, zD); m.scale.set(q.banKinh, Math.max(0.01, q.cao), q.banKinh); m.rotation.y = i * 0.9 + after * 0.6; m.material.opacity = 0.78 * q.op;
        rg.visible = true; rg.position.z = zD; rg.scale.setScalar(Math.max(0.01, q.banKinh * 2.5)); rg.material.opacity = 0.65 * q.op;
      }
      // cột nước giữa
      if (cot) { const q = cotNuoc(dangGong ? -1 : after, o.co, R2); cot.visible = q.hien && q.op > 0.01; if (cot.visible) { cot.position.set(0, 0, zD); cot.scale.set(q.banKinh, Math.max(0.01, q.cao), q.banKinh); cot.rotation.y = after * 2.4; cot.material.opacity = 0.7 * q.op; cotBot.visible = true; cotBot.position.set(0, 0.4, zD); cotBot.scale.set(q.banKinh * 5, q.banKinh * 3, 1); cotBot.material.opacity = 0.5 * q.op; } else cotBot.visible = false; }
      // dải xoắn quanh người
      for (let i = 0; i < dai.length; i++) { const m = dai[i], q = xoayNuoc(i, dai.length, dangGong ? -1 : after, R2); if (dangGong || q.op <= 0.01) { m.visible = false; continue; } m.visible = true; m.position.set(0, q.y * 0.2, 0); m.rotation.y = q.goc; m.scale.set(q.banKinh, 0.7 + 0.5 * Math.min(1, after / 0.5), q.banKinh); m.material.opacity = 0.72 * q.op; }
      // giọt nước
      if (giot) {
        for (let i = 0; i < P.giot.length; i++) {
          const g = P.giot[i], q = giotNuoc(g, dangGong ? -1 : after, R2);
          if (!q.hien) { dg.scale.setScalar(0.0001); dg.position.set(0, -5, 0); } else { dg.position.set(q.x, q.y, zD + q.z); dg.rotation.set(0, 0, 0); dg.scale.set(g.co * q.op, g.co * q.dai * q.op, g.co * q.op); }
          dg.updateMatrix(); giot.setMatrixAt(i, dg.matrix);
        }
        giot.instanceMatrix.needsUpdate = true;
      }
      // bọt trắng ở chân
      const rb = Math.max(0, Math.min(1, after / 0.2)) * Math.max(0, Math.min(1, (tNen * 0.6 - after) / 0.6));
      for (let i = 0; i < P.bot.length; i++) { const m = bot[i]; if (dangGong || rb <= 0.01) { m.visible = false; continue; } const q = botNuoc(P.bot[i], t, R2); m.visible = true; m.position.set(q.x, q.y, zD + q.z); m.scale.set(q.kichCo * kc, q.kichCo * kc * 0.7, 1); m.material.opacity = q.op * rb; }
    });
  }

  function update(t, after, than, gong, pz) { for (const f of ham) f(t, after, than, gong, pz); }
  return { group: grp, update, plan: P, loai, get n() { return nVat; } };
}
