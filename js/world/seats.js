// Bồ đoàn trong chánh điện + máy trạng thái hoạt động của nhân vật (ngồi, thiền, lạy). THUẦN: không three.js, có test.
// Bố cục theo ảnh mẫu (PROMPT.md mục 9.3, 9.5a): lưới bồ đoàn tròn xếp hàng đều trên thảm đỏ viền vàng, lối đi giữa chừa trống, quay mặt về bàn thờ (-z).
import { HALL, region, blocked } from './layout.js';
import { raySphere } from './spots.js';

export const SEAT_COLS = [-12.6, -9.6, -6.6, -3.6, 3.6, 6.6, 9.6, 12.6];   // lối đi giữa |x| < 3,6 để trống (Phiên 14e: 8 cột × 6 hàng = 48 chỗ)
export const SEAT_ROWS = [-41, -38, -35, -32, -29, -26];
export const SEAT_FACING = Math.PI;                              // ry = π: nhìn về -z (bàn thờ)
export const SEAT_Y = HALL.h + 0.26;                             // độ cao hông khi ngồi trên bồ đoàn
export const SEAT_R = 0.42;
/** Thảm đỏ viền vàng bao cả lưới bồ đoàn. */
export const RUG = { x0: -14.8, x1: 14.8, z0: -42.8, z1: -24.2, border: 0.25 };

export const SEATS = SEAT_ROWS.flatMap((z, r) => SEAT_COLS.map((x, c) => ({ id: `bd${r}${c}`, row: r, col: c, x, z, ry: SEAT_FACING })));

export const seatById = (id) => SEATS.find((s) => s.id === id) || null;

/** Tia (gốc o, hướng d) trúng bồ đoàn nào → { seat, t } hoặc null. Chọn cái gần nhất. */
export function pickSeat(o, d, maxT = 80) {
  let best = null;
  for (const s of SEATS) {
    const t = raySphere(o, d, [s.x, HALL.h + 0.2, s.z], 0.55);
    if (t !== null && t <= maxT && (!best || t < best.t)) best = { seat: s, t };
  }
  return best;
}

/** Bồ đoàn trống gần (x, z) nhất; `taken` là Set id đã có người (đa người, Phiên 15). */
export function nearestFreeSeat(p, taken = new Set()) {
  let best = null, bd = Infinity;
  for (const s of SEATS) { if (taken.has(s.id)) continue; const d = Math.hypot(s.x - p.x, s.z - p.z); if (d < bd) { bd = d; best = s; } }
  return best;
}

/** Chỗ đứng khi rời bồ đoàn: lùi ra phía lối đi phía sau (+z), 1,2 m. */
export const standPoint = (seat) => ({ x: seat.x, z: seat.z + 1.2 });

/** Đang đứng trong chánh điện (sàn gỗ hoặc bậc thềm)? */
export const inHall = (p) => region(p.x, p.z) === 'plat';

export const BOW_SECONDS = 3.2;   // một lần lạy: chắp tay → cúi → lên (khớp chu kỳ ~3 giây của poseFor 'bow')
const SIT_ARRIVE = 0.4;

/**
 * Máy trạng thái hoạt động. mode: 'free' | 'toSeat' | 'sit' | 'meditate' | 'bow'.
 *  goSit(seat, then) → bắt đầu đi tới bồ đoàn; step(p) mỗi khung khi đang đi → 'seated' khi tới nơi.
 *  bow() lạy (chỉ khi đang đứng tự do); meditate() chuyển ngồi thường thành thiền; stand() đứng dậy (trả chế độ cũ).
 *  update(dt) cho bow tự kết thúc; avatarState() → trạng thái hoạt ảnh cần đặt hoặc null (để lớp đi bộ tự quyết).
 */
const SIT_MODES = ['sit', 'meditate', 'chant', 'beads'];
export function createActivity() {
  let mode = 'free', seat = null, t = 0, then = 'sit';
  return {
    get mode() { return mode; }, get seat() { return seat; },
    get sitting() { return SIT_MODES.includes(mode); },
    goSit(s, after = 'sit') { if (mode === 'bow') mode = 'free'; mode = 'toSeat'; seat = s; then = SIT_MODES.includes(after) ? after : 'sit'; t = 0; },
    step(p) {
      if (mode !== 'toSeat') return null;
      if (Math.hypot(p.x - seat.x, p.z - seat.z) <= SIT_ARRIVE) { mode = then; return 'seated'; }
      return null;
    },
    cancelWalk() { if (mode === 'toSeat') { mode = 'free'; seat = null; } },
    bow() { if (mode !== 'free') return false; mode = 'bow'; t = 0; return true; },
    meditate() { return this.practice('meditate'); },
    /** Đang ngồi thì đổi hoạt động: 'sit' | 'meditate' | 'chant' (tụng kinh, gõ mõ) | 'beads' (lần tràng hạt). */
    practice(kind) { if (!this.sitting || !SIT_MODES.includes(kind)) return false; mode = kind; return true; },
    stand() { const was = mode; mode = 'free'; const s = seat; seat = null; t = 0; return { was, seat: s }; },
    update(dt) { if (mode === 'bow') { t += dt; if (t >= BOW_SECONDS) { mode = 'free'; t = 0; } } },
    avatarState() { return mode === 'bow' ? 'bow' : mode === 'chant' ? 'mo' : mode === 'beads' ? 'beads' : (mode === 'sit' || mode === 'meditate') ? 'sit' : null; },
  };
}

/** Kiểm dữ liệu bố cục: mọi bồ đoàn nằm trên sàn chánh điện, không trong vật cản, không đè nhau, nằm trong thảm. Trả mảng lỗi (rỗng = tốt). */
export function checkSeats() {
  const errs = [];
  for (const s of SEATS) {
    if (region(s.x, s.z) !== 'plat') errs.push(s.id + ': không nằm trên sàn chánh điện');
    if (blocked(s.x, s.z)) errs.push(s.id + ': bị vật cản chặn');
    if (s.x - SEAT_R < RUG.x0 || s.x + SEAT_R > RUG.x1 || s.z - SEAT_R < RUG.z0 || s.z + SEAT_R > RUG.z1) errs.push(s.id + ': ra ngoài thảm');
  }
  for (let i = 0; i < SEATS.length; i++) for (let j = i + 1; j < SEATS.length; j++) if (Math.hypot(SEATS[i].x - SEATS[j].x, SEATS[i].z - SEATS[j].z) < SEAT_R * 2 + 0.6) errs.push(SEATS[i].id + '/' + SEATS[j].id + ': quá gần');
  return errs;
}
