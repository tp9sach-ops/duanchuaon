// Vị trí các vật mới của sân chùa (hoa viên, đèn đá, ghế, Nhà Tổ, Nhà Khách) VÀ vật cản của các vật dụng cũ (js/scene/props.js).
// Là dữ liệu thuần: cảnh 3D (js/scene/garden.js, nhato.js) dựng từ đây, còn nhân vật va chạm qua layout.js. Import file này là tự đăng ký vật cản.
// Đổi vị trí ở ĐÂY (một nơi duy nhất) rồi chạy `npm test`: test kiểm không chặn lối đi và mọi chỗ quan trọng vẫn đi tới được.
import { addCircle, addRect } from './layout.js';

/** Luống hoa chữ nhật {x0,x1,z0,z1, hoa: màu hoa} — hai luống trước lư hương, hai luống hai bên ao. */
export const BEDS = [
  { x0: -12.5, x1: -8.5, z0: -10, z1: -4, hoa: 0xf2a6c0 },
  { x0: 8.5, x1: 12.5, z0: -10, z1: -4, hoa: 0xf5d36a },
  { x0: -36, x1: -27, z0: 12, z1: 17, hoa: 0xf7f0e0 },
  { x0: 27, x1: 36, z0: 12, z1: 17, hoa: 0xe86a7a },
];
/** Bồn hoa tròn {x,z,r,hoa}. */
export const ROUND_BEDS = [
  { x: -31, z: 24, r: 3, hoa: 0xf5d36a },
  { x: 31, z: 20, r: 3, hoa: 0xf2a6c0 },
];
/** Đèn đá {x,z}. */
export const STONE_LANTERNS = [
  { x: -7.5, z: -1.5 }, { x: 7.5, z: -1.5 }, { x: -7.5, z: -10 }, { x: 7.5, z: -10 },
  { x: -23, z: 20 }, { x: 23, z: 14 },
];
/** Ghế đá {x,z,w,d} (w dọc trục x). Quay mặt về +z. */
export const BENCHES = [
  { x: -10.5, z: -2.4, w: 2.4, d: 0.7 }, { x: 10.5, z: -2.4, w: 2.4, d: 0.7 },
  { x: -31.5, z: 9.2, w: 2.4, d: 0.7 }, { x: 31.5, z: 9.2, w: 2.4, d: 0.7 },
];
/** Cây low-poly trong sân (có va chạm, r = bán kính thân + chút tán): {x, z, s: tỉ lệ}. */
export const TREES = [
  { x: -40.5, z: -8, s: 1.05 }, { x: -40.5, z: 0, s: 0.95 }, { x: -40.5, z: 22, s: 1.1 }, { x: -40.5, z: 31, s: 1 },
  { x: 40.5, z: -14, s: 1.1 }, { x: 40.5, z: 18, s: 1 }, { x: 40.5, z: 28, s: 1.05 }, { x: -21, z: -12, s: 0.9 }, { x: 21, z: -14, s: 0.9 },
  { x: -21, z: 30, s: 0.95 }, { x: 21, z: 36, s: 0.9 },
];
export const TREE_R = 0.7;
/** Cây xa ngoài sân (chỉ để nhìn, không va chạm): rải theo vòng quanh khu chùa. */
export function farTrees() {
  const out = []; let a = 1;
  const rnd = () => { a = (a * 16807) % 2147483647; return a / 2147483647; };
  for (let i = 0; i < 46; i++) {
    const side = i % 3, x = side === 0 ? -(48 + rnd() * 26) : side === 1 ? 48 + rnd() * 26 : (rnd() - 0.5) * 120, z = side === 2 ? -(46 + rnd() * 24) : -42 + rnd() * 108;
    out.push({ x, z, s: 1.1 + rnd() * 0.9 });
  }
  return out;
}

/** Công trình: Nhà Tổ (trái chính điện) và Nhà Khách (phải). Mặt trước quay +z, đứng ngoài bậc thềm vẫn đi tới. */
export const BUILDINGS = [
  { id: 'nhato', ten: 'NHÀ TỔ', cx: -30, cz: -28, w: 14, d: 10 },
  { id: 'nhakhach', ten: 'NHÀ KHÁCH', cx: 30, cz: -28, w: 14, d: 10 },
];
/** Điểm đứng trước cửa mỗi công trình (cho hotspot Phiên 12). */
export const buildingFront = (b) => ({ x: b.cx, z: b.cz + b.d / 2 + 1.6 });

// Vật dụng cũ (js/scene/props.js, toạ độ phải KHỚP file đó): nghê đá, cột cờ, trụ đèn lồng, đỉnh hương, bia, bàn thờ Thiên
export const OLD_PROP_CIRCLES = [
  { x: -6.6, z: 41, r: 0.9 }, { x: 6.6, z: 41, r: 0.9 }, { x: -9, z: 26, r: 0.25 }, { x: 9, z: 26, r: 0.25 },
  { x: -6.5, z: -14, r: 0.6 }, { x: 6.5, z: -14, r: 0.6 }, { x: 14, z: -14, r: 1.3 },
  ...[0, 1, 2, 3, 4].flatMap((i) => [-1, 1].map((s) => ({ x: s * 4.4, z: 4 - i * 4.2, r: 0.2 }))),
];
export const OLD_PROP_RECTS = [{ x0: -15.9, x1: -14.1, z0: -12.8, z1: -11.2 }];   // bia đá rùa

export const bedRect = (b) => ({ x0: b.x0 - 0.3, x1: b.x1 + 0.3, z0: b.z0 - 0.3, z1: b.z1 + 0.3 });   // luống + viền đá

let done = false;
/** Đăng ký vật cản vào layout.js (chỉ một lần dù import nhiều lần). */
export function registerPlacements() {
  if (done) return; done = true;
  BEDS.forEach((b) => addRect(bedRect(b)));
  ROUND_BEDS.forEach((b) => addCircle({ x: b.x, z: b.z, r: b.r + 0.3 }));
  STONE_LANTERNS.forEach((l) => addCircle({ x: l.x, z: l.z, r: 0.55 }));
  BENCHES.forEach((b) => addRect({ x0: b.x - b.w / 2, x1: b.x + b.w / 2, z0: b.z - b.d / 2, z1: b.z + b.d / 2 }));
  BUILDINGS.forEach((b) => addRect({ x0: b.cx - b.w / 2, x1: b.cx + b.w / 2, z0: b.cz - b.d / 2, z1: b.cz + b.d / 2 }));
  TREES.forEach((t) => addCircle({ x: t.x, z: t.z, r: TREE_R }));
  OLD_PROP_CIRCLES.forEach(addCircle); OLD_PROP_RECTS.forEach(addRect);
}
registerPlacements();
