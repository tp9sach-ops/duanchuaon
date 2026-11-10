// Bố cục thế giới chùa (đơn vị mét, +z là hướng ra cổng, -z là chính điện) và va chạm. Thuần hàm, không đụng three.js, có test.
// Toạ độ khớp với các hàm dựng trong js/scene/temple.js (Tam quan z=34, ao sen z=14, lư hương z=-8, chính điện z=-28).

// Phiên 14f: khuôn viên mở rộng thành 156 × 110 m (hoa viên Tây/Đông, vườn tháp phía sau). Một nguồn duy nhất cho ranh giới.
export const BOUNDS = { xMax: 78, zMin: -78 };
export const SPAWN = { x: 0, z: 54, ry: Math.PI };   // ry: góc quay quanh trục Y (0 = nhìn về +z)

export const GATE = { z: 34, openings: [[-2.3, 2.3], [6.9, 9.3], [-9.3, -6.9]] };   // cổng giữa và hai cổng phụ
export const POND = { x: 0, z: 14, r: 10.6, bridgeHalf: 1.9 };
// Chánh điện rộng (Phiên 14e): lòng điện 39 × 26 m (x ±19,5; z -47 … -21), nền cao 1,14 m, bậc thềm giữa rộng 10 m. Cảnh 3D (chanhdien.js) dựng từ chính các số này.
export const HALL = { cx: 0, cz: -34, platX: 22, platZ0: -52, platZ1: -17.5, wallX: 19.5, wallZ0: -47, wallZ1: -21.2, step: { x: 5, z0: -17.9, z1: -13.1 }, h: 1.14 };   // h = mặt sàn gỗ chánh điện (js/scene/chanhdien.js: bệ đá cao 1.0 + sàn gỗ 0.12 + 0.02)
export const BELL = { x: 28, z: -4, r: 5.2 };
/** Cột chính điện: hàng trước (chừa lối giữa rộng 5 m), hai hàng cột dọc hai bên lòng điện. {x,z,r} */
export const COLUMN_R = 0.5;
export const COLUMNS = [
  ...[-17.5, -12.5, -7.5, -2.5, 2.5, 7.5, 12.5, 17.5].map((x) => ({ x, z: -21.5, r: COLUMN_R })),
  ...[-27, -33, -39, -45].flatMap((z) => [-17, 17].map((x) => ({ x, z, r: COLUMN_R }))),
];
export const CENSER = { x: 0, z: -8 };

/**
 * Bậc thềm chính điện (Phiên 29): js/scene/chanhdien.js dựng 5 BẬC ĐÁ rời, mỗi bậc sâu `run` m, mặt bậc thứ i cao (i+1)·h/5, bậc 0 sát sân (z = step.z1), bậc 4 sát hiên (z = platZ1).
 * Trước đây mặt đi là một dốc thoải nằm DƯỚI các bậc nên chân nhân vật lún vào đá; nay độ cao đi theo đúng mặt từng bậc.
 */
export const STAIRS = { n: 5, run: (HALL.step.z1 - HALL.platZ1) / 5 };
/** Thành bậc: hai khối đá dài hai bên cầu thang (chanhdien.js: box 0,45 × 4,8 tại x = ±5,45) — vật cản để không đi xuyên từ bên hông. */
export const STAIR_RAILS = [1, -1].map((s) => ({ x0: Math.min(s * 5.225, s * 5.675), x1: Math.max(s * 5.225, s * 5.675), z0: HALL.step.z0, z1: HALL.step.z1 }));

// Vật cản tròn {x,z,r} và hình chữ nhật {x0,x1,z0,z1}. Thêm vật mới vào đây để nhân vật không đi xuyên.
export const CIRCLES = [
  { x: BELL.x, z: BELL.z, r: BELL.r },
  { x: CENSER.x, z: CENSER.z, r: 1.9 },
  { x: -24, z: 6, r: 1.0 }, { x: 24, z: 26, r: 1.0 }, { x: -34, z: -16, r: 1.1 },   // cây bồ đề
  { x: -40, z: 12, r: 2.4 }, { x: 42, z: 8, r: 2.4 },                                // bụi tre
];
for (const c of COLUMNS) CIRCLES.push(c);
export const RECTS = [
  { x0: -9, x1: 9, z0: -47.5, z1: -43.4 },    // bàn thờ chính và bệ tượng Phật
  ...STAIR_RAILS,                              // thành bậc thềm hai bên
];

