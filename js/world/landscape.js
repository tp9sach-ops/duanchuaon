// Cảnh quan mở rộng của Diệu Giang Tự (Phiên 14f). DỮ LIỆU THUẦN (không three.js, có test): cảnh 3D (js/scene/landscape.js, glbprops.js)
// dựng từ đây, còn nhân vật va chạm qua layout.js. Import file này là tự đăng ký vật cản và hồ nước (một lần).
// Đổi vị trí ở ĐÂY (một nơi duy nhất) rồi chạy `npm test`: tests/landscape.test.mjs kiểm đường đi không chạm vật cản và mọi điểm đến đi tới được.
import { addCircle, addRect, addWater, BOUNDS, GATE, blocked } from './layout.js';
import { TREES, BUILDINGS } from './placements.js';

/** Sân lát gạch chỉ nằm trong khung này; ngoài khung là bãi cỏ. */
export const PLAZA = { x0: -30, x1: 30, z0: -17, z1: 32 };

/** Dải đường đá: đường tim {pts:[[x,z],...]}, rộng w (m). Tim đường đã được test là đi được từ đầu tới cuối. */
export const STONE_PATHS = [
  { id: 'tay-ngang', w: 1.9, pts: [[-2.5, 28.3], [-52, 28.3]] },                        // từ sân ra vườn Tây
  { id: 'dong-ngang', w: 2.6, pts: [[2.5, 30.5], [50, 30.5]] },                              // từ sân ra vườn Đông
  { id: 'tay-doc', w: 3, pts: [[-52, 28.3], [-52, -57]] },                             // dọc Tây: trà thất, vườn thiền
  { id: 'dong-doc', w: 3, pts: [[50, 30.5], [50, -57]] },                                // dọc Đông: hồ cá
  { id: 'hau', w: 3, pts: [[-52, -57], [52, -57]] },                                   // sau chánh điện: Quan Âm đài, ba tháp
  { id: 'hanh-lang-tay', w: 3, pts: [[-6, 3], [-26.5, 3], [-26.5, -57]] },           // hành lang Tây của chánh điện
  { id: 'hanh-lang-dong', w: 3, pts: [[6, 3], [36, 3], [36, -14], [26.5, -14], [26.5, -57]] },   // vòng qua gác chuông
  { id: 'tra-that', w: 2.4, pts: [[-52, 13], [-58, 13]] },
  { id: 'luong-dinh', w: 2.4, pts: [[50, 10], [51, 10]] },
];

/** Sân sỏi vườn thiền (đi được) + đá lớn (vật cản tròn). */
export const ZEN = { x0: -70, x1: -55, z0: -28, z1: -13 };
export const ZEN_ROCKS = [{ x: -64, z: -20, r: 1.0, s: 1.2 }, { x: -60, z: -16, r: 0.8, s: 0.9 }, { x: -67, z: -25, r: 0.9, s: 1.0 }];

/** Trà thất (Tây): mặt trước quay +z. */
export const TEAHOUSE = { id: 'trathat', ten: 'TRÀ THẤT', cx: -64, cz: 8, w: 9, d: 7 };

/** Hồ cá (Đông) có cầu đá ra lương đình giữa hồ; mặt cầu/sàn đình cao 0,3 m. */
export const KOI = { x: 60, z: 10, r: 8, y: 0.3,
  bridges: [{ x0: 51, x1: 57.2, z0: 9.2, z1: 10.8, y: 0.3 }, { x0: 57.2, x1: 62.8, z0: 7.2, z1: 12.8, y: 0.3 }],
  pavilion: { cx: 60, cz: 10, w: 5.6, d: 5.6 } };

/** Quan Âm đài (sau chánh điện): tượng tròn chặn r=2, bệ tròn bán kính 5 (đi quanh được). */
export const GUANYIN = { x: 0, z: -63, r: 2, base: 5 };
/** Ba tháp (vườn tháp phía sau). */
export const PAGODAS = [{ x: -34, z: -68, r: 2.2 }, { x: 34, z: -68, r: 2.2 }, { x: 0, z: -72, r: 2.2 }];

