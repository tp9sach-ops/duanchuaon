// Phiên 232 (mục 1): HÌNH DÁNG + HOẠT ẢNH cho đủ 21 loại quái bãi rừng (trước chỉ 6 loại có hình riêng, 15 loại còn lại bị vẽ chung thành "Cướp Đường").
// Mỗi hàm dựng trả { g, anim(t, s) }. s = { a: gồng đòn 0..1, p: tiến độ vung đòn 0..1 (0 = chưa vung), mv: đang đi 0..1, sleep: ngủ }.
// Hình học và vật liệu DÙNG CHUNG qua bộ nhớ đệm (không rò bộ nhớ khi con quái đổi loại trong ô). Chỉ dựng khi gọi; khung chuyển động (chân tay, đuôi, xúc tu) là các nhóm xoay quanh khớp.
// Số đo TẠM, chờ nhìn bằng mắt trên máy thật. Test: tests/monstermodels.test.mjs (three giả tests/sim/three-mini.mjs).
import * as THREE from 'three';

const GC = new Map(), MC = new Map();
const geo = (k, f) => { let g = GC.get(k); if (!g) { g = f(); GC.set(k, g); } return g; };
const mat = (c, e = 0, o = {}) => { const k = `${c}|${e}|${JSON.stringify(o)}`; let m = MC.get(k); if (!m) { m = new THREE.MeshStandardMaterial({ color: c, emissive: e, emissiveIntensity: e ? 0.9 : 0, roughness: 0.7, metalness: 0.08, ...o }); MC.set(k, m); } return m; };
const sph = (r, w = 14, h = 10) => geo(`s${r}/${w}/${h}`, () => new THREE.SphereGeometry(r, w, h));
const cyl = (a, b, h, s = 10) => geo(`c${a}/${b}/${h}/${s}`, () => new THREE.CylinderGeometry(a, b, h, s));
const cone = (r, h, s = 8) => geo(`o${r}/${h}/${s}`, () => new THREE.ConeGeometry(r, h, s));
const box = (x, y, z) => geo(`b${x}/${y}/${z}`, () => new THREE.BoxGeometry(x, y, z));
const dode = (r) => geo(`d${r}`, () => new THREE.DodecahedronGeometry(r, 0));
const tor = (r, t) => geo(`t${r}/${t}`, () => new THREE.TorusGeometry(r, t, 8, 20));
const put = (p, g, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); p.add(o); return o; };
const grp = (p, x = 0, y = 0, z = 0) => { const o = new THREE.Group(); o.position.set(x, y, z); p.add(o); return o; };
/** Khớp xoay (vai/hông) với chi treo xuống: trả pivot; mesh nằm dưới pivot `len`. */
const limb = (p, x, y, z, len, r0, r1, m) => { const v = grp(p, x, y, z); put(v, cyl(r0, r1, len, 8), m, 0, -len / 2, 0); return v; };
const ease = (k) => 1 - (1 - Math.min(1, Math.max(0, k))) ** 2;
const clamp01 = (k) => Math.min(1, Math.max(0, k));

/** Góc cánh tay vung đòn: gồng giơ lên (a), rồi bổ xuống (p). */
function swing(s, up = 2.4, down = 0.5) { const a = clamp01(s.a), p = clamp01(s.p); if (p > 0) { const q = ease(p * 2.2), back = p > 0.55 ? ease((p - 0.55) / 0.45) : 0; return (-up + (up + down) * q) * (1 - back); } return -up * ease(a); }

