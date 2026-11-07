// Bên trong nhà (Phiên 38, bước 3d-2a): mỗi nhà của người chơi có MỘT PHÒNG RIÊNG dựng ở xa bản đồ (INTERIOR); bước qua cửa là dịch chuyển vào, nút "Ra ngoài" để về sân.
// DỮ LIỆU + LOGIC THUẦN (không DOM/three.js), có test: tests/interior.test.mjs. Phòng luôn ở cùng một chỗ; chỉ phòng của cấp nhà hiện tại được đăng ký vào layout.js (registerRoom).
// Tọa độ nội thất là CỤC BỘ (tâm phòng = 0,0; cửa ở tường +z, nhìn vào phòng là hướng −z). Mọi con số là quy ước TẠM chờ ptg duyệt.
import { addWalk, addRect, WALKS, RECTS } from './layout.js';
import { houseLevel, houseRect, plotById } from './land.js';

/** Tâm phòng trong thế giới: xa mọi khu vực (lưới tìm đường chỉ phủ x −130…130, z −80…220) nên không đè lên cảnh ngoài. */
export const INTERIOR = { x: 400, z: 400 };
/** Bán kính (m) quanh cửa nhà mà nút "Vào nhà" hiện. Phủ cả điểm đứng ngoài đường của lô (plot.front cách cửa ≤ 7,2 m). */
export const DOOR_R = 8;