/** Thảm hoa (đi được, chỉ để trang trí): chữ nhật + màu hoa. */
export const FLOWER_FIELDS = [
  { x0: -66, x1: -54, z0: 20, z1: 25, hoa: 0xf2a6c0 }, { x0: 54, x1: 66, z0: 22, z1: 27, hoa: 0xf5d36a },
  { x0: -22, x1: -10, z0: -58, z1: -54, hoa: 0xf7f0e0 }, { x0: 10, x1: 22, z0: -58, z1: -54, hoa: 0xe86a7a },
];

/** Tường rào: các đoạn thẳng [x0,z0,x1,z1] quanh khuôn viên; tường sát cổng chừa ba lối của Tam quan. */
export const FENCE = {
  h: 2.2,
  segs: [
    [-BOUNDS.xMax, BOUNDS.zMin, BOUNDS.xMax, BOUNDS.zMin],           // sau
    [-BOUNDS.xMax, BOUNDS.zMin, -BOUNDS.xMax, GATE.z - 1.8],         // Tây
    [BOUNDS.xMax, BOUNDS.zMin, BOUNDS.xMax, GATE.z - 1.8],           // Đông
    [-BOUNDS.xMax, GATE.z - 1.8, -16.5, GATE.z - 1.8],               // trước, hai bên Tam quan
    [16.5, GATE.z - 1.8, BOUNDS.xMax, GATE.z - 1.8],
  ],
};

/** Điểm đến (đi tới được): id, tên, điểm đứng `stand`, bán kính chạm `r`. */
export const FEATURES = [
  { id: 'trathat', ten: 'Trà thất', stand: { x: -64, z: 13.5 }, r: 2.5 },
  { id: 'thien', ten: 'Vườn thiền', stand: { x: -54, z: -20 }, r: 2.5 },
  { id: 'hoca', ten: 'Hồ cá', stand: { x: 50, z: 10 }, r: 2.5 },
  { id: 'luongdinh', ten: 'Lương đình', stand: { x: 60, z: 10 }, r: 2.5 },
  { id: 'quanam', ten: 'Quan Âm đài', stand: { x: 0, z: -59.5 }, r: 2.5 },
  { id: 'thap1', ten: 'Tháp Tây', stand: { x: -34, z: -64 }, r: 2.5 },
  { id: 'thap2', ten: 'Tháp Đông', stand: { x: 34, z: -64 }, r: 2.5 },
  { id: 'thap3', ten: 'Tháp Hậu', stand: { x: 0, z: -67.5 }, r: 2.5 },
];

