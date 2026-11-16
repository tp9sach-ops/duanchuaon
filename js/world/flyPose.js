// Tư thế BAY LƯỚT riêng (Phiên 204, mục 1 danh sách ptg 16/11): "chân trái co, chân phải dũi (đạp gió), đầu chúi, ngã người lao tới trước".
// LOGIC THUẦN (không three.js), có test: tests/flypose.test.mjs. Tư thế nền (glide) nằm ở avatarLogic.poseFor + chibiRig.chibiPose; ở đây chỉ có CÚ ĐẠP GIÓ
// (động tác một lần 'dapgio', mỗi lần bấm Nhảy giữa không trung): chân phải co gối lên lấy đà rồi đạp thẳng ra sau, thân chúi thêm một nhịp.
// Nối: js/world/avatarChibi.js (act('dapgio') + kickPose sau applyCast). Mọi số là QUY ƯỚC TẠM, chờ ptg nhìn rồi chỉnh.
import { clamp } from '../util.js';
import { FLY_CFG } from './glide.js';

export const KICK_S = FLY_CFG.kickDur;   // giây của một cú đạp

const sm = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };   // smoothstep

/** Hai nhịp của cú đạp theo tiến độ k (0..1): wind = co gối lên lấy đà (0→1→0 trong 0..0,38), push = đạp thẳng ra sau (0,28..0,62 lên đỉnh rồi buông dần). */
export function kickPhase(k) {
  const x = clamp(Number.isFinite(+k) ? +k : 0, 0, 1);
  return { wind: sm(0, 0.3, x) * (1 - sm(0.3, 0.4, x)), push: sm(0.28, 0.46, x) * (1 - sm(0.62, 1, x)) };
}

/** Áp cú đạp gió lên bộ góc xương q (từ chibiPose). act = { name, k } hoặc null; không phải 'dapgio' → trả q nguyên. Không sửa q gốc. */
export function kickPose(q, act) {
  if (!q || !act || act.name !== 'dapgio') return q;
  const { wind, push } = kickPhase(act.k);
  const legR = { ...q.legR, x: q.legR.x + (-1.45 - q.legR.x) * wind + 0.28 * push }, shinR = { ...q.shinR, x: q.shinR.x + (1.9 - q.shinR.x) * wind - q.shinR.x * 0.8 * push };
  const legL = { ...q.legL, x: q.legL.x - 0.22 * push }, armL = q.armL && Number.isFinite(q.armL.x) ? { ...q.armL, x: q.armL.x - 0.25 * push } : q.armL;
  return { ...q, legR, shinR, legL, armL, spine: { ...q.spine, x: q.spine.x + 0.16 * push } };
}
