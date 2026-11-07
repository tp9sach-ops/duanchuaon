// Kỹ năng người chơi (Phiên 4 master prompt, bước đầu): KHINH THÂN = nhảy cao. LOGIC THUẦN (không DOM, không three.js), có test: tests/skills.test.mjs.
// Bậc của kỹ năng lấy từ cốt truyện: js/world/story.js đặt story.skills.khinhthan = 1 khi xong chuỗi tưới cây. Trước file này KHÔNG có chỗ nào đọc con số đó nên mở khóa xong không thấy gì.
// Mọi con số (chiều cao, trọng lực) là QUY ƯỚC TẠM của dự án, chờ ptg duyệt. Mới có bậc 1 được chốt từ cốt truyện; bậc 2–8 để sẵn bảng cho các phiên sau.

/** Chiều cao nhảy (m) theo bậc 0..8. Bậc 0 = chưa mở, không nhảy được. */
export const KHINH_THAN_CAO = [0, 1.1, 1.6, 2.2, 2.9, 3.7, 4.6, 5.6, 6.8];
export const MAX_BAC = KHINH_THAN_CAO.length - 1;
/** Trọng lực (m/s²) khi nhảy: nhỏ hơn thật cho cảm giác "nhẹ thân". */
export const GRAVITY = 16;
const MAX_STEP = 1 / 60;   // mỗi bước mô phỏng tối đa 1/60 s: khung hình chậm cũng không "bay xuyên" đỉnh nhảy

/** Bậc khinh thân từ trạng thái cốt truyện (story.skills.khinhthan); dữ liệu lạ → 0. */
export function khinhLevel(story) {
  const v = story && story.skills ? Math.floor(+story.skills.khinhthan) : 0;
  return Number.isFinite(v) ? Math.max(0, Math.min(MAX_BAC, v)) : 0;
}
/** Chiều cao nhảy (m) của bậc `lv`. */
export const jumpHeight = (lv) => KHINH_THAN_CAO[Math.max(0, Math.min(MAX_BAC, Math.floor(+lv) || 0))];
/** Thời gian trên không (giây) của cú nhảy cao `h` m. */
export const airTime = (h) => (h > 0 ? 2 * Math.sqrt((2 * h) / GRAVITY) : 0);

/** Có được nhảy lúc này không? mode = LGT.world.mode ('free' mới nhảy; ngồi/thiền/lạy/đang đi tới bồ đoàn thì không). */
export function canJump({ level = 0, mode = 'free', panelOpen = false, dialogOpen = false } = {}) {
  return level > 0 && mode === 'free' && !panelOpen && !dialogOpen;
}

/** Bộ mô phỏng một cú nhảy theo phương thẳng đứng: { y (m, ≥ 0 so với mặt đất), air, start(cao), step(dt) }. */
export function createJump() {
  let y = 0, vy = 0, air = false;
  return {
    get y() { return y; }, get air() { return air; }, get vy() { return vy; },
    /** Bắt đầu nhảy cao `cao` m. Đang ở trên không hoặc cao ≤ 0 → false (không nhảy chồng). */
    start(cao) { if (air || !(cao > 0)) return false; vy = Math.sqrt(2 * GRAVITY * cao); air = true; return true; },
    /** Tiến `dt` giây, trả độ cao mới. Chạm đất thì dừng hẳn (y = 0). */
    step(dt) {
      if (!air) return 0;
      let left = Math.max(0, Math.min(Number.isFinite(+dt) ? +dt : 0, 0.25));
      while (left > 0 && air) { const h = Math.min(left, MAX_STEP); vy -= GRAVITY * h; y += vy * h; left -= h; if (y <= 0) { y = 0; vy = 0; air = false; } }
      return y;
    },
    reset() { y = 0; vy = 0; air = false; },
  };
}

// ---- Phiên 52: mở khóa khinh thân bậc 2–8 (luyện bằng cấp độ + hạt sen). Mọi con số là QUY ƯỚC TẠM, chờ ptg duyệt.
/** Điều kiện lên bậc 2..8: cấp độ người chơi tối thiểu + số hạt sen phải trả. Bậc 1 mở bằng cốt truyện nên không có ở đây. */
export const KHINH_YEU_CAU = [null, null,
  { cap: 2, sen: 10 }, { cap: 3, sen: 25 }, { cap: 4, sen: 50 }, { cap: 5, sen: 90 }, { cap: 6, sen: 150 }, { cap: 8, sen: 250 }, { cap: 10, sen: 400 }];
/** Tên cảnh giới (bậc 1..8) để hiển thị. */
export const KHINH_TEN = ['', 'Nhất Diệp', 'Nhị Nhạn', 'Tam Vân', 'Tứ Phong', 'Ngũ Lăng', 'Lục Hạc', 'Thất Tinh', 'Bát Thiên'];
/** Trần độ cao nhảy (m) khi đang trong nhà, để không nhảy xuyên trần. */
export const INDOOR_MAX = 1.6;
/** Độ cao nhảy thật: trong nhà bị chặn ở INDOOR_MAX. */
export const jumpHeightAt = (lv, indoor = false) => { const h = jumpHeight(lv); return indoor ? Math.min(h, INDOOR_MAX) : h; };

/** Đọc bậc đã luyện (chuỗi JSON hoặc đối tượng {v,bac}); hỏng → 0. */
export function loadKhinh(raw) {
  let o = raw; if (typeof raw === 'string') { try { o = JSON.parse(raw); } catch (_) { o = null; } }
  const v = o && typeof o === 'object' ? Math.floor(+o.bac) : 0;
  return Number.isFinite(v) ? Math.max(0, Math.min(MAX_BAC, v)) : 0;
}
/** Bậc thực dùng: phải xong cốt truyện (bậc 1) mới tính phần đã luyện; lấy số lớn hơn. */
export function khinhBac(story, luyen = 0) {
  const base = khinhLevel(story);
  return base > 0 ? Math.max(base, loadKhinh({ bac: luyen })) : 0;
}
/**
 * Có luyện lên bậc kế được không? in: { bac (hiện có), capNguoi, sen }.
 * Trả { ok, reason: ''|'chua-mo'|'toi-da'|'cap'|'sen', next, cap, sen } (cap/sen = điều kiện của bậc kế).
 */
export function trainPlan({ bac = 0, capNguoi = 1, sen = 0 } = {}) {
  const b = Math.max(0, Math.min(MAX_BAC, Math.floor(+bac) || 0));
  if (b < 1) return { ok: false, reason: 'chua-mo', next: 1, cap: 0, sen: 0 };
  if (b >= MAX_BAC) return { ok: false, reason: 'toi-da', next: MAX_BAC, cap: 0, sen: 0 };
  const next = b + 1, y = KHINH_YEU_CAU[next];
  if ((+capNguoi || 0) < y.cap) return { ok: false, reason: 'cap', next, cap: y.cap, sen: y.sen };
  if ((+sen || 0) < y.sen) return { ok: false, reason: 'sen', next, cap: y.cap, sen: y.sen };
  return { ok: true, reason: '', next, cap: y.cap, sen: y.sen };
}