/* ---------- người (đạo tặc, cướp, giáp kim, hỏa ly, viêm ma…) ---------- */
function humanoid(o) {
  const h = o.h || 1, g = new THREE.Group(), body = grp(g);
  const skin = mat(o.skin || 0xd7a97a), cloth = mat(o.cloth || 0x7d8696, o.clothGlow || 0, o.clothO || {}), trim = mat(o.trim || 0xd4af37, o.trimGlow || 0, { metalness: 0.5 }), blade = mat(o.blade || 0xe8eef6, o.bladeGlow || 0x5a6a80, { metalness: 0.7, roughness: 0.3 });
  const legL = limb(body, -0.2 * h, 0.7 * h, 0, 0.7 * h, 0.12 * h, 0.1 * h, cloth), legR = limb(body, 0.2 * h, 0.7 * h, 0, 0.7 * h, 0.12 * h, 0.1 * h, cloth);
  put(legL, box(0.26 * h, 0.12 * h, 0.4 * h), mat(0x2a2a30), 0, -0.7 * h, 0.06 * h); put(legR, box(0.26 * h, 0.12 * h, 0.4 * h), mat(0x2a2a30), 0, -0.7 * h, 0.06 * h);
  const torso = put(body, cyl(0.36 * h, 0.46 * h, 0.95 * h, 10), cloth, 0, 1.15 * h, 0);
  put(body, tor(0.4 * h, 0.05 * h), trim, 0, 0.72 * h, 0).rotation.x = Math.PI / 2;
  if (o.armor) { put(body, sph(0.3 * h, 10, 8), trim, -0.5 * h, 1.58 * h, 0); put(body, sph(0.3 * h, 10, 8), trim, 0.5 * h, 1.58 * h, 0); put(body, box(0.5 * h, 0.5 * h, 0.1 * h), trim, 0, 1.2 * h, 0.4 * h); }
  const head = grp(body, 0, 1.85 * h, 0); put(head, sph(0.27 * h, 14, 10), skin);
  const eye = mat(o.eye || 0x111111, o.eyeGlow || 0); put(head, sph(0.04 * h, 6, 5), eye, -0.1 * h, 0.03 * h, 0.23 * h); put(head, sph(0.04 * h, 6, 5), eye, 0.1 * h, 0.03 * h, 0.23 * h);
  if (o.hat === 'non') put(head, cone(0.62 * h, 0.36 * h, 12), mat(0xc9b36b), 0, 0.28 * h, 0);
  if (o.hat === 'mu') { put(head, cyl(0.3 * h, 0.32 * h, 0.22 * h, 12), trim, 0, 0.26 * h, 0); put(head, cone(0.05 * h, 0.4 * h, 6), mat(0xd23030), 0, 0.55 * h, 0); }
  if (o.hat === 'khan') put(head, tor(0.27 * h, 0.05 * h), mat(0xb02020), 0, 0.12 * h, 0).rotation.x = Math.PI / 2;
  if (o.horns) for (const sx of [-1, 1]) { const hn = put(head, cone(0.07 * h, 0.4 * h, 6), mat(o.horns, o.hornGlow || 0), sx * 0.17 * h, 0.3 * h, 0); hn.rotation.z = -sx * 0.35; }
  const armL = limb(body, -0.55 * h, 1.58 * h, 0, 0.8 * h, 0.1 * h, 0.08 * h, cloth), armR = limb(body, 0.55 * h, 1.58 * h, 0, 0.8 * h, 0.1 * h, 0.08 * h, cloth);
  put(armL, sph(0.1 * h, 8, 6), skin, 0, -0.82 * h, 0); put(armR, sph(0.1 * h, 8, 6), skin, 0, -0.82 * h, 0);
  const wp = grp(armR, 0, -0.8 * h, 0.06 * h);
  if (o.weapon === 'dao') { const b = put(wp, box(0.07 * h, 1.05 * h, 0.2 * h), blade, 0, 0.45 * h, 0.1 * h); b.rotation.x = -0.1; }
  else if (o.weapon === 'guom') { put(wp, box(0.09 * h, 1.5 * h, 0.26 * h), blade, 0, 0.7 * h, 0.12 * h); put(wp, box(0.42 * h, 0.08 * h, 0.1 * h), trim, 0, 0, 0.12 * h); }
  else if (o.weapon === 'giao') { put(wp, cyl(0.03 * h, 0.03 * h, 2.0 * h, 6), mat(0x6a4a2a), 0, 0.5 * h, 0.1 * h); put(wp, cone(0.1 * h, 0.4 * h, 6), blade, 0, 1.6 * h, 0.1 * h); }
  else if (o.weapon === 'lua') { put(wp, box(0.1 * h, 1.4 * h, 0.28 * h), mat(0x2a1208, 0xff5a10), 0, 0.65 * h, 0.12 * h); }
  let flames = [];
  if (o.flame) for (let i = 0; i < 6; i++) { const a = i * 1.05, f = put(head, cone(0.1 * h, 0.5 * h, 6), mat(0xff7a1a, 0xff4a00, { transparent: true, opacity: 0.85 }), Math.cos(a) * 0.2 * h, 0.35 * h, Math.sin(a) * 0.2 * h); flames.push(f); }
  if (o.cape) { const c = put(body, box(0.8 * h, 1.2 * h, 0.05 * h), mat(o.cape, 0, { side: THREE.DoubleSide }), 0, 1.15 * h, -0.42 * h); c.rotation.x = 0.12; }
  return {
    g, h: 2.2 * h,
    anim(t, s) {
      const w = Math.sin(t * 9) * 0.7 * s.mv, lean = s.sleep ? 0 : 0; legL.rotation.x = w; legR.rotation.x = -w;
      const sw = swing(s); armR.rotation.x = sw; armL.rotation.x = -w * 0.8 - 0.15 * clamp01(s.a) + (s.p > 0 ? -0.6 * (1 - clamp01(s.p)) : 0);
      body.rotation.x = -0.18 * clamp01(s.a) + (s.p > 0 ? 0.25 * Math.sin(Math.PI * clamp01(s.p)) : 0) + lean; body.position.y = s.sleep ? 0 : Math.abs(Math.sin(t * 9)) * 0.05 * s.mv;
      torso.scale.y = 1 + 0.02 * Math.sin(t * 2.2); head.rotation.y = Math.sin(t * 0.8) * 0.15 * (s.sleep ? 0 : 1);
      for (let i = 0; i < flames.length; i++) flames[i].scale.y = 0.8 + 0.4 * Math.abs(Math.sin(t * 7 + i * 1.7));
    },
  };
}

