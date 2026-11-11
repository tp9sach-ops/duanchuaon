// Ba mô hình yêu quái có hoạt ảnh (Phiên 100): Yêu Đá (người khổng lồ đá, rune phát sáng, đá bay quanh), Yêu Nước (giọt nước linh hồn, lõi sáng, xúc tu, giọt bay quanh), Yêu Lửa (quỷ dung nham, bờm lửa, sừng, tàn lửa bay).
// Mỗi hàm dựng trả { g, mats, anim(t, s) }. s = { wind (0..1 đang gồng), strike (1→0 ngay sau khi đánh), move (đang đi), hit (0..1 vừa trúng đòn, do cảnh xử lý) }. Vật liệu RIÊNG từng con (để nháy trắng khi trúng đòn không ảnh hưởng con khác).
// Không dùng three.js ở mức module (cho mô phỏng giả three nạp được); chỉ dựng khi gọi.
import * as THREE from 'three';

const sph = (r, w = 14, h = 10) => new THREE.SphereGeometry(r, w, h), dode = (r) => new THREE.DodecahedronGeometry(r, 0), cone = (r, h, s = 8) => new THREE.ConeGeometry(r, h, s);
function kit() {
  const mats = [];
  const reg = (m) => (mats.push(m), m);
  return {
    mats,
    std: (c, o = {}) => reg(new THREE.MeshStandardMaterial({ color: c, roughness: 0.88, flatShading: true, ...o })),
    glow: (c, i = 1.2) => reg(new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: i, roughness: 0.4 })),
    basic: (c, o = {}) => reg(new THREE.MeshBasicMaterial({ color: c, ...o })),
    put(parent, geo, mat, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.castShadow = true; parent.add(m); return m; },
  };
}
const lerp = (a, b, k) => a + (b - a) * k;

/** Yêu Đá: thân đá nứt phát sáng cam. */
export function buildGolem(t) {
  const b = t.body, g = new THREE.Group(), K = kit(), { std, glow, put } = K;
  const rock = std(t.color), rock2 = std(0x62676d), dark = std(0x3c4046), moss = std(0x4f7d3c), rune = glow(0xffa83a, 1.2), eye = glow(0xffcc55, 2);
  const body = new THREE.Group(); g.add(body);
  put(body, dode(b * 1.0), rock, 0, b * 1.55, 0, 1.2, 1.05, 0.95);
  put(body, dode(b * 0.78), rock2, 0, b * 0.8, 0, 1.1, 0.9, 0.9);
  const torus = put(body, new THREE.TorusGeometry(b * 0.3, b * 0.045, 6, 20), rune, 0, b * 1.6, b * 0.9); put(body, sph(b * 0.13, 10, 8), rune, 0, b * 1.6, b * 0.93);
  for (const [x, y, r] of [[0, 1.2, 0.35], [-0.45, 1.75, -0.7], [0.5, 1.95, 0.9], [0.3, 0.9, -0.4]]) { const c = put(body, new THREE.BoxGeometry(b * 0.05, b * 0.55, b * 0.05), rune, x * b, y * b, b * 0.86); c.rotation.z = r; }
  const arms = [];
  for (const s of [-1, 1]) {
    put(body, dode(b * 0.5), rock2, s * b * 1.02, b * 2.12, 0); put(body, dode(b * 0.2), moss, s * b * 1.0, b * 2.55, b * 0.05);
    const p = new THREE.Group(); p.position.set(s * b * 1.15, b * 2.0, 0); p.rotation.z = s * 0.12; body.add(p);
    put(p, dode(b * 0.42), rock, s * b * 0.12, -b * 0.55, 0, 1, 1.25, 1); put(p, dode(b * 0.64), rock2, s * b * 0.18, -b * 1.3, b * 0.08);
    for (let i = 0; i < 3; i++) put(p, dode(b * 0.15), dark, s * b * (0.0 + i * 0.2), -b * 1.72, b * 0.35);
    arms.push({ p, s });
    const lg = put(g, dode(b * 0.5), rock, s * b * 0.62, b * 0.45, 0, 1, 1.2, 1); lg.userData.leg = s;
  }
  const head = new THREE.Group(); head.position.set(0, b * 2.78, b * 0.15); body.add(head);
  put(head, dode(b * 0.52), rock, 0, 0, 0, 1.1, 0.9, 1); put(head, new THREE.BoxGeometry(b * 0.8, b * 0.12, b * 0.3), dark, 0, b * 0.14, b * 0.36);
  put(head, new THREE.BoxGeometry(b * 0.6, b * 0.22, b * 0.3), dark, 0, -b * 0.36, b * 0.28);
  for (const s of [-1, 1]) { put(head, sph(b * 0.095, 8, 6), eye, s * b * 0.2, b * 0.02, b * 0.46); const h = put(head, cone(b * 0.1, b * 0.5, 6), dark, s * b * 0.36, b * 0.5, 0); h.rotation.z = -s * 0.5; }
  const orbit = []; for (let i = 0; i < 5; i++) orbit.push({ m: put(g, dode(b * (0.16 + (i % 2) * 0.07)), rock2), a: i * 1.2566, y: b * (1.1 + (i % 3) * 0.65), r: b * (1.85 + (i % 2) * 0.3) });
  const legs = g.children.filter((c) => c.userData && c.userData.leg);
  return {
    g, mats: K.mats,
    anim(tm, s) {
      const br = Math.sin(tm * 1.6) * 0.02, sq = 0.1 * s.strike;
      body.scale.set(1 + sq * 0.6, 1 + br - 0.08 * s.wind - sq, 1 + sq * 0.6); body.position.y = Math.abs(Math.sin(tm * 4)) * 0.1 * (s.move ? 1 : 0) - 0.12 * s.wind;
      for (const a of arms) a.p.rotation.x = s.wind > 0 ? -2.7 * s.wind : lerp(Math.sin(tm * 1.6 + (a.s > 0 ? 0 : 1.6)) * 0.08, 0.55, s.strike);
      head.rotation.x = 0.25 * s.wind - 0.15 * s.strike;
      legs.forEach((l, i) => { l.position.y = b * 0.45 + (s.move ? Math.max(0, Math.sin(tm * 4 + i * Math.PI)) * 0.22 : 0); });
      g.position.x = s.wind > 0 ? Math.sin(tm * 70) * 0.04 * s.wind : 0;
      rune.emissiveIntensity = 1.0 + 0.35 * Math.sin(tm * 3) + 2.6 * s.wind + 3 * s.strike; eye.emissiveIntensity = 1.6 + 2.5 * s.wind + 2 * s.strike;
      torus.rotation.z = tm * 0.8;
      for (const o of orbit) { const a = o.a + tm * (0.7 + 0.8 * s.wind); o.m.position.set(Math.cos(a) * o.r, o.y + Math.sin(tm * 1.7 + o.a) * 0.15, Math.sin(a) * o.r); o.m.rotation.set(tm, a, 0); }
    },
  };
}

