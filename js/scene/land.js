// Khu dân cư "xóm" (Phiên 36, bước 2): đường lát gạch xuống xóm + đường giữa, 10 lô đất có cột mốc và bảng số, nhà trống thô sơ được tặng.
// Dữ liệu ở js/world/land.js (có test). refresh(land, reg) dựng lại bảng trạng thái từng lô và nhà theo xóm đang XEM.
// Nhà: 6 cấp (0–3 + Tuscan, La Mã ở Phiên 95), MỖI CẤP MỘT MÔ HÌNH GLB (js/scene/houseGlb.js, assets/models/houses/). Không còn nhà do mã tự dựng; chỉ có khối tạm trong lúc mô hình đang nạp.
import * as THREE from 'three';
import { villageTileTexture } from './textures.js';
import { PLOTS, LAND_WALKS, LANE_Z, LOT_W, LOT_D, houseLevel, houseRect, plotById } from '../world/land.js';
import { houseGlbClone, onHouseGlb } from './houseGlb.js';

const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, ...o });
const SANS = '700 40px "Be Vietnam Pro", "Noto Sans", system-ui, sans-serif';

function labelTex(lines, colors) {
  const w = 256, h = 128, c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  const paint = () => {
    g.clearRect(0, 0, w, h); g.fillStyle = colors.bg; g.fillRect(0, 0, w, h); g.strokeStyle = colors.line; g.lineWidth = 6; g.strokeRect(4, 4, w - 8, h - 8);
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = colors.fg;
    g.font = SANS; g.fillText(lines[0], w / 2, 40, w - 24); g.font = SANS.replace('40px', '26px'); g.fillText(lines[1], w / 2, 90, w - 24); t.needsUpdate = true;
  };
  paint(); try { document.fonts?.ready?.then(paint); } catch (e) { /* giữ phông dự phòng */ }
  return t;
}
const OPEN = { bg: '#2b3a2a', line: '#8fd6bf', fg: '#f3ead4' }, MINE = { bg: '#5a3a14', line: '#f1db9f', fg: '#fff3d0' }, TAKEN = { bg: '#3a2a2a', line: '#c9a36a', fg: '#f3ead4' };

// ---- Hình nhà. Thân nhà GIỮ NGUYÊN kích thước (hw, hd) của HOUSE_LEVELS (khớp js/world/land.js: houseRect, doorPoint, poolRect) nên va chạm/nút "Vào nhà" không đổi.
// Hình/vật liệu của mô hình dùng CHUNG (userData.shared) nên 10 nhà cùng cấp không tốn thêm bộ nhớ; dọn nhà cũ chỉ hủy phần riêng.
const shared = (o) => { o.userData.shared = true; return o; };
const PH_GEO = shared(new THREE.BoxGeometry(1, 1, 1)), PH_MAT = shared(new THREE.MeshStandardMaterial({ color: 0xcfc6b0, roughness: 0.9 }));
/** Khối tạm (một hộp trơn) hiện trong lúc mô hình GLB của cấp đó đang nạp. */
function placeholder(L) { const g = new THREE.Group(), m = new THREE.Mesh(PH_GEO, PH_MAT); m.scale.set(L.hw * 2, 3, L.hd * 2); m.position.y = 1.5; m.castShadow = true; m.receiveShadow = true; g.add(m); return g; }

/**
 * Mô hình nhà theo cấp lv, quay mặt ra đường (face = +1 hướng +z; −1 hướng −z). Gốc ở tâm thân nhà. Mỗi cấp một mô hình GLB (HOUSE_GLB trong houseGlb.js);
 * chưa nạp xong thì hiện khối tạm rồi tự đổi sang mô hình.
 */
export function houseModel(lv, face) {
  const L = houseLevel(lv), g = new THREE.Group(); g.rotation.y = face > 0 ? 0 : Math.PI;
  const glb = houseGlbClone(L.lv);
  if (glb) { g.add(glb); return g; }
  const holder = placeholder(L); g.add(holder);
  onHouseGlb(L.lv, (ok) => {
    if (!ok || !g.parent) return;
    const c = houseGlbClone(L.lv); if (!c) return;
    g.remove(holder); g.add(c);   // khối tạm dùng hình/vật liệu chung nên không cần hủy
  });
  return g;
}