// item: { id, kind, x, z, w, d, h, solid, color, y? }  (x,z = tâm; solid = chặn đi bộ, h = chiều cao để camera bay qua phía trên)
const it = (id, kind, x, z, w, d, h, color, solid = true) => ({ id, kind, x, z, w, d, h, color, solid });
const BASE0 = [
  it('mat', 'rug', -1.0, 0.2, 1.8, 2.2, 0.02, 0xc9a86a, false), it('bed', 'bed', -2.0, -1.4, 1.6, 2.0, 0.55, 0x9a7a4a),
  it('table', 'table', 1.6, -1.6, 1.2, 0.8, 0.45, 0x8a5f36), it('lamp', 'lamp', 1.6, -1.6, 0.2, 0.2, 0.2, 0xffd27a, false),
  it('crate', 'crate', 2.3, -0.4, 0.7, 0.7, 0.6, 0x7d5f3d), it('shelf', 'shelf', 0.2, -2.2, 1.4, 0.4, 1.6, 0x6f4a2a),
];
const BASE1 = [
  it('rug', 'rug', 1.6, -0.9, 3.0, 2.4, 0.02, 0xb04a4a, false), it('wardrobe', 'wardrobe', -2.5, -2.5, 1.4, 0.6, 2.0, 0x7a5230),
  it('bed', 'bed', -2.4, -0.95, 1.8, 2.1, 0.6, 0xe9e2d0), it('tvunit', 'tvunit', 1.8, -2.55, 1.8, 0.5, 0.9, 0x4a3a2a),
  it('sofa', 'sofa', 1.6, -0.5, 2.2, 0.9, 0.85, 0x4a6a8a), it('coffee', 'table', 1.6, -1.5, 1.0, 0.6, 0.4, 0x8a5f36),
  it('dining', 'table', 2.3, 1.4, 1.4, 0.9, 0.75, 0x9a6a3a), it('chair1', 'chair', 2.3, 0.7, 0.45, 0.45, 0.8, 0x7a5230, false), it('chair2', 'chair', 2.3, 2.1, 0.45, 0.45, 0.8, 0x7a5230, false),
  it('stairs', 'stairs', -2.9, 1.5, 1.0, 2.2, 2.4, 0xcdb590), it('plant', 'plant', -1.2, 2.3, 0.5, 0.5, 1.1, 0x3f8a3a),
];
const EXTRA2 = [it('books', 'shelf', 0.0, -2.6, 1.6, 0.4, 2.0, 0x6f4a2a), it('tank', 'tank', -1.3, -2.6, 0.6, 0.4, 1.0, 0x38b6d8), it('plant2', 'plant', 3.0, 2.45, 0.5, 0.5, 1.1, 0x3f8a3a)];
const LV3 = [
  it('rug', 'rug', 1.4, -0.8, 3.6, 2.6, 0.02, 0x3a5a7a, false), it('wardrobe', 'wardrobe', -3.0, -2.7, 1.6, 0.6, 2.1, 0x7a5230),
  it('bed', 'bed', -3.2, -1.2, 2.0, 2.2, 0.65, 0xf2ecdc), it('tvunit', 'tvunit', 1.9, -2.75, 2.2, 0.5, 0.9, 0x2a2a2e),
  it('sofa', 'sofa', 1.4, -0.4, 2.6, 0.95, 0.85, 0x6a5a8a), it('coffee', 'table', 1.4, -1.5, 1.1, 0.7, 0.4, 0x3a3f47),
  it('books', 'shelf', -0.2, -2.75, 1.2, 0.4, 2.0, 0x6f4a2a), it('tank', 'tank', 4.0, -1.6, 0.5, 1.6, 1.3, 0x38b6d8),
  it('dining', 'table', 2.8, 1.5, 2.0, 1.0, 0.75, 0x9a6a3a), it('chair1', 'chair', 2.8, 0.75, 0.45, 0.45, 0.8, 0x7a5230, false), it('chair2', 'chair', 2.8, 2.25, 0.45, 0.45, 0.8, 0x7a5230, false),
  it('stairs', 'stairs', -3.8, 1.7, 1.0, 2.4, 2.6, 0xcdb590), it('plant', 'plant', -1.6, 2.6, 0.5, 0.5, 1.1, 0x3f8a3a), it('plant2', 'plant', 4.0, 2.6, 0.5, 0.5, 1.1, 0x3f8a3a),
];
/** 4 phòng theo cấp nhà. w = rộng (x), d = sâu (z), h = trần. Cửa ở giữa tường +z. */
export const ROOMS = [
  { lv: 0, w: 5.6, d: 4.8, h: 2.5, furniture: BASE0 },
  { lv: 1, w: 6.8, d: 5.6, h: 3.0, furniture: BASE1 },
  { lv: 2, w: 6.8, d: 5.6, h: 3.0, furniture: [...BASE1, ...EXTRA2] },
  { lv: 3, w: 8.6, d: 6.0, h: 3.4, furniture: LV3 },
];
/** Phòng của cấp nhà `lv` (kẹp 0..3 như houseLevel). */
export const roomFor = (lv) => ROOMS[houseLevel(lv).lv];
const W = (lx, lz) => ({ x: INTERIOR.x + lx, z: INTERIOR.z + lz });
/** Vùng đi bộ của phòng (tọa độ thế giới). Mép sàn = mép tường. */
export function roomRect(lv) { const r = roomFor(lv); return { x0: INTERIOR.x - r.w / 2, x1: INTERIOR.x + r.w / 2, z0: INTERIOR.z - r.d / 2, z1: INTERIOR.z + r.d / 2 }; }
/** Cửa phòng (cục bộ tới thế giới) và chỗ đứng ngay sau cửa khi bước vào, nhìn vào phòng (ry = π: hướng −z). */
export function entryPoint(lv) { const r = roomFor(lv), p = W(0, r.d / 2 - 1.1); return { x: p.x, z: p.z, ry: Math.PI }; }
export function doorInside(lv) { const r = roomFor(lv); return W(0, r.d / 2); }
/** Người ở trong vùng cửa (cách tường cửa ≤ 1 m, lệch ≤ 1 m)? Dùng để gợi ý "Ra ngoài". */
export function atDoor(p, lv) { const d = doorInside(lv); return Math.abs(p.x - d.x) <= 1 && d.z - p.z <= 1; }
/** Điểm (x,z) thuộc khu phòng riêng (mọi cấp), để các hệ thống khác (mưa, chuông...) biết người chơi đang ở trong nhà. */
export const isInterior = (x, z) => Math.abs(x - INTERIOR.x) <= 12 && Math.abs(z - INTERIOR.z) <= 12;
/** Vật cản (chữ nhật thế giới, có h) của đồ nội thất `solid` của phòng cấp lv. */
export const furnitureRects = (lv) => roomFor(lv).furniture.filter((f) => f.solid).map((f) => ({ x0: INTERIOR.x + f.x - f.w / 2, x1: INTERIOR.x + f.x + f.w / 2, z0: INTERIOR.z + f.z - f.d / 2, z1: INTERIOR.z + f.z + f.d / 2, h: f.h }));
/**
 * Đăng ký phòng cấp lv vào layout.js (vùng đi bộ + vật cản nội thất). Trả hàm gỡ đăng ký (khôi phục đúng như trước). Mỗi lần chỉ nên đăng ký MỘT phòng.
 */
