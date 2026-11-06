// Thời tiết (Phiên 25): hàm THUẦN, không đụng three.js/DOM, có test (tests/weather.test.mjs).
// Cấp mưa: 0 trời quang · 1 mưa nhỏ · 2 mưa vừa · 3 mưa lớn (có sấm chớp). Cấp được chọn NGẪU NHIÊN theo mùa nhưng chuyển TỪ TỪ:
// `cur` (số thực 0..3) trôi dần tới `target`, mỗi lần chỉ nhích tối đa một cấp rồi nghỉ một lúc → mưa nhỏ ⇄ vừa ⇄ lớn đều đi được cả hai chiều.
// ?troi=0..3 giữ cố định một cấp (để xem thử / chụp ảnh); không có tham số = ngẫu nhiên, luôn mở đầu bằng trời quang.
// Phiên 27: chế độ DÙNG CHUNG (shared): cấp mưa mục tiêu suy ra từ đồng hồ thật + mùa, nên mọi người chơi thấy cùng một cơn mưa (xem sharedLevel).
export const LEVEL_NAME = ['Trời quang', 'Mưa nhỏ', 'Mưa vừa', 'Mưa lớn'];
export const RATE = 1 / 35;                 // tốc độ chuyển: 1 cấp mất ~35 giây thật
const HOLD = [[120, 360], [50, 150], [50, 130], [35, 90]];   // thời gian giữ mỗi cấp (giây thật) trước khi chọn cấp kế
const FIRST_CLEAR = [90, 180];              // lúc mở trang: quang đãng ít nhất ~1,5 phút rồi mới có thể mưa
// Xác suất theo mùa. rainStart: khi đang quang, xác suất chuyển sang mưa ở lần chọn kế; up: đang mưa, xác suất tăng cấp (còn lại: giảm cấp hoặc giữ).
const SEASON_P = {
  xuan: { rainStart: 0.30, up: 0.25, stay: 0.20 },
  ha:   { rainStart: 0.55, up: 0.45, stay: 0.15 },   // mùa hạ: mưa rào, giông
  thu:  { rainStart: 0.25, up: 0.20, stay: 0.25 },
  dong: { rainStart: 0.15, up: 0.08, stay: 0.30 },   // mùa đông: chủ yếu mưa phùn
};

const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const range = (r, rng) => r[0] + (r[1] - r[0]) * rng();

/** Đọc ?troi=0..3 → { level, fixed }. Không có/sai → { level: null, fixed: false } (ngẫu nhiên). */
export function parseWeatherParam(search) {
  const v = new URLSearchParams(search || '').get('troi');
  if (v === null || v === '') return { level: null, fixed: false };
  const n = Number(v);
  return Number.isInteger(n) && n >= 0 && n <= 3 ? { level: n, fixed: true } : { level: null, fixed: false };
}

/** Chọn cấp kế tiếp từ cấp `level` (nguyên 0..3); mỗi lần đổi tối đa một cấp. `rng()` trong [0,1). Hàm thuần để test. */
export function nextLevel(level, season, rng = Math.random) {
  const p = SEASON_P[season] || SEASON_P.xuan, r = rng();
  if (level === 0) return r < p.rainStart ? 1 : 0;
  if (level === 3) return r < 0.7 ? 2 : 3;                 // mưa lớn thường dịu xuống, đôi khi kéo dài
  if (r < p.up) return level + 1;
  if (r < p.up + p.stay) return level;
  return level - 1;
}

// ---- Thời tiết DÙNG CHUNG (Phiên 27) ----
// Thời gian chia thành các "ô" SLOT_SECONDS giây theo đồng hồ thật (UTC). Cấp mưa của ô k là kết quả của chuỗi nextLevel chạy qua
// SHARED_WARMUP ô cuối cùng (k-WARMUP+1 … k), mỗi ô dùng một số ngẫu nhiên băm từ CHÍNH số ô đó, xuất phát từ trời quang.
// Không cần máy chủ, không cần lưu gì: hai máy cùng đồng hồ + cùng mùa luôn ra cùng cấp mưa. Mỗi ô chỉ đổi tối đa một cấp.
export const SLOT_SECONDS = 120;
export const SHARED_WARMUP = 24;            // cửa sổ "nhìn lại" ban đầu (24 ô = 48 phút); nếu chưa chắc chắn thì nhân đôi tới SHARED_MAX_BACK
const SHARED_MAX_BACK = 768;
const hash01 = (n) => {                     // băm số nguyên → [0,1); phân bố đều, cùng n luôn cùng kết quả
  let x = (n | 0) ^ 0x9e3779b9;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b); x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35); x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
};
export const slotOf = (nowMs) => Math.floor(nowMs / 1000 / SLOT_SECONDS);
/** Một bước chuỗi cho chế độ dùng chung, ĐƠN ĐIỆU theo cấp (cùng số ngẫu nhiên r thì cấp cao hơn không bao giờ rơi xuống thấp hơn cấp thấp).
 *  Tính đơn điệu cho phép "ghép" mọi điểm xuất phát lại với nhau (coupling from the past) → kết quả không phụ thuộc cửa sổ nhìn lại và
 *  hai ô kề nhau luôn khớp: cấp ô sau = bước(cấp ô trước). Xác suất lấy từ cùng bảng SEASON_P như nextLevel (mưa lớn dịu xuống ≤ 0,7). */
