// Tra cứu và tính sát thương Hỏa v2 (Phiên 157). LOGIC THUẦN, có test: tests/chieuhoa.test.mjs. Dữ liệu: js/data/chieuHoa.js; số gốc: js/data/combatSkills.js.
import { HOA_V2 } from '../data/chieuHoa.js';
import { skillById } from './skillCatalog.js';

/** Thẻ bổ sung của chiêu Hỏa `id`; chiêu khác Hệ → null. */
export const chieuHoa = (id) => (HOA_V2[id] ? HOA_V2[id] : null);
/** Thời gian báo trước (giây) = gồng + thời gian đạn bay tới mục tiêu nếu có (tam/tocDo). */
export const baoTruoc = (id) => { const c = chieuHoa(id); return c ? Math.round((c.gong + (c.tam && c.tocDo ? c.tam / c.tocDo : 0)) * 100) / 100 : 0; };

/**
 * Hỏa Long Xuất Hải (hoa_3) trúng mục tiêu đang có `tang` tầng Thiêu đốt: { heSo (đã cộng +0,4/tầng nếu đủ 2 tầng), hatTung (giây), tieuTang }.
 * heSoGoc lấy từ combatSkills (4,5). Dưới 2 tầng: không tiêu tầng, hất 1,0 s.
 */
export function hoa3Trung(tang) {
  const sk = skillById('hoa_3'), c = HOA_V2.hoa_3, n = Math.max(0, Math.floor(+tang || 0));
  if (n >= c.hatTung.tangToiThieu) return { heSo: Math.round((sk.heSo + c.tieuTang.congHeSoMoiTang * n) * 1e4) / 1e4, hatTung: c.hatTung.giayTuNhieuTang, tieuTang: n };
  return { heSo: sk.heSo, hatTung: c.hatTung.giay, tieuTang: 0 };
}
/**
 * Long Tức Trảm (hoa_hoalong_4): mục tiêu đang bị hất tung → dạng trên không (nạp 0,8 s, 4 nhát 0,9 + nhát cuối 1,4 = 5,0); không → dạng thường (nạp 2 s, 5,0).
 * Trả { dang, nap, heSo, nhat: [hệ số từng nhát] }. `matNhat` (số nhát đã trúng) < tổng: bị khống chế cắt → chỉ tính các nhát đã trúng.
 */
export function longTuc(dangHatTung, soNhatDaTrung = Infinity) {
  const sk = skillById('hoa_hoalong_4'), c = HOA_V2.hoa_hoalong_4;
  if (!dangHatTung) return { dang: 'thuong', nap: c.dangThuong.nap, heSo: sk.heSo, nhat: [sk.heSo] };
  const all = [...c.dangTrenKhong.nhat, c.dangTrenKhong.nhatCuoi.heSo], nhat = all.slice(0, Math.max(0, Math.min(all.length, Math.floor(soNhatDaTrung))));
  return { dang: 'trenKhong', nap: c.dangTrenKhong.nap, heSo: Math.round(nhat.reduce((s, x) => s + x, 0) * 1e4) / 1e4, nhat };
}
/**
 * Liên Hoa Hỏa Thế (hoa_tuyet): kích nổ mọi tầng (+0,6 mỗi tầng), mục tiêu dưới 30% Sinh Lực +30% (ép máu). Trả hệ số CỘNG THÊM theo tầng và hệ số nhân ép máu.
 */
export function phanThienKichNo(tang, hpRatio = 1) {
  const c = HOA_V2.hoa_tuyet, n = Math.max(0, Math.floor(+tang || 0));
  return { congHeSo: Math.round(c.kichNo.congHeSoMoiTang * n * 1e4) / 1e4, nhanEpMau: (+hpRatio || 0) < c.epMau.duoi && hpRatio !== undefined && +hpRatio >= 0 ? 1 + c.epMau.cong : 1 };
}
/** Mưa lửa Bạo Liệt Hỏa Vũ: tổng hệ số = hePerSec × giây (2,4); số tầng Thiêu đốt gieo sau `giay` giây (mỗi giây +1, tối đa 3). */
export function muaLua(giay = 4) {
  const c = HOA_V2.hoa_liethoa_4, g = Math.max(0, Math.min(c.mua.giay, +giay || 0));
  return { heSo: Math.round(c.mua.hePerSec * g * 1e4) / 1e4, tang: Math.min(3, Math.floor(g) * c.thieuDotMoiGiay) };
}
