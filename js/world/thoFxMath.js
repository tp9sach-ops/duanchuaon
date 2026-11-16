// THỔ 3D (Phiên 211, MỤC 6 của docs/KE_HOACH_HIEU_UNG_3D_V2.md): TOÁN THUẦN (không three.js), có test: tests/thofx.test.mjs. Phần vẽ: js/scene/fxTho.js. Trang xem thử: fx-tho.html.
// 6 chiêu Thổ, 6 "chữ ký" hình ảnh khác nhau (tự thiết kế, không dùng tài nguyên ngoài):
//   tho_1 gai_da · tho_2 khien_nham · tho_3 ho_trong_luc · tho_daidia_4 giap_da · tho_hukhong_4 mach_dat · tho_tuyet nui_roi
// Mốc 0 = lúc PHÁT (âm = đang gồng). Tọa độ: x ngang, z về phía trước (hướng chiêu), y lên. Kiểu "tâm dịch" (tamDich) tính theo tâm vùng (chiêu có thể đặt ở mục tiêu). CHƯA nhìn bằng mắt: mọi số là số TẠM.
export const THO_KIEU = Object.freeze({ tho_1: 'gai_da', tho_2: 'khien_nham', tho_3: 'ho_trong_luc', tho_daidia_4: 'giap_da', tho_hukhong_4: 'mach_dat', tho_tuyet: 'nui_roi' });
export const kieuTho = (id) => (typeof id === 'string' && Object.prototype.hasOwnProperty.call(THO_KIEU, id)) ? THO_KIEU[id] : null;
/** Kiểu nào hiệu ứng nằm ở TÂM VÙNG (chiêu tròn/đặt ở mục tiêu); số còn lại ở quanh người hoặc dọc đường chiêu. */
export const tamDich = (kieu) => kieu === 'ho_trong_luc' || kieu === 'mach_dat' || kieu === 'nui_roi';

const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const sm = (k) => { const t = clamp(k, 0, 1); return t * t * (3 - 2 * t); };
const easeOut = (k) => 1 - Math.pow(1 - clamp(k, 0, 1), 2.6);
/** Số giả ngẫu nhiên cố định 0..1 theo (i, k). */
export const h01 = (i, k = 0) => { const v = Math.abs(Math.sin(i * 127.1 + k * 311.7 + 0.5) * 43758.5453); return v - Math.floor(v); };

/** Mốc núi rơi (giây, mốc 0 = lúc phát): bắt đầu rơi (trong lúc gồng) · chạm đất (trùng lúc "trúng" của chieuFx, 0,12 s) · bắt đầu chìm · biến mất. */
export const NUI = Object.freeze({ start: -0.3, land: 0.12, chim0: 0.85, chim1: 1.3, H0: 12 });
export const T_THO = Object.freeze({ gai: 0.7, hetGai: 0.35, hien: 1.7 });

const CO_SO = {
  gai_da: { gai: 9, manh: 14, bui: 8, nut: 1, an: 0, nui: 0 },
  khien_nham: { gai: 0, manh: 7, bui: 6, nut: 0, an: 0, nui: 0 },
  ho_trong_luc: { gai: 0, manh: 16, bui: 8, nut: 0, an: 2, nui: 0 },
  giap_da: { gai: 0, manh: 12, bui: 6, nut: 0, an: 1, nui: 0 },
  mach_dat: { gai: 8, manh: 12, bui: 8, nut: 6, an: 1, nui: 0 },
  nui_roi: { gai: 10, manh: 18, bui: 12, nut: 7, an: 1, nui: 1 },
};
const HE_SO = { yeu: 0.4, vua: 1, cao: 1.7 };
/** Số vật thể mỗi loại theo kiểu + bậc máy (yeu / vua / cao; bậc lạ dùng vừa). gai = gai đá · manh = mảnh đá · bui = cục bụi · nut = vệt nứt sáng · an = vòng ấn · nui = núi (0/1). */
export function demTho(kieu, tier = 'vua') {
  const zero = { gai: 0, manh: 0, bui: 0, nut: 0, an: 0, nui: 0, khoi: 0 };
  if (typeof kieu !== 'string' || !has(CO_SO, kieu)) return zero;
  const c = CO_SO[kieu], f = has(HE_SO, tier) ? HE_SO[tier] : HE_SO.vua, sc = (b) => (b > 0 ? Math.max(1, Math.round(b * f)) : 0);
  const o = { gai: sc(c.gai), manh: sc(c.manh), bui: sc(c.bui), nut: sc(c.nut), an: c.an > 0 ? (tier === 'yeu' ? 1 : c.an) : 0, nui: c.nui };
  o.khoi = o.gai + o.manh + o.bui + o.nut + o.an + o.nui;
  return o;
}

