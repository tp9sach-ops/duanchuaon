// Tự Động Hàng Yêu (G4.6, Phiên 108; GDD v2 mục 12). LOGIC THUẦN (không DOM, không đọc đồng hồ): `now` (ms) truyền từ ngoài. Test: tests/autohunt.test.mjs.
// Luật: tự đánh quái trong tầm 15 m (không tự đi), tối đa 60 phút/ngày (giờ Việt Nam, TẠM). Dừng khi mở bảng, rời tab, vào nhà, có yêu quái hằng tháng: việc của js/ui/farm.js.
// Phiên 163: Trà sữa xoài hoàng kim (tiệm Tách Hoa, js/world/items.js) cộng thêm thời gian cho HÔM NAY: trạng thái có thêm `bonus` (giây) CHỈ KHI > 0 (bản lưu cũ và test cũ không đổi). Sang ngày mới `bonus` mất cùng `secs`.
import { FARM_CFG } from '../data/monsters.js';
import { dayKeyVN } from './nguonTuVi.js';

const isObj = (o) => o && typeof o === 'object' && !Array.isArray(o);
const num = (x, d = 0) => (Number.isFinite(+x) ? +x : d);
/** Trần thưởng thêm trong một ngày (giây): 24 giờ — chỉ để chặn số lạ trong bản lưu. */
export const MAX_BONUS = 86400;
const bonusOf = (o) => (isObj(o) ? Math.max(0, Math.min(MAX_BONUS, Math.floor(num(o.bonus)))) : 0);
/** Trần giây của trạng thái s: 60 phút gốc + phần thưởng thêm hôm nay. */
export const capOf = (s) => FARM_CFG.autoSecNgay + bonusOf(s);

/** Trạng thái dùng trong ngày: { day, secs } (+ bonus nếu đã uống Trà sữa). */
export const emptyAuto = (now = 0) => ({ day: dayKeyVN(now), secs: 0 });
/** Đọc trạng thái lưu (chuỗi/đối tượng, có thể hỏng); sang ngày mới thì về 0. */
export function loadAuto(raw, now = 0) {
  let o = raw; if (typeof raw === 'string') { try { o = JSON.parse(raw); } catch (_) { o = null; } }
  const f = emptyAuto(now); if (!isObj(o) || o.day !== f.day) return f;
  const b = bonusOf(o); if (b > 0) f.bonus = b;
  f.secs = Math.max(0, Math.min(capOf(f), num(o.secs))); return f;
}
/** Số giây còn được dùng hôm nay (đã tính phần thưởng thêm). */
export const autoLeft = (a, now = 0) => { const s = loadAuto(a, now); return capOf(s) - s.secs; };
/** Cộng `dt` giây đã chạy (kẹp 0..5 mỗi lần, như một nhịp). Trả trạng thái mới + `out` (hết giờ hôm nay). */
export function addAutoTime(a, dt, now = 0) {
  const s = loadAuto(a, now), add = Math.max(0, Math.min(5, num(dt))), cap = capOf(s);
  s.secs = Math.min(cap, s.secs + add); return { state: s, out: s.secs >= cap };
}
/** Cộng thêm `sec` giây vào trần HÔM NAY (Trà sữa xoài hoàng kim: 1800 giây = 30 phút). Trả trạng thái mới; số lạ/âm → không đổi. */
export function addAutoBonus(a, sec, now = 0) {
  const s = loadAuto(a, now), b = Math.min(MAX_BONUS, bonusOf(s) + Math.max(0, Math.floor(num(sec))));
  if (b > 0) s.bonus = b; return s;
}
/**
 * Chọn việc kế (Phiên 127: Tự động LAO VÀO quái): in { gap (m, từ người chơi tới tâm quái), body (bán kính thân), stoneReady (= Đánh thường sẵn sàng), spearReady, spearRange, range = autoRange }.
 * Ngoài `range` → null; trong tầm đâm: Thương nếu sẵn sàng, không thì Đánh thường ('stone'), đang hồi hết → null; còn xa hơn tầm đâm (nhưng trong `range`) → 'rush' (lao tới quái).
 */
export function nextAction({ gap, body = 0, stoneReady = false, spearReady = false, spearRange = 3.6, range = FARM_CFG.autoRange } = {}) {
  const g = num(gap, Infinity); if (!(g <= range)) return null;
  if (g - num(body) > spearRange) return 'rush';
  if (spearReady) return 'spear';
  if (stoneReady) return 'stone';
  return null;
}

/**
 * Điểm đứng để lao tới quái: nằm trên đường thẳng người chơi → quái, cách tâm quái `body + stand` m (mặc định đứng sát tầm đâm). Đi từng 0,5 m dọc đường:
 * gặp chỗ `isBlocked(x, z)` thì dừng ngay trước đó (không xuyên cây/tường). Trả { x, z, dist } hoặc null (đã đứng đủ gần, quá ngắn < 0,4 m, hoặc bước đầu đã bị chặn).
 */
export function rushTarget(from, mon, { body = 0.55, stand = 2.2, isBlocked = () => false } = {}) {
  if (!isObj(from) || !isObj(mon)) return null;
  const fx = num(from.x, NaN), fz = num(from.z, NaN), mx = num(mon.x, NaN), mz = num(mon.z, NaN);
  if (![fx, fz, mx, mz].every(Number.isFinite)) return null;
  const dx = mx - fx, dz = mz - fz, d = Math.hypot(dx, dz), want = d - (num(body) + num(stand));
  if (!(want > 0.4)) return null;
  const ux = dx / d, uz = dz / d; let ok = 0;
  for (let t = 0.5; t <= want + 1e-9; t += 0.5) { if (isBlocked(fx + ux * t, fz + uz * t)) break; ok = t; }
  if (ok < want - 0.5 && ok < 0.4) return null;
  const fin = Math.min(ok + (ok >= want - 0.5 ? Math.max(0, want - ok) : 0), want);
  return fin > 0.4 ? { x: fx + ux * fin, z: fz + uz * fin, dist: fin } : null;
}
