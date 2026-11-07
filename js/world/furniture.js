// Nội thất (Phiên 41, bước 1): DANH MỤC 50 món + luật mua/đặt. LOGIC THUẦN (không DOM/three.js), có test: tests/furniture.test.mjs.
// Luật ptg chốt 07/11: nhà ban đầu KHÔNG có nội thất; mua ở Shop (khi ở trạng thái sửa nhà), mỗi món một giá lá bồ đề; ban đầu 50 món, sau đó ptg yêu cầu thêm.
// Bước này CHƯA nối vào cảnh 3D/giao diện (các bước sau). Toạ độ cục bộ như interior.js (tâm phòng = 0,0; cửa ở tường +z). Giá 50–100000 lá và giới hạn 10/18/26/36 món do ptg chốt 07/11.
import { roomFor } from './interior.js';
import { spendLa } from './merit.js';

/** Số món tối đa được đặt trong phòng theo cấp nhà 0..3 (TẠM). */
export const MAX_PLACED = [10, 18, 26, 36];
const WALL_GAP = 0.02;          // chừa mép tường
const DOOR_HALF = 0.8, DOOR_DEPTH = 1.5;   // vùng trống trước cửa: |x| ≤ 0,8 và cách tường cửa ≤ 1,5 m (đồ đặc không được chặn lối vào)
const MAX_OWN = 99;

