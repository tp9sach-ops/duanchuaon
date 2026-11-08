/* Tự giảm chất lượng cảnh khi máy yếu (PERF governor) — logic thuần, không đụng three.js, có test (tests/perf.test.mjs).
   Cảnh gọi createGovernor().feed(dt) mỗi khung; khi nó báo đổi bậc thì cảnh gọi levelPlan(bậc) để biết bật/tắt gì.

   BẬC (0 = đầy đủ → 5 = nhẹ nhất; chỉ đi xuống, không tự lên lại trong một lần chạy):
     0  đầy đủ
     1  pixelRatio 1
     2  tắt bloom
     3  bản đồ bóng nhỏ một nửa (≥ 512) + rừng thôi đổ bóng
     4  tắt đổ bóng
     5  pixelRatio 0,75 + ít hạt + rừng ngoài chùa thưa còn 35% (Phiên 64: trước đây ẨN HẾT nên máy yếu mất sạch cây)
   Ngưỡng và số liệu là QUY ƯỚC TẠM (chờ thử trên điện thoại thật). */

export const MAX_LEVEL = 5;
export const KEY = 'lgt.perf';
export const SAVE_DAYS = 7;   // nhớ bậc đã hạ 7 ngày, để lần sau mở lên máy yếu không phải giật lại từ đầu

export const clampLevel = (v) => { const n = Math.round(+v); return Number.isFinite(n) ? Math.min(MAX_LEVEL, Math.max(0, n)) : 0; };

/* Việc cần làm ở từng bậc. dpr = devicePixelRatio của máy; shadowBase = cỡ bản đồ bóng gốc (1024 điện thoại / 2048 máy tính). */
export function levelPlan(level, { dpr = 1, shadowBase = 2048 } = {}) {
  const L = clampLevel(level);
  return {
    level: L,
    pixelRatio: L >= 5 ? 0.75 : L >= 1 ? 1 : Math.min(dpr || 1, 2),
    bloom: L < 2,
    shadows: L < 4,
    shadowSize: L >= 3 ? Math.max(512, shadowBase >> 1) : shadowBase,
    forestShadow: L < 3,
    forest: true,                                  // không bao giờ ẩn hẳn rừng nữa
    forestDensity: L >= 5 ? 0.35 : L >= 3 ? 0.7 : 1,   // tỉ lệ cây còn lại (cắt bớt cuối danh sách)
    particles: L >= 5 ? 'low' : 'full',
  };
}

/* Bộ đo: bỏ `warmup` khung đầu (nạp shader, nạp ảnh), rồi mỗi cửa sổ `windowSec` giây tính FPS trung bình.
   FPS thấp liên tiếp `patience` cửa sổ thì hạ một bậc. Sau mỗi lần hạ bỏ qua một cửa sổ (biên dịch lại shader gây giật tạm thời).
   Khung có dt ≥ `skipDt` (đổi tab, treo máy) không được tính. Trả null nếu không đổi, hoặc { level, fps, from } khi hạ bậc. */
export function createGovernor({ start = 0, max = MAX_LEVEL, lowFps = 38, windowSec = 2, warmup = 60, patience = 2, skipDt = 0.5, fixed = false } = {}) {
  let level = clampLevel(start), frames = 0, acc = 0, n = 0, strikes = 0, settle = false;
  return {
    get level() { return level; },
    feed(dt) {
      if (fixed || !(dt > 0) || dt >= skipDt) return null;
      if (++frames <= warmup) return null;
      n++; acc += dt;
      if (acc < windowSec) return null;
      const fps = n / acc; n = 0; acc = 0;
      if (settle) { settle = false; return null; }
      strikes = fps < lowFps ? strikes + 1 : 0;
      if (strikes >= patience && level < max) {
        const from = level; level++; strikes = 0; settle = true;
        return { level, fps, from };
      }
      return null;
    },
  };
}

/* Nhớ bậc đã hạ. Dữ liệu hỏng/hết hạn/không có localStorage → trả 0. Không bao giờ ném lỗi. */
export function loadSaved(storage, now = Date.now()) {
  try {
    const o = JSON.parse(storage.getItem(KEY));
    if (!o || typeof o !== 'object' || !(now - o.t < SAVE_DAYS * 86400000) || o.t > now + 60000) return 0;
    return clampLevel(o.lv);
  } catch { return 0; }
}
export function save(storage, level, now = Date.now()) {
  try { storage.setItem(KEY, JSON.stringify({ lv: clampLevel(level), t: now })); return true; } catch { return false; }
}

/* Bậc xuất phát: lớn nhất của (điện thoại → 1), (bậc đã nhớ). ?perf=N (0–5) ép cố định và tắt tự động — dùng để chụp thử/kiểm. */
export function startLevel({ coarse = false, saved = 0, query = '' } = {}) {
  const q = new URLSearchParams(query).get('perf');
  if (q !== null && q !== '' && Number.isFinite(+q)) return { level: clampLevel(q), fixed: true };
  return { level: Math.max(coarse ? 1 : 0, clampLevel(saved)), fixed: false };
}
