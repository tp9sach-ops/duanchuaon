// BỘ XƯƠNG nhân vật chibi: logic THUẦN (không three.js, có test: tests/chibirig.test.mjs).
// Mô hình GLB ptg gửi (low_poly_chibi_base, chibi_base) là thân trần tư thế chữ T, KHÔNG có xương/hoạt ảnh → mã tự gắn xương.
// Phiên 99: 7 xương (hips, spine, head, armL/R, legL/R). PHIÊN KHỚP (bản này): thêm KHUỶU TAY, CỔ TAY, GỐI, CỔ CHÂN → 15 xương:
//   hips (gốc) → spine → head
//                      → armL/R (VAI, xoay cả cánh tay) → foreL/R (KHUỶU, gập cẳng tay) → handL/R (CỔ TAY, bàn tay)
//             → legL/R (HÔNG, xoay cả chân)             → shinL/R (GỐI, gập cẳng chân)  → footL/R (CỔ CHÂN, bàn chân)
// Mọi tọa độ ở đây là TỈ LỆ theo chiều cao (0 = bàn chân, 1 = đỉnh đầu), x = ngang (+x = bên TRÁI người), mặt nhìn +z.
// Thứ tự 7 xương đầu GIỮ NGUYÊN (chỉ số 0..6) để mã/ test cũ vẫn đúng; xương mới nối đuôi (chỉ số 7..14).
// Hai mô hình có cùng tỉ lệ nên dùng chung một bộ mốc (đo từ mặt cắt ngang của cả hai file; khuỷu/cổ tay/gối đo lại ở bản này: tay dài |x| 0,10 → 0,352; chân cao 0 → 0,22).
import { clamp } from '../util.js';

export const CHIBI_H = 1.5;   // m, chiều cao sau chuẩn hóa (khớp nhân vật cũ ~1,5)
/** Mốc (tỉ lệ chiều cao). elbowX/wristX/handEndX: vị trí dọc cánh tay (|x|); knee/ankle: độ cao của gối/cổ chân. */
export const LM = { crotch: 0.22, shoulderY: 0.45, shoulderX: 0.1, neck: 0.515, legX: 0.068, waist: 0.255, shoe: 0.035, headCY: 0.765, elbowX: 0.225, wristX: 0.30, handEndX: 0.352, knee: 0.12, ankle: 0.04 };
/** Độ dài từng đoạn chi (m). */
export const LIMB = {
  upperArm: (LM.elbowX - LM.shoulderX) * CHIBI_H, forearm: (LM.wristX - LM.elbowX) * CHIBI_H, hand: (LM.handEndX - LM.wristX) * CHIBI_H,
  thigh: (LM.crotch - LM.knee) * CHIBI_H, shin: (LM.knee - LM.ankle) * CHIBI_H, ankleH: LM.ankle * CHIBI_H,
};
/** Giới hạn gập (rad): khuỷu tay và gối chỉ gập MỘT chiều, không ưỡn ngược. */
export const ELBOW_MAX = 2.6, KNEE_MAX = 2.4;
export const BONES = ['hips', 'spine', 'head', 'armL', 'armR', 'legL', 'legR', 'foreL', 'foreR', 'handL', 'handR', 'shinL', 'shinR', 'footL', 'footR'];
export const B = Object.fromEntries(BONES.map((n, i) => [n, i]));

const sm = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };   // smoothstep, a > b cũng đúng (giảm dần)
const up = (c, w, v) => sm(c - w, c + w, v);   // 0 dưới (c − w) → 1 trên (c + w): chỗ chuyển mượt quanh một khớp

/** Trọng số da cho một đỉnh tại (nx, ny) tỉ lệ. Trả { idx: [4 số], w: [4 số], tổng w = 1 } (xương không dùng: idx 0, w 0).
 *  Tay chia ba đoạn quanh khuỷu (±0,02) và cổ tay (±0,015); chân chia ba đoạn quanh gối (±0,02) và cổ chân (±0,012) → chỗ gập mềm, không rách. */