const OFF_GAI = { hien: false, x: 0, z: 0, cao: 0, rong: 0, ngh: 0 };
/** Gai đá trồi lên (cột đá nhọn) ở giây `after`. ctx = { reach, R2, W }. gai_da: hàng gai dọc đường chiêu, trồi lần lượt như sóng · mach_dat: tinh thể quanh vùng · nui_roi: vòng gai bật ra sau khi núi chạm đất. Kiểu khác → không hiện. */
export function gaiDa(kieu, i, n, after, ctx = {}) {
  const { reach = 4, R2 = 2, W = 1 } = ctx, N = Math.max(1, n | 0);
  let tre, x, z, cao;
  if (kieu === 'gai_da') { tre = (i / N) * 0.28; x = (h01(i, 1) - 0.5) * Math.max(0.6, W) * 1.4; z = 0.9 + Math.max(0.5, reach - 0.9) * ((i + 0.5) / N); cao = 1.0 + 1.3 * h01(i, 2); }
  else if (kieu === 'mach_dat') { const a = (i / N) * 6.2832 + h01(i, 6) * 0.8, r = R2 * (0.3 + 0.65 * h01(i, 3)); tre = 0.04 + h01(i, 4) * 0.26; x = Math.sin(a) * r; z = Math.cos(a) * r; cao = 0.6 + 1.0 * h01(i, 2); }
  else if (kieu === 'nui_roi') { const a = (i / N) * 6.2832 + h01(i, 6) * 0.5, r = R2 * (0.55 + 0.45 * h01(i, 3)); tre = NUI.land + (i / N) * 0.1; x = Math.sin(a) * r; z = Math.cos(a) * r; cao = 0.9 + 1.4 * h01(i, 2); }
  else return OFF_GAI;
  const t = after - tre; if (!(t >= 0)) return OFF_GAI;
  const k = easeOut(t / 0.16) * (1 - sm((t - T_THO.gai) / T_THO.hetGai)); if (k <= 0.002) return OFF_GAI;
  return { hien: true, x, z, cao: cao * k, rong: (0.55 + 0.4 * h01(i, 3)) * (0.6 + 0.4 * k), ngh: (h01(i, 4) - 0.5) * 0.5 };
}

const OFF_M = { hien: false, x: 0, y: -50, z: 0, rx: 0, ry: 0, rz: 0, kich: 0.001 };
/** Mảnh đá ở giây `after` (≥ 0; đang gồng dùng gongDa). Trả { hien, x, y, z, rx, ry, rz (góc xoay), kich }.
 *  gai_da: vụn đá bắn lên rơi xuống · khien_nham: tấm đá xoay quanh người rồi vỡ văng ra · ho_trong_luc: đá xoáy hút vào tâm · giap_da: mảnh giáp bám quanh người · mach_dat: đá trồi lên lơ lửng rồi bị kéo vào tâm · nui_roi: đá văng sau khi núi chạm đất. */