export function registerRoom(lv) {
  const walk = roomRect(lv), rects = furnitureRects(lv);
  addWalk(walk); for (const r of rects) addRect(r);
  return () => { const i = WALKS.indexOf(walk); if (i >= 0) WALKS.splice(i, 1); for (const r of rects) { const j = RECTS.indexOf(r); if (j >= 0) RECTS.splice(j, 1); } };
}

/** Cửa trước của nhà ngoài sân (thế giới). Nhà trống/lầu/hoa viên: cửa giữa; villa: cửa lệch phải 0,65·hw (khớp js/scene/land.js). */
export function doorPoint(plot, lv = 0) {
  const h = houseLevel(lv), r = houseRect(plot, h.lv), cz = (r.z0 + r.z1) / 2;
  return { x: plot.x + (h.lv >= 3 ? h.hw * 0.65 : 0), z: cz + plot.face * (h.hd + 0.04) };
}
/** Người chơi p = {x,z} đủ gần cửa nhà (trong DOOR_R) để vào nhà? */
export const nearDoor = (p, plot, lv = 0) => { const d = doorPoint(plot, lv); return Math.hypot(p.x - d.x, p.z - d.z) <= DOOR_R; };

/**
 * Kế hoạch vào nhà của MÌNH. land = trạng thái đất (loadLand), p = vị trí người chơi.
 * Trả { ok, reason: ''|'noland'|'far'|'inside', lv, spawn:{x,z,ry} }. Không sửa đầu vào.
 */
export function enterPlan(land, p) {
  const own = land && land.own, pl = own ? plotById(own.plot) : null;
  if (!own || !pl) return { ok: false, reason: 'noland', lv: 0, spawn: null };
  const lv = houseLevel(own.lv).lv;
  if (isInterior(p.x, p.z)) return { ok: false, reason: 'inside', lv, spawn: null };
  if (!nearDoor(p, pl, lv)) return { ok: false, reason: 'far', lv, spawn: null };
  return { ok: true, reason: '', lv, spawn: entryPoint(lv) };
}
/** Điểm ra ngoài: chỗ đứng trước lô (plot.front), nhìn ra phía đường. Trả null nếu chưa có đất. */
export function exitPlan(land) {
  const own = land && land.own, pl = own ? plotById(own.plot) : null; if (!pl) return null;
  return { x: pl.front.x, z: pl.front.z, ry: pl.face > 0 ? 0 : Math.PI };
}

/** Nút nổi nào nên hiện? 'exit' (đang ở trong phòng), 'enter' (đứng gần cửa nhà mình), '' (không hiện gì). land = trạng thái đất, p = vị trí người chơi. */
export function houseAction(land, p) {
  if (!land || !land.own || !p) return '';
  if (isInterior(p.x, p.z)) return 'exit';
  return enterPlan(land, p).ok ? 'enter' : '';
}
