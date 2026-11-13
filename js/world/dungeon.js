// Phó bản (mục 4, Phiên 139): LOGIC THUẦN (không DOM, không three.js, không đọc đồng hồ). Số liệu: js/data/dungeons.js (TẠM). Test: tests/dungeon.test.mjs.
// Trạng thái lưu (LGT.dungeon): { v:1, clears:{ [id]: số lần đã chinh phục }, run: null | { id, wave (1..9, 10 = boss), alive (số quái còn trong lượt), kills, boss: bool } }.
// CHƯA nối giao diện/cảnh 3D/NPC (việc của bước 4b–4d, xem docs/PHIEN139.md). Dùng monsterStats của spawn.js để quái phó bản cùng đường cong với bãi rừng.
import { DUNGEON_CFG as C, DUNGEONS } from '../data/dungeons.js';
import { MONSTERS } from '../data/monsters.js';
import { monsterStats } from './spawn.js';

const num = (x, d = 0) => (Number.isFinite(+x) ? +x : d);
const int = (x, lo, hi) => Math.max(lo, Math.min(hi, Math.floor(num(x, lo))));
export const BOSS_WAVE = C.waves + 1;   // "lượt" thứ 10 = trận boss

export const dungeonOf = (id) => DUNGEONS[id] || null;

/** Chuẩn hóa trạng thái lưu (có thể thiếu/hỏng). Không sửa đầu vào. */
export function loadDungeon(o) {
  const s = o && typeof o === 'object' ? o : {}, clears = {};
  for (const id of Object.keys(DUNGEONS)) clears[id] = int(s.clears && s.clears[id], 0, 1e9);
  let run = null;
  const r = s.run;
  if (r && typeof r === 'object' && DUNGEONS[r.id]) {
    const wave = int(r.wave, 1, BOSS_WAVE);
    run = { id: r.id, wave, alive: int(r.alive, 0, 99), kills: int(r.kills, 0, 1e9), boss: wave === BOSS_WAVE };
  }
  return { v: 1, clears, run };
}

/** Số lần đã chinh phục phó bản `id` (loại lạ → 0). */
export const clearsOf = (st, id) => (st && st.clears && DUNGEONS[id] ? int(st.clears[id], 0, 1e9) : 0);

/** Hệ số { hp, atk, size } do SỐ LẦN ĐÃ CHINH PHỤC: lần sau quay lại mạnh hơn, không có trần chơi (chỉ chặn kỹ thuật maxClears). */
export function clearFactor(clears) {
  const k = Math.min(C.clearScale.maxClears, int(clears, 0, 1e9)), s = C.clearScale;
  return { hp: 1 + s.hp * k, atk: 1 + s.atk * k, size: 1 + s.size * k };
}
/** Hệ số { hp, atk, size } do LƯỢT hồi sinh (1..9; ngoài khoảng kẹp vào 1..9): quái hồi sinh mạnh hơn và to hơn lượt trước. */
export function waveFactor(wave) {
  const w = int(wave, 1, C.waves) - 1, s = C.waveScale;
  return { hp: 1 + s.hp * w, atk: 1 + s.atk * w, size: 1 + s.size * w };
}

/** Số quái của lượt `wave` (1..9). */
export const waveCount = (wave) => Math.min(C.perWave.max, Math.round(C.perWave.base + C.perWave.step * (int(wave, 1, C.waves) - 1)));
/** Lượt có thêm tinh anh: 3, 6, 9. */
export const hasElite = (wave) => { const w = int(wave, 1, C.waves); return w % 3 === 0; };

/** Chỉ số một con quái phó bản: { type, lv, he, elite, boss, cong, thu, oanKhiMax, size }. Loại/lượt lạ → null. */
export function mobStats(dungeonId, type, wave, clears) {
  const d = DUNGEONS[dungeonId], base = monsterStats(type);
  if (!d || !base || !(d.mobs.includes(type) || d.boss === type)) return null;
  const isBoss = d.boss === type, cf = clearFactor(clears);
  const wf = isBoss ? { hp: C.boss.hp, atk: C.boss.atk, size: C.boss.size } : waveFactor(wave);
  return { type, lv: base.lv, he: base.he, elite: base.elite, boss: isBoss,
    cong: Math.round(base.cong * wf.atk * cf.atk), thu: base.thu,
    oanKhiMax: Math.round(base.oanKhiMax * wf.hp * cf.hp), size: Math.round(wf.size * cf.size * 1000) / 1000 };
}

/** Danh sách quái của lượt `wave` (1..9): mảng mobStats, tinh anh thêm ở lượt 3/6/9. Phó bản lạ → []. Lượt boss (10) → [boss]. */
export function waveMobs(dungeonId, wave, clears) {
  const d = DUNGEONS[dungeonId]; if (!d) return [];
  if (int(wave, 1, BOSS_WAVE) >= BOSS_WAVE) return [mobStats(dungeonId, d.boss, C.waves, clears)];
  const n = waveCount(wave), out = [];
  for (let i = 0; i < n; i++) out.push(mobStats(dungeonId, d.mobs[0], wave, clears));
  if (hasElite(wave)) out.push(mobStats(dungeonId, d.mobs[1], wave, clears));
  return out;
}

