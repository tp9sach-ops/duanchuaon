// Cảnh NGOÀI CHÙA (Phiên 17): đường phố làng + nhà phố, chợ làng + gốc đa + giếng, cổng làng, đường mòn rừng thông (Tây), đường mòn + thác nước (Đông),
// ruộng, núi xa. Dựng từ dữ liệu của js/world/outside.js (cùng nguồn với va chạm). Trả { group, update(t) }. Cho đổ bóng bằng shade() ở scene/index.js.
import * as THREE from 'three';
import { mulberry32 } from '../util.js';
import { pavingTexture } from './textures.js';
import { OUT_WALKS, THAC, DA_LANG, GIENG, DINH_NGHI, MIEU, CO_THU, STALLS, STREET_LAMPS, OUT_ROCKS, VILLAGE_GATE, STORE_9SACH, STORE_TACHHOA } from '../world/outside.js';
import { buildStore9Sach } from './store9sach.js';
import { buildTachHoa } from './tachhoa.js';

const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, ...o });
const flat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.95, flatShading: true, ...o });
function box(w, h, d, m, x, y, z, parent) { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); parent.add(o); return o; }
function cyl(rt, rb, h, m, x, y, z, parent, seg = 10) { const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m); o.position.set(x, y, z); parent.add(o); return o; }
function plane(w, d, m, x, y, z, parent) { const o = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m); o.rotation.x = -Math.PI / 2; o.position.set(x, y, z); o.receiveShadow = true; parent.add(o); return o; }
function canvasTex(w, h, draw, rep = null) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; if (rep) t.repeat.set(rep[0], rep[1]); return t;
}
const grassTex = () => canvasTex(256, 256, (g, w, h) => { const r = mulberry32(5); g.fillStyle = '#6fae48'; g.fillRect(0, 0, w, h); for (let i = 0; i < 2400; i++) { g.fillStyle = `hsla(${88 + r() * 24},${42 + r() * 18}%,${36 + r() * 22}%,.55)`; g.fillRect(r() * w, r() * h, 1.5 + r() * 2, 3 + r() * 5); } });
const dirtTex = () => canvasTex(128, 128, (g, w, h) => { const r = mulberry32(9); g.fillStyle = '#a88557'; g.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { g.fillStyle = `hsla(${28 + r() * 10},${30 + r() * 20}%,${35 + r() * 25}%,.6)`; g.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 3); } });
const roadTex = () => canvasTex(128, 128, (g, w, h) => { const r = mulberry32(3); g.fillStyle = '#4a4d52'; g.fillRect(0, 0, w, h); for (let i = 0; i < 700; i++) { g.fillStyle = `rgba(${90 + r() * 60},${90 + r() * 60},${95 + r() * 60},.35)`; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); } g.fillStyle = '#e9e4cf'; g.fillRect(w / 2 - 2, 8, 4, 48); g.fillRect(w / 2 - 2, 72, 4, 48); });
const fallTex = () => canvasTex(64, 256, (g, w, h) => { const r = mulberry32(2); g.clearRect(0, 0, w, h); for (let i = 0; i < 70; i++) { const x = r() * w, y = r() * h, l = 40 + r() * 120; const gr = g.createLinearGradient(0, y, 0, y + l); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, `rgba(255,255,255,${0.35 + r() * 0.5})`); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(x, y, 2 + r() * 4, l); } });
const signTex = (txt) => canvasTex(512, 128, (g, w, h) => { g.fillStyle = '#7a2c12'; g.fillRect(0, 0, w, h); g.strokeStyle = '#d9a63a'; g.lineWidth = 6; g.strokeRect(6, 6, w - 12, h - 12); g.fillStyle = '#f6d98a'; g.font = '700 54px "Be Vietnam Pro", system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, w / 2, h / 2 + 3, w - 40); });

/** Mái dốc hai phía (lăng trụ tam giác) dài `len` theo trục z, rộng `w`, cao `h`. */
function gable(w, h, len, m) { const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.closePath(); const g = new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: false }); g.translate(0, 0, -len / 2); const o = new THREE.Mesh(g, m); return o; }