// [id, tên, loại (kind của cảnh 3D), rộng x, sâu z, cao, màu, đặc?, giá lá bồ đề]
const T = [
  ['giuong-don', 'Giường đơn', 'bed', 1.0, 2.0, 0.5, 0xd8cdb4, 1, 1300],
  ['giuong-go', 'Giường gỗ', 'bed', 1.6, 2.0, 0.55, 0x9a7a4a, 1, 7000],
  ['giuong-doi', 'Giường đôi', 'bed', 1.8, 2.1, 0.6, 0xe9e2d0, 1, 40000],
  ['sofa-nho', 'Sofa nhỏ', 'sofa', 1.6, 0.85, 0.8, 0x6a8aa8, 1, 15500],
  ['sofa-lon', 'Sofa lớn', 'sofa', 2.2, 0.9, 0.85, 0x4a6a8a, 1, 55000],
  ['sofa-dai', 'Sofa dài', 'sofa', 2.6, 0.95, 0.85, 0x6a5a8a, 1, 85000],
  ['ghe-bo', 'Ghế bành', 'sofa', 0.75, 0.75, 0.8, 0x8a5a4a, 1, 4000],
  ['ban-tra', 'Bàn trà thấp', 'table', 1.0, 0.6, 0.4, 0x8a5f36, 1, 300],
  ['ban-an', 'Bàn ăn', 'table', 1.4, 0.9, 0.75, 0x9a6a3a, 1, 13500],
  ['ban-lam-viec', 'Bàn làm việc', 'table', 1.2, 0.6, 0.75, 0x7a5230, 1, 8500],
  ['ban-tron', 'Bàn tròn', 'table', 0.9, 0.9, 0.45, 0xa8794a, 1, 1500],
  ['ban-thap', 'Bàn thấp', 'table', 0.7, 0.5, 0.35, 0x6f4a2a, 1, 90],
  ['ban-tra-do', 'Bàn trà đỏ', 'table', 0.9, 0.9, 0.5, 0xa03a32, 1, 4500],
  ['ghe-go', 'Ghế gỗ', 'chair', 0.45, 0.45, 0.8, 0x7a5230, 0, 110],
  ['ghe-xoay', 'Ghế xoay', 'chair', 0.5, 0.5, 0.9, 0x3a3f47, 0, 1750],
  ['ghe-dai', 'Ghế dài', 'bench', 1.2, 0.4, 0.45, 0x8a5f36, 1, 300],
  ['ghe-dau', 'Ghế đẩu', 'stool', 0.4, 0.4, 0.45, 0x9a7a4a, 0, 50],
  ['ghe-tre', 'Ghế đẩu tre', 'stool', 0.4, 0.4, 0.4, 0xc8b070, 0, 60],
  ['tu-quan-ao', 'Tủ quần áo', 'wardrobe', 1.4, 0.6, 2.0, 0x7a5230, 1, 30000],
  ['ke-sach', 'Kệ sách', 'shelf', 1.4, 0.4, 1.8, 0x6f4a2a, 1, 10000],
  ['ke-nho', 'Kệ nhỏ', 'shelf', 0.8, 0.35, 1.0, 0x8a5f36, 1, 400],
  ['tu-tv', 'Tủ ti vi', 'tvunit', 1.8, 0.5, 0.9, 0x4a3a2a, 1, 18000],
  ['tu-giay', 'Tủ giày', 'shelf', 1.0, 0.4, 0.8, 0x7d5f3d, 1, 450],
  ['tu-ngan-keo', 'Tủ ngăn kéo', 'shelf', 1.0, 0.45, 0.9, 0x9a7a4a, 1, 2000],
  ['ruong', 'Rương gỗ', 'crate', 0.7, 0.5, 0.5, 0x7d5f3d, 1, 130],
  ['tham-do', 'Thảm đỏ', 'rug', 3.0, 2.4, 0.02, 0xb04a4a, 0, 5000],
  ['tham-xanh', 'Thảm xanh', 'rug', 2.0, 1.4, 0.02, 0x3a5a7a, 0, 2500],
  ['tham-vang', 'Thảm vàng', 'rug', 1.8, 1.2, 0.02, 0xc9a86a, 0, 500],
  ['tham-tron', 'Thảm tròn', 'rug', 1.5, 1.5, 0.02, 0x8fbfa8, 0, 600],
  ['cay-nho', 'Cây nhỏ', 'plant', 0.4, 0.4, 0.6, 0x3f8a3a, 0, 70],
  ['cay-lon', 'Cây lớn', 'plant', 0.6, 0.6, 1.4, 0x3f8a3a, 0, 700],
  ['cay-tre', 'Cây trúc', 'plant', 0.5, 0.5, 1.6, 0x6aa84a, 0, 150],
  ['chau-hoa', 'Chậu hoa', 'plant', 0.4, 0.4, 0.5, 0xe86a7a, 0, 80],
  ['bonsai', 'Cây bonsai', 'plant', 0.5, 0.5, 0.6, 0x2f7a3a, 0, 3000],
  ['chau-sen', 'Chậu sen', 'plant', 0.6, 0.6, 0.7, 0xf2a6c0, 0, 6000],
  ['cay-cau', 'Cây cảnh cao', 'plant', 0.7, 0.7, 1.8, 0x3a7a3a, 0, 11500],
  ['den-ban', 'Đèn bàn', 'lamp', 0.2, 0.2, 0.2, 0xffd27a, 0, 170],
  ['den-san', 'Đèn cây', 'floorlamp', 0.3, 0.3, 1.5, 0xffe2a0, 0, 800],
  ['long-den-do', 'Lồng đèn đỏ', 'lantern', 0.4, 0.4, 1.2, 0xc8322b, 0, 950],
  ['den-da', 'Đèn đá', 'lantern', 0.4, 0.4, 1.0, 0x9a9a92, 0, 3500],
  ['den-bong', 'Đèn bóng', 'lamp', 0.25, 0.25, 0.25, 0xfff0c0, 0, 200],
  ['ban-tho', 'Bàn thờ', 'altar', 1.2, 0.5, 1.0, 0x6f4a2a, 1, 35000],
  ['tuong-phat', 'Tượng Phật', 'statue', 0.6, 0.6, 1.0, 0xd9b25f, 1, 65000],
  ['tuong-quan-am', 'Tượng Quan Âm', 'statue', 0.6, 0.6, 1.2, 0xf2ecdc, 1, 75000],
  ['lu-huong', 'Lư hương', 'crate', 0.4, 0.4, 0.4, 0xb08a3a, 0, 1100],
  ['be-ca', 'Bể cá nhỏ', 'tank', 0.6, 0.4, 1.0, 0x38b6d8, 1, 20000],
  ['be-ca-lon', 'Bể cá lớn', 'tank', 1.6, 0.5, 1.3, 0x38b6d8, 1, 100000],
  ['tu-lanh', 'Tủ lạnh', 'crate', 0.7, 0.7, 1.8, 0xe8e8ee, 1, 45000],
  ['may-giat', 'Máy giặt', 'crate', 0.6, 0.6, 0.9, 0xdadae2, 1, 25000],
  ['vo-nuoc', 'Vại nước', 'crate', 0.5, 0.5, 0.6, 0x7a6a58, 1, 250],
];
/** Danh mục: { id, ten, kind, w, d, h, color, solid, gia }. */
export const FURNITURE = T.map(([id, ten, kind, w, d, h, color, solid, gia]) => ({ id, ten, kind, w, d, h, color, solid: !!solid, gia }));
export const furnitureById = (id) => FURNITURE.find((f) => f.id === id) || null;

