// THIẾT ĐẦU CÔNG (Phiên 90): ở Khinh thân bậc 4 (Tứ Phong) trở lên, sau khi bấm NHẢY sẽ hiện nút "Thiết đầu công": nhân vật dùng đầu lao nhanh về TRƯỚC MẶT một quãng ngắn;
// đâm trúng yêu quái thì gây sát thương. Bậc càng cao lao càng xa, đâm càng đau. LOGIC THUẦN (có test: tests/thietdau.test.mjs). Mọi con số là QUY ƯỚC TẠM, chờ ptg duyệt.
import { landing } from './strength.js';

export const MIN_BAC = 4;                                   // bậc khinh thân tối thiểu
export const DASH_DIST = [0, 0, 0, 0, 6, 8, 10, 12, 15];    // m, theo bậc 0..8
export const DASH_DMG = [0, 0, 0, 0, 70, 110, 160, 220, 300];   // sát thương gốc, theo bậc
export const DASH_S = 0.32;                                 // giây lao (nhanh)
export const COOLDOWN_S = 5;
export const WINDOW_AFTER_LAND_S = 1.6;                     // nút còn hiện thêm sau khi chạm đất (kịp bấm trên điện thoại)
export const HEAD_R = 0.7;                                  // bán kính "đầu" khi đâm (cộng với thân yêu quái)
const num = (v) => (Number.isFinite(+v) ? +v : 0);
const bacOf = (b) => Math.max(0, Math.min(8, Math.floor(num(b))));

export const canUse = (bac) => bacOf(bac) >= MIN_BAC;
export const dashDistance = (bac) => DASH_DIST[bacOf(bac)];
/** Sát thương: sát thương gốc theo bậc + sức mạnh × 0,5 (người khỏe đâm đau hơn). */
export const dashDamage = (bac, str = 0) => (canUse(bac) ? Math.round(DASH_DMG[bacOf(bac)] + Math.max(0, Math.min(1e4, num(str))) * 0.5) : 0);
/** Nút có hiện không: đủ bậc, đang trên không hoặc vừa chạm đất chưa quá WINDOW_AFTER_LAND_S. sinceAir = giây kể từ lần cuối còn trên không (0 nếu đang trên không). */
export const buttonOpen = ({ bac = 0, air = false, sinceAir = Infinity, mode = 'free' } = {}) => canUse(bac) && mode === 'free' && (air || num(sinceAir) <= WINDOW_AFTER_LAND_S);

/** Đường lao: từ (x,z) theo hướng ry, dừng trước vật cản. Trả { to: {x,z}, dist }. */
export function dashPath(x, z, ry, bac) { const l = landing(x, z, ry, dashDistance(bac)); return { to: { x: l.x, z: l.z }, dist: l.dist }; }
/** Khoảng cách từ điểm (px,pz) tới đoạn thẳng a→b. */
export function distToSegment(px, pz, a, b) {
  const dx = b.x - a.x, dz = b.z - a.z, L2 = dx * dx + dz * dz; if (L2 < 1e-12) return Math.hypot(px - a.x, pz - a.z);
  const t = Math.max(0, Math.min(1, ((px - a.x) * dx + (pz - a.z) * dz) / L2)); return Math.hypot(px - (a.x + t * dx), pz - (a.z + t * dz));
}
/** Đầu có đâm trúng yêu quái (tâm boss.x/z, thân bán kính body) trên đường a→b không. */
export const rams = (a, b, boss, body = 1.5) => !!boss && distToSegment(num(boss.x), num(boss.z), a, b) <= num(body) + HEAD_R;
/** Giây hồi chiêu còn lại sau dt. */
export const tickCd = (cd, dt) => Math.max(0, num(cd) - Math.max(0, Math.min(5, num(dt))));
