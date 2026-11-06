// Logic thuần của màn "vào cửa" và HUD (không đụng DOM, có test): hồ sơ người chơi, lưu/đọc, ô chữ cái, trong/ngoài chánh điện.
import { cleanName, colorById, hairById, AVATAR_COLORS } from '../world/avatarLogic.js';
import { HALL } from '../world/layout.js';

export const KEYS = { name: 'lgt.name', color: 'lgt.color', hair: 'lgt.hair' };

/** Làm sạch hồ sơ: tên ≤ 20 ký tự ('Khách' nếu rỗng), màu/kiểu đầu lạ → mặc định. */
export function cleanProfile(p = {}) {
  return { name: cleanName(p.name), color: colorById(p.color).id, hair: hairById(p.hair).id };
}
/** Đọc hồ sơ từ storage (localStorage hoặc đồ giả); lỗi/thiếu → mặc định. `has` = đã từng vào cửa. */
export function loadProfile(storage) {
  const get = (k) => { try { return storage.getItem(k); } catch (_) { return null; } };
  const raw = { name: get(KEYS.name), color: get(KEYS.color), hair: get(KEYS.hair) };
  return { ...cleanProfile(raw), has: !!raw.name };
}
export function saveProfile(storage, p) {
  const c = cleanProfile(p);
  try { storage.setItem(KEYS.name, c.name); storage.setItem(KEYS.color, c.color); storage.setItem(KEYS.hair, c.hair); } catch (_) { /* chế độ riêng tư: bỏ qua */ }
  return c;
}
/** Chữ cái đầu của tên để vẽ trong ảnh đại diện tròn (viết hoa; ký tự Unicode đầu tiên). */
export function initialOf(name) { const a = Array.from(cleanName(name))[0] || 'K'; return a.toLocaleUpperCase('vi'); }
/** Màu áo (chuỗi #rrggbb) của hồ sơ, dùng tô ảnh đại diện. */
export function robeCss(colorId) { return '#' + colorById(colorId).ao.toString(16).padStart(6, '0'); }
/** Người đang đứng trong chánh điện (trên nền cao của điện, kể cả bậc thềm)? Quyết định nút "Vào chánh điện" hay "Ra sân ngắm cảnh". */
export function insideHall(p) { return Math.abs(p.x) <= HALL.platX && p.z <= HALL.platZ1 - 0.3; }
/** Điểm đứng khi "Ra sân ngắm cảnh": giữa sân, lệch khỏi lư hương, đi tới được (có test). */
export const COURTYARD_POINT = { x: 3.2, z: -1 };
/** Chỗ đứng ngay sau cửa chánh điện (trước lưới bồ đoàn): nút "Vào chánh điện" đi tới đây, KHÔNG mở bảng. */
export const HALL_POINT = { x: 0, z: -20.4 };   // giữa lối vào (hàng cột trước chừa trống |x| < 2) ngay trên thềm, tránh va cột
export const PLAYER_COLORS = AVATAR_COLORS;

/** Nhãn đồng hồ HUD (Phiên 30): "09:30 · Ban ngày · Quang đãng". Thiếu phần nào thì bỏ phần đó. */
export function clockLabel(clock, phase, weatherName) { return [clock, phase, weatherName].filter((x) => typeof x === 'string' && x.trim()).join(' · '); }
