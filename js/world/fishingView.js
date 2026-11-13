// Hình học + thời gian của cảnh câu cá 3D (Phiên 48, mục 1.2). LOGIC THUẦN (không three.js, có test: tests/fishingview.test.mjs).
// Cảnh (js/scene/fishing.js) chỉ đọc các hàm này rồi vẽ; mọi mốc thời gian lấy từ phiên câu `sess` của js/world/fishing.js (sess.t, tShadow, nibbles, tBite, tEnd).
import { FISH_WATERS, waterById } from './fishing.js';

/** Độ cao mặt nước để đặt vật nổi (mét). Chưa kiểm bằng mắt trên cảnh thật: chỉnh ở đây nếu cầu chìm / lơ lửng. */
export const WATER_Y = { hoca: 0.1, aosen: 0.06, hothac: 0.1, suoitrong: 0.15 };
export const waterY = (id) => (WATER_Y[id] !== undefined ? WATER_Y[id] : 0.08);
/** Quả cầu bay từ tay người xuống nước trong chừng này giây (kể từ sess.t = 0). */
export const FLIGHT = 0.6;
/** Cầu rơi cách mép nước vào trong chừng này mét (tối đa 40% bán kính nước, để hồ nhỏ không rơi ra giữa). */
export const LAND_INSET = 2.6;

/** Tầm ném về phía trước mặt (m). */
export const THROW_AHEAD = 4.2;
/** Điểm cầu rơi. Có `ry` (hướng nhìn của nhân vật, nhìn +z khi ry = 0): ném THẢNG TRƯỚC MẶT — điểm cách người THROW_AHEAD mét theo hướng nhìn,
 *  nếu ra ngoài mặt nước thì kéo vào mép trong của nước (vẫn cùng phía trước mặt). Không có `ry`: kiểu cũ — trên đường từ tâm nước ra phía người chơi. Trả { x, z }. */
export function castTarget(player, water, ry) {
  const w = typeof water === 'string' ? waterById(water) : water; if (!w || !player) return { x: 0, z: 0 };
  const r = Math.max(0.5, w.r - Math.min(LAND_INSET, w.r * 0.4));
  if (Number.isFinite(ry)) {
    const ax = player.x + Math.sin(ry) * THROW_AHEAD, az = player.z + Math.cos(ry) * THROW_AHEAD;
    let dx = ax - w.x, dz = az - w.z; const d = Math.hypot(dx, dz);
    if (d <= r) return { x: ax, z: az };
    return { x: w.x + (dx / d) * r, z: w.z + (dz / d) * r };
  }
  let dx = player.x - w.x, dz = player.z - w.z; const d = Math.hypot(dx, dz);
  if (d < 0.5) { dx = 1; dz = 0; } else { dx /= d; dz /= d; }
  return { x: w.x + dx * r, z: w.z + dz * r };
}

/** Quỹ đạo cầu bay: p = 0..1 → { x, y, z } (đường vòng cung, cao nhất giữa đường). from = {x,y,z} tay người, to = {x,z}, yEnd = mặt nước. */
export function flightPoint(p, from, to, yEnd, peak = 1.6) {
  const k = Math.max(0, Math.min(1, p));
  return { x: from.x + (to.x - from.x) * k, z: from.z + (to.z - from.z) * k, y: from.y + (yEnd - from.y) * k + Math.sin(Math.PI * k) * peak };
}

/** Tiến độ gợn sóng (0..1) cho một vòng sóng bắt đầu lúc t0 kéo dài dur giây; trước t0 hoặc sau khi hết trả -1 (không vẽ). */
export function rippleAt(t, t0, dur = 1.1) { const k = (t - t0) / dur; return k < 0 || k > 1 ? -1 : k; }

/** Các mốc sóng của một phiên: nước bắn lúc cầu chạm (FLIGHT), mỗi lần cá rỉa (nibbles). */
export const rippleTimes = (s) => [FLIGHT, ...(s && Array.isArray(s.nibbles) ? s.nibbles : [])];

/** Bóng cá: hiện từ tShadow tới tBite. Bơi vào, lao chạm cầu mỗi lần rỉa rồi lùi ra (xem chú thích trong hàm). Trả null nếu không hiện, hoặc { ang, rad, alpha, face, yaw }. */
export function fishShadow(s) {
  // Phiên 128 (theo clip mẫu): bóng cá bơi THẲNG tới gần cầu, LAO VÀO chạm cầu (cầu nhún) rồi lùi ra, lặp lại mỗi lần rỉa (s.nibbles), rồi dí sát cầu lúc cắn.
  // Không còn lượn vòng quanh cầu. ang = hướng từ cầu ra phía cá (trôi chậm); rad = khoảng cách tới cầu (≥ 0,28); face = +1 đầu cá quay RA XA cầu, −1 quay VỀ phía cầu; yaw = rung đầu khi rỉa.
  if (!s || s.t < s.tShadow || s.t >= s.tBite) return null;
  const t = s.t, nibs = s.nibbles && s.nibbles.length ? s.nibbles : [s.tBite], OUT = 0.95, NEAR = 0.28, FAR = 2.6;
  const ease = (k) => k * k * (3 - 2 * k), cl = (k) => Math.max(0, Math.min(1, k));
  const approach = cl((t - s.tShadow) / Math.max(0.01, nibs[0] - 0.5 - s.tShadow)), base = FAR - (FAR - OUT) * ease(approach);
  let pull = 0, back = false;
  for (const n of nibs) {
    const d = t - n, b = d < 0 ? ease(cl(1 + d / 0.5)) : ease(cl(1 - d / 0.7));
    if (b > pull) { pull = b; back = d > 0.08; }
  }
  const bite = ease(cl((t - (s.tBite - 0.4)) / 0.4)); if (bite > pull) { pull = bite; back = false; }
  const rad = base - (base - NEAR) * pull, k = (t - s.tShadow) / Math.max(0.01, s.tBite - s.tShadow);
  return { ang: 0.7 + 0.3 * Math.sin(t * 0.9), rad, alpha: Math.min(1, k * 6) * 0.78, face: back ? 1 : -1, yaw: rad < 0.6 ? 0.28 * Math.sin(t * 9) : 0.08 * Math.sin(t * 2.2) };
}
export function bobY(s) {
  if (!s) return 0; let y = Math.sin(s.t * 3.2) * 0.015;
  for (const n of s.nibbles || []) { const d = s.t - n; if (d >= 0 && d < 0.35) y -= Math.sin((d / 0.35) * Math.PI) * 0.12; }
  return y;
}

/** Hoa sen nở: 0 khi chưa tới cửa sổ, tăng nhanh lên 1 trong 0,15 giây đầu của phase 'lotus'; hết cửa sổ thì 0. */
export function lotusBloom(s) {
  if (!s || s.t < s.tBite || s.t >= s.tEnd) return 0;
  return Math.min(1, (s.t - s.tBite) / 0.15);
}

/** Màu quả cầu theo loại (hex) để dễ nhận ra cầu nào đang thả. */
export const ORB_COLOR = { go: 0xb07a43, da: 0x7f93a3, ngoc: 0x3fbf8f, luuly: 0x4a7dff, kim: 0xffc94a };
export const orbColor = (id) => ORB_COLOR[id] || 0xdddddd;

/** Mốc nhận biết một phiên mới (để cảnh đặt lại): các tham số cố định lúc quăng. */
export const sessionKey = (s) => (s ? `${s.water}|${s.orb}|${s.tBite.toFixed(3)}|${s.tEnd.toFixed(3)}` : '');

export { FISH_WATERS };
