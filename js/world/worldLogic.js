// Logic thuần của chế độ đi bộ (không three.js, có test): hướng đi theo camera, bước đi có va chạm, bấm-để-đi, joystick, tư thế camera theo sau.
// Quy ước góc camera `yaw`: camera đứng ở phía +z của người khi yaw = 0 và nhìn về -z; yaw tăng thì camera vòng sang phía +x.
import { clamp } from '../util.js';
import { move, groundY } from './layout.js';

export const WALK_SPEED = 4, RUN_SPEED = 7, CLICK_SPEED = 4.4;
export const CAM_DIST = { min: 2.6, max: 14, def: 5.2 }, CAM_PITCH = { min: 0.08, max: 1.2, def: 0.36 };

/** Hướng "đi lên" trên màn hình theo yaw camera. */
export const forwardOf = (yaw) => ({ x: -Math.sin(yaw), z: -Math.cos(yaw) });
/** Hướng "sang phải" trên màn hình theo yaw camera. */
export const rightOf = (yaw) => ({ x: Math.cos(yaw), z: -Math.sin(yaw) });
/** Góc quay nhân vật (ry của avatar: 0 = nhìn +z) để nhìn theo hướng (dx, dz). */
export const facingOf = (dx, dz) => Math.atan2(dx, dz);

/** Từ phím (f/b/l/r là boolean) và joystick ({x,y} trong [-1,1], y<0 là đẩy lên) → vectơ đi trong thế giới, độ dài ≤ 1. */
export function moveVector(keys = {}, joy = null, yaw = 0) {
  let sx = (keys.r ? 1 : 0) - (keys.l ? 1 : 0), sy = (keys.f ? 1 : 0) - (keys.b ? 1 : 0);    // sy>0 = đi lên
  if (joy && (joy.x || joy.y)) { sx += joy.x; sy += -joy.y; }
  const m = Math.hypot(sx, sy); if (m < 1e-6) return { x: 0, z: 0, mag: 0 };
  const k = m > 1 ? 1 / m : 1; sx *= k; sy *= k;
  const f = forwardOf(yaw), r = rightOf(yaw);
  return { x: f.x * sy + r.x * sx, z: f.z * sy + r.z * sx, mag: Math.min(1, m) };
}

/** Joystick cảm ứng: (dx, dy) là độ lệch của ngón tay so với tâm (px), radius là bán kính cần; có vùng chết 12%. */
export function joyVector(dx, dy, radius) {
  const m = Math.hypot(dx, dy) / radius;
  if (m < 0.12) return { x: 0, y: 0 };
  const k = Math.min(1, (m - 0.12) / 0.88) / m;
  return { x: dx / radius * k, y: dy / radius * k };
}

/**
 * Đi một bước có va chạm: p = {x,z}, v = vectơ hướng (độ dài ≤ 1), speed m/s. Trượt dọc tường (layout.move). Trả {x, z, y, moved}.
 * Mỗi bước tối đa 0,5 m để không xuyên tường khi khung hình chậm.
 */
export function walkStep(p, v, dt, speed) {
  const len = Math.hypot(v.x, v.z) * speed * dt;
  if (len < 1e-9) return { x: p.x, z: p.z, y: groundY(p.x, p.z), moved: 0 };
  const n = Math.max(1, Math.ceil(len / 0.5)), sx = v.x * speed * dt / n, sz = v.z * speed * dt / n;
  let x = p.x, z = p.z;
  for (let i = 0; i < n; i++) { const q = move(x, z, sx, sz); x = q.x; z = q.z; }
  return { x, z, y: groundY(x, z), moved: Math.hypot(x - p.x, z - p.z) };
}

/**
 * Bấm-để-đi: đặt điểm đến, mỗi khung hỏi hướng đi. Tự dừng khi tới nơi (≤ 0,35 m) hoặc bị kẹt (gần 0,8 giây không tiến thêm).
 */
export function createNavigator() {
  let tx = 0, tz = 0, active = false, best = Infinity, since = 0, queue = [], lastD = Infinity;   // queue: các mốc còn lại sau mốc hiện tại (đường tìm bằng path.js); lastD: khoảng cách khung trước tới mốc hiện tại
  return {
    get active() { return active; },
    get target() { if (!active) return null; const l = queue.length ? queue[queue.length - 1] : { x: tx, z: tz }; return { x: l.x, z: l.z }; },
    setTarget(x, z) { queue = []; tx = x; tz = z; active = true; best = Infinity; since = 0; lastD = Infinity; },
    /** Đi qua lần lượt các mốc [{x,z}, ...]; mốc giữa không chậm lại, mốc cuối chậm dần rồi dừng. */
    setPath(pts) { if (!pts || !pts.length) return; queue = pts.slice(1); tx = pts[0].x; tz = pts[0].z; active = true; best = Infinity; since = 0; lastD = Infinity; },
    clear() { active = false; queue = []; },
    /** Trả hướng đi (độ dài ≤ 1) hoặc null nếu đã dừng. Gọi MỖI khung với vị trí hiện tại. */
    dir(p, dt) {
      if (!active) return null;
      for (;;) {
        const dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz);
        // sang mốc kế khi tới gần (≤ 0,3 m) hoặc đã đi lướt qua (đang xa dần mà còn < 0,9 m, vd. khung hình chậm bước dài)
        if (queue.length && (d <= 0.3 || (d < 0.9 && d > lastD + 1e-4))) { const n = queue.shift(); tx = n.x; tz = n.z; best = Infinity; since = 0; lastD = Infinity; continue; }
        lastD = d;
        if (!queue.length && d <= 0.35) { active = false; return null; }      // chỉ mốc CUỐI mới kết thúc việc đi
        if (d < best - 0.02) { best = d; since = 0; } else { since += dt; if (since > 0.8) { active = false; queue = []; return null; } }
        return { x: dx / d, z: dz / d, mag: queue.length ? 1 : Math.min(1, d / 1.2 + 0.3) };    // chậm dần khi gần tới đích
      }
    },
  };
}

/** Vị trí camera theo sau người p = {x,y,z}: nhìn vào điểm ngang vai, cách `dist`, nghiêng `pitch`. */
export function camPose(p, yaw, pitch, dist) {
  const look = { x: p.x, y: p.y + 1.1, z: p.z };   // nhìn vào đầu nhân vật chibi (cao ~1,5)
  const cp = Math.cos(pitch);
  return { look, pos: { x: look.x + Math.sin(yaw) * cp * dist, y: look.y + Math.sin(pitch) * dist, z: look.z + Math.cos(yaw) * cp * dist } };
}

/** Kéo chuột/ngón tay (dx, dy px) → đổi yaw/pitch camera (đã kẹp). */
export function dragCamera(yaw, pitch, dx, dy) {
  return { yaw: yaw - dx * 0.0055, pitch: clamp(pitch + dy * 0.004, CAM_PITCH.min, CAM_PITCH.max) };
}
export const zoomCamera = (dist, delta) => clamp(dist * Math.exp(delta * 0.0012), CAM_DIST.min, CAM_DIST.max);