export function stepShared(level, season, r) {
  const p = SEASON_P[season] || SEASON_P.xuan;
  const u = [p.rainStart, p.up, p.up, 0][level];                        // xác suất lên cấp
  const d = [0, 1 - p.up - p.stay, 1 - p.up - p.stay, Math.min(0.7, 1 - p.up)][level];   // xác suất xuống cấp
  return r < d ? level - 1 : r >= 1 - u ? level + 1 : level;
}
/** Cấp mưa (nguyên 0..3) dùng chung tại thời điểm `nowMs` (mili-giây Unix) cho mùa `season`. Hàm thuần, tất định.
 *  Chạy hai chuỗi (xuất phát từ quang 0 và từ mưa lớn 3) cùng một dãy số ngẫu nhiên; khi hai chuỗi gặp nhau thì kết quả chắc chắn, nếu chưa thì lùi xa hơn. */
export function sharedLevel(nowMs, season) {
  const slot = slotOf(nowMs); let lo = 0;
  for (let back = SHARED_WARMUP; back <= SHARED_MAX_BACK; back *= 2) {
    lo = 0; let hi = 3;
    for (let k = slot - back + 1; k <= slot; k++) { const r = hash01(k); lo = stepShared(lo, season, r); hi = stepShared(hi, season, r); }
    if (lo === hi) return lo;
  }
  return lo;                                // gần như không bao giờ tới đây (hai chuỗi không gặp nhau sau 768 ô); vẫn tất định
}

/** Hiệu ứng hiển thị cho mức mưa `cur` (0..3, số thực). Mọi giá trị hữu hạn; cur = 0 → không ảnh hưởng gì (như cũ). */
export function effects(cur) {
  const c = clamp(cur, 0, 3), r = c / 3;
  return {
    rain: r,                                         // 0..1 cường độ chung
    drops: c < 0.02 ? 0 : 0.12 + 0.88 * smooth(0, 3, c),   // tỉ lệ số hạt mưa (0..1): mưa nhỏ thưa, mưa lớn dày
    streak: 0.55 + 0.75 * r,                         // độ dài vệt mưa
    wind: 0.12 * smooth(0, 0.5, c) + 0.88 * smooth(0.5, 3, c),   // 0..1: nghiêng hạt mưa, lá/cánh hoa bay ngang, cây lay
    dim: smooth(0, 3, c) * 0.9,                      // 0..~0.9: giảm nắng
    grey: smooth(0, 2.4, c) * 0.8,                   // 0..0.8: trời xám đi
    fog: 0.9 * smooth(0, 3, c),                      // cộng thêm vào hệ số sương (nhân 1 + fog)
    cloud: smooth(0, 1.6, c),                        // 0..1: mây che trăng sao
  };
}

/**
 * Bộ thời tiết có trạng thái.
 *  opts: { rng, season, level (nguyên → cố định; null = ngẫu nhiên), startLevel, shared, nowMs }
 *   shared: true → cấp mục tiêu lấy từ sharedLevel(nowMs, season) (dùng chung mọi người chơi); mở trang là vào đúng cơn mưa đang diễn ra.
 *  .update(dt, nowMs?) → mảng sự kiện [{ type:'thunder', vol, ... }] (tiếng sấm tới sau tia chớp một khoảng trễ); nowMs chỉ dùng khi shared
 *  .cur  mức mưa thực (0..3)      .level  cấp làm tròn (0..3)      .name  tên cấp
 *  .wet  độ ướt mặt đất 0..1 (ướt nhanh, khô chậm)       .flash  độ lóe chớp 0..1 ở thời điểm hiện tại
 *  .fx   effects(cur)             .storm  đang có giông (cấp ≥ 2,5)
 */