/* ---------- khối đá / kim loại (rêu tinh, thạch tinh, hộ tháp, nham cự…) ---------- */
function golem(o) {
  const h = o.h || 1, g = new THREE.Group(), body = grp(g);
  const stone = mat(o.stone || 0x6e7a68, 0, { roughness: 0.95 }), dark = mat(o.dark || 0x4a5248, 0, { roughness: 0.95 }), moss = mat(o.moss || 0x4f9a3c, o.mossGlow || 0x1c4a12), eye = mat(o.eye || 0xffe27a, o.eyeGlow || 0xffc400), rune = mat(o.rune || 0xffd24a, o.runeGlow || 0xffa400);
  const legL = limb(body, -0.45 * h, 0.9 * h, 0, 0.9 * h, 0.28 * h, 0.34 * h, dark), legR = limb(body, 0.45 * h, 0.9 * h, 0, 0.9 * h, 0.28 * h, 0.34 * h, dark);
  put(legL, dode(0.4 * h), stone, 0, -0.9 * h, 0.05); put(legR, dode(0.4 * h), stone, 0, -0.9 * h, 0.05);
  const torso = put(body, dode(1.0 * h), stone, 0, 1.55 * h, 0); torso.scale.set(1.15, 1, 0.9);
  put(body, dode(0.62 * h), moss, 0, 2.15 * h, -0.05).scale.set(1.2, 0.5, 1.1);
  put(body, box(0.5 * h, 0.08 * h, 0.05 * h), rune, 0, 1.5 * h, 0.9 * h * 0.9); put(body, box(0.08 * h, 0.5 * h, 0.05 * h), rune, 0, 1.5 * h, 0.9 * h * 0.9);
  const head = grp(body, 0, 2.45 * h, 0.25 * h); put(head, dode(0.42 * h), stone); put(head, sph(0.08 * h, 8, 6), eye, -0.15 * h, 0.04 * h, 0.36 * h); put(head, sph(0.08 * h, 8, 6), eye, 0.15 * h, 0.04 * h, 0.36 * h);
  if (o.crystals) for (let i = 0; i < o.crystals; i++) { const a = (i / o.crystals) * 6.28; const c = put(body, cone(0.14 * h, 0.7 * h, 5), mat(o.crystal || 0x7ad0ff, o.crystalGlow || 0x2a80c0, { transparent: true, opacity: 0.9 }), Math.cos(a) * 0.8 * h, 2.1 * h, Math.sin(a) * 0.8 * h - 0.2); c.rotation.z = Math.cos(a) * 0.4; c.rotation.x = -Math.sin(a) * 0.4; }
  if (o.crown) { for (let i = 0; i < 5; i++) { const a = i * 1.26; put(head, cone(0.08 * h, 0.4 * h, 5), mat(0xd4af37, 0x5a4300), Math.cos(a) * 0.3 * h, 0.45 * h, Math.sin(a) * 0.3 * h); } }
  const armL = limb(body, -1.25 * h, 2.0 * h, 0, 1.1 * h, 0.22 * h, 0.2 * h, dark), armR = limb(body, 1.25 * h, 2.0 * h, 0, 1.1 * h, 0.22 * h, 0.2 * h, dark);
  put(armL, dode(0.4 * h), stone, 0, -1.2 * h, 0); put(armR, dode(0.4 * h), stone, 0, -1.2 * h, 0);
  return {
    g, h: 3.1 * h,
    anim(t, s) {
      const w = Math.sin(t * 5) * 0.45 * s.mv, sw = swing(s, 2.6, 0.7);
      legL.rotation.x = w; legR.rotation.x = -w; armR.rotation.x = sw; armL.rotation.x = s.p > 0 || s.a > 0 ? sw * 0.9 : -w * 0.6;   // hai tay cùng đập khi gồng
      body.position.y = s.sleep ? 0 : Math.abs(Math.sin(t * 5)) * 0.06 * s.mv; body.rotation.x = -0.12 * clamp01(s.a) + (s.p > 0 ? 0.3 * Math.sin(Math.PI * clamp01(s.p)) : 0);
      torso.scale.y = 1 + 0.015 * Math.sin(t * 1.6); head.rotation.y = Math.sin(t * 0.6) * 0.2;
    },
  };
}

