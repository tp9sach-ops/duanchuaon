// Zone PHÓ BẢN (mục 4b, Phiên 139): mỗi phó bản (js/data/dungeons.js) là MỘT zone riêng, KHÔNG nằm trong map chính. LOGIC THUẦN, có test: tests/zonedungeon.test.mjs.
// Zone chỉ vào bằng NPC (bước 4c gọi LGT.dungeonZones.enter(id)): không có cổng ở hub (`viaNpc`), và KHÔNG lưu làm zone cuối (`temp`) — tải lại trang thì về chùa.
// Đặt xa hub và xa Vườn thử/Võ đài: mỗi phó bản một ô 40×40 m, tâm x = 700 + 60 × số thứ tự, z = 0. Sàn tròn bán kính 16 m: ra ngoài vòng là bị chặn.
import { DUNGEONS, DUNGEON_IDS } from '../data/dungeons.js';

export const DUNGEON_ZONE_PREFIX = 'pb-';
export const dungeonZoneId = (id) => DUNGEON_ZONE_PREFIX + id;
/** Id phó bản từ id zone ('pb-rungmoc' → 'rungmoc'); không phải zone phó bản → null. */
export const dungeonIdOfZone = (zoneId) => (typeof zoneId === 'string' && zoneId.startsWith(DUNGEON_ZONE_PREFIX) && DUNGEONS[zoneId.slice(DUNGEON_ZONE_PREFIX.length)] ? zoneId.slice(DUNGEON_ZONE_PREFIX.length) : null);

export const ARENA_R = 16;
/** Sàn của phó bản `id`: { id, cx, cz, r, bounds }; id lạ → null. */
export function arenaOf(id) {
  const i = DUNGEON_IDS.indexOf(id); if (i < 0) return null;
  const cx = 700 + 60 * i, cz = 0;
  return { id, cx, cz, r: ARENA_R, bounds: { x0: cx - 20, x1: cx + 20, z0: cz - 20, z1: cz + 20 } };
}
export const inArena = (id, x, z) => { const a = arenaOf(id); return !!a && Math.hypot(x - a.cx, z - a.cz) <= a.r; };
/** Chỗ người chơi xuất hiện khi vào (phía nam sàn, quay mặt vào giữa) và chỗ quái xuất hiện (nửa phía bắc, rải theo vòng cung). */
export function playerSpawn(id) { const a = arenaOf(id); return a && { x: a.cx, z: a.cz + 11, ry: Math.PI }; }
export function mobSpot(id, i, n) {
  const a = arenaOf(id); if (!a) return null;
  const m = Math.max(1, Math.floor(+n) || 1), k = Math.max(0, Math.floor(+i) || 0) % m, t = m === 1 ? 0.5 : k / (m - 1);   // t: 0..1 trái → phải
  const ang = Math.PI * (0.15 + 0.7 * t), rr = a.r * 0.55;   // cung phía bắc (z nhỏ hơn tâm)
  return { x: Math.round((a.cx + Math.cos(ang) * rr) * 100) / 100, z: Math.round((a.cz - Math.sin(ang) * rr) * 100) / 100 };
}
/** Điểm quay về chùa (dùng chung cho mọi phó bản; bước 4c đổi sang chỗ NPC). Cùng ô trống với lối về của Võ đài. */
export const DUNGEON_RETURN_SPAWN = { x: 18, z: 8, ry: Math.PI };

export function dungeonZoneDef(id) {
  const d = DUNGEONS[id], a = arenaOf(id); if (!d || !a) return null;
  const sp = playerSpawn(id);
  return {
    id: dungeonZoneId(id), ten: d.ten, loai: 'QUAI', temp: true, viaNpc: true,
    bounds: { ...a.bounds }, terrain: (x, z) => !inArena(id, x, z),
    spawns: { default: sp },
    gates: [{ id: 'roi-pho-ban', x: a.cx, z: a.cz + 14, r: 2, to: 'chua', spawn: 'tu-pho-ban', ten: 'Rời phó bản' }],
    budget: { meshes: 160, drawCalls: 70, textures: 4, trees: 24, maxPlayers: 1 },
  };
}

/** Đăng ký mọi zone phó bản vào ZoneManager (thêm điểm quay về ở hub). Gọi lại không làm gì thêm. */
export function registerDungeonZones(manager) {
  const hub = manager.get('chua'); if (hub && !hub.spawns['tu-pho-ban']) hub.spawns['tu-pho-ban'] = { ...DUNGEON_RETURN_SPAWN };
  for (const id of DUNGEON_IDS) if (!manager.get(dungeonZoneId(id))) manager.register(dungeonZoneDef(id));
  return DUNGEON_IDS.map((id) => manager.get(dungeonZoneId(id)));
}
