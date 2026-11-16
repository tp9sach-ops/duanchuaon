// Phiên 206 (mục 2, phần còn thiếu): ĐÁNH THƯỜNG ở KHU LUYỆN TẬP = LAO TỚI + CHUỖI 3 ĐÒN (đòn 3 lan) — dùng lại luật của quái bãi rừng (basicCombo.js). LOGIC THUẦN (không DOM, không đọc đồng hồ), có test: tests/luyenbasic.test.mjs.
//  • planBasic: bấm Đánh thường thì làm gì — 'hit' (mộc nhân trong tầm: ra đòn) | 'dash' (xa tầm nhưng trong tầm lao: LAO tới, chưa ra đòn) | 'air' (quá xa / không có mộc nhân: vung không khí, không chạm gì). Thương (kind 'thuong') không lao: trong tầm thì chạm, ngoài tầm thì vung không khí.
//  • hitsFor: những mộc nhân nháy theo đòn thứ `step` — đòn 3 (xoay 360°) nháy thêm mọi mộc nhân quanh người (bán kính BASIC.splashR). Mộc nhân KHÔNG có sát thương thật; `mul` chỉ để hiển thị.
import { planTap, splashTargets, stepMul, BASIC } from './basicCombo.js';
import { rushTarget } from './autoHunt.js';

export const DUMMY_BODY = 0.6;   // m: bán kính thân mộc nhân (cọc gỗ)
export const REACH = 4.5;        // m: tâm mộc nhân cách người chơi ≤ ngần này là chạm đòn (giữ như trước Phiên 206)
const num = (x, d = 0) => (Number.isFinite(+x) ? +x : d);

/** Mộc nhân gần nhất: { i (chỉ số), d (mộc nhân), dist (m, tới TÂM) } hoặc null. */
export function nearestOf(p, dummies) {
  if (!p || !Array.isArray(dummies)) return null;
  const px = num(p.x, NaN), pz = num(p.z, NaN); if (!Number.isFinite(px) || !Number.isFinite(pz)) return null;
  let best = null;
  dummies.forEach((d, i) => { if (!d) return; const dist = Math.hypot(num(d.x, 1e9) - px, num(d.z, 1e9) - pz); if (!best || dist < best.dist) best = { i, d, dist }; });
  return best;
}

/** Kế hoạch cho một lần bấm. Trả { plan: 'hit'|'dash'|'air', near, dash } — dash = { x, z, dist } (điểm đứng để lao tới) chỉ khi plan = 'dash'. */
export function planBasic({ p, dummies, kind = 'da', reach = REACH, body = DUMMY_BODY } = {}) {
  const near = nearestOf(p, dummies);
  if (!near) return { plan: 'air', near: null, dash: null };
  if (kind === 'thuong') return { plan: near.dist <= reach ? 'hit' : 'air', near, dash: null };
  const plan = planTap({ has: true, gap: near.dist, body, melee: reach - body });
  if (plan === 'dash') { const dash = rushTarget(p, near.d, { body, stand: 2.2 }); return dash ? { plan: 'dash', near, dash } : { plan: 'air', near, dash: null }; }
  return { plan: plan === 'hit' ? 'hit' : 'air', near, dash: null };
}

/** Mộc nhân dính đòn `step` (1..3): { idx: [chỉ số...] (mục tiêu chính đứng đầu), mul (hệ số đòn) }. Chỉ Đánh thường ('da') có đòn 3 lan; Thương chỉ chạm mục tiêu chính. */
export function hitsFor({ p, dummies, near, kind = 'da', step = 1, body = DUMMY_BODY } = {}) {
  if (!near || !Array.isArray(dummies)) return { idx: [], mul: 1 };
  const idx = [near.i];
  if (kind === 'da' && Math.floor(num(step)) === BASIC.steps) {
    const mons = dummies.map((d, i) => ({ uid: i, x: d && d.x, z: d && d.z }));
    for (const m of splashTargets(p, mons, BASIC.splashR, near.i, () => body)) idx.push(m.uid);
  }
  return { idx, mul: kind === 'da' ? stepMul(step) : 1 };
}
