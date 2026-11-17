// SÓI KHÍ VÀNG (Phiên 224, mục 1; nâng cấp Phiên 227): chuyển động con sói vồ ra khi đánh thường đòn THỨ 3 bằng Gậy dạy chó (id nội bộ 'tre'). LOGIC THUẦN (không DOM / three.js), có test: tests/wolffx.test.mjs. Hình khối + vẽ: js/ui/wolfFx.js. Sát thương cú ngoạm: js/ui/wolfHit.js.
// Sói sống WOLF.life giây: 0–14% hiện ra sát người → 14–64% PHÓNG tới trước (vồ, há mõm, vọt lên rồi hạ xuống) → 64–72% ngoạm (mõm đóng sập, GÂY SÁT THƯƠNG ở đây) → mờ dần tan thành khí.
// Mọi con số là QUY ƯỚC TẠM (tam: true), chờ ptg chơi thử rồi chỉnh.
export const WOLF = Object.freeze({
  tam: true,
  life: 1.15,       // giây sống
  rangeMin: 3.2,    // m: tầm vồ tối thiểu
  rangeMax: 9,      // m: tầm vồ tối đa
  rangeAir: 6,      // m: tầm vồ khi KHÔNG có quái
  leap: 0.9,        // m: độ vọt lên giữa đường vồ
  scale: 2.2,       // hệ số to của cả con sói (Phiên 227: to hơn, trước là 1,7; đầu còn to hơn: HEAD_BIG trong js/ui/wolfFx.js)
  windup: 0.14,     // tỉ lệ vòng đời: hiện ra
  lungeEnd: 0.64,   // tỉ lệ vòng đời: hết phóng, bắt đầu ngoạm
  biteEnd: 0.72,    // tỉ lệ vòng đời: ngoạm xong
  max: 2,           // số sói sống cùng lúc
  dmgMul: 1.4,      // Phiên 227: sát thương cú ngoạm = dmgMul × sát thương đánh thường gốc (stoneDamage)
  biteReach: 3.2,   // Phiên 227: m — tầm ăn của cú ngoạm, tính từ mép thân quái tới điểm ngoạm
  biteMax: 3,       // Phiên 227: số quái tối đa dính một cú ngoạm
  splashPct: 0.6,   // Phiên 227: quái dính phụ (ngoài con gần nhất) nhận bấy nhiêu phần sát thương
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

/** Phiên 227: điểm ngoạm {x, z} = chỗ đứng `pos` + `range` m theo hướng `heading` (cùng chỗ sói phóng tới). */
export function bitePoint(pos, heading, range) {
  const h = Number.isFinite(+heading) ? +heading : 0, r = Number.isFinite(+range) && +range > 0 ? +range : WOLF.rangeAir;
  const x = pos && Number.isFinite(+pos.x) ? +pos.x : 0, z = pos && Number.isFinite(+pos.z) ? +pos.z : 0;
  return { x: x + Math.sin(h) * r, z: z + Math.cos(h) * r };
}

/** Phiên 227: các quái còn sống nằm trong tầm ăn của cú ngoạm (mép thân cách điểm ngoạm ≤ reach), gần nhất trước, tối đa `max` con. bodyOf(m) = bán kính thân. */
export function biteTargets(pt, mons, bodyOf, reach = WOLF.biteReach, max = WOLF.biteMax) {
  const out = [];
  for (const m of mons || []) {
    if (!m || m.ghost || !Number.isFinite(+m.x) || !Number.isFinite(+m.z) || !(m.oan > 0)) continue;
    const d = Math.hypot(m.x - pt.x, m.z - pt.z) - (bodyOf ? bodyOf(m) : 0);
    if (d <= reach) out.push({ m, d });
  }
  out.sort((a, b) => a.d - b.d);
  return out.slice(0, Math.max(0, max)).map((o) => o.m);
}

/** Phiên 227: sát thương từng quái dính cú ngoạm: con gần nhất nhận đủ `base`, các con sau nhận splashPct × base (tối thiểu 1). */
export function biteDamages(base, n) {
  const b = Math.max(1, Math.round(+base || 1));
  return Array.from({ length: Math.max(0, n | 0) }, (_, i) => (i === 0 ? b : Math.max(1, Math.round(b * WOLF.splashPct))));
}
