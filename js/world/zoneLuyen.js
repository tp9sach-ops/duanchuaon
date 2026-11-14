// Zone VÕ ĐƯỜNG LUYỆN CHIÊU (Phiên 150, mục 1 danh sách 14/11): ngồi vào bồ đoàn một Hệ → vào khu luyện tập để thử TẤT CẢ chiêu của Hệ đó trước khi chọn.
// LOGIC THUẦN, có test: tests/luyenchieu.test.mjs. Giống zone phó bản: vào bằng nút ở bảng bồ đoàn (viaNpc, không có cổng ở hub), KHÔNG lưu làm zone cuối (temp).
// Đặt xa hub, xa Vườn thử (500…540), Võ đài (564…596) và phó bản (≥ 680): tâm x = 640, z = 0.
import { HE_LIST } from '../data/elements.js';
import { seatOfHe, HE_SEAT_ID } from './heSeats.js';
import { standPoint } from './seats.js';

export const LUYEN_ID = 'luyen-chieu';
export const LUYEN_ARENA = Object.freeze({ cx: 640, cz: 0, r: 14, bounds: Object.freeze({ x0: 620, x1: 660, z0: -20, z1: 20 }) });
export const inLuyen = (x, z) => Math.hypot(x - LUYEN_ARENA.cx, z - LUYEN_ARENA.cz) <= LUYEN_ARENA.r;
export const LUYEN_SPAWN = Object.freeze({ x: LUYEN_ARENA.cx, z: LUYEN_ARENA.cz + 9, ry: Math.PI });
/** 3 mộc nhân (cọc gỗ) để tập chiêu, nửa phía bắc sàn. */
export const LUYEN_DUMMIES = Object.freeze([
  Object.freeze({ id: 'mn1', x: LUYEN_ARENA.cx - 5, z: LUYEN_ARENA.cz - 5 }),
  Object.freeze({ id: 'mn2', x: LUYEN_ARENA.cx, z: LUYEN_ARENA.cz - 7 }),
  Object.freeze({ id: 'mn3', x: LUYEN_ARENA.cx + 5, z: LUYEN_ARENA.cz - 5 }),
]);
/** Điểm quay về trong chánh điện: đứng ngay sau bồ đoàn của từng Hệ (tên điểm 'tu-luyen-<he>'); điểm chung 'tu-luyen' ở lối giữa. */
export const returnSpawnName = (he) => 'tu-luyen-' + he;
export const LUYEN_RETURN_DEFAULT = Object.freeze({ x: 0, z: -38.6, ry: Math.PI });
export function returnSpawnOf(he) { const s = seatOfHe(he); if (!s) return null; const p = standPoint(s); return { x: p.x, z: p.z, ry: Math.PI }; }

export const LUYEN_DEF = Object.freeze({
  id: LUYEN_ID, ten: 'Võ đường luyện chiêu', loai: 'AN', temp: true, viaNpc: true,
  bounds: LUYEN_ARENA.bounds, terrain: (x, z) => !inLuyen(x, z),
  spawns: Object.freeze({ default: LUYEN_SPAWN }),
  gates: Object.freeze([Object.freeze({ id: 've-chua', x: LUYEN_ARENA.cx, z: LUYEN_ARENA.cz + 12.5, r: 2, to: 'chua', spawn: 'tu-luyen', ten: 'Về chánh điện' })]),
  budget: Object.freeze({ meshes: 120, drawCalls: 60, textures: 4, trees: 1, maxPlayers: 1 }),
});

/** Đăng ký vào ZoneManager (thêm các điểm quay về ở hub). Gọi lại không làm gì thêm. */
export function registerLuyen(manager) {
  const had = manager.get(LUYEN_ID); if (had) return had;
  const hub = manager.get('chua');
  if (hub) {
    if (!hub.spawns['tu-luyen']) hub.spawns['tu-luyen'] = { ...LUYEN_RETURN_DEFAULT };
    for (const he of HE_LIST) { const r = returnSpawnOf(he); if (r && !hub.spawns[returnSpawnName(he)]) hub.spawns[returnSpawnName(he)] = r; }
  }
  return manager.register({ ...LUYEN_DEF, bounds: { ...LUYEN_DEF.bounds }, spawns: { default: { ...LUYEN_SPAWN } }, gates: LUYEN_DEF.gates.map((g) => ({ ...g })), budget: { ...LUYEN_DEF.budget } });
}
export { HE_SEAT_ID };