const int = (x, lo, hi) => (Number.isFinite(+x) ? Math.max(lo, Math.min(hi, Math.floor(+x))) : lo);
const isObj = (o) => o && typeof o === 'object' && !Array.isArray(o);
export const emptyFurni = () => ({ v: 1, owned: {}, placed: [], seq: 0 });

/** Đọc dữ liệu đã lưu (chuỗi JSON hoặc đối tượng), bỏ món lạ, kẹp số lượng; rác thì trả bản rỗng. `placed` = [{uid,id,x,z,rot}]. */
export function loadFurni(raw) {
  let o = raw; if (typeof raw === 'string') { try { o = JSON.parse(raw); } catch (_) { o = null; } }
  const s = emptyFurni(); if (!isObj(o)) return s;
  if (isObj(o.owned)) for (const [id, n] of Object.entries(o.owned)) if (furnitureById(id)) { const k = int(n, 0, MAX_OWN); if (k > 0) s.owned[id] = k; }
  if (Array.isArray(o.placed)) {
    const used = {}, uids = new Set();
    for (const p of o.placed.slice(0, 200)) {
      if (!isObj(p) || !furnitureById(p.id) || !Number.isFinite(+p.x) || !Number.isFinite(+p.z)) continue;
      if ((used[p.id] || 0) >= (s.owned[p.id] || 0)) continue;      // không đặt nhiều hơn số đã mua
      const uid = int(p.uid, 1, 1e9); if (uids.has(uid)) continue;
      uids.add(uid); used[p.id] = (used[p.id] || 0) + 1;
      s.placed.push({ uid, id: p.id, x: +p.x, z: +p.z, rot: int(p.rot, 0, 3) });
    }
  }
  s.seq = Math.max(int(o.seq, 0, 1e9), ...s.placed.map((p) => p.uid), 0);
  return s;
}

/** Số món `id` còn trong túi (đã mua trừ đã đặt). */
export const freeCount = (st, id) => Math.max(0, (st.owned[id] || 0) - st.placed.filter((p) => p.id === id).length);

/** Mua 1 món bằng lá bồ đề. leaf = trạng thái lá (merit.js). Trả { ok, reason: ''|'unknown'|'poor'|'max', leaf, st }; không sửa đầu vào. */
export function buyItem(leaf, st, id) {
  const f = furnitureById(id); if (!f) return { ok: false, reason: 'unknown', leaf, st };
  if ((st.owned[id] || 0) >= MAX_OWN) return { ok: false, reason: 'max', leaf, st };
  const r = spendLa(leaf, f.gia); if (!r.ok) return { ok: false, reason: 'poor', leaf, st };
  return { ok: true, reason: '', leaf: r.leaf, st: { ...st, owned: { ...st.owned, [id]: (st.owned[id] || 0) + 1 }, placed: st.placed.slice() } };
}

/** Kích thước chiếm sàn sau khi xoay rot (0..3, mỗi bước 90°): rot lẻ thì đổi chỗ rộng/sâu. */
export const footprint = (f, rot = 0) => (rot % 2 ? { rw: f.d, rd: f.w } : { rw: f.w, rd: f.d });

