// THU CÁ (Phiên 128, theo clip mẫu nhưng KHÔNG cần câu): quả cầu được NÉM BẰNG TAY (động tác 'throw' có sẵn của chibiRig),
// cá dính thì bay lên, nhân vật GIƠ CÁ bằng hai tay ('show'). Logic THUẦN, có test: tests/fishpose.test.mjs.
// avatarChibi.js gọi showPose(q, act) SAU chibiPose/applyStance (giống combo.js); không sửa chibiRig.js.
import { armAngle, elbowAngle, wristAngle } from './chibiRig.js';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const mixV = (a, b, k) => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, z: a.z + (b.z - a.z) * k });
const ease = (k) => k * k * (3 - 2 * k);

/** Thời lượng động tác giơ cá (giây). */
export const SHOW_S = 1.6;
/** Mốc (giây) trong động tác 'throw' (0,55 s) lúc quả cầu rời tay: tay hất tới trước. */
export const THROW_RELEASE = 0.3;

/** Mức nâng cá 0..1 theo k = 0..1 (nâng 0→0.25, giữ, hạ 0.85→1). */
export const showLift = (k) => { const t = clamp(+k || 0, 0, 1); return t < 0.25 ? ease(t / 0.25) : t < 0.85 ? 1 : ease((1 - t) / 0.15); };

/** Áp tư thế GIƠ CÁ lên kết quả chibiPose `q` (không sửa q). act = { name, k } | null; khác 'show' → trả nguyên q. */
export function showPose(q, act) {
  if (!act || act.name !== 'show') return q;
  const lift = showLift(act.k), arm = (s) => armAngle(s, 1.15 + 0.2 * lift, 0.12), fore = (s) => elbowAngle(s, 0.95 - 0.15 * lift, 0.18);
  return {
    ...q,
    armR: mixV(q.armR, arm(-1), 1), armL: mixV(q.armL, arm(1), 1),
    foreR: mixV(q.foreR, fore(-1), 1), foreL: mixV(q.foreL, fore(1), 1),
    handR: mixV(q.handR, wristAngle(-1, 0.9), 1), handL: mixV(q.handL, wristAngle(1, 0.9), 1),
    spine: { ...q.spine, x: q.spine.x - 0.06 * lift },
  };
}

/** Điểm quả cầu rời tay (hệ thế giới): người ở pos {x,y,z} quay mặt ry (nhìn +z khi ry = 0). */
export function handTip(pos, ry) {
  const f = Number.isFinite(ry) ? ry : 0, p = pos || { x: 0, y: 0, z: 0 };
  return { x: p.x + Math.sin(f) * 0.55, y: (p.y || 0) + 1.25, z: p.z + Math.cos(f) * 0.55 };
}