/* ---------- cây yêu (lão mộc, cổ mộc, thụ vương, thụ mẫu) ---------- */
function treant(o) {
  const h = o.h || 1, g = new THREE.Group(), body = grp(g);
  const bark = mat(o.bark || 0x5a3e24, 0, { roughness: 1 }), leaf = mat(o.leaf || 0x3f9a3a, o.leafGlow || 0x0e3a0e), eye = mat(o.eye || 0xc8ff6a, o.eyeGlow || 0x9be83a);
  for (let i = 0; i < 5; i++) { const a = i * 1.256; const r = put(body, cone(0.16 * h, 0.9 * h, 6), bark, Math.cos(a) * 0.5 * h, 0.3 * h, Math.sin(a) * 0.5 * h); r.rotation.z = Math.cos(a) * 0.9; r.rotation.x = -Math.sin(a) * 0.9; }
  const trunk = put(body, cyl(0.5 * h, 0.75 * h, 2.2 * h, 9), bark, 0, 1.4 * h, 0);
  put(body, sph(0.9 * h, 12, 9), leaf, 0, 2.9 * h, 0).scale.set(1.15, 0.8, 1.15); put(body, sph(0.55 * h, 10, 8), leaf, 0.6 * h, 3.2 * h, 0.2 * h); put(body, sph(0.5 * h, 10, 8), leaf, -0.6 * h, 3.15 * h, -0.2 * h);
  put(body, sph(0.09 * h, 8, 6), eye, -0.22 * h, 1.95 * h, 0.55 * h); put(body, sph(0.09 * h, 8, 6), eye, 0.22 * h, 1.95 * h, 0.55 * h);
  if (o.flowers) for (let i = 0; i < 6; i++) { const a = i * 1.05; put(body, sph(0.1 * h, 6, 5), mat(o.flowers, o.flowers), Math.cos(a) * 0.95 * h, 3.0 * h + (i % 2) * 0.2, Math.sin(a) * 0.95 * h); }
  const armL = limb(body, -0.8 * h, 2.2 * h, 0, 1.6 * h, 0.2 * h, 0.1 * h, bark), armR = limb(body, 0.8 * h, 2.2 * h, 0, 1.6 * h, 0.2 * h, 0.1 * h, bark);
  put(armL, sph(0.34 * h, 8, 6), leaf, 0, -1.7 * h, 0); put(armR, sph(0.34 * h, 8, 6), leaf, 0, -1.7 * h, 0);
  return {
    g, h: 4.0 * h,
    anim(t, s) {
      const sw = swing(s, 2.5, 0.6), idle = Math.sin(t * 1.4) * 0.12;
      armR.rotation.x = s.a > 0 || s.p > 0 ? sw : idle; armL.rotation.x = s.a > 0 || s.p > 0 ? sw : -idle; armL.rotation.z = 0.25 + (s.sleep ? 0 : Math.sin(t * 1.1) * 0.06); armR.rotation.z = -0.25 - (s.sleep ? 0 : Math.sin(t * 1.1 + 1) * 0.06);
      trunk.rotation.z = Math.sin(t * 0.9) * 0.03 * (1 + s.mv * 2); body.rotation.x = -0.1 * clamp01(s.a) + (s.p > 0 ? 0.25 * Math.sin(Math.PI * clamp01(s.p)) : 0);
    },
  };
}

