// Các "điểm đến" của chùa online (Phiên 12b): mỗi chương nội dung gắn với MỘT vật/chỗ trong chùa, có điểm đứng + bán kính.
// Người chơi bấm điểm sáng, menu hoặc vật 3D → nhân vật ĐI TỚI điểm đứng → tới nơi (≤ r mét) mới mở bảng nội dung của chương.
// Thuần hàm (không three.js, có test). Đổi vị trí ở ĐÂY rồi chạy `npm test` (test kiểm điểm đứng đi tới được từ chỗ xuất hiện).
import { BUILDINGS, buildingFront } from './placements.js';
import { facingOf } from './worldLogic.js';

const nhaTo = BUILDINGS.find((b) => b.id === 'nhato');

/**
 * id: trùng id của <section> trong index.html. look: vị trí 3D của nhãn nổi. stand: chỗ nhân vật đứng; r: tới trong r mét là "đã tới".
 * face: điểm nhân vật quay mặt vào khi tới. pick: khối cầu bấm được quanh vật 3D { c: [x,y,z], r } (có thể bỏ).
 */
export const SPOTS = [
  { id: 'today',   num: '01', label: 'Hôm nay',    look: [0, 15, 34],   stand: { x: 0, z: 29.5 },  r: 2.5, face: [0, 6, 34],    pick: { c: [0, 11, 35.5], r: 4 } },
  { id: 'fortune', num: '02', label: 'Vận trình',  look: [-7, 1.6, 14], stand: { x: -12.2, z: 14 }, r: 2.5, face: [-7, 0, 14],   pick: { c: [-7, 0.8, 14], r: 2.2 } },
  { id: 'charts',  num: '03', label: 'Lá số',      look: [-30, 9, -28], stand: buildingFront(nhaTo), r: 2.5, face: [-30, 1, -28], pick: { c: [-30, 4, -28], r: 6 } },
  { id: 'reading', num: '04', label: 'Tướng số',   look: [28, 12.5, -4], stand: { x: 21.8, z: -3 }, r: 2.5, face: [28, 2, -4],   pick: { c: [28, 5, -4], r: 6 } },
  { id: 'temple',  num: '05', label: 'Chánh điện', look: [0, 6.2, -30], stand: { x: 2.1, z: -24 }, r: 2.5, face: [0, 2, -32],   pick: { c: [0, 3, -33], r: 3.2 } },
  { id: 'summary', num: '06', label: 'Lá bùa',     look: [0, 4.4, -8],  stand: { x: 0, z: -4.4 },  r: 2.2, face: [0, 1, -8],    pick: { c: [0, 1.6, -8], r: 2.2 } },
];

export const spotById = (id) => SPOTS.find((s) => s.id === id) || null;
/** Khoảng cách ngang từ p = {x,z} tới điểm đứng của spot. */
export const distTo = (p, s) => Math.hypot(p.x - s.stand.x, p.z - s.stand.z);
/** Góc quay (ry của avatar) để người ở p nhìn vào `face` của spot. */
export const faceAngle = (p, s) => facingOf(s.face[0] - p.x, s.face[2] - p.z);

/** Tia (gốc o, hướng d đã chuẩn hóa) cắt khối cầu (c, r): trả khoảng cách t ≥ 0 gần nhất hoặc null. */
export function raySphere(o, d, c, r) {
  const ox = o.x - c[0], oy = o.y - c[1], oz = o.z - c[2];
  const b = ox * d.x + oy * d.y + oz * d.z, k = ox * ox + oy * oy + oz * oz - r * r;
  const disc = b * b - k; if (disc < 0) return null;
  const s = Math.sqrt(disc), t0 = -b - s, t1 = -b + s;
  if (t1 < 0) return null;
  return t0 >= 0 ? t0 : 0;                              // gốc tia nằm trong khối cầu → coi như trúng tại 0
}

/** Tia trúng khối cầu của spot nào gần nhất → { spot, t } hoặc null. */
export function pickSpot(o, d, maxT = 120) {
  let best = null;
  for (const s of SPOTS) {
    if (!s.pick) continue;
    const t = raySphere(o, d, s.pick.c, s.pick.r);
    if (t !== null && t <= maxT && (!best || t < best.t)) best = { spot: s, t };
  }
  return best;
}

/**
 * Máy trạng thái "đi tới rồi mới mở". start(spot) khi người dùng chọn; step(p, navActive) gọi MỖI khung:
 *  - { arrived: spot } khi tới trong bán kính (kể cả đang đứng sẵn gần đó);
 *  - { failed: spot } khi việc tự đi đã dừng (kẹt/bị cản) mà vẫn chưa tới;
 *  - null khi đang đi hoặc không có gì chờ. cancel() khi người dùng tự điều khiển (phím, joystick, bấm chỗ khác).
 */
export function createArrival() {
  let spot = null;
  return {
    get spot() { return spot; },
    start(s) { spot = s; },
    cancel() { spot = null; },
    step(p, navActive) {
      if (!spot) return null;
      if (distTo(p, spot) <= spot.r) { const s = spot; spot = null; return { arrived: s }; }
      if (!navActive) { const s = spot; spot = null; return { failed: s }; }
      return null;
    },
  };
}
