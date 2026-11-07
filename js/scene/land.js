// Khu dân cư "xóm" (Phiên 36, bước 2): đường lát gạch xuống xóm + đường giữa, 10 lô đất có cột mốc và bảng số, nhà trống thô sơ được tặng.
// Dữ liệu ở js/world/land.js (có test). refresh(land, reg) dựng lại bảng trạng thái từng lô và nhà theo xóm đang XEM.
// Nhà trống thô sơ: vách ván, mái tôn, cửa gỗ, chưa có nội thất. Phiên 37 (3b): thêm nhà lầu, nhà hoa viên, villa hồ bơi (houseModel theo cấp lv).
import * as THREE from 'three';
import { villageTileTexture } from './textures.js';
import { PLOTS, LAND_WALKS, LANE_Z, LOT_W, LOT_D, HOUSE_LEVELS, houseLevel, houseRect, plotById } from '../world/land.js';

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

/** Nhà trống thô sơ quay mặt ra đường (face = +1: cửa hướng +z; −1: hướng −z). Gốc nhóm ở tâm thân nhà. */
function hut(face) {
  const { hw, hd } = HOUSE_LEVELS[0], g = new THREE.Group();
  const wall = std(0x9b7a52), wall2 = std(0x7d5f3d), roof = std(0x8a8f96, { roughness: 0.6, metalness: 0.3 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(hw * 2, 2.3, hd * 2), wall); body.position.y = 1.15; body.castShadow = body.receiveShadow = true; g.add(body);
  for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(hw * 2 + 0.06, 0.06, hd * 2 + 0.06), wall2); b.position.y = 0.3 + i * 0.38; g.add(b); }   // đường ván ngang
  const sh = new THREE.Shape(); sh.moveTo(-hw - 0.5, 0); sh.lineTo(hw + 0.5, 0); sh.lineTo(0, 1.4); sh.closePath();
  const rg = new THREE.ExtrudeGeometry(sh, { depth: hd * 2 + 1, bevelEnabled: false }); rg.translate(0, 0, -hd - 0.5);
  const r = new THREE.Mesh(rg, roof); r.position.y = 2.3; r.castShadow = true; g.add(r);
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.7, 0.1), std(0x4a2f1a)); door.position.set(0, 0.85, face * (hd + 0.04)); g.add(door);
  const win = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.7, 0.08), std(0xf0d9a0, { emissive: 0xffb050, emissiveIntensity: 0.25 })); win.position.set(hw * 0.55, 1.3, face * (hd + 0.04)); g.add(win);
  return g;
}

