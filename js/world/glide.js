// BAY LƯỚT trên không (Phiên 196, mục 3 danh sách ptg 15/11): đang nhảy mà bấm Nhảy lần nữa → bay lướt từ từ theo hướng nhìn (hoặc hướng cần/phím),
// xung đẩy đầu mạnh rồi yếu dần, rơi chậm (không rơi tự do), hạ cánh có đoạn ĐỆM ~0,13 s, camera tự xoay ra sau lưng theo hướng bay.
// LOGIC THUẦN (không DOM, không three.js), có test: tests/glide.test.mjs. Mọi con số là QUY ƯỚC TẠM, chờ ptg thử rồi chỉnh (tam: true).
// Nối: js/world/skills.js (createJump.glide + flyPlan), js/ui/skill.js (bấm Nhảy trên không), js/world/world.js (fly() + camera theo).

export const FLY_CFG = Object.freeze({
  tam: true,
  v0Base: 6.2, v0PerBac: 0.4,          // m/s: xung đẩy đầu = base + perBac × bậc
  cruiseBase: 2.1, cruisePerBac: 0.12, // m/s: tốc độ lướt duy trì sau khi xung yếu dần
  tau: 0.5,                            // s: hằng số thời gian xung yếu dần (v = cruise + (v0 − cruise)·e^(−t/τ))
  fallMin: 1.1, fallMax: 3.0, fallTime: 2.4,   // m/s: tốc độ rơi tối đa = độ cao / fallTime, kẹp [fallMin, fallMax] → hạ từ từ, không quá ~2,4 s
  upG: 0.8, downG: 0.8,                // hệ số trọng lực lúc còn lên / lúc xuống (nhẹ thân)
  cushionT: 0.075, cushionKeep: 0.3,   // vùng đệm cuối: vận tốc rơi giảm còn 30% khi chạm đất; tổng thời gian đệm ≈ 0,13 s (100–150 ms)
  brakeKeep: 0.45,                     // trong vùng đệm tốc độ ngang giảm còn 45%
  turn: 2.4,                           // rad/s: tốc độ bẻ hướng bay theo cần/phím
  tilt: 0.38,                          // rad: thân chúi về trước khi bay
  camK: 2.4, camHold: 0.9,             // camera xoay ra sau lưng (hằng số bám /s); sau khi người chơi tự kéo camera thì nhường camHold giây
  fov: 0.035,                          // mở góc nhìn thêm 3,5% khi đang bay (cảm giác nhanh)
});

const num = (v, d = 0) => (Number.isFinite(+v) ? +v : d);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const wrapPi = (a) => { const t = (a + Math.PI) % (Math.PI * 2); return (t < 0 ? t + Math.PI * 2 : t) - Math.PI; };

/** Tốc độ rơi tối đa (m/s) của cú bay lướt khi đỉnh nhảy cao `apex` m. */
export const fallSpeed = (apex) => clamp(num(apex) / FLY_CFG.fallTime, FLY_CFG.fallMin, FLY_CFG.fallMax);

/** Bề dày vùng đệm (m) khi rơi với tốc độ `fall`: quãng đi trong cushionT giây. */
export const cushionH = (fall) => Math.max(0.05, num(fall, FLY_CFG.fallMin) * FLY_CFG.cushionT);

/**
 * Cập nhật vận tốc đứng `vy` (m/s, + là lên) trong MỘT bước nhỏ `dt` khi đang bay lướt, ở độ cao `y` (m), g = trọng lực của cú nhảy.
 * Lên: trọng lực giảm 20%; xuống: kẹp ở −fall; sát đất (vùng đệm): giảm dần còn 30% vận tốc rơi.
 */
export function flyVy(vy, y, fall, dt, g) {
  let v = num(vy) - num(g, 16) * (vy > 0 ? FLY_CFG.upG : FLY_CFG.downG) * num(dt);
  if (v < -fall) v = -fall;
  const hc = cushionH(fall);
  if (y < hc && v < 0) { const m = FLY_CFG.cushionKeep + (1 - FLY_CFG.cushionKeep) * (Math.max(0, y) / hc); v = Math.max(v, -fall * m); }
  return v;
}

/** Tốc độ ngang (m/s) sau `t` giây kể từ lúc bắt đầu bay: xung đẩy yếu dần về mức lướt duy trì. plan = { v0, cruise, tau }. */
export function flySpeed(plan, t) {
  const p = plan || {}, tau = Math.max(0.05, num(p.tau, FLY_CFG.tau));
  return num(p.cruise) + (num(p.v0) - num(p.cruise)) * Math.exp(-Math.max(0, num(t)) / tau);
}

/** Hệ số phanh tốc độ ngang khi đang ở vùng đệm cuối (1 = không phanh; còn brakeKeep sát đất). */
export function flyBrake(y, fall) {
  const hc = cushionH(fall), k = clamp(num(y) / hc, 0, 1);
  return k >= 1 ? 1 : FLY_CFG.brakeKeep + (1 - FLY_CFG.brakeKeep) * k;
}

/** Bẻ hướng bay `dir` ({x,z} đơn vị) về hướng muốn `want` ({x,z,mag}) tối đa `turn` rad/s; mag nhỏ (không bấm gì) → giữ hướng. Trả {x,z} đơn vị. */
export function steerDir(dir, want, turn, dt) {
  const d = dir && Math.hypot(dir.x, dir.z) > 1e-6 ? { x: dir.x / Math.hypot(dir.x, dir.z), z: dir.z / Math.hypot(dir.x, dir.z) } : { x: 0, z: 1 };
  if (!want || !(num(want.mag) > 0.15) || Math.hypot(want.x, want.z) < 1e-6) return d;
  const a0 = Math.atan2(d.x, d.z), a1 = Math.atan2(want.x, want.z), step = clamp(wrapPi(a1 - a0), -num(turn, FLY_CFG.turn) * Math.max(0, num(dt)), num(turn, FLY_CFG.turn) * Math.max(0, num(dt)));
  return { x: Math.sin(a0 + step), z: Math.cos(a0 + step) };
}

/** Góc yaw camera để đứng SAU lưng người đang quay mặt về hướng `ry` (rad; 0 = +z như avatar.setFacing). Xem camPose: camera ở (sin yaw, cos yaw) so với nhân vật. */
export const yawBehind = (ry) => num(ry) + Math.PI;

/** Camera xoay mượt về sau lưng hướng `ry` theo đường ngắn nhất: trả yaw mới (không bao giờ vượt quá mục tiêu). */
export function followYaw(yaw, ry, dt, k = FLY_CFG.camK) {
  const d = wrapPi(yawBehind(ry) - num(yaw));
  return num(yaw) + d * (1 - Math.exp(-Math.max(0, num(k)) * Math.max(0, num(dt))));
}