function buildGround(g) {
  const t = grassTex(); t.repeat.set(40, 24);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(280, 170), new THREE.MeshStandardMaterial({ map: t, roughness: 1 })); m.rotation.x = -Math.PI / 2; m.position.set(0, 0.008, 60 + 85); m.receiveShadow = true; g.add(m);
}

function buildStreet(g) {
  const r = roadTex(); r.repeat.set(1, 90 / 4);
  plane(12, 90, new THREE.MeshStandardMaterial({ map: r, roughness: 0.9 }), 0, 0.03, 105, g);
  const walk = pavingTexture().clone(); walk.needsUpdate = true; walk.repeat.set(2, 90 / 5.9);
  for (const sx of [-1, 1]) {
    plane(8, 90, new THREE.MeshStandardMaterial({ map: walk, roughness: 0.8 }), sx * 10, 0.045, 105, g);
    box(0.3, 0.14, 90, std(0x9a9a98), sx * 6.15, 0.07, 105, g);
  }
  const cho = walk.clone(); cho.needsUpdate = true; cho.repeat.set(68 / 5.9, 30 / 5.9);
  plane(68, 30, new THREE.MeshStandardMaterial({ map: cho, roughness: 0.8, color: 0xe8dcc8 }), 0, 0.05, 131, g);
}

function buildVillageGate(g) {
  const { z, posts } = VILLAGE_GATE, wood = std(0x7a2c12), tile = std(0x8b3a26);
  for (const x of posts) { box(1.2, 6.2, 1.2, std(0xd9c9a0), x, 3.1, z, g); box(1.6, 0.4, 1.6, std(0x8a8f96), x, 0.2, z, g); box(1.5, 0.35, 1.5, tile, x, 6.4, z, g); }
  box(18.5, 0.7, 0.8, wood, 0, 5.9, z, g);
  const sg = new THREE.Mesh(new THREE.PlaneGeometry(7.4, 1.85), new THREE.MeshBasicMaterial({ map: signTex('LÀNG DIỆU GIANG') })); sg.position.set(0, 5.1, z + 0.45); g.add(sg);
  const sg2 = sg.clone(); sg2.rotation.y = Math.PI; sg2.position.z = z - 0.45; g.add(sg2);   // mặt sau (nhìn từ phía chùa) để chữ không bị ngược
  const roof = gable(2.6, 0.9, 10, tile); roof.rotation.y = Math.PI / 2; roof.position.set(0, 6.25, z); g.add(roof);
}