/* ---------- mèo rừng (bốn chân, đuôi) ---------- */
function cat() {
  const g = new THREE.Group(), body = grp(g), fur = mat(0x8a7648), dark = mat(0x4a3f2a), eye = mat(0xc8ff6a, 0x9be83a), belly = mat(0xcdbd90);
  put(body, sph(0.42, 14, 10), fur, 0, 0.55, 0).scale.set(1, 0.85, 1.55); put(body, sph(0.3, 12, 9), belly, 0, 0.42, 0.1).scale.set(0.8, 0.55, 1.3);
  const head = grp(body, 0, 0.85, 0.65); put(head, sph(0.3, 12, 9), fur); put(head, cone(0.1, 0.26, 6), dark, -0.18, 0.28, 0); put(head, cone(0.1, 0.26, 6), dark, 0.18, 0.28, 0);
  put(head, sph(0.055, 6, 5), eye, -0.11, 0.04, 0.26); put(head, sph(0.055, 6, 5), eye, 0.11, 0.04, 0.26); put(head, cone(0.05, 0.1, 4), mat(0xd08080), 0, -0.04, 0.3).rotation.x = Math.PI / 2;
  const legs = [[-0.2, 0.42], [0.2, 0.42], [-0.2, -0.42], [0.2, -0.42]].map(([x, z]) => { const l = limb(body, x, 0.4, z, 0.4, 0.08, 0.06, dark); put(l, sph(0.085, 6, 5), fur, 0, -0.4, 0.03); return l; });
  const tail = grp(body, 0, 0.7, -0.75); put(tail, cyl(0.05, 0.08, 0.8, 6), dark, 0, 0.4, 0); tail.rotation.x = -0.6;
  const claw = mat(0xf2f0e0, 0x888880); for (const x of [-0.2, 0.2]) put(legs[x < 0 ? 0 : 1], cone(0.03, 0.12, 4), claw, 0, -0.45, 0.1).rotation.x = Math.PI / 2;
  return {
    g, h: 1.1,
    anim(t, s) {
      const w = Math.sin(t * 12) * 0.8 * s.mv; legs[0].rotation.x = w; legs[3].rotation.x = w; legs[1].rotation.x = -w; legs[2].rotation.x = -w;
      const a = clamp01(s.a), p = clamp01(s.p); body.position.y = -0.18 * a + (s.sleep ? 0 : Math.abs(Math.sin(t * 12)) * 0.06 * s.mv) + (p > 0 ? 0.3 * Math.sin(Math.PI * p) : 0);
      body.rotation.x = 0.25 * a - (p > 0 ? 0.35 * Math.sin(Math.PI * p) : 0); head.rotation.x = -0.2 * a;
      legs[0].rotation.x += -1.4 * (p > 0 ? Math.sin(Math.PI * p) : a * 0.5); legs[1].rotation.x += -1.4 * (p > 0 ? Math.sin(Math.PI * p) : a * 0.5);   // vuốt trước vồ ra
      tail.rotation.x = -0.6 - 0.5 * a + Math.sin(t * 3) * 0.2; tail.rotation.z = Math.sin(t * 2.4) * (0.35 + 0.3 * s.mv);
    },
  };
}

