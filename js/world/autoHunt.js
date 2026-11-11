// Tự Động Hàng Yêu (G4.6, Phiên 108; GDD v2 mục 12). LOGIC THUẦN (không DOM, không đọc đồng hồ): `now` (ms) truyền từ ngoài. Test: tests/autohunt.test.mjs.
// Luật: tự đánh quái trong tầm 15 m (không tự đi), tối đa 60 phút/ngày (giờ Việt Nam, TẠM). Dừng khi mở bảng, rời tab, vào nhà, có yêu quái hằng tháng: việc của js/ui/farm.js.
import { FARM_CFG } from '../data/monsters.js';
import { dayKeyVN } from './nguonTuVi.js';

const isObj = (o) => o && typeof o === 'object' && !Array.isArray(o);
const num = (x, d = 0) => (Number.isFinite(+x) ? +x : d);

/** Trạng thái dùng trong ngày: { day, secs }. */
export const emptyAuto = (now = 0) => ({ day: dayKeyVN(now), secs: 0 });
/** Đọc trạng thái lưu (chuỗi/đối tượng, có thể hỏng); sang ngày mới thì về 0. */
export function loadAuto(raw, now = 0) {
  let o = raw; if (typeof raw === 'string') { try { o = JSON.parse(raw); } catch (_) { o = null; } }
  const f = emptyAuto(now); if (!isObj(o) || o.day !== f.day) return f;
  f.secs = Math.max(0, Math.min(FARM_CFG.autoSecNgay, num(o.secs))); return f;
}
/** Số giây còn được dùng hôm nay. */
export const autoLeft = (a, now = 0) => FARM_CFG.autoSecNgay - loadAuto(a, now).secs;
/** Cộng `dt` giây đã chạy (kẹp 0..5 mỗi lần, như một nhịp). Trả trạng thái mới + `out` (hết giờ hôm nay). */
export function addAutoTime(a, dt, now = 0) {
  const s = loadAuto(a, now), add = Math.max(0, Math.min(5, num(dt)));
  s.secs = Math.min(FARM_CFG.autoSecNgay, s.secs + add); return { state: s, out: s.secs >= FARM_CFG.autoSecNgay };
}
/**
 * Chọn đòn kế: in { gap (m, từ người chơi tới tâm quái), body (bán kính thân), stoneReady, spearReady, spearRange, stoneRange = autoRange }.
 * Gần thì Thương (mạnh hơn), còn không thì Ném đá; ngoài tầm tự động hoặc đang hồi chiêu → null.
 */
export function nextAction({ gap, body = 0, stoneReady = false, spearReady = false, spearRange = 3.6, range = FARM_CFG.autoRange } = {}) {
  const g = num(gap, Infinity); if (!(g <= range)) return null;
  if (spearReady && g - num(body) <= spearRange) return 'spear';
  if (stoneReady) return 'stone';
  return null;
}
