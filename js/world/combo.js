// TƯ THẾ CHIẾN ĐẤU theo clip mẫu (Phiên 119): logic THUẦN (không three.js), có test: tests/combo.test.mjs.
//  • Đòn đánh thường nối thành CHUỖI 4 đòn (Phiên 126): MÚA côn trước người (xoay như chong chóng), chém ngang trái→phải, chém ngang phải→trái, xoay người 360° (đòn cuối, côn xoay theo).
//  • Skill "Chém khí" (conKhi): nhún lấy đà, giơ côn thật cao rồi bổ xuống, lao người tới trước.
//  • THẾ SẴN SÀNG (stance): khi đang giao chiến, đứng hơi khom, một chân trước một chân sau, gối gập, tay cầm côn đưa trước thấp, tay kia thủ; chạy thì người nghiêng tới trước, tay côn giữ vững.
// avatarChibi.js dùng comboPose / nextKind / applyStance; js/ui/combatPose.js dùng SLASH (vệt chém) cho js/scene/slashFx.js.
import { LM, LIMB, CHIBI_H, armAngle, elbowAngle, wristAngle, kneeAngle } from './chibiRig.js';
import { SWING_S, RELEASE_S } from './conKhi.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const mix = (a, b, k) => a + (b - a) * k;
const mixV = (a, b, k) => ({ x: mix(a.x, b.x, k), y: mix(a.y, b.y, k), z: mix(a.z, b.z, k) });
const EASE = { io: (k) => k * k * (3 - 2 * k), o: (k) => 1 - (1 - k) * (1 - k), i: (k) => k * k, l: (k) => k };

/** Mỗi mốc: [giây, arm (rad, âm = giơ lên; −1,57 = ngang), lean, yaw (xoay thân quanh trục đứng; + = sang trái), lunge (m, lao tới trước), kiểu nội suy của đoạn KẾT THÚC ở mốc này, spin (rad, côn xoay quanh bàn tay trong mặt phẳng dọc trước người; bỏ trống = 0; mốc cuối phải là bội của 2π)]. */
const swingEnd = Math.max(SWING_S, RELEASE_S + 0.1);
export const KINDS = {
  mua: { hit: 0.24, keys: [[0, -1.2, 0, 0, 0, '', 0], [0.08, -1.5, -0.1, 0.3, 0, 'o', 0], [0.40, -1.5, 0.1, -0.3, 0.15, 'io', 2 * TAU], [0.52, -1.45, 0.1, 0, 0.1, 'o', 2 * TAU], [0.80, -1.2, 0, 0, 0, 'io', 2 * TAU]] },
  ngang: { hit: 0.2, keys: [[0, -1.2, 0, 0, 0], [0.09, -2.05, -0.12, 0.95, 0, 'o'], [0.30, -1.45, 0.26, -1.0, 0.12, 'io'], [0.46, -1.4, 0.24, -1.05, 0.14, 'o'], [0.74, -1.2, 0, 0, 0, 'io']] },
  nguoc: { hit: 0.2, keys: [[0, -1.2, 0, 0, 0], [0.09, -1.0, 0, -0.95, 0, 'o'], [0.30, -1.95, 0.12, 1.05, 0.12, 'io'], [0.46, -1.9, 0.1, 1.05, 0.14, 'o'], [0.74, -1.2, 0, 0, 0, 'io']] },
  xoay: { hit: 0.34, keys: [[0, -1.2, 0, 0, 0, '', 0], [0.12, -1.55, -0.2, -0.6, 0, 'o', 0], [0.58, -1.5, 0.18, TAU - 0.4, 0.18, 'io', 2 * TAU], [0.80, -1.45, 0.15, TAU - 0.2, 0.1, 'o', 2 * TAU], [1.1, -1.2, 0, TAU, 0, 'io', 2 * TAU]] },
  khi: { hit: RELEASE_S, keys: [[0, -1.2, 0, 0, 0], [RELEASE_S * 0.65, -2.85, -0.3, 0, -0.05, 'o'], [RELEASE_S, -0.45, 0.55, 0, 0.2, 'i'], [swingEnd, -0.6, 0.45, 0, 0.14, 'o'], [swingEnd + 0.35, -1.2, 0, 0, 0, 'io']] },
};
export const CHAIN = ['mua', 'ngang', 'nguoc', 'xoay'];
export const CHAIN_GAP = 0.6;   // giây (sau khi đòn trước xong) còn nối được đòn kế tiếp

/** Đòn kế tiếp trong chuỗi: prev = đòn vừa đánh ('' nếu chưa), gap = số giây từ lúc đòn đó kết thúc (âm = còn đang vung). Quá hạn hoặc vừa xong đòn cuối → quay về đòn đầu. */
export function nextKind(prev, gap) {
  const i = CHAIN.indexOf(prev);
  return i >= 0 && i < CHAIN.length - 1 && gap <= CHAIN_GAP ? CHAIN[i + 1] : CHAIN[0];
}
/** Tổng thời gian hoạt ảnh (giây) của một kiểu đòn. Tên lạ → 0. */
export function comboEnd(kind) { const d = KINDS[kind]; return d ? d.keys[d.keys.length - 1][0] : 0; }
/** Thời điểm đòn "trúng" (giây từ lúc bắt đầu). */
export function hitAt(kind) { const d = KINDS[kind]; return d ? d.hit : 0; }

