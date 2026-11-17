// BẦY CHÓ CHẠY THEO khi cưỡi Gậy dạy chó (Phiên 227): LOGIC THUẦN (không DOM / three.js), có test: tests/wolffx.test.mjs. Hình khối + vẽ: js/ui/dogPack.js.
// Chó chạy theo sau người cưỡi ở các ô `slots` ([ngang phải, tiến] tính theo hướng người; tiến âm = phía sau). Xuống gậy thì chó mờ dần rồi biến mất.
// Mọi con số là QUY ƯỚC TẠM (tam: true), chờ ptg chơi thử rồi chỉnh.
export const DOGS = Object.freeze({
  tam: true,
  count: 4,         // số chó
  slots: Object.freeze([[-1.3, -2.0], [1.4, -2.7], [-0.9, -3.7], [1.0, -4.5]].map((s) => Object.freeze(s))),
  follow: 4.2,      // độ bám: tốc độ chạy = khoảng cách × follow (kẹp ở maxSpeed)
  maxSpeed: 16,     // m/s: tốc độ chạy tối đa của chó
  snap: 30,         // m: cách xa hơn mức này (dịch chuyển) thì chó nhảy thẳng tới chỗ
  fadeIn: 0.35,     // giây hiện ra
  fadeOut: 0.45,    // giây mờ dần khi xuống gậy
  lift: 0.45,       // m: độ nâng người khi cưỡi gậy (cùng FLY_LIFT của js/ui/board.js) → chó đứng dưới đất
  size: 1.15,       // hệ số to của chó
  still: 0.35,      // m/s: chậm hơn mức này coi như đứng yên
});

const TAU = Math.PI * 2;
const num = (x, d = 0) => (Number.isFinite(+x) ? +x : d);

/** Đưa góc về (−π, π]. */
export const wrapAngle = (a) => { const n = num(a); return n - TAU * Math.round(n / TAU); };

/** Toạ độ thế giới {x, z} của một ô `slot` [ngang phải, tiến] khi người đứng ở `p` {x,z} quay hướng `heading` (rad quanh y, 0 = +z). */
export function slotWorld(p, heading, slot) {
  const c = Math.cos(num(heading)), s = Math.sin(num(heading)), x = num(slot && slot[0]), z = num(slot && slot[1]);
  return { x: num(p && p.x) + x * c + z * s, z: num(p && p.z) + z * c - x * s };
}

/** Một bước chó chạy từ `cur` tới `to` trong dt giây: nhanh dần theo khoảng cách, không vượt quá đích; trả { x, z, speed (m/s) }. Quá xa (> snap) thì nhảy thẳng. */
export function followStep(cur, to, dt, follow = DOGS.follow, vmax = DOGS.maxSpeed) {
  const d = Math.max(0, Math.min(0.25, num(dt))), dx = num(to && to.x) - num(cur && cur.x), dz = num(to && to.z) - num(cur && cur.z), dist = Math.hypot(dx, dz);
  if (dist > DOGS.snap) return { x: num(to.x), z: num(to.z), speed: 0 };
  if (dist < 1e-6 || d <= 0) return { x: num(cur && cur.x), z: num(cur && cur.z), speed: 0 };
  const sp = Math.min(vmax, dist * follow), mv = Math.min(dist, sp * d);
  return { x: num(cur.x) + (dx / dist) * mv, z: num(cur.z) + (dz / dist) * mv, speed: mv / d };
}

/** Quay góc `cur` về `target` theo đường ngắn nhất, tối đa rate × dt rad. */
export function turnToward(cur, target, dt, rate = 9) {
  const diff = wrapAngle(num(target) - num(cur)), lim = Math.max(0, num(rate)) * Math.max(0, num(dt));
  return num(cur) + Math.max(-lim, Math.min(lim, diff));
}

/** Độ hiện 0..1 của cả bầy: tiến về 1 (want) trong fadeIn giây hoặc về 0 trong fadeOut giây. */
export function fadeStep(k, want, dt) {
  const c = Math.max(0, Math.min(1, num(k))), d = Math.max(0, num(dt));
  return want ? Math.min(1, c + d / DOGS.fadeIn) : Math.max(0, c - d / DOGS.fadeOut);
}

/** Nhịp chạy (rad/giây của chu kỳ chân) theo tốc độ; đứng yên thì 0. */
export const gaitRate = (speed) => (num(speed) < DOGS.still ? 0 : 7 + num(speed) * 1.3);