/** Thêm vật cản động (nhà tổ, am, ghế...) từ các module khác. */
export const addCircle = (c) => CIRCLES.push(c);
export const addRect = (r) => RECTS.push(r);
/** Vùng đi bộ ngoài cổng chùa (Phiên 17: đường làng, chợ, đường mòn rừng/thác): hình chữ nhật {x0,x1,z0,z1}. Ngoài mọi vùng thì bị chặn. */
export const WALKS = [];
export const addWalk = (r) => WALKS.push(r);
/** Hồ nước thêm (Phiên 14f): {x,z,r, bridges:[{x0,x1,z0,z1,y}], id?, swim?}. Trong hồ là vật cản, trừ các mảng cầu/đảo (đi được, cao y); `swim: true` = bơi/lặn được (js/world/swim.js). */
export const WATERS = [];
export const addWater = (w) => WATERS.push(w);
export const bridgeAt = (x, z) => { for (const w of WATERS) for (const b of w.bridges || []) if (x >= b.x0 && x <= b.x1 && z >= b.z0 && z <= b.z1) return b; return null; };

const inRect = (x, z, r) => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1;
const inGateOpening = (x) => GATE.openings.some(([a, b]) => x >= a && x <= b);

// ---- VA CHẠM THEO ZONE (Phiên 81) -------------------------------------------------------------------------------------------------------------------
// Trước đây mọi vật cản nằm trong MỘT bộ mảng toàn cục. Nay mỗi zone có bộ riêng: chỉ zone đang chạy nằm trong CIRCLES/RECTS/WALKS/WATERS,
// zone khác được cất vào kho. Các mảng được đổi NỘI DUNG TẠI CHỖ (không đổi đối tượng) nên mọi module đã import CIRCLES/RECTS vẫn đúng.
// Zone 'chua' (hub, chùa Diệu Giang) là mặc định: mọi addCircle/addRect gọi lúc import đều rơi vào đó, nên hành vi cũ giữ nguyên.
// Zone khác: defineZone(id, { bounds: {x0,x1,z0,z1}, terrain?: (x,z)=>bool chặn thêm, groundY?: (x,z)=>độ cao }). Ngoài bounds là bị chặn; không có chính điện/ao/cổng của hub.
export const HUB = 'chua';
const zoneStore = new Map();      // id -> { circles, rects, walks, waters } của zone ĐANG KHÔNG chạy
const zoneDefs = new Map();       // id -> định nghĩa địa hình (zone khác hub)
let activeZone = HUB, layoutRev = 0;
/** Zone đang chạy. */
export const activeZoneId = () => activeZone;
/** Số lần đổi zone (để bộ nhớ đệm tìm đường biết làm mới). */
export const zoneRevision = () => layoutRev;
export function defineZone(id, def = {}) {
  if (!id || id === HUB) throw new Error('Không định nghĩa lại zone hub: ' + id);
  const b = def.bounds;
  if (!b || ![b.x0, b.x1, b.z0, b.z1].every(Number.isFinite) || b.x0 >= b.x1 || b.z0 >= b.z1) throw new Error('Zone ' + id + ' cần bounds {x0,x1,z0,z1} hợp lệ');
  zoneDefs.set(id, def);
  if (!zoneStore.has(id)) zoneStore.set(id, { circles: [], rects: [], walks: [], waters: [] });
}
/** Khung bounds của zone đang chạy (hub → null: hub dùng khung riêng của path.js). */
export const activeBounds = () => { const d = activeZone === HUB ? null : zoneDefs.get(activeZone); return d ? d.bounds : null; };
export const hasZone = (id) => id === HUB || zoneDefs.has(id);
/** Chuyển zone đang chạy: cất vật cản của zone cũ, nạp vật cản của zone mới. Trả true nếu có đổi. */
export function activateZone(id) {
  if (id === activeZone) return false;
  if (!hasZone(id)) throw new Error('Zone chưa định nghĩa: ' + id);
  zoneStore.set(activeZone, { circles: CIRCLES.splice(0), rects: RECTS.splice(0), walks: WALKS.splice(0), waters: WATERS.splice(0) });
  const s = zoneStore.get(id) || { circles: [], rects: [], walks: [], waters: [] };
  for (const c of s.circles) CIRCLES.push(c);
  for (const r of s.rects) RECTS.push(r);
  for (const w of s.walks) WALKS.push(w);
  for (const w of s.waters) WATERS.push(w);
  zoneStore.delete(id);
  activeZone = id; layoutRev++;
  return true;
}
/** Thêm vật cản vào một zone KHÔNG chạy (dựng zone trước khi vào). Zone đang chạy thì dùng addCircle/addRect. */
export function addToZone(id, kind, item) {
  if (id === activeZone) { ({ circle: addCircle, rect: addRect, walk: addWalk, water: addWater })[kind](item); return; }
  if (!hasZone(id)) throw new Error('Zone chưa định nghĩa: ' + id);
  const s = zoneStore.get(id) || { circles: [], rects: [], walks: [], waters: [] }; zoneStore.set(id, s);
  s[({ circle: 'circles', rect: 'rects', walk: 'walks', water: 'waters' })[kind]].push(item);
}
const zoneDef = () => (activeZone === HUB ? null : zoneDefs.get(activeZone));