/** Vào phó bản `id`: bắt đầu lượt 1. Phó bản lạ hoặc đang trong một phó bản khác → trả nguyên trạng thái. */
export function enter(st, id) {
  const s = loadDungeon(st);
  if (!DUNGEONS[id] || s.run) return { state: s, ok: false, mobs: [] };
  const mobs = waveMobs(id, 1, s.clears[id]);
  return { state: { ...s, run: { id, wave: 1, alive: mobs.length, kills: 0, boss: false } }, ok: true, mobs };
}

/**
 * Thu phục MỘT quái trong phó bản. Hết quái của lượt → sang lượt kế (quái hồi sinh mạnh hơn/to hơn); hết lượt 9 → boss chính; hạ boss → chinh phục (clears + 1) và quà.
 * Trả { state, nextWave (mảng mobStats của lượt mới hoặc []), cleared (đã chinh phục), reward (chỉ khi cleared: { hatSen, manh, items[] }) }.
 * `rng` dùng cho vật phẩm. Không trong phó bản → trả nguyên trạng thái.
 */
export function onKill(st, rng = Math.random) {
  const s = loadDungeon(st);
  if (!s.run) return { state: s, nextWave: [], cleared: false, reward: null };
  const run = { ...s.run, kills: s.run.kills + 1, alive: Math.max(0, s.run.alive - 1) };
  const clears = s.clears[run.id];
  if (run.alive > 0) return { state: { ...s, run }, nextWave: [], cleared: false, reward: null };
  if (run.boss) {
    const reward = rewardFor(run.id, clears, rng);
    return { state: { ...s, clears: { ...s.clears, [run.id]: clears + 1 }, run: null }, nextWave: [], cleared: true, reward };
  }
  const wave = run.wave + 1, mobs = waveMobs(run.id, wave, clears);
  return { state: { ...s, run: { ...run, wave, alive: mobs.length, boss: wave === BOSS_WAVE } }, nextWave: mobs, cleared: false, reward: null };
}

/** Rời phó bản giữa chừng (chạy ra / hết Sinh Lực): xóa lượt đang chạy, KHÔNG tính chinh phục. */
export const leave = (st) => { const s = loadDungeon(st); return { ...s, run: null }; };

/** Quà khi chinh phục lần thứ (clears + 1): hạt sen nhiều hơn theo số lần đã chinh phục, 1 mảnh yêu quái boss, vài vật phẩm tung theo bảng rơi. */
export function rewardFor(dungeonId, clears, rng = Math.random) {
  const d = DUNGEONS[dungeonId]; if (!d) return { hatSen: 0, manh: null, items: [] };
  const drop = (MONSTERS[d.boss] && MONSTERS[d.boss].drop) || { min: 0, max: 0 };
  const k = int(clears, 0, 1e9), r = typeof rng === 'function' ? rng : Math.random;
  const base = drop.min + Math.floor(r() * (drop.max - drop.min + 1));
  const items = [];
  for (let i = 0; i < C.reward.itemRolls; i++) {
    let x = r(), pick = d.vatPham[d.vatPham.length - 1][0];
    for (const [id, p] of d.vatPham) { if (x < p) { pick = id; break; } x -= p; }
    items.push(pick);
  }
  return { hatSen: Math.round(base * (1 + C.reward.senPerClear * k)), manh: d.boss, items };
}

/**
 * Thông tin hiển thị một phó bản cho bảng chọn: { id, ten, npc, dia, lvMin, lvMax, bossTen, bossLv, waves, clears, hpMul, atkMul, sizeMul, senBoss }.
 * `hpMul/atkMul/sizeMul` = độ mạnh hiện tại so với lần đầu (do số lần đã chinh phục); `senBoss` = hạt sen thưởng trung bình khi hạ boss lần tới. Phó bản lạ → null.
 */
export function describe(st, id) {
  const d = DUNGEONS[id]; if (!d) return null;
  const mobs = d.mobs.map((m) => MONSTERS[m]), boss = MONSTERS[d.boss], k = clearsOf(st, id), f = clearFactor(k), dr = boss.drop;
  const r2 = (x) => Math.round(x * 100) / 100;
  return { id, ten: d.ten, npc: d.npc, dia: d.dia, lvMin: Math.min(...mobs.map((m) => m.lv)), lvMax: Math.max(boss.lv, ...mobs.map((m) => m.lv)), bossTen: boss.ten, bossLv: boss.lv, waves: C.waves, clears: k, hpMul: r2(f.hp), atkMul: r2(f.atk), sizeMul: r2(f.size), senBoss: Math.round(((dr.min + dr.max) / 2) * (1 + C.reward.senPerClear * k)) };
}
