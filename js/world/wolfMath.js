// SÓI KHÍ VÀNG (Phiên 224, mục 1): chuyển động con sói vồ ra khi đánh thường đòn THỨ 3 bằng Gậy tre. LOGIC THUẦN (không DOM / three.js), có test: tests/wolffx.test.mjs. Hình khối + vẽ: js/ui/wolfFx.js.
// Sói sống WOLF.life giây: 0–14% hiện ra sát người → 14–64% PHÓNG tới trước (vồ, há mõm, vọt lên rồi hạ xuống) → 64–72% ngoạm (mõm đóng sập) → mờ dần tan thành khí.
// Mọi con số là QUY ƯỚC TẠM (tam: true), chờ ptg chơi thử rồi chỉnh.
export const WOLF = Object.freeze({
  tam: true,
  life: 1.15,       // giây sống
  rangeMin: 3.2,    // m: tầm vồ tối thiểu
  rangeMax: 9,      // m: tầm vồ tối đa
  rangeAir: 6,      // m: tầm vồ khi KHÔNG có quái
  leap: 0.9,        // m: độ vọt lên giữa đường vồ
  scale: 1.7,       // hệ số to của cả con sói (đầu còn to hơn: HEAD_BIG trong js/ui/wolfFx.js)
  windup: 0.14,     // tỉ lệ vòng đời: hiện ra
  lungeEnd: 0.64,   // tỉ lệ vòng đời: hết phóng, bắt đầu ngoạm
  biteEnd: 0.72,    // tỉ lệ vòng đời: ngoạm xong
  max: 2,           // số sói sống cùng lúc
});

const clamp01 = (x) => (Number.isFinite(+x) ? Math.max(0, Math.min(1, +x)) : 0);
const smooth = (x) => { const c = clamp01(x); return c * c * (3 - 2 * c); };
const easeOut = (x) => { const c = clamp01(x); return 1 - (1 - c) * (1 - c); };

/** Tầm vồ (m) tới mục tiêu cách `gap` m: kẹp trong [rangeMin, rangeMax]; không có mục tiêu (gap lạ / ≤ 0) → rangeAir. */
export function wolfRange(gap) {
  const g = Number(gap);
  return Number.isFinite(g) && g > 0 ? Math.max(WOLF.rangeMin, Math.min(WOLF.rangeMax, g)) : WOLF.rangeAir;
}

/** Hướng (rad, quanh trục y, 0 = hướng +z) từ `from` {x,z} tới `to` {x,z}; không có đích / trùng điểm → giữ `fallback`. */
export function headingTo(from, to, fallback = 0) {
  if (!from || !to) return fallback;
  const dx = (to.x || 0) - (from.x || 0), dz = (to.z || 0) - (from.z || 0);
  return Math.hypot(dx, dz) < 1e-6 ? fallback : Math.atan2(dx, dz);
}

/**
 * Tư thế con sói tại giây t kể từ lúc thả, vồ xa `range` m. Trả:
 *  done — hết vòng đời; k — tiến độ 0..1; dist — m đi được dọc hướng vồ; up — m vọt lên;
 *  jaw — độ há mõm 0..1; vis — độ rõ 0..1 (mờ dần cuối đời); grow — cỡ 0..1 (to dần lúc hiện); bite — true đúng giai đoạn ngoạm.
 */
export function wolfPose(t, range = WOLF.rangeAir) {
  const x = Number.isFinite(+t) ? Math.max(0, +t) : 0, R = Number.isFinite(+range) && +range > 0 ? +range : WOLF.rangeAir;
  const k = x / WOLF.life;
  if (k >= 1) return { done: true, k: 1, dist: R, up: 0, jaw: 0, vis: 0, grow: 1, bite: false };
  const w = WOLF.windup, l = WOLF.lungeEnd, b = WOLF.biteEnd;
  if (k < w) { const a = k / w; return { done: false, k, dist: 0.35 * smooth(a), up: 0, jaw: 0.35 * a, vis: smooth(a), grow: 0.35 + 0.65 * smooth(a), bite: false }; }
  if (k < l) {
    const a = (k - w) / (l - w), d = 0.35 + (R - 0.35) * easeOut(a);
    return { done: false, k, dist: d, up: Math.sin(Math.PI * a) * WOLF.leap, jaw: 0.35 + 0.65 * smooth(Math.min(1, a * 2)), vis: 1, grow: 1, bite: false };
  }
  if (k < b) { const a = (k - l) / (b - l); return { done: false, k, dist: R, up: 0, jaw: 1 - smooth(a), vis: 1, grow: 1, bite: true }; }
  return { done: false, k, dist: R, up: 0, jaw: 0, vis: 1 - smooth((k - b) / (1 - b)), grow: 1, bite: false };
}
