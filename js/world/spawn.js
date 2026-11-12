// Quái cố định ở bãi rừng: sinh, hồi sinh, nhận sát thương (G3.6, GDD v2 mục 8). LOGIC THUẦN (không DOM, không three.js, không đọc đồng hồ, không Math.random):
// nơi gọi truyền `rng` (hàm trả [0,1), ví dụ rngSeed của yeuquai.js) và `dt` (giây). Quái sinh CỤC BỘ theo từng người, không đồng bộ mạng.
// Số liệu: js/data/monsters.js (TẠM). Test: tests/spawn.test.mjs. CHƯA nối cảnh 3D / giao diện / lưu (việc của G1.6 và các mục sau).
// Hàm sửa `sp` TẠI CHỖ (giống stepBoss trong yeuquai.js). Người chơi truyền vào dạng { x, z } hoặc null.
import { MONSTERS, FARM_ZONES, RESPAWN_CFG, SPAWN_CFG, MON_CFG, FARM_CFG } from '../data/monsters.js';
import { statsOf } from './stats.js';

const num = (x, d = 0) => (Number.isFinite(+x) ? +x : d);
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const inRect = (r, x, z) => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1;
export const ZONE_IDS = Object.freeze(Object.keys(FARM_ZONES));

/** Id vùng farm chứa điểm (x, z), hoặc null. Toạ độ lạ (NaN, chữ) → null. */
export function zoneAt(x, z) {
  const px = num(x, NaN), pz = num(z, NaN);
  for (const id of ZONE_IDS) if (FARM_ZONES[id].rects.some((r) => inRect(r, px, pz))) return id;
  return null;
}

/** Vùng có quái hiện lúc này không? `nightOnly` → chỉ khi `night` (số 0..1 hoặc bool) vượt FARM_CFG.nightAt. Vùng lạ → false. */
export function zoneOpen(zoneId, night) {
  const z = FARM_ZONES[zoneId]; if (!z) return false;
  if (!z.nightOnly) return true;
  return night === true || num(night, 0) > FARM_CFG.nightAt;
}

/** Oán Khí tối đa của một loại quái; loại lạ → 0. */
export function oanKhiMaxOf(typeId) {
  const t = MONSTERS[typeId]; if (!t) return 0;
  return Math.round((MON_CFG.oanBase + MON_CFG.oanPerLv * t.lv) * (t.boss ? MON_CFG.bossMul : t.elite ? MON_CFG.eliteMul : 1));
}
/** Chỉ số của một loại quái: { lv, he, elite, cong, thu, oanKhiMax } (Công/Thủ lấy theo Tu Vi = cấp quái, cùng đường cong người chơi); loại lạ → null. */
export function monsterStats(typeId) {
  const t = MONSTERS[typeId]; if (!t) return null;
  const s = statsOf(t.lv);
  return { lv: t.lv, he: t.he, elite: t.elite, boss: !!t.boss, cong: s.cong, thu: s.thu, oanKhiMax: oanKhiMaxOf(typeId) };
}

const respawnDelay = (elite, rng, boss = false) => { const [lo, hi] = boss ? RESPAWN_CFG.boss : elite ? RESPAWN_CFG.elite : RESPAWN_CFG.normal; return lo + rng() * (hi - lo); };

/** Chọn một điểm đặt quái trong vùng (trọng số theo diện tích), tránh `avoid`, cách quái đang sống ≥ minGap, cách người chơi ≥ minFromPlayer. Không được sau `tries` lần → null. */
export function pickPoint(zone, rng, occupied = [], player = null) {
  const areas = zone.rects.map((r) => (r.x1 - r.x0) * (r.z1 - r.z0)), total = areas.reduce((a, b) => a + b, 0);
  for (let k = 0; k < SPAWN_CFG.tries; k++) {
    let a = rng() * total, i = 0; while (i < areas.length - 1 && a >= areas[i]) { a -= areas[i]; i++; }
    const r = zone.rects[i], x = r.x0 + rng() * (r.x1 - r.x0), z = r.z0 + rng() * (r.z1 - r.z0);
    if (zone.avoid.some((c) => Math.hypot(x - c.x, z - c.z) <= c.r)) continue;
    if (occupied.some((m) => Math.hypot(x - m.x, z - m.z) < SPAWN_CFG.minGap)) continue;
    if (player && Math.hypot(x - num(player.x), z - num(player.z)) < SPAWN_CFG.minFromPlayer) continue;
    return { x, z };
  }
  return null;
}

