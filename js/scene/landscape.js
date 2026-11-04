// Cảnh quan mở rộng (Phiên 14f, Bước 2): nền cỏ + sân lát chỉ trong PLAZA, dải đường đá, sân sỏi vườn thiền, trà thất, hồ cá + lương đình,
// Quan Âm đài, 3 tháp, thảm hoa, tường rào. Dựng từ dữ liệu của js/world/landscape.js (cùng nguồn với va chạm).
// Trả { group, update(t) }. Gọi sau makeMaterials() (dùng vật liệu chung M). Cho đổ bóng bằng shade() ở js/scene/index.js.
import * as THREE from 'three';
import { M, box, roofWithRidge } from './temple.js';
import { pavingTexture, dayPathTexture } from './textures.js';
import { mulberry32 } from '../util.js';
import { BOUNDS, POND, GATE } from '../world/layout.js';
import { PLAZA, STONE_PATHS, ZEN, ZEN_ROCKS, TEAHOUSE, KOI, GUANYIN, PAGODAS, FLOWER_FIELDS, FENCE } from '../world/landscape.js';

const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, ...o });
function canvasTex(w, h, draw, repeat = null) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
  if (repeat) t.repeat.set(repeat[0], repeat[1]); return t;
}

// ---- Bãi cỏ: một tấm phẳng có LỖ khoét ở sân lát (PLAZA) và ao sen, để không che mặt nước và nền gạch; nằm trên sân gạch cũ (y=0) một chút
function grassTexture() {
  return canvasTex(256, 256, (g, w, h) => {
    const r = mulberry32(11); g.fillStyle = '#6fae48'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) { const l = 38 + r() * 20; g.fillStyle = `hsla(${88 + r() * 24},${42 + r() * 18}%,${l}%,.55)`; g.fillRect(r() * w, r() * h, 1.5 + r() * 2, 3 + r() * 5); }
  });
}
function buildGrass() {
  const x0 = -BOUNDS.xMax - 6, x1 = BOUNDS.xMax + 6, z0 = BOUNDS.zMin - 6, z1 = GATE.z - 1.8;
  const s = new THREE.Shape(); s.moveTo(x0, -z0); s.lineTo(x1, -z0); s.lineTo(x1, -z1); s.lineTo(x0, -z1); s.closePath();   // (x, -z): sau rotateX(-π/2) thành (x, z)
  const plaza = new THREE.Path(); plaza.moveTo(PLAZA.x0, -PLAZA.z0); plaza.lineTo(PLAZA.x0, -PLAZA.z1); plaza.lineTo(PLAZA.x1, -PLAZA.z1); plaza.lineTo(PLAZA.x1, -PLAZA.z0); plaza.closePath();
  const pond = new THREE.Path(); pond.absarc(POND.x, -POND.z, POND.r + 0.25, 0, Math.PI * 2, true);
  s.holes.push(plaza, pond);
  const geo = new THREE.ShapeGeometry(s, 24); geo.rotateX(-Math.PI / 2);
  const uv = geo.attributes.uv, pos = geo.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / 7, pos.getZ(i) / 7);   // mỗi ô cỏ 7 m
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: grassTexture(), roughness: 1, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
  m.position.y = 0.012; m.receiveShadow = true; return m;
}

