// Dù che mưa và chỗ trú mưa cho NPC/dân làng (Phiên 28). DỮ LIỆU + LOGIC THUẦN (không three.js, có test: tests/shelter.test.mjs).
// Cảnh 3D (cây dù, dáng đi) ở js/scene/npc.js. Cấp mưa lấy từ weather.level (0 quang · 1 nhỏ · 2 vừa · 3 lớn có sấm chớp).
// Quy tắc: mưa nhỏ trở lên → mở dù (người đứng ngoài trời). Mưa lớn → người lớn đi tìm chỗ trú; trẻ em trú từ mưa vừa, vào nhà (biến mất) nếu chỗ trú là cửa hàng.
// Rời chỗ trú khi mưa chỉ còn nhỏ hoặc tạnh (ngưỡng vào/ra khác nhau để không chập chờn). Đi theo đường gấp khúc không xuyên vật cản, hết mưa thì quay lại đúng chỗ cũ.
import { blocked } from './layout.js';
import './outside.js';   // đăng ký vùng đi bộ và vật cản ngoài chùa

/** Chỗ trú mưa. indoor = cửa hàng (trẻ em vào trong, không hiện ra ngoài). Tọa độ thế giới; test kiểm tra không bị chặn và đi tới được. */
export const SHELTERS = [
  { id: 'gocda-t', ten: 'Gốc đa làng', x: -1.5, z: 128.8, indoor: false },
  { id: 'gocda-p', ten: 'Gốc đa làng', x: 1.5, z: 128.8, indoor: false },
  { id: 'dinh', ten: 'Đình nghỉ chân', x: 88.8, z: 90, indoor: false },
  { id: 'mieu', ten: 'Miếu nhỏ', x: -100.5, z: 78.4, indoor: false },
  { id: 'cuahang9sach', ten: 'Cửa hàng 9 Sạch', x: 16.4, z: 81.6, indoor: true },
  { id: 'tachhoa', ten: 'Tách Hoa', x: 16.5, z: 90, indoor: true },
  { id: 'didong', ten: 'Di Động Sen Vàng', x: -16.5, z: 112.6, indoor: true },
  { id: 'dienmay', ten: 'Điện Máy Lam Sen', x: -16.5, z: 72.4, indoor: true },
  { id: 'kimhoan', ten: 'Kim Hoàn Ngọc Lan', x: 16.2, z: 132, indoor: true },
];

/** NPC đứng sẵn dưới mái (chánh điện, mái hiên cửa hàng, quầy chợ, gốc đa): không cần mở dù. */
export const COVERED_IDS = ['truru', 'nvdidong', 'nvdienmay', 'nvkimhoan', 'cohoa', 'ongcu'];
export const isCovered = (id) => COVERED_IDS.includes(id);

export const UMBRELLA_FROM = 1;      // mưa nhỏ trở lên thì mở dù
export const SHELTER_ADULT = 3;      // người lớn đi trú khi mưa lớn
export const SHELTER_CHILD = 2;      // trẻ em đi trú sớm hơn, từ mưa vừa
export const LEAVE_AT = 1;           // mưa còn ≤ nhỏ thì rời chỗ trú
export const MAX_PLAN = 90;          // chỗ trú xa hơn (tổng quãng đi) thì thôi, cứ che dù đi tiếp
export const kindOf = (w) => (w && w.scale && w.scale < 1 ? 'child' : 'adult');
export const umbrellaOpen = (level) => level >= UMBRELLA_FROM;
export const wantsShelter = (kind, level) => level >= (kind === 'child' ? SHELTER_CHILD : SHELTER_ADULT);
export const leavesShelter = (level) => level <= LEAVE_AT;
/** Hệ số tốc độ bước đi theo cấp mưa: mưa thì đi nhanh hơn một chút; chạy tới chỗ trú nhanh hơn nữa (ở stepWalker). */
export const speedFactor = (level) => (level >= 1 ? 1.2 : 1);
export const RUN = 1.5;
export const REACT_BASE = 0.8, REACT_STEP = 0.9;   // mỗi người phản ứng với mưa lớn chậm hơn người trước ~0,9 giây (tự nhiên, và không tính đường trú của cả bảy người trong một khung hình)
export const RETRY = 6;                             // không tìm được chỗ trú thì 6 giây sau thử lại (không tính lại mỗi khung)

/** Đoạn thẳng a→b có đi được không: lấy mẫu mỗi 0,25 m, mỗi mẫu kiểm cả hai bên lề 0,25 m (người đi không sượt vật cản). `isBlocked` truyền vào để test. */
export function clearLine(a, b, isBlocked = blocked) {
  const dx = b[0] - a[0], dz = b[1] - a[1], d = Math.hypot(dx, dz), n = Math.max(1, Math.ceil(d / 0.25)), px = d ? -dz / d * 0.25 : 0.25, pz = d ? dx / d * 0.25 : 0;
  for (let i = 0; i <= n; i++) {
    const x = a[0] + dx * i / n, z = a[1] + dz * i / n;
    if (isBlocked(x, z) || isBlocked(x + px, z + pz) || isBlocked(x - px, z - pz)) return false;
  }
  return true;
}