/** Món đã đặt → dạng interior.js/cảnh 3D dùng: { uid,id,kind,x,z,w,d,rw,rd,h,color,solid,ry }. */
export function toFurniture(p) {
  const f = furnitureById(p.id); if (!f) return null;
  const fp = footprint(f, p.rot | 0);
  return { uid: p.uid, id: f.id, kind: f.kind, x: p.x, z: p.z, w: f.w, d: f.d, rw: fp.rw, rd: fp.rd, h: f.h, color: f.color, solid: f.solid, ry: (p.rot | 0) * Math.PI / 2 };
}

/**
 * Có đặt được món `id` tại (x,z) cục bộ, xoay rot, trong phòng cấp lv không? placed = danh sách đã đặt; ignoreUid = món đang được dời (bỏ qua chính nó).
 * Trả { ok, reason: ''|'unknown'|'full'|'out'|'door'|'overlap' }. Món không đặc (thảm, đèn, ghế, cây) được đè lên nhau; món đặc không đè món đặc khác và không chặn lối vào cửa.
 */
export function canPlace(lv, placed, id, x, z, rot = 0, ignoreUid = 0) {
  const f = furnitureById(id); if (!f || !Number.isFinite(+x) || !Number.isFinite(+z)) return { ok: false, reason: 'unknown' };
  const room = roomFor(lv), others = placed.filter((p) => p.uid !== ignoreUid);
  if (others.length >= MAX_PLACED[Math.max(0, Math.min(3, lv | 0))]) return { ok: false, reason: 'full' };
  const { rw, rd } = footprint(f, rot);
  if (x - rw / 2 < -room.w / 2 + WALL_GAP || x + rw / 2 > room.w / 2 - WALL_GAP || z - rd / 2 < -room.d / 2 + WALL_GAP || z + rd / 2 > room.d / 2 - WALL_GAP) return { ok: false, reason: 'out' };
  if (f.solid) {
    if (x + rw / 2 > -DOOR_HALF && x - rw / 2 < DOOR_HALF && z + rd / 2 > room.d / 2 - DOOR_DEPTH) return { ok: false, reason: 'door' };
    for (const p of others) {
      const g = furnitureById(p.id); if (!g || !g.solid) continue;
      const q = footprint(g, p.rot | 0);
      if (Math.abs(x - p.x) < (rw + q.rw) / 2 - 1e-9 && Math.abs(z - p.z) < (rd + q.rd) / 2 - 1e-9) return { ok: false, reason: 'overlap' };
    }
  }
  return { ok: true, reason: '' };
}

/** Đặt món (đã có trong túi) vào phòng. Trả { ok, reason, st }; thiếu trong túi → reason 'none'. Không sửa đầu vào. */
export function placeItem(st, lv, id, x, z, rot = 0) {
  if (freeCount(st, id) < 1) return { ok: false, reason: furnitureById(id) ? 'none' : 'unknown', st };
  const c = canPlace(lv, st.placed, id, x, z, rot); if (!c.ok) return { ok: false, reason: c.reason, st };
  const uid = st.seq + 1, r = int(rot, 0, 3);
  return { ok: true, reason: '', st: { ...st, seq: uid, placed: [...st.placed, { uid, id, x: +x, z: +z, rot: r }] } };
}
/** Cất món đã đặt về túi (không mất). */
export const pickUp = (st, uid) => (st.placed.some((p) => p.uid === uid) ? { ok: true, st: { ...st, placed: st.placed.filter((p) => p.uid !== uid) } } : { ok: false, st });