// ---- Sân lát chỉ trong PLAZA + dải đường đá
function buildPlaza(g) {
  const w = PLAZA.x1 - PLAZA.x0, d = PLAZA.z1 - PLAZA.z0, t = pavingTexture().clone(); t.needsUpdate = true; t.repeat.set(w / 5.9, d / 5.9);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: t, roughness: 0.8 }));
  m.rotation.x = -Math.PI / 2; m.position.set((PLAZA.x0 + PLAZA.x1) / 2, 0.02, (PLAZA.z0 + PLAZA.z1) / 2); m.receiveShadow = true; g.add(m);
  // viền đá quanh sân
  const edge = std(0x8a8f96, { roughness: 0.9 });
  box(w + 0.8, 0.12, 0.4, edge, 0, 0.06, PLAZA.z0 - 0.2, g).position.x = (PLAZA.x0 + PLAZA.x1) / 2;
  for (const sx of [PLAZA.x0 - 0.2, PLAZA.x1 + 0.2]) box(0.4, 0.12, d, edge, sx, 0.06, (PLAZA.z0 + PLAZA.z1) / 2, g);
}
function buildPaths(g) {
  const base = dayPathTexture();
  for (const p of STONE_PATHS) for (let i = 1; i < p.pts.length; i++) {
    const [ax, az] = p.pts[i - 1], [bx, bz] = p.pts[i], L = Math.hypot(bx - ax, bz - az);
    const t = base.clone(); t.needsUpdate = true; t.repeat.set(Math.max(1, Math.round(p.w / 2.4)), Math.max(1, L / 2.4));
    const m = new THREE.Mesh(new THREE.PlaneGeometry(p.w, L), new THREE.MeshStandardMaterial({ map: t, roughness: 0.7, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    m.rotation.x = -Math.PI / 2; const holder = new THREE.Group(); holder.add(m);
    holder.position.set((ax + bx) / 2, 0.034, (az + bz) / 2); holder.rotation.y = Math.atan2(bx - ax, bz - az); m.receiveShadow = true; g.add(holder);
    // mối nối góc: một miếng tròn để hai đoạn liền nhau không hở
    if (i > 1) { const c = new THREE.Mesh(new THREE.CircleGeometry(p.w / 2, 16), new THREE.MeshStandardMaterial({ color: 0xb9b1a2, roughness: 0.8 })); c.rotation.x = -Math.PI / 2; c.position.set(ax, 0.036, az); c.receiveShadow = true; g.add(c); }
  }
}

// ---- Sân sỏi vườn thiền: cát gạt thành sóng + vòng tròn quanh mỗi hòn đá, viền gỗ, đá lớn
function zenTexture() {
  const W = ZEN.x1 - ZEN.x0, D = ZEN.z1 - ZEN.z0, K = 40;   // 40 px mỗi mét
  return canvasTex(Math.round(W * K), Math.round(D * K), (g, w, h) => {
    const r = mulberry32(5); g.fillStyle = '#dcd3bd'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 6000; i++) { g.fillStyle = `rgba(${150 + r() * 80},${140 + r() * 70},${110 + r() * 60},.22)`; g.fillRect(r() * w, r() * h, 2, 2); }
    g.strokeStyle = 'rgba(120,108,86,.45)'; g.lineWidth = 1.6;
    for (let y = 8; y < h; y += 14) { g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= w; x += 20) g.lineTo(x, y + Math.sin(x * 0.03 + y) * 1.2); g.stroke(); }
    for (const rk of ZEN_ROCKS) for (let k = 1; k <= 5; k++) {   // vòng sóng quanh đá (xóa nền thẳng bên dưới bằng viền sáng)
      const cx = (rk.x - ZEN.x0) * K, cy = (rk.z - ZEN.z0) * K, R = (rk.r + 0.35 * k) * K;
      g.strokeStyle = 'rgba(235,228,208,.9)'; g.lineWidth = 7; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.stroke();
      g.strokeStyle = 'rgba(112,100,80,.6)'; g.lineWidth = 1.6; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.stroke();
    }
  });
}
function buildZen(g) {
  const W = ZEN.x1 - ZEN.x0, D = ZEN.z1 - ZEN.z0, cx = (ZEN.x0 + ZEN.x1) / 2, cz = (ZEN.z0 + ZEN.z1) / 2;
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ map: zenTexture(), roughness: 1, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  sand.rotation.x = -Math.PI / 2; sand.position.set(cx, 0.04, cz); sand.receiveShadow = true; g.add(sand);
  const wood = std(0x6a4a2e);
  box(W + 0.5, 0.16, 0.25, wood, cx, 0.08, ZEN.z0 - 0.12, g); box(W + 0.5, 0.16, 0.25, wood, cx, 0.08, ZEN.z1 + 0.12, g);
  box(0.25, 0.16, D, wood, ZEN.x0 - 0.12, 0.08, cz, g); box(0.25, 0.16, D, wood, ZEN.x1 + 0.12, 0.08, cz, g);
  const rockM = std(0x6f7377, { roughness: 0.95, flatShading: true });
  ZEN_ROCKS.forEach((r, i) => { const m = new THREE.Mesh(new THREE.DodecahedronGeometry(r.r * 1.05, 0), rockM); m.scale.set(1.1, 0.8 * r.s, 0.9); m.rotation.y = i * 1.3; m.position.set(r.x, 0.5 * r.s, r.z); m.castShadow = true; g.add(m); });
  // một cây tùng nhỏ cuối vườn thiền
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.2, 1.6, 7), std(0x5a3d26)); trunk.position.set(ZEN.x0 + 1.6, 0.8, ZEN.z0 + 1.6); g.add(trunk);
  for (let k = 0; k < 3; k++) { const c = new THREE.Mesh(new THREE.SphereGeometry(0.9 - k * 0.2, 9, 7), std(0x2f6a3a)); c.scale.y = 0.55; c.position.set(ZEN.x0 + 1.6 + (k - 1) * 0.5, 1.7 + k * 0.45, ZEN.z0 + 1.6); g.add(c); }
}

