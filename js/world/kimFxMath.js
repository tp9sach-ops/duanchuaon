// KIM 3D (Phiên 212, MỤC 4 của docs/KE_HOACH_HIEU_UNG_3D_V2.md): TOÁN THUẦN (không three.js), có test: tests/kimfx.test.mjs. Phần vẽ: js/scene/fxKimThan.js.
// Đợt 1/2 làm 3 chiêu: kim_1 liem_bac (nhát chém trăng khuyết bạc) · kim_2 khien_luc (khiên lục giác xoay) · kim_3 ky_binh (kỵ binh vàng xung phong).
// Đợt 2 (chưa làm): kim_kimcang_4 · kim_thietky_4 · kim_tuyet → kieuKim3 trả null, chạy bằng bộ cũ js/scene/fxKim.js.
// Mốc 0 = lúc PHÁT (âm = đang gồng). x ngang, z hướng chiêu, y lên. pz = vị trí đầu chiêu dọc đường bay (do chieuFx tính). Số TẠM, chờ nhìn bằng mắt.
export const KIM3_KIEU = Object.freeze({ kim_1: 'liem_bac', kim_2: 'khien_luc', kim_3: 'ky_binh' });
export const kieuKim3 = (id) => (typeof id === 'string' && Object.prototype.hasOwnProperty.call(KIM3_KIEU, id)) ? KIM3_KIEU[id] : null;
const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const sm = (k) => { const t = clamp(k, 0, 1); return t * t * (3 - 2 * t); };
export const h01 = (i, k = 0) => { const v = Math.abs(Math.sin(i * 127.1 + k * 311.7 + 0.5) * 43758.5453); return v - Math.floor(v); };

/** Mốc (giây): lúc đầu chiêu tới đích (khớp ce của chieuFx ~0,3 s) · thời gian hiển thị tối đa theo kiểu. */
export const KIM3_T = Object.freeze({ hit: 0.3, liem: 0.75, khien: 1.7, kyBinh: 1.1 });
const CO_SO = { liem_bac: { manh: 9, sao: 3, nho: 0, ky: 0 }, khien_luc: { manh: 0, sao: 4, nho: 6, ky: 0 }, ky_binh: { manh: 0, sao: 3, nho: 0, ky: 6 } };
const HE_SO = { yeu: 0.5, vua: 1, cao: 1.5 };
/** Số vật thể theo kiểu + bậc máy. manh = mảnh kim loại văng · sao = tia lóe · nho = tấm khiên nhỏ · ky = kỵ sĩ. */
export function demKim3(kieu, tier = 'vua') {
  const zero = { manh: 0, sao: 0, nho: 0, ky: 0, khoi: 0 };
  if (typeof kieu !== 'string' || !has(CO_SO, kieu)) return zero;
  const c = CO_SO[kieu], f = has(HE_SO, tier) ? HE_SO[tier] : HE_SO.vua, sc = (b, min) => (b > 0 ? Math.max(min, Math.round(b * f)) : 0);
  const o = { manh: sc(c.manh, 2), sao: sc(c.sao, 1), nho: sc(c.nho, 2), ky: c.ky > 0 ? (tier === 'yeu' ? 3 : tier === 'cao' ? 7 : 5) : 0 };
  o.khoi = o.manh + o.sao + o.nho + o.ky; return o;
}
const OFF = { hien: false, x: 0, y: 0, z: 0, kich: 0, op: 0 };