/** Yêu Nước: giọt nước trong suốt, lõi sáng, xúc tu, giọt bay quanh, gợn sóng dưới chân. */
export function buildWisp(t) {
  const b = t.body, g = new THREE.Group(), K = kit(), { glow, basic, put } = K;
  const water = K.mats[K.mats.push(new THREE.MeshStandardMaterial({ color: t.color, transparent: true, opacity: 0.72, roughness: 0.08, metalness: 0.1, emissive: 0x1b6f95, emissiveIntensity: 0.5, depthWrite: false })) - 1];
  const water2 = K.mats[K.mats.push(new THREE.MeshStandardMaterial({ color: 0x9fe4ff, transparent: true, opacity: 0.6, roughness: 0.1, emissive: 0x3aa8d8, emissiveIntensity: 0.45, depthWrite: false })) - 1];
  const prof = [[0.001, 0], [0.55, 0.08], [0.86, 0.3], [0.92, 0.55], [0.72, 0.82], [0.36, 1.02], [0.001, 1.12]].map(([r, y]) => new THREE.Vector2(r * b, y * b * 2.6));
  const body = new THREE.Group(); g.add(body);
  put(body, new THREE.LatheGeometry(prof, 28), water);
  const core = basic(0xbff6ff, { transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }), coreM = put(body, sph(b * 0.42, 16, 12), core, 0, b * 1.25, 0);
  const white = basic(0xffffff), pupil = basic(0x0b2c3d);
  for (const s of [-1, 1]) { put(body, sph(b * 0.17, 10, 8), white, s * b * 0.34, b * 1.78, b * 0.78); put(body, sph(b * 0.085, 8, 6), pupil, s * b * 0.34, b * 1.78, b * 0.93); }
  const mouth = put(body, new THREE.TorusGeometry(b * 0.13, b * 0.028, 6, 12, Math.PI), pupil, 0, b * 1.5, b * 0.86); mouth.rotation.z = Math.PI;
  const fins = []; for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2, f = put(body, cone(b * 0.17, b * 0.75, 6), water2, Math.cos(a) * b * 0.34, b * 2.65, Math.sin(a) * b * 0.34); f.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5); fins.push(f); }
  const arms = [];
  for (const s of [-1, 1]) {
    const p = new THREE.Group(); p.position.set(s * b * 0.8, b * 1.25, 0); body.add(p);
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(s * b * 0.4, -b * 0.3, b * 0.1), new THREE.Vector3(s * b * 0.7, -b * 0.9, b * 0.4), new THREE.Vector3(s * b * 0.5, -b * 1.3, b * 0.95)]);
    put(p, new THREE.TubeGeometry(curve, 12, b * 0.13, 8, false), water); put(p, sph(b * 0.19, 10, 8), water, s * b * 0.5, -b * 1.3, b * 0.95); arms.push({ p, s });
  }
  const drops = []; for (let i = 0; i < 8; i++) drops.push({ m: put(g, sph(b * 0.11, 8, 6), water2), a: i * 0.785, y: b * (0.7 + (i % 4) * 0.5), r: b * (1.35 + (i % 2) * 0.25) });
  const rip = []; for (let i = 0; i < 3; i++) { const m = new THREE.Mesh(new THREE.RingGeometry(0.88, 1, 40), basic(0x8fe8ff, { transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); m.rotation.x = -Math.PI / 2; m.position.y = 0.05; g.add(m); rip.push(m); }
  return {
    g, mats: K.mats,
    anim(tm, s) {
      const w = Math.sin(tm * 2.2), sq = 1 - 0.28 * s.wind, st = 1 + 0.3 * s.strike;
      body.scale.set((1 + 0.06 * w) * (1 + 0.25 * s.wind) * (1 - 0.1 * s.strike), (1 - 0.04 * w) * sq * st, (1 + 0.06 * w) * (1 + 0.25 * s.wind));
      body.position.y = s.move ? Math.abs(Math.sin(tm * 5)) * 0.18 : Math.sin(tm * 1.5) * 0.08;
      for (const a of arms) a.p.rotation.set(s.wind > 0 ? -1.9 * s.wind : Math.sin(tm * 2 + a.s) * 0.2 - 0.5 * s.strike, 0, a.s * (0.15 + 0.5 * s.wind - 0.3 * s.strike));
      core.opacity = 0.7 + 0.2 * Math.sin(tm * 3) + 0.3 * s.wind; coreM.scale.setScalar(1 + 0.2 * s.wind + 0.15 * Math.sin(tm * 6));
      fins.forEach((f, i) => { f.rotation.z += Math.sin(tm * 3 + i) * 0.002; });
      for (const d of drops) { const a = d.a + tm * (0.9 + 1.2 * s.wind); d.m.position.set(Math.cos(a) * d.r, d.y + Math.sin(tm * 2 + d.a) * 0.2, Math.sin(a) * d.r); }
      rip.forEach((m, i) => { const ph = (tm * 0.6 + i / 3) % 1; m.scale.setScalar(b * (0.9 + ph * 2.3 + 1.3 * s.strike)); m.material.opacity = 0.5 * (1 - ph); });
      water.emissiveIntensity = 0.5 + 0.9 * s.wind + 1.2 * s.strike;
    },
  };
}

/** Yêu Lửa: quỷ dung nham, bờm lửa nhảy múa, sừng cong, tàn lửa bay lên. */
export function buildInferno(t) {
  const b = t.body, g = new THREE.Group(), K = kit(), { std, glow, basic, put } = K;
  const char = std(0x2c1612, { emissive: 0xff4a10, emissiveIntensity: 0.8 }), dark = std(0x1d0f0c), eye = glow(0xffe36a, 2.2);
  const body = new THREE.Group(); g.add(body);
  put(body, new THREE.IcosahedronGeometry(b * 0.85, 1), char, 0, b * 1.35, 0, 1, 1.15, 1);
  const web = new THREE.Mesh(new THREE.IcosahedronGeometry(b * 0.9, 1), basic(0xffb020, { wireframe: true, transparent: true, opacity: 0.55 })); web.position.set(0, b * 1.35, 0); web.scale.set(1, 1.15, 1); body.add(web);
  const flames = []; for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2, f = put(body, cone(b * 0.3, b * 1.3, 7), basic(i % 2 ? 0xff6a10 : 0xffb020, { transparent: true, opacity: 0.92 }), Math.cos(a) * b * 0.78, b * 1.0, Math.sin(a) * b * 0.78); f.rotation.set(Math.sin(a) * 0.45, 0, -Math.cos(a) * 0.45); f.castShadow = false; flames.push({ f, ph: i * 0.9 }); }
  const head = new THREE.Group(); head.position.set(0, b * 2.5, b * 0.1); body.add(head);
  put(head, new THREE.IcosahedronGeometry(b * 0.5, 1), char, 0, 0, 0);
  for (const s of [-1, 1]) {
    const e = put(head, sph(b * 0.11, 8, 6), eye, s * b * 0.2, b * 0.04, b * 0.42, 1.5, 0.55, 0.8); e.rotation.z = s * 0.35;
    const h = put(head, cone(b * 0.13, b * 0.85, 6), dark, s * b * 0.34, b * 0.55, 0); h.rotation.z = -s * 0.65; put(head, cone(b * 0.07, b * 0.4, 6), dark, s * b * 0.78, b * 0.95, 0).rotation.z = -s * 1.0;
  }
  put(head, new THREE.BoxGeometry(b * 0.4, b * 0.08, b * 0.1), glow(0xff7a20, 1.8), 0, -b * 0.2, b * 0.46);
  const arms = [];
  for (const s of [-1, 1]) {
    const p = new THREE.Group(); p.position.set(s * b * 1.0, b * 1.9, 0); body.add(p);
    put(p, new THREE.IcosahedronGeometry(b * 0.3, 0), char, s * b * 0.1, -b * 0.4, 0, 1, 1.5, 1);
    for (let i = -1; i <= 1; i++) { const c = put(p, cone(b * 0.09, b * 0.5, 5), dark, s * b * 0.18 + i * b * 0.12, -b * 1.05, b * 0.12); c.rotation.x = Math.PI; }
    const fh = put(p, cone(b * 0.22, b * 0.8, 6), basic(0xffd23a, { transparent: true, opacity: 0.9 }), s * b * 0.15, -b * 1.15, 0); fh.rotation.x = Math.PI; fh.castShadow = false; arms.push({ p, s, fh });
  }
  const scorch = new THREE.Mesh(new THREE.CircleGeometry(b * 1.5, 28), basic(0x120806, { transparent: true, opacity: 0.4, depthWrite: false })); scorch.rotation.x = -Math.PI / 2; scorch.position.y = 0.04; g.add(scorch);
  const ring = new THREE.Mesh(new THREE.RingGeometry(b * 1.35, b * 1.5, 36), basic(0xff7a20, { transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.06; g.add(ring);
  const embers = []; for (let i = 0; i < 16; i++) { const m = new THREE.Mesh(sph(b * 0.06, 6, 5), basic(i % 2 ? 0xffb020 : 0xff6a10, { transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })); g.add(m); embers.push({ m, ph: i / 16, a: i * 2.4, r: b * (0.4 + (i % 5) * 0.22) }); }
  return {
    g, mats: K.mats,
    anim(tm, s) {
      const hot = 1 + 0.6 * s.wind + 1.2 * s.strike;
      body.position.y = s.move ? Math.abs(Math.sin(tm * 6)) * 0.14 : Math.sin(tm * 2) * 0.05; body.scale.set(1 + 0.08 * s.strike, 1 - 0.1 * s.strike - 0.06 * s.wind, 1 + 0.08 * s.strike);
      for (const o of flames) { const fl = 0.8 + 0.3 * Math.sin(tm * 9 + o.ph) + 0.15 * Math.sin(tm * 17 + o.ph * 2); o.f.scale.set(1, fl * hot, 1); }
      for (const a of arms) { a.p.rotation.x = s.wind > 0 ? -2.6 * s.wind : lerp(Math.sin(tm * 2 + a.s) * 0.1, 0.6, s.strike); a.fh.scale.y = (0.8 + 0.3 * Math.sin(tm * 11 + a.s)) * hot; }
      head.rotation.x = 0.2 * s.wind - 0.1 * s.strike; eye.emissiveIntensity = 1.8 + 2.2 * s.wind; char.emissiveIntensity = 0.7 + 0.25 * Math.sin(tm * 4) + 1.4 * s.wind + 2 * s.strike;
      web.material.opacity = 0.45 + 0.25 * Math.sin(tm * 5) + 0.3 * s.wind; web.rotation.y = tm * 0.3; ring.material.opacity = 0.45 + 0.2 * Math.sin(tm * 3) + 0.3 * s.wind; ring.scale.setScalar(1 + 0.4 * s.strike);
      for (const e of embers) { const u = (tm * (0.5 + 0.5 * s.wind) + e.ph) % 1; e.m.position.set(Math.cos(e.a + tm) * e.r * (1 - u * 0.3), u * b * 3.4, Math.sin(e.a + tm) * e.r * (1 - u * 0.3)); e.m.material.opacity = 0.9 * (1 - u); e.m.scale.setScalar(1 - u * 0.6); }
    },
  };
}
export const BUILDERS = { da: buildGolem, nuoc: buildWisp, lua: buildInferno };