const HOUSE_COLORS = [0xf2e6c4, 0xf4d9a0, 0xe9b9a0, 0xb8d4cf, 0xe6c9d4, 0xd9e3b8];
/** Nhà phố mái ngói: (x,z) tâm, quay mặt về phía `facing` (+1 = mặt hướng +x, -1 = hướng -x). */
function house(g, x, z, facing, rnd) {
  const w = 8 + rnd() * 2, d = 7 + rnd() * 3, h = 5 + rnd() * 3.5, col = HOUSE_COLORS[(rnd() * HOUSE_COLORS.length) | 0], grp = new THREE.Group();
  box(d, h, w, std(col), 0, h / 2, 0, grp);
  const tile = std(0x9c4a32), roof = gable(d + 1.4, 2.4, w + 1.2, tile); roof.position.set(0, h, 0); grp.add(roof);
  const door = std(0x6b3a22), win = new THREE.MeshStandardMaterial({ color: 0x7fb4c9, roughness: 0.3, emissive: 0x1a3040 });
  box(0.12, h * 0.5, 1.8, door, d / 2 + 0.02, h * 0.25, -w * 0.2, grp);
  for (const dz of [w * 0.22, w * 0.38]) box(0.1, 1.2, 1.1, win, d / 2 + 0.03, h * 0.62, dz, grp);
  if (h > 6.2) box(0.1, 1.2, 1.4, win, d / 2 + 0.03, h * 0.62, -w * 0.2, grp);
  box(1.3, 0.14, w * 0.9, std(0xc0453a), d / 2 + 0.6, h * 0.46, 0, grp);   // mái hiên
  grp.position.set(x, 0, z); grp.rotation.y = facing > 0 ? Math.PI / 2 : -Math.PI / 2; g.add(grp);
}
function buildHouses(g) {
  const rnd = mulberry32(21);
  for (const sx of [-1, 1]) for (let z = 70; z <= 146; z += 10.5) {
    if (sx < 0 && z > 80 && z < 99) continue;      // chừa đường mòn rừng
    if (sx > 0 && z > 94 && z < 113) continue;     // chừa đường mòn thác
    const hz = z + (rnd() - 0.5) * 1.2;
    // Hai ô nhà phố bên phải (z≈80,5 và z≈91) nhường chỗ cho Cửa hàng 9 Sạch và Tách Hoa; vẫn gọi house() vào nhóm bỏ đi để dãy số ngẫu nhiên (màu, cỡ) của các nhà khác giữ nguyên
    const slot = sx > 0 && (Math.abs(z - STORE_9SACH.z) < 0.1 || Math.abs(z - STORE_TACHHOA.z) < 0.1);
    house(slot ? new THREE.Group() : g, sx * 19.5, hz, -sx, rnd);
  }
  // nhà trong ruộng phía sau hàng phố
  for (const [x, z] of [[-34, 76], [-42, 100], [36, 78], [44, 122], [-46, 134], [40, 148], [30, 150], [-28, 154]]) house(g, x, z, x < 0 ? 1 : -1, rnd);
  // ruộng lúa
  const paddy = canvasTex(64, 64, (c, w, h) => { c.fillStyle = '#8bc34a'; c.fillRect(0, 0, w, h); for (let i = 0; i < 16; i++) { c.fillStyle = i % 2 ? '#7cb342' : '#9ccc65'; c.fillRect(i * 4, 0, 2, h); } }, [6, 6]);
  const pm = new THREE.MeshStandardMaterial({ map: paddy, roughness: 1 });
  for (const [x0, x1, z0, z1] of [[24, 70, 62, 94], [-70, -24, 62, 80], [-60, -26, 100, 114]]) plane(x1 - x0, z1 - z0, pm, (x0 + x1) / 2, 0.02, (z0 + z1) / 2, g);
}

function lamps(g) {
  const pole = new THREE.CylinderGeometry(0.08, 0.1, 4.6, 6), headG = new THREE.SphereGeometry(0.26, 10, 8), pm = std(0x3a3a3c), hm = new THREE.MeshStandardMaterial({ color: 0xffe0a0, emissive: 0xffc060, emissiveIntensity: 0.9 });
  for (const l of STREET_LAMPS) { const p = new THREE.Mesh(pole, pm); p.position.set(l.x, 2.3, l.z); g.add(p); const h = new THREE.Mesh(headG, hm); h.position.set(l.x, 4.75, l.z); g.add(h); }
}