const box = (w, h, d, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; return m; };
/** Mái chóp 4 mặt phủ hình chữ nhật W×D, cao h, đáy ở y. */
function hipRoof(W, D, h, y, mat) { const m = new THREE.Mesh(new THREE.ConeGeometry(W / Math.SQRT2, h, 4), mat); m.rotation.y = Math.PI / 4; m.scale.z = D / W; m.position.y = y + h / 2; m.castShadow = true; return m; }
/** Hai hàng cửa sổ + cửa chính ở mặt trước (z = +hd, hướng +z). */
function frontDetails(g, hw, hd, floors, fh, doorMat, winMat) {
  g.add(box(0.95, 1.8, 0.1, doorMat, 0, 0.9, hd + 0.04));
  for (let f = 0; f < floors; f++) for (const sx of f === 0 ? [-1, 1] : [-1, 0, 1]) g.add(box(0.8, 0.9, 0.08, winMat, sx * hw * 0.55, f * fh + 1.5, hd + 0.04));
}
/** Nhà lầu 2 tầng, mái ngói chóp, ban công tầng 2. */
function mansion(hw, hd) {
  const g = new THREE.Group(), wall = std(0xeadfc6), trim = std(0xb89a6a), tile = std(0xb04a2a, { roughness: 0.7 }), door = std(0x4a2f1a), win = std(0xf0d9a0, { emissive: 0xffb050, emissiveIntensity: 0.25 });
  g.add(box(hw * 2, 5.2, hd * 2, wall, 0, 2.6, 0)); g.add(box(hw * 2 + 0.2, 0.18, hd * 2 + 0.2, trim, 0, 2.62, 0));
  g.add(hipRoof(hw * 2 + 1, hd * 2 + 1, 1.9, 5.2, tile));
  frontDetails(g, hw, hd, 2, 2.6, door, win);
  g.add(box(hw * 1.2, 0.12, 0.9, trim, 0, 2.6, hd + 0.45));   // sàn ban công
  for (let i = 0; i <= 6; i++) g.add(box(0.06, 0.8, 0.06, trim, -hw * 0.6 + i * hw * 0.2, 3.04, hd + 0.88));
  g.add(box(hw * 1.2, 0.07, 0.07, trim, 0, 3.46, hd + 0.88));
  return g;
}
/** Nhà hoa viên: nhà lầu + vườn trước nhà (hàng rào thấp, luống hoa nhiều màu, hai cây). */
function gardenHouse(hw, hd) {
  const g = mansion(hw, hd), grass = std(0x5f9a4a), fence = std(0xf3ead4), leaf = std(0x3f8a3a), trunk = std(0x6a4a2a);
  const gz0 = hd + 1.4, gz1 = hd + 3.6, gw = hw * 2 - 0.2;
  const lawn = new THREE.Mesh(new THREE.PlaneGeometry(gw, gz1 - gz0), grass); lawn.rotation.x = -Math.PI / 2; lawn.position.set(0, 0.06, (gz0 + gz1) / 2); lawn.receiveShadow = true; g.add(lawn);
  for (const x of [-gw / 2, gw / 2]) g.add(box(0.06, 0.55, gz1 - gz0, fence, x, 0.3, (gz0 + gz1) / 2));
  g.add(box(gw, 0.55, 0.06, fence, 0, 0.3, gz1));
  const cols = [0xe8508a, 0xf2c230, 0xffffff, 0xd9482b, 0xb06ae0];
  for (let i = 0; i < 12; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 6), std(cols[i % cols.length])); f.position.set(-gw / 2 + 0.45 + (i % 6) * (gw - 0.9) / 5, 0.22, gz0 + 0.5 + (i < 6 ? 0 : 1.1)); g.add(f); }
  for (const x of [-hw - 0.9, hw + 0.9]) { const t = box(0.22, 1.3, 0.22, trunk, x, 0.65, hd + 2.2), c = new THREE.Mesh(new THREE.SphereGeometry(0.95, 10, 8), leaf); c.position.set(x, 1.9, hd + 2.2); c.castShadow = true; g.add(t, c); }
  return g;
}
/** Villa hồ bơi: khối hiện đại mái phẳng, cửa kính lớn, hồ bơi nước xanh trước nhà (hồ chỉ trang trí, va chạm hồ làm ở 3d). */
function villa(hw, hd) {
  const g = new THREE.Group(), wall = std(0xf4f1ea), dark = std(0x3a3f47), glass = std(0x8fd0e8, { roughness: 0.15, metalness: 0.3, emissive: 0x2a5a70, emissiveIntensity: 0.2 }), wood = std(0x9a6a3a), door = std(0x4a2f1a);
  g.add(box(hw * 2, 3, hd * 2, wall, 0, 1.5, 0));
  g.add(box(hw * 1.3, 3, hd * 1.6, wall, -hw * 0.35, 4.5, -hd * 0.2));   // tầng 2 thụt lệch
  g.add(box(hw * 2 + 0.5, 0.25, hd * 2 + 0.5, dark, 0, 3.12, 0)); g.add(box(hw * 1.3 + 0.4, 0.25, hd * 1.6 + 0.4, dark, -hw * 0.35, 6.12, -hd * 0.2));
  g.add(box(hw * 1.5, 2.2, 0.1, glass, -hw * 0.1, 1.2, hd + 0.04));   // vách kính tầng trệt
  g.add(box(hw * 1.0, 1.4, 0.1, glass, -hw * 0.35, 4.3, hd * 1.4 + 0.04));
  g.add(box(0.95, 1.9, 0.1, door, hw * 0.65, 0.95, hd + 0.05));
  g.add(box(hw * 0.5, 0.1, 1.1, wood, hw * 0.65, 3.0, hd + 0.5));   // mái hiên cửa
  const pw = hw * 1.7, pz0 = hd + 0.8, pz1 = hd + 3.8;
  g.add(box(pw + 0.5, 0.08, pz1 - pz0 + 0.5, wood, 0, 0.04, (pz0 + pz1) / 2));   // sàn gỗ quanh hồ
  const water = new THREE.Mesh(new THREE.PlaneGeometry(pw, pz1 - pz0), new THREE.MeshStandardMaterial({ color: 0x38b6d8, roughness: 0.1, metalness: 0.2, emissive: 0x1a6a88, emissiveIntensity: 0.35 }));
  water.rotation.x = -Math.PI / 2; water.position.set(0, 0.1, (pz0 + pz1) / 2); g.add(water);
  for (const sx of [-1, 1]) g.add(box(0.2, 0.9, 0.2, dark, sx * (pw / 2 + 0.3), 0.45, pz1 + 0.3));   // hai cột cổng hồ
  return g;
}
/** Mô hình nhà theo cấp lv, quay mặt ra đường (face = +1 hướng +z; −1 hướng −z). Gốc ở tâm thân nhà. */
export function houseModel(lv, face) {
  const L = houseLevel(lv);
  if (L.lv === 0) return hut(face);
  const g = new THREE.Group(); g.add(L.lv === 1 ? mansion(L.hw, L.hd) : L.lv === 2 ? gardenHouse(L.hw, L.hd) : villa(L.hw, L.hd));
  g.rotation.y = face > 0 ? 0 : Math.PI; return g;
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
        for (const c of [...hg.children]) { hg.remove(c); c.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material && o.material.dispose) o.material.dispose(); }); }
        const r = houseRect(p, lv); hg.position.set((r.x0 + r.x1) / 2, 0, (r.z0 + r.z1) / 2); hg.add(houseModel(lv, p.face)); hg.userData.lv = lv;
      }
      hg.visible = !!rec || mine;
    }
  }
  const plotPose = (id) => { const p = plotById(id); return p ? { x: p.x, z: p.z } : null; };
  return { group, refresh, plotPose };
}
