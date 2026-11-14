// Phiên 166 (mục 1, lộ trình 14/11): ĐỒNG BỘ VẬT PHẨM QUA MẠNG để người khác THẤY đồ của mình (trước đây gói tin chỉ có tên/áo/tóc/vị trí/tư thế nên mua gậy, nón, ván, bánh xong chỉ máy mình thấy).
// LOGIC THUẦN (không DOM/three.js), có test: tests/gearsync.test.mjs. Gói tin thêm MỘT trường `i` = chuỗi chữ thường a-z, 1–8 ký tự; rỗng thì KHÔNG gửi trường này (gói tin cũ không đổi).
// Bảng chữ: n = cầm Gậy như ý · k = đang đội Nón Jingasa · p = đang cưỡi Thương · q = đang cưỡi Gậy như ý · v = đang lướt Ván trượt · h = Bánh sầu riêng 3 vị còn tác dụng · d = Bánh sầu riêng pho mai than tre còn tác dụng.
// Máy chủ (gas/Room.gs, firebase/database.rules.json) kiểm bằng cùng quy tắc /^[a-z]{1,8}$/.
export const GEAR_RE = /^[a-z]{1,8}$/;
const RIDE_CODE = { thuong: 'p', nhuy: 'q', van: 'v' };
const CODE_RIDE = { p: 'thuong', q: 'nhuy', v: 'van' };

/** Chuỗi đã nhận từ mạng → chuỗi hợp lệ hoặc '' (sai thì coi như không có đồ). Chữ lạ bị bỏ, trùng chữ bị gộp. */
export function cleanGear(s) {
  s = String(s == null ? '' : s); if (!GEAR_RE.test(s)) return '';
  const seen = new Set(); let out = '';
  for (const ch of s) if ('nkpqvhd'.includes(ch) && !seen.has(ch)) { seen.add(ch); out += ch; }
  return out;
}

/** Trạng thái đồ của MÌNH → chuỗi gửi đi. g = { staff, hat, ride: ''|'thuong'|'nhuy'|'van', regen, revive }. Chỉ một món cưỡi. Không có gì → ''. */
export function encodeGear(g = {}) {
  if (!g || typeof g !== 'object') return '';
  let s = '';
  if (g.staff === true) s += 'n';
  if (g.hat === true) s += 'k';
  if (RIDE_CODE[g.ride]) s += RIDE_CODE[g.ride];
  if (g.regen === true) s += 'h';
  if (g.revive === true) s += 'd';
  return s;
}

/** Chuỗi nhận từ mạng → { staff, hat, ride, regen, revive } (đã làm sạch; nhiều chữ cưỡi thì lấy chữ đầu). */
export function decodeGear(tok) {
  const s = cleanGear(tok), out = { staff: false, hat: false, ride: '', regen: false, revive: false };
  for (const ch of s) {
    if (ch === 'n') out.staff = true; else if (ch === 'k') out.hat = true; else if (ch === 'h') out.regen = true; else if (ch === 'd') out.revive = true;
    else if (CODE_RIDE[ch] && !out.ride) out.ride = CODE_RIDE[ch];
  }
  return out;
}

/** Hai chuỗi đồ có cùng ý nghĩa không (so sánh sau khi làm sạch). */
export const sameGear = (a, b) => cleanGear(a) === cleanGear(b);