/** Vùng của điểm: 'ground' | 'step' | 'plat' (sàn chính điện). Zone khác hub chỉ có 'ground'. */
export function region(x, z) {
  if (activeZone !== HUB) return 'ground';
  const s = HALL.step;
  if (Math.abs(x) <= s.x && z <= s.z1 && z >= HALL.platZ1) return 'step';
  if (Math.abs(x) <= HALL.platX - 0.5 && z >= HALL.platZ0 && z <= HALL.platZ1) return 'plat';
  return 'ground';
}

/** Độ cao mặt đi tại (x, z): sàn chính điện, mặt từng bậc thềm (bậc rời), cầu đá qua ao, cầu/đảo của hồ thêm. */
export function groundY(x, z) {
  const zd = zoneDef(); if (zd) return zd.groundY ? zd.groundY(x, z) : 0;
  const r = region(x, z), s = HALL.step;
  if (r === 'plat') return HALL.h;
  if (r === 'step') { const i = Math.max(0, Math.min(STAIRS.n - 1, Math.floor((s.z1 - z) / STAIRS.run))); return (i + 1) * HALL.h / STAIRS.n; }
  if (Math.abs(x) <= POND.bridgeHalf && Math.abs(z - POND.z) <= POND.r + 0.6) return 0.34;
  const br = bridgeAt(x, z); if (br) return br.y;
  return 0;
}

/** Khối đặc của chính điện (tường bên, tường hậu, khối đá nền). y = độ cao điểm xét: khối đá nền chỉ chặn khi y thấp hơn mặt nền (camera bay cao hơn thì không bị chặn). */
function hallSolid(x, z, y) {
  if (activeZone !== HUB) return false;
  const r = region(x, z);
  if (r === 'plat') {
    if (z >= HALL.wallZ0 - 0.1 && z <= HALL.wallZ1 && Math.abs(x) > HALL.wallX) return true;
    if (z < HALL.wallZ0) return true;
  } else if (r === 'ground' && Math.abs(x) < HALL.platX && z >= HALL.platZ0 && z <= HALL.platZ1) {
    return y < HALL.h;   // dải 0,5 m sát hai bên nền: khối đá của nền chính điện (nền rộng ±platX, vùng sàn đi được chỉ tới ±(platX − 0,5))
  }
  return false;
}
/** Điểm (x, z, y) có là VẬT ĐẶC chắn tầm nhìn camera không (Phiên 31): vật cản tròn/chữ nhật + khối chính điện. Không tính ranh giới, ao, hồ (camera bay được trên mặt nước). */
export function solidAt(x, z, y = 1.6) {
  for (const c of CIRCLES) if (Math.hypot(x - c.x, z - c.z) < c.r && (c.h === undefined || y < c.h)) return true;   // c.h = chiều cao vật thấp (chậu, ghế…): camera bay qua phía trên
  for (const q of RECTS) if (inRect(x, z, q) && (q.h === undefined || y < q.h)) return true;
  return hallSolid(x, z, y);
}