// ---- Trà thất: nền gỗ nâng cao, bốn cột, tường lưới có cửa trượt, mái ngói cong, bàn trà trong nhà, lồng đèn
function buildTeaHouse(g) {
  const t = TEAHOUSE, grp = new THREE.Group(); grp.position.set(t.cx, 0, t.cz);
  box(t.w, 0.5, t.d, M.stone, 0, 0.25, 0, grp);
  box(t.w - 0.4, 0.14, t.d - 0.4, std(0x7a5532), 0, 0.57, 0, grp);                       // sàn gỗ
  const H = 3.4, y0 = 0.64;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, H, 10), M.lacquer); p.position.set(sx * (t.w / 2 - 0.4), y0 + H / 2, sz * (t.d / 2 - 0.4)); grp.add(p); }
  box(t.w - 0.2, 0.3, 0.3, M.lacquer, 0, y0 + H, t.d / 2 - 0.4, grp); box(t.w - 0.2, 0.3, 0.3, M.lacquer, 0, y0 + H, -t.d / 2 + 0.4, grp);
  box(t.w - 0.4, H - 0.6, 0.18, M.wall, 0, y0 + (H - 0.6) / 2 + 0.2, -t.d / 2 + 0.5, grp);   // tường sau
  for (const sx of [-1, 1]) box(0.18, H - 0.6, t.d - 1, M.wall, sx * (t.w / 2 - 0.5), y0 + (H - 0.6) / 2 + 0.2, 0, grp);   // tường hai bên
  const paper = new THREE.MeshStandardMaterial({ color: 0xf3e9cf, roughness: 0.9, emissive: 0xffd68a, emissiveIntensity: 0.15 });
  for (let i = 0; i < 3; i++) { box(1.1, 2.2, 0.06, paper, -1.5 + i * 1.5, y0 + 1.4, t.d / 2 - 0.6, grp); box(1.12, 0.06, 0.08, std(0x5a3a22), -1.5 + i * 1.5, y0 + 2.52, t.d / 2 - 0.6, grp); }   // cửa trượt giấy
  const roof = roofWithRidge(t.w + 2.6, t.d + 2.6, 2.4, 1.3); roof.position.set(0, y0 + H + 0.15, 0); grp.add(roof);
  box(1.6, 0.34, 1.0, std(0x4a2f1c), 0, 0.82, -0.6, grp);                                 // bàn trà thấp
  const pot = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), M.bronze); pot.position.set(-0.3, 1.12, -0.6); grp.add(pot);
  for (const sx of [-0.9, 0.9]) { const cu = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.06, 12), std(0xc8322b)); cu.position.set(sx, 0.67, 0.5); grp.add(cu); }   // đệm ngồi
  for (let k = 0; k < 3; k++) box(1.0, 0.16, 0.5, M.stone, 0, 0.08 + k * 0.0, t.d / 2 + 0.3 + k * 0.5, grp).scale.set(1, 0.5 + (2 - k) * 0.5, 1);   // bậc thềm
  g.add(grp);
}