/** Tư thế tại giây t: { arm, lean, vis, yaw, lunge, spin } — arm/lean/vis cùng kiểu swingPose cũ (chibiPose đọc), yaw/lunge/spin là phần mới (avatarChibi áp lên thân và côn). Tên lạ → null. */
export function comboPose(kind, t) {
  const d = KINDS[kind]; if (!d) return null;
  const ks = d.keys, end = ks[ks.length - 1][0], tt = clamp(+t || 0, 0, end);
  let i = 1; while (i < ks.length - 1 && tt > ks[i][0]) i++;
  const a = ks[i - 1], b = ks[i], k = EASE[b[5] || 'io']((tt - a[0]) / Math.max(1e-6, b[0] - a[0]));
  return { arm: mix(a[1], b[1], k), lean: mix(a[2], b[2], k), yaw: mix(a[3], b[3], k), lunge: mix(a[4], b[4], k), spin: mix(a[6] || 0, b[6] || 0, k), vis: clamp((end - tt) / 0.12, 0, 1) };
}

/** Vệt chém vẽ trên cảnh (js/scene/slashFx.js): a→b = khoảng giây vệt quét; arc = góc cung (rad); reach = tầm (m); side +1 quét trái→phải; tilt = độ nghiêng (rad); tint = màu. Skill 'khi' đã có luồng khí riêng nên không có vệt; 'mua' (múa côn) quay trong mặt phẳng dọc nên không có vệt ngang. */
export const SLASH = {
  ngang: { a: 0.09, b: 0.32, arc: 2.3, reach: 3.4, side: 1, tilt: -0.35, tint: 0xdff4ff },
  nguoc: { a: 0.09, b: 0.32, arc: 2.5, reach: 3.5, side: -1, tilt: 0.45, tint: 0xffeab0 },
  xoay: { a: 0.12, b: 0.6, arc: TAU, reach: 4.2, side: 1, tilt: 0.12, tint: 0xfff2c0 },
};

/** Côn/thương có hiện trên tay không (Phiên 120): đang vung (vis > 0,3) HOẶC đang ở thế chiến đấu (stance > 0,3) → cầm sẵn trên tay phải, không chỉ hiện lúc vung. */
export const weaponVisible = (stance, swingVis = 0) => (+swingVis || 0) > 0.3 || (+stance || 0) > 0.3;

const reachOf = (leg, knee) => LIMB.ankleH + LIMB.thigh * Math.cos(-leg.x) + LIMB.shin * Math.cos(-leg.x - knee);
const flatFoot = (leg, shin) => { const d = -leg.x - shin.x; return { x: clamp(d < 0 ? d * 0.55 : d, -0.6, 0.6), y: 0, z: 0 }; };

/**
 * Thế sẵn sàng chiến đấu (s: 0..1) đè lên kết quả chibiPose q (không sửa q, trả bản mới).
 * o: { walk 0..1, sit 0..1, busy (đang vung/ném/nhặt → giữ nguyên tay), hold (đang khiêng → giữ nguyên tay) }.
 * Đứng yên: khom người, chân trái trước chân phải sau, gối gập, hông hạ (tính lại để chân không lún đất). Đi/chạy: nghiêng tới trước, tay cầm côn đưa trước và giữ vững.
 */
export function applyStance(q, s, o = {}) {
  const sit = clamp(o.sit || 0, 0, 1), w = clamp(o.walk || 0, 0, 1), k = clamp(+s || 0, 0, 1) * (1 - sit);
  if (!(k > 0.001)) return q;
  const st = k * (1 - w), out = { ...q };
  out.spine = { ...q.spine, x: q.spine.x + 0.2 * k };
  if (!o.busy && !o.hold) {   // tay phải cầm côn đưa trước; chạy nghiêng người thì nâng tay thêm (0,8 × độ nghiêng) để mũi côn vẫn chếch lên
    out.armR = mixV(q.armR, armAngle(-1, 0.85 + 0.8 * Math.max(0, q.spine.x - 0.1), 0.22), k); out.foreR = mixV(q.foreR, elbowAngle(-1, 1.15, 0), k); out.handR = mixV(q.handR, wristAngle(-1, 1.15), k);
    out.armL = mixV(q.armL, armAngle(1, 0.55, 0.25), st); out.foreL = mixV(q.foreL, elbowAngle(1, 1.0, 0.1), k);
  }
  const legL = { ...q.legL, x: q.legL.x - 0.45 * st, z: q.legL.z + 0.16 * st }, legR = { ...q.legR, x: q.legR.x + 0.4 * st, z: q.legR.z - 0.16 * st };
  const shinL = kneeAngle(q.shinL.x + 0.8 * st, q.shinL.z), shinR = kneeAngle(q.shinR.x + 0.7 * st, q.shinR.z);
  out.legL = legL; out.legR = legR; out.shinL = shinL; out.shinR = shinR;
  out.footL = mixV(q.footL, flatFoot(legL, shinL), st); out.footR = mixV(q.footR, flatFoot(legR, shinR), st);
  const drop = clamp(LM.crotch * CHIBI_H - Math.max(reachOf(legL, shinL.x), reachOf(legR, shinR.x)), 0, 0.16) * st;
  out.hipsDrop = Math.max(q.hipsDrop, drop);
  return out;
}
