// Bên trong nhà (Phiên 38, bước 3d-2a): mỗi nhà của người chơi có MỘT PHÒNG RIÊNG dựng ở xa bản đồ (INTERIOR); bước qua cửa là dịch chuyển vào, nút "Ra ngoài" để về sân.
// DỮ LIỆU + LOGIC THUẦN (không DOM/three.js), có test: tests/interior.test.mjs. Phòng luôn ở cùng một chỗ; chỉ phòng của cấp nhà hiện tại được đăng ký vào layout.js (registerRoom).
// Tọa độ nội thất là CỤC BỘ (tâm phòng = 0,0; cửa ở tường +z, nhìn vào phòng là hướng −z). Mọi con số là quy ước TẠM chờ ptg duyệt.
import { addWalk, addRect, WALKS, RECTS } from './layout.js';
import { houseLevel, houseRect, plotById } from './land.js';

/** Tâm phòng trong thế giới: xa mọi khu vực (lưới tìm đường chỉ phủ x −130…130, z −80…220) nên không đè lên cảnh ngoài. */
export const INTERIOR = { x: 400, z: 400 };
/** Bán kính (m) quanh cửa nhà mà nút "Vào nhà" hiện. Phủ cả điểm đứng ngoài đường của lô (plot.front cách cửa ≤ 7,2 m). */
export const DOOR_R = 8;

// Phiên 41: nhà BAN ĐẦU TRỐNG (ptg chốt 07/11). Nội thất do người chơi mua và đặt (js/world/furniture.js), rồi truyền vào registerRoom/furnitureRects và cảnh 3D.
// Một món đã đặt (kết quả của furniture.toFurniture): { uid, id, kind, x, z, w, d, rw, rd (đã xoay, dùng cho va chạm), h, color, solid, ry }.
/** 4 phòng theo cấp nhà. w = rộng (x), d = sâu (z), h = trần. Cửa ở giữa tường +z. `furniture` (đồ có sẵn) luôn rỗng. */
export const ROOMS = [
  { lv: 0, w: 5.6, d: 4.8, h: 2.5, furniture: [] },
  { lv: 1, w: 6.8, d: 5.6, h: 3.0, furniture: [] },
  { lv: 2, w: 6.8, d: 5.6, h: 3.0, furniture: [] },
  { lv: 3, w: 8.6, d: 6.0, h: 3.4, furniture: [] },
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
/** Vật cản (chữ nhật thế giới, có h) của đồ nội thất `solid`. `placed` = món người chơi đã đặt (furniture.toFurniture); bỏ trống = phòng trống. Món xoay dùng rw/rd. */
export const furnitureRects = (lv, placed = []) => [...roomFor(lv).furniture, ...placed].filter((f) => f.solid).map((f) => { const w = f.rw || f.w, d = f.rd || f.d; return { x0: INTERIOR.x + f.x - w / 2, x1: INTERIOR.x + f.x + w / 2, z0: INTERIOR.z + f.z - d / 2, z1: INTERIOR.z + f.z + d / 2, h: f.h }; });
/**
 * Đăng ký phòng cấp lv vào layout.js (vùng đi bộ + vật cản của các món đã đặt). Trả hàm gỡ đăng ký (khôi phục đúng như trước). Mỗi lần chỉ nên đăng ký MỘT phòng.
 * Đổi bố trí nội thất thì gỡ rồi đăng ký lại.
 */
export function registerRoom(lv, placed = []) {
  const walk = roomRect(lv), rects = furnitureRects(lv, placed);
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

/**
 * Vị trí để GỬI LÊN MẠNG (Phiên 40, sửa L4). Phòng trong nhà nằm ở INTERIOR (400,400), ngoài giới hạn ±200 của Firebase/Apps Script,
 * nên khi người chơi đang ở trong phòng thì người khác thấy họ đứng ở chỗ trước cửa nhà (exitPlan). Ở ngoài thì giữ nguyên p.
 * Trả {x, z, r} (r = hướng nhìn nếu bị thay), không sửa đầu vào.
 */
export function netPos(land, p) {
  if (!p || !isInterior(p.x, p.z)) return { x: p ? p.x : 0, z: p ? p.z : 0, r: null };
  const out = exitPlan(land);
  return out ? { x: out.x, z: out.z, r: out.ry } : { x: 0, z: 0, r: null };
}