function buildMarket(g) {
  const rnd = mulberry32(8), goods = [0xe94f4f, 0xf2c14e, 0x7cb342, 0xff8f3d, 0xb36ad9, 0xf2a6c0];
  const awn = [0xc0453a, 0xe9a23b, 0x3f8f6a, 0x3f6fa8];
  STALLS.forEach((s, i) => {
    const grp = new THREE.Group(), front = s.z < 131 ? 1 : -1;
    box(5, 0.9, 1.6, std(0x8a5a36), 0, 0.45, 0.3 * front, grp);
    for (const sx of [-2.3, 2.3]) for (const sz of [-1, 1]) cyl(0.07, 0.07, 2.8, std(0x5a3820), sx, 1.4, sz * 1.1, grp, 6);
    const canopy = box(5.4, 0.14, 2.8, std(awn[i % 4]), 0, 2.85, 0, grp); canopy.rotation.x = 0.1 * front;
    for (let k = 0; k < 9; k++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.2 + rnd() * 0.08, 8, 6), std(goods[(rnd() * goods.length) | 0], { roughness: 0.6 })); m.position.set(-2 + k * 0.5, 1.05, 0.3 * front + (rnd() - 0.5) * 0.5); grp.add(m); }
    grp.position.set(s.x, 0, s.z); g.add(grp);
  });
  // gốc đa làng: thân xù xì, rễ phụ buông, tán nhiều tầng; vòng ghế đá quanh gốc
  const bark = flat(0x6b4a2f), leaf = [flat(0x2f6f35), flat(0x3a8a3f), flat(0x2a5f30)];
  cyl(1.1, 1.8, 7, bark, DA_LANG.x, 3.5, DA_LANG.z, g, 9);
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2, r = 1.1 + (i % 3) * 0.5; cyl(0.1, 0.16, 5.4, bark, DA_LANG.x + Math.cos(a) * r * 1.3, 2.7, DA_LANG.z + Math.sin(a) * r * 1.3, g, 5); }
  for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2, b = new THREE.Mesh(new THREE.IcosahedronGeometry(3.4 + (i % 3) * 0.5, 1), leaf[i % 3]); b.position.set(DA_LANG.x + Math.cos(a) * 3.4, 8 + (i % 2) * 1.3, DA_LANG.z + Math.sin(a) * 3.4); g.add(b); }
  const top = new THREE.Mesh(new THREE.IcosahedronGeometry(4.6, 1), leaf[1]); top.position.set(DA_LANG.x, 9.8, DA_LANG.z); g.add(top);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(DA_LANG.r + 0.55, 0.28, 8, 24), std(0x9a9a98)); ring.rotation.x = Math.PI / 2; ring.position.set(DA_LANG.x, 0.3, DA_LANG.z); g.add(ring);
  // giếng làng
  const well = new THREE.Group(); cyl(1.2, 1.2, 0.9, std(0x8a8f96), 0, 0.45, 0, well, 14); cyl(0.9, 0.9, 0.95, std(0x1b3a4a), 0, 0.46, 0, well, 14);
  for (const sx of [-1, 1]) cyl(0.07, 0.07, 2.6, std(0x5a3820), sx * 1.0, 1.9, 0, well, 6);
  box(2.8, 0.1, 0.3, std(0x5a3820), 0, 3.2, 0, well);
  const wr = gable(2.8, 0.9, 2.2, std(0x9c4a32)); wr.rotation.y = Math.PI / 2; wr.position.set(0, 3.2, 0); well.add(wr);
  well.position.set(GIENG.x, 0, GIENG.z); g.add(well);
}

