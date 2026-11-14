// Luật lõi chiến đấu (Phiên 156, Bản 2 mục 3). LOGIC THUẦN (không DOM/three.js/đồng hồ: `now` là giây do người gọi đưa vào). Test: tests/luatchien.test.mjs.
import { LUAT as L, PHAN_UNG } from '../data/luatChien.js';
import { COMBAT_CFG as C } from '../data/stats.js';
import { normHe } from './elements.js';
import { skillById } from './skillCatalog.js';

const num = (x, d = 0) => (Number.isFinite(+x) ? +x : d);
const r4 = (x) => Math.round(x * 1e4) / 1e4;
const KHAC = { kim: 'moc', moc: 'tho', tho: 'thuy', thuy: 'hoa', hoa: 'kim' };

/** K_hệ theo mã thật: ×1,3 khắc / ×0,8 bị khắc / ×1. */
export function kHeOf(atk, def) { const a = normHe(atk), d = normHe(def); if (!a || !d) return C.kThuong; return KHAC[a] === d ? C.kLoi : KHAC[d] === a ? C.kBat : C.kThuong; }
/** Giảm sát thương tổng (trang bị + chiêu), kẹp 0..70%. */
export const gstTong = (...xs) => Math.min(L.gstMax, Math.max(0, xs.reduce((s, x) => s + Math.max(0, num(x)), 0)));
/**
 * Sát thương = Công × heSo × (1 + cuongHoa + tsTrangBi) × K_hệ × 100 ÷ (100 + Thủ) × (1 − GST) × (chí mạng ×1,5) × (đoán gồng +20%).
 * o: { cong, heSo, cuongHoa, ts, atk, def, thu, gst, chiMang, doanGong }. Hệ số ≤ 0 → 0; đòn trúng gây ít nhất 1.
 */
export function damage(o = {}) {
  const hs = num(o.heSo); if (!(hs > 0)) return 0;
  let d = num(o.cong) * hs * (1 + num(o.cuongHoa) + num(o.ts)) * kHeOf(o.atk, o.def) * C.thuNen / (C.thuNen + Math.max(0, num(o.thu)));
  d *= 1 - gstTong(o.gst); if (o.chiMang) d *= C.chiMang; if (o.doanGong) d *= 1 + L.doanGong;
  return Math.max(C.toiThieu, Math.round(d));
}
/** Phản ứng giữa hai Hệ (không phân biệt thứ tự); không có → null. */
export function phanUng(a, b) { const x = normHe(a), y = normHe(b); if (!x || !y || x === y) return null; return PHAN_UNG.find((p) => p.he.includes(x) && p.he.includes(y)) || null; }
/** Hồi chiêu mất khi hủy gồng: bằng di chuyển 30%; bị khống chế cắt 100%. */
export const cdMatKhiHuy = (cd, biKhongChe = false) => r4(num(cd) * (biKhongChe ? 1 : L.huyGongMatCd));
export const dangEpMau = (hpRatio) => num(hpRatio, 1) < L.epMau;
/** Giây khống chế tối đa của loại `kind` theo chế độ ('pve' | 'voDai'). */
export const gioiHan = (kind, mode = 'pve') => { const g = L.gioiHanKhongChe[kind]; return g ? g[mode === 'voDai' ? 1 : 0] : Infinity; };
/** Làm chậm cộng dồn (kể cả từ trang bị), kẹp 60%. */
export const chamTong = (...xs) => Math.min(L.chamToiDa, xs.reduce((s, x) => s + Math.max(0, num(x)), 0));

/**
 * Kháng khống chế lũy tiến (choáng, hất tung, trói, đóng băng dùng chung một bộ đếm).
 * ap(kind, giay, now, mode) → giây thực sự áp (đã kẹp trần theo chế độ). Lần 2 trong 8 s còn 60%, lần 3 còn 30%, sau đó miễn 3 s.
 * Hất tung lại trong 6 s: còn 0,5 s (rồi nhân kháng).
 */
export function createKhang() {
  let count = 0, first = -1e9, immuneTo = -1e9, lastHat = -1e9, sum = 0;   // sum: tổng giây đã khóa trong chu kỳ (trần 3 s liên tục)
  return {
    ap(kind, giay, now, mode = 'pve') {
      const t = num(now); if (t < immuneTo) return 0;
      if (t - first > L.khang.cuaSo) { count = 0; first = t; sum = 0; }
      if (count === 0) first = t;
      let g = Math.min(num(giay), gioiHan(kind, mode));
      if (kind === 'hatTung') { if (t - lastHat <= L.hatTungLai.cuaSo) g = Math.min(g, L.hatTungLai.giay); lastHat = t; }
      g = r4(Math.min(g * L.khang.he[count], Math.max(0, L.khoaToiDa - sum))); sum += g; count++;
      if (count >= L.khang.he.length) { immuneTo = t + g + L.khang.mienNhiem; count = 0; first = -1e9; sum = 0; }
      return g;
    },
  };
}
/** Tổng thời gian khóa liên tục tối đa nếu kẻ địch nối n khống chế cùng độ dài trong vòng kháng (kiểm trần 3 s). */
export function khoaLienTuc(gs) { const k = createKhang(); let t = 0, sum = 0; for (const g of gs) { const a = k.ap('choang', g, t); sum += a; t += a; } return r4(sum); }

/** Thiêu đốt: mỗi tầng cháy 3 s, mỗi giây 8% sát thương chiêu gây ra; tối đa 3 tầng; KHÔNG làm mới, chỉ cộng dồn. */
export function createThieuDot() {
  let st = [];   // { exp, dps }
  const live = (t) => { st = st.filter((s) => s.exp > t); return st; };
  return {
    them(n, dmg, now) { const t = num(now); live(t); let add = 0; for (let i = 0; i < Math.max(0, Math.floor(num(n))); i++) { if (st.length >= L.thieuDot.toiDaTang) break; st.push({ exp: t + L.thieuDot.giay, dps: r4(num(dmg) * L.thieuDot.moiGiayPct) }); add++; } return add; },
    tang(now) { return live(num(now)).length; },
    moiGiay(now) { return r4(live(num(now)).reduce((s, x) => s + x.dps, 0)); },
    dapTat() { const n = st.length; st = []; return n; },      // Thủy dập / Hơi nước
    kichNo(now) { const n = live(num(now)).length; st = []; return n; },   // Hỏa Long, Liên Hoa Hỏa Thế
  };
}

/** Combo móc nối: chiêu B nằm trong `moc` của A, dùng trong 1,5 s sau khi A trúng → B +10% sát thương, hồi chiêu B −0,5 s; tối đa 4 mắt xích, +30%.
 * steps: [{ id, t }] (t = giây lúc dùng, tăng dần). Dùng `moc` do dữ liệu chiêu khai báo qua `mocOf(id)` (mặc định đọc `skill.moc`). Trả [{ id, bonus, giamCd, moc }]. */
export function chuoiMoc(steps, mocOf = (id) => (skillById(id) || {}).moc || []) {
  const out = []; let len = 0, prev = null;
  for (const s of steps) {
    const ok = prev && num(s.t) - prev.t <= L.moc.cuaSo && mocOf(prev.id).includes(s.id) && len < L.moc.toiDaMat;
    len = ok ? len + 1 : 1; const bonus = ok ? Math.min(L.moc.tran, L.moc.congSatThuong * (len - 1)) : 0;
    out.push({ id: s.id, bonus: r4(bonus), giamCd: ok ? L.moc.giamCd : 0, moc: !!ok }); prev = s;
  }
  return out;
}