// ---- Cây GLB (Phiên 14f, Bước 3): vị trí tất định rải ngoài lối đi, ngoài vật cản. model = id file trong assets/models/trees/
// h = chiều cao cây (mét) khi s = 1; w = trọng số rải. File GLB đã chuẩn hoá cao 1 đơn vị, gốc ở đáy (xem HANDOFF Phiên 14f, Bước 3).
export const TREE_MODELS = [
  { id: 'gn', w: 3, h: 9 }, { id: 'real', w: 3, h: 9 }, { id: 'oak', w: 3, h: 8 }, { id: 'maple', w: 2, h: 7 }, { id: 'lowpoly', w: 2, h: 7 }, { id: 'pine', w: 1, h: 10 },
];
function distToSeg(px, pz, [ax, az], [bx, bz]) {
  const dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz, t = L2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / L2)) : 0;
  return Math.hypot(px - (ax + t * dx), pz - (az + t * dz));
}
export const distToPaths = (x, z) => Math.min(...STONE_PATHS.flatMap((p) => p.pts.slice(1).map((q, i) => distToSeg(x, z, p.pts[i], q) - p.w / 2)));
export const TREE_COLLIDE_R = 0.6;
/** Khu KHÔNG trồng cây (m): chánh điện + bồ đoàn ngồi thiền + sân trước + hai hành lang + phía sau điện tới đường 'hau'; vườn thiền (sân sỏi) có lề 4 m. Cây cao 9–14 m, tán rộng nên lề ra ngoài hành lang. */
export const NO_TREE_ZONES = [
  { id: 'chanh-dien', x0: -36, x1: 36, z0: -62, z1: 36 },
  { id: 'vuon-thien', x0: ZEN.x0 - 4, x1: ZEN.x1 + 4, z0: ZEN.z0 - 4, z1: ZEN.z1 + 4 },
];
export const inNoTree = (x, z) => NO_TREE_ZONES.some((r) => x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1);
/** Danh sách cây GLB {model,x,z,s,ry}. Chỉ giữ chỗ cách đường ≥ 2,5 m, cách điểm đến ≥ 6 m, cách vật cản ≥ 2 m. `n` = số cây tối đa. */
export function glbTrees(n = 90) {
  let a = 7; const rnd = () => { a = (a * 16807) % 2147483647; return a / 2147483647; };
  const bag = TREE_MODELS.flatMap((m) => Array(m.w).fill(m.id));
  const out = [];
  for (let tries = 0; out.length < n && tries < 4000; tries++) {
    const x = (rnd() * 2 - 1) * (BOUNDS.xMax - 2), z = BOUNDS.zMin + 2 + rnd() * (GATE.z - 1.8 - BOUNDS.zMin - 4);
    if (inNoTree(x, z)) continue;                                                              // khu ngồi thiền / chánh điện / sân chính: không trồng cây
    if (distToPaths(x, z) < 2.5) continue;
    if ([...FEATURES].some((f) => Math.hypot(x - f.stand.x, z - f.stand.z) < 6)) continue;
    if (!clearAround(x, z, 2)) continue;
    if (out.some((t) => Math.hypot(t.x - x, t.z - z) < 4.5)) continue;
    out.push({ model: bag[(rnd() * bag.length) | 0], x: +x.toFixed(2), z: +z.toFixed(2), s: +(0.8 + rnd() * 0.6).toFixed(2), ry: +(rnd() * Math.PI * 2).toFixed(2) });
  }
  return out;
}
function clearAround(x, z, r) { for (let k = 0; k < 8; k++) { const t = k * Math.PI / 4; if (blocked(x + Math.cos(t) * r, z + Math.sin(t) * r)) return false; } return !blocked(x, z); }

let done = false, registeredTrees = [];
/** Đăng ký vật cản: nhà, đá, tượng, tháp, hồ (một lần dù import nhiều lần). Cây GLB đăng ký riêng bằng registerGlbTrees(). */
export function registerLandscape() {
  if (done) return; done = true;
  addRect({ x0: TEAHOUSE.cx - TEAHOUSE.w / 2, x1: TEAHOUSE.cx + TEAHOUSE.w / 2, z0: TEAHOUSE.cz - TEAHOUSE.d / 2, z1: TEAHOUSE.cz + TEAHOUSE.d / 2 });
  ZEN_ROCKS.forEach((r) => addCircle({ x: r.x, z: r.z, r: r.r }));
  addWater({ x: KOI.x, z: KOI.z, r: KOI.r, bridges: KOI.bridges });
  addCircle({ x: GUANYIN.x, z: GUANYIN.z, r: GUANYIN.r });
  PAGODAS.forEach((p) => addCircle({ x: p.x, z: p.z, r: p.r }));
}
/** Đăng ký va chạm gốc cây cho danh sách cây GLB đã dựng (gọi cùng danh sách với cảnh 3D). */
export function registerGlbTrees(list) {
  for (const t of list) { if (registeredTrees.includes(t)) continue; registeredTrees.push(t); addCircle({ x: t.x, z: t.z, r: TREE_COLLIDE_R * t.s }); }
}
registerLandscape();
export { TREES, BUILDINGS };
