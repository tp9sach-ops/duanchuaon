// Tu Vi + công đức từ hàng yêu quái bãi rừng (G1.6a, Phiên 107). LOGIC THUẦN (không DOM, không three.js, không đọc đồng hồ): mọi hàm nhận `now` (ms) từ ngoài.
// Số liệu: js/data/monsters.js (FARM_CFG) và js/data/nguon.js (TẠM). Test: tests/farm.test.mjs. Lưu: khóa `lgt.farm` (khóa `lgt.*` tự đồng bộ theo tài khoản, xem js/engines/account.js).
// Trạng thái: { v, exp (tổng EXP Tu Vi), st (bộ đếm nguồn Tu Vi trong ngày, của nguonTuVi.js), sen { day, n } (hạt sen đã nhận từ hàng yêu hôm nay), kills }.
import { FARM_CFG } from '../data/monsters.js';
import { award, normalizeState, dayKeyVN } from './nguonTuVi.js';
import { levelFromExp, progressOf } from './stats.js';

const isObj = (o) => o && typeof o === 'object' && !Array.isArray(o);
const int = (x, lo, hi) => (Number.isFinite(+x) ? Math.max(lo, Math.min(hi, Math.floor(+x))) : lo);
const MAX_EXP = 1e9;

const normSen = (s, now) => { const day = dayKeyVN(now); return isObj(s) && s.day === day ? { day, n: int(s.n, 0, FARM_CFG.senCapNgay) } : { day, n: 0 }; };

export const emptyFarm = (now = 0) => ({ v: 1, exp: 0, st: normalizeState(null, now), sen: normSen(null, now), kills: 0 });

/** Đọc trạng thái lưu (chuỗi JSON hoặc đối tượng, có thể hỏng/thiếu) về dạng chuẩn; sang ngày mới thì đếm hạt sen và bộ đếm hoạt động về 0. Không sửa đầu vào. */
export function loadFarm(raw, now = 0) {
  let o = raw; if (typeof raw === 'string') { try { o = JSON.parse(raw); } catch (_) { o = null; } }
  const f = emptyFarm(now); if (!isObj(o)) return f;
  f.exp = int(o.exp, 0, MAX_EXP); f.st = normalizeState(o.st, now); f.sen = normSen(o.sen, now); f.kills = int(o.kills, 0, MAX_EXP);
  return f;
}

/** Số hạt sen còn nhận được từ hàng yêu trong ngày. */
export const senLeft = (farm, now = 0) => FARM_CFG.senCapNgay - normSen(farm && farm.sen, now).n;
/** Cấp Tu Vi và tiến độ trong cấp: { tuvi, into, need, pct }. */
export const tuViOf = (farm) => progressOf(farm && farm.exp);

/**
 * Tính một lần thu phục quái `mon` ({ lv }) với quà `drops` ({ hatSen }) từ spawn.js. Không sửa `farm`.
 * Trả { farm (mới), expGain, tuvi, tuviBefore, leveledUp, senGain (hạt sen thật sự được cộng), senCapped (có bị cắt vì trần ngày), reason }.
 */
export function settleKill(farm, mon, drops, now = 0) {
  const f0 = loadFarm(farm, now), before = levelFromExp(f0.exp);
  const r = award({ exp: f0.exp, nguon: 'hangYeu', monsterLevel: mon && mon.lv, state: f0.st, now });
  const want = Math.max(0, Math.floor(Number(drops && drops.hatSen) || 0)), give = Math.min(want, FARM_CFG.senCapNgay - f0.sen.n);
  const f1 = { v: 1, exp: int(r.exp, 0, MAX_EXP), st: r.state, sen: { day: f0.sen.day, n: f0.sen.n + give }, kills: int(f0.kills + 1, 0, MAX_EXP) };
  return { farm: f1, expGain: r.gain, tuvi: r.tuvi, tuviBefore: before, leveledUp: r.leveledUp, senGain: give, senCapped: want > give, reason: r.reason };
}