/** Nhát chém trăng khuyết: đầu chiêu bay thẳng (z = pz), lưỡi xoay nhẹ quanh trục đứng, to dần rồi mờ. Trả { hien, z, y, sc, quay, op, ve (độ dài vệt 0..1) }. */
export function liemBac(after, pz = 0, reach = 4) {
  if (!(after > -0.02) || after > KIM3_T.liem) return { hien: false, z: 0, y: 1.1, sc: 0, quay: 0, op: 0, ve: 0 };
  const a = Math.max(0, after), mo = 1 - sm((a - 0.3) / (KIM3_T.liem - 0.3));
  return { hien: true, z: clamp(pz, 0, Math.max(0.5, reach)), y: 1.1, sc: (0.5 + 0.8 * sm(a / 0.12)) * (1 + 0.15 * sm((a - 0.2) / 0.2)), quay: a * 5, op: Math.min(1, a / 0.03 + 0.2) * mo, ve: clamp(a / 0.25, 0, 1) };
}
/** Mảnh kim loại văng khi chiêu tới đích (sau KIM3_T.hit): quỹ đạo cong ngắn, rơi dần. */
export function manhKim(i, n, after, reach = 4) {
  const a = after - KIM3_T.hit; if (!(a > 0) || a > 0.6 || n <= 0) return { ...OFF, rx: 0, rz: 0 };
  const ang = (i / n) * 6.2832 + h01(i, 1) * 0.8, v = 2.2 + h01(i, 2) * 2.4, up = 1.4 + h01(i, 3) * 2.2;
  return { hien: true, x: Math.sin(ang) * v * a * 0.9, y: 1.1 + up * a - 4.2 * a * a, z: reach + Math.cos(ang) * v * a * 0.9, kich: (0.07 + h01(i, 4) * 0.08) * (1 - sm((a - 0.35) / 0.25)), op: 1 - sm((a - 0.4) / 0.2), rx: a * (8 + h01(i, 5) * 8), rz: a * (6 + h01(i, 6) * 6) };
}
/** Tia lóe trắng (sprite) lúc tới đích, hoặc lúc khiên hấp thụ: { hien, co, op }. */
export function sao(i, after, kieu) {
  const t0 = kieu === 'khien_luc' ? 0.35 + i * 0.28 : KIM3_T.hit - 0.02 + i * 0.03, a = after - t0;
  if (!(a > 0) || a > 0.3) return { hien: false, co: 0, op: 0, dx: 0, dy: 0 };
  return { hien: true, co: (kieu === 'khien_luc' ? 1.4 : 1.8 + h01(i, 7)) * (0.5 + sm(a / 0.08)) * (1 - sm((a - 0.1) / 0.2) * 0.6), op: 1 - sm(a / 0.3), dx: (h01(i, 8) - 0.5) * (kieu === 'khien_luc' ? 1.4 : 0.8), dy: (h01(i, 9) - 0.5) * (kieu === 'khien_luc' ? 1.4 : 0.8) };
}
/** Khiên lục giác: hiện từ lúc gồng (after > -0.35), lơ lửng trước người, xoay chậm; gợn sáng mỗi lần hấp thụ. { hien, sc, quay, op, gon (0..1 độ gợn) }. */
export function khienLuc(after, t = 0) {
  if (!(after > -0.35) || after > KIM3_T.khien) return { hien: false, sc: 0, quay: 0, op: 0, gon: 0 };
  const vao = sm((after + 0.35) / 0.3), ra = 1 - sm((after - 1.3) / 0.4);
  let gon = 0; for (let k = 0; k < 4; k++) { const a = after - (0.35 + k * 0.28); if (a > 0 && a < 0.25) gon = Math.max(gon, 1 - a / 0.25); }
  return { hien: true, sc: 0.35 + 0.65 * vao, quay: t * 1.1, op: vao * ra, gon };
}
/** Tấm khiên nhỏ quay quanh khiên chính (vòng ngược chiều nhau theo chẵn/lẻ). */
export function khienNho(i, n, after, t = 0) {
  if (!(after > -0.3) || after > KIM3_T.khien || n <= 0) return { ...OFF };
  const vao = sm((after + 0.3) / 0.35), ra = 1 - sm((after - 1.3) / 0.4), dir = i % 2 ? -1 : 1, a = (i / n) * 6.2832 + dir * t * 1.6, r = (i % 2 ? 1.55 : 1.25) * vao;
  return { hien: true, x: Math.cos(a) * r, y: Math.sin(a) * r, z: 0, kich: 0.2 * vao * ra, op: vao * ra };
}
/** Kỵ binh: kỵ sĩ i trong hàng chữ V sau đầu chiêu (z = pz − độ trễ). { hien, x, y, z, op }. */
export function kyBinh(i, n, after, pz = 0, reach = 4) {
  if (!(after > -0.02) || after > KIM3_T.kyBinh || n <= 0) return { ...OFF };
  const c = (n - 1) / 2, ox = (i - c) * 0.85, lag = Math.abs(i - c) * 0.9, a = Math.max(0, after), ra = 1 - sm((a - 0.55) / 0.5);
  const z = clamp(pz, 0, reach) - lag; if (z < -1.2) return { ...OFF };
  return { hien: true, x: ox, y: 0.55 + 0.1 * Math.abs(Math.sin(a * 22 + i * 1.3)), z, op: sm(a / 0.05) * ra };
}
/** Bụi vàng dưới móng: nhóm j bám theo kỵ sĩ j % n, bay lên chậm và tan. */
export function buiVang(j, n, after, pz = 0, reach = 4) {
  const k = kyBinh(j % Math.max(1, n), n, after, pz, reach); if (!k.hien) return { ...OFF, co: 0 };
  const a = Math.max(0, after), ph = (a * 3 + h01(j, 3)) % 1;
  return { hien: true, x: k.x + (h01(j, 4) - 0.5) * 0.4, y: 0.1 + ph * 0.9, z: k.z - 0.5 - ph * 0.6, co: 0.5 + ph * 0.9, op: k.op * 0.5 * (1 - ph), kich: 0 };
}