// ---- Hồ cá: mặt nước, viền đá, lá sen, cá koi bơi vòng; cầu đá ra lương đình giữa hồ
const KOI_N = 9;
function buildKoi(g) {
  const out = { fish: [], water: null };
  const grp = new THREE.Group(); grp.position.set(KOI.x, 0, KOI.z);
  const water = new THREE.Mesh(new THREE.CircleGeometry(KOI.r, 48), new THREE.MeshStandardMaterial({ color: 0x2f7f78, roughness: 0.08, metalness: 0.2, transparent: true, opacity: 0.88 }));
  water.rotation.x = -Math.PI / 2; water.position.y = 0.06; water.receiveShadow = true; grp.add(water); out.water = water;
  const bed = new THREE.Mesh(new THREE.CircleGeometry(KOI.r, 32), std(0x1d4a4a)); bed.rotation.x = -Math.PI / 2; bed.position.y = 0.03; grp.add(bed);
  const rim = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.5, 0), std(0x80858b, { flatShading: true }), 44), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), r = mulberry32(21);
  for (let i = 0; i < 44; i++) { const a = (i / 44) * Math.PI * 2, s = 0.8 + r() * 0.7; rim.setMatrixAt(i, m4.compose(new THREE.Vector3(Math.cos(a) * (KOI.r + 0.15), 0.2, Math.sin(a) * (KOI.r + 0.15)), q.setFromEuler(new THREE.Euler(r(), r() * 6, r())), new THREE.Vector3(s, 0.6, s))); }
  rim.castShadow = true; grp.add(rim);
  const padM = std(0x3f8f4a, { side: THREE.DoubleSide });
  for (let i = 0; i < 14; i++) { const a = r() * 6.28, d = 1.8 + r() * (KOI.r - 3), pad = new THREE.Mesh(new THREE.CircleGeometry(0.45 + r() * 0.3, 14, 0.4, 5.6), padM); pad.rotation.x = -Math.PI / 2; pad.position.set(Math.cos(a) * d, 0.075, Math.sin(a) * d); grp.add(pad); }
  const koiM = [std(0xf08a24, { roughness: 0.5 }), std(0xf4efe4, { roughness: 0.5 }), std(0xd8372c, { roughness: 0.5 })];
  for (let i = 0; i < KOI_N; i++) {
    const f = new THREE.Group(), body = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), koiM[i % 3]); body.scale.set(0.8, 0.45, 2.1); f.add(body);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.4, 4), koiM[(i + 1) % 3]); tail.rotation.x = -Math.PI / 2; tail.position.z = -0.52; f.add(tail);
    f.userData = { R: 2.2 + (i % 4) * 1.15, w: (0.25 + (i % 3) * 0.07) * (i % 2 ? 1 : -1), ph: i * 1.7 }; f.position.y = 0.1; grp.add(f); out.fish.push(f);
  }
  g.add(grp); out.group = grp;
  // cầu đá: lát đá + lan can; mặt cầu cao KOI.y (khớp bridges trong landscape.js)
  const slab = std(0xa7a79c, { roughness: 0.8 }), b = KOI.bridges[0], bw = b.x1 - b.x0;
  box(bw, 0.18, b.z1 - b.z0, slab, (b.x0 + b.x1) / 2, KOI.y - 0.09, (b.z0 + b.z1) / 2, g);
  for (const sz of [b.z0 + 0.06, b.z1 - 0.06]) { box(bw, 0.5, 0.1, M.lacquer, (b.x0 + b.x1) / 2, KOI.y + 0.25, sz, g); for (let k = 0; k <= 6; k++) box(0.12, 0.62, 0.12, M.lacquer, b.x0 + 0.3 + k * (bw - 0.6) / 6, KOI.y + 0.31, sz, g); }
  for (const x of [b.x0 + 1.2, (b.x0 + b.x1) / 2, b.x1 - 1.2]) box(0.5, KOI.y, 1.2, M.stone, x, KOI.y / 2 - 0.12, (b.z0 + b.z1) / 2, g);   // trụ cầu
  // lương đình: sàn gỗ, bốn cột son, mái cong, ghế ngồi quanh
  const p = KOI.pavilion, pg = new THREE.Group(); pg.position.set(p.cx, KOI.y, p.cz);
  box(p.w, 0.2, p.d, std(0x7a5532), 0, -0.1, 0, pg);
  const Hp = 3.0;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, Hp, 10), M.lacquer); c.position.set(sx * (p.w / 2 - 0.3), Hp / 2, sz * (p.d / 2 - 0.3)); pg.add(c); }
  for (const sz of [-1, 1]) box(p.w, 0.26, 0.26, M.lacquer, 0, Hp, sz * (p.d / 2 - 0.3), pg);
  for (const sx of [-1, 1]) box(0.26, 0.26, p.d, M.lacquer, sx * (p.w / 2 - 0.3), Hp, 0, pg);
  const rf = roofWithRidge(p.w + 2.4, p.d + 2.4, 2.2, 1.2); rf.position.y = Hp + 0.15; pg.add(rf);
  for (const sx of [-1, 1]) box(0.5, 0.45, p.d - 1.2, std(0x5a3a22), sx * (p.w / 2 - 0.65), 0.22, 0, pg);
  g.add(pg);
  return out;
}

