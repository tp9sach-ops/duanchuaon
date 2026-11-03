// Logic thuần của hoạt động Tràng hạt + Tụng kinh (Phiên 14b). Không đụng DOM nên test được bằng Node.
// Lời kinh nằm ở js/data/kinh.js (văn bản truyền thống, CẦN ptg duyệt). Số công đức ở đây là GIÁ TRỊ TẠM (chưa có tiến trình, Phiên 16).
import { KINH } from '../data/kinh.js';
export { KINH };

export const BEADS_PER_ROUND = 108;
/** Công đức (hạt sen) — TẠM, ptg chưa chốt: mỗi 9 hạt +1, đủ vòng 108 thêm +3, tụng trọn một bài +2. */
export const MERIT_RULES = { perNineBeads: 1, beadRound: 3, chantRound: 2 };

const toInt = (v, lo, hi) => Math.min(hi, Math.max(lo, Math.floor(+v) || 0));

/** Số "tiếng" (âm tiết) của một câu = số lần gõ mõ để qua câu đó (tối thiểu 1). */
export function beatsOf(line) { return Math.max(1, String(line || '').split(/[\s,.;:!?]+/).filter(Boolean).length); }

export const kinhById = (id) => KINH.find((k) => k.id === id) || KINH[0];

/** Mô tả ngắn dưới hàng nút chọn bài. */
export function kinhDesc(k) { return k.lines.length + ' câu'; }

/** Kiểm dữ liệu kinh: trả mảng lỗi (rỗng = tốt). */
export function checkKinh() {
  const errs = [], ids = new Set();
  for (const k of KINH) {
    if (!k.id || !k.ten) errs.push('thiếu id/tên');
    if (ids.has(k.id)) errs.push(k.id + ': trùng id'); ids.add(k.id);
    if (!Array.isArray(k.lines) || !k.lines.length) errs.push(k.id + ': không có lời');
    else k.lines.forEach((l, i) => { if (typeof l !== 'string' || !l.trim()) errs.push(k.id + ' câu ' + (i + 1) + ': rỗng'); });
  }
  return errs;
}

/** Máy trạng thái tụng: mỗi lần gõ mõ = một tiếng; đủ số tiếng của câu thì sang câu sau; hết bài thì quay lại đầu và tính một vòng. */
export function createChanter(kinh) {
  const lines = kinh.lines; let i = 0, beat = 0, rounds = 0, taps = 0;
  return {
    tap() {
      taps++; beat++; const ev = { line: false, round: false };
      if (beat >= beatsOf(lines[i])) { beat = 0; i++; ev.line = true; if (i >= lines.length) { i = 0; rounds++; ev.round = true; } }
      return ev;
    },
    /** Ba dòng kiểu karaoke: dòng hiện tại + hai dòng sau (vòng lại đầu bài). */
    view() {
      const n = lines.length;
      return { cur: lines[i], next: [lines[(i + 1) % n], lines[(i + 2) % n]], i, n, beat, beats: beatsOf(lines[i]), rounds, taps };
    },
    reset() { i = 0; beat = 0; rounds = 0; taps = 0; },
  };
}

/** Tràng hạt 108: mỗi lần lần một hạt. n = thứ tự hạt vừa lần (1..108); đủ 108 thì về 0 và tăng vòng. */
export function createBeads(init) {
  init = init || {};
  let dem = toInt(init.dem, 0, BEADS_PER_ROUND - 1), vong = toInt(init.vong, 0, 1e9);
  return {
    pull() { const n = dem + 1; let full = false; dem = n; if (dem >= BEADS_PER_ROUND) { dem = 0; vong++; full = true; } return { n, dem, vong, full }; },
    reset() { dem = 0; },
    state() { return { dem, vong }; },
  };
}

/** Công đức cho một lần lần hạt. */
export function meritForPull(r) { return (r.n % 9 === 0 ? MERIT_RULES.perNineBeads : 0) + (r.full ? MERIT_RULES.beadRound : 0); }
/** Công đức cho một lần gõ mõ. */
export function meritForChant(ev) { return ev && ev.round ? MERIT_RULES.chantRound : 0; }

/** Ví công đức lưu cục bộ: { sen } (số nguyên ≥ 0). */
export function loadWallet(raw) { let o = raw; if (typeof raw === 'string') { try { o = JSON.parse(raw); } catch (_) { o = null; } } return { sen: toInt(o && o.sen, 0, 1e9) }; }
export function addSen(w, n) { return { sen: toInt((w && w.sen) + (+n || 0), 0, 1e9) }; }
