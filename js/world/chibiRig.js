// BỘ XƯƠNG nhân vật chibi (Phiên 99): logic THUẦN (không three.js, có test: tests/chibirig.test.mjs).
// Mô hình GLB ptg gửi (low_poly_chibi_base, chibi_base) là thân trần tư thế chữ T, KHÔNG có xương/hoạt ảnh → mã tự gắn xương:
//   hips (gốc) → spine (thân) → head (đầu), armL, armR (vai); hips → legL, legR (hông). Mọi tọa độ ở đây là TỈ LỆ theo chiều cao (0 = bàn chân, 1 = đỉnh đầu), x = ngang (+x = bên TRÁI người), mặt nhìn +z.
// Hai mô hình có cùng tỉ lệ nên dùng chung một bộ mốc (đo từ mặt cắt ngang của cả hai file).
import { clamp } from '../util.js';

export const CHIBI_H = 1.5;   // m, chiều cao sau chuẩn hóa (khớp nhân vật cũ ~1,5)
/** Mốc (tỉ lệ chiều cao). */
export const LM = { crotch: 0.22, shoulderY: 0.45, shoulderX: 0.1, neck: 0.515, legX: 0.045, waist: 0.255, shoe: 0.035, headCY: 0.765 };
export const BONES = ['hips', 'spine', 'head', 'armL', 'armR', 'legL', 'legR'];
export const B = Object.fromEntries(BONES.map((n, i) => [n, i]));

const sm = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };   // smoothstep, a > b cũng đúng (giảm dần)

/** Trọng số da cho một đỉnh tại (nx, ny) tỉ lệ. Trả { idx: [4 số], w: [4 số], tổng w = 1 } (xương không dùng: idx 0, w 0). */
export function skinOf(nx, ny) {
  const head = sm(0.5, 0.55, ny);
  const arm = ny < 0.53 ? sm(0.11, 0.18, Math.abs(nx)) * (1 - head) : 0;
  const leg = sm(0.24, 0.19, ny);
  const left = sm(-0.012, 0.012, nx);   // đỉnh sát giữa: chia đều hai chân, không rách
  const spine = Math.max(0, 1 - head - arm - leg);
  const pairs = [[B.head, head], [B.spine, spine], [nx >= 0 ? B.armL : B.armR, arm], [B.legL, leg * left], [B.legR, leg * (1 - left)]].filter(([, w]) => w > 1e-4).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const sum = pairs.reduce((s, [, w]) => s + w, 0) || 1;
  const idx = [0, 0, 0, 0], w = [0, 0, 0, 0];
  pairs.forEach(([i, ww], k) => { idx[k] = i; w[k] = ww / sum; });
  if (!pairs.length) { idx[0] = B.spine; w[0] = 1; }
  return { idx, w };
}

/** Vùng màu của một tam giác (tâm tại nx, ny): 'skin' | 'shirt' | 'sleeve' | 'pants' | 'shoe'. */
export function zoneOf(nx, ny) {
  const ax = Math.abs(nx);
  if (ny < LM.shoe) return 'shoe';
  if (ny < LM.waist) return 'pants';
  if (ny >= 0.52) return 'skin';
  if (ny >= 0.36 && ax > 0.115) return ax < 0.215 ? 'sleeve' : 'skin';
  return 'shirt';
}

/** Góc tay (rad) cho bone vai. Xương tay nằm ngang (T) lúc gắn; hạ xuống rồi nhấc về trước. side: +1 trái, −1 phải. fwd: nhấc về trước (0 = buông thẳng, π/2 = ngang, ~π = giơ thẳng lên); out: dạng ra ngoài (âm = khép vào, để chắp tay). */
export function armAngle(side, fwd, out) { return { x: -fwd, y: 0, z: side > 0 ? -Math.PI / 2 + out : Math.PI / 2 - out }; }

/** Tay theo trạng thái. own = p.armL/p.armR của poseFor. hold: đang khiêng vật trên đầu. */
export function armTarget(state, own, hold = false) {
  if (hold) return { fwd: 2.6, out: 0.28 };
  if (state === 'walk' || state === 'idle') return { fwd: 0.12 + own * 0.95, out: 0.14 };   // tay buông hai bên, đánh nhịp ngược chân
  return { fwd: 1.2 - own * 0.7, out: -0.38 };                                              // ngồi/gõ mõ/lạy: chắp tay trước ngực
}

/**
 * Toàn bộ tư thế xương một khung hình (số thuần, dễ test).
 * p = poseFor(...) đã làm mượt; state; clock (giây); speed (m/s); opt: { hold, swing: { arm, lean, vis } | null, act: { name, k } | null }
 * Trả { spine:{x,y,z}, head:{x}, armL:{x,y,z}, armR:{x,y,z}, legL:{x,y,z}, legR:{x,y,z}, hipsDrop }.
 */
export function chibiPose(p, state, clock, speed = 0, opt = {}) {
  const { hold = false, swing = null, act = null } = opt;
  const L = armTarget(state, p.armL, hold), R = armTarget(state, p.armR, hold);
  let lean = p.lean, aL = armAngle(1, L.fwd, L.out), aR = armAngle(-1, R.fwd, R.out);
  if (swing) {   // vung côn: tay phải nâng/chém, tay trái giữ thăng bằng
    const v = clamp(swing.vis * 2, 0, 1);
    aR = armAngle(-1, -swing.arm, 0.1);
    aL = armAngle(1, L.fwd * (1 - v) + 0.5 * v, L.out * (1 - v) + 0.2 * v);
    lean += swing.lean;
  }
  if (act) {     // động tác một lần (ném, nhặt): k = 0..1
    const k = clamp(act.k, 0, 1), e = Math.sin(Math.PI * k);
    if (act.name === 'throw') { const wind = k < 0.35 ? k / 0.35 : 1 - (k - 0.35) / 0.65; aR = armAngle(-1, k < 0.35 ? -0.6 * wind : 2.2 * Math.sin(Math.PI * Math.min(1, (k - 0.35) / 0.65)) + 0.1, 0.15); lean += k < 0.35 ? -0.2 * wind : 0.4 * Math.sin(Math.PI * (k - 0.35) / 0.65); }
    else if (act.name === 'grab') { lean += 0.7 * e; aL = armAngle(1, 0.9 + 0.8 * e, -0.1); aR = armAngle(-1, 0.9 + 0.8 * e, -0.1); }
  }
  const ph = clock * (5 + 4 * clamp(speed / 2.2, 0.25, 1.15)), walking = state === 'walk';
  const sit = p.sit;
  const legL = { x: -p.legL * 1.15 - 1.5 * sit, y: 0, z: 0.3 * sit }, legR = { x: -p.legR * 1.15 - 1.5 * sit, y: 0, z: -0.3 * sit };
  return {
    spine: { x: lean, y: walking ? Math.sin(ph) * 0.08 : 0, z: walking ? Math.sin(ph) * 0.05 : 0 },
    head: { x: p.head - (walking ? 0 : 0) },
    armL: aL, armR: aR, legL, legR,
    hipsDrop: 0.25 * sit,
  };
}