// ---- Quan Âm đài: bệ tròn ba tầng, đài sen, tượng Quan Âm đứng tay cầm bình, hào quang
function buildGuanyin(g) {
  const grp = new THREE.Group(); grp.position.set(GUANYIN.x, 0, GUANYIN.z);
  const st = M.stone;
  [[GUANYIN.base, 0.3], [GUANYIN.base - 0.9, 0.3], [GUANYIN.base - 1.9, 0.3]].forEach(([r, h], i) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r + 0.12, h, 40), st); m.position.y = h / 2 + i * h; m.receiveShadow = true; grp.add(m); });
  const y0 = 0.9, white = std(0xf0ebe0, { roughness: 0.55 });
  const lotus = new THREE.Group(); lotus.position.y = y0;
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, p = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6), std(0xf6c5d4, { roughness: 0.6 })); p.scale.set(0.45, 0.2, 1); p.position.set(Math.cos(a) * 1.5, 0.3, Math.sin(a) * 1.5); p.rotation.y = -a; p.rotation.z = 0.35; lotus.add(p); }
  grp.add(lotus);
  const prof = [[0.001, 0], [1.05, 0.05], [0.85, 1.2], [0.62, 3.3], [0.5, 4.5], [0.36, 5.6], [0.001, 5.7]].map(([r, h]) => new THREE.Vector2(r, h));
  const robe = new THREE.Mesh(new THREE.LatheGeometry(prof, 28), white); robe.position.y = y0 + 0.5; robe.castShadow = true; grp.add(robe);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 16), white); head.scale.set(0.95, 1.12, 0.95); head.position.y = y0 + 0.5 + 6.05; head.castShadow = true; grp.add(head);
  const bun = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), white); bun.position.y = head.position.y + 0.58; grp.add(bun);
  const halo = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.05, 8, 40), M.gold); halo.position.set(0, head.position.y, -0.35); grp.add(halo);
  const vase = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.18, 0.5, 10), white); vase.position.set(0.55, y0 + 0.5 + 4.2, 0.45); grp.add(vase);   // bình nước cam lồ
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 1.5, 8), white); arm.position.set(0.42, y0 + 0.5 + 4.7, 0.25); arm.rotation.z = -0.35; grp.add(arm);
  g.add(grp);
}

// ---- Ba tháp: đế vuông, 7 tầng thu dần, mái chóp bốn mái, đỉnh vàng
function buildPagodas(g) {
  const tileM = M.tile, wallM = M.wall;
  for (const p of PAGODAS) {
    const grp = new THREE.Group(); grp.position.set(p.x, 0, p.z);
    box(5.6, 0.5, 5.6, M.stone, 0, 0.25, 0, grp); box(4.6, 0.4, 4.6, M.stone, 0, 0.7, 0, grp);
    let y = 0.9, w = 3.0;
    for (let i = 0; i < 7; i++) {
      const h = 1.5 - i * 0.07; box(w, h, w, wallM, 0, y + h / 2, 0, grp);
      const door = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.28, h * 0.6), new THREE.MeshBasicMaterial({ color: 0xffb25e })); door.position.set(0, y + h * 0.45, w / 2 + 0.01); grp.add(door);
      const roof = new THREE.Mesh(new THREE.ConeGeometry((w + 1.2) * 0.72, 0.62, 4), tileM); roof.rotation.y = Math.PI / 4; roof.position.y = y + h + 0.3; roof.castShadow = true; grp.add(roof);
      y += h + 0.5; w *= 0.9;
    }
    const spire = new THREE.Mesh(new THREE.ConeGeometry(0.2, 1.8, 8), M.gold); spire.position.y = y + 0.9; grp.add(spire);
    g.add(grp);
  }
}

