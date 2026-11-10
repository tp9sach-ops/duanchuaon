// Bơi + lặn (Phiên 80). LOGIC THUẦN (không DOM/three.js, có test: tests/swim.test.mjs). Giao diện: js/ui/swim.js.
// Quy ước (ptg chưa chốt số — QUY ƯỚC TẠM): nước có cờ `swim` (Hồ Rừng, Sông Thác/Suối Trong, hồ chân thác) lội/bơi được; ao sen + hồ cá chùa KHÔNG (thiêng). Trên cầu/sàn gỗ là đi bộ.
// Bơi: chậm hơn đi bộ (×0,6). Lặn: chậm hơn (×0,45), có 20 giây hơi thở; lên mặt nước hồi hơi nhanh gấp 4; hết hơi tự nổi lên. Lặn nhặt ngọc trai dưới đáy: +1 hạt sen/viên, tối đa 8 viên mỗi ngày.
import { WATERS, bridgeAt } from './layout.js';
import { mulberry32 } from '../util.js';

export const SWIM = { speed: 0.6, diveSpeed: 0.45, airMax: 20, regenX: 4, yOff: -0.75, diveYOff: -1.9, pearlR: 1.5, dayCap: 8, perWater: 6 };

/** Nước bơi được chứa điểm (x, z) (không tính khi đang đứng trên cầu/sàn gỗ); không có → null. */
export function swimWaterAt(x, z) {
  if (bridgeAt(x, z)) return null;
  for (const w of WATERS) if (w.swim && Math.hypot(x - w.x, z - w.z) < w.r) return w;
  return null;
}

/** Trạng thái người bơi. mode: 'land' | 'swim' | 'dive'; air: giây hơi còn lại. */
export const createSwimmer = () => ({ mode: 'land', air: SWIM.airMax });

/**
 * Một bước thời gian. inp = { inWater, wantDive }. Trả { st, ev } — ev: null | 'enter' | 'leave' | 'dive' | 'surface' | 'breath' (hết hơi, buộc nổi lên).
 * dt kẹp ≤ 0,5 giây (khung hình lag không làm người chơi chết đuối hay hồi hơi dư).
 */
export function stepSwimmer(st, inp, dt) {
  const d = Math.max(0, Math.min(0.5, +dt || 0)), inW = !!(inp && inp.inWater), want = !!(inp && inp.wantDive);
  let { mode, air } = st, ev = null;
  if (!inW) { if (mode !== 'land') ev = 'leave'; return { st: { mode: 'land', air: Math.min(SWIM.airMax, air + d * SWIM.regenX) }, ev }; }
  if (mode === 'land') { mode = 'swim'; ev = 'enter'; }
  if (mode === 'swim' && want && air > 0.5) { mode = 'dive'; ev = 'dive'; }
  else if (mode === 'dive' && !want) { mode = 'swim'; ev = 'surface'; }
  if (mode === 'dive') { air -= d; if (air <= 0) { air = 0; mode = 'swim'; ev = 'breath'; } }
  else air = Math.min(SWIM.airMax, air + d * SWIM.regenX);
  return { st: { mode, air }, ev };
}
export const speedMul = (mode) => (mode === 'swim' ? SWIM.speed : mode === 'dive' ? SWIM.diveSpeed : 1);
export const yOffset = (mode) => (mode === 'swim' ? SWIM.yOff : mode === 'dive' ? SWIM.diveYOff : 0);

/** Ngọc trai dưới đáy: vị trí cố định (suy từ id nước) trong phần lòng nước, cách mép ≥ 1 m. */
export function pearlSpots(waters = WATERS) {
  const out = [];
  for (const w of waters) {
    if (!w.swim || !w.id) continue; const rnd = mulberry32(Math.floor(w.x * 7 + w.z * 13) | 0);
    for (let i = 0; i < SWIM.perWater; i++) {
      for (let t = 0; t < 40; t++) {   // thử lại tới khi ngọc không nằm dưới/sát sàn gỗ (người chơi đứng trên đó là đi bộ, không lặn được)
        const a = rnd() * 6.2832, d = Math.max(0, w.r - 1.1) * (0.2 + 0.8 * rnd()), x = w.x + Math.cos(a) * d, z = w.z + Math.sin(a) * d;
        if (!bridgeAt(x, z) && !bridgeAt(x + 1, z) && !bridgeAt(x - 1, z) && !bridgeAt(x, z + 1) && !bridgeAt(x, z - 1)) { out.push({ id: `${w.id}-${i}`, x, z }); break; }
      }
    }
  }
  return out;
}

const isObj = (o) => o && typeof o === 'object' && !Array.isArray(o);
/** Sổ ngọc trai: { v, day, got: [id], total }. Qua ngày mới thì ngọc mọc lại (got = []). Dữ liệu hỏng → trống, không ném lỗi. */
export function loadPearls(raw, today) {
  let o = raw; if (typeof raw === 'string') { try { o = JSON.parse(raw); } catch (_) { o = null; } }
  const base = { v: 1, day: String(today || ''), got: [], total: 0 };
  if (!isObj(o)) return base;
  const total = Number.isFinite(+o.total) ? Math.max(0, Math.min(1e9, Math.floor(+o.total))) : 0;
  if (o.day !== base.day) return { ...base, total };
  return { ...base, got: Array.isArray(o.got) ? [...new Set(o.got.filter((s) => typeof s === 'string'))].slice(0, 99) : [], total };
}
/** Đang lặn tại (x, z): nhặt viên ngọc gần nhất còn đó trong bán kính. Trả { pearls, got: id|null, capped }. Hết quota ngày → capped (không nhặt, ngọc còn nguyên). */
export function tryPearl(pearls, mode, x, z, spots = pearlSpots()) {
  if (mode !== 'dive') return { pearls, got: null, capped: false };
  if (pearls.got.length >= SWIM.dayCap) return { pearls, got: null, capped: true };
  let best = null, bd = SWIM.pearlR; for (const s of spots) { if (pearls.got.includes(s.id)) continue; const d = Math.hypot(x - s.x, z - s.z); if (d <= bd) { best = s; bd = d; } }
  if (!best) return { pearls, got: null, capped: false };
  return { pearls: { ...pearls, got: [...pearls.got, best.id], total: pearls.total + 1 }, got: best.id, capped: false };
}
