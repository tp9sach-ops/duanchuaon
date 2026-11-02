// Bố cục thế giới chùa (đơn vị mét, +z là hướng ra cổng, -z là chính điện) và va chạm. Thuần hàm, không đụng three.js, có test.
// Toạ độ khớp với các hàm dựng trong js/scene/temple.js (Tam quan z=34, ao sen z=14, lư hương z=-8, chính điện z=-28).

export const SPAWN = { x: 0, z: 54, ry: Math.PI };   // ry: góc quay quanh trục Y (0 = nhìn về +z)

export const GATE = { z: 34, openings: [[-2.3, 2.3], [6.9, 9.3], [-9.3, -6.9]] };   // cổng giữa và hai cổng phụ
export const POND = { x: 0, z: 14, r: 10.6, bridgeHalf: 1.9 };
export const HALL = { cx: 0, cz: -28, platX: 17, platZ0: -38.4, platZ1: -17.5, wallX: 12.7, wallZ0: -34.7, wallZ1: -21.2, step: { x: 5, z0: -17.9, z1: -13.1 }, h: 1.5 };
export const BELL = { x: 28, z: -4, r: 5.2 };
export const CENSER = { x: 0, z: -8 };

// Vật cản tròn {x,z,r} và hình chữ nhật {x0,x1,z0,z1}. Thêm vật mới vào đây để nhân vật không đi xuyên.
export const CIRCLES = [
  { x: BELL.x, z: BELL.z, r: BELL.r },
  { x: CENSER.x, z: CENSER.z, r: 1.9 },
  { x: -24, z: 6, r: 1.0 }, { x: 24, z: 26, r: 1.0 }, { x: -34, z: -16, r: 1.1 },   // cây bồ đề
  { x: -40, z: 12, r: 2.4 }, { x: 42, z: 8, r: 2.4 },                                // bụi tre
];
// Hai hàng cột chính điện (7 cột mỗi hàng, cách 25/6)
for (let i = 0; i < 7; i++) { const x = -14 + 1.5 + i * (25 / 6); CIRCLES.push({ x, z: HALL.cz + 6.5, r: 0.6 }, { x, z: HALL.cz - 6.5, r: 0.6 }); }
export const RECTS = [
  { x0: -6.2, x1: 6.2, z0: -34.8, z1: -31.6 },    // bàn thờ chính và bệ tượng Phật
];

/** Thêm vật cản động (nhà tổ, am, ghế...) từ các module khác. */
export const addCircle = (c) => CIRCLES.push(c);
export const addRect = (r) => RECTS.push(r);

const inRect = (x, z, r) => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1;
const inGateOpening = (x) => GATE.openings.some(([a, b]) => x >= a && x <= b);

/** Vùng của điểm: 'ground' | 'step' | 'plat' (sàn chính điện). */
export function region(x, z) {
  const s = HALL.step;
  if (Math.abs(x) <= s.x && z <= s.z1 && z >= HALL.platZ1) return 'step';
  if (Math.abs(x) <= HALL.platX - 0.5 && z >= HALL.platZ0 && z <= HALL.platZ1) return 'plat';
  return 'ground';
}

/** Độ cao mặt đi tại (x, z): sàn chính điện, bậc thềm (dốc), cầu đá qua ao. */
export function groundY(x, z) {
  const r = region(x, z), s = HALL.step;
  if (r === 'plat') return HALL.h;
  if (r === 'step') { const t = (s.z1 - z) / (s.z1 - s.z0); return Math.max(0, Math.min(1, t)) * HALL.h; }
  if (Math.abs(x) <= POND.bridgeHalf && Math.abs(z - POND.z) <= POND.r + 0.6) return 0.34;
  return 0;
}

/** Điểm (x, z) có bị chặn không (không xét việc chuyển vùng; xem canStep). */
export function blocked(x, z) {
  // Ranh giới: trong sân, hoặc đường ngoài cổng
  const inside = Math.abs(x) <= 44 && z >= -40 && z <= GATE.z - 1.8;
  const outside = Math.abs(x) <= 14 && z >= GATE.z + 2.4 && z <= 62;
  const inGate = z > GATE.z - 1.8 && z < GATE.z + 2.4 && inGateOpening(x);
  if (!inside && !outside && !inGate) return true;
  // Ao sen: chặn trừ lối cầu đá
  if (Math.hypot(x - POND.x, z - POND.z) < POND.r && Math.abs(x) > POND.bridgeHalf) return true;
  // Chính điện: tường bên, tường hậu
  const r = region(x, z);
  if (r === 'plat') {
    if (z >= HALL.wallZ0 - 0.1 && z <= HALL.wallZ1 && Math.abs(x) > HALL.wallX) return true;
    if (z < HALL.wallZ0) return true;
  }
  for (const c of CIRCLES) if (Math.hypot(x - c.x, z - c.z) < c.r) return true;
  for (const q of RECTS) if (inRect(x, z, q)) return true;
  return false;
}

/** Có đi được từ (x0,z0) tới (x1,z1) không: không chặn và chỉ chuyển vùng đất↔bậc↔sàn. */
export function canStep(x0, z0, x1, z1) {
  if (blocked(x1, z1)) return false;
  const a = region(x0, z0), b = region(x1, z1);
  return a === b || (a !== 'ground' || b !== 'plat') && (a !== 'plat' || b !== 'ground');
}

/** Di chuyển một bước dx,dz có trượt dọc vật cản: thử cả hai trục. Trả { x, z }. */
export function move(x, z, dx, dz) {
  if (canStep(x, z, x + dx, z + dz)) return { x: x + dx, z: z + dz };
  if (dx !== 0 && canStep(x, z, x + dx, z)) return { x: x + dx, z };
  if (dz !== 0 && canStep(x, z, x, z + dz)) return { x, z: z + dz };
  return { x, z };
}