// ---- Thảm hoa: InstancedMesh (một lệnh vẽ cho cả thảm), điểm rải tất định
function buildFlowerFields(g) {
  FLOWER_FIELDS.forEach((f, fi) => {
    const r = mulberry32(300 + fi), n = Math.round((f.x1 - f.x0) * (f.z1 - f.z0) * 6);
    const green = new THREE.Mesh(new THREE.PlaneGeometry(f.x1 - f.x0, f.z1 - f.z0), std(0x4f9a3f)); green.rotation.x = -Math.PI / 2; green.position.set((f.x0 + f.x1) / 2, 0.025, (f.z0 + f.z1) / 2); green.receiveShadow = true; g.add(green);
    const bloom = new THREE.InstancedMesh(new THREE.SphereGeometry(0.11, 7, 5), std(f.hoa, { roughness: 0.6, emissive: f.hoa, emissiveIntensity: 0.15 }), n), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3();
    for (let i = 0; i < n; i++) { const h = 0.18 + r() * 0.22; bloom.setMatrixAt(i, m4.compose(new THREE.Vector3(f.x0 + r() * (f.x1 - f.x0), h, f.z0 + r() * (f.z1 - f.z0)), q, s.set(1, 0.8, 1))); }
    g.add(bloom);
  });
}

// ---- Tường rào: tường vữa thấp có nắp ngói + trụ mỗi 6 m (chừa lối ở Tam quan: đoạn trước chỉ chạy ngoài |x| > 16,5)
function buildFence(g) {
  const cap = std(0x4a3a30, { roughness: 0.8 }), post = new THREE.InstancedMesh(new THREE.BoxGeometry(0.7, FENCE.h + 0.5, 0.7), M.wall, 140), m4 = new THREE.Matrix4(); let np = 0;
  for (const [ax, az, bx, bz] of FENCE.segs) {
    const L = Math.hypot(bx - ax, bz - az), ang = Math.atan2(bx - ax, bz - az), cx = (ax + bx) / 2, cz = (az + bz) / 2;
    const wall = new THREE.Mesh(new THREE.BoxGeometry(0.45, FENCE.h, L), M.wall); wall.position.set(cx, FENCE.h / 2, cz); wall.rotation.y = ang; wall.castShadow = wall.receiveShadow = true; g.add(wall);
    const top = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.22, L + 0.2), cap); top.position.set(cx, FENCE.h + 0.11, cz); top.rotation.y = ang; top.castShadow = true; g.add(top);
    for (let d = 0; d <= L + 0.01 && np < 140; d += 6) { const t = L ? d / L : 0; post.setMatrixAt(np++, m4.makeTranslation(ax + (bx - ax) * t, (FENCE.h + 0.5) / 2, az + (bz - az) * t)); }
  }
  post.count = np; post.instanceMatrix.needsUpdate = true; post.castShadow = true; g.add(post);
}

export function buildLandscape() {
  const g = new THREE.Group(); g.name = 'landscape';
  g.add(buildGrass()); buildPlaza(g); buildPaths(g); buildZen(g); buildTeaHouse(g); const koi = buildKoi(g); buildGuanyin(g); buildPagodas(g); buildFlowerFields(g); buildFence(g);
  return {
    group: g,
    update(t) {
      for (const f of koi.fish) {
        const u = f.userData, a = t * u.w + u.ph, R = u.R + Math.sin(t * 0.4 + u.ph) * 0.4;
        f.position.set(Math.cos(a) * R, 0.1, Math.sin(a) * R); const sg = u.w > 0 ? 1 : -1; f.rotation.y = Math.atan2(-sg * Math.sin(a), sg * Math.cos(a));   // đầu cá hướng theo tiếp tuyến vòng bơi
        f.children[1].rotation.z = Math.sin(t * 6 + u.ph) * 0.4;
      }
      koi.water.material.opacity = 0.86 + Math.sin(t * 1.3) * 0.03;
    },
  };
}