export function skinOf(nx, ny) {
  const ax = Math.abs(nx), side = nx >= 0;
  const head = sm(0.5, 0.55, ny);
  const arm = ny < 0.53 ? sm(0.11, 0.18, ax) * (1 - head) : 0;
  const leg = sm(0.24, 0.19, ny);
  const left = sm(-0.012, 0.012, nx);   // đỉnh sát giữa: chia đều hai chân, không rách
  const spine = Math.max(0, 1 - head - arm - leg);
  // tay: vai → khuỷu → cổ tay
  const toFore = up(LM.elbowX, 0.02, ax), toHand = up(LM.wristX, 0.015, ax);
  const aUp = arm * (1 - toFore), aFore = arm * toFore * (1 - toHand), aHand = arm * toHand;
  // chân: hông → gối → cổ chân
  const thighW = up(LM.knee, 0.02, ny), low = 1 - thighW, toFoot = 1 - up(LM.ankle, 0.012, ny);
  const lThigh = leg * thighW, lShin = leg * low * (1 - toFoot), lFoot = leg * low * toFoot;
  const pairs = [
    [B.head, head], [B.spine, spine],
    [side ? B.armL : B.armR, aUp], [side ? B.foreL : B.foreR, aFore], [side ? B.handL : B.handR, aHand],
    [B.legL, lThigh * left], [B.legR, lThigh * (1 - left)], [B.shinL, lShin * left], [B.shinR, lShin * (1 - left)], [B.footL, lFoot * left], [B.footR, lFoot * (1 - left)],
  ].filter(([, w]) => w > 1e-4).sort((a, b) => b[1] - a[1]).slice(0, 4);
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

// ───────────────────────── GÓC TỪNG KHỚP ─────────────────────────
// Quy ước xoay (three.js Euler 'XYZ' = Rx·Ry·Rz, vector chịu Rz trước, Rx sau cùng).

/** Góc VAI (rad) cho xương cánh tay trên. Xương tay nằm ngang (T) lúc gắn; hạ xuống rồi nhấc về trước. side: +1 trái, −1 phải. fwd: nhấc về trước (0 = buông thẳng, π/2 = ngang, ~π = giơ thẳng lên); out: dạng ra ngoài (âm = khép vào, để chắp tay). */
export function armAngle(side, fwd, out) { return { x: -fwd, y: 0, z: side > 0 ? -Math.PI / 2 + out : Math.PI / 2 - out }; }

/** Góc KHUỶU (rad) cho xương cẳng tay. flex ≥ 0: gập cẳng tay lên phía trước (0 = duỗi thẳng, ~1,5 = vuông góc, ELBOW_MAX = gập hết cỡ); adduct: kéo cẳng tay khép vào trong (để hai bàn tay chụm lại giữa ngực). Hai bên đối xứng gương. */
export function elbowAngle(side, flex, adduct = 0) {
  const f = clamp(flex, 0, ELBOW_MAX);
  return { x: 0, y: side > 0 ? -f : f, z: side > 0 ? -adduct : adduct };
}

/** Góc CỔ TAY: bàn tay cụp nhẹ theo chiều gập của khuỷu (thả lỏng, không cứng đơ). */
export function wristAngle(side, elbowFlex) { const c = 0.18 * clamp(elbowFlex, 0, ELBOW_MAX); return { x: 0, y: side > 0 ? -c : c, z: 0 }; }

/** Góc GỐI (rad) cho xương cẳng chân: gập ra SAU (flex ≥ 0, tối đa KNEE_MAX), không ưỡn ngược. yaw: xoay cẳng chân sang ngang (ngồi xếp bằng: bàn chân thu vào giữa; âm = vào trong với chân trái). */
export function kneeAngle(flex, yaw = 0) { return { x: clamp(flex, 0, KNEE_MAX), y: 0, z: yaw }; }

/** Tay theo trạng thái. own = p.armL/p.armR của poseFor. hold: đang khiêng vật trên đầu.
 *  Trả { fwd, out } (vai) + { flex, adduct } (khuỷu). Chắp tay: cánh tay trên rủ chếch trước, cẳng tay gập lên, hai bàn tay chụm giữa ngực (kiểm bằng limbPoints trong test). */
export function armTarget(state, own, hold = false) {
  if (hold) return { fwd: 2.6, out: 0.28, flex: 0.5, adduct: 0.1 };
  if (state === 'walk' || state === 'idle') return { fwd: 0.12 + own * 0.95, out: 0.14, flex: 0.2 + 0.9 * Math.max(0, own), adduct: 0 };   // buông hai bên, đánh nhịp ngược chân; tay đưa ra trước thì khuỷu gập thêm (như người đi thật)
  if (state === 'bow') { const u = clamp((-own - 0.4) / 0.7, 0, 1); return { fwd: 0.6 + 0.7 * u, out: -0.35, flex: 1.1 - 0.65 * u, adduct: 0.35 - 0.15 * u }; }   // lạy: chắp tay trước ngực rồi duỗi dần về phía trước khi cúi
  if (state === 'beads') return { fwd: 0.52 - own * 0.6, out: -0.35, flex: 1.05, adduct: 0.2 };                                                     // lần hạt: hai tay trước ngực, hơi tách để vướng chuỗi
  if (state === 'mo') return { fwd: 0.52 - own * 0.6, out: -0.35, flex: 1.05 - (own + 0.55) * 0.6, adduct: 0.3 };                                    // gõ mõ: tay giơ lên thì khuỷu gập, vung xuống thì duỗi bớt
  return { fwd: 0.52 - own * 0.6, out: -0.35, flex: 1.05, adduct: 0.35 };                                                                            // ngồi chắp tay: hai cổ tay cách giữa ~3 cm, ngang ngực
}

// ───────────────────────── ĐỘNG HỌC THUẬN (kiểm tra / dò chạm đất) ─────────────────────────
const mul = (a, b) => a.map((r, i) => [0, 1, 2].map((j) => a[i][0] * b[0][j] + a[i][1] * b[1][j] + a[i][2] * b[2][j]));
const apply = (m, v) => [m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2], m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2], m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2]];
const rx = (a) => [[1, 0, 0], [0, Math.cos(a), -Math.sin(a)], [0, Math.sin(a), Math.cos(a)]];
const ry = (a) => [[Math.cos(a), 0, Math.sin(a)], [0, 1, 0], [-Math.sin(a), 0, Math.cos(a)]];
const rz = (a) => [[Math.cos(a), -Math.sin(a), 0], [Math.sin(a), Math.cos(a), 0], [0, 0, 1]];
/** Ma trận xoay của một bộ góc {x,y,z} theo thứ tự three.js 'XYZ'. */
export const eulerMat = (e) => mul(mul(rx(e.x), ry(e.y)), rz(e.z));
const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