// ---- Rừng: cây thông (nón xếp tầng) và cây lá rộng (cầu), mọc ngoài các vùng đi bộ + nhà phố; dùng InstancedMesh để nhẹ
function buildForest(g) {
  const rnd = mulberry32(77), pines = [], broads = [];
  const inWalk = (x, z, m) => OUT_WALKS.some((w) => x > w.x0 - m && x < w.x1 + m && z > w.z0 - m && z < w.z1 + m);
  const near = (x, z) => (Math.abs(x) < 33 && z < 160 && z > 60) || Math.hypot(x - THAC.pool.x, z - THAC.pool.z) < 14 || (x > 82 && x < 118 && z > 84 && z < 124) || (x < -88 && x > -120 && z > 70 && z < 110);
  const regions = [[-150, -40, 60, 180, 'p'], [40, 150, 60, 180, 'b'], [-150, 150, 150, 200, 'm']];
  for (const [x0, x1, z0, z1, kind] of regions) for (let i = 0, n = 0; i < 2400 && n < 190; i++) {
    const x = x0 + rnd() * (x1 - x0), z = z0 + rnd() * (z1 - z0);
    if (inWalk(x, z, 3) || near(x, z) || (Math.abs(x) < 34 && z > 60 && z < 160)) continue;
    const s = 0.8 + rnd() * 0.9; ((kind === 'p' || (kind === 'm' && rnd() < 0.5)) ? pines : broads).push({ x, z, s }); n++;
  }
  // thêm hai hàng thông dọc đường mòn rừng (Tây) và cây lá rộng dọc đường mòn thác (Đông)
  for (let x = -96; x < -14; x += 5) { pines.push({ x: x + rnd() * 2, z: 80.5 + rnd() * 1.5, s: 1 + rnd() * 0.6 }); pines.push({ x: x + rnd() * 2, z: 97.5 + rnd() * 1.5, s: 1 + rnd() * 0.6 }); }
  for (let x = 18; x < 92; x += 5.5) { broads.push({ x: x + rnd() * 2, z: 95.5 + rnd() * 1.2, s: 1 + rnd() * 0.5 }); broads.push({ x: x + rnd() * 2, z: 112 + rnd() * 1.5, s: 1 + rnd() * 0.5 }); }
  const dummy = new THREE.Object3D();
  const trunkG = new THREE.CylinderGeometry(0.28, 0.4, 2.4, 6); trunkG.translate(0, 1.2, 0);
  const coneG = new THREE.ConeGeometry(2.1, 4.4, 7); coneG.translate(0, 4.6, 0);
  const cone2G = new THREE.ConeGeometry(1.6, 3.6, 7); cone2G.translate(0, 7.1, 0);
  const ballG = new THREE.IcosahedronGeometry(2.6, 1); ballG.translate(0, 5.2, 0);
  const mk = (geo, mat, list, shadow) => { const m = new THREE.InstancedMesh(geo, mat, Math.max(1, list.length)); list.forEach((t, i) => { dummy.position.set(t.x, 0, t.z); dummy.scale.setScalar(t.s); dummy.rotation.y = i; dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix); }); m.count = list.length; m.castShadow = shadow; m.receiveShadow = false; g.add(m); return m; };
  const tm = flat(0x5a3d26);
  mk(trunkG, tm, pines, true); mk(coneG, flat(0x2f6b3c), pines, true); mk(cone2G, flat(0x3a7d46), pines, true);
  mk(trunkG, tm, broads, true); mk(ballG, flat(0x4d9a42), broads, true);
}

function mountains(g) {
  const cols = [0x5f8f6a, 0x6a9a78, 0x4f7f60, 0x7aa59a], rnd = mulberry32(55);
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2 + rnd() * 0.15, d = 340 + rnd() * 90, h = 70 + rnd() * 90;
    const x = Math.cos(a) * d, z = 80 + Math.sin(a) * d * 0.9; if (z < 120 && Math.abs(x) < 200) continue;   // phía Bắc đã có dãy núi cũ (scene/nature.js)
    const m = new THREE.Mesh(new THREE.ConeGeometry(70 + rnd() * 60, h, 6 + ((rnd() * 3) | 0)), flat(cols[i % 4])); m.position.set(x, h / 2 - 2, z); m.rotation.y = rnd() * 3; g.add(m);
  }
}