/* ---------- thủy quỷ (bóng nước), thủy mẫu (sứa mẹ), lý ngư (cá chép) ---------- */
function waterWisp(o) {
  const h = o.h || 1, g = new THREE.Group(), body = grp(g), water = mat(o.c || 0x3f8fd0, o.glow || 0x0c3a66, { transparent: true, opacity: 0.82 }), core = mat(0xe8faff, 0xbfefff), weed = mat(0x2f6a4a);
  put(body, cone(0.7 * h, 1.4 * h, 10), water, 0, 0.7 * h, 0); const head = put(body, sph(0.4 * h, 14, 10), water, 0, 1.55 * h, 0); put(body, sph(0.2 * h, 10, 8), core, 0, 1.0 * h, 0.1 * h);
  put(head, sph(0.06 * h, 6, 5), core, -0.14 * h, 0.05 * h, 0.34 * h); put(head, sph(0.06 * h, 6, 5), core, 0.14 * h, 0.05 * h, 0.34 * h);
  for (let i = 0; i < 5; i++) { const a = i * 1.26; put(body, cone(0.07 * h, 0.42 * h, 5), weed, Math.cos(a) * 0.32 * h, 1.95 * h, Math.sin(a) * 0.32 * h); }
  const armL = limb(body, -0.62 * h, 1.3 * h, 0, 0.95 * h, 0.1 * h, 0.06 * h, water), armR = limb(body, 0.62 * h, 1.3 * h, 0, 0.95 * h, 0.1 * h, 0.06 * h, water);
  return { g, h: 2.0 * h, anim(t, s) { body.position.y = (s.sleep ? 0 : 0.12 + Math.sin(t * 2.4) * 0.1); const sw = swing(s, 2.2, 0.5); armR.rotation.x = s.a > 0 || s.p > 0 ? sw : Math.sin(t * 2) * 0.4; armL.rotation.x = s.a > 0 || s.p > 0 ? sw * 0.8 : -Math.sin(t * 2) * 0.4; armL.rotation.z = 0.5; armR.rotation.z = -0.5; body.scale.y = 1 - 0.1 * clamp01(s.a) + 0.04 * Math.sin(t * 3); } };
}
function jelly() {
  const g = new THREE.Group(), body = grp(g), water = mat(0x4aa6e0, 0x1a5a9a, { transparent: true, opacity: 0.78 }), pearl = mat(0xfff6d8, 0xffe9a0), inner = mat(0x9ad8ff, 0x4aa0e0, { transparent: true, opacity: 0.6 });
  const bell = put(body, sph(1.3, 18, 12), water, 0, 2.2, 0); bell.scale.set(1, 0.72, 1); put(body, sph(0.85, 14, 10), inner, 0, 2.1, 0).scale.set(1, 0.7, 1); put(body, sph(0.3, 12, 8), pearl, 0, 2.2, 0.55);
  const tent = []; for (let i = 0; i < 8; i++) { const a = i * 0.785, v = grp(body, Math.cos(a) * 0.85, 1.9, Math.sin(a) * 0.85); put(v, cyl(0.1, 0.03, 1.8, 6), water, 0, -0.9, 0); tent.push(v); }
  put(body, sph(0.08, 6, 5), pearl, -0.4, 2.5, 1.0); put(body, sph(0.08, 6, 5), pearl, 0.4, 2.5, 1.0);
  return { g, h: 3.9, anim(t, s) { body.position.y = (s.sleep ? 0 : 0.4 + Math.sin(t * 1.6) * 0.2) - 0.1; const a = clamp01(s.a), p = clamp01(s.p); bell.scale.set(1 + 0.22 * a - (p > 0 ? 0.25 * Math.sin(Math.PI * p) : 0), 0.72 - 0.15 * a + (p > 0 ? 0.2 * Math.sin(Math.PI * p) : 0), 1 + 0.22 * a); tent.forEach((v, i) => { v.rotation.x = Math.sin(t * 2.2 + i) * 0.35 + (p > 0 ? 0.9 * Math.sin(Math.PI * p) : -0.5 * a); v.rotation.z = Math.cos(t * 2 + i * 1.3) * 0.3; }); } };
}
function carp() {
  const g = new THREE.Group(), body = grp(g), scale = mat(0xe8742a, 0x6a2200), fin = mat(0x3fa0d8, 0x0c4a6a, { side: THREE.DoubleSide }), eye = mat(0xfff3b0, 0xffd400), whisk = mat(0xf6d27a), belly = mat(0xf6e0b0);
  const torso = put(body, sph(0.85, 16, 12), scale, 0, 1.35, 0); torso.scale.set(0.85, 1.5, 0.85); put(body, sph(0.6, 12, 9), belly, 0, 1.2, 0.35).scale.set(0.8, 1.2, 0.7);
  const head = grp(body, 0, 2.5, 0.12); put(head, sph(0.5, 14, 10), scale); put(head, sph(0.09, 6, 5), eye, -0.27, 0.1, 0.43); put(head, sph(0.09, 6, 5), eye, 0.27, 0.1, 0.43);
  const w = [-1, 1].map((sx) => { const v = grp(head, sx * 0.2, -0.05, 0.5); put(v, cyl(0.02, 0.01, 1.0, 4), whisk, 0, -0.5, 0); return v; });
  const tail = grp(body, 0, 0.5, -0.5); put(tail, cone(0.55, 1.0, 6), fin, 0, -0.35, 0).rotation.x = Math.PI; const dors = put(body, cone(0.3, 1.0, 5), fin, 0, 1.7, -0.75); dors.rotation.x = -0.6;
  const fl = [-1, 1].map((sx) => { const v = grp(body, sx * 0.8, 1.4, 0); put(v, cone(0.22, 0.7, 5), fin, sx * 0.25, -0.2, 0).rotation.z = sx * -1.3; return v; });
  return { g, h: 3.2, anim(t, s) { body.position.y = s.sleep ? 0 : 0.18 + Math.sin(t * 2.6) * 0.1; tail.rotation.y = Math.sin(t * 5 + s.mv) * 0.4; tail.rotation.x = 0; const a = clamp01(s.a), p = clamp01(s.p); body.rotation.x = -0.22 * a + (p > 0 ? 0.5 * Math.sin(Math.PI * p) : 0); fl.forEach((v, i) => { v.rotation.z = (i ? 1 : -1) * (0.2 + 1.0 * a + Math.sin(t * 4) * 0.15); }); w.forEach((v, i) => { v.rotation.z = (i ? -1 : 1) * (0.9 + Math.sin(t * 2 + i) * 0.2); }); } };
}