/** Vị trí các khớp tay một bên, tính từ kết quả chibiPose, trong hệ tọa độ của xương hông (gốc = đũng, +y lên, +z trước). Trả { shoulder, elbow, wrist, tip } (mỗi điểm [x,y,z]). */
export function limbPoints(pose, side) {
  const k = side > 0 ? 'L' : 'R', s = side > 0 ? 1 : -1, Rs = eulerMat(pose.spine);
  const shoulder = apply(Rs, [s * LM.shoulderX * CHIBI_H, (LM.shoulderY - LM.crotch) * CHIBI_H, 0]);
  const Ra = mul(Rs, eulerMat(pose['arm' + k])), elbow = add3(shoulder, apply(Ra, [s * LIMB.upperArm, 0, 0]));
  const Rf = mul(Ra, eulerMat(pose['fore' + k])), wrist = add3(elbow, apply(Rf, [s * LIMB.forearm, 0, 0]));
  const Rh = mul(Rf, eulerMat(pose['hand' + k])), tip = add3(wrist, apply(Rh, [s * LIMB.hand, 0, 0]));
  return { shoulder, elbow, wrist, tip };
}

/** Vị trí các khớp chân một bên (hệ xương hông; hông ở y = 0): { hip, knee, ankle, sole }. sole = chạm đất của bàn chân (dưới cổ chân ankleH theo xương bàn chân). */
export function legPoints(pose, side) {
  const k = side > 0 ? 'L' : 'R', s = side > 0 ? 1 : -1;
  const hip = [s * LM.legX * CHIBI_H, 0, 0], Rl = eulerMat(pose['leg' + k]), knee = add3(hip, apply(Rl, [0, -LIMB.thigh, 0]));
  const Rn = mul(Rl, eulerMat(pose['shin' + k])), ankle = add3(knee, apply(Rn, [0, -LIMB.shin, 0]));
  const Rf = mul(Rn, eulerMat(pose['foot' + k])), sole = add3(ankle, apply(Rf, [0, -LIMB.ankleH, 0]));
  return { hip, knee, ankle, sole };
}

// ───────────────────────── TOÀN BỘ TƯ THẾ ─────────────────────────
const pos15 = (v) => Math.pow(Math.max(0, v), 1.5);   // nửa dương mượt (không gãy ở 0)

/**
 * Toàn bộ tư thế xương một khung hình (số thuần, dễ test).
 * p = poseFor(...) đã làm mượt; state; clock (giây, tính từ lúc vào trạng thái); speed (m/s);
 * opt: { hold, swing: { arm, lean, vis } | null, act: { name, k } | null, walk: 0..1 (mức "đang đi", để gối/chạm đất chuyển mượt; mặc định 1 nếu state = 'walk') }
 * Trả { spine, head, armL, armR, foreL, foreR, handL, handR, legL, legR, shinL, shinR, footL, footR (mỗi cái {x,y,z}; head chỉ {x}), hipsDrop }.
 */
