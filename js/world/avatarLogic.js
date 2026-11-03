// Logic thuần của nhân vật (không đụng three.js, có test): màu áo, làm sạch tên/chat, ngắt dòng bong bóng, tư thế theo trạng thái.
import { clamp } from '../util.js';

/** Các màu áo cho người chơi chọn. */
export const AVATAR_COLORS = [
  { id: 'nau',   ten: 'Áo nâu',     ao: 0x8a5a36, dai: 0x5a3820 },
  { id: 'lam',   ten: 'Áo lam',     ao: 0x3f6fa8, dai: 0x24456e },
  { id: 'vang',  ten: 'Cà sa vàng', ao: 0xd9a63a, dai: 0xa9421f },
  { id: 'xam',   ten: 'Áo xám',     ao: 0x7d858d, dai: 0x4b5258 },
  { id: 'trang', ten: 'Áo trắng',   ao: 0xe8e4d8, dai: 0xb9b4a4 },
  { id: 'do',    ten: 'Áo đỏ sẫm',  ao: 0x9a2f2a, dai: 0x5e1a17 },
];
export const DEFAULT_COLOR = 'nau';

/** Lấy màu theo id; id lạ trả về màu mặc định (không bao giờ undefined). */
export function colorById(id) {
  return AVATAR_COLORS.find((c) => c.id === id) || AVATAR_COLORS.find((c) => c.id === DEFAULT_COLOR);
}

/** Kiểu đầu: đầu trọc (mặc định, như tăng ni/cư sĩ) hoặc tóc búi. */
export const HAIR_STYLES = [{ id: 'troc', ten: 'Đầu trọc' }, { id: 'bui', ten: 'Tóc búi' }];
export const DEFAULT_HAIR = 'troc';
export function hairById(id) { return HAIR_STYLES.find((h) => h.id === id) || HAIR_STYLES[0]; }

const URL_RE = /(https?:\/\/|www\.)\S*/gi;
// Ký tự điều khiển, ký tự định dạng ẩn (zero-width, đảo chiều) và dấu < > dùng để chèn HTML
const BAD_RE = /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff<>]/g;

function clean(s, max) {
  let t = String(s == null ? '' : s).replace(URL_RE, ' ').replace(BAD_RE, ' ').replace(/\s+/g, ' ').trim();
  const cps = Array.from(t);                       // cắt theo ký tự Unicode, không cắt đôi cặp thay thế
  if (cps.length > max) t = cps.slice(0, max).join('').trim();
  return t;
}

/** Tên hiển thị trên đầu nhân vật: ≤ 20 ký tự, rỗng thì là 'Khách'. */
export function cleanName(s) { return clean(s, 20) || 'Khách'; }

/** Lời chat: ≤ 80 ký tự, bỏ đường link; rỗng thì trả '' (không hiện bong bóng). */
export function cleanSay(s) { return clean(s, 80); }

/** Thời gian bong bóng chat hiện (ms): 3–8 giây tùy độ dài. */
export function bubbleLife(text) { return clamp(2500 + 60 * Array.from(text || '').length, 3000, 8000); }

/** Ngắt lời chat thành các dòng ≤ maxChars ký tự, ngắt ở khoảng trắng; từ quá dài thì cắt cứng. Tối đa maxLines dòng. */
export function wrapText(text, maxChars = 18, maxLines = 4) {
  const words = String(text || '').split(' ').filter(Boolean), lines = [];
  let cur = '';
  const push = () => { if (cur) lines.push(cur); cur = ''; };
  for (let w of words) {
    while (Array.from(w).length > maxChars) { push(); const a = Array.from(w); lines.push(a.slice(0, maxChars).join('')); w = a.slice(maxChars).join(''); }
    if (!cur) cur = w;
    else if (Array.from(cur + ' ' + w).length <= maxChars) cur += ' ' + w;
    else { push(); cur = w; }
  }
  push();
  if (lines.length > maxLines) { const cut = lines.slice(0, maxLines); cut[maxLines - 1] = Array.from(cut[maxLines - 1]).slice(0, Math.max(1, maxChars - 1)).join('') + '…'; return cut; }
  return lines;
}

export const STATES = ['idle', 'walk', 'sit', 'mo', 'bow'];   // đứng, đi, ngồi thiền, gõ mõ (ngồi), cúi lạy

/**
 * Tư thế (góc quay rad, độ cao) theo trạng thái và thời gian t (giây). Thuần hàm.
 * Trả: legL, legR (quay quanh hông), armL, armR (quay quanh vai), lean (nghiêng thân), sit (0..1: ngồi), dy (hạ thân khi ngồi/lạy), head (gật đầu).
 * `speed` (m/s) chỉ dùng khi đi: nhịp chân nhanh theo tốc độ, biên độ tối đa ở ~2,2 m/s.
 */
export function poseFor(state, t, speed = 0) {
  const P = { legL: 0, legR: 0, armL: 0, armR: 0, lean: 0, sit: 0, dy: 0, head: 0 };
  switch (state) {
    case 'walk': {
      const k = clamp(speed / 2.2, 0.25, 1.15), ph = t * (5 + 4 * k), a = 0.62 * k;
      P.legL = Math.sin(ph) * a; P.legR = -P.legL; P.armL = -P.legL * 0.8; P.armR = -P.legR * 0.8;
      P.dy = Math.abs(Math.sin(ph)) * 0.035 * k; P.lean = 0.06 * k; break;
    }
    case 'sit': {
      P.sit = 1; P.armL = P.armR = -0.55; P.head = Math.sin(t * 0.8) * 0.02; P.dy = Math.sin(t * 1.3) * 0.006; break;   // thở nhẹ
    }
    case 'mo': {   // ngồi, tay phải gõ mõ nhịp đều (~1,6 lần/giây), cánh tay trái đỡ mõ
      P.sit = 1; P.armL = -0.7; P.armR = -0.9 + Math.max(0, Math.sin(t * 10)) * 0.55; P.head = Math.sin(t * 5) * 0.03; break;
    }
    case 'bow': {  // lạy: cúi thân rồi lên, chu kỳ 3 giây
      const u = (Math.sin(t * 2.1 - Math.PI / 2) + 1) / 2;
      P.lean = u * 1.05; P.armL = P.armR = -0.4 - u * 0.7; P.dy = -u * 0.25; P.head = u * 0.3; break;
    }
    default: { P.armL = Math.sin(t * 1.2) * 0.03; P.armR = -P.armL; P.dy = Math.sin(t * 1.6) * 0.004; }   // idle: thở nhẹ
  }
  return P;
}

/** Quay góc `cur` về `to` theo đường ngắn nhất (rad), tối đa `maxStep` mỗi lần gọi. */
export function turnToward(cur, to, maxStep) {
  let d = ((to - cur + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
  d = clamp(d, -maxStep, maxStep);
  return cur + d;
}
