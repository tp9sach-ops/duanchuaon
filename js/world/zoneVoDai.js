// Zone VÕ ĐÀI (Phiên 137): "khu luyện tập sân chùa" — nơi hai người giao lưu võ thuật (luật + mạng: js/world/duel.js; giao diện: js/ui/duel.js; cảnh 3D: js/scene/voDai.js).
// Đặt xa hub (x 564…596) như Vườn thử. Sàn tròn bán kính 13,2 m: ra ngoài vòng là bị chặn (terrain). Ai cũng vào được để tập một mình; giao lưu bắt đầu khi hai người chấp nhận lời mời.
import { ARENA, SIDES, toWorld, inArena } from './duel.js';

export const VODAI_ID = ARENA.id;
/** Cổng ở sân chùa (ô trống đã dò, cách vật cản ≥ 2 m). */
export const VODAI_HUB_GATE = { id: 'toi-vo-dai', x: 18, z: 13, r: 2.6, to: VODAI_ID, spawn: 'default', ten: 'Võ đài luyện tập' };
export const VODAI_RETURN_SPAWN = { x: 18, z: 8, ry: Math.PI };
const side = (i) => { const w = toWorld(SIDES[i].x, SIDES[i].z); return { x: w.x, z: w.z, ry: SIDES[i].ry }; };
const mid = () => { const w = toWorld(0, 6); return { x: w.x, z: w.z, ry: Math.PI }; };
export const VODAI_DEF = {
  id: VODAI_ID, ten: ARENA.ten, loai: 'AN',
  bounds: { ...ARENA.bounds }, terrain: (x, z) => !inArena(x, z),
  spawns: { default: mid(), a: side(0), b: side(1) },
  gates: [{ id: 've-chua', x: ARENA.cx, z: ARENA.cz + 10.5, r: 2, to: 'chua', spawn: 'tu-vo-dai', ten: 'Về chùa' }],
  budget: { meshes: 140, drawCalls: 70, textures: 4, trees: 1, maxPlayers: 30 },
};

/** Đăng ký võ đài vào ZoneManager: thêm cổng + điểm quay về ở hub, rồi đăng ký zone. Gọi lại không làm gì thêm. */
export function registerVoDai(manager) {
  const had = manager.get(VODAI_ID); if (had) return had;
  const hub = manager.get('chua'); hub.gates.push({ ...VODAI_HUB_GATE }); hub.spawns['tu-vo-dai'] = { ...VODAI_RETURN_SPAWN };
  return manager.register({ ...VODAI_DEF, spawns: Object.fromEntries(Object.entries(VODAI_DEF.spawns).map(([k, v]) => [k, { ...v }])), gates: VODAI_DEF.gates.map((g) => ({ ...g })) });
}