export function chibiPose(p, state, clock, speed = 0, opt = {}) {
  const { hold = false, swing = null, act = null } = opt;
  const walk = clamp(opt.walk ?? (state === 'walk' ? 1 : 0), 0, 1);
  const L = armTarget(state, p.armL, hold), R = armTarget(state, p.armR, hold);
  let lean = p.lean, aL = armAngle(1, L.fwd, L.out), aR = armAngle(-1, R.fwd, R.out);
  let eL = { flex: L.flex, adduct: L.adduct }, eR = { flex: R.flex, adduct: R.adduct };
  if (swing) {   // vung côn: tay phải nâng/chém (khuỷu gần thẳng để côn thẳng hàng), tay trái giữ thăng bằng
    const v = clamp(swing.vis * 2, 0, 1);
    aR = armAngle(-1, -swing.arm, 0.1); eR = { flex: 0.12, adduct: 0 };
    aL = armAngle(1, L.fwd * (1 - v) + 0.5 * v, L.out * (1 - v) + 0.2 * v); eL = { flex: L.flex * (1 - v) + 0.6 * v, adduct: L.adduct * (1 - v) };
    lean += swing.lean;
  }
  if (act) {     // động tác một lần (ném, nhặt): k = 0..1
    const k = clamp(act.k, 0, 1), e = Math.sin(Math.PI * k);
    if (act.name === 'throw') {
      const wind = k < 0.35 ? k / 0.35 : 1 - (k - 0.35) / 0.65;
      aR = armAngle(-1, k < 0.35 ? -0.6 * wind : 2.2 * Math.sin(Math.PI * Math.min(1, (k - 0.35) / 0.65)) + 0.1, 0.15);
      eR = { flex: k < 0.35 ? 0.5 + 0.8 * (k / 0.35) : 1.3 * (1 - (k - 0.35) / 0.65) + 0.1, adduct: 0 };   // co khuỷu lấy đà rồi bật duỗi khi thả
      lean += k < 0.35 ? -0.2 * wind : 0.4 * Math.sin(Math.PI * (k - 0.35) / 0.65);
    } else if (act.name === 'grab') { lean += 0.7 * e; aL = armAngle(1, 0.9 + 0.8 * e, -0.1); aR = armAngle(-1, 0.9 + 0.8 * e, -0.1); eL = eR = { flex: 0.3 + 0.2 * e, adduct: 0 }; }
  }
  const kk = clamp(speed / 2.2, 0.25, 1.15), ph = clock * (5 + 4 * kk), sit = p.sit;
  // Đùi: bước tới/lui + xếp bằng khi ngồi (đùi đưa ra trước ~83°, gối dạng ra ngoài). Cẳng chân: gập gối khi vung chân tới + gập sâu và thu bàn chân vào giữa khi ngồi xếp bằng (đã dò bằng legPoints: bàn chân cách mặt sàn ~1 cm, hai cổ chân cách nhau ~13 cm).
  const swingL = pos15(Math.cos(ph)), swingR = pos15(-Math.cos(ph));   // chân trái vung tới khi cos(ph) > 0 (legL = sin(ph)·a), chân phải ngược lại
  const stepK = walk * 0.95 * Math.min(1, kk);
  const kneeL = 0.06 + stepK * swingL + 2.2 * sit, kneeR = 0.06 + stepK * swingR + 2.2 * sit;
  const legL = { x: -p.legL * 1.15 - 1.45 * sit, y: 0, z: 0.5 * sit }, legR = { x: -p.legR * 1.15 - 1.45 * sit, y: 0, z: -0.5 * sit };
  const shinL = kneeAngle(kneeL, -1.0 * sit), shinR = kneeAngle(kneeR, 1.0 * sit);
  // Cổ chân: giữ bàn chân phẳng với mặt đất khi đứng/đi (bù góc đùi + cẳng chân); gót nhấc lên nhẹ khi chân ở phía sau; ngồi thì thả lỏng.
  const flat = (leg, knee) => { const d = -leg.x - knee; return { x: clamp(d < 0 ? d * 0.55 : d, -0.6, 0.6) * (1 - sit), y: 0, z: 0 }; };
  const footL = flat(legL, shinL.x), footR = flat(legR, shinR.x);
  // Chạm đất khi đi: độ cao hông = tầm với DÀI NHẤT của hai chân (chân đỡ chạm đất; chân kia gập gối nên ngắn hơn, tự nhấc lên). Chân nghiêng thì ngắn lại → hông hạ xuống.
  const reach = (leg, knee) => LIMB.ankleH + LIMB.thigh * Math.cos(-leg.x) + LIMB.shin * Math.cos(-leg.x - knee);
  const walkDrop = walk * clamp(LM.crotch * CHIBI_H - Math.max(reach(legL, shinL.x), reach(legR, shinR.x)), 0, 0.1);
  return {
    spine: { x: lean, y: walk > 0.5 ? Math.sin(ph) * 0.08 : 0, z: walk > 0.5 ? Math.sin(ph) * 0.05 : 0 },
    head: { x: p.head },
    armL: aL, armR: aR,
    foreL: elbowAngle(1, eL.flex, eL.adduct), foreR: elbowAngle(-1, eR.flex, eR.adduct),
    handL: wristAngle(1, eL.flex), handR: wristAngle(-1, eR.flex),
    legL, legR, shinL, shinR, footL, footR,
    hipsDrop: 0.25 * sit + walkDrop,
  };
}
