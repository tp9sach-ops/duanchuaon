// Logic Ngũ Hành (G2.1, GDD v2 mục 5.4). LOGIC THUẦN (không DOM, không three.js), có test: tests/elements.test.mjs.
//   Tương khắc → quan hệ 'loi' / 'bat' / 'thuong' (đưa thẳng vào damageOf của js/world/combat.js, K_hệ 1,3 / 0,8 / 1).
//   Tương sinh → +5%/đồng đội (tối đa +10%) khi đồng đội thuộc Hệ sinh ra Hệ của mình, đứng trong 10 m.
//   Ngũ Hành Hội Tụ → nhóm đủ 5 Hệ: +10% mọi chỉ số.
// Số liệu và bảng khắc/sinh: js/data/elements.js (TẠM).
import { HE_LIST, HE_NAME, HE_KHAC, HE_SINH, ELEMENT_CFG as C } from '../data/elements.js';
import { kHe } from './combat.js';

const num = (x, d = 0) => (Number.isFinite(+x) ? +x : d);
const find = (map, val) => HE_LIST.find((k) => map[k] === val) || null;

/** Chuẩn hóa mã Hệ ('kim'|'moc'|'thuy'|'hoa'|'tho', không phân biệt hoa thường); lạ → null. */
export const normHe = (he) => { const s = typeof he === 'string' ? he.trim().toLowerCase() : ''; return HE_LIST.includes(s) ? s : null; };
/** Tên hiển thị của Hệ ('Kim', 'Mộc'...); lạ → ''. */
export const heName = (he) => HE_NAME[normHe(he)] || '';
/** Hệ mà `he` KHẮC (Kim → Mộc). Lạ → null. */
export const heKhac = (he) => HE_KHAC[normHe(he)] || null;
/** Hệ KHẮC `he` (Mộc bị Kim khắc → 'kim'). Lạ → null. */
export const heBiKhac = (he) => { const h = normHe(he); return h ? find(HE_KHAC, h) : null; };
/** Hệ mà `he` SINH RA (Kim → Thủy). Lạ → null. */
export const heSinh = (he) => HE_SINH[normHe(he)] || null;
/** Hệ SINH RA `he` (Thủy được Kim sinh → 'kim'). Lạ → null. */
export const heSinhRa = (he) => { const h = normHe(he); return h ? find(HE_SINH, h) : null; };

/**
 * Quan hệ của người đánh `atk` với mục tiêu `def`: 'loi' (mình khắc mục tiêu), 'bat' (mục tiêu khắc mình), 'thuong' (còn lại).
 * Hệ giống nhau hoặc một bên lạ/chưa chọn Hệ → 'thuong'.
 */
export function relation(atk, def) {
  const a = normHe(atk), d = normHe(def);
  if (!a || !d) return 'thuong';
  if (HE_KHAC[a] === d) return 'loi';
  if (HE_KHAC[d] === a) return 'bat';
  return 'thuong';
}
/** K_hệ (1,3 / 1 / 0,8) khi `atk` đánh `def`; dùng chung số của combat.js. */
export const kHeOf = (atk, def) => kHe(relation(atk, def));

/**
 * Cộng sát thương từ tương sinh. in: { he (Hệ của mình), allies: [{ he, dist (m) }] }.
 * Mỗi đồng đội thuộc Hệ SINH RA Hệ của mình và đứng ≤ 10 m cho +5%; tối đa +10%. Trả số thập phân (0,05 = +5%).
 * Phần tử lạ, khoảng cách thiếu/âm/lạ (không đo được) → không tính. Không có Hệ → 0.
 */
export function sinhBonus(o) {
  const { he, allies } = o && typeof o === 'object' ? o : {};
  const gen = heSinhRa(he);
  if (!gen || !Array.isArray(allies)) return 0;
  let n = 0;
  for (const a of allies) {
    if (!a || typeof a !== 'object' || normHe(a.he) !== gen) continue;
    const d = num(a.dist, NaN);
    if (d >= 0 && d <= C.sinhRange) n++;
  }
  return Math.min(C.sinhMax, Math.round(n * C.sinhPerAlly * 1e6) / 1e6);
}
/** Nhóm có đủ cả 5 Hệ không? `hes` = mã Hệ của các thành viên (kể cả mình). */
export const isHoiTu = (hes) => Array.isArray(hes) && HE_LIST.every((h) => hes.some((x) => normHe(x) === h));
/** Cộng "Ngũ Hành Hội Tụ": +10% mọi chỉ số nếu nhóm đủ 5 Hệ, ngược lại 0. */
export const hoiTuBonus = (hes) => (isHoiTu(hes) ? C.hoiTu : 0);
