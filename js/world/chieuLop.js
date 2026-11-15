// VFX SÁU LỚP mỗi chiêu (prompt "chiêu thức 3D chuyên nghiệp" mục 4 và mục 14 điểm 4). LOGIC THUẦN (không three.js), có test: tests/chieulop.test.mjs.
// Sáu lớp: 1 lõi sáng · 2 thân năng lượng · 3 quầng + vệt · 4 hạt (3 cỡ) · 5 tác động môi trường (decal nền + sóng chấn) · 6 tàn dư.
// Mỗi lớp có thời điểm (giây, mốc 0 = lúc PHÁT; lõi bắt đầu từ lúc gồng nên có thời gian âm) và đường cong độ sáng 0..1 riêng (khóa [giây, độ sáng], nội suy mượt).
// Màu lấy từ bảng màu (js/data/chieuMau.js → mauChieu): lõi = trắng ngà, thân = màu chủ, quầng/vệt = màu sáng, hạt = chủ/sáng/lõi, decal = nền/chủ, màu bổ sung chỉ vài hạt.
// Bản giảm (prompt mục 12): máy yếu bỏ quầng sáng + vệt + decal + sóng chấn, nửa số hạt, nửa tàn dư; lớp lõi/thân/hạt/tàn dư vẫn còn → vẫn đọc được chiêu. Số TẠM, chờ nhìn bằng mắt.
import { mauChieu, hexSo } from '../data/chieuMau.js';
import { COMBAT_SKILLS } from '../data/combatSkills.js';
import { lapKeHoach, TIER } from './chieuFxPlan.js';

export const LOP = Object.freeze(['loi', 'than', 'quang', 'hat', 'moiTruong', 'tanDu']);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const sm = (k) => { const t = clamp(k, 0, 1); return t * t * (3 - 2 * t); };

/** Nội suy mượt theo các khóa [giây, độ sáng] (sắp tăng dần). Ngoài khoảng = độ sáng khóa đầu/cuối. */
export function cuong(keys, s) {
  if (!keys || !keys.length) return 0;
  if (s <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (s <= keys[i][0]) { const [t0, v0] = keys[i - 1], [t1, v1] = keys[i]; return v0 + (v1 - v0) * sm((s - t0) / (t1 - t0)); }
  }
  return keys[keys.length - 1][1];
}

/** Chia số hạt thành 3 cỡ cùng lúc: lớn chậm (khói, bụi, lá) · vừa (tia lửa, mảnh) · nhỏ nhanh (lấp lánh). Tổng đúng bằng n; n ≥ 3 thì mỗi cỡ ≥ 1. */
export function chiaHat(n) {
  const N = Math.max(0, Math.floor(+n) || 0); if (N < 3) return { lon: N > 0 ? 1 : 0, vua: N > 1 ? 1 : 0, nho: 0 };
  const lon = Math.max(1, Math.round(N * 0.2)), vua = Math.max(1, Math.round(N * 0.4));
  return { lon, vua, nho: N - lon - vua };
}
/** Cỡ (nhân với cỡ hạt gốc) và tốc độ tương đối của 3 loại hạt. */
export const CO_HAT = Object.freeze({ lon: { co: 2.4, toc: 0.4 }, vua: { co: 1, toc: 1 }, nho: { co: 0.5, toc: 1.6 } });

/** Biên độ "thở" của vật phát sáng (3–8% độ sáng) theo vai chiêu. */
export const THO = Object.freeze({ thuong: 0.03, chieu4: 0.05, tuyet: 0.08, hz: 6 });
/** Kiểu decal nền theo Hệ + loại hạt tàn dư (khóa của FX_LOAI). */
export const KIEU_DECAL = Object.freeze({ kim: 'vetCat', moc: 'dayLeo', thuy: 'bang', tho: 'nut', hoa: 'chay' });
export const LOAI_TAN_DU = Object.freeze({ kim: 'kim', moc: 'suong', thuy: 'suong', tho: 'da', hoa: 'da' });   // hỏa: tro; mộc/thủy: sương bào tử/sương lạnh

const slotOf = (id) => COMBAT_SKILLS.find((s) => s.id === id)?.slot;
export const vaiLop = (id) => { const s = slotOf(id); return s === 'tuyet' ? 'tuyet' : s === 4 ? 'chieu4' : 'thuong'; };

