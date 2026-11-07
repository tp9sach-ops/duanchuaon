// Hình học + thời gian của cảnh câu cá 3D (Phiên 48, mục 1.2). LOGIC THUẦN (không three.js, có test: tests/fishingview.test.mjs).
// Cảnh (js/scene/fishing.js) chỉ đọc các hàm này rồi vẽ; mọi mốc thời gian lấy từ phiên câu `sess` của js/world/fishing.js (sess.t, tShadow, nibbles, tBite, tEnd).
import { FISH_WATERS, waterById } from './fishing.js';

/** Độ cao mặt nước để đặt vật nổi (mét). Chưa kiểm bằng mắt trên cảnh thật: chỉnh ở đây nếu cầu chìm / lơ lửng. */
export const WATER_Y = { hoca: 0.1, aosen: 0.06, hothac: 0.1 };
export const waterY = (id) => (WATER_Y[id] !== undefined ? WATER_Y[id] : 0.08);
/** Quả cầu bay từ tay người xuống nước trong chừng này giây (kể từ sess.t = 0). */
export const FLIGHT = 0.6;
/** Cầu rơi cách mép nước vào trong chừng này mét (tối đa 40% bán kính nước, để hồ nhỏ không rơi ra giữa). */
export const LAND_INSET = 2.6;

/** Điểm cầu rơi: nằm trên đường từ tâm nước ra phía người chơi, cách mép vào trong. Người đứng ngay tâm (cầu hồ cá) → thả về phía +x. Trả { x, z }. */
export function castTarget(player, water) {
  const w = typeof water === 'string' ? waterById(water) : water; if (!w || !player) return { x: 0, z: 0 };
  let dx = player.x - w.x, dz = player.z - w.z; const d = Math.hypot(dx, dz);
  if (d < 0.5) { dx = 1; dz = 0; } else { dx /= d; dz /= d; }
  const r = Math.max(0.5, w.r - Math.min(LAND_INSET, w.r * 0.4));
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

/** Bóng cá: hiện từ tShadow tới tBite. Trước lúc rỉa bơi vòng quanh cầu (bán kính 2,2 → 1,2); khi rỉa lao vào sát cầu. Trả null nếu không hiện, hoặc { ang, rad, alpha }. */
export function fishShadow(s) {
  if (!s || s.t < s.tShadow || s.t >= s.tBite) return null;
  const span = Math.max(0.01, s.tBite - s.tShadow), k = (s.t - s.tShadow) / span;
  const nib = s.nibbles && s.nibbles.length ? s.nibbles[0] : s.tBite, rad = s.t < nib ? 2.2 - 1.0 * ((s.t - s.tShadow) / Math.max(0.01, nib - s.tShadow)) : 0.5 + 0.3 * Math.sin(s.t * 11);
  return { ang: (s.t - s.tShadow) * 1.9, rad, alpha: Math.min(1, k * 4) * 0.55 };
}

/** Phao nhún: độ chìm (mét, âm = chìm) theo thời gian; mỗi lần rỉa (trong 0,35 giây) chìm thêm. */
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