/** Dựng khu dân cư. Trả { group, refresh(land, reg, ownerName), plotPose(id) }. */
export function buildLand() {
  const group = new THREE.Group(), tile = villageTileTexture().clone(); tile.needsUpdate = true;
  const pave = (x0, x1, z0, z1, y) => { const t = tile.clone(); t.needsUpdate = true; t.repeat.set((x1 - x0) / 5.9, (z1 - z0) / 5.9); const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), new THREE.MeshStandardMaterial({ map: t, roughness: 0.85 })); m.rotation.x = -Math.PI / 2; m.position.set((x0 + x1) / 2, y, (z0 + z1) / 2); m.receiveShadow = true; group.add(m); };
  const road = LAND_WALKS[0], area = LAND_WALKS[1];
  pave(road.x0, road.x1, 146, 162, 0.052); pave(area.x0, area.x1, LANE_Z.z0, LANE_Z.z1, 0.052);
  // cột mốc bốn góc mỗi lô (InstancedMesh) + viền đá thấp phía sau
  const postG = new THREE.CylinderGeometry(0.1, 0.12, 0.9, 6); postG.translate(0, 0.45, 0);
  const posts = new THREE.InstancedMesh(postG, std(0xd9c9a0), PLOTS.length * 4), d = new THREE.Object3D(); let k = 0;
  for (const p of PLOTS) for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { d.position.set(p.x + sx * (LOT_W / 2 - 0.15), 0, p.z + sz * (LOT_D / 2 - 0.15)); d.updateMatrix(); posts.setMatrixAt(k++, d.matrix); }
  posts.castShadow = true; group.add(posts);
  // bảng cổng xóm
  const sg = new THREE.Mesh(new THREE.PlaneGeometry(5, 1.2), new THREE.MeshBasicMaterial({ map: labelTex(['KHU DÂN CƯ', 'Diệu Giang'], { bg: '#5a2a14', line: '#d9b25f', fg: '#f6d98a' }), side: THREE.DoubleSide }));
  sg.position.set(0, 3.4, 159.5); group.add(sg);
  for (const x of [-2.6, 2.6]) { const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 3.6, 6), std(0x7a2c12)); pole.position.set(x, 1.8, 159.5); pole.castShadow = true; group.add(pole); }

  const signs = new Map(), huts = new Map();
  for (const p of PLOTS) {
    const sm = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.85), new THREE.MeshBasicMaterial({ map: labelTex([`Lô ${p.id}`, '…'], OPEN), side: THREE.DoubleSide }));
    sm.position.set(p.x, 1.35, p.front.z - p.face * 0.2); sm.rotation.y = p.face > 0 ? 0 : Math.PI; group.add(sm); signs.set(p.id, sm);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.3, 6), std(0x5a3a1a)); pole.position.set(p.x, 0.65, p.front.z - p.face * 0.2); group.add(pole);
    const h = new THREE.Group(), r = houseRect(p); h.position.set((r.x0 + r.x1) / 2, 0, (r.z0 + r.z1) / 2); h.visible = false; h.userData.lv = -1; group.add(h); huts.set(p.id, h);
  }
  const labelFor = (st, owner, lv) => (st === 'mine' ? [['Nhà của bạn', houseLevel(lv).ten], MINE] : st === 'taken' ? [['Có chủ', owner || 'Hàng xóm'], TAKEN] : [['Đất trống', '100 lá bồ đề'], OPEN]);
  /** reg: sổ xóm; view: xóm đang xem; me: { xom, plot } | null. */
  function refresh(reg, view, me) {
    for (const p of PLOTS) {
      const rec = reg && reg[view] && reg[view][p.id], mine = !!(me && me.xom === view && me.plot === p.id), st = mine ? 'mine' : rec ? 'taken' : 'open';
      const [lines, colors] = labelFor(st, rec && rec.name, (mine && me.lv != null ? me.lv : rec && rec.lv) | 0), sm = signs.get(p.id), old = sm.material.map;
      sm.material.map = labelTex(lines, colors); sm.material.needsUpdate = true; if (old) old.dispose();
      const hg = huts.get(p.id), lv = houseLevel(mine && me.lv != null ? me.lv : rec && rec.lv).lv;
      if ((rec || mine) && hg.userData.lv !== lv) {   // đổi cấp: dựng lại mô hình, đặt tâm theo houseRect(plot, lv)
        for (const c of [...hg.children]) { hg.remove(c); c.traverse((o) => { if (o.geometry && !o.geometry.userData.shared) o.geometry.dispose(); if (o.material && o.material.dispose && !o.material.userData.shared) o.material.dispose(); }); }   // hình/vật liệu dùng chung (shared) thì giữ
        const r = houseRect(p, lv); hg.position.set((r.x0 + r.x1) / 2, 0, (r.z0 + r.z1) / 2); hg.add(houseModel(lv, p.face)); hg.userData.lv = lv;
      }
      hg.visible = !!rec || mine;
    }
  }
  const plotPose = (id) => { const p = plotById(id); return p ? { x: p.x, z: p.z } : null; };
  return { group, refresh, plotPose };
}
