// Cảnh 3D BÊN TRONG NHÀ (Phiên 38, bước 3d-2b). Dữ liệu phòng + nội thất ở js/world/interior.js (có test); file này chỉ DỰNG HÌNH.
// Phòng nằm cùng cảnh nhưng ở xa (INTERIOR = 400,400): người chơi được dịch chuyển vào đó (bước 3d-2c).
// Sàn + 4 tường + trần đều MỘT MẶT quay vào trong: camera đứng ngoài thấy xuyên như nhà búp bê, tường KHÔNG vào RECTS nên camera không bị kéo.
// Đèn tạo SẴN lúc dựng (đổi cường độ khi hiện/ẩn, không thêm/bớt đèn lúc chạy để three khỏi biên dịch lại shader).
// Hình dùng chung (hộp/trụ/cầu đơn vị, vật liệu theo màu) nên dựng lại phòng khi đổi cấp nhà không rò bộ nhớ.
import * as THREE from 'three';
import { woodFloorTexture } from './textures.js';
import { INTERIOR, ROOMS } from '../world/interior.js';

const DOOR_W = 1.0, DOOR_H = 2.05;   // cửa ở giữa tường +z
const BOX = new THREE.BoxGeometry(1, 1, 1), CYL = new THREE.CylinderGeometry(1, 1, 1, 14), BALL = new THREE.SphereGeometry(1, 12, 9);