// ---- Thác nước: vách đá cao phía Đông, dải nước trắng chảy xuống hồ, sương mù, hồ xanh, đá bờ, đình nghỉ chân
function buildWaterfall(g) {
  const rnd = mulberry32(12), cx = THAC.cliffX;
  const cg = new THREE.BoxGeometry(26, THAC.h, 46, 6, 9, 10), pos = cg.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), onFront = x < -12.9;
    if (y < -THAC.h / 2 + 0.1) continue;
    const n = (rnd() - 0.5) * 3.2; pos.setX(i, x + (onFront ? Math.abs(n) : n)); pos.setZ(i, z + (rnd() - 0.5) * 2.5); if (y > THAC.h / 2 - 0.1) pos.setY(i, y + rnd() * 3);
  }
  cg.computeVertexNormals();
  const cliff = new THREE.Mesh(cg, flat(0x8a8176)); cliff.position.set(cx + 13, THAC.h / 2, THAC.fallZ); g.add(cliff);
  const hill = new THREE.Mesh(new THREE.ConeGeometry(60, 70, 7), flat(0x4f7f60)); hill.position.set(cx + 50, 33, THAC.fallZ - 10); g.add(hill);
  const hill2 = new THREE.Mesh(new THREE.ConeGeometry(45, 55, 7), flat(0x5f8f6a)); hill2.position.set(cx + 35, 25, THAC.fallZ + 40); g.add(hill2);
  const moss = new THREE.Mesh(new THREE.BoxGeometry(27, 2.2, 47), flat(0x4f9a3f)); moss.position.set(cx + 13, THAC.h + 1.2, THAC.fallZ); g.add(moss);
  const ft = fallTex(); ft.repeat.set(1, 1);
  const fall = new THREE.Mesh(new THREE.PlaneGeometry(6.4, THAC.h + 0.6), new THREE.MeshBasicMaterial({ map: ft, transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide, color: 0xe8f6ff }));
  fall.rotation.y = -Math.PI / 2; fall.position.set(cx - 0.35, THAC.h / 2, THAC.fallZ); g.add(fall);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(6.4, THAC.h), new THREE.MeshBasicMaterial({ color: 0xbfe3ef, transparent: true, opacity: 0.35, depthWrite: false })); back.rotation.y = -Math.PI / 2; back.position.set(cx - 0.3, THAC.h / 2, THAC.fallZ); g.add(back);
  // hồ + bọt trắng chân thác
  const pool = new THREE.Mesh(new THREE.CircleGeometry(THAC.pool.r, 40), new THREE.MeshStandardMaterial({ color: 0x3fa9b8, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.88 })); pool.rotation.x = -Math.PI / 2; pool.position.set(THAC.pool.x, 0.14, THAC.pool.z); g.add(pool);
  const rim = new THREE.Mesh(new THREE.RingGeometry(THAC.pool.r, THAC.pool.r + 1.2, 40), std(0x8a8f96)); rim.rotation.x = -Math.PI / 2; rim.position.set(THAC.pool.x, 0.12, THAC.pool.z); g.add(rim);
  const foam = new THREE.Mesh(new THREE.CircleGeometry(3.2, 20), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, depthWrite: false })); foam.rotation.x = -Math.PI / 2; foam.position.set(cx - 2.2, 0.2, THAC.fallZ); g.add(foam);
  // đá bờ
  for (const r of OUT_ROCKS) { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r.r * 1.25, 0), flat(0x777068)); m.scale.y = 0.8; m.position.set(r.x, r.r * 0.5, r.z); m.rotation.set(rnd(), rnd(), rnd()); g.add(m); }
  // sương mù chân thác
  const dot = new THREE.CanvasTexture((() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 2, 32, 32, 30); gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return c; })());
  const mist = []; for (let i = 0; i < 16; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, transparent: true, depthWrite: false, opacity: 0.5 })); s.scale.setScalar(5 + rnd() * 3); s.position.set(cx - 2 - rnd() * 3, 1 + rnd() * 3, THAC.fallZ + (rnd() - 0.5) * 6); s.userData = { ph: rnd() * 6.28, y0: s.position.y }; g.add(s); mist.push(s); }
  // đình nghỉ chân
  const d = DINH_NGHI, cxd = (d.x0 + d.x1) / 2, czd = (d.z0 + d.z1) / 2, wood = std(0x7a4a2a);
  for (const sx of [d.x0 + 0.3, d.x1 - 0.3]) for (const sz of [d.z0 + 0.3, d.z1 - 0.3]) cyl(0.14, 0.16, 3, wood, sx, 1.5, sz, g, 6);
  box(4, 0.16, 4, wood, cxd, 0.5, czd, g); const pr = new THREE.Mesh(new THREE.ConeGeometry(3.4, 1.6, 4), std(0x9c4a32)); pr.rotation.y = Math.PI / 4; pr.position.set(cxd, 3.8, czd); g.add(pr);
  box(3.4, 0.14, 0.7, wood, cxd, 0.9, czd, g);
  return { ft, mist };
}