/** Tự tìm chỗ trống để đặt món `id` (thử không xoay rồi xoay 90°, quét từ tường sau ra cửa, bước 0,25 m). Trả { ok, reason: ''|'unknown'|'none'|'full'|'nospace', st }. */
export function autoPlace(st, lv, id) {
  const f = furnitureById(id); if (!f) return { ok: false, reason: 'unknown', st };
  if (freeCount(st, id) < 1) return { ok: false, reason: 'none', st };
  if (st.placed.length >= MAX_PLACED[Math.max(0, Math.min(3, lv | 0))]) return { ok: false, reason: 'full', st };
  const room = roomFor(lv);
  for (const rot of [0, 1]) {
    const { rw, rd } = footprint(f, rot);
    for (let z = -room.d / 2 + rd / 2 + 0.05; z <= room.d / 2 - rd / 2; z += 0.25) for (let x = -room.w / 2 + rw / 2 + 0.05; x <= room.w / 2 - rw / 2; x += 0.25) {
      const px = Math.round(x * 100) / 100, pz = Math.round(z * 100) / 100;
      if (canPlace(lv, st.placed, id, px, pz, rot).ok) return placeItem(st, lv, id, px, pz, rot);
    }
  }
  return { ok: false, reason: 'nospace', st };
}
/** Dời món đã đặt `uid` thêm (dx, dz) mét. Trả { ok, reason (như canPlace hoặc 'missing'), st }. */
export function moveItem(st, lv, uid, dx, dz) {
  const p = st.placed.find((q) => q.uid === uid); if (!p) return { ok: false, reason: 'missing', st };
  const x = Math.round((p.x + dx) * 100) / 100, z = Math.round((p.z + dz) * 100) / 100, c = canPlace(lv, st.placed, p.id, x, z, p.rot, uid);
  if (!c.ok) return { ok: false, reason: c.reason, st };
  return { ok: true, reason: '', st: { ...st, placed: st.placed.map((q) => (q.uid === uid ? { ...q, x, z } : q)) } };
}
/** Xoay món đã đặt thêm 90° (thử tối đa 3 hướng cho tới khi đặt được tại chỗ cũ). */
export function rotateItem(st, lv, uid) {
  const p = st.placed.find((q) => q.uid === uid); if (!p) return { ok: false, reason: 'missing', st };
  for (let k = 1; k <= 3; k++) {
    const rot = (p.rot + k) % 4;
    if (canPlace(lv, st.placed, p.id, p.x, p.z, rot, uid).ok) return { ok: true, reason: '', st: { ...st, placed: st.placed.map((q) => (q.uid === uid ? { ...q, rot } : q)) } };
  }
  return { ok: false, reason: 'blocked', st };
}

// ---- Phiên 43: chế độ chỉnh sửa trong nhà (kéo bằng chuột / xoay bằng cuộn chuột)
/** Làm tròn về lưới `step` mét (mặc định 5 cm) để món nằm gọn, không lệch lẻ. */
export const snap = (v, step = 0.05) => Math.round(Math.round(v / step) * step * 100) / 100;
/** Kẹp tâm món `id` (xoay rot) vào trong phòng cấp lv: kéo sát tường thì món dính vào tường thay vì báo lỗi. Trả { x, z } đã làm tròn lưới. */
export function clampPose(lv, id, x, z, rot = 0) {
  const f = furnitureById(id), room = roomFor(lv); if (!f) return { x: +x || 0, z: +z || 0 };
  const { rw, rd } = footprint(f, rot), mx = room.w / 2 - WALL_GAP - rw / 2, mz = room.d / 2 - WALL_GAP - rd / 2;
  return { x: snap(Math.max(-mx, Math.min(mx, +x || 0))), z: snap(Math.max(-mz, Math.min(mz, +z || 0))) };
}
/** Đặt món đã đặt `uid` về vị trí (x,z) và hướng rot trong một bước (dùng khi thả chuột). Trả { ok, reason (như canPlace hoặc 'missing'), st }; không đặt được thì st giữ nguyên. */
export function setPose(st, lv, uid, x, z, rot) {
  const p = st.placed.find((q) => q.uid === uid); if (!p) return { ok: false, reason: 'missing', st };
  const r = int(rot, 0, 3), c0 = clampPose(lv, p.id, x, z, r), c = canPlace(lv, st.placed, p.id, c0.x, c0.z, r, uid);
  if (!c.ok) return { ok: false, reason: c.reason, st };
  return { ok: true, reason: '', st: { ...st, placed: st.placed.map((q) => (q.uid === uid ? { ...q, x: c0.x, z: c0.z, rot: r } : q)) } };
}
