// Kỹ năng người chơi (Phiên 4 master prompt, bước đầu): KHINH THÂN = nhảy cao. LOGIC THUẦN (không DOM, không three.js), có test: tests/skills.test.mjs.
// Bậc của kỹ năng lấy từ cốt truyện: js/world/story.js đặt story.skills.khinhthan = 1 khi xong chuỗi tưới cây. Trước file này KHÔNG có chỗ nào đọc con số đó nên mở khóa xong không thấy gì.
// Mọi con số (chiều cao, trọng lực) là QUY ƯỚC TẠM của dự án, chờ ptg duyệt. Mới có bậc 1 được chốt từ cốt truyện; bậc 2–8 để sẵn bảng cho các phiên sau.
import { FLY_CFG, flyVy, fallSpeed } from './glide.js';   // Phiên 196: bay lướt trên không (đệm hạ cánh, rơi chậm)

/** Chiều cao nhảy (m) theo bậc 0..8. Bậc 0 = chưa mở, không nhảy được. */
export const KHINH_THAN_CAO = [0, 2.0, 3.2, 4.6, 6.2, 8.0, 10.0, 12.3, 15.0];   // Phiên 197: nâng cao (trước 1,1…6,8 m). Đây là độ cao TỐI ĐA của bậc — phải ấn giữ nút Nhảy đủ lâu (gồng lực, js/world/charge.js) mới lên tới; bấm nhẹ chỉ ~35%
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
  let y = 0, vy = 0, air = false, gliding = false, fall = 0, apex = 0;
  return {
    get y() { return y; }, get air() { return air; }, get vy() { return vy; }, get gliding() { return gliding; }, get fall() { return fall; }, get apex() { return apex; },   // apex (Phiên 197): độ cao đỉnh của cú nhảy đang/vừa thực hiện — bay lướt tính tốc độ rơi theo đó
    /** Bắt đầu nhảy cao `cao` m. Đang ở trên không hoặc cao ≤ 0 → false (không nhảy chồng). */
    start(cao) { if (air || !(cao > 0)) return false; vy = Math.sqrt(2 * GRAVITY * cao); air = true; gliding = false; apex = +cao; return true; },
    /** Phiên 196: chuyển sang BAY LƯỚT (đang trên không, chưa bay): rơi chậm tối đa `fallV` m/s, hạ cánh có đoạn đệm. Không đủ điều kiện → false. */
    glide(fallV) {
      if (!air || gliding || !(+fallV > 0)) return false;
      gliding = true; fall = +fallV; return true;   // đang lên thì cứ lên nốt tới đỉnh (trọng lực nhẹ hơn 20%) rồi mới hạ chậm → bậc cao bay lâu hơn
    },
    /** Tiến `dt` giây, trả độ cao mới. Chạm đất thì dừng hẳn (y = 0). */
    step(dt) {
      if (!air) return 0;
      let left = Math.max(0, Math.min(Number.isFinite(+dt) ? +dt : 0, 0.25));
      while (left > 0 && air) {
        const h = Math.min(left, MAX_STEP);
        vy = gliding ? flyVy(vy, y, fall, h, GRAVITY) : vy - GRAVITY * h;
        y += vy * h; left -= h;
        if (y <= 0) { y = 0; vy = 0; air = false; gliding = false; }
      }
      return y;
    },
    reset() { y = 0; vy = 0; air = false; gliding = false; fall = 0; apex = 0; },
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

// ---- Phiên 139: NHẢY TỚI TRƯỚC + LƯỚT NÉ CHIÊU. Đang đi mà bấm Nhảy → bật tới trước (cả cú nhảy); bấm Nhảy tiếp lúc còn trên không hoặc vừa chạm đất → lướt thêm một đoạn
// và được bất tử ngắn để né chiêu quái. Mọi con số là QUY ƯỚC TẠM, chờ ptg duyệt.
export const LEAP_CFG = Object.freeze({ tam: true, minSpeed: 0.4, base: 2.2, perBac: 0.3 });   // m/s tối thiểu coi là "đang đi"; quãng bật tới = base + perBac × bậc (m)
export const GLIDE_CFG = Object.freeze({ tam: true, base: 3, perBac: 0.2, dur: 0.26, guard: 0.45, cd: 1.2, windowAfterLand: 0.6, minDist: 0.4 });   // quãng lướt, giây lướt, giây bất tử, hồi chiêu, cửa sổ sau khi chạm đất, quãng tối thiểu để tính là lướt được
const bacClamp = (lv) => Math.max(0, Math.min(MAX_BAC, Math.floor(+lv) || 0));
/** Kế hoạch bật tới trước: { dist (m), dur (giây = thời gian trên không) }. Bậc 0 hoặc trong nhà → null. */
export function leapPlan(lv, indoor = false, frac = 1) {   // Phiên 197: frac = tỉ lệ gồng (0,35..1) của cú nhảy — nhảy thấp bật tới ngắn hơn, nhảy cao bật xa hơn
  const b = bacClamp(lv); if (b <= 0 || indoor) return null;
  const f = Math.max(0.1, Math.min(1, Number.isFinite(+frac) ? +frac : 1));
  return { dist: Math.round((LEAP_CFG.base + LEAP_CFG.perBac * b) * (0.6 + 0.4 * f) * 100) / 100, dur: airTime(jumpHeight(b) * f) };
}
/** Kế hoạch lướt né: { dist, dur, guard (giây bất tử) }. Bậc 0 hoặc trong nhà → null. */
export function glidePlan(lv, indoor = false) {
  const b = bacClamp(lv); if (b <= 0 || indoor) return null;
  return { dist: Math.round((GLIDE_CFG.base + GLIDE_CFG.perBac * b) * 100) / 100, dur: GLIDE_CFG.dur, guard: GLIDE_CFG.guard };
}
/**
 * Phiên 196 — kế hoạch BAY LƯỚT (nhảy lần 2 khi còn trên không): { v0 (m/s xung đẩy đầu), cruise (m/s lướt duy trì), tau (s xung yếu dần), fall (m/s rơi tối đa),
 * turn (rad/s bẻ hướng), tilt (rad chúi thân), guard (s bất tử đầu) }. Bậc 0 hoặc trong nhà → null. Bậc cao bay xa + lâu hơn (đỉnh nhảy cao hơn → hạ lâu hơn).
 */
export function flyPlan(lv, indoor = false, apex) {   // Phiên 197: apex = độ cao đỉnh THẬT của cú nhảy (đã gồng); bỏ trống → độ cao tối đa của bậc
  const b = bacClamp(lv); if (b <= 0 || indoor) return null;
  const r = (v) => Math.round(v * 100) / 100;
  return { v0: r(FLY_CFG.v0Base + FLY_CFG.v0PerBac * b), cruise: r(FLY_CFG.cruiseBase + FLY_CFG.cruisePerBac * b), tau: FLY_CFG.tau, fall: r(fallSpeed(Number.isFinite(+apex) && +apex > 0 ? +apex : jumpHeight(b))), turn: FLY_CFG.turn, tilt: FLY_CFG.tilt, guard: GLIDE_CFG.guard };
}
/**
 * Bấm Nhảy lúc này làm gì? 'jump' (nhảy tại chỗ) | 'leap' (đang đi: bật tới trước) | 'glide' (lướt né) | 'none'.
 * in: { lv, air, sinceAir (giây từ lần cuối còn trên không), moving, glideCd (giây hồi chiêu lướt còn lại), indoor }
 */
export function nextAction({ lv = 0, air = false, sinceAir = Infinity, moving = false, glideCd = 0, indoor = false } = {}) {
  if (!(lv > 0)) return 'none';
  if (air || (Number.isFinite(+sinceAir) && +sinceAir <= GLIDE_CFG.windowAfterLand)) return !indoor && !(glideCd > 0) ? 'glide' : 'none';
  return moving && !indoor ? 'leap' : 'jump';
}
