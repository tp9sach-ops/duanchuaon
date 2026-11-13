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

/** Các hình chữ nhật quái được ở: ban ngày chỉ khoảng rừng (`rects`), ban đêm thêm `nightRects` (lối vào + đường mòn sát khoảng rừng: quái TRÀN RA). */
export const rectsOf = (zone, night = false) => (night && zone.nightRects ? zone.rects.concat(zone.nightRects) : zone.rects);
const capOf = (zone, night) => (night ? zone.capNight || zone.cap : zone.cap);

/** Trời tối chưa: `night` là bool hoặc số 0..1 vượt FARM_CFG.nightAt; giá trị lạ → false (coi là ban ngày). */
export const isNight = (night) => night === true || num(night, 0) > FARM_CFG.nightAt;

/** Id vùng farm chứa điểm (x, z), hoặc null. `night` = true thì tính cả nightRects. Toạ độ lạ (NaN, chữ) → null. */
export function zoneAt(x, z, night = false) {
  const px = num(x, NaN), pz = num(z, NaN);
  for (const id of ZONE_IDS) if (rectsOf(FARM_ZONES[id], night).some((r) => inRect(r, px, pz))) return id;
  return null;
}

/** Oán Khí tối đa của một loại quái; loại lạ → 0. */
export function oanKhiMaxOf(typeId) {
  const t = MONSTERS[typeId]; if (!t) return 0;
  return Math.round((MON_CFG.oanBase + MON_CFG.oanPerLv * t.lv) * (t.boss ? MON_CFG.bossMul : t.elite ? MON_CFG.eliteMul : 1) * (t.mul ? t.mul.hp : 1));   // Phiên 131: mul.hp = hệ số "độ sâu" (càng xa chùa càng trâu)
}
/** Chỉ số của một loại quái: { lv, he, elite, cong, thu, oanKhiMax } (Công/Thủ lấy theo Tu Vi = cấp quái, cùng đường cong người chơi); loại lạ → null. */
export function monsterStats(typeId) {
  const t = MONSTERS[typeId]; if (!t) return null;
  const s = statsOf(t.lv);
  return { lv: t.lv, he: t.he, elite: t.elite, boss: !!t.boss, cong: Math.round(s.cong * (t.mul ? t.mul.atk : 1)), thu: s.thu, oanKhiMax: oanKhiMaxOf(typeId) };
}

const respawnDelay = (elite, rng, boss = false) => { const [lo, hi] = boss ? RESPAWN_CFG.boss : elite ? RESPAWN_CFG.elite : RESPAWN_CFG.normal; return lo + rng() * (hi - lo); };

