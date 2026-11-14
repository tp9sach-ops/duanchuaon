// TƯ THẾ BỐN KHUNG + THEO ĐÀ (prompt "chiêu thức 3D chuyên nghiệp" mục 6 và mục 14 điểm 3). LOGIC THUẦN, có test: tests/chieupose4.test.mjs.
// Bốn khung: GỒNG (dự bị) → PHÁT (bật nhanh) → TRÚNG (giữ đỉnh 2–3 khung hình, vươn quá thế phát 12% để mắt kịp nhìn tư thế đẹp) → HỒI (thở ra, hạ về thế nghỉ).
// KHÔNG đổi chieuPose.js: ba khung gốc (gồng/phát/thu) và tổng thời gian chiêu (castTimeline().tong) giữ nguyên; khung TRÚNG lấy từ đầu khung thu (giữ đỉnh), khung HỒI là phần còn lại.
// Khung trúng/hồi được TÍNH từ ba khung gốc (không có tư thế vẽ tay riêng cho 30 chiêu) → số TẠM, chờ nhìn bằng mắt rồi chỉnh (HOLD_MS, VUOT, NGHI, THEO_DA).
// Theo đà (áo, đai, tóc bay): hàm của (id, t), dao động tắt dần, áo → đai → tóc trễ dần một nhịp. CHƯA nối vào avatar (chibiRig chưa có xương áo/đai/tóc); khi nối chỉ cần đọc theoDa(id, t).
import { POSE, castTimeline, framePose, applyCast } from './chieuPose.js';
import { COMBAT_SKILLS } from '../data/combatSkills.js';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const sm = (k) => { const t = clamp(k, 0, 1); return t * t * (3 - 2 * t); };
const mix = (a, b, k) => a + (b - a) * k;
const mixA = (a, b, k) => a.map((v, i) => mix(v, b[i], k));
const blend = (a, b, k) => ({ P: mixA(a.P, b.P, k), T: mixA(a.T, b.T, k), sp: mixA(a.sp, b.sp, k), lT: mixA(a.lT, b.lT, k), lP: mixA(a.lP, b.lP, k), h: mix(a.h, b.h, k), lift: mix(a.lift, b.lift, k) });

/** Thời gian giữ đỉnh (ms) theo vai chiêu: 3 khung hình @60 fps = 50 ms; Chiêu 4 lâu hơn; Tuyệt học lâu nhất (≤ khựng đòn tối đa 120 ms của prompt mục 7). */
export const HOLD_MS = Object.freeze({ thuong: 50, chieu4: 70, tuyet: 100 });
/** Tỉ lệ vươn quá thế phát ở khung TRÚNG. */
export const VUOT = 0.12;
/** Thế nghỉ "thở ra" mà khung HỒI hướng tới: tay buông lỏng, thân chúi nhẹ, chân gần thẳng. */
export const NGHI = Object.freeze({ P: [0.1, 0.15, 0.2, 0], T: [0.1, 0.15, 0.2, 0], sp: [0.12, 0, 0], lT: [-0.05, 0.08], lP: [-0.05, 0.08], h: 0.02, lift: 0 });
const HOI_PHAN = 0.4;   // khung hồi = thu trộn 40% về thế nghỉ

const poseOf = (id) => (typeof id === 'string' && Object.prototype.hasOwnProperty.call(POSE, id) ? POSE[id] : null);
const slotOf = (id) => COMBAT_SKILLS.find((s) => s.id === id)?.slot;
export const vaiChieu = (id) => { const s = slotOf(id); return s === 'tuyet' ? 'tuyet' : s === 4 ? 'chieu4' : 'thuong'; };

const RANGE = { fwd: [-1.2, 3.1], out: [-0.6, 1.6], flex: [0, 2.4], add: [0, 0.6], thigh: [-1.6, 1.0], knee: [0, 2.4], spx: [-0.6, 1.0], spy: [-0.8, 0.8], spz: [-0.5, 0.5], h: [0, 0.3] };
const over = (a, p, r, [lo, hi]) => clamp(p + (p - a) * r, lo, hi);
const overArm = (a, p) => [over(a[0], p[0], VUOT, RANGE.fwd), over(a[1], p[1], VUOT, RANGE.out), over(a[2], p[2], VUOT, RANGE.flex), over(a[3], p[3], VUOT, RANGE.add)];
const overLeg = (a, p) => [over(a[0], p[0], VUOT, RANGE.thigh), over(a[1], p[1], VUOT, RANGE.knee)];
/** Khung TRÚNG của chiêu: thế phát vươn thêm VUOT so với thế gồng, kẹp trong biên an toàn; không nhấc người thêm (lift giữ như phát). */
export function trungFrame(id) {
  const P = poseOf(id); if (!P) return null; const a = P.gong, p = P.phat;
  return { P: overArm(a.P, p.P), T: overArm(a.T, p.T), sp: [over(a.sp[0], p.sp[0], VUOT, RANGE.spx), over(a.sp[1], p.sp[1], VUOT, RANGE.spy), over(a.sp[2], p.sp[2], VUOT, RANGE.spz)], lT: overLeg(a.lT, p.lT), lP: overLeg(a.lP, p.lP), h: over(a.h, p.h, VUOT, RANGE.h), lift: p.lift };
}
/** Khung HỒI của chiêu: khung thu trộn một phần về thế nghỉ thở ra. */
export function hoiFrame(id) { const P = poseOf(id); return P ? blend(P.thu, NGHI, HOI_PHAN) : null; }