function trySpawn(sp, elite, rng, player, boss = false) {
  const zone = FARM_ZONES[sp.zone];
  if (boss) { if (!zone.boss || sp.mons.some((m) => m.boss)) return null; }
  const list = boss ? [zone.boss] : elite ? zone.elite : zone.normal;
  const regular = sp.mons.filter((m) => !m.boss), nElite = regular.filter((m) => m.elite).length;   // boss nằm NGOÀI cap của vùng
  if (!boss && (regular.length >= zone.cap || (elite ? nElite >= zone.eliteMax : regular.length - nElite >= zone.cap - zone.eliteMax))) return null;
  const pos = pickPoint(zone, rng, sp.mons, player); if (!pos) return null;
  const type = list[Math.min(list.length - 1, Math.floor(rng() * list.length))], t = MONSTERS[type], max = oanKhiMaxOf(type);
  const mon = { id: sp.nextId++, type, ten: t.ten, lv: t.lv, he: t.he, elite: t.elite, boss: !!t.boss, x: pos.x, z: pos.z, ry: rng() * Math.PI * 2, oan: max, max, dmgBy: {} };
  sp.mons.push(mon);
  return mon;
}

/** Tạo bộ sinh quái cho một vùng và đặt sẵn quái (1 tinh anh + phần còn lại là quái thường, tổng ≤ cap). Vùng lạ → null. */
export function createSpawner(zoneId, rng, { player = null } = {}) {
  const zone = FARM_ZONES[zoneId]; if (!zone || typeof rng !== 'function') return null;
  const sp = { zone: zoneId, nextId: 1, mons: [], timers: [] };
  if (zone.boss && !trySpawn(sp, false, rng, player, true)) sp.timers.push({ elite: false, boss: true, t: SPAWN_CFG.retry });
  for (let i = 0; i < zone.eliteMax; i++) if (!trySpawn(sp, true, rng, player)) sp.timers.push({ elite: true, t: SPAWN_CFG.retry });
  for (let i = 0; i < zone.cap - zone.eliteMax; i++) if (!trySpawn(sp, false, rng, player)) sp.timers.push({ elite: false, t: SPAWN_CFG.retry });
  return sp;
}

/** Tiến bộ đếm giờ hồi sinh `dt` giây (kẹp ≤ 5 s mỗi lần gọi, như một khung hình). Trả danh sách sự kiện { k: 'spawn', mon }. Không đặt được (chật chỗ / người chơi đứng sát) thì thử lại sau `retry` giây. */
export function tickSpawner(sp, dt, rng, player = null) {
  const ev = []; if (!sp || !FARM_ZONES[sp.zone]) return ev;
  const d = clamp(num(dt), 0, 5), keep = [];
  for (const tm of sp.timers) {
    tm.t -= d;
    if (tm.t > 0) { keep.push(tm); continue; }
    const mon = trySpawn(sp, tm.elite, rng, player, !!tm.boss);
    if (mon) ev.push({ k: 'spawn', mon }); else keep.push({ elite: tm.elite, boss: !!tm.boss, t: SPAWN_CFG.retry });
  }
  sp.timers = keep;
  return ev;
}

/** Hạt Sen rơi khi thu phục một con (xác suất và khoảng theo MONSTERS[type].drop). Loại lạ → { hatSen: 0 }. */
export function rollDrops(typeId, rng) {
  const t = MONSTERS[typeId]; if (!t) return { hatSen: 0 };
  if (!(rng() < t.drop.chance)) return { hatSen: 0 };
  return { hatSen: t.drop.min + Math.floor(rng() * (t.drop.max - t.drop.min + 1)) };
}

/**
 * Gây sát thương lên Oán Khí của quái `id`. Sát thương > 0 luôn trừ ít nhất 1. Oán Khí về 0 → thu phục: quái biến mất, hẹn giờ hồi sinh (theo RESPAWN_CFG ở js/data/monsters.js), kèm quà rơi.
 * Trả { dead, dealt, mon, drops }. Quái không tồn tại hoặc sát thương không hợp lệ → { dead:false, dealt:0, mon:null|mon, drops:null }.
 */
export function hitMonster(sp, id, dmg, who = 'ban', rng = () => 0.5) {
  const i = sp ? sp.mons.findIndex((m) => m.id === id) : -1;
  if (i < 0) return { dead: false, dealt: 0, mon: null, drops: null };
  const m = sp.mons[i];
  if (!(num(dmg) > 0)) return { dead: false, dealt: 0, mon: m, drops: null };
  const dealt = Math.min(m.oan, Math.max(1, Math.floor(num(dmg))));
  m.oan -= dealt; m.dmgBy[who] = (m.dmgBy[who] || 0) + dealt;
  if (m.oan > 0) return { dead: false, dealt, mon: m, drops: null };
  sp.mons.splice(i, 1);
  sp.timers.push({ elite: m.elite, boss: !!m.boss, t: respawnDelay(m.elite, rng, !!m.boss) });
  return { dead: true, dealt, mon: m, drops: rollDrops(m.type, rng) };
}

/** Quái sống gần (x, z) nhất trong tầm `range` (m); không có → null. */
export function nearestMonster(sp, x, z, range = Infinity) {
  let best = null, bd = range;
  for (const m of (sp ? sp.mons : [])) { const d = Math.hypot(m.x - num(x), m.z - num(z)); if (d <= bd) { bd = d; best = m; } }
  return best;
}