/** Chọn một điểm đặt quái trong vùng (trọng số theo diện tích), tránh `avoid`, cách quái đang sống ≥ minGap, cách người chơi ≥ minFromPlayer. Không được sau `tries` lần → null. */
export function pickPoint(zone, rng, occupied = [], player = null, night = false) {
  const rects = rectsOf(zone, night), nDay = zone.rects.length, areas = rects.map((r, i) => (r.x1 - r.x0) * (r.z1 - r.z0) * (i >= nDay ? 3 : 1)), total = areas.reduce((a, b) => a + b, 0);
  for (let k = 0; k < SPAWN_CFG.tries; k++) {
    let a = rng() * total, i = 0; while (i < areas.length - 1 && a >= areas[i]) { a -= areas[i]; i++; }
    const r = rects[i], x = r.x0 + rng() * (r.x1 - r.x0), z = r.z0 + rng() * (r.z1 - r.z0);
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
  const cap = capOf(zone, sp.night), eMax = zone.eliteMax + (sp.night && zone.capNight ? 1 : 0);   // ban đêm thêm 1 tinh anh
  if (!boss && (regular.length >= cap || (elite ? nElite >= eMax : regular.length - nElite >= cap - eMax))) return null;
  const pos = pickPoint(zone, rng, sp.mons, player, sp.night); if (!pos) return null;
  const type = list[Math.min(list.length - 1, Math.floor(rng() * list.length))], t = MONSTERS[type], max = oanKhiMaxOf(type);
  const mon = { id: sp.nextId++, type, ten: t.ten, lv: t.lv, he: t.he, elite: t.elite, boss: !!t.boss, x: pos.x, z: pos.z, ry: rng() * Math.PI * 2, oan: max, max, dmgBy: {} };
  sp.mons.push(mon);
  return mon;
}

/** Đặt thêm quái cho đủ cap hiện tại (tinh anh trước), chỗ không đặt được thì hẹn thử lại. Số hẹn giờ + quái sống không vượt cap. */
function fill(sp, rng, player, delay = 0) {
  const zone = FARM_ZONES[sp.zone], cap = capOf(zone, sp.night), eMax = zone.eliteMax + (sp.night && zone.capNight ? 1 : 0);
  const reg = () => sp.mons.filter((m) => !m.boss), pend = (el) => sp.timers.filter((t) => !t.boss && !!t.elite === el).length;
  const nE = () => reg().filter((m) => m.elite).length;
  while (nE() + pend(true) < eMax) { if (delay > 0) sp.timers.push({ elite: true, t: delay * (0.3 + rng()) }); else if (!trySpawn(sp, true, rng, player)) sp.timers.push({ elite: true, t: SPAWN_CFG.retry }); }
  while (reg().length - nE() + pend(false) < cap - eMax) { if (delay > 0) sp.timers.push({ elite: false, t: delay * (0.3 + rng()) }); else if (!trySpawn(sp, false, rng, player)) sp.timers.push({ elite: false, t: SPAWN_CFG.retry }); }
}

/**
 * Chuyển ngày ↔ đêm cho bộ sinh. Đêm: cap tăng (capNight), quái mới ra dần (mỗi con sau 2–10 s) cả ở nightRects → TRÀN RA ngoài. Sáng: quái đang ở ngoài khoảng rừng (và không đang đánh nhau: m.eng) biến mất,
 * dư cap thì bớt (con xa người chơi trước); hẹn giờ dư bị bỏ. Trả số quái bị bớt. Không đổi trạng thái → 0.
 */
export function setNight(sp, night, rng, player = null) {
  const on = !!night; if (!sp || !FARM_ZONES[sp.zone] || sp.night === on) return 0;
  sp.night = on; const zone = FARM_ZONES[sp.zone]; let removed = 0;
  if (on) { fill(sp, rng, player, 10); return 0; }
  const day = rectsOf(zone, false), cap = capOf(zone, false);
  sp.mons = sp.mons.filter((m) => { if (m.boss || m.eng || day.some((r) => inRect(r, m.x, m.z))) return true; removed++; return false; });
  const reg = sp.mons.filter((m) => !m.boss), far = (m) => (player ? Math.hypot(m.x - num(player.x), m.z - num(player.z)) : 0);
  while (reg.length > cap) { const cand = reg.filter((m) => !m.eng).sort((a, b) => far(b) - far(a))[0]; if (!cand) break; sp.mons.splice(sp.mons.indexOf(cand), 1); reg.splice(reg.indexOf(cand), 1); removed++; }
  const eMax = zone.eliteMax, keepT = []; let nE = reg.filter((m) => m.elite).length, nN = reg.length - nE;
  for (const t of sp.timers) { if (t.boss) { keepT.push(t); continue; } if (t.elite ? nE < eMax : nN < cap - eMax) { keepT.push(t); if (t.elite) nE++; else nN++; } }
  sp.timers = keepT;
  return removed;
}

/** Tạo bộ sinh quái cho một vùng và đặt sẵn quái (1 tinh anh + phần còn lại là quái thường, tổng ≤ cap). Vùng lạ → null. */
export function createSpawner(zoneId, rng, { player = null, night = false } = {}) {
  const zone = FARM_ZONES[zoneId]; if (!zone || typeof rng !== 'function') return null;
  const sp = { zone: zoneId, nextId: 1, mons: [], timers: [], night: !!night };
  if (zone.boss && !trySpawn(sp, false, rng, player, true)) sp.timers.push({ elite: false, boss: true, t: SPAWN_CFG.retry });
  fill(sp, rng, player);
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
