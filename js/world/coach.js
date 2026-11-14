// Màn hướng dẫn lần đầu 3 bước có mũi tên (Phiên 70). Logic THUẦN, không đụng DOM → test được bằng Node.
// Chỉ hiện cho người CHƯA từng chơi; không chặn gì; bỏ qua được bất cứ lúc nào; nhớ ở localStorage 'lgt.coach'.
export const COACH_KEY = 'lgt.coach';
export const COACH_DELAY_MS = 4000;   // chờ sau khi HUD hiện (sau lời chào) rồi mới nhắc

/** Mỗi bước: chữ + danh sách bộ chọn CSS của nút cần chỉ (lấy cái đầu tiên đang hiện). Bước không có nút thì `fallback` chỉ về giữa-dưới màn hình. */
export const STEPS = [
  { id: 'move',  title: 'Đi lại',        text: 'Trên máy tính: bấm CHUỘT PHẢI vào đất để nhân vật đi tới đó (hoặc dùng phím W A S D); kéo chuột để xoay camera; bấm chuột phải 2 lần vào quái để chọn mục tiêu. Trên điện thoại: chạm vào đất hoặc kéo cần tròn bên trái.', targets: ['#joy'], fallback: 'ground' },
  { id: 'quest', title: 'Làm nhiệm vụ',  text: 'Bấm “Nhiệm vụ”, rồi bấm “Dẫn đường” ở việc muốn làm: nhân vật sẽ tự đi tới chỗ cần làm và chỉ nút cần bấm.', targets: ['.hm-mi[data-id="nhiemvu"]'], fallback: null },
  { id: 'help',  title: 'Quên cách chơi?', text: 'Bấm nút “?” ở góc phải-trên để mở sổ tay: các nút, khiêng đồ, yêu quái, xây nhà… đều có hướng dẫn ngắn.', targets: ['.hm-ic[data-id="trogiup"]'], fallback: null },
];

/** Đọc trạng thái lưu: { done, step }. Dữ liệu hỏng → bắt đầu lại từ bước 0. */
export function loadCoach(raw) {
  try {
    const o = JSON.parse(raw);
    if (o && o.done === true) return { done: true, step: STEPS.length };
    const s = Math.floor(+o.step);
    return { done: false, step: Number.isFinite(s) && s >= 0 && s < STEPS.length ? s : 0 };
  } catch (_) { return { done: false, step: 0 }; }
}
export const saveCoach = (st) => JSON.stringify(st.done ? { done: true } : { done: false, step: st.step });

/** Chuyển bước: 'next' sang bước kế (hết bước → done); 'skip' xong luôn. */
export function advance(st, action) {
  if (st.done) return st;
  if (action === 'skip') return { done: true, step: STEPS.length };
  const step = st.step + 1;
  return step >= STEPS.length ? { done: true, step: STEPS.length } : { done: false, step };
}

/** Người đã chơi (có tiến độ cốt truyện / đã mở sổ tay / đã bấm Dẫn đường) thì không hiện màn mới. v = { tut, story, gdUsed } là chuỗi đọc từ localStorage hoặc null. */
export const isVeteran = (v = {}) => v.tut === '1' || !!v.story || v.gdUsed === '1';

/** Có nên bắt đầu ngay bây giờ không. */
export function shouldStart({ done = false, veteran = false, hudVisible = false, panelOpen = false, sinceVisibleMs = 0 } = {}) {
  return !done && !veteran && hudVisible && !panelOpen && sinceVisibleMs >= COACH_DELAY_MS;
}

/** Góc (độ, 0 = sang phải, 90 = xuống) từ điểm `from` tới điểm `to`. */
export function angleTo(from, to) { return Math.atan2(to.y - from.y, to.x - from.x) * 180 / Math.PI; }

/** Khoảng cách từ tâm hình chữ nhật w×h tới mép theo hướng `deg` (để đặt mũi tên sát mép thẻ). */
export function edgeDistance(w, h, deg) {
  const r = deg * Math.PI / 180, c = Math.abs(Math.cos(r)), s = Math.abs(Math.sin(r));
  const dx = c < 1e-6 ? Infinity : w / 2 / c, dy = s < 1e-6 ? Infinity : h / 2 / s;
  return Math.min(dx, dy);
}

/** Mũi tên chỉ từ thẻ tới đích: { deg, start, len } hoặc null nếu đích quá gần/chồng lên thẻ. card/target = { x, y, w, h } (tâm + kích thước). */
export function arrowPlan(card, target, { gap = 6, min = 28, max = 140 } = {}) {
  if (!card || !target) return null;
  const deg = angleTo(card, target);
  const start = edgeDistance(card.w, card.h, deg) + gap;
  const dist = Math.hypot(target.x - card.x, target.y - card.y);
  const stop = dist - edgeDistance(target.w || 0, target.h || 0, deg + 180) - gap;
  const len = Math.min(max, stop - start);
  return len >= min ? { deg, start, len } : null;
}