/** type → bộ dựng. Mọi loại trong js/data/monsters.js đều có (test kiểm tra). */
export const BUILDERS = {
  dameo: () => cat(),
  reutinh: () => golem({ h: 1, crystals: 0 }),
  daotac: () => humanoid({ cloth: 0x7d8696, hat: 'non', weapon: 'dao' }),
  cuopduong: () => humanoid({ h: 1.3, cloth: 0x555a66, armor: true, hat: 'mu', weapon: 'guom', cape: 0x6a1a1a }),
  thuyquy: () => waterWisp({ h: 1 }),
  lyngu: () => carp(),
  thachtinh: () => golem({ h: 1.2, stone: 0x8a8a84, dark: 0x5a5a56, moss: 0x7a7a70, mossGlow: 0, eye: 0xffb060, eyeGlow: 0xff7a20, crystals: 5, crystal: 0xd8c8a0, crystalGlow: 0x706040 }),
  hothap: () => golem({ h: 1.45, stone: 0xb0a488, dark: 0x6a604a, moss: 0xc4a34a, mossGlow: 0x4a3a00, eye: 0xfff0a0, eyeGlow: 0xffd400, rune: 0xffe27a, runeGlow: 0xffc400, crown: true }),
  laomoc: () => treant({ h: 1.5, bark: 0x4a3220, leaf: 0x2f8a30, flowers: 0xff9ac8 }),
  soncuoc: () => humanoid({ h: 1.55, cloth: 0x4a5058, armor: true, hat: 'khan', weapon: 'guom', cape: 0x8a2a1a, trim: 0xc8a030 }),
  thachlinh: () => golem({ h: 1.9, stone: 0xa09a8c, dark: 0x5c574c, moss: 0xd8b840, mossGlow: 0x6a5000, eye: 0xffffff, eyeGlow: 0xfff0a0, rune: 0x7ad0ff, runeGlow: 0x30a0ff, crystals: 7, crystal: 0xffe27a, crystalGlow: 0xc89a00, crown: true }),
  thuymau: () => jelly(),
  hoaly: () => humanoid({ h: 0.8, skin: 0xc0301a, cloth: 0x7a2210, clothGlow: 0x3a0a00, eye: 0xffe040, eyeGlow: 0xffc000, horns: 0x2a0a00, hornGlow: 0x401000, flame: true, weapon: 'lua', trim: 0xff7a1a, trimGlow: 0xaa3000 }),
  viemma: () => humanoid({ h: 1.3, skin: 0xb02816, cloth: 0x4a1a10, clothGlow: 0x300800, armor: true, trim: 0xff6a10, trimGlow: 0xaa3000, horns: 0x1a0800, hornGlow: 0x401000, flame: true, weapon: 'lua', eye: 0xffe040, eyeGlow: 0xffc000, cape: 0x6a1000 }),
  viemde: () => humanoid({ h: 1.75, skin: 0x8a1a10, cloth: 0x2a0a08, clothGlow: 0x500e00, armor: true, trim: 0xffa020, trimGlow: 0xc05000, horns: 0x1a0800, hornGlow: 0x602000, flame: true, weapon: 'lua', eye: 0xffffff, eyeGlow: 0xffe060, cape: 0x8a1a00 }),
  cotmoc: () => treant({ h: 1.0, bark: 0x3e2c1c, leaf: 0x4a8a2a, leafGlow: 0x103a0a, eye: 0xffe27a, eyeGlow: 0xffc400 }),
  thuvuong: () => treant({ h: 1.4, bark: 0x4a3626, leaf: 0x3aa04a, leafGlow: 0x0a4a1a, flowers: 0xffd24a, eye: 0xff8a8a, eyeGlow: 0xff4040 }),
  thumau: () => treant({ h: 1.9, bark: 0x5a3a26, leaf: 0x58b04a, leafGlow: 0x145a1a, flowers: 0xff7ab0, eye: 0xffffff, eyeGlow: 0xc8ff6a }),
  kimgiap: () => humanoid({ h: 1.1, cloth: 0x8a8f9a, armor: true, trim: 0xd4af37, hat: 'mu', weapon: 'guom', blade: 0xf0f4fa }),
  kimtuong: () => humanoid({ h: 1.45, cloth: 0xb09a40, armor: true, trim: 0xf0d060, trimGlow: 0x5a4300, hat: 'mu', weapon: 'giao', cape: 0x2a4a8a }),
  kimvuong: () => humanoid({ h: 1.85, cloth: 0xd0b040, clothGlow: 0x3a2a00, armor: true, trim: 0xffe27a, trimGlow: 0x7a5a00, hat: 'mu', weapon: 'guom', blade: 0xfff4c0, bladeGlow: 0xc89a00, cape: 0x8a1a2a }),
  nhamcu: () => golem({ h: 1.6, stone: 0x6a5a4a, dark: 0x3e342a, moss: 0xc8501a, mossGlow: 0x7a2200, eye: 0xff9a40, eyeGlow: 0xff5a10, rune: 0xff7a20, runeGlow: 0xff4a00 }),
  nhamvuong: () => golem({ h: 1.9, stone: 0x5a4a3c, dark: 0x30281e, moss: 0xe05a1a, mossGlow: 0x9a2a00, eye: 0xffd060, eyeGlow: 0xff8a20, rune: 0xffa030, runeGlow: 0xff6a00, crystals: 6, crystal: 0xff8a30, crystalGlow: 0xc03a00, crown: true }),
  solinh: () => golem({ h: 2.3, stone: 0x8a9a7a, dark: 0x4a5a42, moss: 0x7ad06a, mossGlow: 0x2a7a2a, eye: 0xffffff, eyeGlow: 0xc8ffa0, rune: 0xa8ffc0, runeGlow: 0x30d070, crystals: 8, crystal: 0x9ae8ff, crystalGlow: 0x3090c0, crown: true }),
};

/** Dựng một con quái loại `type`; loại lạ → hình Cướp Đường (như trước). Trả { g, h, anim }. */
export function buildMonster(type) { return (BUILDERS[type] || BUILDERS.cuopduong)(); }
export const TYPES = Object.keys(BUILDERS);