export function createWeather({ rng = Math.random, season = 'xuan', level = null, startLevel = 0, shared = false, nowMs = 0 } = {}) {
  const fixed = Number.isInteger(level), useShared = !!shared && !fixed;
  const first = fixed ? level : useShared ? sharedLevel(nowMs, season) : clamp(startLevel, 0, 3);
  const w = {
    cur: first, target: first, fixed, shared: useShared, slot: useShared ? slotOf(nowMs) : -1,
    hold: fixed || useShared ? Infinity : range(FIRST_CLEAR, rng), wet: useShared && first > 0 ? 0.6 : 0, flash: 0, t: 0, nextBolt: 0, bolts: [], thunders: [], season,
    get level() { return clamp(Math.round(this.cur), 0, 3); },
    get name() { return LEVEL_NAME[this.level]; },
    get fx() { return effects(this.cur); },
    get storm() { return this.cur >= 2.5; },
    update(dt, now) {
      dt = clamp(dt, 0, 0.25); this.t += dt;
      if (this.shared) {                                                    // mục tiêu theo đồng hồ chung; cur vẫn trôi từ từ tới đó
        if (Number.isFinite(now)) { const s = slotOf(now); if (s !== this.slot) { this.slot = s; this.target = sharedLevel(now, this.season); } }   // chỉ tính lại khi sang ô mới
      }
      else if (!this.fixed) {
        this.hold -= dt;
        if (this.hold <= 0 && Math.abs(this.cur - this.target) < 0.01) {   // đã tới cấp đang nhắm → chọn cấp kế
          const cl = clamp(Math.round(this.target), 0, 3);
          this.target = nextLevel(cl, this.season, rng); this.hold = range(HOLD[this.target], rng);
        }
      }
      const d = this.target - this.cur, step = RATE * dt;
      this.cur = Math.abs(d) <= step ? this.target : this.cur + Math.sign(d) * step;
      // Mặt đất: ướt nhanh khi có mưa, khô rất chậm khi tạnh
      const rainy = this.cur > 0.05;
      this.wet = clamp(this.wet + (rainy ? dt / 30 : -dt / 150), 0, 1);
      // Sấm chớp: chỉ khi giông. Tia chớp (có thể lóe 2 lần liên tiếp) rồi tiếng sấm tới sau (khoảng cách / tốc độ âm thanh).
      if (this.storm) {
        if (this.nextBolt <= 0) this.nextBolt = this.t + 4 + rng() * 14;
        if (this.t >= this.nextBolt) {
          const dist = 250 + rng() * 1750, amp = 0.75 + rng() * 0.25, at = this.t;     // mét
          this.bolts.push({ at, amp });
          if (rng() < 0.55) this.bolts.push({ at: at + 0.13 + rng() * 0.12, amp: amp * (0.5 + rng() * 0.3) });
          this.thunders.push({ at: at + dist / 343, vol: clamp(1 - dist / 2400, 0.25, 1), dist });
          this.nextBolt = this.t + 5 + rng() * 17;
        }
      } else this.nextBolt = 0;
      let f = 0; this.bolts = this.bolts.filter((b) => this.t - b.at < 1.2);
      for (const b of this.bolts) if (this.t >= b.at) f = Math.max(f, b.amp * Math.exp(-(this.t - b.at) / 0.09));   // lóe vọt lên rồi tắt nhanh (lóe thứ hai chưa tới giờ thì chưa tính)
      this.flash = f < 0.01 ? 0 : f;
      const ev = []; this.thunders = this.thunders.filter((th) => (this.t >= th.at ? (ev.push({ type: 'thunder', vol: th.vol, dist: th.dist }), false) : true));
      return ev;
    },
  };
  return w;
}

/** Câu thông báo khi cấp mưa đổi từ `prev` sang `next` (nguyên 0..3); rỗng nếu không đổi. */
export function changeMessage(prev, next) {
  if (prev === next) return '';
  if (next === 0) return 'Trời đã tạnh mưa.';
  if (prev === 0) return next === 1 ? 'Trời bắt đầu mưa nhỏ.' : next === 2 ? 'Trời đổ mưa.' : 'Mưa rất lớn, có sấm chớp. Hãy tìm chỗ trú.';
  if (next > prev) return next === 3 ? 'Mưa lớn dần, có sấm chớp.' : 'Mưa nặng hạt hơn.';
  return next === 1 ? 'Mưa nhỏ dần.' : 'Mưa đã dịu bớt.';
}