/**
 * Kế hoạch sáu lớp của chiêu `id` ở bậc máy `tier` (cao | vua | yeu). Chiêu lạ → null.
 * Trả { id, he, tier, vai, mau: {nen,chu,sang,loi,buSung} (số 0xRRGGBB), tiLeBuSung, lop: { loi, than, quang, hat, moiTruong, tanDu },
 *       hat: {lon,vua,nho}, ke (kế hoạch gốc từ chieuFxPlan) }.
 * Mỗi lớp: { bat (bật ở bậc máy này), t0, t1, keys, mau, ... }.
 */
export function lapLop(id, tier = 'vua') {
  const ke = lapKeHoach(id, tier), mc = mauChieu(id); if (!ke || !mc) return null;
  const t = ke.tier, vai = vaiLop(id), yeu = t === 'yeu', cao = t === 'cao', g = Math.max(0.1, ke.gong || 0.3);
  const mau = { nen: hexSo(mc.nen), chu: hexSo(mc.chu), sang: hexSo(mc.sang), loi: hexSo(mc.loi), buSung: hexSo(mc.buSung) };
  const sang = ke.sang, cuongRung = clamp(ke.rung || 0, 0, 1);
  const hetHieuLuc = 0.9;                                    // trùng LIFE của scene/chieuFx.js
  const decalGiay = Math.round((3 + 2 * cuongRung) * 10) / 10;   // 3–5 s theo độ mạnh
  const tanGiay = Math.round((1 + clamp(sang, 0, 1)) * 10) / 10; // 1–2 s
  const tanN = yeu ? Math.round(ke.n * 0.1) : Math.round(ke.n * 0.2);
  const lop = {
    loi: { bat: true, t0: -g, t1: 0.7, keys: [[-g, 0], [0, 0.35], [0.06, 1], [0.35, 0.5], [0.7, 0]], mau: mau.loi, tho: THO[vai], thoHz: THO.hz, co: vai === 'tuyet' ? 0.5 : vai === 'chieu4' ? 0.35 : 0.25 },
    than: { bat: true, t0: 0, t1: hetHieuLuc, keys: [[0, 0], [0.08, 1], [0.5, 0.7], [hetHieuLuc, 0]], mau: mau.chu, mode: ke.mode, matNhieu: true },
    quang: { bat: !yeu && sang > 0, t0: 0, t1: 0.5, keys: [[0, 0], [0.04, 1], [0.5, 0]], mau: mau.sang, cong: true, cuong: sang, vet: ke.vet, phuRong: true },
    hat: { bat: ke.n > 0, t0: 0, t1: hetHieuLuc, keys: [[0, 0], [0.05, 1], [0.6, 0.7], [hetHieuLuc, 0]], mau: [mau.chu, mau.sang, mau.loi], buSung: mau.buSung, tiLeBuSung: mc.tiLeBuSung, loai: ke.loai, coGoc: 1 },
    moiTruong: { bat: !yeu, t0: 0.05, t1: decalGiay, keys: [[0.05, 0], [0.12, 1], [decalGiay * 0.4, 0.7], [decalGiay, 0]], mau: mau.nen, vienMau: mau.chu, kieu: KIEU_DECAL[ke.he], songChan: cao && cuongRung >= 0.4, phuRong: true },
    tanDu: { bat: tanN > 0, t0: hetHieuLuc, t1: hetHieuLuc + tanGiay, keys: [[hetHieuLuc, 0], [hetHieuLuc + 0.15, 1], [hetHieuLuc + 1.0, 0.5], [hetHieuLuc + tanGiay, 0]], mau: mau.chu, loai: LOAI_TAN_DU[ke.he], n: tanN, phuRong: true },
  };
  return { id, he: ke.he, tier: t, vai, mau, tiLeBuSung: mc.tiLeBuSung, lop, hat: chiaHat(ke.n), ke };
}

/** Độ sáng 0..1 của lớp `ten` tại giây `s` (mốc 0 = lúc phát). Lõi có thêm "thở" ±3–8%. Lớp tắt / lạ → 0. */
export function doSangLop(plan, ten, s) {
  const L = plan && plan.lop && plan.lop[ten]; if (!L || !L.bat) return 0;
  const v = cuong(L.keys, s);
  if (ten === 'loi' && v > 0 && s >= 0) return clamp(v * (1 + L.tho * Math.sin(2 * Math.PI * L.thoHz * s)), 0, 1);
  return v;
}
/** Số lớp "trong suốt phủ rộng" đang hiện tại giây `s` (prompt mục 12: không quá 2 lớp chồng lên cùng vùng). */
export function lopPhuRong(plan, s) { return LOP.filter((k) => plan.lop[k].bat && plan.lop[k].phuRong && s > plan.lop[k].t0 && s < plan.lop[k].t1 && cuong(plan.lop[k].keys, s) > 0.01).length; }

export { TIER };
