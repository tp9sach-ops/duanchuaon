// Yêu quái xuất hiện MỖI NGÀY 3 LẦN: 12:00, 16:00, 20:00 giờ VN (đổi từ lịch mỗi tháng một lần của Phiên 64). LOGIC THUẦN (không DOM, không three.js, có test): tests/yeuquai.test.mjs. Giao diện: js/ui/yeuquai.js; cảnh 3D: js/scene/yeuquai.js.
// Luật ptg chốt 08/11: yêu quái đá / nước / lửa; người chơi dùng ném đá + thương để bảo vệ dân làng; yêu quái GỒNG CHIÊU rồi đánh DIỆN RỘNG, ai không né được bị mất máu
// (cấp càng cao mất càng ít); hết máu → hồi sinh ở cửa chùa; nhiều người đánh chung; thu phục xong rơi lá bồ đề, ai nhanh tay nhặt được; yêu quái bị ném (người đủ mạnh) thì mất máu.
// Mọi con số (máu, sát thương, thời gian) là QUY ƯỚC TẠM chờ ptg duyệt. Phần đồng bộ nhiều người qua máy chủ CHƯA nối (xem docs/PHIEN64.md): mỗi máy tự mô phỏng cùng một lịch tháng.

const num = (x, d = 0) => (Number.isFinite(+x) ? +x : d);
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const isObj = (o) => o && typeof o === 'object' && !Array.isArray(o);

/** Ba loại yêu quái, xoay vòng theo tháng. pattern: 'slam' vòng tròn quanh thân · 'ring' vành khuyên (đứng SÁT thân thì an toàn) · 'burst' 3 vòng nhỏ rơi gần người chơi. */
export const YQ = {
  da: { id: 'da', ten: 'Yêu Đá Khổng Lồ', hp: 2400, lv: 8, str: 100, speed: 2.2, body: 2.2, windup: 1.9, recover: 1.2, gap: 4.5, dmg: 40, pattern: 'slam', color: 0x7d8288 },
  nuoc: { id: 'nuoc', ten: 'Yêu Nước', hp: 1900, lv: 8, str: 90, speed: 3.2, body: 1.8, windup: 1.7, recover: 1.0, gap: 3.5, dmg: 36, pattern: 'ring', color: 0x3fa7d6 },
  lua: { id: 'lua', ten: 'Yêu Lửa', hp: 1600, lv: 8, str: 90, speed: 3.6, body: 1.6, windup: 1.5, recover: 0.9, gap: 5, dmg: 34, pattern: 'burst', color: 0xe8552b },
};
export const YQ_ORDER = ['da', 'nuoc', 'lua'];
/** Bán kính các đòn diện rộng (m). */
export const AOE = { slam: 6.5, ringIn: 3, ringOut: 10, burst: 3.5, burstN: 3 };

