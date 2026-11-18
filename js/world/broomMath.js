// ĐẬP CHỔI (Phiên 230, mục 2): chuyển động cú đập chổi khi cầm CHỔI đánh thường đòn THỨ 3 + quỹ đạo lá / cát / đá bay lên. LOGIC THUẦN (không DOM, không three.js, không đọc đồng hồ), có test: tests/broommath.test.mjs. Hình + vẽ: js/ui/broomFx.js.
// Cú đập sống BROOM.life giây: [0, windup) giơ đầu chổi to lên cao (đầu phình dần) → [windup, windup+slam) ĐẬP xuống đất rất nhanh → chạm đất (impact) lá/cát/đá tung lên → nằm lại rồi tan.
// Mọi con số là QUY ƯỚC TẠM (tam: true), chờ ptg chơi thử rồi chỉnh. Cú đập CHỈ LÀ HIỆU ỨNG: sát thương đòn 3 vẫn do chuỗi đánh thường (BASIC.stepMul 1,5 + lan) lo.
export const BROOM = Object.freeze({
  tam: true,
  life: 1.5,        // giây sống cả cú đập
  windup: 0.42,     // giây: giơ chổi lên
  slam: 0.12,       // giây: đập xuống
  head: 2.6,        // đầu chổi phình to gấp ngần này lúc đập
  height: 3.4,      // m: độ cao đầu chổi lúc giơ
  rangeMin: 1.8, rangeMax: 5, rangeAir: 3.2,   // m: chỗ đập phía trước người
  leaves: 26, sand: 22, stones: 9,   // số lá / hạt cát / viên đá tung lên
  g: 9.8,           // m/s²
  max: 2,           // số cú đập sống cùng lúc
  windS: 0.9, windCount: 5,   // gió nhẹ thổi lên từ phía sau mỗi đòn: sống bao lâu (giây), số luồng
});

const num = (x, d = 0) => (Number.isFinite(+x) ? +x : d);
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const IMPACT_T = BROOM.windup + BROOM.slam;

/** Tầm đập theo khoảng cách tới quái (m); không có quái → rangeAir. */
export const broomRange = (gap) => (num(gap) > 0 ? clamp(num(gap) - 0.6, BROOM.rangeMin, BROOM.rangeMax) : BROOM.rangeAir);

/** Tư thế cú đập tại giây t: { done, lift (m, độ cao đầu chổi), grow (hệ số phình đầu 1..head), tilt (rad, ngả ra sau → 0 khi đập), impact (đã chạm đất), fade (0..1 độ đậm) }. */
export function slamPose(t) {
  const x = Math.max(0, num(t));
  if (x >= BROOM.life) return { done: true, lift: 0, grow: BROOM.head, tilt: 0, impact: true, fade: 0 };
  if (x < BROOM.windup) { const k = x / BROOM.windup, e = 1 - (1 - k) * (1 - k); return { done: false, lift: BROOM.height * e, grow: 1 + (BROOM.head - 1) * e, tilt: -0.5 * e, impact: false, fade: Math.min(1, x / 0.1) }; }
  if (x < IMPACT_T) { const k = (x - BROOM.windup) / BROOM.slam, e = k * k; return { done: false, lift: BROOM.height * (1 - e), grow: BROOM.head, tilt: -0.5 * (1 - e), impact: false, fade: 1 }; }
  const k = (x - IMPACT_T) / (BROOM.life - IMPACT_T);
  return { done: false, lift: 0, grow: BROOM.head, tilt: 0, impact: true, fade: k < 0.55 ? 1 : 1 - (k - 0.55) / 0.45 };
}

const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

/** Danh sách mảnh bay (xác định theo seed, để người khác vẽ GIỐNG nhau). Mỗi mảnh: { kind: 'la'|'cat'|'da', ang (hướng tỏa), v (m/s ngang), up (m/s lên), spin (rad/s), size }. */
export function debrisPlan(seed = 1) {
  const out = [], s = num(seed, 1);
  const make = (kind, n, vMin, vMax, upMin, upMax, size) => { for (let i = 0; i < n; i++) { const r = (k) => hash(s * 13.7 + out.length * 7.3 + k); out.push({ kind, ang: r(1) * Math.PI * 2, v: vMin + r(2) * (vMax - vMin), up: upMin + r(3) * (upMax - upMin), spin: (r(4) - 0.5) * 16, size: size * (0.7 + r(5) * 0.6) }); } };
  make('la', BROOM.leaves, 0.8, 3.4, 4, 8.5, 0.22);
  make('cat', BROOM.sand, 1, 4.2, 2.5, 6, 0.11);
  make('da', BROOM.stones, 0.8, 2.6, 3.5, 6.5, 0.16);
  return out;
}

/** Vị trí mảnh bay tại giây u kể từ lúc chạm đất (đạn đạo, rơi chạm đất thì nằm lại). Trả { r (m ngang), y (m), landed }. Lá nhẹ: rơi chậm (g×0,25) và lượn. */
export function debrisAt(d, u) {
  const t = Math.max(0, num(u)), g = d.kind === 'la' ? BROOM.g * 0.25 : BROOM.g, drag = d.kind === 'cat' ? 0.6 : 1;
  const y = d.up * t - 0.5 * g * t * t;
  if (y <= 0 && t > 0) { const tl = (2 * d.up) / g; return { r: d.v * drag * tl, y: 0, landed: true }; }
  return { r: d.v * drag * t, y, landed: false };
}

/** Một luồng gió nhẹ thổi lên từ PHÍA SAU người đánh (i = 0..windCount-1; u = giây từ lúc đánh): vị trí cục bộ { back (m sau lưng), side, y }, độ đậm. */
export function windAt(i, u) {
  const k = clamp(num(u) / BROOM.windS, 0, 1), side = (hash(i * 3.1 + 1) - 0.5) * 1.8;
  return { back: 1.4 - 1.1 * k, side: side * (1 - 0.3 * k), y: 0.2 + 1.5 * k + 0.2 * i * 0.3, a: Math.sin(Math.PI * k) * 0.5, done: k >= 1 };
}
