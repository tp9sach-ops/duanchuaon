// Công thức sát thương mới (G1.3, GDD v2 mục 6.4). LOGIC THUẦN (không DOM, không three.js), có test: tests/combat.test.mjs.
//   Sát thương = Công × Hệ số skill × (1 + Cường hóa) × K_hệ × (chí mạng ×1,5) × 100 ÷ (100 + Thủ đối thủ), làm tròn, tối thiểu 1.
// CHỈ dùng cho kỹ năng mới. KHÔNG thay `stoneDamage`, `spearDamage` (js/world/yeuquai.js), `khiDamage` (conKhi.js), `dashDamage` (thietDau.js): các hàm đó giữ nguyên, test chứng minh.
// Số liệu: js/data/stats.js (COMBAT_CFG, TẠM). Bảng khắc/sinh đủ 5 Hệ làm ở G2.1 (js/world/elements.js); ở đây chỉ nhận quan hệ đã tính sẵn.
import { COMBAT_CFG as C } from '../data/stats.js';
import { congOf } from './stats.js';

const num = (x, d = 0) => (Number.isFinite(+x) ? +x : d);
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

/** Hệ số theo quan hệ Hệ: 'loi' (đánh Hệ bị mình khắc) = 1,3; 'thuong' = 1; 'bat' (đánh Hệ khắc mình) = 0,8. Quan hệ lạ → 1. */
export const kHe = (rel) => (rel === 'loi' ? C.kLoi : rel === 'bat' ? C.kBat : C.kThuong);
/** Hệ số giảm theo Thủ: 100 ÷ (100 + Thủ). Thủ âm hoặc lạ coi như 0. */
export const thuFactor = (thu) => C.thuNen / (C.thuNen + clamp(num(thu), 0, 1e6));
/** Phần trăm sát thương bị Thủ giảm (0..100), làm tròn 1 chữ số thập phân. */
export const thuReducePct = (thu) => Math.round((1 - thuFactor(thu)) * 1000) / 10;

/**
 * Sát thương một đòn. in: { cong, heSo = 1, cuongHoa = 0 (0,1 = +10%), rel = 'thuong' | kHe (số), crit = false, thu = 0 }.
 * Hệ số skill ≤ 0 hoặc Công ≤ 0 → 0. Ngược lại số nguyên ≥ 1. Đầu vào lạ được kẹp (không bao giờ NaN).
 */
export function damageOf(o) {
  const { cong = 0, heSo = 1, cuongHoa = 0, rel = 'thuong', crit = false, thu = 0 } = o && typeof o === 'object' ? o : {};
  const c = clamp(num(cong), 0, 1e7), h = clamp(num(heSo, 1), 0, 100);
  if (!(c > 0) || !(h > 0)) return 0;
  const k = typeof rel === 'number' ? clamp(num(rel, 1), 0, 10) : kHe(rel);
  const raw = c * h * (1 + clamp(num(cuongHoa), 0, 100)) * k * (crit ? C.chiMang : 1) * thuFactor(thu);
  return Math.max(C.toiThieu, Math.round(raw));
}
/** Như damageOf nhưng lấy Công theo Tu Vi người đánh: damageByTuVi(30, { heSo: 1.8, thu: 63 }). */
export const damageByTuVi = (tuvi, o = {}) => damageOf({ ...(o && typeof o === 'object' ? o : {}), cong: congOf(tuvi) });
/** Tung chí mạng: rng() < rate (rate kẹp 0..1; rng lạ → không chí mạng). */
export const critRoll = (rate, rng = Math.random) => { const r = clamp(num(rate), 0, 1); return typeof rng === 'function' && rng() < r; };