export function manhDa(kieu, i, n, after, ctx = {}) {
  if (!(after >= 0)) return OFF_M;
  const { reach = 4, R2 = 2, W = 1 } = ctx, N = Math.max(1, n | 0), a0 = h01(i, 1) * 6.2832, hr = h01(i, 2), hh = h01(i, 3), spin = 3 + 8 * h01(i, 4);
  const R = (o) => ({ hien: true, rx: 0, ry: 0, rz: 0, ...o });
  switch (kieu) {
    case 'gai_da': {
      const t = after - h01(i, 7) * 0.28; if (t < 0 || t > 1.0) return OFF_M;
      const y = (3 + 3.2 * hh) * t - 4.9 * t * t; if (y < 0 && t > 0.1) return OFF_M;
      return R({ x: (h01(i, 5) - 0.5) * Math.max(0.6, W) * 1.6 + (h01(i, 8) - 0.5) * 2 * t, y: Math.max(0.06, y), z: 0.9 + Math.max(0.5, reach - 0.9) * hr + (h01(i, 9) - 0.5) * 2 * t, rx: t * spin, ry: a0, rz: t * spin * 0.7, kich: (0.5 + 0.8 * hh) * (1 - sm((t - 0.7) / 0.3)) });
    }
    case 'khien_nham': {
      if (after > 1.0) return OFF_M;
      const sh = sm((after - 0.55) / 0.4), a = (i / N) * 6.2832 + after * 2.6, r = 1.15 + 0.1 * Math.sin(after * 6 + i) + sh * 2.2;
      return R({ x: Math.sin(a) * r, y: 0.55 + 0.7 * ((i % 3) / 2) + sh * 0.8, z: Math.cos(a) * r, ry: a, rz: sh * spin * 0.3, kich: (1 - sh * 0.9) * Math.min(1, after / 0.1) });
    }
    case 'ho_trong_luc': {
      if (after > 1.0) return OFF_M;
      const u = clamp(after / 0.85, 0, 1), a = a0 + u * (5 + 3 * hh), r = R2 * (0.25 + 0.75 * hr) * (1 - 0.9 * Math.pow(u, 1.4));
      return R({ x: Math.sin(a) * r, y: 0.25 + 1.3 * hh * (1 - u) + 0.25 * Math.sin(after * 9 + i), z: Math.cos(a) * r, rx: after * spin, ry: a, rz: after * spin * 0.6, kich: (0.6 + 0.8 * hh) * (1 - sm((u - 0.75) / 0.25)) });
    }
    case 'giap_da': {
      if (after > 1.3) return OFF_M;
      const r = 0.42 + 0.16 * (i % 2), a = (i / N) * 12.566 + after * 1.4, pop = 1 + 0.7 * Math.max(0, 1 - after / 0.12), out = sm((after - 0.95) / 0.35);
      return R({ x: Math.sin(a) * (r + out * 1.2), y: 0.2 + 1.55 * (i / N) + out * 0.5, z: Math.cos(a) * (r + out * 1.2), ry: a, rz: 0.3, kich: (0.9 + 0.4 * hh) * pop * (1 - out) });
    }
    case 'mach_dat': {
      const t = after - 0.05 - h01(i, 5) * 0.2; if (t < 0 || t > 1.3) return OFF_M;
      const rise = easeOut(t / 0.7), pull = sm((t - 0.55) / 0.6), r = R2 * Math.sqrt(hr) * (1 - 0.85 * pull);
      return R({ x: Math.sin(a0) * r, y: 0.1 + (0.6 + 1.6 * hh) * rise * (1 - 0.5 * pull), z: Math.cos(a0) * r, rx: t * spin * 0.4, ry: a0, rz: t * spin * 0.3, kich: (0.5 + 0.7 * hh) * (1 - sm((t - 1.0) / 0.3)) });
    }
    case 'nui_roi': {
      const t = after - NUI.land; if (t < 0 || t > 1.1) return OFF_M;
      const d = (2.5 + 4.5 * hh) * t * 0.75, y = (3 + 4 * h01(i, 5)) * t - 6 * t * t; if (y < 0 && t > 0.12) return OFF_M;
      return R({ x: Math.sin(a0) * d, y: Math.max(0.06, y), z: Math.cos(a0) * d, rx: t * spin, ry: a0, rz: t * spin * 0.8, kich: (0.6 + 1.0 * hh) * (1 - sm((t - 0.8) / 0.3)) });
    }
    default: return OFF_M;
  }
}
/** 4 viên sỏi lơ lửng quanh người LÚC GỒNG (hút sức đất vào tay), to dần theo độ sáng lõi `gong` 0..1. t = giây từ lúc bắt đầu gồng. */
export function gongDa(i, t, gong) {
  const g = clamp(+gong || 0, 0, 1); if (g <= 0.02) return { hien: false, x: 0, y: -50, z: 0, kich: 0.001 };
  const a = h01(i, 1) * 6.2832 + t * 3, r = 0.95 - 0.45 * g;
  return { hien: true, x: Math.sin(a) * r, y: 0.15 + 0.95 * g, z: Math.cos(a) * r, kich: 0.5 * (0.4 + 0.6 * g) };
}
/** Núi đá (chỉ tuyệt học nui_roi). S = hệ số cỡ. Rơi nhanh dần từ trên cao, chạm đất lúc NUI.land (bẹp rồi bật lại), giữ rồi chìm xuống. Trả { hien, y, sx, sy }. */
export function nuiRoi(after, S = 1) {
  if (!(after >= NUI.start) || after > NUI.chim1) return { hien: false, y: -50, sx: 1, sy: 1 };
  if (after < NUI.land) { const u = clamp((after - NUI.start) / (NUI.land - NUI.start), 0, 1); return { hien: true, y: NUI.H0 * S * (1 - u * u), sx: 1, sy: 1 }; }
  const b = clamp((after - NUI.land) / 0.12, 0, 1), sy = 1 - 0.22 * Math.sin(Math.PI * b), c = sm((after - NUI.chim0) / (NUI.chim1 - NUI.chim0));
  return { hien: true, y: -4.4 * S * c, sx: 1 / Math.sqrt(sy), sy };
}
const B_BUI = { gai_da: [0, 0.28], khien_nham: [0, 0.15], ho_trong_luc: [0, 0.7], giap_da: [0, 0.12], mach_dat: [0.04, 0.3], nui_roi: [NUI.land, 0.12] };
/** Cục bụi (sprite khói nâu) ở giây `after`: nở to, bay lên, tan. Trả { hien, x, y, z, co, op }. */
export function bui(kieu, i, n, after, ctx = {}) {
  const off = { hien: false, x: 0, y: 0, z: 0, co: 0, op: 0 };
  if (typeof kieu !== 'string' || !has(B_BUI, kieu)) return off;
  const { reach = 4, R2 = 2, W = 1 } = ctx, N = Math.max(1, n | 0), B = B_BUI[kieu], tre = B[0] + h01(i, 5) * B[1], dur = 0.7 + 0.5 * h01(i, 6), t = after - tre;
  if (!(t >= 0) || t > dur) return off;
  const u = t / dur; let x, z;
  if (kieu === 'gai_da') { x = (h01(i, 1) - 0.5) * Math.max(0.6, W) * 1.6; z = 0.9 + Math.max(0.5, reach - 0.9) * ((i + 0.5) / N); }
  else { const a = h01(i, 1) * 6.2832, tam = kieu === 'khien_nham' || kieu === 'giap_da', r = tam ? 0.35 + 0.55 * h01(i, 2) : R2 * (0.15 + 0.85 * h01(i, 2)); x = Math.sin(a) * r; z = Math.cos(a) * r; }
  return { hien: true, x, y: 0.15 + 0.9 * easeOut(u), z, co: 0.7 + 1.7 * easeOut(u), op: 0.55 * (1 - u) * Math.min(1, u * 8) };
}
/** Vệt nứt sáng thứ i: { a (góc, 0 = +z), z0 (cách tâm), dai, tre } hoặc null. gai_da: một vệt dọc đường chiêu · mach_dat/nui_roi: tia tỏa từ tâm. */
export function nutHinh(kieu, i, n, ctx = {}) {
  const { reach = 4, R2 = 2 } = ctx, N = Math.max(1, n | 0);
  if (kieu === 'gai_da') return i === 0 ? { a: 0, z0: 0.4, dai: Math.max(1.5, reach - 0.4), tre: 0.02 } : null;
  if (kieu !== 'mach_dat' && kieu !== 'nui_roi') return null;
  return { a: (i / N) * 6.2832 + 0.35 * h01(i, 1), z0: 0.3, dai: R2 * (0.7 + 0.5 * h01(i, 2)) * (kieu === 'nui_roi' ? 1.2 : 1), tre: (kieu === 'nui_roi' ? NUI.land : 0.04) + 0.02 * i };
}
/** Điểm [x,z] của vệt nứt gấp khúc: k điểm từ (z0 theo góc a) ra xa `dai`, hai đầu thẳng, giữa lệch ngẫu nhiên cố định theo `seed`. */
export function nutDiem(a, z0, dai, k = 9, seed = 0) {
  const K = Math.max(2, k | 0), out = [];
  for (let j = 0; j < K; j++) { const f = j / (K - 1), d = z0 + dai * f, lat = (j === 0 || j === K - 1) ? 0 : (h01(j, seed + 3) - 0.5) * dai * 0.1; out.push([Math.sin(a) * d + Math.cos(a) * lat, Math.cos(a) * d - Math.sin(a) * lat]); }
  return out;
}
/** Tiến độ vệt nứt: k = đoạn đã nứt tới đâu (0..1), op = độ sáng (sáng rồi nguội dần). */
export function nutTienDo(tre, after) {
  const k = easeOut((after - tre) / 0.22);
  return { k, op: k > 0 ? 1 - sm((after - 1.0) / 0.6) : 0 };
}
const T_SONG = { gai_da: 0.1, mach_dat: 0.1, nui_roi: NUI.land };
/** Sóng chấn nền: { hien, k (cỡ 0..1), op }. Chỉ gai_da / mach_dat / nui_roi. */
export function songDia(kieu, after) {
  if (typeof kieu !== 'string' || !has(T_SONG, kieu)) return { hien: false, k: 0, op: 0 };
  const u = (after - T_SONG[kieu]) / 0.55; if (!(u >= 0) || u > 1) return { hien: false, k: 0, op: 0 };
  return { hien: true, k: easeOut(u), op: 1 - u };
}
/** Góc xoay (rad) của vòng ấn thứ j ở giây t: hai vòng quay ngược chiều nhau. */
export const runeQuay = (j, t) => t * (j % 2 ? -1.1 : 0.8);
