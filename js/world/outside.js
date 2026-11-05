// Khu NGOÀI CHÙA (Phiên 17): đường phố làng, chợ làng, đường mòn rừng thông (Tây), đường mòn thác nước (Đông), dân làng đi lại.
// DỮ LIỆU THUẦN (không three.js, có test); cảnh 3D ở js/scene/outside.js dựng từ đây. Import là tự đăng ký vùng đi bộ và vật cản (một lần).
// Tọa độ: +z là hướng xa chùa (ra làng). Cổng Tam quan z=34, đường trước cổng tới z=62 (layout.js) — các vùng dưới đây nối tiếp từ đó.
import { addWalk, addCircle, addRect, addWater } from './layout.js';

/** Các vùng đi bộ (chữ nhật, nối liền nhau). Ngoài các vùng này (và khuôn viên chùa) là chặn: cây rừng, nhà dân, sườn núi chỉ để nhìn. */
export const OUT_WALKS = [
  { id: 'duong-lang', x0: -14, x1: 14, z0: 60, z1: 150 },       // đường phố làng, hai vỉa hè
  { id: 'cho', x0: -34, x1: 34, z0: 116, z1: 146 },             // chợ làng
  { id: 'duong-thac', x0: 12, x1: 96, z0: 99, z1: 109 },        // đường mòn tới thác (rẽ phải)
  { id: 'bai-thac', x0: 84, x1: 112, z0: 86, z1: 122 },         // bãi dưới thác
  { id: 'duong-rung', x0: -100, x1: -12, z0: 84, z1: 94 },      // đường mòn vào rừng thông (rẽ trái)
  { id: 'bai-rung', x0: -118, x1: -90, z0: 72, z1: 108 },       // bãi trong rừng thông
];

/** Hồ dưới chân thác (vật cản, không có cầu). */
export const THAC = { pool: { x: 106, z: 104, r: 7.5 }, cliffX: 114.5, h: 22, fallZ: 104 };
/** Gốc đa làng ở giữa chợ, giếng làng, đình nghỉ chân ở bãi thác, miếu nhỏ và gốc cổ thụ ở bãi rừng. */
export const DA_LANG = { x: 0, z: 131, r: 2.2 };
export const GIENG = { x: 10, z: 127, r: 1.2 };
export const DINH_NGHI = { x0: 90, x1: 94, z0: 88, z1: 92 };
export const MIEU = { x0: -102, x1: -99, z0: 74, z1: 77 };
export const CO_THU = { x: -106, z: 90, r: 2.2 };
/** Quầy chợ (rect vật cản): hai hàng trước/sau gốc đa. */
export const STALLS = [-27, -19, 19, 27].flatMap((x) => [121, 141].map((z) => ({ x0: x - 2.5, x1: x + 2.5, z0: z - 1.3, z1: z + 1.3, x, z })));
/** Cổng làng: hai trụ ở hai bên đường (vật cản tròn), xà ngang ở trên cao. */
export const VILLAGE_GATE = { z: 66, posts: [-8.5, 8.5], r: 0.6 };
/** Cột đèn đường (vật cản mảnh) dọc hai vỉa hè. */
export const STREET_LAMPS = [70, 86, 102, 118, 134, 148].flatMap((z) => [-12, 12].map((x) => ({ x, z, r: 0.25 })));
/** Đá lớn quanh hồ thác. */
export const OUT_ROCKS = [{ x: 100, z: 92, r: 1.2 }, { x: 101, z: 117, r: 1.5 }, { x: 109, z: 90, r: 1.3 }, { x: 108, z: 118, r: 1.4 }];

/** Điểm mà người chơi đặt chân tới thì tính "đã ghé" (nhiệm vụ). {id, ten, x, z, r} — dùng chung cho trong và ngoài chùa. */
export const PLACES = [
  { id: 'sanchua', ten: 'Sân chùa', x: 0, z: 6, r: 14 }, { id: 'chanhdien', ten: 'Chánh điện', x: 0, z: -30, r: 14 },
  { id: 'nhato', ten: 'Nhà Tổ', x: -38, z: -20, r: 8 }, { id: 'gacchuong', ten: 'Gác chuông', x: 28, z: -4, r: 7 },
  { id: 'trathat', ten: 'Trà thất', x: -64, z: 12, r: 7 }, { id: 'vuonthien', ten: 'Vườn thiền', x: -62, z: -20, r: 8 },
  { id: 'hoca', ten: 'Hồ cá', x: 52, z: 10, r: 8 }, { id: 'quanam', ten: 'Quan Âm đài', x: 0, z: -59, r: 7 },
  { id: 'lang', ten: 'Đường làng', x: 0, z: 88, r: 14 }, { id: 'cho', ten: 'Chợ làng', x: 0, z: 128, r: 14 },
  { id: 'rung', ten: 'Rừng thông', x: -98, z: 89, r: 9 }, { id: 'thacnuoc', ten: 'Thác nước', x: 95, z: 104, r: 7 },
];
export const placeById = (id) => PLACES.find((p) => p.id === id) || null;
/** Nơi (id) mà vị trí p = {x,z} đang ở trong; mảng có thể rỗng hoặc nhiều nơi chồng nhau. */
export const placesAt = (p) => PLACES.filter((q) => Math.hypot(p.x - q.x, p.z - q.z) <= q.r).map((q) => q.id);

/** Người dân đi lại (chỉ để cho vui mắt, không trò chuyện): đi tới lui giữa các điểm của `path` với tốc độ `speed` (m/s). `scale` < 1: trẻ em. */
export const WALKERS = [
  { id: 'd1', color: 'nau', hair: 'troc', path: [[-6, 64], [-6, 110]], speed: 0.9 },
  { id: 'd2', color: 'lam', hair: 'bui', path: [[7, 140], [7, 72]], speed: 1.1 },
  { id: 'd3', color: 'do', hair: 'bui', path: [[-30, 135], [30, 135]], speed: 0.8 },
  { id: 'd4', color: 'xam', hair: 'troc', path: [[30, 138], [-30, 138]], speed: 0.7 },
  { id: 'd5', color: 'trang', hair: 'bui', path: [[16, 104], [90, 104]], speed: 1.0 },
  { id: 'd6', color: 'nau', hair: 'troc', path: [[-16, 89], [-92, 89]], speed: 0.95 },
  { id: 'd7', color: 'vang', hair: 'bui', scale: 0.7, path: [[-4, 90], [-4, 56]], speed: 1.3 },
];

let done = false;
export function registerOutside() {
  if (done) return; done = true;
  OUT_WALKS.forEach(addWalk);
  addWater({ x: THAC.pool.x, z: THAC.pool.z, r: THAC.pool.r, bridges: [] });
  [DA_LANG, GIENG, CO_THU, ...OUT_ROCKS, ...STREET_LAMPS, ...VILLAGE_GATE.posts.map((x) => ({ x, z: VILLAGE_GATE.z, r: VILLAGE_GATE.r }))].forEach((c) => addCircle({ x: c.x, z: c.z, r: c.r }));
  STALLS.forEach((s) => addRect({ x0: s.x0, x1: s.x1, z0: s.z0, z1: s.z1 }));
  addRect(DINH_NGHI); addRect(MIEU);
}
registerOutside();