/** Lịch BỐN khung (giây): { gong, phat, trung, hoi, tong }; tong bằng castTimeline().tong. Chiêu lạ → null. */
export function castTimeline4(id) {
  const L = castTimeline(id); if (!L) return null;
  const trung = Math.min(HOLD_MS[vaiChieu(id)] / 1000, L.thu * 0.5), hoi = L.thu - trung;
  return { gong: L.gong, phat: L.phat, trung, hoi, tong: L.tong };
}

/** Giống castSample nhưng có 4 pha: 'gong' | 'phat' | 'trung' | 'hoi'. Trả { phase, k, w, ...khung } (dùng được với applyCast) hoặc null nếu chiêu lạ / đã xong. */
export function castSample4(id, t) {
  const L = castTimeline4(id); if (!L) return null;
  const tt = Number.isFinite(+t) ? +t : 0; if (tt < 0 || tt >= L.tong) return null;
  const P = POSE[id], tr = trungFrame(id), ho = hoiFrame(id), thuT = L.trung + L.hoi;
  const wIn = sm(tt / Math.min(0.18, L.gong)), wOut = sm((L.tong - tt) / Math.min(0.2, thuT * 0.6));
  let phase, k, f;
  if (tt < L.gong) { phase = 'gong'; k = tt / L.gong; f = P.gong; }
  else if (tt < L.gong + L.phat) { phase = 'phat'; k = (tt - L.gong) / L.phat; f = blend(P.gong, P.phat, 1 - (1 - k) * (1 - k)); }
  else if (tt < L.gong + L.phat + L.trung) { phase = 'trung'; k = (tt - L.gong - L.phat) / L.trung; f = blend(P.phat, tr, sm(k / 0.3)); }
  else { phase = 'hoi'; k = (tt - L.gong - L.phat - L.trung) / L.hoi; f = blend(tr, ho, sm(k / 0.6)); }
  return { phase, k, w: Math.min(wIn, wOut), ...f };
}

/** Biên độ theo đà theo vai chiêu (0..1). */
export const THEO_DA = Object.freeze({
  bienDo: Object.freeze({ thuong: 0.4, chieu4: 0.7, tuyet: 1 }),
  tat: 0.45,   // hằng số tắt dần (giây)
  nhip: Object.freeze({ ao: { hz: 3, tre: 0 }, dai: { hz: 4, tre: 0.04 }, toc: { hz: 5, tre: 0.08 } }),   // mỗi phần trễ thêm một nhịp
  het: 2.5,    // sau ngần này giây kể từ lúc phát thì coi như đã yên
});
/**
 * Độ lệch của áo / đai / tóc (−1..1; dấu = bay về bên nào, theo chiều xoay thân của khung phát) tại giây t kể từ lúc bắt đầu gồng.
 * Trước lúc phát = 0; sau đó dao động tắt dần, áo trước, đai trễ 0,04 s, tóc trễ 0,08 s. Chiêu lạ → null.
 */
export function theoDa(id, t) {
  const L = castTimeline(id); if (!L) return null;
  const tt = Number.isFinite(+t) ? +t : 0, s = tt - L.gong, A = THEO_DA.bienDo[vaiChieu(id)], dau = POSE[id].phat.sp[1] < 0 ? -1 : 1, out = { ao: 0, dai: 0, toc: 0 };
  if (s <= 0 || s > THEO_DA.het) return out;
  for (const [ten, { hz, tre }] of Object.entries(THEO_DA.nhip)) { const u = s - tre; if (u > 0) out[ten] = Math.round(dau * A * Math.exp(-u / THEO_DA.tat) * Math.cos(2 * Math.PI * hz * u - Math.PI / 2) * 1e4) / 1e4; }
  return out;
}

const deg = (r) => Math.round(r * 57.2958);
const KHUNG = [['Gồng', (P) => P.gong], ['Phát', (P) => P.phat], ['Trúng', (_, id) => trungFrame(id)], ['Hồi', (_, id) => hoiFrame(id)]];
/** Thẻ tư thế: 4 khung × (góc thân chúi/xoay, tay phải/trái [tiến, ngang] độ, đùi trước/sau độ, hạ hông m). Hướng nhìn: mắt luôn hướng mục tiêu, thân xoay sp[1]. Chiêu lạ → null. */
export function theTuThe(id) {
  const P = poseOf(id); if (!P) return null;
  return KHUNG.map(([ten, get]) => { const f = get(P, id); return { khung: ten, thanChui: deg(f.sp[0]), thanXoay: deg(f.sp[1]), tayPhai: [deg(f.P[0]), deg(f.P[1])], tayTrai: [deg(f.T[0]), deg(f.T[1])], duiTrai: deg(f.lT[0]), duiPhai: deg(f.lP[0]), haHong: Math.round(f.h * 100) / 100, nhin: 'mục tiêu' }; });
}
/** Tư thế xương đầy đủ của một khung trúng/hồi để dựng/ kiểm (cùng khóa với framePose). */
export const trungPose = (id) => { const f = trungFrame(id); return f ? framePose(f) : null; };
export const hoiPose = (id) => { const f = hoiFrame(id); return f ? framePose(f) : null; };
export { applyCast };