// ---- Bãi rừng thông (Tây): cổ thụ, miếu nhỏ, gốc cây làm ghế, đèn đá
function buildForestGlade(g) {
  const bark = flat(0x6b4a2f), leaf = [flat(0x2f6f35), flat(0x3a8a3f)];
  cyl(1.2, 2.0, 9, bark, CO_THU.x, 4.5, CO_THU.z, g, 9);
  for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28, b = new THREE.Mesh(new THREE.IcosahedronGeometry(3.6, 1), leaf[i % 2]); b.position.set(CO_THU.x + Math.cos(a) * 3, 10 + (i % 2) * 1.2, CO_THU.z + Math.sin(a) * 3); g.add(b); }
  const top = new THREE.Mesh(new THREE.IcosahedronGeometry(4.8, 1), leaf[0]); top.position.set(CO_THU.x, 12, CO_THU.z); g.add(top);
  const rope = new THREE.Mesh(new THREE.TorusGeometry(CO_THU.r + 0.1, 0.12, 6, 20), std(0xc0453a)); rope.rotation.x = Math.PI / 2; rope.position.set(CO_THU.x, 1.6, CO_THU.z); g.add(rope);   // dải vải đỏ quấn gốc
  const m = MIEU, cxm = (m.x0 + m.x1) / 2, czm = (m.z0 + m.z1) / 2;
  box(3, 2.2, 3, std(0xd9c9a0), cxm, 1.1, czm, g); const mr = gable(4, 1.5, 4, std(0x7a2c12)); mr.rotation.y = Math.PI / 2; mr.position.set(cxm, 2.2, czm); g.add(mr);
  box(0.9, 1.4, 0.1, std(0x4a1a10), cxm, 0.8, m.z1 + 0.02, g);
  const lantern = std(0xffd08a, { emissive: 0xffa040, emissiveIntensity: 0.8 }); const lm = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), lantern); lm.position.set(cxm + 1.3, 1.2, m.z1 + 0.5); g.add(lm);
  for (const [x, z] of [[-96, 80], [-95, 98], [-110, 100], [-112, 80], [-93, 104]]) cyl(0.5, 0.55, 0.5, bark, x, 0.25, z, g, 8);
}

export function buildOutside() {
  const group = new THREE.Group();
  buildGround(group); buildStreet(group); buildVillageGate(group); buildHouses(group); lamps(group); buildMarket(group); buildForest(group); mountains(group);
  const wf = buildWaterfall(group); buildForestGlade(group);
  group.add(buildStore9Sach()); group.add(buildTachHoa());   // Cửa hàng 9 Sạch (nhà phố mặt đường làng, bên phải)
  // đường mòn đất (Đông, Tây) và hai bãi
  const dt = dirtTex(); dt.repeat.set(30, 3);
  for (const w of OUT_WALKS) if (w.id !== 'duong-lang' && w.id !== 'cho') { const t = dt.clone(); t.needsUpdate = true; t.repeat.set((w.x1 - w.x0) / 4, (w.z1 - w.z0) / 4); plane(w.x1 - w.x0, w.z1 - w.z0, new THREE.MeshStandardMaterial({ map: t, roughness: 1 }), (w.x0 + w.x1) / 2, 0.025, (w.z0 + w.z1) / 2, group); }
  return {
    group,
    update(t) {
      wf.ft.offset.y = -t * 0.55;
      wf.mist.forEach((s, i) => { s.position.y = s.userData.y0 + Math.sin(t * 0.8 + s.userData.ph) * 0.7; s.material.opacity = 0.35 + 0.2 * Math.sin(t * 0.6 + i); });
    },
  };
}