// ---- lịch: MỖI NGÀY (giờ Việt Nam, UTC+7) ba khung giờ: 12:00 và 16:00 độ khó TRUNG BÌNH, 20:00 độ khó CAO. Mỗi khung kéo dài 90 phút và thu phục được một lần.
export const VN_OFFSET_MS = 7 * 3600e3, EVENT_HOUR = 20, EVENT_MIN = 90;
/** Độ khó theo khung giờ: hp/dmg/windup/cd là HỆ SỐ nhân; loot = hệ số số túi lá rơi; xp/str = thưởng thu phục. QUY ƯỚC TẠM chờ ptg duyệt. */
export const DIFF = {
  trung: { id: 'trung', ten: 'Trung bình', hp: 1, dmg: 1, windup: 1, cd: 1, loot: 1, xp: 60, str: 3 },
  cao: { id: 'cao', ten: 'Cao', hp: 1.6, dmg: 1.35, windup: 0.8, cd: 0.75, loot: 1.5, xp: 100, str: 5 },
};
/** Ba khung giờ mỗi NGÀY (giờ VN): 12:00 và 16:00 độ khó trung bình, 20:00 độ khó cao. QUY ƯỚC TẠM chờ ptg duyệt. */
export const SLOTS = [
  { id: 'trua', hour: 12, diff: 'trung' },
  { id: 'chieu', hour: 16, diff: 'trung' },
  { id: 'toi', hour: 20, diff: 'cao' },
];
export const SLOT_ORDER = SLOTS.map((s) => s.id);
const pad2 = (n) => String(n).padStart(2, '0'), DAY_MS = 86400e3;
const daysIn = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();
/** Sự kiện của MỘT ngày (year, month 1..12, day 1..31 theo lịch giờ VN). Cùng ngày luôn cho cùng kết quả ở mọi máy. Loại quái xoay theo ngày nên mỗi ngày đủ ba loại. */
export function dayEvents(year, month, day) {
  const y = Math.floor(num(year, 2026)), m = clamp(Math.floor(num(month, 1)), 1, 12), dd = clamp(Math.floor(num(day, 1)), 1, daysIn(y, m));
  const dayIdx = Math.floor(Date.UTC(y, m - 1, dd) / DAY_MS);
  return SLOTS.map((s, i) => {
    const start = Date.UTC(y, m - 1, dd, s.hour - 7, 0, 0);   // giờ VN trừ 7 = giờ UTC
    return { key: `${y}-${pad2(m)}-${pad2(dd)}-${s.id}`, year: y, month: m, day: dd, slot: s.id, diff: s.diff, type: YQ_ORDER[(dayIdx + i) % 3], start, end: start + EVENT_MIN * 60000 };
  });
}
/** Mọi sự kiện của tháng theo thứ tự thời gian (giữ tên cũ để nơi khác còn gọi được). */
export function monthEvents(year, month) {
  const y = Math.floor(num(year, 2026)), m = clamp(Math.floor(num(month, 1)), 1, 12), out = [];
  for (let d = 1; d <= daysIn(y, m); d++) out.push(...dayEvents(y, m, d));
  return out;
}
/** Sự kiện 20:00 (độ khó cao) của một ngày (mặc định ngày 1) — giữ tên cũ. */
export const monthEvent = (year, month, day = 1) => dayEvents(year, month, day)[SLOTS.length - 1];
/** Sự kiện đang diễn ra tại `now`; không có thì sự kiện kế tiếp trong NGÀY (giờ VN), hết ngày thì sự kiện cuối ngày. */
export function eventAt(now) {
  const n = num(now, Date.now()), d = new Date(n + VN_OFFSET_MS), list = dayEvents(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
  return list.find((e) => n >= e.start && n < e.end) || list.find((e) => n < e.start) || list[list.length - 1];
}
/** Trạng thái theo thời gian: 'before' | 'live' | 'after', kèm số giây còn lại. */
export function eventPhase(ev, now) { const n = num(now, Date.now()); return n < ev.start ? { phase: 'before', secs: Math.ceil((ev.start - n) / 1000) } : n < ev.end ? { phase: 'live', secs: Math.ceil((ev.end - n) / 1000) } : { phase: 'after', secs: 0 }; }
/** Sự kiện kế tiếp chưa kết thúc (hôm nay nếu còn, không thì khung 12:00 ngày mai). */
export function nextEvent(now) {
  const n = num(now, Date.now()), e = eventAt(n); if (n < e.end) return e;
  const t = new Date(n + VN_OFFSET_MS + DAY_MS); return dayEvents(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate())[0];
}

// ---- người chơi
export const maxHp = (level) => 100 + 20 * (clamp(Math.floor(num(level, 1)), 1, 99) - 1);
/** Máu mất khi dính một đòn: cấp càng cao càng ít (giảm 5%/cấp, tối đa 50%). Cấp 1: 40 (3 đòn là ngã), cấp 10: 22 trên 280 máu. */
export const hitDamage = (typeId, level, diff = 'trung') => { const t = YQ[typeId], d = DIFF[diff] || DIFF.trung; return t ? Math.max(1, Math.round(t.dmg * d.dmg * (1 - Math.min(0.5, 0.05 * (clamp(Math.floor(num(level, 1)), 1, 99) - 1))))) : 0; };
export const RESPAWN = { x: 0, z: 38 };   // cửa chùa: ngay trước cổng Tam quan
export const INVULN_S = 3;                // bất tử ngắn sau khi hồi sinh
export const newPlayer = (level) => ({ hp: maxHp(level), max: maxHp(level), inv: 0, deaths: 0 });
/** Trừ máu người chơi. Hết máu → hồi sinh đầy máu, bất tử INVULN_S, báo `died` (nơi gọi dịch chuyển về RESPAWN). Đang bất tử → không mất. */
export function hurt(p, dmg, level = 1) {
  if (!isObj(p)) return { p: newPlayer(level), died: false, lost: 0 };
  if (p.inv > 0 || !(dmg > 0)) return { p, died: false, lost: 0 };
  const hp = p.hp - Math.floor(dmg);
  if (hp > 0) return { p: { ...p, hp }, died: false, lost: Math.floor(dmg) };
  return { p: { ...p, hp: p.max, inv: INVULN_S, deaths: p.deaths + 1 }, died: true, lost: Math.floor(dmg) };
}
export const tickPlayer = (p, dt) => (p.inv > 0 ? { ...p, inv: Math.max(0, p.inv - clamp(num(dt), 0, 1)) } : p);

// ---- đòn của người chơi: ném đá (xa, nhẹ) và thương (gần, mạnh); sức mạnh càng cao đánh càng đau
export const STONE = { range: 18, cd: 1.4, speed: 20 }, SPEAR = { range: 3.6, cd: 0.7 };
export const stoneDamage = (str) => Math.round(8 + clamp(num(str), 0, 1e4) * 0.35);
export const spearDamage = (str) => Math.round(20 + clamp(num(str), 0, 1e4) * 0.5);
/** Sát thương khi NÉM CHÍNH yêu quái (người đủ mạnh: canGrab). */
export const throwBossDamage = (str) => Math.round(150 + clamp(num(str), 0, 1e4) * 2);

// ---- yêu quái
function mulberry(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export const rngSeed = mulberry;
/** Máu tăng theo số người đánh chung: +50% mỗi người thêm. */
export const bossHp = (typeId, n = 1, diff = 'trung') => { const t = YQ[typeId], d = DIFF[diff] || DIFF.trung; return t ? Math.round(t.hp * d.hp * (1 + 0.5 * (clamp(Math.floor(num(n, 1)), 1, 20) - 1))) : 0; };
export function createBoss(typeId, { x = 0, z = 100, n = 1, diff = 'trung' } = {}) {
  const t = YQ[typeId]; if (!t) return null;
  const dd = DIFF[diff] ? diff : 'trung', max = bossHp(typeId, n, dd);
  return { type: typeId, diff: dd, hp: max, max, x, z, ry: 0, state: 'move', t: 0, shapes: [], cd: 3 * DIFF[dd].cd, dead: false, dmgBy: {} };
}
/** Thời gian gồng thực tế của yêu quái này (độ khó cao gồng ngắn hơn → khó né hơn). */
export const windupOf = (b) => YQ[b.type].windup * (DIFF[b.diff] || DIFF.trung).windup;
/** Hình vùng đánh khi gồng: vòng tròn { k:'c', x, z, r } hoặc vành khuyên { k:'ring', x, z, r0, r }. */
export function aoeShapes(b, targets, rng) {
  const t = YQ[b.type];
  if (t.pattern === 'slam') return [{ k: 'c', x: b.x, z: b.z, r: AOE.slam }];
  if (t.pattern === 'ring') return [{ k: 'ring', x: b.x, z: b.z, r0: AOE.ringIn, r: AOE.ringOut }];
  const out = [];
  for (let i = 0; i < AOE.burstN; i++) {
    const tg = targets.length ? targets[Math.floor(rng() * targets.length) % targets.length] : null, a = rng() * Math.PI * 2, d = rng() * 4;
    out.push({ k: 'c', x: (tg ? tg.x : b.x) + Math.cos(a) * d, z: (tg ? tg.z : b.z) + Math.sin(a) * d, r: AOE.burst });
  }
  return out;
}
export function inShape(s, x, z) { const d = Math.hypot(num(x) - s.x, num(z) - s.z); return s.k === 'ring' ? d >= s.r0 && d <= s.r : d <= s.r; }
const nearest = (b, ps) => { let best = null, bd = Infinity; for (const p of ps) { const d = Math.hypot(p.x - b.x, p.z - b.z); if (d < bd) { bd = d; best = p; } } return best ? { p: best, d: bd } : null; };

/**
 * Tiến yêu quái dt giây. players = [{ id, x, z, inv? }]; walk(x, z, dx, dz) → {x,z} (mặc định đi thẳng, UI truyền layout.move để tránh vật cản).
 * Vòng đời: 'move' (đuổi người gần nhất) → 'windup' (GỒNG, hiện vùng đỏ, người chơi chạy ra) → 'strike' (đánh: ai còn trong vùng bị trúng) → 'recover' (nghỉ) → 'move'.
 * Trả danh sách sự kiện: { k:'windup', shapes, dur } và { k:'strike', shapes, hits: [id…] }.
 */
export function stepBoss(b, dt, players, rng, walk) {
  const ev = []; if (!b || b.dead) return ev;
  const t = YQ[b.type], d = clamp(num(dt), 0, 0.25), ps = (Array.isArray(players) ? players : []).filter((p) => p && Number.isFinite(+p.x) && Number.isFinite(+p.z));
  b.t += d;
  if (b.state === 'move') {
    b.cd -= d; const nr = nearest(b, ps);
    if (nr) {
      b.ry = Math.atan2(nr.p.x - b.x, nr.p.z - b.z);
      if (nr.d > t.gap) { const step = Math.min(t.speed * d, nr.d - t.gap), dx = Math.sin(b.ry) * step, dz = Math.cos(b.ry) * step, r = walk ? walk(b.x, b.z, dx, dz) : { x: b.x + dx, z: b.z + dz }; b.x = r.x; b.z = r.z; }
      if (b.cd <= 0 && nr.d <= AOE.ringOut + 6) { b.shapes = aoeShapes(b, ps, rng); b.state = 'windup'; b.t = 0; ev.push({ k: 'windup', shapes: b.shapes, dur: windupOf(b) }); }
    }
  } else if (b.state === 'windup') {
    if (b.t >= windupOf(b)) {
      const hits = []; for (const p of ps) if (b.shapes.some((s) => inShape(s, p.x, p.z))) hits.push(p.id);
      ev.push({ k: 'strike', shapes: b.shapes, hits }); b.state = 'recover'; b.t = 0;
    }
  } else if (b.state === 'recover') {
    if (b.t >= t.recover) { b.state = 'move'; b.t = 0; b.shapes = []; b.cd = (2.5 + rng() * 1.5) * (DIFF[b.diff] || DIFF.trung).cd; }
  }
  return ev;
}
/** Gây sát thương lên yêu quái, ghi công người đánh. Trả { dead, dealt }. */
export function hitBoss(b, dmg, who = 'ban') {
  if (!b || b.dead || !(dmg > 0)) return { dead: false, dealt: 0 };
  const dealt = Math.min(b.hp, Math.floor(dmg)); b.hp -= dealt; b.dmgBy[who] = (b.dmgBy[who] || 0) + dealt;
  if (b.hp <= 0) { b.dead = true; b.state = 'dead'; b.shapes = []; }
  return { dead: b.dead, dealt };
}
/** Phần công của một người (0..1). */
export const shareOf = (b, who) => (b && b.max > 0 ? clamp((b.dmgBy[who] || 0) / b.max, 0, 1) : 0);
export const MIN_SHARE = 0.05;   // đánh được ≥ 5% máu mới có thưởng thu phục

// ---- phần thưởng
/** Lá bồ đề rơi ra khi thu phục: càng nhiều người đánh càng nhiều túi lá; mỗi túi 1–3 lá, nằm quanh xác yêu quái. Ai chạm trước lấy trước. */
export function lootDrops(x, z, n = 1, rng = Math.random, diff = 'trung') {
  const cnt = Math.round((6 + 2 * clamp(Math.floor(num(n, 1)), 1, 20)) * (DIFF[diff] || DIFF.trung).loot), out = [];
  for (let i = 0; i < cnt; i++) { const a = (i / cnt) * Math.PI * 2 + rng() * 0.5, r = 2 + rng() * 5; out.push({ id: i + 1, x: x + Math.cos(a) * r, z: z + Math.sin(a) * r, la: 1 + Math.floor(rng() * 3), ttl: 150 }); }
  return out;
}
export const LOOT_RADIUS = 1.6;
/** Người ở (x,z) nhặt túi lá gần nhất trong tầm; trả { drops (mới), got: túi vừa nhặt | null }. Túi đã nhặt biến mất → người nhanh tay hơn lấy được. */
export function pickLoot(drops, x, z) {
  let bi = -1, bd = LOOT_RADIUS; (drops || []).forEach((d, i) => { const k = Math.hypot(d.x - num(x), d.z - num(z)); if (k <= bd) { bd = k; bi = i; } });
  if (bi < 0) return { drops, got: null };
  return { drops: drops.filter((_, i) => i !== bi), got: drops[bi] };
}
export const tickLoot = (drops, dt) => (drops || []).map((d) => ({ ...d, ttl: d.ttl - clamp(num(dt), 0, 5) })).filter((d) => d.ttl > 0);
/** Thưởng khi thu phục cho người đánh được ≥ MIN_SHARE: điểm cấp + sức mạnh vĩnh viễn. */
export const REWARD = { xp: 60, strength: 3 };
export const rewardFor = (share, diff = 'trung') => { const d = DIFF[diff] || DIFF.trung; return share >= MIN_SHARE ? { xp: d.xp, strength: d.str } : { xp: 0, strength: 0 }; };

// ---- lưu (lgt.yq): đã thu phục tháng nào, tổng lần, sức mạnh cộng thêm
export const emptyYq = () => ({ v: 1, done: {}, kills: 0, bonus: 0, deaths: 0 });
export function loadYq(raw) {
  let o = raw; if (typeof raw === 'string') { try { o = JSON.parse(raw); } catch (_) { o = null; } }
  const s = emptyYq(); if (!isObj(o)) return s;
  if (isObj(o.done)) for (const k of Object.keys(o.done)) if (/^\d{4}-\d{2}(-\d{2}-(trua|chieu|toi)|-(trung|cao))?$/.test(k) && o.done[k] === true) s.done[k] = true;
  { const ks = Object.keys(s.done).sort(); for (const k of ks.slice(0, Math.max(0, ks.length - 300))) delete s.done[k]; }
  s.kills = clamp(Math.floor(num(o.kills)), 0, 1e6); s.bonus = clamp(Math.floor(num(o.bonus)), 0, 100); s.deaths = clamp(Math.floor(num(o.deaths)), 0, 1e6);
  return s;
}