export function buildInterior() {
  const group = new THREE.Group(); group.name = 'interior'; group.position.set(INTERIOR.x, 0, INTERIOR.z); group.visible = false;
  const room = new THREE.Group(); group.add(room);   // nội dung phòng, xóa và dựng lại mỗi lần show()
  const mats = new Map();
  const std = (c, o = {}) => { const k = c + JSON.stringify(o); let m = mats.get(k); if (!m) { m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.82, ...o }); mats.set(k, m); } return m; };
  const glow = (c) => { const k = 'g' + c; let m = mats.get(k); if (!m) { m = new THREE.MeshBasicMaterial({ color: c }); mats.set(k, m); } return m; };
  const winMat = new THREE.MeshBasicMaterial({ color: 0xbfe3ff });   // kính cửa sổ: đổi màu theo ngày/đêm trong update()
  const glass = new THREE.MeshStandardMaterial({ color: 0x9fe0f0, roughness: 0.1, transparent: true, opacity: 0.3, depthWrite: false });
  const water = new THREE.MeshStandardMaterial({ color: 0x38b6d8, roughness: 0.2, transparent: true, opacity: 0.45, depthWrite: false });

  // sàn gỗ (vân của chánh điện, nhân bản để đổi lặp riêng)
  const floorTex = woodFloorTexture().clone(); floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.needsUpdate = true;
  const floorMat = new THREE.MeshStandardMaterial({ map: floorTex, color: 0xd9b48a, roughness: 0.7 });
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xe8dcc2, roughness: 0.95 });
  const ceilMat = new THREE.MeshStandardMaterial({ color: 0xf2ead8, roughness: 0.95 });

  // đèn tạo sẵn: đèn trần giữa phòng + đèn phụ gần cửa/đồ đạc
  const L1 = new THREE.PointLight(0xffe2b0, 0, 11, 2), L2 = new THREE.PointLight(0xffc88a, 0, 8, 2);
  group.add(L1, L2);

  // ---- hàm dựng nhanh
  const box = (p, w, h, d, mat, x, y, z) => { const m = new THREE.Mesh(BOX, mat); m.scale.set(w, h, d); m.position.set(x, y + h / 2, z); m.castShadow = m.receiveShadow = true; p.add(m); return m; };   // y = đáy
  const cyl = (p, r, h, mat, x, y, z) => { const m = new THREE.Mesh(CYL, mat); m.scale.set(r, h, r); m.position.set(x, y + h / 2, z); m.castShadow = m.receiveShadow = true; p.add(m); return m; };
  const ball = (p, r, mat, x, y, z, sy = 1) => { const m = new THREE.Mesh(BALL, mat); m.scale.set(r, r * sy, r); m.position.set(x, y, z); m.castShadow = true; p.add(m); return m; };
  const plane = (p, w, h, mat, x, y, z, ry = 0, rx = 0) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.position.set(x, y, z); m.rotation.set(rx, ry, 0); m.receiveShadow = true; m.userData.own = true; p.add(m); return m; };   // PlaneGeometry riêng → xóa khi dựng lại
  const WOOD = 0x6b4a2a, DARK = 0x3a2a1c;

  // ---- nội thất theo loại. Gốc nhóm = tâm đồ vật trên sàn; mặt trước của đồ (tủ, ngăn kéo) quay về +z (phía cửa).
  const furn = {
    rug(f, g) { box(g, f.w, 0.02, f.d, std(f.color), 0, 0.01, 0); box(g, f.w - 0.3, 0.025, f.d - 0.3, std(f.color, { color: new THREE.Color(f.color).offsetHSL(0, 0, 0.1) }), 0, 0.01, 0); },
    bed(f, g) {   // đầu giường sát tường −z
      box(g, f.w, 0.28, f.d, std(WOOD), 0, 0, 0); box(g, f.w - 0.1, 0.18, f.d - 0.12, std(0xf4efe3), 0, 0.28, 0.02);
      box(g, f.w - 0.06, 0.06, f.d * 0.58, std(f.color), 0, 0.44, f.d * 0.16);   // chăn phủ nửa dưới
      box(g, f.w, f.h + 0.45, 0.08, std(WOOD), 0, 0, -f.d / 2 + 0.04);                // đầu giường
      const pw = f.w > 1.7 ? 0.5 : 0.7; for (let i = 0; i < (f.w > 1.7 ? 2 : 1); i++) box(g, pw, 0.1, 0.32, std(0xffffff), (i - (f.w > 1.7 ? 0.5 : 0)) * (pw + 0.08), 0.46, -f.d / 2 + 0.32);
    },
    table(f, g) { const t = f.h; box(g, f.w, 0.06, f.d, std(f.color), 0, t - 0.06, 0); for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, 0.06, t - 0.06, 0.06, std(DARK), sx * (f.w / 2 - 0.07), 0, sz * (f.d / 2 - 0.07)); },
    lamp(f, g) { cyl(g, 0.06, 0.04, std(DARK), 0, 0, 0); cyl(g, 0.02, 0.18, std(DARK), 0, 0.04, 0); const s = new THREE.Mesh(CYL, glow(0xffd98a)); s.scale.set(0.11, 0.14, 0.11); s.position.y = 0.3; g.add(s); },
    crate(f, g) { box(g, f.w, f.h, f.d, std(f.color), 0, 0, 0); for (const sx of [-1, 1]) box(g, 0.05, f.h + 0.02, f.d + 0.02, std(DARK), sx * (f.w / 2 - 0.05), 0, 0); box(g, f.w + 0.02, 0.05, f.d + 0.02, std(DARK), 0, f.h * 0.5, 0); },
    shelf(f, g) {   // kệ sách: khung hở + sách màu
      const side = std(f.color); box(g, 0.05, f.h, f.d, side, -f.w / 2 + 0.025, 0, 0); box(g, 0.05, f.h, f.d, side, f.w / 2 - 0.025, 0, 0); box(g, f.w, f.h, 0.03, std(DARK), 0, 0, -f.d / 2 + 0.015);
      const n = Math.max(3, Math.round(f.h / 0.4)), cols = [0x9a3a2a, 0x2f5f8a, 0x4a7a3a, 0xc9a24a, 0x6a4a8a];
      for (let i = 0; i <= n; i++) {
        const y = (i * (f.h - 0.04)) / n; box(g, f.w, 0.04, f.d, side, 0, y, 0);
        if (i < n) { let x = -f.w / 2 + 0.1; for (let k = 0; x < f.w / 2 - 0.12; k++) { const bw = 0.05 + ((k * 7 + i * 3) % 4) * 0.012, bh = 0.2 + ((k * 5 + i) % 4) * 0.04; box(g, bw, Math.min(bh, f.h / n - 0.1), f.d * 0.7, std(cols[(k + i) % cols.length]), x, y + 0.04, 0); x += bw + 0.012; } }
      }
    },
    wardrobe(f, g) { box(g, f.w, f.h, f.d, std(f.color), 0, 0, 0); box(g, 0.02, f.h - 0.12, 0.02, std(DARK), 0, 0.06, f.d / 2 + 0.005); for (const sx of [-1, 1]) box(g, 0.03, 0.22, 0.03, std(0xd9b25f), sx * 0.08, f.h * 0.45, f.d / 2 + 0.02); },
    tvunit(f, g) {
      const cab = f.h * 0.5; box(g, f.w, cab, f.d, std(f.color), 0, 0, 0); box(g, f.w - 0.1, 0.02, 0.02, std(0x1a1a1a), 0, cab * 0.5, f.d / 2 + 0.005);
      const tw = Math.min(f.w * 0.8, 1.6), th = tw * 0.56; box(g, tw, th, 0.05, std(0x111114, { roughness: 0.4 }), 0, cab, 0); const sc = new THREE.Mesh(new THREE.PlaneGeometry(tw - 0.06, th - 0.06), glow(0x1c2a3c)); sc.position.set(0, cab + th / 2, 0.028); sc.userData.own = true; g.add(sc);
      box(g, 0.2, 0.03, 0.12, std(0x111114), 0, cab, 0);
    },
    sofa(f, g) {   // lưng ghế ở phía +z, người ngồi nhìn về −z (hướng TV)
      const m = std(f.color); box(g, f.w, 0.32, f.d, m, 0, 0.08, 0); box(g, f.w, 0.5, 0.18, m, 0, 0.1, f.d / 2 - 0.09);
      for (const sx of [-1, 1]) box(g, 0.18, 0.28, f.d - 0.1, m, sx * (f.w / 2 - 0.09), 0.3, -0.02);
      const n = f.w > 2.3 ? 3 : 2; for (let i = 0; i < n; i++) box(g, (f.w - 0.4) / n - 0.02, 0.1, f.d - 0.3, std(f.color, { color: new THREE.Color(f.color).offsetHSL(0, 0, 0.06) }), -(f.w - 0.4) / 2 + ((i + 0.5) * (f.w - 0.4)) / n, 0.4, -0.04);
      for (const sx of [-1, 1]) cyl(g, 0.03, 0.08, std(DARK), sx * (f.w / 2 - 0.1), 0, 0);
    },
    chair(f, g, all) {   // quay mặt về cái bàn gần nhất, lưng quay ra xa bàn
      const tbl = all.filter((o) => o.kind === 'table' && o.h > 0.6).sort((a, b) => Math.hypot(a.x - f.x, a.z - f.z) - Math.hypot(b.x - f.x, b.z - f.z))[0];
      const s = tbl && tbl.z < f.z ? 1 : -1;   // s = +1: lưng ghế ở +z
      box(g, f.w, 0.05, f.d, std(f.color), 0, 0.4, 0); box(g, f.w, 0.4, 0.05, std(f.color), 0, 0.45, s * (f.d / 2 - 0.025));
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, 0.04, 0.4, 0.04, std(DARK), sx * (f.w / 2 - 0.03), 0, sz * (f.d / 2 - 0.03));
    },
    stairs(f, g) {   // cầu thang trang trí: bậc cao dần về phía −z
      const n = 9, st = f.d / n; for (let i = 0; i < n; i++) box(g, f.w, ((i + 1) * f.h) / n, st, std(f.color), 0, 0, f.d / 2 - (i + 0.5) * st);
      box(g, 0.05, 0.9, f.d, std(DARK), f.w / 2 - 0.03, 0.2, 0);
    },
    plant(f, g) {
      cyl(g, f.w * 0.42, 0.28, std(0xa86a3a), 0, 0, 0); cyl(g, f.w * 0.36, 0.03, std(0x3a2a1c), 0, 0.28, 0);
      const m = std(f.color); ball(g, f.w * 0.5, m, 0, 0.62, 0, 1.2); ball(g, f.w * 0.34, m, f.w * 0.18, 0.95, 0.05, 1.1); ball(g, f.w * 0.3, m, -f.w * 0.2, 0.85, -0.05, 1.1);
    },
    tank(f, g) {   // tủ cá: đế gỗ + bể kính + nước + vài con cá
      const base = f.h * 0.4; box(g, f.w, base, f.d, std(WOOD), 0, 0, 0);
      const tank = new THREE.Mesh(BOX, glass); tank.scale.set(f.w - 0.04, f.h - base, f.d - 0.04); tank.position.y = base + (f.h - base) / 2; g.add(tank);
      const wt = new THREE.Mesh(BOX, water); wt.scale.set(f.w - 0.08, (f.h - base) * 0.82, f.d - 0.08); wt.position.y = base + ((f.h - base) * 0.82) / 2; g.add(wt);
      box(g, f.w - 0.06, 0.04, f.d - 0.06, std(0xd8c28a), 0, base, 0);
      [0xff8a3a, 0xffd23a, 0xff5a5a].forEach((c, i) => { const fish = ball(g, 0.05, glow(c), (i - 1) * f.w * 0.22, base + (f.h - base) * (0.35 + 0.15 * i), (i - 1) * f.d * 0.18, 0.6); fish.scale.x = 0.09; });
    },
  };
  const fallback = (f, g) => box(g, f.w, f.h, f.d, std(f.color), 0, 0, 0);

  // ---- dựng khung phòng
  function shell(r) {
    const { w, d, h } = r, hw = w / 2, hd = d / 2;
    plane(room, w, d, floorMat, 0, 0.005, 0, 0, -Math.PI / 2); floorTex.repeat.set(w / 2.4, d / 2.4);
    plane(room, w, h, wallMat, 0, h / 2, -hd, 0);                       // tường sau (mặt quay +z)
    plane(room, d, h, wallMat, -hw, h / 2, 0, Math.PI / 2);             // tường trái (mặt quay +x)
    plane(room, d, h, wallMat, hw, h / 2, 0, -Math.PI / 2);             // tường phải (mặt quay −x)
    const sw = (w - DOOR_W) / 2;                                        // tường trước có lỗ cửa (mặt quay −z)
    plane(room, sw, h, wallMat, -(DOOR_W / 2 + sw / 2), h / 2, hd, Math.PI); plane(room, sw, h, wallMat, DOOR_W / 2 + sw / 2, h / 2, hd, Math.PI); plane(room, DOOR_W, h - DOOR_H, wallMat, 0, DOOR_H + (h - DOOR_H) / 2, hd, Math.PI);
    plane(room, w, d, ceilMat, 0, h, 0, 0, Math.PI / 2);                // trần (mặt quay xuống)
    // len chân tường (hộp: thấy được từ mọi phía; không làm xà trần để khỏi che tầm nhìn từ trên)
    const sk = std(0x7a5a38); box(room, w, 0.1, 0.03, sk, 0, 0, -hd + 0.015); box(room, 0.03, 0.1, d, sk, -hw + 0.015, 0, 0); box(room, 0.03, 0.1, d, sk, hw - 0.015, 0, 0);
    box(room, sw, 0.1, 0.03, sk, -(DOOR_W / 2 + sw / 2), 0, hd - 0.015); box(room, sw, 0.1, 0.03, sk, DOOR_W / 2 + sw / 2, 0, hd - 0.015);
    // khung cửa + cánh cửa gỗ mở vào phía trong, áp gần tường
    const fr = std(0x5a3d22); box(room, 0.07, DOOR_H, 0.1, fr, -DOOR_W / 2 - 0.035, 0, hd); box(room, 0.07, DOOR_H, 0.1, fr, DOOR_W / 2 + 0.035, 0, hd); box(room, DOOR_W + 0.14, 0.07, 0.1, fr, 0, DOOR_H, hd);
    const leaf = new THREE.Group(); leaf.position.set(-DOOR_W / 2, 0, hd - 0.03); leaf.rotation.y = 1.35; room.add(leaf);
    box(leaf, DOOR_W - 0.02, DOOR_H - 0.04, 0.05, std(0x8a5a30), (DOOR_W - 0.02) / 2, 0.02, 0); box(leaf, 0.03, 0.03, 0.09, std(0xd9b25f), DOOR_W - 0.12, 1.0, 0);
    // cửa sổ: sau (giữa) + trái (nếu phòng sâu đủ) — tấm sáng + khung
    const win = (c, cy, ww, wh, wall) => {   // c = vị trí dọc tường (x với tường sau, z với tường trái)
      const p = new THREE.Group(); room.add(p);
      if (wall === 'back') { p.position.set(c, cy, -hd + 0.012); } else { p.position.set(-hw + 0.012, cy, c); p.rotation.y = Math.PI / 2; }
      const glass2 = new THREE.Mesh(new THREE.PlaneGeometry(ww, wh), winMat); glass2.userData.own = true; p.add(glass2);
      const f2 = std(0xf2ead8); for (const [bx, by, bw, bh] of [[0, wh / 2, ww + 0.1, 0.06], [0, -wh / 2, ww + 0.1, 0.08], [-ww / 2, 0, 0.06, wh], [ww / 2, 0, 0.06, wh], [0, 0, 0.03, wh], [0, 0, ww, 0.03]]) { const bar = new THREE.Mesh(BOX, f2); bar.scale.set(bw, bh, 0.05); bar.position.set(bx, by, 0.02); p.add(bar); }
    };
    win(w > 6 ? -hw * 0.45 : 0, Math.min(1.6, h - 0.9), 1.2, 0.9, 'back');
    if (d >= 5.4) win(-0.5, Math.min(1.6, h - 0.9), 1.2, 0.9, 'left');
    // bệ nền: tấm tối dưới phòng để khỏi lơ lửng giữa không trung
    const pad = new THREE.Mesh(BOX, std(0x3a3128)); pad.scale.set(w + 3, 0.2, d + 3); pad.position.y = -0.11; pad.receiveShadow = true; room.add(pad);
    L1.position.set(0, h - 0.35, -0.2); L2.position.set(w * 0.2, 1.7, hd - 1.2);
  }

  function clear() {
    for (const c of [...room.children]) { room.remove(c); c.traverse((o) => { if (o.isMesh && (o.userData.own || (o.geometry && o.geometry !== BOX && o.geometry !== CYL && o.geometry !== BALL))) o.geometry.dispose(); }); }
  }

  let cur = -1, night = 0, shown = false;
  const light = () => { const on = shown ? 1 : 0; L1.intensity = on * (16 + 10 * night); L2.intensity = on * (7 + 7 * night); };
  /** Hiện phòng của cấp nhà `lv` (0..3). Gọi lại khi nhà được nâng cấp để dựng lại. */
  function show(lv) {
    const r = ROOMS[Math.max(0, Math.min(ROOMS.length - 1, lv | 0))];
    clear(); shell(r);
    for (const f of r.furniture) {
      const g = new THREE.Group(); let y = 0;
      if (f.kind === 'lamp') { const t = r.furniture.find((o) => o.kind === 'table' && Math.abs(o.x - f.x) <= o.w / 2 && Math.abs(o.z - f.z) <= o.d / 2); if (t) y = t.h; }
      g.position.set(f.x, y, f.z); (furn[f.kind] || fallback)(f, g, r.furniture); room.add(g);
    }
    cur = r.lv; shown = true; group.visible = true; light();
  }
  function hide() { shown = false; group.visible = false; light(); }
  /** n = 0 (ngày) … 1 (đêm): kính cửa sổ tối dần, đèn trong nhà sáng hơn. */
  function update(n = 0) { if (Math.abs(n - night) < 0.01) return; night = n; winMat.color.setHex(0xbfe3ff).lerp(new THREE.Color(0x1a2b48), night); if (shown) light(); }
  return { group, show, hide, update, get level() { return cur; }, get shown() { return shown; } };
}
