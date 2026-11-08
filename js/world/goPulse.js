// Nút "Dẫn đường" nhấp nháy (Phiên 68). LOGIC THUẦN (không DOM, có test: tests/gopulse.test.mjs).
// Mục đích: người chưa rành phải biết bấm ở đâu. Có hai lúc nút nhấp nháy:
//   1) VIỆC MỚI vừa hiện (đổi sang nhiệm vụ khác trong lúc chơi): nhấp nháy PULSE_MS mili giây rồi tắt.
//   2) NGƯỜI MỚI chưa từng bấm "Dẫn đường": nhấp nháy tới khi bấm lần đầu (rồi nhớ ở localStorage, không nhắc nữa).
// Việc "Tu tập tự do" (kind 'free') không nhấp nháy vì không có đích cụ thể.

/** Thời gian nhấp nháy khi có việc mới (mili giây). */
export const PULSE_MS = 20000;
/** Khóa localStorage: đã từng bấm Dẫn đường (giá trị '1'). */
export const USED_KEY = 'lgt.gdUsed';

/**
 * Nút có nên nhấp nháy ở thời điểm `now` không.
 * @param {{ hasButton:boolean, kind:string, until:number, used:boolean, now:number }} s
 *   hasButton: nút đang hiện; kind: loại việc ('story'|'daily'|'journey'|'free'); until: mốc (ms) hết nhấp nháy của việc mới (0 = không có);
 *   used: đã từng bấm Dẫn đường; now: giờ hiện tại (ms).
 */
export function shouldPulse({ hasButton = false, kind = '', until = 0, used = false, now = Date.now() } = {}) {
  if (!hasButton || kind === 'free') return false;
  if (until && now < until) return true;   // việc mới
  return !used;                            // người mới chưa bấm lần nào
}

/** Mốc hết nhấp nháy cho một việc mới xuất hiện lúc `now`. */
export const pulseUntil = (now = Date.now()) => now + PULSE_MS;

/** Đọc cờ "đã từng bấm" từ giá trị localStorage (chuỗi hoặc null). Hỏng/lạ → false (an toàn: vẫn nhắc). */
export const readUsed = (raw) => raw === '1';
