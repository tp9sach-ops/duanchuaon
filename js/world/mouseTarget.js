// Chuột trên máy tính (Phiên 159): CHUỘT PHẢI = đi tới đó; bấm chuột phải 2 lần nhanh vào quái = chọn (khóa) mục tiêu để đánh.
// LOGIC THUẦN (không three.js, không DOM, có test): tests/mousetarget.test.mjs. Nối với chuột/cảnh ở js/world/world.js; khóa mục tiêu nằm ở js/ui/farm.js.

/** Tầm tối đa (m) từ người chơi tới quái đã khóa — xa hơn thì tự bỏ khóa (về chọn quái gần nhất như cũ). */
export const LOCK_RANGE = 36;
/** Hai lần bấm chuột phải cách nhau ≤ DOUBLE_MS mili giây và ≤ DOUBLE_PX điểm ảnh là "bấm đúp". */
export const DOUBLE_MS = 380;
export const DOUBLE_PX = 30;

const num = (x, d = 0) => (Number.isFinite(+x) ? +x : d);
const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });

/**
 * Bộ nhận biết bấm đúp. hit(x, y, t) → true nếu lần bấm này là lần THỨ HAI trong khung thời gian/khoảng cách (rồi quên đi, để lần thứ ba
 * không bị tính thành đúp tiếp); ngược lại ghi nhớ lần bấm và trả false. reset() quên lần bấm trước.
 */
export function createDoubleClick({ ms = DOUBLE_MS, px = DOUBLE_PX } = {}) {
  let last = null;
  return {
    hit(x, y, t) {
      const p = { x: num(x), y: num(y), t: num(t) };
      if (last && p.t - last.t >= 0 && p.t - last.t <= ms && Math.hypot(p.x - last.x, p.y - last.y) <= px) { last = null; return true; }
      last = p; return false;
    },
    reset() { last = null; },
  };
}

/**
 * Khoảng cách ngắn nhất giữa TIA (o + s·u, s ≥ 0) và ĐOẠN THẲNG (a + t·v, 0 ≤ t ≤ 1). o, u, a, v là {x,y,z}. Trả { dist, s }.
 * Dùng để biết tia từ con trỏ chuột có "chạm" thân một con quái (coi như đoạn thẳng đứng từ chân tới đầu) hay không.
 */
export function rayToSegment(o, u, a, v) {
  const w = sub(o, a), A = dot(u, u), B = dot(u, v), C = dot(v, v), D = dot(u, w), E = dot(v, w);
  const clamp01 = (x) => Math.max(0, Math.min(1, x));
  const den = A * C - B * B;
  let t = den > 1e-9 ? (A * E - B * D) / den : (C > 0 ? E / C : 0);
  t = clamp01(t);
  let s = A > 0 ? (B * t - D) / A : 0;
  if (s < 0) { s = 0; t = C > 0 ? clamp01(E / C) : 0; }
  const dx = o.x + s * u.x - (a.x + t * v.x), dy = o.y + s * u.y - (a.y + t * v.y), dz = o.z + s * u.z - (a.z + t * v.z);
  return { dist: Math.hypot(dx, dy, dz), s };
}

/** Kích thước vùng chạm của quái (rộng rãi hơn thân thật cho dễ bấm): { h: chiều cao, r: bán kính } theo loại quái. */
export function monsterVolume(m) {
  if (m && m.boss) return { h: 3.4, r: 1.7 };
  if (m && m.elite) return { h: 2.7, r: 1.2 };
  return { h: 1.9, r: 0.85 };
}

/**
 * Chọn quái dưới con trỏ. origin, dir = tia từ camera ({x,y,z}, dir độ dài 1); mons = [{ uid, x, z, boss?, elite? }].
 * Trả quái bị tia chạm GẦN CAMERA NHẤT, hoặc null. `reach` (m) = tầm tối đa dọc theo tia.
 */
export function pickMonster(origin, dir, mons, { reach = 120 } = {}) {
  if (!origin || !dir || !Array.isArray(mons)) return null;
  const o = { x: num(origin.x), y: num(origin.y), z: num(origin.z) }, u = { x: num(dir.x), y: num(dir.y), z: num(dir.z) };
  let best = null, bs = Infinity;
  for (const m of mons) {
    if (!m || !m.uid || !Number.isFinite(+m.x) || !Number.isFinite(+m.z)) continue;
    const { h, r } = monsterVolume(m), a = { x: +m.x, y: 0, z: +m.z }, v = { x: 0, y: h, z: 0 };
    const q = rayToSegment(o, u, a, v);
    if (q.dist <= r && q.s <= reach && q.s < bs) { bs = q.s; best = m; }
  }
  return best;
}
