// Hiệu ứng chiến đấu yêu quái (Phiên 100): LOGIC THUẦN (không DOM/three.js, có test: tests/yqfx.test.mjs).
// Dùng chung bởi js/ui/yeuquai.js (thanh máu, rung màn hình, đẩy sự kiện đánh trúng), js/ui/dock.js (vòng hồi chiêu, màu từng chiêu), js/scene/yeuquai.js (số sát thương, tia lửa, sóng xung kích).
const num = (x, d = 0) => (Number.isFinite(+x) ? +x : d);
export const clamp01 = (x) => Math.max(0, Math.min(1, num(x)));

/** Phần hồi chiêu còn lại 0..1 (1 = vừa bấm, 0 = sẵn sàng). */
export const cdFrac = (left, max) => (num(max) > 0 ? clamp01(num(left) / num(max)) : 0);

/** Màu + tên lớp CSS từng chiêu trên cụm nút (ids khớp js/world/dock.js). */
export const SKILL_THEME = {
  da: { cls: 'sk-da', hex: 0xffb347, css: '#ffb347' },
  thuong: { cls: 'sk-thuong', hex: 0xff5a4a, css: '#ff5a4a' },
  chemkhi: { cls: 'sk-chemkhi', hex: 0x6fd0ff, css: '#6fd0ff' },
  thietdau: { cls: 'sk-thietdau', hex: 0xffd23a, css: '#ffd23a' },
  nemyq: { cls: 'sk-nemyq', hex: 0x72e08a, css: '#72e08a' },
  nhay: { cls: 'sk-nhay', hex: 0xc9b6ff, css: '#c9b6ff' },
};
/** Loại đòn đánh trúng yêu quái → màu tia lửa/số. kind: 'da' | 'thuong' | 'khi' | 'dau' | 'nem'. */
export const HIT_COLOR = { da: { hex: 0xffb347, css: '#ffd27a' }, thuong: { hex: 0xff5a4a, css: '#ff8f84' }, khi: { hex: 0x6fd0ff, css: '#bff0ff' }, dau: { hex: 0xffd23a, css: '#fff0a0' }, nem: { hex: 0x72e08a, css: '#c4ffcc' } };

/** Kiểu hiển thị một đòn: số, to/nhỏ, màu, số tia lửa, có sóng xung kích không, độ rung màn hình (px) + thời gian (ms). */
export function hitStyle(kind, dmg) {
  const k = HIT_COLOR[kind] ? kind : 'da', d = Math.max(0, Math.floor(num(dmg))), big = d >= 80 || k === 'nem' || k === 'dau' || (k === 'khi' && d >= 40);
  return { kind: k, text: big ? `${d}!` : String(d), big, scale: big ? 1.55 : 1, css: HIT_COLOR[k].css, hex: HIT_COLOR[k].hex, sparks: big ? 26 : 12, ring: big, shake: big ? 6 : 2.5, ms: big ? 240 : 140 };
}

/** Đẩy một sự kiện đánh trúng vào view (cảnh 3D đọc, mỗi sự kiện có id tăng dần; giữ tối đa 12 cái mới nhất). Trả sự kiện. */
export function pushHit(view, ev) {
  if (!view) return null;
  const list = Array.isArray(view.hits) ? view.hits : (view.hits = []);
  view.hitSeq = num(view.hitSeq) + 1;
  const h = { ...ev, id: view.hitSeq, t: ev && ev.t != null ? ev.t : Date.now() };
  list.push(h); if (list.length > 12) list.splice(0, list.length - 12);
  return h;
}

/** "Vệt máu" trễ của thanh máu yêu quái: máu mất đi thì thanh sáng tụt từ từ sau 0,5 giây. s = { v, hold, last } trước đó (hoặc null), pct = % máu hiện tại (0..100). */
export function ghostStep(s, pct, dt) {
  const p = Math.max(0, Math.min(100, num(pct))), d = Math.max(0, Math.min(0.5, num(dt)));
  const g = s && Number.isFinite(s.v) ? s : { v: p, hold: 0, last: p };
  let { v, hold } = g;
  if (p > v) return { v: p, hold: 0, last: p };
  if (p < g.last - 1e-9) hold = 0.5;
  if (hold > 0) return { v, hold: Math.max(0, hold - d), last: p };
  return { v: Math.max(p, v - 55 * d), hold: 0, last: p };
}

/** Chia nhỏ số máu cho dễ đọc: 2400 → "2.400". */
export const fmtNum = (n) => String(Math.max(0, Math.floor(num(n)))).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
/** Mức máu thấp (cho thanh nháy cảnh báo): < 25 %. */
export const isLow = (hp, max) => num(max) > 0 && num(hp) / num(max) < 0.25;