/** Lập đường đi trú mưa cho người đang ở `pos` = [x,z] trên đoạn đường `path` = [[x,z],[x,z]]: đi dọc đường tới điểm P rồi rẽ thẳng vào chỗ trú.
 *  Chọn phương án có tổng quãng ngắn nhất, chỉ xét đoạn đi được. Trẻ em ưu tiên chỗ trú trong nhà. Trả { route, shelter, cost } hoặc null (không có chỗ gần nào).
 *  route[0] = vị trí xuất phát, route[cuối] = chỗ trú. */
export function planShelter(pos, path, kind = 'adult', shelters = SHELTERS, isBlocked = blocked) {
  const [a, b] = path, len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const cand = [pos];   // điểm rẽ: chính chỗ đang đứng, rồi các điểm trên đường mỗi ~2 m
  for (let s = 0; s <= len; s += 2) cand.push([a[0] + (b[0] - a[0]) * (s / len), a[1] + (b[1] - a[1]) * (s / len)]);
  cand.push(b);
  let best = null;
  const pools = kind === 'child' ? [shelters.filter((s) => s.indoor), shelters] : [shelters];
  for (const pool of pools) {
    for (const s of pool) for (const p of cand) {
      const first = Math.hypot(p[0] - pos[0], p[1] - pos[1]), cost = first + Math.hypot(s.x - p[0], s.z - p[1]);
      if (cost > MAX_PLAN || (best && cost >= best.cost)) continue;
      if (first > 0.01 && !clearLine(pos, p, isBlocked)) continue;
      if (!clearLine(p, [s.x, s.z], isBlocked)) continue;
      best = { cost, shelter: s, route: first > 0.01 ? [[pos[0], pos[1]], [p[0], p[1]], [s.x, s.z]] : [[pos[0], pos[1]], [s.x, s.z]] };
    }
    if (best) break;
  }
  return best;
}

/** Trạng thái khởi đầu của một người đi lại (k.mode: 'walk' đi tuần · 'route' đang đi theo đường trú/quay về · 'in' đang ở chỗ trú). */
export function newWalker(w, i = 0) {
  const [x, z] = w.path[0], react0 = REACT_BASE + i * REACT_STEP;
  return { x, z, to: 1, wait: 0, mode: 'walk', route: null, ri: 0, dir: 1, shelter: null, hidden: false, react: react0, react0 };
}

function advance(k, tx, tz, step) {
  const dx = tx - k.x, dz = tz - k.z, d = Math.hypot(dx, dz);
  if (d <= step) { k.x = tx; k.z = tz; return { arrived: true, face: null }; }
  k.x += dx / d * step; k.z += dz / d * step; return { arrived: false, face: Math.atan2(dx, dz) };
}

/** Một bước cho người đi lại. Sửa k tại chỗ. Trả { moving, speed, face } (face = null nếu không đổi hướng).
 *  Quy tắc xem đầu file. `level` = cấp mưa nguyên 0..3. */
export function stepWalker(k, w, dt, level, shelters = SHELTERS, isBlocked = blocked) {
  const kind = kindOf(w), out = { moving: false, speed: 0, face: null };
  if (k.mode === 'in') {
    if (leavesShelter(level)) { k.hidden = false; k.mode = 'route'; k.dir = -1; k.ri = k.route.length - 2; }   // hết mưa: ra khỏi chỗ trú, đi ngược đường về
    else { k.hidden = kind === 'child' && !!k.shelter.indoor; return out; }
  }
  if (k.mode === 'walk' && wantsShelter(kind, level)) {
    k.react -= dt;
    if (k.react <= 0) {
      const plan = planShelter([k.x, k.z], w.path, kind, shelters, isBlocked);
      if (plan) { k.mode = 'route'; k.route = plan.route; k.shelter = plan.shelter; k.ri = 1; k.dir = 1; k.react = k.react0; } else k.react = RETRY;
    }
  } else if (k.mode === 'walk') k.react = k.react0;   // không cần trú: đặt lại độ trễ
  else if (k.mode === 'route') {
    if (k.dir === 1 && leavesShelter(level)) { k.ri -= 1; k.dir = -1; }                // tạnh giữa đường: quay về
    else if (k.dir === -1 && wantsShelter(kind, level)) { k.ri += 1; k.dir = 1; }       // lại mưa lớn khi đang về: quay lại chỗ trú
  }
  if (k.mode === 'route') {
    const [tx, tz] = k.route[k.ri], speed = w.speed * RUN, r = advance(k, tx, tz, speed * dt);
    if (r.arrived) {
      if (k.dir === 1 && k.ri === k.route.length - 1) { k.mode = 'in'; k.hidden = kind === 'child' && !!k.shelter.indoor; return out; }
      if (k.dir === -1 && k.ri === 0) { k.mode = 'walk'; k.route = null; k.shelter = null; k.hidden = false; return out; }
      k.ri += k.dir;
    }
    return { moving: true, speed, face: r.face };
  }
  // đi tuần như cũ (hai đầu đường, tới đầu thì nghỉ rồi quay lại); mưa thì đi nhanh hơn chút
  if (k.wait > 0) { k.wait -= dt; return out; }
  const [tx, tz] = w.path[k.to], sp = w.speed * speedFactor(level), r = advance(k, tx, tz, sp * dt);
  if (r.arrived) { k.to = 1 - k.to; k.wait = 2 + Math.abs(k.x * 7 % 3); return out; }
  return { moving: true, speed: sp, face: r.face };
}
