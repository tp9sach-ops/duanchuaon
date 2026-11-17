// Phiên 213 (mục 1 đợt 2): QUÁI BỊ TRÚNG CHIÊU — tư thế, âm thanh, hình ảnh cho MỌI mục tiêu bị chiêu trúng. LOGIC THUẦN (không DOM, không three.js), có test: tests/hitreact.test.mjs.
// Dùng lại số liệu của js/world/chieuTrung.js (3 mức trúng × 5 hướng, chất liệu kẻ địch). Hình dựng thêm: js/scene/chieuTrungFx.js (tia lóe, sóng chấn, số sát thương) + tư thế thân quái: js/scene/farm.js (đọc m.rx).
// Nối: js/ui/farm.js hit() → LGT.hitReact.onHit (js/ui/hitReact.js). Mọi con số TẠM, chờ nhìn bằng mắt trên máy thật.
import { mucTrung, phanUngTrung, coKeDich, chatLieuKeDich } from './chieuTrung.js';

const num = (v, d = 0) => (Number.isFinite(+v) ? +v : d);
const ease = (k) => 1 - (1 - Math.min(1, Math.max(0, k))) ** 2;

/** Số quái tối đa được dựng ĐẦY ĐỦ hiệu ứng (tia lóe + sóng chấn + số) trong MỘT lần chiêu; các quái còn lại vẫn giật/ngã + có tiếng nhưng nhẹ hơn (giữ khung hình trên điện thoại). */
export const FX_DAY_DU = 4;
/** Số tiếng "trúng" tối đa trong cùng một lần chiêu (nhiều quái cùng trúng không được vỡ tiếng). */
export const AM_TOI_DA = 3;

/**
 * Bắt đầu phản ứng trúng cho quái `m` ({ x, z, ry, type }). o = { ax, az (vị trí kẻ đánh), id (chiêu), now (giây), chiMang, ketLieu, nho, luc }.
 * Trả rx = { t0, dur, plan, muc } hoặc null nếu quái lạ.
 */
export function rxStart(m, o = {}) {
  if (!m || !Number.isFinite(+m.x) || !Number.isFinite(+m.z)) return null;
  const muc = mucTrung({ id: o.id || null, chiMang: !!o.chiMang, ketLieu: !!o.ketLieu, nho: !!o.nho });
  const co = m.boss ? 'boss' : m.elite ? 'elite' : coKeDich(m.type);
  const plan = phanUngTrung({ muc, co, luc: o.luc == null ? 0.5 : o.luc, ax: num(o.ax, m.x), az: num(o.az, m.z), x: +m.x, z: +m.z, ry: num(m.ry), trenKhong: false });
  const T = Math.max(0.08, plan.giatMs / 1000);
  return { t0: num(o.now), dur: T * 2.2 + (plan.nga ? 0.5 : 0), plan, muc };
}

/**
 * Tư thế của quái tại thời điểm `now` (giây). Trả { dx, dz (m, độ lệch vị trí), rx, rz, ry (rad, nghiêng quanh chân), k (0..1 độ "đang giật" để nháy sáng), done }.
 * Cùng đường cong với js/scene/chieuTrungFx.js (ra nhanh, về chậm; mức nặng ngã rồi đứng dậy).
 */
export function rxPose(rx, now) {
  const Z = { dx: 0, dz: 0, rx: 0, rz: 0, ry: 0, k: 0, done: true };
  if (!rx || !rx.plan) return Z;
  const t = num(now) - num(rx.t0); if (t < 0) return { ...Z, done: false };
  if (t >= rx.dur) return Z;
  const M = rx.plan, gx = M.giat[0], gz = M.giat[1], T = Math.max(0.08, M.giatMs / 1000);
  const out = ease(t / (T * 0.45)), back = t > T * 0.45 ? ease((t - T * 0.45) / (T * 1.75)) : 0, k = Math.max(0, out - back);
  const pen = M.nga ? Math.max(0, 1 - Math.max(0, t - T * 2.2) / 0.5) : 0;
  return {
    dx: gx * M.lui * k, dz: gz * M.lui * k,
    rx: -gz * 0.35 * k + (M.nga ? -gz * 1.1 * pen * k : 0), rz: gx * 0.35 * k + (M.nga ? gx * 1.1 * pen * k : 0), ry: M.xoay * k,
    k, done: false,
  };
}

/** Quái còn đang giật (để scene biết có cần vẽ tư thế không). */
export const rxDang = (rx, now) => !!rx && num(now) - num(rx.t0) < num(rx.dur);

/**
 * Tiếng trúng cho quái loại `type` ở mức `muc`: { file (id trong kho assets/sfx/chieu), gain, them (cue phụ cho mức nặng, hoặc null) }.
 * Chất liệu: Kim → kim loại, Thổ/đá → đá, còn lại da thịt (js/world/chieuTrung.js chatLieuKeDich).
 */
export function amTrung(type, muc = 'vua') {
  const cl = chatLieuKeDich(type), gain = muc === 'nang' ? 1 : muc === 'vua' ? 0.75 : 0.5;
  return { file: `trung-${cl}`, gain, them: muc === 'nang' ? 'chem-khi-trung' : null, chatLieu: cl };
}

/** Quyết định hiệu ứng cho quái thứ `i` (0 = quái đầu) trong một lần chiêu: dayDu (tia + sóng + số) và coAm (có tiếng riêng). */
export function ngansachHieuUng(i) { const n = Math.max(0, Math.floor(num(i))); return { dayDu: n < FX_DAY_DU, coAm: n < AM_TOI_DA }; }