/** Phần chặn do ĐỊA HÌNH (ranh giới, ao, hồ, tường và nền chính điện), chưa tính vật cản tròn/chữ nhật. */
function terrainBlocked(x, z) {
  const zd = zoneDef();
  if (zd) {   // zone khác hub: chỉ có bounds + địa hình riêng + hồ riêng (không có ranh giới/ao/cổng của chùa)
    if (!inRect(x, z, zd.bounds)) return true;
    if (zd.terrain && zd.terrain(x, z)) return true;
    for (const w of WATERS) if (Math.hypot(x - w.x, z - w.z) < w.r && !bridgeAt(x, z)) return true;
    return false;
  }
  // Ranh giới: trong sân, hoặc đường ngoài cổng
  const inside = Math.abs(x) <= BOUNDS.xMax && z >= BOUNDS.zMin && z <= GATE.z - 1.8;
  const outside = (Math.abs(x) <= 14 && z >= GATE.z + 2.4 && z <= 62) || WALKS.some((w) => inRect(x, z, w));
  const inGate = z > GATE.z - 1.8 && z < GATE.z + 2.4 && inGateOpening(x);
  if (!inside && !outside && !inGate) return true;
  // Ao sen: chặn trừ lối cầu đá
  if (Math.hypot(x - POND.x, z - POND.z) < POND.r && Math.abs(x) > POND.bridgeHalf) return true;
  // Hồ thêm: chặn trừ cầu/đảo
  for (const w of WATERS) if (!w.swim && Math.hypot(x - w.x, z - w.z) < w.r && !bridgeAt(x, z)) return true;   // nước có cờ `swim` (Phiên 80) bơi/lặn được, không chặn
  if (hallSolid(x, z, 0)) return true;
  return false;
}

/** Điểm (x, z) có bị chặn không (không xét việc chuyển vùng; xem canStep). */
export function blocked(x, z) {
  if (terrainBlocked(x, z)) return true;
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

// ---- Va chạm theo THÂN NGƯỜI (Phiên 29) -------------------------------------------------------------------------------------------------------------
// Trước đây nhân vật là MỘT ĐIỂM nên thân (rộng ~0,7 m) lún vào tường, góc nhà, cột, thành bậc. Nay thân là đường tròn bán kính PLAYER_R.
// Khoảng chừa của tìm đường (path.js: CLEAR 0,7 m, M 0,7 m) PHẢI ≥ PLAYER_R (0,35 m) + dung sai đổi mốc của navigator (0,3 m) để người đi theo đường tự tìm không bị kẹt vào trụ đèn/vật mảnh.
export const PLAYER_R = 0.35;
const RING = Array.from({ length: 8 }, (_, k) => [Math.cos(k * Math.PI / 4) * PLAYER_R, Math.sin(k * Math.PI / 4) * PLAYER_R]);

/**
 * Thân người tại (x, z) có chạm vật cản không: vật tròn/chữ nhật (đo đúng bán kính thân), ranh giới/ao/tường (8 điểm quanh thân),
 * và mép nền chính điện (đất sát nền hoặc sàn sát mép: thân không được gác lên mép nền đá; chỉ qua bậc thềm).
 */
export function bodyBlocked(x, z) {
  if (terrainBlocked(x, z)) return true;
  for (const c of CIRCLES) if (Math.hypot(x - c.x, z - c.z) < c.r + PLAYER_R) return true;
  for (const q of RECTS) if (x > q.x0 - PLAYER_R && x < q.x1 + PLAYER_R && z > q.z0 - PLAYER_R && z < q.z1 + PLAYER_R) return true;
  const rc = region(x, z);
  for (const [dx, dz] of RING) {
    const px = x + dx, pz = z + dz;
    if (terrainBlocked(px, pz)) return true;
    const rp = region(px, pz);
    if (rp !== rc && ((rc === 'ground' && rp === 'plat') || (rc === 'plat' && rp === 'ground'))) return true;
  }
  return false;
}

/** Như canStep nhưng cho THÂN người: tâm đi được và thân ở vị trí mới không chạm gì. */
export const canStepBody = (x0, z0, x1, z1) => canStep(x0, z0, x1, z1) && !bodyBlocked(x1, z1);

/**
 * Như move nhưng thân người có bán kính PLAYER_R (trượt dọc vật cản). Nếu thân ĐANG chạm sẵn (vừa dịch chuyển tới, vừa đứng dậy khỏi bồ đoàn sát cột...)
 * thì dùng va chạm điểm như cũ để vẫn bước ra được, không bị kẹt cứng.
 */
export function moveBody(x, z, dx, dz) {
  if (bodyBlocked(x, z)) return move(x, z, dx, dz);
  if (canStepBody(x, z, x + dx, z + dz)) return { x: x + dx, z: z + dz };
  if (dx !== 0 && canStepBody(x, z, x + dx, z)) return { x: x + dx, z };
  if (dz !== 0 && canStepBody(x, z, x, z + dz)) return { x, z: z + dz };
  return { x, z };
}
